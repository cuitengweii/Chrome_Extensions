export const RULES_KEY = "automationRules";
export const LEGACY_RULE_KEY = "automationRule";
export const RUNTIME_KEY = "automationRuntime";
export const ALARM_NAME = "notebooklm-source-refresh";
export const MAX_LOG_ENTRIES = 200;

export const RESULT_LABELS = Object.freeze({
  idle: "Idle",
  running: "Running",
  success: "Success",
  partial_success: "Partial Success",
  skipped: "Skipped",
  login_required: "Login/Permission Required",
  source_not_found: "Source Not Found",
  refresh_not_found: "Refresh Entry Not Found",
  page_error: "Page Error"
});

export const MODE_LABELS = Object.freeze({
  manual: "Manual",
  scheduled: "Scheduled",
  system: "System"
});

const VALID_RESULTS = new Set(Object.keys(RESULT_LABELS));
const VALID_MODES = new Set(Object.keys(MODE_LABELS));
const DEFAULT_NOTEBOOK_URL = "https://notebooklm.google.com/notebook/f7a160de-acd3-43eb-8c3d-bc6c6214b6a0";
const DEFAULT_SOURCE_LABEL = "work ai news";
const DEFAULT_RULE_SET_ID = "scheduled_source_refresh";

export const DEFAULT_RULE = Object.freeze({
  enabled: true,
  intervalMinutes: 60,
  targets: Object.freeze([Object.freeze({
    notebookUrl: DEFAULT_NOTEBOOK_URL,
    sourceLabel: DEFAULT_SOURCE_LABEL,
    ruleSetId: DEFAULT_RULE_SET_ID
  })]),
  refreshLabel: "点击即可与 Google 云端硬盘同步"
});

