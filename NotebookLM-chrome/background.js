import {
  RULES_KEY,
  LEGACY_RULE_KEY,
  RUNTIME_KEY,
  ALARM_NAME,
  DEFAULT_RULE,
  DEFAULT_RUNTIME,
  RESULT_LABELS,
  normalizeRule,
  normalizeRuntime,
  normalizeNotebookUrl,
  compareNotebookUrls,
  appendRunLog
} from "./settings.js";

const LOG_PREFIX = "[NotebookLM Refresh]";
const NOTEBOOK_URL_PATTERN = "https://notebooklm.google.com/*";
const NOTIFICATION_ICON = "icons/icon128.png";

let storageChain = Promise.resolve();
let executionChain = Promise.resolve();

function nowIso() {
  return new Date().toISOString();
}

function minutesSince(isoString) {
  if (!isoString) return Number.POSITIVE_INFINITY;
  const ts = Date.parse(isoString);
  if (!Number.isFinite(ts)) return Number.POSITIVE_INFINITY;
  return (Date.now() - ts) / 60000;
}

function toAlarmDelayMinutes(intervalMinutes) {
  if (intervalMinutes <= 15) return intervalMinutes;
  if (intervalMinutes <= 60) return 5;
  return 15;
}

async function readState() {
  const data = await chrome.storage.local.get([RULES_KEY, LEGACY_RULE_KEY, RUNTIME_KEY]);
  const ruleSource = data[RULES_KEY] || data[LEGACY_RULE_KEY] || DEFAULT_RULE;
  return {
    rule: normalizeRule(ruleSource),
    runtime: normalizeRuntime(data[RUNTIME_KEY] || DEFAULT_RUNTIME)
  };
}

async function writeState(state) {
  const normalized = {
    rule: normalizeRule(state.rule || DEFAULT_RULE),
    runtime: normalizeRuntime(state.runtime || DEFAULT_RUNTIME)
  };
  await chrome.storage.local.set({
    [RULES_KEY]: normalized.rule,
    [RUNTIME_KEY]: normalized.runtime
  });
  return normalized;
}

function mutateState(mutator) {
  const task = storageChain.then(async () => {
    const current = await readState();
    const draft = {
      rule: structuredClone(current.rule),
      runtime: structuredClone(current.runtime)
    };
    const next = await mutator(draft);
    return writeState(next || draft);
  });
  storageChain = task.then(() => undefined, () => undefined);
  return task;
}

async function ensureInitialized() {
  const state = await readState();
  return writeState(state);
}

async function syncAlarm(rule = null) {
  const effectiveRule = normalizeRule(rule || (await readState()).rule);
  await chrome.alarms.clear(ALARM_NAME);
  if (!effectiveRule.enabled) return null;
  const tickMinutes = toAlarmDelayMinutes(effectiveRule.intervalMinutes);
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: tickMinutes,
    periodInMinutes: tickMinutes
  });
  return chrome.alarms.get(ALARM_NAME);
}

async function buildStateSnapshot() {
  const state = await readState();
  const alarm = await chrome.alarms.get(ALARM_NAME);
  return {
    rule: state.rule,
    runtime: state.runtime,
    alarm: alarm
      ? {
        scheduledTime: alarm.scheduledTime || 0,
        periodInMinutes: alarm.periodInMinutes || state.rule.intervalMinutes
      }
      : null
  };
}

function buildErrorKey(result, message, targetUrl) {
  return `${targetUrl}|${result}|${String(message || "").trim()}`.slice(0, 360);
}

async function notifyFailure(errorKey, result, message) {
  if (!errorKey) return;
  try {
    await chrome.notifications.create("", {
      type: "basic",
      iconUrl: chrome.runtime.getURL(NOTIFICATION_ICON),
      title: `NotebookLM 刷新失败：${RESULT_LABELS[result] || result}`,
      message: String(message || "请打开扩展查看详情。").slice(0, 240),
      priority: 1
    });
  } catch (error) {
    console.warn(`${LOG_PREFIX} failed to create notification`, error);
  }
}

