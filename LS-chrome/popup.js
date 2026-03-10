import {
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

let activeTab = null;
let currentState = null;

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

async function loadState() {
  activeTab = await getActiveTab();
  if (!activeTab?.url) {
    siteLabel.textContent = "No active page";
    siteSummary.textContent = "Open an HTTP(S) page to manage site access.";
    toggleButton.disabled = true;
    setPopupStatus("No compatible tab.");
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
  siteLabel.textContent = site.hostname || "Unsupported page";
  siteSummary.textContent = site.supported
    ? `Profile: ${settings.profile.label}`
    : "Only HTTP(S) tabs can be managed.";

  toggleButton.disabled = !site.supported;
  toggleButton.textContent = site.allowlisted ? "Disable on this site" : "Enable on this site";

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
    compatibilityLabel.textContent = "No active site report";
    compatibilityDetail.textContent = "Enable this hostname to inject the front-end mask.";
    setCardTone("compatibilityLabel", "muted");
  } else if (compatibility.status === "enabled") {
    compatibilityLabel.textContent = "Main-world hook active";
    compatibilityDetail.textContent = compatibility.message || "The page hook acknowledged the current profile.";
    setCardTone("compatibilityLabel", "good");
  } else if (compatibility.status === "limited") {
    compatibilityLabel.textContent = "Compatibility limited";
    compatibilityDetail.textContent = compatibility.message || "The page hook did not apply cleanly.";
    setCardTone("compatibilityLabel", "warn");
  } else {
    compatibilityLabel.textContent = "No site report yet";
    compatibilityDetail.textContent = "Reload this tab after enabling the hostname.";
    setCardTone("compatibilityLabel", "muted");
  }

  setPopupStatus(site.supported ? "Ready." : "Unsupported tab.");
}

toggleButton.addEventListener("click", async () => {
  if (!activeTab?.url || !currentState?.site?.hostname) return;
  setPopupStatus("Updating site access...");
  toggleButton.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "TOGGLE_DOMAIN",
      url: activeTab.url,
      tabId: activeTab.id,
      enable: !currentState.site.allowlisted
    });

    if (!response?.ok) {
      throw new Error(response?.error || "toggle_failed");
    }

    if (response.reloadRequired && typeof activeTab.id === "number") {
      await chrome.tabs.reload(activeTab.id);
    }

    setPopupStatus("Site access updated. The tab was reloaded.");
    await loadState();
  } catch (error) {
    toggleButton.disabled = false;
    setPopupStatus(`Failed to update site: ${error.message}`);
  }
});

openOptionsButton.addEventListener("click", async () => {
  await chrome.runtime.openOptionsPage();
  window.close();
});

loadState().catch((error) => {
  console.error("[Locale Shield] Failed to load popup", error);
  setPopupStatus(`Failed to load popup: ${error.message}`);
});
