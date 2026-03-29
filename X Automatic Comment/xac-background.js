const XAC_STORAGE_KEYS = Object.freeze({
  language: "xac.language",
  sparkSettings: "xac.sparkSettings",
  googleSession: "xac.googleSession",
  authOverrides: "xac.authOverrides",
  profiles: "xac.profiles",
  activeProfileId: "xac.activeProfileId",
  quickSettings: "xac.quickSettings",
  advancedSettings: "xac.advancedSettings",
  scheduledStarts: "xac.scheduledStarts",
  scheduleRuntime: "xac.scheduleRuntime",
  cloudSyncStatus: "xac.cloudSyncStatus"
})
const XAC_CLOUD_BACKUP_KEY = "xac.cloudSettingsBackup"

const XAC_DEFAULT_AUTH_CONFIG = Object.freeze({
  provider: "google",
  storageKey: "gasgx-main-auth",
  signInUrl: "/account/user.html",
  accountUrl: "/account/account.html",
  signOutRedirectUrl: "/account/user.html",
  returnUrlStorageKey: "gx_main_return_url",
  supabaseUrl: "https://mkpcliytqudclkwtewru.supabase.co",
  supabaseKey: "",
  providerRollout: {
    twitter: false,
    linkedin: false
  }
})

const XAC_DEFAULT_SPARK_SETTINGS = Object.freeze({
  enabled: true,
  url: "",
  app_id: "",
  api_key: "",
  api_secret: "",
  domain: "generalv3.5",
  temperature: 0.3,
  max_tokens: 512
})
const XAC_REQUIRED_SPARK_FIELDS = Object.freeze(["url", "app_id", "api_key", "api_secret"])

const XAC_DEFAULT_PROFILES = Object.freeze([
  {
    id: "preset_growth",
    name: "Growth Hacker",
    emoji: "🚀",
    tone: "bold and data-driven",
    goal: "engagement",
    length: "short",
    instructions: "Use one concrete insight and end with a thought-provoking line.",
    persona: "I build growth systems for creator products.",
    language: "en",
    preset: true
  },
  {
    id: "preset_authority",
    name: "Authority Mode",
    emoji: "🎯",
    tone: "authoritative and precise",
    goal: "authority",
    length: "medium",
    instructions: "Use a strong framing sentence and one practical takeaway.",
    persona: "I focus on strategic analysis and market positioning.",
    language: "en",
    preset: true
  },
  {
    id: "preset_friendly",
    name: "Friendly Builder",
    emoji: "🤝",
    tone: "warm and approachable",
    goal: "networking",
    length: "short",
    instructions: "Be supportive, specific, and easy to respond to.",
    persona: "I collaborate with founders and operators in public.",
    language: "en",
    preset: true
  }
])

const XAC_DEFAULT_QUICK_SETTINGS = Object.freeze({
  engagementMode: "safe",
  goal: "engagement",
  length: "short",
  customInstructions: "",
  persona: ""
})
const XAC_DEFAULT_SEARCH_QUERY = "(gm OR gn) min_replies:1 -filter:replies"
const XAC_SCHEDULE_ALARM_PREFIX = "xac:schedule:"
const XAC_SCHEDULE_RETRY_ALARM_PREFIX = "xac:schedule-retry:"
const XAC_DEFAULT_SCHEDULE_RETRY = Object.freeze({
  enabled: true,
  maxAttempts: 2,
  firstDelayMin: 2,
  nextDelayMin: 5
})

let xacConfigCachePromise = null

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function toStringValue(value, fallback = "") {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed || fallback
  }
  return fallback
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["1", "true", "yes", "y", "on"].includes(normalized)) return true
    if (["0", "false", "no", "n", "off"].includes(normalized)) return false
  }
  return fallback
}

function toNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function normalizeScheduleTime(value, fallback = "09:00") {
  const source = toStringValue(value, "").trim()
  const match = source.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
  if (!match) return fallback
  const hour = String(match[1]).padStart(2, "0")
  const minute = String(match[2]).padStart(2, "0")
  return `${hour}:${minute}`
}

function normalizeScheduleMode(value) {
  const mode = toStringValue(value, "daily").toLowerCase()
  if (mode === "weekdays" || mode === "weekend" || mode === "custom") return mode
  return "daily"
}

function scheduleDaysForMode(mode) {
  if (mode === "weekdays") return [1, 2, 3, 4, 5]
  if (mode === "weekend") return [0, 6]
  if (mode === "custom") return [1, 2, 3, 4, 5]
  return [0, 1, 2, 3, 4, 5, 6]
}

function normalizeScheduleDays(rawValue, mode = "daily") {
  const fallback = scheduleDaysForMode(mode)
  if (!Array.isArray(rawValue)) return fallback
  const mapped = rawValue
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))
    .map((item) => Math.round(item))
    .filter((item) => item >= 0 && item <= 6)
  const uniq = Array.from(new Set(mapped)).sort((a, b) => a - b)
  return uniq.length ? uniq : fallback
}

function normalizeScheduledStart(item, index = 0) {
  const source = isPlainObject(item) ? item : {}
  const mode = normalizeScheduleMode(source.mode)
  const startTime = normalizeScheduleTime(source.startTime || source.time, "09:00")
  const endTime = normalizeScheduleTime(source.endTime || source.time || source.startTime, startTime)
  return {
    id: toStringValue(source.id, `schedule_${index + 1}`).replace(/\s+/g, "_"),
    time: startTime,
    startTime,
    endTime,
    mode,
    days: normalizeScheduleDays(source.days, mode),
    max: clamp(Math.round(toNumber(source.max, 0)), 0, 200),
    probability: clamp(Math.round(toNumber(source.probability, 100)), 10, 100),
    enabled: toBoolean(source.enabled, true)
  }
}

function normalizeScheduledStarts(rawList) {
  if (!Array.isArray(rawList) || !rawList.length) return []
  const seen = new Set()
  const out = []
  rawList.forEach((item, index) => {
    const normalized = normalizeScheduledStart(item, index)
    let id = normalized.id
    if (!id || seen.has(id)) id = `schedule_${Date.now().toString(36)}_${index}`
    seen.add(id)
    out.push({ ...normalized, id })
  })
  return out.slice(0, 20)
}

function alarmNameForSchedule(id) {
  return `${XAC_SCHEDULE_ALARM_PREFIX}${String(id || "")}`
}

function parseScheduleIdFromAlarm(name) {
  const text = toStringValue(name, "")
  if (!text.startsWith(XAC_SCHEDULE_ALARM_PREFIX)) return ""
  return text.slice(XAC_SCHEDULE_ALARM_PREFIX.length)
}

function retryAlarmNameForSchedule(id, attempt = 1) {
  const safeId = encodeURIComponent(String(id || ""))
  const safeAttempt = clamp(Math.round(toNumber(attempt, 1)), 1, 99)
  return `${XAC_SCHEDULE_RETRY_ALARM_PREFIX}${safeId}::${safeAttempt}`
}

function parseRetryScheduleFromAlarm(name) {
  const text = toStringValue(name, "")
  if (!text.startsWith(XAC_SCHEDULE_RETRY_ALARM_PREFIX)) return { scheduleId: "", attempt: 0 }
  const body = text.slice(XAC_SCHEDULE_RETRY_ALARM_PREFIX.length)
  const idx = body.lastIndexOf("::")
  if (idx < 0) return { scheduleId: "", attempt: 0 }
  let scheduleId = ""
  try {
    scheduleId = decodeURIComponent(body.slice(0, idx))
  } catch (_error) {
    scheduleId = ""
  }
  const attempt = clamp(Math.round(toNumber(body.slice(idx + 2), 0)), 0, 99)
  return { scheduleId, attempt }
}