export const DEFAULT_RUNTIME = Object.freeze({
  dedicatedTabs: Object.freeze({}),
  notebookIndexTabId: 0,
  lastRunAt: "",
  lastSuccessAt: "",
  lastResult: "idle",
  lastErrorMessage: "",
  lastNotifiedErrorKey: "",
  lastRunAtByTarget: Object.freeze({}),
  lastRunAtByUrl: Object.freeze({}),
  recentRuns: Object.freeze([]),
  lastRunSummary: null,
  lastManualRunSummary: null,
  lastScheduledRunSummary: null
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
    if (parsed.protocol !== "https:" || parsed.hostname !== "notebooklm.google.com") return fallback;
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

function parseTargetLine(line, defaultSourceLabel) {
  const raw = trimText(line);
  if (!raw) return null;
  const parts = raw.split("|");
  const notebookUrl = normalizeNotebookUrl(parts[0], "");
  if (!notebookUrl) return null;
  const sourceLabel = trimText(parts.slice(1).join("|"), defaultSourceLabel || DEFAULT_SOURCE_LABEL);
  return { notebookUrl, sourceLabel, ruleSetId: DEFAULT_RULE_SET_ID };
}

export function parseTargetLines(value, defaultSourceLabel = DEFAULT_SOURCE_LABEL, defaultRuleSetId = DEFAULT_RULE_SET_ID) {
  const lines = Array.isArray(value)
    ? value
    : String(value ?? "").split(/\r?\n/);

  const results = [];
  for (const line of lines) {
    const target = parseTargetLine(line, defaultSourceLabel);
    if (!target) continue;
    target.ruleSetId = trimText(target.ruleSetId, defaultRuleSetId || DEFAULT_RULE_SET_ID);
    results.push(target);
  }
  return results;
}

function normalizeTargets(rawRule = {}) {
  const legacyDefaultSource = trimText(rawRule.sourceLabel, DEFAULT_SOURCE_LABEL);
  const legacyDefaultRuleSetId = trimText(rawRule.ruleSetId, DEFAULT_RULE_SET_ID);

  if (Array.isArray(rawRule.targets) && rawRule.targets.length) {
    const normalized = rawRule.targets
      .map((target) => {
        const notebookUrl = normalizeNotebookUrl(target?.notebookUrl || "", "");
        if (!notebookUrl) return null;
        const sourceLabel = trimText(target?.sourceLabel, legacyDefaultSource || DEFAULT_SOURCE_LABEL);
        const ruleSetId = trimText(target?.ruleSetId, legacyDefaultRuleSetId || DEFAULT_RULE_SET_ID);
        return { notebookUrl, sourceLabel, ruleSetId };
      })
      .filter(Boolean);
    if (normalized.length) return normalized;
  }

  if (trimText(rawRule.targetLines)) {
    const normalized = parseTargetLines(rawRule.targetLines, legacyDefaultSource, legacyDefaultRuleSetId);
    if (normalized.length) return normalized;
  }

  if (Array.isArray(rawRule.notebookUrls) && rawRule.notebookUrls.length) {
    const normalized = parseTargetLines(
      rawRule.notebookUrls.map((url) => `${url}|${legacyDefaultSource}`),
      legacyDefaultSource,
      legacyDefaultRuleSetId
    );
    if (normalized.length) return normalized;
  }

  if (trimText(rawRule.notebookUrl)) {
    const notebookUrl = normalizeNotebookUrl(rawRule.notebookUrl, DEFAULT_NOTEBOOK_URL);
    return [{ notebookUrl, sourceLabel: legacyDefaultSource, ruleSetId: legacyDefaultRuleSetId }];
  }

  return [{ ...DEFAULT_RULE.targets[0] }];
}

export function normalizeRule(rawRule = {}) {
  return {
    enabled: rawRule.enabled !== false,
    intervalMinutes: clampInteger(rawRule.intervalMinutes, DEFAULT_RULE.intervalMinutes, 5, 1440),
    targets: normalizeTargets(rawRule),
    refreshLabel: trimText(rawRule.refreshLabel, DEFAULT_RULE.refreshLabel)
  };
}

function normalizeLogEntry(rawEntry = {}) {
  const stats = rawEntry?.stats && typeof rawEntry.stats === "object"
    ? {
      total: clampInteger(rawEntry.stats.total, 0, 0, 10000),
      success: clampInteger(rawEntry.stats.success, 0, 0, 10000),
      failed: clampInteger(rawEntry.stats.failed, 0, 0, 10000),
      skipped: clampInteger(rawEntry.stats.skipped, 0, 0, 10000)
    }
    : null;
  return {
    at: trimText(rawEntry.at),
    mode: VALID_MODES.has(rawEntry.mode) ? rawEntry.mode : "system",
    result: VALID_RESULTS.has(rawEntry.result) ? rawEntry.result : "page_error",
    message: trimText(rawEntry.message).slice(0, 360),
    scope: trimText(rawEntry.scope, "notebook").slice(0, 24),
    notebookUrl: normalizeNotebookUrl(rawEntry.notebookUrl, ""),
    notebookTitle: trimText(rawEntry.notebookTitle).slice(0, 160),
    sourceId: trimText(rawEntry.sourceId).slice(0, 120),
    sourceName: trimText(rawEntry.sourceName).slice(0, 180),
    sourceKind: trimText(rawEntry.sourceKind).slice(0, 48),
    durationMs: clampInteger(rawEntry.durationMs, 0, 0, 86400000),
    attempt: clampInteger(rawEntry.attempt, 0, 0, 12),
    reason: trimText(rawEntry.reason).slice(0, 180),
    runId: trimText(rawEntry.runId).slice(0, 80),
    ruleSetIds: Array.isArray(rawEntry.ruleSetIds)
      ? rawEntry.ruleSetIds.map((item) => trimText(item).slice(0, 80)).filter(Boolean).slice(0, 8)
      : [],
    ruleSetNames: Array.isArray(rawEntry.ruleSetNames)
      ? rawEntry.ruleSetNames.map((item) => trimText(item).slice(0, 80)).filter(Boolean).slice(0, 8)
      : [],
    stats
  };
}

function normalizeReasonCounts(rawCounts = {}) {
  const counts = {};
  Object.entries(rawCounts || {}).forEach(([key, value]) => {
    const reason = trimText(key).slice(0, 120);
    const count = clampInteger(value, 0, 0, 10000);
    if (!reason || count <= 0) return;
    counts[reason] = count;
  });
  return counts;
}

function normalizeFailedSample(rawSample = {}) {
  return {
    notebookUrl: normalizeNotebookUrl(rawSample.notebookUrl, ""),
    notebookTitle: trimText(rawSample.notebookTitle).slice(0, 160),
    sourceId: trimText(rawSample.sourceId).slice(0, 120),
    sourceName: trimText(rawSample.sourceName).slice(0, 180),
    sourceKind: trimText(rawSample.sourceKind).slice(0, 48),
    result: VALID_RESULTS.has(rawSample.result) ? rawSample.result : "page_error",
    reason: trimText(rawSample.reason).slice(0, 180)
  };
}

function normalizeRunSummary(rawSummary = null) {
  if (!rawSummary || typeof rawSummary !== "object") return null;
  return {
    runId: trimText(rawSummary.runId).slice(0, 80),
    mode: VALID_MODES.has(rawSummary.mode) ? rawSummary.mode : "system",
    result: VALID_RESULTS.has(rawSummary.result) ? rawSummary.result : "idle",
    startedAt: trimText(rawSummary.startedAt),
    finishedAt: trimText(rawSummary.finishedAt),
    durationMs: clampInteger(rawSummary.durationMs, 0, 0, 86400000),
    totalNotebooks: clampInteger(rawSummary.totalNotebooks, 0, 0, 5000),
    completedNotebooks: clampInteger(rawSummary.completedNotebooks, 0, 0, 5000),
    totalSources: clampInteger(rawSummary.totalSources, 0, 0, 50000),
    completedSources: clampInteger(rawSummary.completedSources, 0, 0, 50000),
    successCount: clampInteger(rawSummary.successCount, 0, 0, 50000),
    failedCount: clampInteger(rawSummary.failedCount, 0, 0, 50000),
    skippedCount: clampInteger(rawSummary.skippedCount, 0, 0, 50000),
    failureReasons: normalizeReasonCounts(rawSummary.failureReasons || {}),
    failedSamples: Array.isArray(rawSummary.failedSamples)
      ? rawSummary.failedSamples
        .map((item) => normalizeFailedSample(item))
        .filter((item) => item.sourceName || item.reason)
        .slice(0, 10)
      : []
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

function normalizeTargetRunMap(rawMap = {}) {
  const map = {};
  Object.entries(rawMap || {}).forEach(([key, iso]) => {
    const targetKey = trimText(key);
    const value = trimText(iso);
    if (!targetKey || !value) return;
    map[targetKey] = value;
  });
  return map;
}

export function normalizeRuntime(rawRuntime = {}) {
  const recentRuns = Array.isArray(rawRuntime.recentRuns)
    ? rawRuntime.recentRuns.map((entry) => normalizeLogEntry(entry)).slice(0, MAX_LOG_ENTRIES)
    : [];

  const dedicatedTabs = normalizeTabMap(rawRuntime.dedicatedTabs || {});
  const legacyDedicatedTabId = Number.isInteger(rawRuntime.dedicatedTabId) ? rawRuntime.dedicatedTabId : null;
  if (legacyDedicatedTabId && !dedicatedTabs[DEFAULT_NOTEBOOK_URL]) {
    dedicatedTabs[DEFAULT_NOTEBOOK_URL] = legacyDedicatedTabId;
  }

  return {
    dedicatedTabs,
    notebookIndexTabId: Number.isInteger(rawRuntime.notebookIndexTabId) ? rawRuntime.notebookIndexTabId : 0,
    lastRunAt: trimText(rawRuntime.lastRunAt),
    lastSuccessAt: trimText(rawRuntime.lastSuccessAt),
    lastResult: VALID_RESULTS.has(rawRuntime.lastResult) ? rawRuntime.lastResult : DEFAULT_RUNTIME.lastResult,
    lastErrorMessage: trimText(rawRuntime.lastErrorMessage).slice(0, 360),
    lastNotifiedErrorKey: trimText(rawRuntime.lastNotifiedErrorKey).slice(0, 360),
    lastRunAtByTarget: normalizeTargetRunMap(rawRuntime.lastRunAtByTarget || {}),
    lastRunAtByUrl: normalizeRunMap(rawRuntime.lastRunAtByUrl || {}),
    recentRuns,
    lastRunSummary: normalizeRunSummary(rawRuntime.lastRunSummary),
    lastManualRunSummary: normalizeRunSummary(rawRuntime.lastManualRunSummary),
    lastScheduledRunSummary: normalizeRunSummary(rawRuntime.lastScheduledRunSummary)
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