async function findExactNotebookTab(targetUrl) {
  const tabs = await chrome.tabs.query({ url: [NOTEBOOK_URL_PATTERN] });
  return tabs.find((tab) => compareNotebookUrls(tab.url, targetUrl)) || null;
}

async function getDedicatedNotebookTab(targetUrl, runtime) {
  const tabMap = runtime.dedicatedTabs || {};
  const normalizedUrl = normalizeNotebookUrl(targetUrl, "");
  const storedTabId = tabMap[normalizedUrl];

  if (Number.isInteger(storedTabId)) {
    const storedTab = await chrome.tabs.get(storedTabId).catch(() => null);
    if (storedTab && compareNotebookUrls(storedTab.url, normalizedUrl)) {
      return storedTab;
    }
  }

  const existingTargetTab = await findExactNotebookTab(normalizedUrl);
  if (existingTargetTab) {
    runtime.dedicatedTabs[normalizedUrl] = existingTargetTab.id;
    return existingTargetTab;
  }

  const createdTab = await chrome.tabs.create({ url: normalizedUrl, active: false });
  runtime.dedicatedTabs[normalizedUrl] = createdTab.id;
  return createdTab;
}

async function waitForTabComplete(tabId, timeoutMs = 20000) {
  const initialTab = await chrome.tabs.get(tabId).catch(() => null);
  if (initialTab?.status === "complete") return initialTab;

  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(handleUpdated);
      chrome.tabs.onRemoved.removeListener(handleRemoved);
    };
    const finish = (cb) => {
      cleanup();
      cb();
    };
    const handleUpdated = (updatedTabId, changeInfo, tab) => {
      if (updatedTabId !== tabId) return;
      if (changeInfo.status === "complete") finish(() => resolve(tab));
    };
    const handleRemoved = (removedTabId) => {
      if (removedTabId !== tabId) return;
      finish(() => reject(new Error("dedicated_tab_closed")));
    };
    const timer = setTimeout(() => finish(() => reject(new Error("tab_load_timeout"))), timeoutMs);

    chrome.tabs.onUpdated.addListener(handleUpdated);
    chrome.tabs.onRemoved.addListener(handleRemoved);
    chrome.tabs.get(tabId).then((tab) => {
      if (!settled && tab?.status === "complete") finish(() => resolve(tab));
    }).catch(() => undefined);
  });
}

async function loadNotebookIntoDedicatedTab(tabId, targetUrl) {
  const currentTab = await chrome.tabs.get(tabId).catch(() => null);
  if (!currentTab) throw new Error("dedicated_tab_missing");

  if (compareNotebookUrls(currentTab.url, targetUrl)) {
    await chrome.tabs.reload(tabId);
  } else {
    await chrome.tabs.update(tabId, { url: targetUrl, active: false });
  }
  return waitForTabComplete(tabId);
}

function classifyTabUrl(tabUrl) {
  if (!tabUrl) {
    return { result: "page_error", message: "NotebookLM 标签页没有可用地址。" };
  }
  try {
    const parsed = new URL(tabUrl);
    if (parsed.hostname === "notebooklm.google.com") return null;
    if (parsed.hostname.endsWith("google.com")) {
      return { result: "login_required", message: "NotebookLM 标签页跳转到了登录或账号选择页面，请先完成登录。" };
    }
    return { result: "page_error", message: `NotebookLM 标签页跳转到了意外地址：${parsed.hostname}` };
  } catch (_) {
    return { result: "page_error", message: "NotebookLM 标签页地址无法解析。" };
  }
}