function normalizeScheduleRetryConfig(rawAdvancedSettings) {
  const source = isPlainObject(rawAdvancedSettings) ? rawAdvancedSettings : {}
  return {
    enabled: toBoolean(source.scheduleRetryEnabled, XAC_DEFAULT_SCHEDULE_RETRY.enabled),
    maxAttempts: clamp(Math.round(toNumber(source.scheduleRetryMaxAttempts, XAC_DEFAULT_SCHEDULE_RETRY.maxAttempts)), 0, 5),
    firstDelayMs: clamp(Math.round(toNumber(source.scheduleRetryFirstDelayMin, XAC_DEFAULT_SCHEDULE_RETRY.firstDelayMin)), 1, 120) * 60 * 1000,
    nextDelayMs: clamp(Math.round(toNumber(source.scheduleRetryNextDelayMin, XAC_DEFAULT_SCHEDULE_RETRY.nextDelayMin)), 1, 240) * 60 * 1000
  }
}

function buildScheduleRetryDelayPlan(retryConfig) {
  const cfg = isPlainObject(retryConfig) ? retryConfig : normalizeScheduleRetryConfig(null)
  if (!cfg.enabled || cfg.maxAttempts <= 0) return []
  const out = []
  for (let index = 0; index < cfg.maxAttempts; index += 1) {
    out.push(index === 0 ? cfg.firstDelayMs : cfg.nextDelayMs)
  }
  return out
}

function normalizeTimestamp(value) {
  return Math.max(0, Math.round(toNumber(value, 0)))
}

function normalizeScheduleRuntimeResult(value) {
  const result = toStringValue(value, "").toLowerCase()
  if (["success", "failed", "retry_scheduled", "skipped"].includes(result)) return result
  return ""
}

function normalizeScheduleRuntimeEntry(raw, scheduleId = "") {
  const source = isPlainObject(raw) ? raw : {}
  return {
    id: toStringValue(source.id, scheduleId),
    nextRunAt: normalizeTimestamp(source.nextRunAt),
    retryAt: normalizeTimestamp(source.retryAt),
    lastTriggeredAt: normalizeTimestamp(source.lastTriggeredAt),
    lastSuccessAt: normalizeTimestamp(source.lastSuccessAt),
    lastFailureAt: normalizeTimestamp(source.lastFailureAt),
    lastErrorAt: normalizeTimestamp(source.lastErrorAt),
    lastResult: normalizeScheduleRuntimeResult(source.lastResult),
    lastError: toStringValue(source.lastError, ""),
    attemptCount: clamp(Math.round(toNumber(source.attemptCount, 0)), 0, 99),
    totalSuccess: clamp(Math.round(toNumber(source.totalSuccess, 0)), 0, 999999),
    totalFailure: clamp(Math.round(toNumber(source.totalFailure, 0)), 0, 999999)
  }
}

function normalizeScheduleRuntimeState(rawValue) {
  const source = isPlainObject(rawValue) ? rawValue : {}
  const entriesInput = isPlainObject(source.entries) ? source.entries : {}
  const entries = {}
  Object.keys(entriesInput).forEach((id) => {
    const safeId = toStringValue(id, "")
    if (!safeId) return
    entries[safeId] = normalizeScheduleRuntimeEntry(entriesInput[safeId], safeId)
  })
  return {
    updatedAt: normalizeTimestamp(source.updatedAt),
    lastSyncAt: normalizeTimestamp(source.lastSyncAt),
    entries
  }
}

function scheduleModeMatches(mode, day, days) {
  const safeDay = Number(day)
  const normalizedDays = normalizeScheduleDays(days, mode)
  if (mode === "custom") return normalizedDays.includes(safeDay)
  if (mode === "weekdays") return safeDay >= 1 && safeDay <= 5
  if (mode === "weekend") return safeDay === 0 || safeDay === 6
  return true
}

function getNextScheduleTimestamp(entry, now = new Date()) {
  const normalized = normalizeScheduledStart(entry, 0)
  const [startHourText, startMinuteText] = normalized.startTime.split(":")
  const [endHourText, endMinuteText] = normalized.endTime.split(":")
  const startMinutes = clamp(Number(startHourText || 0), 0, 23) * 60 + clamp(Number(startMinuteText || 0), 0, 59)
  const endMinutes = clamp(Number(endHourText || 0), 0, 23) * 60 + clamp(Number(endMinuteText || 0), 0, 59)
  const low = Math.min(startMinutes, endMinutes)
  const high = Math.max(startMinutes, endMinutes)
  const randomMinute = low + Math.floor(Math.random() * (high - low + 1))
  const hour = Math.floor(randomMinute / 60)
  const minute = randomMinute % 60
  const base = new Date(now)
  for (let offset = 0; offset <= 8; offset += 1) {
    const candidate = new Date(base)
    candidate.setSeconds(0, 0)
    candidate.setDate(base.getDate() + offset)
    candidate.setHours(hour, minute, 0, 0)
    if (!scheduleModeMatches(normalized.mode, candidate.getDay(), normalized.days)) continue
    if (candidate.getTime() <= now.getTime() + 1000) continue
    return candidate.getTime()
  }
  return now.getTime() + 30 * 60 * 1000
}

function alarmsGetAll() {
  return new Promise((resolve) => {
    chrome.alarms.getAll((items) => {
      resolve(Array.isArray(items) ? items : [])
    })
  })
}

function alarmsCreate(name, info) {
  return new Promise((resolve) => {
    chrome.alarms.create(name, info)
    resolve(true)
  })
}

function alarmsClear(name) {
  return new Promise((resolve) => {
    chrome.alarms.clear(name, () => resolve(true))
  })
}

function maskSecret(value, left = 3, right = 2) {
  const text = toStringValue(value)
  if (!text) return ""
  if (text.length <= left + right) return "*".repeat(text.length)
  return `${text.slice(0, left)}${"*".repeat(Math.max(4, text.length - left - right))}${text.slice(-right)}`
}

function safeErrorMessage(error) {
  if (!error) return "Unknown error"
  if (typeof error === "string") return error
  if (error && typeof error.message === "string") return error.message
  try {
    return JSON.stringify(error)
  } catch (_ignored) {
    return String(error)
  }
}

function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (items) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve(items || {})
    })
  })
}

function storageSet(items) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve()
    })
  })
}

function storageRemove(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keys, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve()
    })
  })
}

function storageSyncGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (items) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve(items || {})
    })
  })
}

function storageSyncSet(items) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(items, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve()
    })
  })
}

function createPublicAuthConfig(authConfig) {
  return {
    ...authConfig,
    supabaseKey: maskSecret(authConfig.supabaseKey)
  }
}

function createPublicSparkSettings(sparkSettings) {
  const normalized = normalizeSparkSettings(sparkSettings, XAC_DEFAULT_SPARK_SETTINGS)
  const missingRequiredFields = getMissingSparkFields(normalized)
  return {
    ...normalized,
    api_key: maskSecret(normalized.api_key),
    api_secret: maskSecret(normalized.api_secret),
    app_id: maskSecret(normalized.app_id),
    missingRequiredFields,
    isConfigured: missingRequiredFields.length === 0
  }
}

function getMissingSparkFields(sparkSettings) {
  const normalized = normalizeSparkSettings(sparkSettings, XAC_DEFAULT_SPARK_SETTINGS)
  return XAC_REQUIRED_SPARK_FIELDS.filter((field) => !toStringValue(normalized[field], ""))
}

async function readPackagedJson(relativePath) {
  try {
    const target = chrome.runtime.getURL(relativePath)
    const response = await fetch(target)
    if (!response.ok) {
      return {}
    }
    return await response.json()
  } catch (_error) {
    return {}
  }
}

function normalizeAuthConfig(input, fallback = XAC_DEFAULT_AUTH_CONFIG) {
  const base = {
    ...fallback,
    providerRollout: {
      twitter: Boolean(fallback?.providerRollout?.twitter),
      linkedin: Boolean(fallback?.providerRollout?.linkedin)
    }
  }

  if (!isPlainObject(input)) {
    return base
  }

  return {
    provider: toStringValue(input.provider, base.provider),
    storageKey: toStringValue(input.storageKey, base.storageKey),
    signInUrl: toStringValue(input.signInUrl, base.signInUrl),
    accountUrl: toStringValue(input.accountUrl, base.accountUrl),
    signOutRedirectUrl: toStringValue(input.signOutRedirectUrl, base.signOutRedirectUrl),
    returnUrlStorageKey: toStringValue(input.returnUrlStorageKey, base.returnUrlStorageKey),
    supabaseUrl: toStringValue(input.supabaseUrl, base.supabaseUrl),
    supabaseKey: toStringValue(input.supabaseKey, base.supabaseKey),
    providerRollout: {
      twitter: toBoolean(input?.providerRollout?.twitter, base.providerRollout.twitter),
      linkedin: toBoolean(input?.providerRollout?.linkedin, base.providerRollout.linkedin)
    }
  }
}

