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
  getCompatibilityForHost
} from "./settings.js";

const LOG_PREFIX = "[\u5c5e\u5730\u9690\u79c1\u76fe]";
const WEBRTC_POLICY = "disable_non_proxied_udp";
const VERIFICATION_PROVIDERS = [
  {
    name: "api.ip.sb",
    url: "https://api.ip.sb/geoip",
    parse(data) {
      if (!data) return null;
      return {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country,
        timezone: data.timezone
      };
    }
  },
  {
    name: "ipwho.is",
    url: "https://ipwho.is/",
    parse(data) {
      if (!data || data.success === false) return null;
      return {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country,
        timezone: data.timezone?.id || data.timezone
      };
    }
  },
  {
    name: "ipinfo.io",
    url: "https://ipinfo.io/json",
    parse(data) {
      if (!data || data.error) return null;
      return {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country,
        timezone: data.timezone
      };
    }
  },
  {
    name: "ipapi.co",
    url: "https://ipapi.co/json/",
    parse(data) {
      if (!data || data.error) return null;
      return {
        ip: data.ip,
        city: String(data.city || "").trim(),
        region: String(data.region || "").trim(),
        country: String(data.country_name || data.country || "").trim(),
        timezone: String(data.timezone || "").trim()
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

function trimText(value) {
  return String(value || "").trim();
}

function normalizeVerificationSnapshot(snapshot) {
  if (!snapshot) return null;
  return {
    ip: trimText(snapshot.ip),
    city: trimText(snapshot.city),
    region: trimText(snapshot.region),
    country: trimText(snapshot.country),
    timezone: trimText(snapshot.timezone)
  };
}

function isUsableVerificationSnapshot(snapshot) {
  return Boolean(snapshot?.ip || snapshot?.timezone || snapshot?.city || snapshot?.region || snapshot?.country);
}

function extractProviderMessage(data) {
  if (!data || typeof data !== "object") return "";
  const candidates = [
    data.message,
    data.reason,
    data.error,
    data.detail,
    data.description,
    data.info
  ];
  return trimText(candidates.find((value) => typeof value === "string" && value.trim()));
}

function parseVerificationJson(providerName, text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    const snippet = trimText(text).slice(0, 120);
    throw new Error(`${providerName} \u8fd4\u56de\u4e86\u975e JSON \u5185\u5bb9${snippet ? `: ${snippet}` : ""}`);
  }
}

function buildVerificationDetailText(snapshot, attempts) {
  const lines = [];
  if (snapshot?.provider) {
    lines.push(`成功来源: ${snapshot.provider}`);
  }
  if (snapshot?.ip) {
    lines.push(`IP: ${snapshot.ip}`);
  }
  if (snapshot?.timezone) {
    lines.push(`时区: ${snapshot.timezone}`);
  }
  if (snapshot?.city || snapshot?.region || snapshot?.country) {
    lines.push(`地区: ${[snapshot.city, snapshot.region, snapshot.country].filter(Boolean).join(", ")}`);
  }
  if (attempts?.length) {
    lines.push("尝试链:");
    lines.push(...attempts);
  }
  return lines.join("\n");
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
    return `\u7f51\u7edc\u5df2\u6821\u9a8c${timezone ? ` (${timezone})` : ""}`;
  }
  if (status === "mismatch") {
    return `\u7f51\u7edc\u4e0d\u5339\u914d${country || region || city ? ` (${[city, region, country].filter(Boolean).join(", ")})` : ""}`;
  }
  if (status === "error") {
    return "\u7f51\u7edc\u6821\u9a8c\u5931\u8d25";
  }
  return "\u7f51\u7edc\u51fa\u53e3\u672a\u6821\u9a8c";
}

function compatibilityTitle(report) {
  if (report.status === "limited") return `\u517c\u5bb9\u6027\u53d7\u9650\uff1a${report.message || "\u542f\u52a8\u6ce8\u5165\u5f02\u5e38"}`;
  if (report.status === "enabled") return "\u524d\u7aef\u4f2a\u88c5\u5df2\u542f\u7528";
  return "\u7b49\u5f85\u9875\u9762\u5237\u65b0";
}

async function updateBadgeForTab(tab, settings = null) {
  if (!tab?.id || !tab.url || !isSupportedUrl(tab.url)) {
    if (tab?.id) {
      await chrome.action.setBadgeText({ tabId: tab.id, text: "" });
      await chrome.action.setTitle({ tabId: tab.id, title: "\u5c5e\u5730\u9690\u79c1\u76fe" });
    }
    return;
  }

  const normalizedSettings = settings || await readSettings();
  const hostname = extractHostname(tab.url);
  const enabled = isDomainAllowlisted(hostname, normalizedSettings);
  const report = getCompatibilityForHost(normalizedSettings, hostname);

  if (!enabled) {
    await chrome.action.setBadgeText({ tabId: tab.id, text: "" });
    await chrome.action.setTitle({ tabId: tab.id, title: "\u5c5e\u5730\u9690\u79c1\u76fe\uff1a\u5f53\u524d\u7ad9\u70b9\u672a\u52a0\u5165\u767d\u540d\u5355" });
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
    title: `\u5c5e\u5730\u9690\u79c1\u76fe\n${networkTitle(normalizedSettings)}\n${compatibilityTitle(report)}`
  });
}

async function refreshAllBadges(settings = null) {
  const normalizedSettings = settings || await readSettings();
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => updateBadgeForTab(tab, normalizedSettings)));
}

