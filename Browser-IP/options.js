import {
  SETTINGS_KEY,
  DEFAULT_SETTINGS,
  normalizeSettings,
  buildOriginPatterns,
  buildMatchPatterns
} from "./settings.js";

const STATUS_LABELS = {
  unverified: "\u672a\u6821\u9a8c",
  verified: "\u5df2\u6821\u9a8c",
  mismatch: "\u4e0d\u5339\u914d",
  error: "\u6821\u9a8c\u5931\u8d25"
};

const formStatus = document.getElementById("formStatus");
const saveButton = document.getElementById("saveSettings");
const verifyButton = document.getElementById("verifyNetwork");

const profileLabelInput = document.getElementById("profileLabel");
const profileTimezoneInput = document.getElementById("profileTimezone");
const profileLatitudeInput = document.getElementById("profileLatitude");
const profileLongitudeInput = document.getElementById("profileLongitude");
const profileAccuracyInput = document.getElementById("profileAccuracy");
const profileLocaleInput = document.getElementById("profileLocale");
const profileLanguagesInput = document.getElementById("profileLanguages");
const allowlistDomainsInput = document.getElementById("allowlistDomains");

const toggleGeolocationInput = document.getElementById("toggleGeolocation");
const toggleTimezoneInput = document.getElementById("toggleTimezone");
const toggleLanguagesInput = document.getElementById("toggleLanguages");
const toggleWebrtcInput = document.getElementById("toggleWebrtc");

const verificationStatus = document.getElementById("verificationStatus");
const verificationTime = document.getElementById("verificationTime");
const verificationIp = document.getElementById("verificationIp");
const verificationRegion = document.getElementById("verificationRegion");
const verificationTimezone = document.getElementById("verificationTimezone");
const verificationProvider = document.getElementById("verificationProvider");
const verificationNote = document.getElementById("verificationNote");
const verificationDetails = document.getElementById("verificationDetails");
const buildInfo = document.getElementById("buildInfo");

function setStatus(message) {
  formStatus.textContent = message;
}

function renderBuildInfo() {
  const manifest = chrome.runtime.getManifest();
  buildInfo.textContent = `\u7248\u672c\uff1a${manifest.version}`;
}

function arrayToLines(values) {
  return (values || []).join("\n");
}