function normalizeSparkSettings(input, fallback = XAC_DEFAULT_SPARK_SETTINGS) {
  const base = {
    ...fallback
  }

  if (!isPlainObject(input)) {
    return base
  }

  return {
    enabled: toBoolean(input.enabled, base.enabled),
    url: toStringValue(input.url, base.url),
    app_id: toStringValue(input.app_id, base.app_id),
    api_key: toStringValue(input.api_key, base.api_key),
    api_secret: toStringValue(input.api_secret, base.api_secret),
    domain: toStringValue(input.domain, base.domain),
    temperature: clamp(toNumber(input.temperature, base.temperature), 0, 1),
    max_tokens: clamp(Math.round(toNumber(input.max_tokens, base.max_tokens)), 128, 4096)
  }
}

function normalizeProfile(input, fallbackProfile = XAC_DEFAULT_PROFILES[0]) {
  const base = isPlainObject(fallbackProfile) ? fallbackProfile : XAC_DEFAULT_PROFILES[0]
  const source = isPlainObject(input) ? input : {}
  const id = toStringValue(source.id, base.id)

  return {
    id,
    name: toStringValue(source.name, base.name),
    emoji: toStringValue(source.emoji, base.emoji),
    tone: toStringValue(source.tone, base.tone),
    goal: toStringValue(source.goal, base.goal),
    length: toStringValue(source.length, base.length),
    instructions: toStringValue(source.instructions, base.instructions),
    persona: toStringValue(source.persona, base.persona),
    language: toStringValue(source.language, base.language),
    preset: toBoolean(source.preset, base.preset === true)
  }
}

function mergeProfilesWithDefaults(rawProfiles) {
  const incoming = Array.isArray(rawProfiles) ? rawProfiles : []
  const normalizedIncoming = incoming
    .map((item) => normalizeProfile(item))
    .filter((item) => Boolean(item.id))

  const byId = new Map()
  XAC_DEFAULT_PROFILES.forEach((preset) => {
    byId.set(preset.id, normalizeProfile(preset, preset))
  })

  normalizedIncoming.forEach((profile) => {
    if (!byId.has(profile.id)) {
      byId.set(profile.id, profile)
    } else if (!profile.preset) {
      // allow overriding preset fields except id
      const preset = byId.get(profile.id)
      byId.set(profile.id, {
        ...preset,
        ...profile,
        preset: true
      })
    }
  })

  return Array.from(byId.values())
}

function normalizeQuickSettings(input, fallback = XAC_DEFAULT_QUICK_SETTINGS) {
  const base = isPlainObject(fallback) ? fallback : XAC_DEFAULT_QUICK_SETTINGS
  const source = isPlainObject(input) ? input : {}
  return {
    engagementMode: toStringValue(source.engagementMode, base.engagementMode),
    goal: toStringValue(source.goal, base.goal),
    length: toStringValue(source.length, base.length),
    customInstructions: toStringValue(source.customInstructions, base.customInstructions),
    persona: toStringValue(source.persona, base.persona)
  }
}

async function getProfileState() {
  const stored = await storageGet([
    XAC_STORAGE_KEYS.profiles,
    XAC_STORAGE_KEYS.activeProfileId,
    XAC_STORAGE_KEYS.quickSettings
  ])

  const profiles = mergeProfilesWithDefaults(stored[XAC_STORAGE_KEYS.profiles])
  const activeProfileIdRaw = toStringValue(stored[XAC_STORAGE_KEYS.activeProfileId], "")
  const activeProfileId = profiles.some((profile) => profile.id === activeProfileIdRaw)
    ? activeProfileIdRaw
    : profiles[0].id

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) || profiles[0]
  const quickSettings = normalizeQuickSettings(stored[XAC_STORAGE_KEYS.quickSettings], {
    ...XAC_DEFAULT_QUICK_SETTINGS,
    goal: activeProfile.goal || XAC_DEFAULT_QUICK_SETTINGS.goal,
    length: activeProfile.length || XAC_DEFAULT_QUICK_SETTINGS.length,
    persona: activeProfile.persona || XAC_DEFAULT_QUICK_SETTINGS.persona,
    customInstructions: activeProfile.instructions || XAC_DEFAULT_QUICK_SETTINGS.customInstructions
  })

  return {
    profiles,
    activeProfileId,
    quickSettings
  }
}

async function setProfileState(payload) {
  const current = await getProfileState()
  const source = isPlainObject(payload) ? payload : {}

  const profiles = mergeProfilesWithDefaults(source.profiles || current.profiles)
  const activeProfileIdRaw = toStringValue(source.activeProfileId, current.activeProfileId)
  const activeProfileId = profiles.some((profile) => profile.id === activeProfileIdRaw)
    ? activeProfileIdRaw
    : current.activeProfileId
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) || profiles[0]

  const quickSettings = normalizeQuickSettings(source.quickSettings, {
    ...current.quickSettings,
    goal: activeProfile.goal || current.quickSettings.goal,
    length: activeProfile.length || current.quickSettings.length
  })

  await storageSet({
    [XAC_STORAGE_KEYS.profiles]: profiles,
    [XAC_STORAGE_KEYS.activeProfileId]: activeProfileId,
    [XAC_STORAGE_KEYS.quickSettings]: quickSettings
  })

  return {
    profiles,
    activeProfileId,
    quickSettings
  }
}

async function getPackagedConfig() {
  if (!xacConfigCachePromise) {
    xacConfigCachePromise = Promise.all([
      readPackagedJson("config/auth.gasgx.json"),
      readPackagedJson("config/spark.gasgx.json")
    ]).then(([authPayload, sparkPayload]) => {
      const auth = normalizeAuthConfig(authPayload?.auth, XAC_DEFAULT_AUTH_CONFIG)
      const spark = normalizeSparkSettings(sparkPayload?.settings, XAC_DEFAULT_SPARK_SETTINGS)
      return { auth, spark }
    })
  }
  return xacConfigCachePromise
}

async function getLanguage() {
  const saved = await storageGet([XAC_STORAGE_KEYS.language])
  const raw = toStringValue(saved[XAC_STORAGE_KEYS.language], "")
  if (raw.toLowerCase().startsWith("zh")) return "zh"
  if (raw.toLowerCase().startsWith("en")) return "en"
  const preferred = (chrome.i18n.getUILanguage() || "en").toLowerCase()
  return preferred.startsWith("zh") ? "zh" : "en"
}

async function setLanguage(language) {
  const normalized = String(language || "").toLowerCase().startsWith("zh") ? "zh" : "en"
  await storageSet({ [XAC_STORAGE_KEYS.language]: normalized })
  return normalized
}

async function getAuthConfig() {
  const packaged = await getPackagedConfig()
  const stored = await storageGet([XAC_STORAGE_KEYS.authOverrides])
  return normalizeAuthConfig(stored[XAC_STORAGE_KEYS.authOverrides], packaged.auth)
}

async function setAuthOverrides(overrides) {
  const current = await getAuthConfig()
  const next = normalizeAuthConfig(overrides, current)
  await storageSet({ [XAC_STORAGE_KEYS.authOverrides]: next })
  return next
}

async function getSparkSettings() {
  const packaged = await getPackagedConfig()
  const stored = await storageGet([XAC_STORAGE_KEYS.sparkSettings])
  return normalizeSparkSettings(stored[XAC_STORAGE_KEYS.sparkSettings], packaged.spark)
}

async function setSparkSettings(settings) {
  const current = await getSparkSettings()
  const next = normalizeSparkSettings(settings, current)
  await storageSet({ [XAC_STORAGE_KEYS.sparkSettings]: next })
  return next
}

