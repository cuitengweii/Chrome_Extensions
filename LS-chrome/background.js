import {
  SETTINGS_KEY,
  CONTENT_SCRIPT_IDS,
  DEFAULT_SETTINGS,
  normalizeSettings,
  normalizeDomain,
  buildOriginPatterns,
  buildMatchPatterns,
  extractHostname,
  isSupportedUrl,
  isDomainAllowlisted,
  buildCompatibilityReport,
  getCompatibilityForHost
} from "./settings.js";

const LOG_PREFIX = "[Locale Shield]";
const WEBRTC_POLICY = "disable_non_proxied_udp";
const VERIFICATION_PROVIDERS = [
  {
    name: "ipapi.co",
    url: "https://ipapi.co/json/",
    parse(data) {
      if (!data || data.error) return null;
      return {
        ip: String(data.ip || "").trim(),
        city: String(data.city || "").trim(),
        region: String(data.region || "").trim(),
        country: String(data.country_name || data.country || "").trim(),
        timezone: String(data.timezone || "").trim()
      };
    }
  },
  {
    name: "ipwho.is",
    url: "https://ipwho.is/",
    parse(data) {
      if (!data || data.success === false) return null;
      return {
        ip: String(data.ip || "").trim(),
        city: String(data.city || "").trim(),
        region: String(data.region || "").trim(),
        country: String(data.country || "").trim(),
        timezone: String(data.timezone?.id || data.timezone || "").trim()
      };
    }
  }
];

let settingsMutationChain = Promise.resolve();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createAbortSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear() {
      clearTimeout(timer);
    }
  };
}

async function readSettings() {
  const data = await chrome.storage.local.get([SETTINGS_KEY]);
  return normalizeSettings(data[SETTINGS_KEY] || DEFAULT_SETTINGS);
}

async function writeSettings(settings) {
  const normalized = normalizeSettings(settings || {});
  await chrome.storage.local.set({ [SETTINGS_KEY]: normalized });
  return normalized;
}

async function mutateSettings(mutator) {
  const task = settingsMutationChain.then(async () => {
    const current = await readSettings();
    const next = await mutator(structuredClone(current));
    return writeSettings(next);
  });

  settingsMutationChain = task.then(() => undefined, () => undefined);
  return task;
}

async function hasOriginPermission(domain) {
  const origins = buildOriginPatterns(domain);
  if (!origins.length) return false;
  return chrome.permissions.contains({ origins });
}

async function getGrantedAllowlist(domains) {
  const granted = [];
  for (const domain of domains) {
    if (await hasOriginPermission(domain)) granted.push(domain);
  }
  return granted;
}

async function syncRegisteredContentScripts(settings) {
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_IDS.MAIN] });
  } catch (_) {
    // ignore missing registrations
  }

  const matches = buildMatchPatterns(settings.allowlistDomains);
  if (!matches.length) return;

  await chrome.scripting.registerContentScripts([{
    id: CONTENT_SCRIPT_IDS.MAIN,
    js: ["page-override.js"],
    matches,
    runAt: "document_start",
    world: "MAIN",
    persistAcrossSessions: true
  }]);
}

async function applyWebRtcPolicy(settings) {
  if (!chrome.privacy?.network?.webRTCIPHandlingPolicy) return;
  if (settings.toggles.webRTCProtection) {
    await chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: WEBRTC_POLICY });
    return;
  }
  await chrome.privacy.network.webRTCIPHandlingPolicy.clear({});
}

function networkTitle(settings) {
  const { status, timezone, country, region, city } = settings.verification;
  if (status === "verified") {
    return `Network verified${timezone ? ` (${timezone})` : ""}`;
  }
  if (status === "mismatch") {
    return `Network mismatch${country || region || city ? ` (${[city, region, country].filter(Boolean).join(", ")})` : ""}`;
  }
  if (status === "error") {
    return "Network verification failed";
  }
  return "Network exit unverified";
}

function compatibilityTitle(report) {
  if (report.status === "limited") return `Compatibility limited: ${report.message || "bootstrap warning"}`;
  if (report.status === "enabled") return "Front-end masking enabled";
  return "Waiting for page reload";
}

