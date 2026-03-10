export const SETTINGS_KEY = "locale_shield_settings_v1";
export const CONTENT_SCRIPT_IDS = Object.freeze({
  MAIN: "locale-shield-main-world"
});

export const DEFAULT_SETTINGS = Object.freeze({
  allowlistDomains: [],
  profile: Object.freeze({
    label: "Hong Kong (Sample)",
    latitude: 22.3193,
    longitude: 114.1694,
    accuracyMeters: 800,
    timezone: "Asia/Hong_Kong",
    locale: "zh-CN",
    languages: Object.freeze(["zh-CN", "zh", "en-US"])
  }),
  toggles: Object.freeze({
    geolocation: true,
    timezone: true,
    languages: true,
    webRTCProtection: true
  }),
  verification: Object.freeze({
    status: "unverified",
    lastCheckedAt: "",
    ip: "",
    city: "",
    region: "",
    country: "",
    timezone: "",
    provider: "",
    note: "",
    compatibility: Object.freeze({})
  })
});

const NETWORK_STATUSES = new Set(["unverified", "verified", "mismatch", "error"]);
const COMPATIBILITY_STATUSES = new Set(["unknown", "enabled", "limited"]);

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  if (number < min || number > max) return fallback;
  return number;
}

function normalizeString(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeLocale(value, fallback) {
  try {
    const [canonical] = Intl.getCanonicalLocales(normalizeString(value));
    return canonical || fallback;
  } catch (_) {
    return fallback;
  }
}

function normalizeTimezone(value, fallback) {
  const candidate = normalizeString(value);
  if (!candidate) return fallback;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch (_) {
    return fallback;
  }
}

export function normalizeDomain(value) {
  let candidate = normalizeString(value).toLowerCase();
  if (!candidate) return "";
  if (!candidate.includes("://")) candidate = `https://${candidate}`;
  try {
    const url = new URL(candidate);
    const hostname = normalizeString(url.hostname).toLowerCase().replace(/\.+$/, "");
    if (!hostname || hostname.includes("*")) return "";
    return hostname;
  } catch (_) {
    return "";
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeLanguages(values, fallback) {
  const rawValues = Array.isArray(values)
    ? values
    : String(values ?? "")
      .split(/[\r\n,]+/)
      .map((item) => item.trim());

  const normalized = unique(
    rawValues
      .map((value) => normalizeLocale(value, ""))
      .filter(Boolean)
  );

  return normalized.length ? normalized : fallback.slice();
}

function normalizeProfile(rawProfile = {}) {
  const fallback = cloneDefaults().profile;
  return {
    label: normalizeString(rawProfile.label, fallback.label),
    latitude: clampNumber(rawProfile.latitude, fallback.latitude, -90, 90),
    longitude: clampNumber(rawProfile.longitude, fallback.longitude, -180, 180),
    accuracyMeters: clampNumber(rawProfile.accuracyMeters, fallback.accuracyMeters, 1, 100000),
    timezone: normalizeTimezone(rawProfile.timezone, fallback.timezone),
    locale: normalizeLocale(rawProfile.locale, fallback.locale),
    languages: normalizeLanguages(rawProfile.languages, fallback.languages)
  };
}

function normalizeToggles(rawToggles = {}) {
  const fallback = cloneDefaults().toggles;
  return {
    geolocation: rawToggles.geolocation !== false && fallback.geolocation === true,
    timezone: rawToggles.timezone !== false && fallback.timezone === true,
    languages: rawToggles.languages !== false && fallback.languages === true,
    webRTCProtection: rawToggles.webRTCProtection !== false && fallback.webRTCProtection === true
  };
}

function normalizeCompatibility(rawCompatibility = {}) {
  const normalized = {};
  Object.entries(rawCompatibility || {}).forEach(([hostname, report]) => {
    const domain = normalizeDomain(hostname);
    if (!domain) return;
    const status = COMPATIBILITY_STATUSES.has(report?.status) ? report.status : "unknown";
    normalized[domain] = {
      status,
      message: normalizeString(report?.message).slice(0, 240),
      issues: unique((Array.isArray(report?.issues) ? report.issues : []).map((item) => normalizeString(item)).filter(Boolean)),
      updatedAt: normalizeString(report?.updatedAt)
    };
  });
  return normalized;
}

function normalizeVerification(rawVerification = {}) {
  const fallback = cloneDefaults().verification;
  const status = NETWORK_STATUSES.has(rawVerification.status) ? rawVerification.status : fallback.status;
  return {
    status,
    lastCheckedAt: normalizeString(rawVerification.lastCheckedAt),
    ip: normalizeString(rawVerification.ip),
    city: normalizeString(rawVerification.city),
    region: normalizeString(rawVerification.region),
    country: normalizeString(rawVerification.country),
    timezone: normalizeString(rawVerification.timezone),
    provider: normalizeString(rawVerification.provider),
    note: normalizeString(rawVerification.note).slice(0, 320),
    compatibility: normalizeCompatibility(rawVerification.compatibility)
  };
}

export function normalizeSettings(rawSettings = {}) {
  const allowlistDomains = unique(
    (Array.isArray(rawSettings.allowlistDomains) ? rawSettings.allowlistDomains : [])
      .map((value) => normalizeDomain(value))
      .filter(Boolean)
  );

  return {
    allowlistDomains,
    profile: normalizeProfile(rawSettings.profile),
    toggles: normalizeToggles(rawSettings.toggles),
    verification: normalizeVerification(rawSettings.verification)
  };
}

export function extractHostname(url) {
  try {
    const parsed = new URL(String(url || ""));
    return normalizeDomain(parsed.hostname);
  } catch (_) {
    return "";
  }
}

export function isSupportedUrl(url) {
  try {
    const parsed = new URL(String(url || ""));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_) {
    return false;
  }
}

export function isDomainAllowlisted(hostname, settings) {
  const domain = normalizeDomain(hostname);
  if (!domain) return false;
  return normalizeSettings(settings).allowlistDomains.includes(domain);
}

export function buildOriginPatterns(domain) {
  const hostname = normalizeDomain(domain);
  if (!hostname) return [];
  return [`http://${hostname}/*`, `https://${hostname}/*`];
}

export function buildMatchPatterns(domains) {
  return unique(
    (Array.isArray(domains) ? domains : [])
      .flatMap((domain) => buildOriginPatterns(domain))
  );
}

export function buildCompatibilityReport(hostname, report = {}) {
  const domain = normalizeDomain(hostname);
  const status = COMPATIBILITY_STATUSES.has(report.status) ? report.status : "unknown";
  return {
    domain,
    status,
    message: normalizeString(report.message).slice(0, 240),
    issues: unique((Array.isArray(report.issues) ? report.issues : []).map((item) => normalizeString(item)).filter(Boolean)),
    updatedAt: normalizeString(report.updatedAt) || new Date().toISOString()
  };
}

export function getCompatibilityForHost(settings, hostname) {
  const domain = normalizeDomain(hostname);
  if (!domain) return { status: "unknown", message: "", issues: [], updatedAt: "" };
  return normalizeSettings(settings).verification.compatibility[domain] || {
    status: "unknown",
    message: "",
    issues: [],
    updatedAt: ""
  };
}

export function summarizeNetworkState(settings) {
  const verification = normalizeSettings(settings).verification;
  const status = verification.status;
  if (status === "verified") {
    return {
      tone: "good",
      label: "Network exit verified",
      detail: verification.note || `${verification.country || verification.region || verification.city || "Current exit"} matches ${verification.timezone || "the configured timezone"}.`
    };
  }
  if (status === "mismatch") {
    return {
      tone: "warn",
      label: "Network exit mismatch",
      detail: verification.note || "The public IP region does not match the configured timezone."
    };
  }
  if (status === "error") {
    return {
      tone: "warn",
      label: "Network exit check failed",
      detail: verification.note || "Verification services were unreachable."
    };
  }
  return {
    tone: "warn",
    label: "Network exit unverified",
    detail: "The public IP still needs to be checked with your VPN or proxy exit."
  };
}

export function summarizeFrontendState(settings, hostname) {
  const normalized = normalizeSettings(settings);
  if (!isDomainAllowlisted(hostname, normalized)) {
    return {
      tone: "muted",
      label: "Front-end masking off",
      detail: "This hostname is not on the allowlist."
    };
  }

  const compatibility = getCompatibilityForHost(normalized, hostname);
  if (compatibility.status === "limited") {
    return {
      tone: "warn",
      label: "Compatibility limited",
      detail: compatibility.message || "The page bootstrap hook did not apply cleanly."
    };
  }
  if (compatibility.status === "enabled") {
    return {
      tone: "good",
      label: "Front-end masking enabled",
      detail: compatibility.message || "Geolocation, timezone, and language hooks are active on this site."
    };
  }

  return {
    tone: "muted",
    label: "Waiting for page reload",
    detail: "Reload this tab after enabling the site or changing the profile."
  };
}