async function getGoogleSession() {
  const stored = await storageGet([XAC_STORAGE_KEYS.googleSession])
  const session = stored[XAC_STORAGE_KEYS.googleSession]
  if (!isPlainObject(session)) {
    return null
  }
  const normalized = normalizeGoogleSessionPayload(session)
  if (!normalized) return null
  return normalized
}

function normalizeGoogleSessionPayload(payload) {
  if (!isPlainObject(payload)) return null

  const accessToken = toStringValue(payload.accessToken ?? payload.access_token, "")
  if (!accessToken) return null

  const refreshToken = toStringValue(payload.refreshToken ?? payload.refresh_token, "")
  const tokenType = toStringValue(payload.tokenType ?? payload.token_type, "bearer")
  const expiresIn = Math.max(60, Math.round(toNumber(payload.expiresIn ?? payload.expires_in, 3600)))

  let expiresAtRaw = toNumber(payload.expiresAt ?? payload.expires_at, 0)
  if (expiresAtRaw > 0 && expiresAtRaw < 10000000000) {
    expiresAtRaw = expiresAtRaw * 1000
  }
  const expiresAt = expiresAtRaw > 0 ? Math.round(expiresAtRaw) : Date.now() + expiresIn * 1000

  return {
    provider: "google",
    accessToken,
    refreshToken,
    tokenType,
    expiresIn,
    expiresAt,
    user: isPlainObject(payload.user) ? payload.user : null,
    signedInAt: toStringValue(payload.signedInAt, new Date().toISOString())
  }
}

async function upsertGoogleSession(payload, options = {}) {
  const normalized = normalizeGoogleSessionPayload(payload)
  if (!normalized) {
    throw new Error("Invalid Google session payload.")
  }

  const authConfig = await getAuthConfig()
  const shouldFetchUser = options.fetchUser !== false
  if (shouldFetchUser && !normalized.user && authConfig.supabaseUrl && authConfig.supabaseKey) {
    try {
      normalized.user = await fetchSupabaseUser(authConfig, normalized.accessToken)
    } catch (_error) {
      // user profile fetch is best-effort for sync flow
    }
  }

  await storageSet({ [XAC_STORAGE_KEYS.googleSession]: normalized })
  return normalized
}

function parseAuthCallbackUrl(callbackUrl) {
  const parsed = new URL(callbackUrl)
  const hash = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash
  const query = parsed.search.startsWith("?") ? parsed.search.slice(1) : parsed.search
  const params = new URLSearchParams(hash || query)

  const error = params.get("error_description") || params.get("error")
  if (error) {
    throw new Error(error)
  }

  const accessToken = params.get("access_token")
  if (!accessToken) {
    throw new Error("No access token found in Google callback.")
  }

  return {
    accessToken,
    refreshToken: params.get("refresh_token") || "",
    tokenType: params.get("token_type") || "bearer",
    expiresIn: Math.max(60, Math.round(toNumber(params.get("expires_in"), 3600)))
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function launchWebAuthFlow(url, interactive = true) {
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow({ url, interactive }, (callbackUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      if (!callbackUrl) {
        reject(new Error("Empty callback URL from launchWebAuthFlow."))
        return
      }
      resolve(callbackUrl)
    })
  })
}

function createPopupWindow(url) {
  return new Promise((resolve, reject) => {
    chrome.windows.create(
      {
        url,
        type: "popup",
        focused: true,
        width: 460,
        height: 760
      },
      (win) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (!win || typeof win.id !== "number") {
          reject(new Error("Failed to open login popup window."))
          return
        }
        resolve(win)
      }
    )
  })
}

function getWindowById(windowId) {
  return new Promise((resolve) => {
    chrome.windows.get(windowId, {}, (win) => {
      if (chrome.runtime.lastError || !win) {
        resolve(null)
        return
      }
      resolve(win)
    })
  })
}

function closeWindowById(windowId) {
  return new Promise((resolve) => {
    chrome.windows.remove(windowId, () => {
      resolve(true)
    })
  })
}

async function waitForSyncedGoogleSession(windowId, timeoutMs = 180000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    const session = await getGoogleSession()
    if (session?.accessToken) {
      return session
    }

    const stillOpen = await getWindowById(windowId)
    if (!stillOpen) {
      break
    }
    await sleep(700)
  }

  return null
}

function buildGasGxSignInUrl(authConfig) {
  const signInPath = toStringValue(authConfig.signInUrl, "/account/user.html")
  const siteOrigin = "https://www.gasgx.com"
  const target = new URL(signInPath, siteOrigin)
  target.searchParams.set("source", "xac-extension")
  target.searchParams.set("popup", "1")
  return target.toString()
}

async function signInViaGasGxPopup(authConfig) {
  const loginUrl = buildGasGxSignInUrl(authConfig)
  const popup = await createPopupWindow(loginUrl)

  try {
    const session = await waitForSyncedGoogleSession(popup.id, 180000)
    if (session?.accessToken) {
      return session
    }
    throw new Error("Login window closed or timed out before extension session was synced.")
  } finally {
    await closeWindowById(popup.id)
  }
}

function buildSupabaseGoogleUrl(authConfig, redirectTo) {
  const endpoint = new URL("/auth/v1/authorize", authConfig.supabaseUrl)
  endpoint.searchParams.set("provider", "google")
  endpoint.searchParams.set("redirect_to", redirectTo)
  endpoint.searchParams.set("response_type", "token")
  endpoint.searchParams.set("scopes", "openid email profile")
  return endpoint.toString()
}

async function fetchSupabaseUser(authConfig, accessToken) {
  const endpoint = new URL("/auth/v1/user", authConfig.supabaseUrl)
  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      apikey: authConfig.supabaseKey,
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to load user profile: ${response.status} ${body}`)
  }

  return await response.json()
}

function pickBestSparkCandidate(candidates) {
  let best = null
  let bestScore = -1
  candidates.forEach((candidate) => {
    if (!isPlainObject(candidate)) return
    const normalized = normalizeSparkSettings(
      {
        enabled: candidate.enabled,
        url:
          candidate.url ??
          candidate.ws_url ??
          candidate.websocket_url ??
          candidate.spark_url ??
          "",
        app_id: candidate.app_id ?? candidate.appid ?? candidate.appId ?? "",
        api_key: candidate.api_key ?? candidate.apiKey ?? "",
        api_secret: candidate.api_secret ?? candidate.apiSecret ?? candidate.secret ?? "",
        domain: candidate.domain ?? candidate.spark_domain ?? candidate.model ?? ""
      },
      XAC_DEFAULT_SPARK_SETTINGS
    )
    const score = XAC_REQUIRED_SPARK_FIELDS.reduce((count, field) => {
      return count + (toStringValue(normalized[field], "") ? 1 : 0)
    }, 0)
    if (score > bestScore) {
      bestScore = score
      best = normalized
    }
  })
  return best
}

async function fetchRemoteSparkSettings(authConfig, accessToken = "") {
  const endpoint = new URL("/rest/v1/global_config", authConfig.supabaseUrl)
  endpoint.searchParams.set("select", "settings")
  endpoint.searchParams.set("config_name", "eq.xfyun")
  endpoint.searchParams.set("limit", "1")

  const headers = {
    apikey: authConfig.supabaseKey,
    Authorization: `Bearer ${toStringValue(accessToken, authConfig.supabaseKey)}`
  }

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Remote Spark settings request failed: ${response.status} ${body}`)
  }

  const rows = await response.json()
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Remote Spark settings row not found in global_config (config_name=xfyun).")
  }

  const settings = rows[0]?.settings
  if (!isPlainObject(settings)) {
    throw new Error("Remote Spark settings payload is empty.")
  }

  const candidates = [settings?.ai, settings?.xfyun, settings?.spark, settings]
  const picked = pickBestSparkCandidate(candidates)
  if (!picked) {
    throw new Error("Remote Spark settings payload is not a valid object.")
  }

  return picked
}