async function updateBadgeForTab(tab, settings = null) {
  if (!tab?.id || !tab.url || !isSupportedUrl(tab.url)) {
    if (tab?.id) {
      await chrome.action.setBadgeText({ tabId: tab.id, text: "" });
      await chrome.action.setTitle({ tabId: tab.id, title: "Locale Shield" });
    }
    return;
  }

  const normalizedSettings = settings || await readSettings();
  const hostname = extractHostname(tab.url);
  const enabled = isDomainAllowlisted(hostname, normalizedSettings);
  const report = getCompatibilityForHost(normalizedSettings, hostname);

  if (!enabled) {
    await chrome.action.setBadgeText({ tabId: tab.id, text: "" });
    await chrome.action.setTitle({ tabId: tab.id, title: "Locale Shield: site not allowlisted" });
    return;
  }

  const text = report.status === "limited" ? "WARN" : "ON";
  const color = report.status === "limited"
    ? "#b45309"
    : normalizedSettings.verification.status === "verified"
      ? "#0f766e"
      : "#2563eb";

  await chrome.action.setBadgeText({ tabId: tab.id, text });
  await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color });
  await chrome.action.setTitle({
    tabId: tab.id,
    title: `Locale Shield\n${networkTitle(normalizedSettings)}\n${compatibilityTitle(report)}`
  });
}

async function refreshAllBadges(settings = null) {
  const normalizedSettings = settings || await readSettings();
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => updateBadgeForTab(tab, normalizedSettings)));
}

async function requestDomainAccess(domains) {
  const normalizedDomains = [...new Set((domains || []).map((domain) => normalizeDomain(domain)).filter(Boolean))];
  if (!normalizedDomains.length) return { grantedDomains: [], deniedDomains: [] };

  const alreadyGranted = [];
  const needsPrompt = [];

  for (const domain of normalizedDomains) {
    if (await hasOriginPermission(domain)) {
      alreadyGranted.push(domain);
    } else {
      needsPrompt.push(domain);
    }
  }

  if (!needsPrompt.length) {
    return { grantedDomains: alreadyGranted, deniedDomains: [] };
  }

  const granted = await chrome.permissions.request({ origins: buildMatchPatterns(needsPrompt) });
  return {
    grantedDomains: granted ? normalizedDomains : alreadyGranted,
    deniedDomains: granted ? [] : needsPrompt
  };
}

async function removeDomainAccess(domains) {
  const normalizedDomains = [...new Set((domains || []).map((domain) => normalizeDomain(domain)).filter(Boolean))];
  if (!normalizedDomains.length) return;
  try {
    await chrome.permissions.remove({ origins: buildMatchPatterns(normalizedDomains) });
  } catch (error) {
    console.warn(`${LOG_PREFIX} Failed to remove host permissions`, error);
  }
}

function normalizeExecutionReport(rawReport) {
  return buildCompatibilityReport("", {
    status: rawReport?.status === "limited" ? "limited" : "enabled",
    message: String(rawReport?.message || "").trim(),
    issues: Array.isArray(rawReport?.issues) ? rawReport.issues : [],
    updatedAt: new Date().toISOString()
  });
}

async function saveCompatibilityReport(hostname, report) {
  const domain = normalizeDomain(hostname);
  if (!domain) return readSettings();
  return mutateSettings((settings) => {
    const compatibility = {
      ...(settings.verification.compatibility || {})
    };
    compatibility[domain] = {
      status: report.status,
      message: report.message,
      issues: report.issues,
      updatedAt: report.updatedAt
    };
    settings.verification.compatibility = compatibility;
    return settings;
  });
}

function pushConfigIntoPage(config) {
  const bridge = window.__localeShieldBridge;
  if (!bridge || typeof bridge.updateConfig !== "function") {
    return {
      status: "limited",
      message: "Bootstrap hook unavailable. Reload the page.",
      issues: ["bootstrap_unavailable"]
    };
  }
  return bridge.updateConfig(config);
}

async function applySiteMask(tabId, url, settings = null) {
  if (typeof tabId !== "number" || !isSupportedUrl(url)) return null;

  const normalizedSettings = settings || await readSettings();
  const hostname = extractHostname(url);
  if (!isDomainAllowlisted(hostname, normalizedSettings)) return null;

  const config = {
    profile: normalizedSettings.profile,
    toggles: {
      geolocation: normalizedSettings.toggles.geolocation,
      timezone: normalizedSettings.toggles.timezone,
      languages: normalizedSettings.toggles.languages
    }
  };

  let lastReport = {
    status: "limited",
    message: "Bootstrap hook unavailable. Reload the page.",
    issues: ["bootstrap_unavailable"],
    updatedAt: new Date().toISOString()
  };

  for (const waitMs of [0, 120, 320, 800]) {
    if (waitMs) await delay(waitMs);
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId, allFrames: false },
        world: "MAIN",
        injectImmediately: true,
        func: pushConfigIntoPage,
        args: [config]
      });
      const report = normalizeExecutionReport(result?.[0]?.result);
      report.message ||= report.status === "enabled"
        ? `Front-end masking active for ${normalizedSettings.profile.label}.`
        : "Bootstrap hook unavailable. Reload the page.";
      lastReport = report;
      if (report.status === "enabled") break;
    } catch (error) {
      lastReport = {
        status: "limited",
        message: error?.message || "Main-world injection failed.",
        issues: ["execute_script_failed"],
        updatedAt: new Date().toISOString()
      };
    }
  }

  const updatedSettings = await saveCompatibilityReport(hostname, lastReport);
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (tab) await updateBadgeForTab(tab, updatedSettings);
  return lastReport;
}

