import {
  RESULT_LABELS,
  MODE_LABELS,
  normalizeRule
} from "./settings.js";

const saveRuleButton = document.getElementById("saveRule");
const runNowButton = document.getElementById("runNow");
const openNotebookButton = document.getElementById("openNotebook");

const enabledInput = document.getElementById("enabled");
const intervalMinutesInput = document.getElementById("intervalMinutes");
const notebookUrlsInput = document.getElementById("notebookUrls");
const sourceLabelInput = document.getElementById("sourceLabel");
const refreshLabelInput = document.getElementById("refreshLabel");

const runtimeResult = document.getElementById("runtimeResult");
const runtimeLastRun = document.getElementById("runtimeLastRun");
const runtimeLastSuccess = document.getElementById("runtimeLastSuccess");
const runtimeNextRun = document.getElementById("runtimeNextRun");
const runtimeMessage = document.getElementById("runtimeMessage");

const logList = document.getElementById("logList");
const formStatus = document.getElementById("formStatus");
const buildInfo = document.getElementById("buildInfo");
const formInputs = [
  enabledInput,
  intervalMinutesInput,
  notebookUrlsInput,
  sourceLabelInput,
  refreshLabelInput
];

let isDirty = false;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setStatus(message) {
  formStatus.textContent = message;
}

function formatTime(isoString) {
  return isoString ? new Date(isoString).toLocaleString() : "从未";
}

function formatScheduledTime(alarm) {
  if (!alarm?.scheduledTime) return "未计划";
  return new Date(alarm.scheduledTime).toLocaleString();
}

function renderRule(rule, { force = false } = {}) {
  if (!force && isDirty) return;
  enabledInput.checked = rule.enabled;
  intervalMinutesInput.value = String(rule.intervalMinutes);
  notebookUrlsInput.value = (rule.notebookUrls || []).join("\n");
  sourceLabelInput.value = rule.sourceLabel;
  refreshLabelInput.value = rule.refreshLabel;
  isDirty = false;
}

function renderLogs(runtime) {
  if (!runtime.recentRuns.length) {
    logList.innerHTML = "<li class=\"empty-log\">暂无运行记录。</li>";
    return;
  }

  logList.innerHTML = runtime.recentRuns.map((entry) => `
    <li class="log-entry">
      <strong>${escapeHtml(MODE_LABELS[entry.mode] || entry.mode)} · ${escapeHtml(RESULT_LABELS[entry.result] || entry.result)}</strong>
      <span>${escapeHtml(formatTime(entry.at))}</span>
      <span>${escapeHtml(entry.message || "无补充信息")}</span>
    </li>
  `).join("");
}

function renderRuntime(snapshot) {
  const { runtime, alarm } = snapshot;
  runtimeResult.textContent = RESULT_LABELS[runtime.lastResult] || runtime.lastResult;
  runtimeLastRun.textContent = formatTime(runtime.lastRunAt);
  runtimeLastSuccess.textContent = formatTime(runtime.lastSuccessAt);
  runtimeNextRun.textContent = formatScheduledTime(alarm);
  runtimeMessage.textContent = runtime.lastResult === "success"
    ? "最近一次执行已成功点击刷新入口。"
    : runtime.lastErrorMessage || "最近一次执行没有额外错误信息。";
  renderLogs(runtime);
}

async function fetchState() {
  const response = await chrome.runtime.sendMessage({ type: "GET_STATE" });
  if (!response?.ok) {
    throw new Error(response?.error || "state_failed");
  }
  return response.snapshot;
}

async function refreshState(message = "就绪。") {
  const snapshot = await fetchState();
  renderRule(snapshot.rule);
  renderRuntime(snapshot);
  setStatus(message);
}

function collectRule() {
  return normalizeRule({
    enabled: enabledInput.checked,
    intervalMinutes: intervalMinutesInput.value,
    notebookUrls: notebookUrlsInput.value,
    sourceLabel: sourceLabelInput.value,
    refreshLabel: refreshLabelInput.value
  });
}

async function invokeAction(button, message, progressText, doneText) {
  button.disabled = true;
  setStatus(progressText);
  try {
    const response = await chrome.runtime.sendMessage(message);
    if (!response?.ok) {
      throw new Error(response?.error || "action_failed");
    }
    renderRule(response.snapshot.rule);
    renderRuntime(response.snapshot);
    setStatus(doneText);
  } catch (error) {
    setStatus(`执行失败：${error.message}`);
    throw error;
  } finally {
    const snapshot = await fetchState().catch(() => null);
    if (snapshot) {
      renderRule(snapshot.rule);
      renderRuntime(snapshot);
    }
    button.disabled = false;
  }
}

saveRuleButton.addEventListener("click", () => {
  saveRuleButton.disabled = true;
  setStatus("正在保存规则...");
  chrome.runtime.sendMessage({ type: "SAVE_RULE", payload: collectRule() })
    .then((response) => {
      if (!response?.ok) {
        throw new Error(response?.error || "save_failed");
      }
      isDirty = false;
      renderRule(response.snapshot.rule, { force: true });
      renderRuntime(response.snapshot);
      setStatus("规则已保存。");
    })
    .catch((error) => {
      setStatus(`执行失败：${error.message}`);
    })
    .finally(async () => {
      const snapshot = await fetchState().catch(() => null);
      if (snapshot) {
        renderRule(snapshot.rule);
        renderRuntime(snapshot);
      }
      saveRuleButton.disabled = false;
    });
});

runNowButton.addEventListener("click", () => {
  invokeAction(
    runNowButton,
    { type: "RUN_NOW" },
    "正在执行手动刷新...",
    "手动刷新已完成。"
  ).catch(() => undefined);
});

openNotebookButton.addEventListener("click", () => {
  invokeAction(
    openNotebookButton,
    { type: "OPEN_NOTEBOOK" },
    "正在打开专用 Notebook 标签页...",
    "已打开专用 Notebook 标签页。"
  ).catch(() => undefined);
});

chrome.storage.onChanged.addListener(() => {
  refreshState("已同步最新状态。").catch(() => undefined);
});

formInputs.forEach((input) => {
  input.addEventListener("input", () => {
    isDirty = true;
  });
  input.addEventListener("change", () => {
    isDirty = true;
  });
});

buildInfo.textContent = `版本 ${chrome.runtime.getManifest().version}`;

refreshState().catch((error) => {
  console.error("[NotebookLM Refresh] failed to load options", error);
  setStatus(`加载失败：${error.message}`);
});