function notebookDomAutomation(payload) {
  const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  const sourceNeedle = normalizeText(payload?.sourceLabel);
  const refreshNeedle = normalizeText(payload?.refreshLabel);

  const ACCESS_TOKENS = [
    "sign in", "choose an account", "request access", "you need access", "you need permission", "login",
    "登录", "选择账号", "申请访问权限", "无权访问", "找不到此笔记本"
  ].map((item) => normalizeText(item));

  function isVisible(element) {
    if (!(element instanceof Element)) return false;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none" && style.pointerEvents !== "none";
  }

  function bodyText() {
    return normalizeText(document.body?.innerText || "");
  }

  function detectAccessIssue() {
    if (location.hostname !== "notebooklm.google.com") {
      return { ok: false, result: "login_required", stage: "precheck", message: "当前页面不是 NotebookLM，通常表示还未完成 Google 登录。" };
    }
    const pageText = bodyText();
    if (ACCESS_TOKENS.some((token) => token && pageText.includes(token))) {
      return { ok: false, result: "login_required", stage: "precheck", message: "页面显示需要登录、选择账号或申请访问权限。" };
    }
    return null;
  }

  function findClickableAncestor(node) {
    let current = node instanceof Element ? node : node?.parentElement || null;
    while (current && current !== document.body) {
      const tag = current.tagName?.toLowerCase();
      const role = current.getAttribute?.("role");
      const ariaDisabled = current.getAttribute?.("aria-disabled");
      const hasTabIndex = current.hasAttribute?.("tabindex");
      const isClickable = tag === "button" || tag === "a" || role === "button" || typeof current.onclick === "function" || hasTabIndex;
      if (isClickable && ariaDisabled !== "true" && isVisible(current)) return current;
      current = current.parentElement;
    }
    return null;
  }

  function scoreMatch(candidate, needle) {
    if (!candidate || !needle) return 0;
    if (candidate === needle) return 5;
    if (candidate.includes(needle)) return 3;
    return 0;
  }

  function makeCandidate(element, strategy, matchedText, baseScore) {
    const clickable = findClickableAncestor(element) || (isVisible(element) ? element : null);
    if (!clickable) return null;
    const rect = clickable.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    const leftPaneBonus = centerX < (window.innerWidth * 0.45) ? 0.75 : 0;
    return {
      element: clickable,
      strategy,
      matchedText: matchedText.slice(0, 140),
      tagName: clickable.tagName?.toLowerCase() || "",
      score: baseScore + leftPaneBonus
    };
  }

  function dedupeCandidates(candidates) {
    const bestByElement = new Map();
    for (const candidate of candidates) {
      if (!candidate?.element) continue;
      const existing = bestByElement.get(candidate.element);
      if (!existing || candidate.score > existing.score) bestByElement.set(candidate.element, candidate);
    }
    return [...bestByElement.values()].sort((left, right) => right.score - left.score);
  }

  function findBestCandidate(needle) {
    const rawCandidates = [];
    const selector = ["button", "[role='button']", "[aria-label]", "a", "div", "span", "p"].join(", ");
    for (const element of document.querySelectorAll(selector)) {
      if (!isVisible(element)) continue;
      const ariaLabel = normalizeText(element.getAttribute?.("aria-label"));
      const ariaScore = scoreMatch(ariaLabel, needle);
      if (ariaScore > 0) {
        const c = makeCandidate(element, ariaScore >= 5 ? "aria-exact" : "aria-contains", ariaLabel, ariaScore + 2);
        if (c) rawCandidates.push(c);
      }
      const title = normalizeText(element.getAttribute?.("title"));
      const titleScore = scoreMatch(title, needle);
      if (titleScore > 0) {
        const c = makeCandidate(element, titleScore >= 5 ? "title-exact" : "title-contains", title, titleScore + 1);
        if (c) rawCandidates.push(c);
      }
      const text = normalizeText(element.textContent);
      const textScore = scoreMatch(text, needle);
      if (textScore > 0) {
        const c = makeCandidate(element, textScore >= 5 ? "text-exact" : "text-contains", text, textScore);
        if (c) rawCandidates.push(c);
      }
    }
    return dedupeCandidates(rawCandidates)[0] || null;
  }

  function hasRefreshHint(element) {
    if (!(element instanceof Element)) return false;
    const classText = normalizeText(element.className);
    const ariaLabel = normalizeText(element.getAttribute?.("aria-label"));
    const title = normalizeText(element.getAttribute?.("title"));
    const datasetText = normalizeText(JSON.stringify(element.dataset || {}));
    const combined = `${classText} ${ariaLabel} ${title} ${datasetText}`;
    return combined.includes("refresh") || combined.includes("source-refresh") || combined.includes("cloud") || combined.includes("drive") || combined.includes("同步");
  }

  function findRefreshActionCandidate(needle) {
    const rawCandidates = [];
    const textNodes = document.querySelectorAll("span,div,p,button,[role='button']");
    for (const node of textNodes) {
      if (!isVisible(node)) continue;
      const nodeText = normalizeText(node.textContent);
      if (!scoreMatch(nodeText, needle)) continue;

      let current = node;
      for (let depth = 0; depth < 8 && current && current !== document.body; depth += 1) {
        if (hasRefreshHint(current) && isVisible(current)) {
          const c = makeCandidate(current, "refresh-hint", nodeText, 9 - depth);
          if (c) rawCandidates.push(c);
        }
        current = current.parentElement;
      }
      const fallback = makeCandidate(node, "refresh-text", nodeText, 6);
      if (fallback) rawCandidates.push(fallback);
    }
    return dedupeCandidates(rawCandidates)[0] || null;
  }

  function clickElement(candidate) {
    const element = candidate?.element;
    if (!(element instanceof Element)) return false;
    element.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
    if (typeof element.focus === "function") element.focus({ preventScroll: true });
    element.click();
    return true;
  }

  async function waitForCandidate(needle, timeoutMs, missResult, stage) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const accessIssue = detectAccessIssue();
      if (accessIssue) return accessIssue;
      const candidate = stage === "locate_refresh" ? findRefreshActionCandidate(needle) : findBestCandidate(needle);
      if (candidate) return { ok: true, candidate };
      await delay(300);
    }
    return {
      ok: false,
      result: missResult,
      stage,
      message: stage === "locate_source"
        ? `未在 15 秒内找到来源：${payload?.sourceLabel || ""}`
        : `未在 5 秒内找到刷新入口：${payload?.refreshLabel || ""}`
    };
  }

  return (async () => {
    if (!document.body) return { ok: false, result: "page_error", stage: "precheck", message: "页面主体尚未可用。" };
    const initialIssue = detectAccessIssue();
    if (initialIssue) return initialIssue;

    const sourceMatch = await waitForCandidate(sourceNeedle, 15000, "source_not_found", "locate_source");
    if (!sourceMatch.ok) return sourceMatch;
    clickElement(sourceMatch.candidate);
    await delay(400);

    const refreshMatch = await waitForCandidate(refreshNeedle, 5000, "refresh_not_found", "locate_refresh");
    if (!refreshMatch.ok) return refreshMatch;
    clickElement(refreshMatch.candidate);

    return {
      ok: true,
      result: "success",
      stage: "done",
      message: "已点击刷新入口。",
      sourceMatch: {
        strategy: sourceMatch.candidate.strategy,
        text: sourceMatch.candidate.matchedText,
        tagName: sourceMatch.candidate.tagName
      },
      refreshMatch: {
        strategy: refreshMatch.candidate.strategy,
        text: refreshMatch.candidate.matchedText,
        tagName: refreshMatch.candidate.tagName
      }
    };
  })();
}