async function buildPopupState(url) {
  const settings = await readSettings();
  const hostname = extractHostname(url);
  const compatibility = getCompatibilityForHost(settings, hostname);
  const permissionGranted = hostname ? await hasOriginPermission(hostname) : false;
  return {
    settings,
    site: {
      hostname,
      supported: isSupportedUrl(url),
      allowlisted: isDomainAllowlisted(hostname, settings),
      permissionGranted,
      compatibility
    }
  };
}

async function fetchVerificationSnapshot() {
  let lastError = "Verification providers failed.";
  for (const provider of VERIFICATION_PROVIDERS) {
    const { signal, clear } = createAbortSignal(6000);
    try {
      const response = await fetch(provider.url, {
        method: "GET",
        cache: "no-store",
        signal
      });
      const data = await response.json();
      const snapshot = provider.parse(data);
      if (!snapshot) throw new Error(`Unexpected response from ${provider.name}`);
      clear();
      return {
        ...snapshot,
        provider: provider.name
      };
    } catch (error) {
      clear();
      lastError = error?.message || `${provider.name} failed`;
    }
  }
  throw new Error(lastError);
}

async function runVerification() {
  const settings = await readSettings();
  try {
    const snapshot = await fetchVerificationSnapshot();
    const status = snapshot.timezone && snapshot.timezone === settings.profile.timezone ? "verified" : "mismatch";
    const note = status === "verified"
      ? `${snapshot.city || snapshot.region || snapshot.country || "Current exit"} matches ${settings.profile.timezone}.`
      : `${snapshot.city || snapshot.region || snapshot.country || "Current exit"} reports ${snapshot.timezone || "an unknown timezone"}, expected ${settings.profile.timezone}.`;

    const updatedSettings = await mutateSettings((draft) => {
      draft.verification = {
        ...draft.verification,
        status,
        lastCheckedAt: new Date().toISOString(),
        ip: snapshot.ip,
        city: snapshot.city,
        region: snapshot.region,
        country: snapshot.country,
        timezone: snapshot.timezone,
        provider: snapshot.provider,
        note
      };
      return draft;
    });

    await refreshAllBadges(updatedSettings);
    return { ok: true, settings: updatedSettings };
  } catch (error) {
    const updatedSettings = await mutateSettings((draft) => {
      draft.verification = {
        ...draft.verification,
        status: "error",
        lastCheckedAt: new Date().toISOString(),
        provider: "",
        note: error?.message || "Verification providers failed."
      };
      return draft;
    });

    await refreshAllBadges(updatedSettings);
    return { ok: false, settings: updatedSettings, error: error?.message || "verification_failed" };
  }
}

async function syncEnvironment() {
  const settings = await readSettings();
  const grantedAllowlist = await getGrantedAllowlist(settings.allowlistDomains);
  const needsRewrite = grantedAllowlist.length !== settings.allowlistDomains.length;
  const syncedSettings = needsRewrite
    ? await writeSettings({
      ...settings,
      allowlistDomains: grantedAllowlist
    })
    : settings;

  await applyWebRtcPolicy(syncedSettings);
  await syncRegisteredContentScripts(syncedSettings);
  await refreshAllBadges(syncedSettings);
  return syncedSettings;
}

chrome.runtime.onInstalled.addListener(() => {
  syncEnvironment().catch((error) => console.error(`${LOG_PREFIX} onInstalled failed`, error));
});