async function syncSparkSettingsFromGasGx() {
  const authConfig = await getAuthConfig()
  if (!authConfig.supabaseUrl || !authConfig.supabaseKey) {
    throw new Error("Supabase config is incomplete. Please check GasGx auth settings.")
  }

  const session = await getGoogleSession()
  const attemptTokens = []
  if (toStringValue(session?.accessToken, "")) {
    attemptTokens.push(session.accessToken)
  }
  attemptTokens.push(authConfig.supabaseKey)

  let lastError = null
  for (const token of attemptTokens) {
    try {
      const remote = await fetchRemoteSparkSettings(authConfig, token)
      const merged = await setSparkSettings(remote)
      return createPublicSparkSettings(merged)
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(safeErrorMessage(lastError) || "Failed to sync Spark settings from GasGx.")
}

async function signInWithGoogle() {
  const authConfig = await getAuthConfig()
  if (!authConfig.supabaseUrl || !authConfig.supabaseKey) {
    throw new Error("Supabase auth config is incomplete. Please check GasGx auth settings.")
  }

  const existing = await getGoogleSession()
  if (existing?.accessToken) {
    return existing
  }

  // Prefer popup mode to avoid redirecting the user's current tab.
  try {
    const popupSession = await signInViaGasGxPopup(authConfig)
    if (popupSession?.accessToken) {
      return popupSession
    }
  } catch (_popupError) {
    // fall through to web auth flow fallback
  }

  const redirectTo = chrome.identity.getRedirectURL("xac-google")
  const authUrl = buildSupabaseGoogleUrl(authConfig, redirectTo)

  let tokens = null
  try {
    const callbackUrl = await launchWebAuthFlow(authUrl, true)
    tokens = parseAuthCallbackUrl(callbackUrl)
  } catch (error) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await sleep(450)
      const synced = await getGoogleSession()
      if (synced?.accessToken) {
        return synced
      }
    }
    throw new Error(safeErrorMessage(error))
  }

  const profile = await fetchSupabaseUser(authConfig, tokens.accessToken)
  return await upsertGoogleSession(
    {
      ...tokens,
      user: profile,
      signedInAt: new Date().toISOString()
    },
    { fetchUser: false }
  )
}

async function signOutGoogle() {
  const authConfig = await getAuthConfig()
  const session = await getGoogleSession()

  if (session?.accessToken && authConfig.supabaseUrl && authConfig.supabaseKey) {
    try {
      const endpoint = new URL("/auth/v1/logout", authConfig.supabaseUrl)
      await fetch(endpoint.toString(), {
        method: "POST",
        headers: {
          apikey: authConfig.supabaseKey,
          Authorization: `Bearer ${session.accessToken}`
        }
      })
    } catch (_error) {
      // ignore remote logout errors and clear local state
    }
  }

  await storageRemove([XAC_STORAGE_KEYS.googleSession])
  return true
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return btoa(binary)
}

async function hmacSha256Base64(secret, text) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(text))
  return arrayBufferToBase64(signature)
}

async function createSparkAuthorizedUrl(settings) {
  const endpoint = new URL(settings.url)
  const host = endpoint.host
  const path = endpoint.pathname || "/"
  const date = new Date().toUTCString()
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`
  const signatureBase64 = await hmacSha256Base64(settings.api_secret, signatureOrigin)
  const authorizationOrigin = `api_key="${settings.api_key}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`
  const authorization = btoa(authorizationOrigin)

  endpoint.searchParams.set("authorization", authorization)
  endpoint.searchParams.set("date", date)
  endpoint.searchParams.set("host", host)

  return endpoint.toString()
}

function buildSparkPayload(settings, requestPayload) {
  const messageList = []

  if (Array.isArray(requestPayload.messages) && requestPayload.messages.length > 0) {
    requestPayload.messages.forEach((item) => {
      if (!isPlainObject(item)) return
      const role = toStringValue(item.role, "user")
      const content = toStringValue(item.content, "")
      if (content) {
        messageList.push({ role, content })
      }
    })
  }

  if (messageList.length === 0) {
    const systemPrompt = toStringValue(requestPayload.systemPrompt, "")
    const prompt = toStringValue(requestPayload.prompt, "")
    if (systemPrompt) {
      messageList.push({ role: "system", content: systemPrompt })
    }
    messageList.push({ role: "user", content: prompt })
  }

  if (messageList.length === 0) {
    throw new Error("Spark prompt is empty.")
  }

  return {
    header: {
      app_id: settings.app_id,
      uid: crypto.randomUUID ? crypto.randomUUID() : "xac-spark"
    },
    parameter: {
      chat: {
        domain: settings.domain,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens
      }
    },
    payload: {
      message: {
        text: messageList
      }
    }
  }
}