async function runDomAutomation(tabId, rule) {
  const injected = await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    func: notebookDomAutomation,
    args: [{ sourceLabel: rule.sourceLabel, refreshLabel: rule.refreshLabel }]
  });
  return injected?.[0]?.result || { ok: false, result: "page_error", stage: "inject", message: "页面脚本没有返回结果。" };
}

function shouldRunUrl(rule, runtime, targetUrl, mode) {
  if (mode === "manual") return true;
  if (!rule.enabled) return false;
  const lastRunAt = runtime.lastRunAtByUrl?.[targetUrl] || "";
  return minutesSince(lastRunAt) >= rule.intervalMinutes;
}

function sortedUrls(rule) {
  return [...rule.notebookUrls];
}

async function runForUrl(rule, runtime, targetUrl) {
  const normalizedUrl = normalizeNotebookUrl(targetUrl, "");
  if (!normalizedUrl) {
    return { ok: false, result: "page_error", message: "规则中的 Notebook URL 无效。", targetUrl };
  }

  const dedicatedTab = await getDedicatedNotebookTab(normalizedUrl, runtime);
  runtime.dedicatedTabs[normalizedUrl] = dedicatedTab.id;

  const loadedTab = await loadNotebookIntoDedicatedTab(dedicatedTab.id, normalizedUrl);
  const tabIssue = classifyTabUrl(loadedTab.url);
  if (tabIssue) return { ok: false, targetUrl: normalizedUrl, ...tabIssue };

  const automationResult = await runDomAutomation(dedicatedTab.id, rule);
  if (!automationResult?.ok) {
    return {
      ok: false,
      targetUrl: normalizedUrl,
      result: automationResult?.result || "page_error",
      message: automationResult?.message || "NotebookLM 页面动作执行失败。"
    };
  }

  return {
    ok: true,
    targetUrl: normalizedUrl,
    result: "success",
    message: automationResult.message || "已点击刷新入口。"
  };
}

