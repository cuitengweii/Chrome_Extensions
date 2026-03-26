import {
  RESULT_LABELS,
  MODE_LABELS
} from "./settings.js";

const heroSummary = document.getElementById("heroSummary");
const timerPill = document.getElementById("timerPill");
const scheduleLabel = document.getElementById("scheduleLabel");
const scheduleDetail = document.getElementById("scheduleDetail");
const resultLabel = document.getElementById("resultLabel");
const resultDetail = document.getElementById("resultDetail");
const ruleLabel = document.getElementById("ruleLabel");
const ruleDetail = document.getElementById("ruleDetail");
const runNowButton = document.getElementById("runNow");
const openNotebookButton = document.getElementById("openNotebook");
const toggleEnabledButton = document.getElementById("toggleEnabled");
const openOptionsButton = document.getElementById("openOptions");
const logList = document.getElementById("logList");
const popupStatus = document.getElementById("popupStatus");
const buildInfo = document.getElementById("buildInfo");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setStatus(message) {
  popupStatus.textContent = message;
}

function formatTime(isoString) {
  return isoString ? new Date(isoString).toLocaleString() : "从未";
}

function formatScheduledTime(alarm) {
  if (!alarm?.scheduledTime) return "未计划";
  return new Date(alarm.scheduledTime).toLocaleString();
}

function setTone(nodeId, tone) {
  const node = document.getElementById(nodeId);
  const card = node?.closest(".status-card");
  if (card) card.dataset.tone = tone;
}

function resultTone(result) {
  if (result === "success") return "good";
  if (result === "running") return "warn";
  if (result === "idle") return "muted";
  return "warn";
}

function renderLogs(runtime) {
  if (!runtime.recentRuns.length) {
    logList.innerHTML = "<li class=\"empty-log\">暂无运行记录。</li>";
    return;
  }

  logList.innerHTML = runtime.recentRuns.slice(0, 5).map((entry) => `
    <li class="log-entry">
      <strong>${escapeHtml(MODE_LABELS[entry.mode] || entry.mode)} · ${escapeHtml(RESULT_LABELS[entry.result] || entry.result)}</strong>
      <span>${escapeHtml(formatTime(entry.at))}</span>
      <span>${escapeHtml(entry.message || "无补充信息")}</span>
    </li>
  `).join("");
}

function renderState(snapshot) {
  const { rule, runtime, alarm } = snapshot;
  const enabledText = rule.enabled ? "定时已启用" : "定时已暂停";
  const urls = Array.isArray(rule.notebookUrls) ? rule.notebookUrls : [];
  const previewUrls = urls.slice(0, 2).join(" | ");

  heroSummary.textContent = `当前目标来源：${rule.sourceLabel}。刷新入口文案：${rule.refreshLabel}。`;
  timerPill.textContent = rule.enabled ? `每 ${rule.intervalMinutes} 分钟` : "已暂停";

  scheduleLabel.textContent = enabledText;
  scheduleDetail.textContent = rule.enabled
    ? `下一次计划执行：${formatScheduledTime(alarm)}`
    : "你可以手动运行，或恢复定时任务。";
  setTone("scheduleLabel", rule.enabled ? "good" : "muted");

  resultLabel.textContent = RESULT_LABELS[runtime.lastResult] || runtime.lastResult;
  resultDetail.textContent = runtime.lastResult === "success"
    ? `最近成功时间：${formatTime(runtime.lastSuccessAt)}`
    : runtime.lastErrorMessage || `最近运行时间：${formatTime(runtime.lastRunAt)}`;
  setTone("resultLabel", resultTone(runtime.lastResult));

  ruleLabel.textContent = `${rule.sourceLabel}（${urls.length} 个 URL）`;
  ruleDetail.textContent = previewUrls
    ? `${previewUrls}${urls.length > 2 ? " ..." : ""}`
    : "未配置 Notebook URL";
  setTone("ruleLabel", "muted");

  toggleEnabledButton.textContent = rule.enabled ? "暂停定时" : "恢复定时";
  runNowButton.disabled = runtime.lastResult === "running";

  renderLogs(runtime);
}

async function fetchState() {
  const response = await chrome.runtime.sendMessage({ type: "GET_STATE" });
  if (!response?.ok) {
    throw new Error(response?.error || "state_failed");
  }
  return response.snapshot;
}

async function refreshState(statusMessage = "就绪。") {
  const snapshot = await fetchState();
  renderState(snapshot);
  setStatus(statusMessage);
}

async function invokeAction(button, message, progressText, doneText) {
  button.disabled = true;
  setStatus(progressText);
  try {
    const response = await chrome.runtime.sendMessage(message);
    if (!response?.ok) {
      throw new Error(response?.error || "action_failed");
    }
    renderState(response.snapshot);
    setStatus(doneText);
  } catch (error) {
    setStatus(`执行失败：${error.message}`);
    throw error;
  } finally {
    const snapshot = await fetchState().catch(() => null);
    if (snapshot) renderState(snapshot);
    button.disabled = false;
  }
}

runNowButton.addEventListener("click", () => {
  invokeAction(
    runNowButton,
    { type: "RUN_NOW" },
    "正在执行 NotebookLM 来源刷新...",
    "手动刷新已完成。"
  ).catch(() => undefined);
});

openNotebookButton.addEventListener("click", () => {
  invokeAction(
    openNotebookButton,
    { type: "OPEN_NOTEBOOK" },
    "正在打开 NotebookLM 标签页...",
    "已打开专用 NotebookLM 标签页。"
  ).catch(() => undefined);
});

toggleEnabledButton.addEventListener("click", () => {
  invokeAction(
    toggleEnabledButton,
    { type: "TOGGLE_ENABLED" },
    "正在切换定时任务状态...",
    "定时任务状态已更新。"
  ).catch(() => undefined);
});

openOptionsButton.addEventListener("click", async () => {
  await chrome.runtime.openOptionsPage();
  window.close();
});

chrome.storage.onChanged.addListener(() => {
  refreshState("已同步最新状态。").catch(() => undefined);
});

buildInfo.textContent = `版本 ${chrome.runtime.getManifest().version}`;

refreshState().catch((error) => {
  console.error("[NotebookLM Refresh] failed to load popup", error);
  setStatus(`加载失败：${error.message}`);
});