chrome.runtime.onStartup.addListener(() => {
  syncEnvironment().catch((error) => console.error(`${LOG_PREFIX} onStartup failed`, error));
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab) return;
  const settings = await readSettings();
  await updateBadgeForTab(tab, settings);
  if (tab.url && isDomainAllowlisted(extractHostname(tab.url), settings)) {
    await applySiteMask(tab.id, tab.url, settings).catch((error) => {
      console.warn(`${LOG_PREFIX} applySiteMask on activation failed`, error);
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const relevantChange = changeInfo.status === "loading" || typeof changeInfo.url === "string";
  if (!relevantChange || !tab?.url) return;
  readSettings()
    .then(async (settings) => {
      await updateBadgeForTab(tab, settings);
      if (isDomainAllowlisted(extractHostname(tab.url), settings)) {
        await applySiteMask(tabId, tab.url, settings);
      }
    })
    .catch((error) => console.warn(`${LOG_PREFIX} tab update sync failed`, error));
});

chrome.permissions.onRemoved.addListener(() => {
  syncEnvironment().catch((error) => console.error(`${LOG_PREFIX} permissions sync failed`, error));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GET_STATE") {
    buildPopupState(message?.url || sender?.tab?.url || "")
      .then((state) => sendResponse({ ok: true, state }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "state_failed" }));
    return true;
  }

  if (message?.type === "TOGGLE_DOMAIN") {
    const hostname = normalizeDomain(message?.domain || extractHostname(message?.url || ""));
    if (!hostname) {
      sendResponse({ ok: false, error: "invalid_domain" });
      return false;
    }

    (async () => {
      const currentSettings = await readSettings();
      const currentlyAllowlisted = currentSettings.allowlistDomains.includes(hostname);
      const shouldEnable = typeof message?.enable === "boolean" ? message.enable : !currentlyAllowlisted;

      if (shouldEnable) {
        const permissionResult = await requestDomainAccess([hostname]);
        if (!permissionResult.grantedDomains.includes(hostname)) {
          return { ok: false, error: "site_permission_denied" };
        }
      } else {
        await removeDomainAccess([hostname]);
      }

      const updatedSettings = await mutateSettings((draft) => {
        const nextAllowlist = new Set(draft.allowlistDomains);
        if (shouldEnable) {
          nextAllowlist.add(hostname);
        } else {
          nextAllowlist.delete(hostname);
          delete draft.verification.compatibility[hostname];
        }
        draft.allowlistDomains = [...nextAllowlist];
        return draft;
      });

      const grantedAllowlist = await getGrantedAllowlist(updatedSettings.allowlistDomains);
      const finalSettings = grantedAllowlist.length === updatedSettings.allowlistDomains.length
        ? updatedSettings
        : await writeSettings({
          ...updatedSettings,
          allowlistDomains: grantedAllowlist
        });

      await applyWebRtcPolicy(finalSettings);
      await syncRegisteredContentScripts(finalSettings);
      await refreshAllBadges(finalSettings);

      return {
        ok: true,
        reloadRequired: true,
        settings: finalSettings
      };
    })()
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "toggle_failed" }));

    return true;
  }

  if (message?.type === "SAVE_SETTINGS") {
    const incoming = normalizeSettings(message?.payload || {});
    (async () => {
      const current = await readSettings();
      const addedDomains = incoming.allowlistDomains.filter((domain) => !current.allowlistDomains.includes(domain));
      const removedDomains = current.allowlistDomains.filter((domain) => !incoming.allowlistDomains.includes(domain));
      const permissionResult = await requestDomainAccess(addedDomains);
      const allowedNewDomains = permissionResult.grantedDomains.filter((domain) => addedDomains.includes(domain));
      const deniedDomains = permissionResult.deniedDomains || [];

      const nextAllowlist = [
        ...current.allowlistDomains.filter((domain) => !removedDomains.includes(domain)),
        ...allowedNewDomains
      ];

      incoming.allowlistDomains = [...new Set(nextAllowlist)];
      incoming.verification = {
        ...current.verification,
        compatibility: Object.fromEntries(
          incoming.allowlistDomains
            .map((domain) => [domain, current.verification.compatibility?.[domain]])
            .filter(([, report]) => report)
        )
      };

      if (removedDomains.length) {
        await removeDomainAccess(removedDomains);
      }

      await writeSettings(incoming);
      const syncedSettings = await syncEnvironment();

      return {
        ok: true,
        settings: syncedSettings,
        warnings: deniedDomains.length ? [`Permissions were denied for: ${deniedDomains.join(", ")}`] : []
      };
    })()
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "save_failed" }));
    return true;
  }

  if (message?.type === "RUN_VERIFICATION") {
    runVerification()
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "verification_failed" }));
    return true;
  }

  return false;
});