async function performRun(mode = "manual") {
  const state = await readState();
  const rule = state.rule;
  const runtime = structuredClone(state.runtime);

  if (mode !== "manual" && !rule.enabled) return buildStateSnapshot();
  if (mode === "scheduled" && minutesSince(runtime.lastRunAt) < 1) return buildStateSnapshot();

  const candidateUrls = sortedUrls(rule).filter((url) => shouldRunUrl(rule, runtime, url, mode));
  if (!candidateUrls.length) return buildStateSnapshot();

  runtime.lastRunAt = nowIso();
  runtime.lastResult = "running";
  runtime.lastErrorMessage = "";

  const failures = [];
  for (const targetUrl of candidateUrls) {
    try {
      const result = await runForUrl(rule, runtime, targetUrl);
      runtime.lastRunAtByUrl[targetUrl] = nowIso();
      runtime = appendRunLog(runtime, {
        at: nowIso(),
        mode,
        result: result.result,
        message: `${targetUrl} | ${result.message}`
      });
      if (!result.ok) failures.push(result);
    } catch (error) {
      failures.push({
        ok: false,
        targetUrl,
        result: "page_error",
        message: error?.message || "NotebookLM 刷新执行失败。"
      });
      runtime.lastRunAtByUrl[targetUrl] = nowIso();
      runtime = appendRunLog(runtime, {
        at: nowIso(),
        mode,
        result: "page_error",
        message: `${targetUrl} | ${error?.message || "NotebookLM 刷新执行失败。"}`
      });
    }
  }

  if (!failures.length) {
    runtime.lastResult = "success";
    runtime.lastSuccessAt = nowIso();
    runtime.lastErrorMessage = "";
    runtime.lastNotifiedErrorKey = "";
  } else {
    const firstFailure = failures[0];
    runtime.lastResult = firstFailure.result;
    runtime.lastErrorMessage = `${firstFailure.targetUrl} | ${firstFailure.message}`;
    const errorKey = buildErrorKey(firstFailure.result, firstFailure.message, firstFailure.targetUrl);
    if (runtime.lastNotifiedErrorKey !== errorKey) {
      await notifyFailure(errorKey, firstFailure.result, runtime.lastErrorMessage);
      runtime.lastNotifiedErrorKey = errorKey;
    }
  }

  await writeState({ rule, runtime });
  return buildStateSnapshot();
}

