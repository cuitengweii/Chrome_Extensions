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
    details: "",
    attempts: Object.freeze([]),
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
    details: normalizeString(rawVerification.details).slice(0, 1200),
    attempts: unique((Array.isArray(rawVerification.attempts) ? rawVerification.attempts : [])
      .map((item) => normalizeString(item))
      .filter(Boolean))
      .slice(0, 8),
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
      label: "\u7f51\u7edc\u51fa\u53e3\u5df2\u6821\u9a8c",
      detail: verification.note || `${verification.country || verification.region || verification.city || "\u5f53\u524d\u51fa\u53e3"} \u4e0e ${verification.timezone || "\u76ee\u6807\u65f6\u533a"} \u4e00\u81f4\u3002`
    };
  }
  if (status === "mismatch") {
    return {
      tone: "warn",
      label: "\u7f51\u7edc\u51fa\u53e3\u4e0d\u5339\u914d",
      detail: verification.note || "\u516c\u7f51 IP \u6240\u5728\u5730\u533a\u4e0e\u4f60\u914d\u7f6e\u7684\u65f6\u533a\u4e0d\u4e00\u81f4\u3002"
    };
  }
  if (status === "error") {
    return {
      tone: "warn",
      label: "\u7f51\u7edc\u6821\u9a8c\u5931\u8d25",
      detail: verification.note || "\u6821\u9a8c\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528\u3002"
    };
  }
  return {
    tone: "warn",
    label: "\u7f51\u7edc\u51fa\u53e3\u672a\u6821\u9a8c",
    detail: "\u8bf7\u5728\u8fde\u63a5 VPN \u6216\u4ee3\u7406\u540e\u518d\u6267\u884c\u4e00\u6b21\u7f51\u7edc\u6821\u9a8c\u3002"
  };
}

export function summarizeFrontendState(settings, hostname) {
  const normalized = normalizeSettings(settings);
  if (!isDomainAllowlisted(hostname, normalized)) {
    return {
      tone: "muted",
      label: "\u524d\u7aef\u4f2a\u88c5\u672a\u5f00\u542f",
      detail: "\u5f53\u524d\u57df\u540d\u4e0d\u5728\u767d\u540d\u5355\u4e2d\u3002"
    };
  }

  const compatibility = getCompatibilityForHost(normalized, hostname);
  if (compatibility.status === "limited") {
    return {
      tone: "warn",
      label: "\u517c\u5bb9\u6027\u53d7\u9650",
      detail: compatibility.message || "\u9875\u9762\u542f\u52a8\u65f6\u7684\u4e3b\u4e16\u754c\u6ce8\u5165\u6ca1\u6709\u5b8c\u5168\u6210\u529f\u3002"
    };
  }
  if (compatibility.status === "enabled") {
    return {
      tone: "good",
      label: "\u524d\u7aef\u4f2a\u88c5\u5df2\u542f\u7528",
      detail: compatibility.message || "\u5f53\u524d\u7ad9\u70b9\u7684\u5b9a\u4f4d\u3001\u65f6\u533a\u548c\u8bed\u8a00\u4f2a\u88c5\u5df2\u751f\u6548\u3002"
    };
  }

  return {
    tone: "muted",
    label: "\u7b49\u5f85\u9875\u9762\u5237\u65b0",
    detail: "\u542f\u7528\u7ad9\u70b9\u6216\u4fee\u6539\u6863\u6848\u540e\uff0c\u8bf7\u5237\u65b0\u5f53\u524d\u9875\u9762\u3002"
  };
}
