import {
  SETTINGS_KEY,
  DEFAULT_SETTINGS,
  normalizeSettings
} from "./settings.js";

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

function setStatus(message) {
  formStatus.textContent = message;
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

function renderVerification(settings) {
  const verification = settings.verification || {};
  verificationStatus.textContent = verification.status || "unverified";
  verificationTime.textContent = verification.lastCheckedAt
    ? new Date(verification.lastCheckedAt).toLocaleString()
    : "Never";
  verificationIp.textContent = verification.ip || "Unknown";
  verificationRegion.textContent = [verification.city, verification.region, verification.country].filter(Boolean).join(", ") || "Unknown";
  verificationTimezone.textContent = verification.timezone || "Unknown";
  verificationProvider.textContent = verification.provider || "None";
  verificationNote.textContent = verification.note || "Run the check after your VPN or proxy is connected.";
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
  setStatus("Saving settings...");
  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      payload: collectSettings()
    });

    if (!response?.ok) {
      throw new Error(response?.error || "save_failed");
    }

    renderSettings(response.settings);
    setStatus(response.warnings?.length ? response.warnings.join(" ") : "Settings saved.");
  } catch (error) {
    console.error("[Locale Shield] Failed to save settings", error);
    setStatus(`Failed to save settings: ${error.message}`);
  }
});

verifyButton.addEventListener("click", async () => {
  setStatus("Running network verification...");
  try {
    const response = await chrome.runtime.sendMessage({ type: "RUN_VERIFICATION" });
    if (!response?.settings) {
      throw new Error(response?.error || "verification_failed");
    }

    renderVerification(response.settings);
    setStatus(response.ok ? "Network verification finished." : `Verification warning: ${response.error}`);
  } catch (error) {
    console.error("[Locale Shield] Failed to verify network", error);
    setStatus(`Verification failed: ${error.message}`);
  }
});

readSettings()
  .then((settings) => {
    renderSettings(settings);
    setStatus("Ready.");
  })
  .catch((error) => {
    console.error("[Locale Shield] Failed to load settings", error);
    setStatus(`Failed to load settings: ${error.message}`);
  });