function linesToArray(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function readSettings() {
  const data = await chrome.storage.local.get([SETTINGS_KEY]);
  return normalizeSettings(data[SETTINGS_KEY] || DEFAULT_SETTINGS);
}

async function hasDomainPermission(domain) {
  const origins = buildOriginPatterns(domain);
  if (!origins.length) return false;
  return chrome.permissions.contains({ origins });
}

async function requestDomainAccess(domains) {
  const grantedDomains = [];
  const pendingDomains = [];

  for (const domain of domains) {
    if (await hasDomainPermission(domain)) {
      grantedDomains.push(domain);
    } else {
      pendingDomains.push(domain);
    }
  }

  if (!pendingDomains.length) {
    return { grantedDomains, deniedDomains: [] };
  }

  const granted = await chrome.permissions.request({ origins: buildMatchPatterns(pendingDomains) });
  return {
    grantedDomains: granted ? [...new Set([...grantedDomains, ...pendingDomains])] : grantedDomains,
    deniedDomains: granted ? [] : pendingDomains
  };
}

function renderVerification(settings) {
  const verification = settings.verification || {};
  verificationStatus.textContent = STATUS_LABELS[verification.status] || "\u672a\u6821\u9a8c";
  verificationTime.textContent = verification.lastCheckedAt
    ? new Date(verification.lastCheckedAt).toLocaleString()
    : "\u4ece\u672a";
  verificationIp.textContent = verification.ip || "\u672a\u77e5";
  verificationRegion.textContent = [verification.city, verification.region, verification.country].filter(Boolean).join(", ") || "\u672a\u77e5";
  verificationTimezone.textContent = verification.timezone || "\u672a\u77e5";
  verificationProvider.textContent = verification.provider || "\u65e0";
  verificationNote.textContent = verification.note || "\u8bf7\u5728\u8fde\u63a5 VPN \u6216\u4ee3\u7406\u540e\u518d\u6267\u884c\u6821\u9a8c\u3002";
  verificationDetails.textContent = verification.details || (verification.attempts?.length ? verification.attempts.join("\n") : "\u6682\u65e0\u8bca\u65ad\u4fe1\u606f");
}

function renderSettings(settings) {
  profileLabelInput.value = settings.profile.label;
  profileTimezoneInput.value = settings.profile.timezone;
  profileLatitudeInput.value = settings.profile.latitude;
  profileLongitudeInput.value = settings.profile.longitude;
  profileAccuracyInput.value = settings.profile.accuracyMeters;
  profileLocaleInput.value = settings.profile.locale;
  profileLanguagesInput.value = arrayToLines(settings.profile.languages);
  allowlistDomainsInput.value = arrayToLines(settings.allowlistDomains);

  toggleGeolocationInput.checked = settings.toggles.geolocation;
  toggleTimezoneInput.checked = settings.toggles.timezone;
  toggleLanguagesInput.checked = settings.toggles.languages;
  toggleWebrtcInput.checked = settings.toggles.webRTCProtection;

  renderVerification(settings);
}

function collectSettings() {
  return normalizeSettings({
    allowlistDomains: linesToArray(allowlistDomainsInput.value),
    profile: {
      label: profileLabelInput.value,
      timezone: profileTimezoneInput.value,
      latitude: profileLatitudeInput.value,
      longitude: profileLongitudeInput.value,
      accuracyMeters: profileAccuracyInput.value,
      locale: profileLocaleInput.value,
      languages: linesToArray(profileLanguagesInput.value)
    },
    toggles: {
      geolocation: toggleGeolocationInput.checked,
      timezone: toggleTimezoneInput.checked,
      languages: toggleLanguagesInput.checked,
      webRTCProtection: toggleWebrtcInput.checked
    }
  });
}

saveButton.addEventListener("click", async () => {
  setStatus("\u6b63\u5728\u4fdd\u5b58\u8bbe\u7f6e...");
  try {
    const current = await readSettings();
    const next = collectSettings();
    const addedDomains = next.allowlistDomains.filter((domain) => !current.allowlistDomains.includes(domain));
    const permissionResult = await requestDomainAccess(addedDomains);

    next.allowlistDomains = next.allowlistDomains.filter(
      (domain) => current.allowlistDomains.includes(domain) || permissionResult.grantedDomains.includes(domain)
    );

    const response = await chrome.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      payload: next
    });

    if (!response?.ok) {
      throw new Error(response?.error || "save_failed");
    }

    renderSettings(response.settings);

    const warnings = [];
    if (permissionResult.deniedDomains.length) {
      warnings.push(`\u4f60\u62d2\u7edd\u4e86\u4ee5\u4e0b\u57df\u540d\u7684\u8bbf\u95ee\u6743\u9650\uff1a${permissionResult.deniedDomains.join(", ")}`);
    }
    if (response.warnings?.length) {
      warnings.push(...response.warnings);
    }

    setStatus(warnings.length ? warnings.join(" ") : "\u8bbe\u7f6e\u5df2\u4fdd\u5b58\u3002");
  } catch (error) {
    console.error("[\u5c5e\u5730\u9690\u79c1\u76fe] Failed to save settings", error);
    setStatus(`\u4fdd\u5b58\u5931\u8d25\uff1a${error.message}`);
  }
});

verifyButton.addEventListener("click", async () => {
  setStatus("\u6b63\u5728\u6267\u884c\u7f51\u7edc\u6821\u9a8c...");
  try {
    const response = await chrome.runtime.sendMessage({ type: "RUN_VERIFICATION" });
    if (!response?.settings) {
      throw new Error(response?.error || "verification_failed");
    }

    renderVerification(response.settings);
    setStatus(response.ok ? "\u7f51\u7edc\u6821\u9a8c\u5b8c\u6210\u3002" : `\u7f51\u7edc\u6821\u9a8c\u8b66\u544a\uff1a${response.error}`);
  } catch (error) {
    console.error("[\u5c5e\u5730\u9690\u79c1\u76fe] Failed to verify network", error);
    setStatus(`\u7f51\u7edc\u6821\u9a8c\u5931\u8d25\uff1a${error.message}`);
  }
});

readSettings()
  .then((settings) => {
    renderSettings(settings);
    setStatus("\u5c31\u7eea\u3002");
  })
  .catch((error) => {
    console.error("[\u5c5e\u5730\u9690\u79c1\u76fe] Failed to load settings", error);
    setStatus(`\u52a0\u8f7d\u5931\u8d25\uff1a${error.message}`);
  });

renderBuildInfo();