function enqueueRun(mode = "manual") {
  const task = executionChain.then(() => performRun(mode));
  executionChain = task.then(() => undefined, () => undefined);
  return task;
}

async function saveRule(nextRule) {
  const normalizedRule = normalizeRule(nextRule || DEFAULT_RULE);
  await mutateState((state) => {
    state.rule = normalizedRule;
    const validUrls = new Set(normalizedRule.notebookUrls);
    state.runtime.dedicatedTabs = Object.fromEntries(
      Object.entries(state.runtime.dedicatedTabs || {}).filter(([url]) => validUrls.has(url))
    );
    state.runtime.lastRunAtByUrl = Object.fromEntries(
      Object.entries(state.runtime.lastRunAtByUrl || {}).filter(([url]) => validUrls.has(url))
    );
    return state;
  });
  await syncAlarm(normalizedRule);
  return buildStateSnapshot();
}

async function toggleEnabled() {
  const nextState = await mutateState((state) => {
    state.rule.enabled = !state.rule.enabled;
    return state;
  });
  await syncAlarm(nextState.rule);
  return buildStateSnapshot();
}

async function openNotebookForUser(url = "") {
  const state = await readState();
  const preferred = normalizeNotebookUrl(url, "");
  const targetUrl = preferred || state.rule.notebookUrls[0] || DEFAULT_RULE.notebookUrls[0];
  const runtime = structuredClone(state.runtime);
  const tab = await getDedicatedNotebookTab(targetUrl, runtime);

  const preparedTab = compareNotebookUrls(tab.url, targetUrl)
    ? tab
    : await chrome.tabs.update(tab.id, { url: targetUrl, active: true });

  await chrome.tabs.update(preparedTab.id, { active: true });
  if (Number.isInteger(preparedTab.windowId)) {
    await chrome.windows.update(preparedTab.windowId, { focused: true }).catch(() => undefined);
  }

  await writeState({ rule: state.rule, runtime });
  return buildStateSnapshot();
}

chrome.runtime.onInstalled.addListener(() => {
  ensureInitialized()
    .then((state) => syncAlarm(state.rule))
    .catch((error) => console.error(`${LOG_PREFIX} onInstalled failed`, error));
});

chrome.runtime.onStartup.addListener(() => {
  ensureInitialized()
    .then((state) => syncAlarm(state.rule))
    .catch((error) => console.error(`${LOG_PREFIX} onStartup failed`, error));
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  enqueueRun("scheduled").catch((error) => console.error(`${LOG_PREFIX} scheduled run failed`, error));
});

chrome.tabs.onRemoved.addListener((tabId) => {
  mutateState((state) => {
    state.runtime.dedicatedTabs = Object.fromEntries(
      Object.entries(state.runtime.dedicatedTabs || {}).filter(([, id]) => id !== tabId)
    );
    return state;
  }).catch((error) => console.warn(`${LOG_PREFIX} failed to clear dedicated tab id`, error));
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_STATE") {
    buildStateSnapshot().then((snapshot) => sendResponse({ ok: true, snapshot }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "state_failed" }));
    return true;
  }
  if (message?.type === "SAVE_RULE") {
    saveRule(message.payload).then((snapshot) => sendResponse({ ok: true, snapshot }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "save_rule_failed" }));
    return true;
  }
  if (message?.type === "TOGGLE_ENABLED") {
    toggleEnabled().then((snapshot) => sendResponse({ ok: true, snapshot }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "toggle_failed" }));
    return true;
  }
  if (message?.type === "OPEN_NOTEBOOK") {
    openNotebookForUser(message?.url || "").then((snapshot) => sendResponse({ ok: true, snapshot }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "open_notebook_failed" }));
    return true;
  }
  if (message?.type === "RUN_NOW") {
    enqueueRun("manual").then((snapshot) => sendResponse({ ok: true, snapshot }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "run_failed" }));
    return true;
  }
  return false;
});
