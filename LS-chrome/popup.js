import {
  buildOriginPatterns,
  summarizeNetworkState,
  summarizeFrontendState
} from "./settings.js";

const toggleButton = document.getElementById("toggleSite");
const openOptionsButton = document.getElementById("openOptions");
const popupStatus = document.getElementById("popupStatus");
const siteLabel = document.getElementById("siteLabel");
const siteSummary = document.getElementById("siteSummary");
const networkLabel = document.getElementById("networkLabel");
const networkDetail = document.getElementById("networkDetail");
const frontendLabel = document.getElementById("frontendLabel");
const frontendDetail = document.getElementById("frontendDetail");
const compatibilityLabel = document.getElementById("compatibilityLabel");
const compatibilityDetail = document.getElementById("compatibilityDetail");
const buildInfo = document.getElementById("buildInfo");

let activeTab = null;
let currentState = null;

function text(value) {
  return value;
}

function renderBuildInfo() {
  const manifest = chrome.runtime.getManifest();
  buildInfo.textContent = text(`\u7248\u672c\uff1a${manifest.version}`);
}

function setPopupStatus(message) {
  popupStatus.textContent = message;
}

function setCardTone(nodeId, tone) {
  document.getElementById(nodeId).closest(".status-card").dataset.tone = tone;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function ensureSitePermission(hostname) {
  const origins = buildOriginPatterns(hostname);
  if (!origins.length) return false;
  if (await chrome.permissions.contains({ origins })) return true;
  return chrome.permissions.request({ origins });
}

async function loadState() {
  activeTab = await getActiveTab();
  if (!activeTab?.url) {
    siteLabel.textContent = text("\u6ca1\u6709\u53ef\u7528\u7684\u9875\u9762");
    siteSummary.textContent = text("\u8bf7\u6253\u5f00 HTTP(S) \u7f51\u9875\u540e\u518d\u7ba1\u7406\u7ad9\u70b9\u6743\u9650\u3002");
    toggleButton.disabled = true;
    setPopupStatus(text("\u5f53\u524d\u6807\u7b7e\u9875\u4e0d\u53ef\u7528\u3002"));
    return;
  }

  const response = await chrome.runtime.sendMessage({
    type: "GET_STATE",
    tabId: activeTab.id,
    url: activeTab.url
  });

  if (!response?.ok) {
    throw new Error(response?.error || "state_failed");
  }

  currentState = response.state;
  renderState();
}

function renderState() {
  const { settings, site } = currentState;
  siteLabel.textContent = site.hostname || text("\u4e0d\u652f\u6301\u7684\u9875\u9762");
  siteSummary.textContent = site.supported
    ? text(`\u5f53\u524d\u6863\u6848\uff1a${settings.profile.label}`)
    : text("\u53ea\u652f\u6301 HTTP(S) \u7f51\u9875\u3002");

  toggleButton.disabled = !site.supported;
  toggleButton.textContent = site.allowlisted
    ? text("\u5bf9\u5f53\u524d\u7ad9\u70b9\u5173\u95ed")
    : text("\u5bf9\u5f53\u524d\u7ad9\u70b9\u542f\u7528");

  const networkSummary = summarizeNetworkState(settings);
  networkLabel.textContent = networkSummary.label;
  networkDetail.textContent = networkSummary.detail;
  setCardTone("networkLabel", networkSummary.tone);

  const frontendSummary = summarizeFrontendState(settings, site.hostname);
  frontendLabel.textContent = frontendSummary.label;
  frontendDetail.textContent = frontendSummary.detail;
  setCardTone("frontendLabel", frontendSummary.tone);

  const compatibility = site.compatibility || { status: "unknown" };
  if (!site.allowlisted) {
    compatibilityLabel.textContent = text("\u6682\u65e0\u7ad9\u70b9\u62a5\u544a");
    compatibilityDetail.textContent = text("\u5148\u542f\u7528\u8fd9\u4e2a\u57df\u540d\uff0c\u518d\u5237\u65b0\u9875\u9762\u4ee5\u6ce8\u5165\u524d\u7aef\u4f2a\u88c5\u3002");
    setCardTone("compatibilityLabel", "muted");
  } else if (compatibility.status === "enabled") {
    compatibilityLabel.textContent = text("\u4e3b\u4e16\u754c Hook \u5df2\u751f\u6548");
    compatibilityDetail.textContent = compatibility.message || text("\u9875\u9762\u5df2\u786e\u8ba4\u5f53\u524d\u914d\u7f6e\u5df2\u6ce8\u5165\u3002");
    setCardTone("compatibilityLabel", "good");
  } else if (compatibility.status === "limited") {
    compatibilityLabel.textContent = text("\u517c\u5bb9\u6027\u53d7\u9650");
    compatibilityDetail.textContent = compatibility.message || text("\u9875\u9762\u6ce8\u5165\u6ca1\u6709\u5b8c\u5168\u6210\u529f\u3002");
    setCardTone("compatibilityLabel", "warn");
  } else {
    compatibilityLabel.textContent = text("\u6682\u65e0\u7ad9\u70b9\u62a5\u544a");
    compatibilityDetail.textContent = text("\u542f\u7528\u57df\u540d\u6216\u4fee\u6539\u6863\u6848\u540e\uff0c\u8bf7\u5237\u65b0\u5f53\u524d\u9875\u9762\u3002");
    setCardTone("compatibilityLabel", "muted");
  }

  setPopupStatus(site.supported ? text("\u5c31\u7eea\u3002") : text("\u5f53\u524d\u6807\u7b7e\u9875\u4e0d\u53ef\u7528\u3002"));
}

toggleButton.addEventListener("click", async () => {
  if (!activeTab?.url || !currentState?.site?.hostname) return;
  setPopupStatus(text("\u6b63\u5728\u66f4\u65b0\u7ad9\u70b9\u6388\u6743..."));
  toggleButton.disabled = true;

  try {
    if (!currentState.site.allowlisted) {
      const granted = await ensureSitePermission(currentState.site.hostname);
      if (!granted) {
        toggleButton.disabled = false;
        setPopupStatus(text("\u4f60\u62d2\u7edd\u4e86\u8fd9\u4e2a\u57df\u540d\u7684\u8bbf\u95ee\u6743\u9650\u3002"));
        return;
      }
    }

    const response = await chrome.runtime.sendMessage({
      type: "TOGGLE_DOMAIN",
      url: activeTab.url,
      tabId: activeTab.id,
      enable: !currentState.site.allowlisted
    });

    if (!response?.ok) {
      if (response?.error === "site_permission_missing") {
        throw new Error(text("\u7f3a\u5c11\u5f53\u524d\u7ad9\u70b9\u7684\u8bbf\u95ee\u6388\u6743"));
      }
      throw new Error(response?.error || "toggle_failed");
    }

    if (response.reloadRequired && typeof activeTab.id === "number") {
      await chrome.tabs.reload(activeTab.id);
    }

    setPopupStatus(text("\u7ad9\u70b9\u8bbe\u7f6e\u5df2\u66f4\u65b0\uff0c\u5f53\u524d\u9875\u9762\u5df2\u5237\u65b0\u3002"));
    await loadState();
  } catch (error) {
    toggleButton.disabled = false;
    setPopupStatus(`\u66f4\u65b0\u5931\u8d25\uff1a${error.message}`);
  }
});

openOptionsButton.addEventListener("click", async () => {
  await chrome.runtime.openOptionsPage();
  window.close();
});

loadState().catch((error) => {
  console.error("[\u5c5e\u5730\u9690\u79c1\u76fe] Failed to load popup", error);
  setPopupStatus(`\u52a0\u8f7d\u5931\u8d25\uff1a${error.message}`);
});

renderBuildInfo();