async function removeDomainAccess(domains) {
  const normalizedDomains = [...new Set((domains || []).map((domain) => normalizeDomain(domain)).filter(Boolean))];
  if (!normalizedDomains.length) return;
  try {
    await chrome.permissions.remove({ origins: buildMatchPatterns(normalizedDomains) });
  } catch (error) {
    console.warn(`${LOG_PREFIX} failed to remove host permissions`, error);
  }
}

function normalizeExecutionReport(rawReport) {
  return {
    status: rawReport?.status === "limited" ? "limited" : "enabled",
    message: String(rawReport?.message || "").trim(),
    issues: Array.isArray(rawReport?.issues) ? rawReport.issues : [],
    updatedAt: new Date().toISOString()
  };
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

function shouldDisableTimezoneHooks(hostname) {
  const domain = normalizeDomain(hostname);
  return domain === "channels.weixin.qq.com" || domain.endsWith(".weixin.qq.com");
}

function pushConfigIntoPage(config) {
  const bridge = window.__localeShieldBridge;
  if (!bridge || typeof bridge.updateConfig !== "function") {
    return {
      status: "limited",
      message: "\u4e3b\u4e16\u754c\u6ce8\u5165\u6ca1\u6709\u6302\u4e0a\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u3002",
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
      timezone: normalizedSettings.toggles.timezone && !shouldDisableTimezoneHooks(hostname),
      languages: normalizedSettings.toggles.languages
    }
  };

  let lastReport = {
    status: "limited",
    message: "\u4e3b\u4e16\u754c\u6ce8\u5165\u6ca1\u6709\u6302\u4e0a\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u3002",
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
        ? `${shouldDisableTimezoneHooks(hostname)
          ? "\u5b89\u5168\u6a21\u5f0f\u5df2\u542f\u7528\uff08\u5df2\u8df3\u8fc7\u65f6\u533a Hook\uff09\uff0c"
          : "\u524d\u7aef\u4f2a\u88c5\u5df2\u542f\u7528\uff0c"}${normalizedSettings.profile.label}`
        : "\u4e3b\u4e16\u754c\u6ce8\u5165\u6ca1\u6709\u6302\u4e0a\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u3002";
      lastReport = report;
      if (report.status === "enabled") break;
    } catch (error) {
      lastReport = {
        status: "limited",
        message: error?.message || "\u4e3b\u4e16\u754c\u811a\u672c\u6267\u884c\u5931\u8d25\u3002",
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
  const attempts = [];
  for (const provider of VERIFICATION_PROVIDERS) {
    const { signal, clear } = createAbortSignal(6000);
    try {
      const response = await fetch(provider.url, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json, text/plain, */*"
        },
        signal
      });
      const text = await response.text();
      const data = parseVerificationJson(provider.name, text);
      const detail = extractProviderMessage(data);

      if (!response.ok) {
        throw new Error(`${provider.name} HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
      }

      const snapshot = normalizeVerificationSnapshot(provider.parse(data));
      if (!isUsableVerificationSnapshot(snapshot)) {
        throw new Error(`${provider.name} \u8fd4\u56de\u7684\u6570\u636e\u4e0d\u5b8c\u6574${detail ? `: ${detail}` : ""}`);
      }

      clear();
      attempts.push(`${provider.name}: OK`);
      return {
        ...snapshot,
        provider: provider.name,
        attempts
      };
    } catch (error) {
      clear();
      attempts.push(error?.message || `${provider.name} failed`);
    }
  }
  const failure = new Error(attempts.length ? attempts.join(" | ") : "verification_failed");
  failure.attempts = attempts;
  throw failure;
}

async function runVerification() {
  const settings = await readSettings();
  try {
    const snapshot = await fetchVerificationSnapshot();
    const status = snapshot.timezone && snapshot.timezone === settings.profile.timezone ? "verified" : "mismatch";
    const note = status === "verified"
      ? `${snapshot.city || snapshot.region || snapshot.country || "\u5f53\u524d\u51fa\u53e3"} \u4e0e ${settings.profile.timezone} \u4e00\u81f4\u3002`
      : `${snapshot.city || snapshot.region || snapshot.country || "\u5f53\u524d\u51fa\u53e3"} \u62a5\u544a\u7684\u65f6\u533a\u662f ${snapshot.timezone || "\u672a\u77e5"}\uff0c\u9884\u671f\u662f ${settings.profile.timezone}\u3002`;

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
        note,
        details: buildVerificationDetailText(snapshot, snapshot.attempts),
        attempts: snapshot.attempts || []
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
        ip: "",
        city: "",
        region: "",
        country: "",
        timezone: "",
        provider: "",
        note: error?.message || "\u7f51\u7edc\u6821\u9a8c\u5931\u8d25",
        details: buildVerificationDetailText(null, error?.attempts || []),
        attempts: Array.isArray(error?.attempts) ? error.attempts : []
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

if (chrome.permissions?.onRemoved) {
  chrome.permissions.onRemoved.addListener(() => {
    syncEnvironment().catch((error) => console.error(`${LOG_PREFIX} permissions sync failed`, error));
  });
}

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

      if (shouldEnable && !(await hasOriginPermission(hostname))) {
        return { ok: false, error: "site_permission_missing" };
      }

      if (!shouldEnable) {
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

      const finalSettings = await syncEnvironment();
      return {
        ok: true,
        reloadRequired: true,
        settings: finalSettings,
        changed: updatedSettings.allowlistDomains.includes(hostname) === shouldEnable
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
      const requestedAllowlist = incoming.allowlistDomains.slice();
      const grantedAllowlist = await getGrantedAllowlist(requestedAllowlist);
      const removedDomains = current.allowlistDomains.filter((domain) => !grantedAllowlist.includes(domain));
      const deniedDomains = requestedAllowlist.filter((domain) => !grantedAllowlist.includes(domain));

      incoming.allowlistDomains = grantedAllowlist;
      incoming.verification = {
        ...current.verification,
        compatibility: Object.fromEntries(
          grantedAllowlist
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
        warnings: deniedDomains.length
          ? [`\u90e8\u5206\u57df\u540d\u6ca1\u6709\u6388\u6743\uff0c\u5df2\u81ea\u52a8\u5ffd\u7565\uff1a${deniedDomains.join(", ")}`]
          : []
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
