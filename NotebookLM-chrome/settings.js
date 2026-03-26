export const RULES_KEY = "automationRules";
export const LEGACY_RULE_KEY = "automationRule";
export const RUNTIME_KEY = "automationRuntime";
export const ALARM_NAME = "notebooklm-source-refresh";
export const MAX_LOG_ENTRIES = 40;

export const RESULT_LABELS = Object.freeze({
  idle: "空闲",
  running: "执行中",
  success: "已完成",
  login_required: "需要登录或访问权限",
  source_not_found: "未找到来源",
  refresh_not_found: "未找到刷新入口",
  page_error: "页面异常"
});

export const MODE_LABELS = Object.freeze({
  manual: "手动",
  scheduled: "定时",
  system: "系统"
});

const VALID_RESULTS = new Set(Object.keys(RESULT_LABELS));
const VALID_MODES = new Set(Object.keys(MODE_LABELS));
const DEFAULT_NOTEBOOK_URL = "https://notebooklm.google.com/notebook/f7a160de-acd3-43eb-8c3d-bc6c6214b6a0";

export const DEFAULT_RULE = Object.freeze({
  enabled: true,
  intervalMinutes: 60,
  notebookUrls: Object.freeze([DEFAULT_NOTEBOOK_URL]),
  sourceLabel: "work ai news",
  refreshLabel: "点击即可与 Google 云端硬盘同步"
});

export const DEFAULT_RUNTIME = Object.freeze({
  dedicatedTabs: Object.freeze({}),
  lastRunAt: "",
  lastSuccessAt: "",
  lastResult: "idle",
  lastErrorMessage: "",
  lastNotifiedErrorKey: "",
  lastRunAtByUrl: Object.freeze({}),
  recentRuns: Object.freeze([])
});

function trimText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function clampInteger(value, fallback, min, max) {
  const number = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(number)) return fallback;
  if (number < min || number > max) return fallback;
  return number;
}

export function normalizeNotebookUrl(value, fallback = "") {
  const candidate = trimText(value, fallback);
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" || parsed.hostname !== "notebooklm.google.com") {
      return fallback;
    }
    const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    const search = parsed.search || "";
    return `${parsed.origin}${pathname}${search}`;
  } catch (_) {
    return fallback;
  }
}

export function compareNotebookUrls(left, right) {
  return normalizeNotebookUrl(left, "") === normalizeNotebookUrl(right, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function parseNotebookUrls(value) {
  const rawValues = Array.isArray(value)
    ? value
    : String(value ?? "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

  return unique(rawValues.map((item) => normalizeNotebookUrl(item, "")).filter(Boolean));
}

export function normalizeRule(rawRule = {}) {
  const legacySingleUrl = normalizeNotebookUrl(rawRule.notebookUrl, "");
  const notebookUrls = parseNotebookUrls(rawRule.notebookUrls ?? []);
  const mergedUrls = notebookUrls.length
    ? notebookUrls
    : legacySingleUrl
      ? [legacySingleUrl]
      : [DEFAULT_RULE.notebookUrls[0]];

  return {
    enabled: rawRule.enabled !== false,
    intervalMinutes: clampInteger(rawRule.intervalMinutes, DEFAULT_RULE.intervalMinutes, 5, 1440),
    notebookUrls: mergedUrls,
    sourceLabel: trimText(rawRule.sourceLabel, DEFAULT_RULE.sourceLabel),
    refreshLabel: trimText(rawRule.refreshLabel, DEFAULT_RULE.refreshLabel)
  };
}

function normalizeLogEntry(rawEntry = {}) {
  return {
    at: trimText(rawEntry.at),
    mode: VALID_MODES.has(rawEntry.mode) ? rawEntry.mode : "system",
    result: VALID_RESULTS.has(rawEntry.result) ? rawEntry.result : "page_error",
    message: trimText(rawEntry.message).slice(0, 360)
  };
}

function normalizeTabMap(rawMap = {}) {
  const map = {};
  Object.entries(rawMap || {}).forEach(([url, tabId]) => {
    const normalizedUrl = normalizeNotebookUrl(url, "");
    if (!normalizedUrl || !Number.isInteger(tabId)) return;
    map[normalizedUrl] = tabId;
  });
  return map;
}

function normalizeRunMap(rawMap = {}) {
  const map = {};
  Object.entries(rawMap || {}).forEach(([url, iso]) => {
    const normalizedUrl = normalizeNotebookUrl(url, "");
    const value = trimText(iso);
    if (!normalizedUrl || !value) return;
    map[normalizedUrl] = value;
  });
  return map;
}

export function normalizeRuntime(rawRuntime = {}) {
  const recentRuns = Array.isArray(rawRuntime.recentRuns)
    ? rawRuntime.recentRuns.map((entry) => normalizeLogEntry(entry)).slice(0, MAX_LOG_ENTRIES)
    : [];

  const dedicatedTabs = normalizeTabMap(rawRuntime.dedicatedTabs || {});
  const legacyDedicatedTabId = Number.isInteger(rawRuntime.dedicatedTabId)
    ? rawRuntime.dedicatedTabId
    : null;
  if (legacyDedicatedTabId && !dedicatedTabs[DEFAULT_RULE.notebookUrls[0]]) {
    dedicatedTabs[DEFAULT_RULE.notebookUrls[0]] = legacyDedicatedTabId;
  }

  return {
    dedicatedTabs,
    lastRunAt: trimText(rawRuntime.lastRunAt),
    lastSuccessAt: trimText(rawRuntime.lastSuccessAt),
    lastResult: VALID_RESULTS.has(rawRuntime.lastResult) ? rawRuntime.lastResult : DEFAULT_RUNTIME.lastResult,
    lastErrorMessage: trimText(rawRuntime.lastErrorMessage).slice(0, 360),
    lastNotifiedErrorKey: trimText(rawRuntime.lastNotifiedErrorKey).slice(0, 360),
    lastRunAtByUrl: normalizeRunMap(rawRuntime.lastRunAtByUrl || {}),
    recentRuns
  };
}

export function appendRunLog(runtime, entry) {
  const normalizedRuntime = normalizeRuntime(runtime);
  const normalizedEntry = normalizeLogEntry(entry);
  return normalizeRuntime({
    ...normalizedRuntime,
    recentRuns: [normalizedEntry, ...normalizedRuntime.recentRuns].slice(0, MAX_LOG_ENTRIES)
  });
}
