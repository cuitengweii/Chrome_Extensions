"use strict";

const ICON_PATHS = {
  16: "icon16.plasmo.496a292f.png",
  32: "icon32.plasmo.3b8fa2e2.png",
  48: "icon48.plasmo.843a0c18.png",
  128: "icon128.plasmo.d580fdc7.png"
};

let lastLinkedInState = null;

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return Array.isArray(tabs) && tabs.length ? tabs[0] : null;
}

async function isLinkedInActiveTab() {
  const tab = await getActiveTab();
  const url = typeof tab?.url === "string" ? tab.url : "";
  if (!url) return false;
  try {
    const host = new URL(url).host.toLowerCase();
    return host.endsWith("linkedin.com");
  } catch (_err) {
    return false;
  }
}

async function updateActionIcon() {
  const isLinkedIn = await isLinkedInActiveTab();
  if (isLinkedIn === lastLinkedInState) return;
  lastLinkedInState = isLinkedIn;
  await chrome.action.setIcon({ path: ICON_PATHS });
}

function safeUpdateActionIcon() {
  void updateActionIcon().catch(() => {});
}

chrome.runtime.onInstalled.addListener(() => {
  safeUpdateActionIcon();
});

chrome.runtime.onStartup.addListener(() => {
  safeUpdateActionIcon();
});

chrome.tabs.onCreated.addListener(() => {
  safeUpdateActionIcon();
});

chrome.tabs.onActivated.addListener(() => {
  safeUpdateActionIcon();
});

chrome.tabs.onUpdated.addListener(() => {
  safeUpdateActionIcon();
});

chrome.windows.onFocusChanged.addListener(() => {
  safeUpdateActionIcon();
});