async function callSparkModel(requestPayload) {
  const storedSettings = await getSparkSettings()
  let mergedSettings = normalizeSparkSettings(requestPayload.settings, storedSettings)

  if (!mergedSettings.enabled) {
    throw new Error("Spark model is disabled in settings.")
  }

  let missing = getMissingSparkFields(mergedSettings)
  if (missing.length > 0) {
    try {
      await syncSparkSettingsFromGasGx()
      const refreshed = await getSparkSettings()
      mergedSettings = normalizeSparkSettings(requestPayload.settings, refreshed)
      missing = getMissingSparkFields(mergedSettings)
    } catch (_syncError) {
      // Ignore sync failure and keep the original missing-fields error below.
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Spark settings incomplete. Missing: ${missing.join(", ")}. Open extension popup > Spark Settings and save.`
    )
  }

  const websocketUrl = await createSparkAuthorizedUrl(mergedSettings)
  const payload = buildSparkPayload(mergedSettings, requestPayload)
  const timeoutMs = Math.max(5000, Math.round(toNumber(requestPayload.timeoutMs, 30000)))

  return new Promise((resolve, reject) => {
    let ws = null
    let done = false
    let output = ""

    const finish = (handler, value) => {
      if (done) return
      done = true
      clearTimeout(timer)
      try {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close(1000, "completed")
        }
      } catch (_ignored) {
        // ignore close errors
      }
      handler(value)
    }

    const timer = setTimeout(() => {
      finish(reject, new Error("Spark request timed out."))
    }, timeoutMs)

    try {
      ws = new WebSocket(websocketUrl)
    } catch (error) {
      finish(reject, error)
      return
    }

    ws.onopen = () => {
      ws.send(JSON.stringify(payload))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data || "{}"))
        const headerCode = Number(data?.header?.code || 0)
        if (headerCode !== 0) {
          const headerMessage = toStringValue(data?.header?.message, `Spark error code ${headerCode}`)
          finish(reject, new Error(headerMessage))
          return
        }

        const textList = data?.payload?.choices?.text
        if (Array.isArray(textList) && textList.length > 0) {
          output += String(textList[0]?.content || "")
        }

        const status = Number(data?.payload?.choices?.status ?? 2)
        if (status === 2) {
          finish(resolve, output.trim())
        }
      } catch (error) {
        finish(reject, error)
      }
    }

    ws.onerror = () => {
      finish(reject, new Error("Spark websocket connection failed."))
    }

    ws.onclose = (event) => {
      if (done) return
      if (output.trim()) {
        finish(resolve, output.trim())
      } else {
        finish(reject, new Error(`Spark websocket closed: code=${event.code}`))
      }
    }
  })
}

async function getStateSnapshot() {
  const [language, sparkSettings, authConfig, googleSession, profileState] = await Promise.all([
    getLanguage(),
    getSparkSettings(),
    getAuthConfig(),
    getGoogleSession(),
    getProfileState()
  ])

  return {
    language,
    sparkSettings: createPublicSparkSettings(sparkSettings),
    authConfig: createPublicAuthConfig(authConfig),
    googleSession,
    profileState
  }
}

function success(payload = {}) {
  return { ok: true, ...payload }
}

function failure(error) {
  return { ok: false, error: safeErrorMessage(error) }
}

function queryTabs(queryInfo) {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (items) => {
      resolve(Array.isArray(items) ? items : [])
    })
  })
}

function createTab(createProperties) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create(createProperties, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve(tab)
    })
  })
}

function updateTab(tabId, updateProperties) {
  return new Promise((resolve, reject) => {
    chrome.tabs.update(tabId, updateProperties, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve(tab)
    })
  })
}

function focusWindow(windowId) {
  if (typeof windowId !== "number") return Promise.resolve()
  return new Promise((resolve) => {
    chrome.windows.update(windowId, { focused: true }, () => resolve())
  })
}

function sendMessageToTab(tabId, payload) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, payload, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message })
        return
      }
      resolve({ ok: true, response })
    })
  })
}

function isRecoverableTabMessageError(error) {
  return /Receiving end does not exist|Could not establish connection|Extension context invalidated/i.test(String(error || ""))
}

function waitForTabComplete(tabId, timeoutMs = 12000) {
  return new Promise((resolve) => {
    if (typeof tabId !== "number") {
      resolve(false)
      return
    }

    let done = false
    let timer = null

    const finish = (ok) => {
      if (done) return
      done = true
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      chrome.tabs.onUpdated.removeListener(onUpdated)
      resolve(Boolean(ok))
    }

    const onUpdated = (changedTabId, changeInfo) => {
      if (changedTabId !== tabId) return
      if (changeInfo?.status === "complete") finish(true)
    }

    chrome.tabs.onUpdated.addListener(onUpdated)
    timer = setTimeout(() => finish(false), Math.max(2000, timeoutMs))

    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        finish(false)
        return
      }
      if (tab?.status === "complete") {
        finish(true)
      }
    })
  })
}

async function sendOpenAdvancedWithRetry(tabId) {
  const delays = [0, 260, 800]
  let lastError = ""
  for (const delayMs of delays) {
    if (delayMs > 0) await sleep(delayMs)
    const result = await sendMessageToTab(tabId, { xacAction: "xac:content-open-advanced" })
    if (result.ok) return { ok: true }
    lastError = String(result.error || "")
    if (!isRecoverableTabMessageError(lastError)) {
      return { ok: false, recoverable: false, error: lastError }
    }
  }
  return { ok: false, recoverable: true, error: lastError || "Failed to reach content script." }
}

function buildXSearchUrl(rawQuery) {
  const query = toStringValue(rawQuery, "(gm OR gn) min_replies:1 -filter:replies")
  return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`
}

async function getPreferredXTab() {
  const patterns = ["*://*.x.com/*", "*://*.twitter.com/*"]
  const [activeCurrentWindow, allXTabs] = await Promise.all([
    queryTabs({ url: patterns, active: true, currentWindow: true }),
    queryTabs({ url: patterns })
  ])
  if (activeCurrentWindow[0]) return activeCurrentWindow[0]
  return allXTabs[0] || null
}

async function ensureXTabForCommand(rawQuery, createIfMissing = true) {
  const fallbackUrl = buildXSearchUrl(rawQuery)
  let tab = await getPreferredXTab()
  let created = false

  if (!tab && createIfMissing) {
    tab = await createTab({ url: fallbackUrl, active: true })
    created = true
  } else if (tab) {
    await updateTab(tab.id, { active: true })
  }

  await focusWindow(tab?.windowId)
  if (created) {
    await waitForTabComplete(tab.id, 14000)
  }

  return { tab: tab || null, created, fallbackUrl }
}

async function sendContentCommandWithRetry(rawQuery, payload, options = {}) {
  const createIfMissing = options.createIfMissing !== false
  const reopenOnRecoverable = options.reopenOnRecoverable !== false
  const { tab, created, fallbackUrl } = await ensureXTabForCommand(rawQuery, createIfMissing)

  if (!tab || typeof tab.id !== "number") {
    return {
      ok: false,
      created: false,
      tabId: null,
      error: "No X tab available."
    }
  }

  const delays = [0, 260, 800]
  let lastError = ""
  for (const delayMs of delays) {
    if (delayMs > 0) await sleep(delayMs)
    const result = await sendMessageToTab(tab.id, payload)
    if (result.ok) {
      return {
        ok: true,
        created,
        tabId: tab.id,
        response: result.response || null
      }
    }
    lastError = String(result.error || "")
    if (!isRecoverableTabMessageError(lastError)) {
      return {
        ok: false,
        created,
        tabId: tab.id,
        error: lastError,
        recoverable: false
      }
    }
  }

  if (reopenOnRecoverable) {
    await updateTab(tab.id, { url: fallbackUrl, active: true })
    await focusWindow(tab?.windowId)
    await waitForTabComplete(tab.id, 14000)

    for (const delayMs of delays) {
      if (delayMs > 0) await sleep(delayMs)
      const result = await sendMessageToTab(tab.id, payload)
      if (result.ok) {
        return {
          ok: true,
          created: true,
          tabId: tab.id,
          response: result.response || null,
          reopenedOnSearch: true
        }
      }
      lastError = String(result.error || "")
      if (!isRecoverableTabMessageError(lastError)) {
        return {
          ok: false,
          created: true,
          tabId: tab.id,
          error: lastError,
          recoverable: false
        }
      }
    }
  }

  return {
    ok: false,
    created,
    tabId: tab.id,
    error: lastError || "Failed to reach content script.",
    recoverable: true,
    needsRefresh: true
  }
}

async function openXSearchTab(rawQuery) {
  const url = buildXSearchUrl(rawQuery)
  const tab = await createTab({ url, active: true })
  await focusWindow(tab?.windowId)
  return { tabId: tab?.id || null, url }
}

async function openXAdvancedPanel(rawQuery) {
  const queryText = toStringValue(rawQuery, "")
  const result = await sendContentCommandWithRetry(
    queryText,
    { xacAction: "xac:content-open-advanced" },
    { createIfMissing: true, reopenOnRecoverable: true }
  )
  if (result.ok) {
    return {
      tabId: result.tabId,
      opened: true,
      created: result.created,
      reopenedOnSearch: Boolean(result.reopenedOnSearch)
    }
  }
  if (result.needsRefresh) {
    return {
      tabId: result.tabId,
      opened: false,
      needsRefresh: true,
      hint: "X tab was focused. If panel is missing, refresh once and retry."
    }
  }
  throw new Error(result.error || "Failed to open advanced panel in X tab")
}

async function getXRuntimeState(rawQuery) {
  const result = await sendContentCommandWithRetry(
    toStringValue(rawQuery, ""),
    { xacAction: "xac:content-get-runtime-state" },
    { createIfMissing: false, reopenOnRecoverable: false }
  )
  if (result.ok) {
    return {
      tabId: result.tabId,
      state: result.response?.state || result.response || null,
      created: result.created
    }
  }
  return {
    tabId: result.tabId || null,
    state: null,
    created: false,
    error: result.error || "",
    needsRefresh: Boolean(result.needsRefresh)
  }
}

async function startXAuto(rawQuery, max) {
  const result = await sendContentCommandWithRetry(
    toStringValue(rawQuery, ""),
    {
      xacAction: "xac:content-start-auto",
      max: Math.max(0, Math.round(toNumber(max, 0)))
    },
    { createIfMissing: true, reopenOnRecoverable: true }
  )
  if (result.ok) {
    return {
      tabId: result.tabId,
      created: result.created,
      reopenedOnSearch: Boolean(result.reopenedOnSearch),
      state: result.response?.state || result.response || null
    }
  }
  throw new Error(result.error || "Failed to start auto run in X tab")
}

async function stopXAuto(rawQuery) {
  const result = await sendContentCommandWithRetry(
    toStringValue(rawQuery, ""),
    { xacAction: "xac:content-stop-auto" },
    { createIfMissing: false, reopenOnRecoverable: false }
  )
  if (result.ok) {
    return {
      tabId: result.tabId,
      state: result.response?.state || result.response || null
    }
  }
  return {
    tabId: result.tabId || null,
    state: null,
    error: result.error || "",
    stopped: false
  }
}

let xacScheduleSyncPromise = null

async function readScheduleRuntimeState() {
  const stored = await storageGet([XAC_STORAGE_KEYS.scheduleRuntime])
  return normalizeScheduleRuntimeState(stored[XAC_STORAGE_KEYS.scheduleRuntime])
}

async function writeScheduleRuntimeState(runtime) {
  const next = normalizeScheduleRuntimeState(runtime)
  await storageSet({ [XAC_STORAGE_KEYS.scheduleRuntime]: next })
  return next
}

async function clearRetryAlarmsForSchedule(scheduleId) {
  const safeId = toStringValue(scheduleId, "")
  if (!safeId) return 0
  const alarms = await alarmsGetAll()
  let cleared = 0
  for (const alarm of alarms) {
    const parsed = parseRetryScheduleFromAlarm(alarm?.name)
    if (parsed.scheduleId !== safeId) continue
    await alarmsClear(alarm.name)
    cleared += 1
  }
  return cleared
}

async function getScheduleRuntimeSnapshot() {
  const { scheduledStarts } = await readScheduleRuntime()
  const runtime = await readScheduleRuntimeState()
  const entries = {}
  scheduledStarts.forEach((item) => {
    entries[item.id] = normalizeScheduleRuntimeEntry(runtime.entries[item.id], item.id)
  })
  return normalizeScheduleRuntimeState({
    ...runtime,
    entries
  })
}

async function readScheduleRuntime() {
  const stored = await storageGet([XAC_STORAGE_KEYS.scheduledStarts, XAC_STORAGE_KEYS.advancedSettings])
  const scheduledStarts = normalizeScheduledStarts(stored[XAC_STORAGE_KEYS.scheduledStarts])
  const advancedSettings = isPlainObject(stored[XAC_STORAGE_KEYS.advancedSettings]) ? stored[XAC_STORAGE_KEYS.advancedSettings] : {}
  const searchQuery = toStringValue(advancedSettings.searchQuery, XAC_DEFAULT_SEARCH_QUERY)
  const retryConfig = normalizeScheduleRetryConfig(advancedSettings)
  return { scheduledStarts, searchQuery, retryConfig }
}

async function syncScheduledStartAlarms() {
  const { scheduledStarts, retryConfig } = await readScheduleRuntime()
  const alarms = await alarmsGetAll()
  const active = scheduledStarts.filter((item) => item.enabled)
  const activeIds = new Set(active.map((item) => item.id))
  const activeNames = new Set(active.map((item) => alarmNameForSchedule(item.id)))
  const retryPlan = buildScheduleRetryDelayPlan(retryConfig)
  const maxRetryAttempts = retryPlan.length

  for (const alarm of alarms) {
    const name = toStringValue(alarm?.name, "")
    if (name.startsWith(XAC_SCHEDULE_ALARM_PREFIX)) {
      if (!activeNames.has(name)) {
        await alarmsClear(name)
      }
      continue
    }
    if (name.startsWith(XAC_SCHEDULE_RETRY_ALARM_PREFIX)) {
      const parsed = parseRetryScheduleFromAlarm(name)
      if (
        !parsed.scheduleId ||
        !activeIds.has(parsed.scheduleId) ||
        maxRetryAttempts <= 0 ||
        parsed.attempt > maxRetryAttempts
      ) {
        await alarmsClear(name)
      }
    }
  }

  const now = new Date()
  const nextRunById = {}
  for (const entry of active) {
    const alarmName = alarmNameForSchedule(entry.id)
    const when = getNextScheduleTimestamp(entry, now)
    nextRunById[entry.id] = when
    await alarmsClear(alarmName)
    await alarmsCreate(alarmName, { when })
  }

  const runtime = await readScheduleRuntimeState()
  const nextEntries = {}
  for (const entry of scheduledStarts) {
    const current = normalizeScheduleRuntimeEntry(runtime.entries[entry.id], entry.id)
    nextEntries[entry.id] = {
      ...current,
      id: entry.id,
      nextRunAt: entry.enabled ? normalizeTimestamp(nextRunById[entry.id]) : 0,
      retryAt: entry.enabled && maxRetryAttempts > 0 ? current.retryAt : 0,
      attemptCount: entry.enabled ? current.attemptCount : 0
    }
  }
  const nextRuntime = await writeScheduleRuntimeState({
    ...runtime,
    entries: nextEntries,
    lastSyncAt: Date.now(),
    updatedAt: Date.now()
  })

  return { count: active.length, runtime: nextRuntime }
}

function requestScheduleSync() {
  if (!xacScheduleSyncPromise) {
    xacScheduleSyncPromise = syncScheduledStartAlarms()
      .catch(() => ({ count: 0, runtime: normalizeScheduleRuntimeState(null) }))
      .finally(() => {
        xacScheduleSyncPromise = null
      })
  }
  return xacScheduleSyncPromise
}

async function handleScheduledStartAttempt(scheduleId, attempt = 0) {
  const safeScheduleId = toStringValue(scheduleId, "")
  if (!safeScheduleId) return { triggered: false }

  const { scheduledStarts, searchQuery, retryConfig } = await readScheduleRuntime()
  const retryPlan = buildScheduleRetryDelayPlan(retryConfig)
  const maxRetryAttempts = retryPlan.length
  const safeAttempt = clamp(Math.round(toNumber(attempt, 0)), 0, maxRetryAttempts)

  const runtime = await readScheduleRuntimeState()
  const currentEntry = normalizeScheduleRuntimeEntry(runtime.entries[safeScheduleId], safeScheduleId)
  const now = Date.now()
  currentEntry.lastTriggeredAt = now
  currentEntry.attemptCount = safeAttempt + 1

  const target = scheduledStarts.find((item) => item.id === safeScheduleId && item.enabled)
  if (!target) {
    currentEntry.lastResult = "skipped"
    currentEntry.lastError = ""
    currentEntry.lastErrorAt = 0
    currentEntry.retryAt = 0
    await clearRetryAlarmsForSchedule(safeScheduleId)
    await writeScheduleRuntimeState({
      ...runtime,
      entries: {
        ...runtime.entries,
        [safeScheduleId]: currentEntry
      },
      updatedAt: Date.now()
    })
    await requestScheduleSync()
    return { triggered: false, removed: true }
  }

  const probability = clamp(Math.round(toNumber(target.probability, 100)), 10, 100)
  if (Math.random() * 100 > probability) {
    currentEntry.lastResult = "skipped"
    currentEntry.lastError = `Skipped by probability (${probability}%).`
    currentEntry.lastErrorAt = now
    currentEntry.retryAt = 0
    await clearRetryAlarmsForSchedule(safeScheduleId)
    await writeScheduleRuntimeState({
      ...runtime,
      entries: {
        ...runtime.entries,
        [safeScheduleId]: currentEntry
      },
      updatedAt: Date.now()
    })
    const syncResult = await requestScheduleSync()
    return { triggered: true, scheduleId: safeScheduleId, attempt: safeAttempt + 1, result: "skipped", runtime: syncResult.runtime }
  }

  let runSucceeded = false
  let errorMessage = ""
  try {
    await startXAuto(searchQuery, target.max)
    runSucceeded = true
  } catch (error) {
    errorMessage = safeErrorMessage(error)
  }

  if (runSucceeded) {
    currentEntry.lastResult = "success"
    currentEntry.lastSuccessAt = now
    currentEntry.lastError = ""
    currentEntry.lastErrorAt = 0
    currentEntry.retryAt = 0
    currentEntry.totalSuccess = clamp(currentEntry.totalSuccess + 1, 0, 999999)
    await clearRetryAlarmsForSchedule(safeScheduleId)
  } else {
    const canRetry = safeAttempt < maxRetryAttempts
    currentEntry.lastFailureAt = now
    currentEntry.lastError = errorMessage || "Failed to start auto run in X tab"
    currentEntry.lastErrorAt = now
    currentEntry.totalFailure = clamp(currentEntry.totalFailure + 1, 0, 999999)
    if (canRetry) {
      const retryDelay = retryPlan[Math.min(safeAttempt, retryPlan.length - 1)] || 120000
      const retryAt = Date.now() + retryDelay
      const retryName = retryAlarmNameForSchedule(safeScheduleId, safeAttempt + 1)
      await alarmsClear(retryName)
      await alarmsCreate(retryName, { when: retryAt })
      currentEntry.retryAt = retryAt
      currentEntry.lastResult = "retry_scheduled"
    } else {
      currentEntry.retryAt = 0
      currentEntry.lastResult = "failed"
    }
  }

  await writeScheduleRuntimeState({
    ...runtime,
    entries: {
      ...runtime.entries,
      [safeScheduleId]: currentEntry
    },
    updatedAt: Date.now()
  })
  const syncResult = await requestScheduleSync()
  return {
    triggered: true,
    scheduleId: safeScheduleId,
    attempt: safeAttempt + 1,
    result: currentEntry.lastResult,
    runtime: syncResult.runtime
  }
}

async function handleScheduledStartAlarm(alarmName) {
  const scheduleId = parseScheduleIdFromAlarm(alarmName)
  if (!scheduleId) return { triggered: false }
  return handleScheduledStartAttempt(scheduleId, 0)
}

async function handleScheduledRetryAlarm(alarmName) {
  const parsed = parseRetryScheduleFromAlarm(alarmName)
  if (!parsed.scheduleId) return { triggered: false }
  return handleScheduledStartAttempt(parsed.scheduleId, parsed.attempt)
}

const XAC_BACKUP_LOCAL_KEYS = Object.freeze([
  XAC_STORAGE_KEYS.language,
  "xac.autoPostEnabled",
  XAC_STORAGE_KEYS.profiles,
  XAC_STORAGE_KEYS.activeProfileId,
  XAC_STORAGE_KEYS.quickSettings,
  XAC_STORAGE_KEYS.advancedSettings,
  "xac.replyRules",
  XAC_STORAGE_KEYS.scheduledStarts,
  "xac.profileMeta"
])

async function saveSettingsCloudBackup(payload = null) {
  const source = isPlainObject(payload) ? payload : (await storageGet(XAC_BACKUP_LOCAL_KEYS))
  const backupPayload = {
    version: 1,
    savedAt: Date.now(),
    settings: source
  }
  const serialized = JSON.stringify(backupPayload)
  if (serialized.length > 90000) {
    throw new Error("Settings payload is too large for cloud sync storage.")
  }
  await storageSyncSet({ [XAC_CLOUD_BACKUP_KEY]: backupPayload })
  return { savedAt: backupPayload.savedAt, size: serialized.length }
}

async function getSettingsCloudBackup(applyToLocal = false) {
  const data = await storageSyncGet([XAC_CLOUD_BACKUP_KEY])
  const payload = data?.[XAC_CLOUD_BACKUP_KEY]
  if (!isPlainObject(payload) || !isPlainObject(payload.settings)) {
    return { found: false, savedAt: 0, settings: null }
  }
  if (applyToLocal) {
    await storageSet(payload.settings)
  }
  return {
    found: true,
    savedAt: Math.max(0, Math.round(toNumber(payload.savedAt, 0))),
    settings: payload.settings
  }
}

async function handleXacMessage(message) {
  switch (message.xacAction) {
    case "xac:get-state": {
      return success({ state: await getStateSnapshot() })
    }
    case "xac:get-language": {
      return success({ language: await getLanguage() })
    }
    case "xac:set-language": {
      const language = await setLanguage(message.language)
      return success({ language })
    }
    case "xac:get-auth-config": {
      const authConfig = await getAuthConfig()
      return success({ authConfig: createPublicAuthConfig(authConfig) })
    }
    case "xac:set-auth-overrides": {
      const authConfig = await setAuthOverrides(message.authConfig || {})
      return success({ authConfig: createPublicAuthConfig(authConfig) })
    }
    case "xac:get-google-session": {
      return success({ googleSession: await getGoogleSession() })
    }
    case "xac:google-sign-in": {
      const googleSession = await signInWithGoogle()
      return success({ googleSession })
    }
    case "xac:sync-google-session": {
      const googleSession = await upsertGoogleSession(message.session || message.payload || {}, { fetchUser: true })
      return success({ googleSession, synced: true })
    }
    case "xac:google-sign-out": {
      await signOutGoogle()
      return success({ signedOut: true })
    }
    case "xac:get-spark-settings": {
      const sparkSettings = await getSparkSettings()
      return success({ sparkSettings: createPublicSparkSettings(sparkSettings) })
    }
    case "xac:sync-spark-settings": {
      const sparkSettings = await syncSparkSettingsFromGasGx()
      return success({ sparkSettings, synced: true })
    }
    case "xac:get-profile-state": {
      const profileState = await getProfileState()
      return success({ profileState })
    }
    case "xac:set-profile-state": {
      const profileState = await setProfileState(message.profileState || message.state || {})
      return success({ profileState })
    }
    case "xac:set-spark-settings": {
      const sparkSettings = await setSparkSettings(message.settings || {})
      return success({ sparkSettings: createPublicSparkSettings(sparkSettings) })
    }
    case "xac:spark-complete": {
      const text = await callSparkModel({
        prompt: message.prompt,
        systemPrompt: message.systemPrompt,
        messages: message.messages,
        settings: message.settings,
        timeoutMs: message.timeoutMs
      })
      return success({ text })
    }
    case "xac:open-x-search": {
      const result = await openXSearchTab(message.query)
      return success(result)
    }
    case "xac:open-advanced-panel": {
      const result = await openXAdvancedPanel(message.query)
      return success(result)
    }
    case "xac:get-runtime-state": {
      const result = await getXRuntimeState(message.query)
      return success(result)
    }
    case "xac:start-auto": {
      const result = await startXAuto(message.query, message.max)
      return success(result)
    }
    case "xac:stop-auto": {
      const result = await stopXAuto(message.query)
      return success(result)
    }
    case "xac:sync-scheduled-starts": {
      const result = await requestScheduleSync()
      return success({ synced: true, ...result })
    }
    case "xac:get-schedule-runtime": {
      const runtime = await getScheduleRuntimeSnapshot()
      return success({ runtime })
    }
    case "xac:save-settings":
    case "save-settings": {
      const result = await saveSettingsCloudBackup(message.settings || null)
      return success({ synced: true, ...result })
    }
    case "xac:get-saved-settings":
    case "get-saved-settings": {
      const result = await getSettingsCloudBackup(Boolean(message.applyToLocal || message.apply))
      return success(result)
    }
    default:
      return failure(`Unsupported xacAction: ${message.xacAction}`)
  }
}

async function reloadXTabsAfterUpdate() {
  const patterns = ["*://*.x.com/*", "*://*.twitter.com/*"]
  const tabs = await new Promise((resolve) => {
    chrome.tabs.query({ url: patterns }, (items) => {
      resolve(Array.isArray(items) ? items : [])
    })
  })

  for (const tab of tabs) {
    if (typeof tab?.id !== "number") continue
    try {
      await new Promise((resolve) => {
        chrome.tabs.reload(tab.id, {}, () => resolve(true))
      })
    } catch (_error) {
      // Ignore per-tab reload failures.
    }
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  const name = toStringValue(alarm?.name, "")
  if (name.startsWith(XAC_SCHEDULE_ALARM_PREFIX)) {
    handleScheduledStartAlarm(name).catch(() => {})
    return
  }
  if (name.startsWith(XAC_SCHEDULE_RETRY_ALARM_PREFIX)) {
    handleScheduledRetryAlarm(name).catch(() => {})
  }
})

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return
  if (changes[XAC_STORAGE_KEYS.scheduledStarts] || changes[XAC_STORAGE_KEYS.advancedSettings]) {
    requestScheduleSync().catch(() => {})
  }
})

if (chrome.runtime?.onStartup?.addListener) {
  chrome.runtime.onStartup.addListener(() => {
    requestScheduleSync().catch(() => {})
  })
}

chrome.runtime.onInstalled.addListener((details) => {
  const reason = String(details?.reason || "")
  if (reason !== "update" && reason !== "install") return
  reloadXTabsAfterUpdate().catch(() => {})
  requestScheduleSync().catch(() => {})
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.xacAction) {
    return undefined
  }

  handleXacMessage(message)
    .then((result) => sendResponse(result))
    .catch((error) => sendResponse(failure(error)))

  return true
})

requestScheduleSync().catch(() => {})
