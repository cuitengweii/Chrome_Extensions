(() => {
  "use strict";

  const ACCOUNT_KEY = "account";
  const UI_KEY = "ui";
  const MODE_KEY = "commentron_theme_mode";
  const LANG_KEY = "commentron_language";
  const BRAND_TITLE = "GasGx To Linkedin";
  const THEMES = ["dark", "light"];
  const LANGUAGES = ["en", "zh-CN"];
  const JSON_PARSE_PATCH_FLAG = "__ceJsonParsePatched";
  const AUTO_SEND_ENABLED_KEY = "ce_auto_send_enabled";
  const DELAY_MIN_SEC_KEY = "ce_auto_send_delay_min_sec";
  const DELAY_MAX_SEC_KEY = "ce_auto_send_delay_max_sec";
  const AUTO_SEND_CACHE_KEY = "ce_auto_send_popup_cache";
  const AUTO_SEND_CACHE_AT_KEY = "ce_auto_send_popup_cache_at";
  const RANDOM_TONE_ENABLED_KEY = "ce_random_tone_enabled";
  const RANDOM_LENGTH_ENABLED_KEY = "ce_random_length_enabled";
  const RANDOM_STRATEGY_CACHE_KEY = "ce_random_strategy_popup_cache";
  const RANDOM_STRATEGY_CACHE_AT_KEY = "ce_random_strategy_popup_cache_at";
  const REPLY_PROMPT_HINT_KEY = "ce_reply_prompt_hint";
  const REPLY_PROMPT_HINT_CACHE_KEY = "ce_reply_prompt_hint_popup_cache";
  const REPLY_PROMPT_HINT_CACHE_AT_KEY = "ce_reply_prompt_hint_popup_cache_at";
  const DEFAULT_AUTO_SEND_ENABLED = false;
  const DEFAULT_DELAY_MIN_SEC = 2;
  const DEFAULT_DELAY_MAX_SEC = 7;
  const DEFAULT_RANDOM_TONE_ENABLED = false;
  const DEFAULT_RANDOM_LENGTH_ENABLED = false;
  const DEFAULT_REPLY_PROMPT_HINT = "";
  const LINKEDIN_PROFILE_STORAGE_KEY = "profile";
  const GASGX_SIGNED_OUT_FLAG_KEY = "ce_gasgx_signed_out";
  const GASGX_LOCAL_SIGNED_IN_KEY = "ce_gasgx_local_signed_in";
  const GASGX_LOGIN_STATE_KEY = "ce_gasgx_login_state";
  const LEGACY_PREFERENCES_STORAGE_KEY = "preferences";
  const LEGACY_PREFERENCES_CANONICAL_KEY = "ce_legacy_preferences_canonical";
  const LEGACY_PREFERENCES_CACHE_KEY = "ce_legacy_preferences_popup_cache";
  const LEGACY_PREFERENCES_CACHE_AT_KEY = "ce_legacy_preferences_popup_cache_at";
  const LEGACY_TRUE_RAW = "true";
  const SPARK_SETTINGS_KEY = "ce.sparkSettings";
  const SPARK_CONFIG_RESOURCE_PATH = "config/spark.gasgx.json";
  const SPARK_DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    url: "https://spark-api.xf-yun.com/v1.1/chat",
    app_id: "",
    api_key: "",
    api_secret: "",
    domain: "lite",
    temperature: 0.3,
    max_tokens: 512
  });
  const SPARK_DEFAULT_ENV_KEYS = Object.freeze({
    enabled: "XFYUN_SPARK_ENABLED",
    url: "XFYUN_SPARK_URL",
    app_id: "XFYUN_SPARK_APP_ID",
    api_key: "XFYUN_SPARK_API_KEY",
    api_secret: "XFYUN_SPARK_API_SECRET",
    domain: "XFYUN_SPARK_DOMAIN",
    temperature: "XFYUN_SPARK_TEMPERATURE",
    max_tokens: "XFYUN_SPARK_MAX_TOKENS"
  });
  const SPARK_REQUIRED_FIELDS = Object.freeze(["url", "app_id", "api_key", "api_secret"]);
  const GASGX_AUTH_STORAGE_KEY = "ce_gasgx_auth_session";
  const GASGX_AUTH_CHANGED_EVENT = "ce:gasgx-auth-changed";
  const GASGX_AUTH_OVERLAY_ID = "ce-gasgx-auth-overlay";
  const GASGX_AUTH_BADGE_ID = "ce-gasgx-auth-badge";
  const GASGX_ACCOUNT_PANEL_ID = "ce-gasgx-account-panel";
  const GASGX_MAIN_SITE_STORAGE_KEY = "gasgx-main-auth";
  const GASGX_AUTH_REUSE_WINDOW_MS = 12 * 60 * 60 * 1000;
  const GASGX_SUPABASE_URL = "https://mkpcliytqudclkwtewru.supabase.co";
  const GASGX_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_S2uWAddQEXhWJgGeIF_ZbQ_H_thz2hw";
  const GASGX_EXTENSION_CONTACT_URL = "https://www.gasgx.com/account/account.html";
  const SPARK_FALLBACK_ROUTES = Object.freeze([
    { path: "/v1.1/chat", domain: "lite" },
    { path: "/v1.1/chat", domain: "general" },
    { path: "/v2.1/chat", domain: "generalv2" },
    { path: "/v3.1/chat", domain: "generalv3" },
    { path: "/v3.5/chat", domain: "generalv3.5" }
  ]);
  const TEST_SUBSCRIBER_ID = "000000000000000000000000";
  const DEFAULT_UI_STATE = Object.freeze({
    initializationInProgress: false,
    isLinkedInPage: true,
    isUpToDate: true,
    enabled: false,
    activeTab: 0,
    activePreferencesAccordion: null,
    activeAutomationAccordion: null,
    isSignInVisible: true,
    isResetSeatsVisible: false
  });
  const POPUP_LEGACY_HOST = "services.rocket-pod.ai";
  const POPUP_MOCK_XHR_FLAG = "__cePopupMockXhrInstalled";
  const POPUP_EMPTY_AUTOMATION_STATS = Object.freeze({
    total: 0,
    since: 0,
    today: 0
  });
  const POPUP_EMPTY_COMPLETIONS = Object.freeze({
    generated: {
      comments: 0,
      replies: 0
    },
    posted: {
      comments: 0,
      replies: 0
    }
  });
  const GATE_TEXT_PATTERN = /(free\s*trial|max(?:imum)?\s*usage|maximum\s*usage\s*allowed|upgrade|subscribe|already\s*a\s*subscriber|reached\s*the\s*maximum\s*usage|active\s*commentron\s*subscription|you\s*don.?t\s*have\s*an\s*active\s*commentron\s*subscription|sign-?in\s+using\s+the\s+extension\s+window|newer\s*commentron\s*version|please\s*update\s*commentron|update\s*commentron)/i;

  let autoSendEnabled = DEFAULT_AUTO_SEND_ENABLED;
  let autoSendSettingsLoaded = false;
  let autoSendDelayMinSec = DEFAULT_DELAY_MIN_SEC;
  let autoSendDelayMaxSec = DEFAULT_DELAY_MAX_SEC;
  let autoSendDebugHintTimer = 0;
  let randomToneEnabled = DEFAULT_RANDOM_TONE_ENABLED;
  let randomLengthEnabled = DEFAULT_RANDOM_LENGTH_ENABLED;
  let randomStrategyUpdatedAt = 0;
  let replyPromptHint = DEFAULT_REPLY_PROMPT_HINT;
  let sparkConfigPromise = null;
  let legacyPreferencesSyncTimer = 0;
  let legacyPreferencesWatchTimer = 0;
  let legacyPreferencesLastSnapshot = "";
  let legacyPreferencesWriteQueue = Promise.resolve();
  let legacyContentBundlePatched = false;
  let gasgxDerivedStorageSyncPromise = null;
  let gasgxDerivedStorageLastRunAt = 0;
  let gasgxDerivedStorageLastSignature = "";
  let gasgxSignedOutCache = false;
  let gasgxSignedOutCacheReady = false;
  let gasgxCommentGuardHintAt = 0;
  const ORIGINAL_STORAGE_GETTERS = new WeakMap();
  const ORIGINAL_STORAGE_SETTERS = new WeakMap();
  const gasgxAuthState = {
    loaded: false,
    loadingPromise: null,
    snapshot: null
  };
  let gasgxLastPersistedSnapshotRaw = "";

  function sparkIsPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function sparkToString(value, fallback = "") {
    if (value === undefined || value === null) return fallback;
    return String(value);
  }

  function sparkToNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function sparkToBoolean(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const lowered = value.trim().toLowerCase();
      if (["1", "true", "yes", "y", "on"].includes(lowered)) return true;
      if (["0", "false", "no", "n", "off"].includes(lowered)) return false;
    }
    return fallback;
  }

  function sparkClamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sparkHasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function normalizeSparkSettings(input, fallback = SPARK_DEFAULT_SETTINGS) {
    const base = { ...fallback };
    if (!sparkIsPlainObject(input)) return base;
    return {
      enabled: sparkToBoolean(input.enabled, base.enabled),
      url: sparkToString(input.url, base.url).trim(),
      app_id: sparkToString(input.app_id, base.app_id).trim(),
      api_key: sparkToString(input.api_key, base.api_key).trim(),
      api_secret: sparkToString(input.api_secret, base.api_secret).trim(),
      domain: sparkToString(input.domain, base.domain).trim() || base.domain,
      temperature: sparkClamp(sparkToNumber(input.temperature, base.temperature), 0, 1),
      max_tokens: sparkClamp(Math.round(sparkToNumber(input.max_tokens, base.max_tokens)), 128, 4096)
    };
  }

  function getMissingSparkFields(settings) {
    const normalized = normalizeSparkSettings(settings, SPARK_DEFAULT_SETTINGS);
    return SPARK_REQUIRED_FIELDS.filter((field) => !sparkToString(normalized[field], "").trim());
  }

  function mergeSparkSettings(base, partial) {
    const next = normalizeSparkSettings(base, SPARK_DEFAULT_SETTINGS);
    if (!sparkIsPlainObject(partial)) return next;

    if (sparkHasOwn(partial, "enabled")) {
      next.enabled = sparkToBoolean(partial.enabled, next.enabled);
    }

    const mergeTextField = (field) => {
      const value = sparkToString(partial[field], "").trim();
      if (value) next[field] = value;
    };

    mergeTextField("url");
    mergeTextField("app_id");
    mergeTextField("api_key");
    mergeTextField("api_secret");
    mergeTextField("domain");

    if (sparkHasOwn(partial, "temperature")) {
      const raw = sparkToString(partial.temperature, "").trim();
      if (raw !== "") {
        next.temperature = sparkClamp(sparkToNumber(partial.temperature, next.temperature), 0, 1);
      }
    }

    if (sparkHasOwn(partial, "max_tokens")) {
      const raw = sparkToString(partial.max_tokens, "").trim();
      if (raw !== "") {
        next.max_tokens = sparkClamp(Math.round(sparkToNumber(partial.max_tokens, next.max_tokens)), 128, 4096);
      }
    }

    return next;
  }

  function resolveSparkEnvKeyMap(rawMap) {
    const source = sparkIsPlainObject(rawMap) ? rawMap : {};
    const out = {};
    for (const key of Object.keys(SPARK_DEFAULT_ENV_KEYS)) {
      const fallback = SPARK_DEFAULT_ENV_KEYS[key];
      const value = sparkToString(source[key], fallback).trim();
      out[key] = value || fallback;
    }
    return out;
  }

  function readSparkEnvLike(envKeyMap) {
    const out = {};
    for (const key of Object.keys(SPARK_DEFAULT_ENV_KEYS)) {
      const storageKey = sparkToString(envKeyMap?.[key], "").trim();
      if (!storageKey) {
        out[key] = null;
        continue;
      }
      try {
        out[key] = localStorage.getItem(storageKey);
      } catch (_err) {
        out[key] = null;
      }
    }
    return out;
  }

  async function loadSparkConfigFromFile() {
    if (sparkConfigPromise) return sparkConfigPromise;
    sparkConfigPromise = (async () => {
      try {
        const url = chrome?.runtime?.getURL?.(SPARK_CONFIG_RESOURCE_PATH);
        if (!url) return null;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return null;
        const payload = await response.json();
        return sparkIsPlainObject(payload) ? payload : null;
      } catch (_err) {
        return null;
      }
    })();
    return await sparkConfigPromise;
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  async function hmacSha256Base64(secret, text) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(text));
    return arrayBufferToBase64(signature);
  }

  async function getSparkSettings() {
    const localSettings = await new Promise((resolve) => {
      try {
        chrome?.storage?.local?.get?.([SPARK_SETTINGS_KEY], (items) => {
          resolve(items?.[SPARK_SETTINGS_KEY] || null);
        });
      } catch (_err) {
        resolve(null);
      }
    });

    const configFromFile = await loadSparkConfigFromFile();
    const envKeyMap = resolveSparkEnvKeyMap(configFromFile?.envKeys);
    const envLike = readSparkEnvLike(envKeyMap);

    const withLocal = normalizeSparkSettings(localSettings, SPARK_DEFAULT_SETTINGS);
    const withConfig = mergeSparkSettings(withLocal, configFromFile?.settings);
    const merged = mergeSparkSettings(withConfig, envLike);
    return merged;
  }

  async function createSparkAuthorizedUrl(settings) {
    const endpoint = new URL(settings.url);
    if (endpoint.protocol === "https:") endpoint.protocol = "wss:";
    if (endpoint.protocol === "http:") endpoint.protocol = "ws:";
    const host = endpoint.host;
    const path = endpoint.pathname || "/";
    const date = new Date().toUTCString();
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
    const signatureBase64 = await hmacSha256Base64(settings.api_secret, signatureOrigin);
    const authorizationOrigin = `api_key="${settings.api_key}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`;
    const authorization = btoa(authorizationOrigin);

    endpoint.searchParams.set("authorization", authorization);
    endpoint.searchParams.set("date", date);
    endpoint.searchParams.set("host", host);
    return endpoint.toString();
  }

  function buildSparkRouteCandidates(settings) {
    let endpoint = null;
    try {
      endpoint = new URL(settings?.url || "");
    } catch (_err) {
      endpoint = null;
    }

    const protocol = endpoint?.protocol && /https?:/i.test(endpoint.protocol)
      ? endpoint.protocol
      : "https:";
    const host = sparkToString(endpoint?.host, "spark-api.xf-yun.com").trim() || "spark-api.xf-yun.com";
    const origin = `${protocol}//${host}`;
    const currentPath = sparkToString(endpoint?.pathname, "").trim() || "/v1.1/chat";
    const currentDomain = sparkToString(settings?.domain, "").trim() || "lite";

    const raw = [
      { url: `${origin}${currentPath}`, domain: currentDomain },
      ...SPARK_FALLBACK_ROUTES.map((item) => ({
        url: `${origin}${item.path}`,
        domain: item.domain
      }))
    ];

    const dedup = [];
    const seen = new Set();
    raw.forEach((item) => {
      const url = sparkToString(item?.url, "").trim();
      const domain = sparkToString(item?.domain, "").trim();
      if (!url || !domain) return;
      const key = `${url}@@${domain}`;
      if (seen.has(key)) return;
      seen.add(key);
      dedup.push({ url, domain });
    });
    return dedup;
  }

  function isSparkAuthRouteError(error) {
    const msg = sparkToString(error?.message || error, "").toLowerCase();
    return /appidnoautherror|appid\s*no\s*auth|app\s*id\s*no\s*auth|no\s*auth|unauthori[sz]ed|service\s*not\s*open|domain\s*not\s*(support|open)|invalid\s*app.?id/.test(msg);
  }

  function persistSparkWorkingRoute(baseSettings, route) {
    try {
      const storage = chrome?.storage?.local;
      if (!storage?.set) return;
      const next = normalizeSparkSettings({
        ...baseSettings,
        url: route?.url,
        domain: route?.domain
      }, SPARK_DEFAULT_SETTINGS);
      storage.set({ [SPARK_SETTINGS_KEY]: next }, () => void 0);
    } catch (_err) {
      // Best effort only.
    }
  }

  function buildSparkPayload(settings, requestPayload) {
    const messageList = [];

    if (Array.isArray(requestPayload.messages) && requestPayload.messages.length > 0) {
      requestPayload.messages.forEach((item) => {
        if (!sparkIsPlainObject(item)) return;
        const role = sparkToString(item.role, "user");
        const content = sparkToString(item.content, "");
        if (content.trim()) {
          messageList.push({ role, content });
        }
      });
    }

    if (messageList.length === 0) {
      const systemPrompt = sparkToString(requestPayload.systemPrompt, "");
      const prompt = sparkToString(requestPayload.prompt, "");
      if (systemPrompt.trim()) {
        messageList.push({ role: "system", content: systemPrompt.trim() });
      }
      if (prompt.trim()) {
        messageList.push({ role: "user", content: prompt.trim() });
      }
    }

    if (messageList.length === 0) {
      throw new Error("Spark prompt is empty.");
    }

    return {
      header: {
        app_id: settings.app_id,
        uid: crypto.randomUUID ? crypto.randomUUID() : "linkedin-spark"
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
    };
  }

  async function callSparkModelOnce(settings, requestPayload) {
    const websocketUrl = await createSparkAuthorizedUrl(settings);
    const payload = buildSparkPayload(settings, requestPayload);
    const timeoutMs = Math.max(5000, Math.round(sparkToNumber(requestPayload?.timeoutMs, 30000)));

    return await new Promise((resolve, reject) => {
      let ws = null;
      let done = false;
      let output = "";

      const finish = (handler, value) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close(1000, "completed");
          }
        } catch (_ignored) {
          // Ignore close errors.
        }
        handler(value);
      };

      const timer = setTimeout(() => {
        finish(reject, new Error("Spark request timed out."));
      }, timeoutMs);

      try {
        ws = new WebSocket(websocketUrl);
      } catch (error) {
        finish(reject, error);
        return;
      }

      ws.onopen = () => {
        ws.send(JSON.stringify(payload));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data || "{}"));
          const headerCode = Number(data?.header?.code || 0);
          if (headerCode !== 0) {
            const headerMessage = sparkToString(data?.header?.message, "Spark request failed");
            finish(reject, new Error(headerMessage));
            return;
          }
          const textList = data?.payload?.choices?.text;
          if (Array.isArray(textList) && textList.length > 0) {
            output += sparkToString(textList[0]?.content, "");
          }
          const status = Number(data?.payload?.choices?.status ?? 2);
          if (status === 2) {
            finish(resolve, output.trim());
          }
        } catch (error) {
          finish(reject, error);
        }
      };

      ws.onerror = () => {
        finish(reject, new Error("Spark websocket connection failed."));
      };

      ws.onclose = (event) => {
        if (done) return;
        if (output.trim()) {
          finish(resolve, output.trim());
        } else {
          finish(reject, new Error(`Spark websocket closed: code=${event.code}`));
        }
      };
    });
  }

  async function callSparkModel(requestPayload) {
    const storedSettings = await getSparkSettings();
    const mergedSettings = normalizeSparkSettings(requestPayload.settings, storedSettings);
    if (!mergedSettings.enabled) {
      throw new Error("Spark model is disabled in settings.");
    }
    const missing = getMissingSparkFields(mergedSettings);
    if (missing.length > 0) {
      throw new Error(`Spark settings incomplete: ${missing.join(", ")}`);
    }

    const candidates = buildSparkRouteCandidates(mergedSettings);
    let lastError = null;

    for (let i = 0; i < candidates.length; i += 1) {
      const route = candidates[i];
      const attemptSettings = normalizeSparkSettings({
        ...mergedSettings,
        url: route.url,
        domain: route.domain
      }, mergedSettings);
      try {
        const text = await callSparkModelOnce(attemptSettings, requestPayload);
        if (i > 0) {
          persistSparkWorkingRoute(mergedSettings, route);
        }
        return text;
      } catch (error) {
        lastError = error;
        const canRetry = isSparkAuthRouteError(error) && i < candidates.length - 1;
        if (!canRetry) {
          throw error;
        }
      }
    }

    throw lastError || new Error("Spark request failed.");
  }

  function resolveCommentLength(preferences) {
    const desiredRaw = preferences?.__ceDesiredCommentLength;
    if (typeof desiredRaw === "number" && Number.isFinite(desiredRaw)) {
      return Math.max(1, Math.min(3, Math.round(desiredRaw)));
    }
    if (typeof desiredRaw === "string") {
      const parsedDesired = Number(desiredRaw);
      if (Number.isFinite(parsedDesired)) {
        return Math.max(1, Math.min(3, Math.round(parsedDesired)));
      }
    }
    const raw = preferences?.commentLength;
    if (typeof raw === "number") return Math.max(1, Math.min(3, Math.round(raw)));
    if (typeof raw === "string") {
      if (/一段|one\s*paragraph/i.test(raw)) return 1;
      if (/二段|two\s*paragraph/i.test(raw)) return 2;
      if (/三段|three\s*paragraph/i.test(raw)) return 3;
      if (/super\s*short|supershort/i.test(raw)) return 1;
      if (/brief/i.test(raw)) return 2;
      if (/concise|in-?length|inlength|in\s*length/i.test(raw)) return 3;
    }
    return 2;
  }

  function adaptPreferencesForLegacyContentBundle(preferences) {
    const normalized = sanitizeLegacyPreferences(
      sparkIsPlainObject(preferences) ? preferences : getDefaultLegacyPreferences()
    );
    const desiredLength = resolveCommentLength(normalized);
    return {
      ...normalized,
      commentLength: desiredLength <= 1 ? 4 : 5,
      __ceDesiredCommentLength: desiredLength
    };
  }

  function pickRandomItem(list, fallback) {
    if (!Array.isArray(list) || list.length === 0) return fallback;
    const idx = Math.floor(Math.random() * list.length);
    return list[idx] ?? fallback;
  }

  function resolveCommentTone(preferences) {
    const pref = sparkIsPlainObject(preferences) ? preferences : {};
    const current = sparkToString(pref.commentTone, "Professional").trim() || "Professional";
    if (!randomToneEnabled) return current;
    const tonePool = [
      "Supportive",
      "Gracious",
      "Witty",
      "Polite",
      "Professional",
      "Friendly",
      "Formal",
      "Direct"
    ];
    return pickRandomItem(tonePool, current);
  }

  function resolveEffectiveCommentLength(preferences) {
    const current = resolveCommentLength(preferences);
    if (!randomLengthEnabled) return current;
    return pickRandomItem([1, 2, 3], current);
  }

  function resolveCommentGenerationProfile(preferences) {
    const pref = sparkIsPlainObject(preferences) ? preferences : {};
    return {
      tone: resolveCommentTone(pref),
      length: resolveEffectiveCommentLength(pref)
    };
  }

  function resolveVoiceGenderInstruction(value) {
    const normalized = sparkToString(value, "NotSpecified").trim();
    if (/^male$/i.test(normalized)) {
      return "If the language naturally marks gender, keep the first-person voice subtly masculine and professional. Do not use stereotypes.";
    }
    if (/^female$/i.test(normalized)) {
      return "If the language naturally marks gender, keep the first-person voice subtly feminine and professional. Do not use stereotypes.";
    }
    return "Keep the voice natural and gender-neutral unless the context clearly implies otherwise.";
  }

  function resolveIndustryInstruction(value) {
    const normalized = sparkToString(value, "").trim();
    if (!normalized || /^notspecified$/i.test(normalized)) return "";
    return `Use wording, priorities, and examples that sound credible to LinkedIn readers in the ${normalized} space without becoming jargon-heavy.`;
  }

  function resolveLinkedInUiLanguageInstruction(pageLang, useEnglish) {
    const normalized = normalizeLinkedInPageLang(pageLang);
    if (useEnglish || !normalized) return "";
    if (normalized === "zh-CN") {
      return "The current LinkedIn page is in Chinese, so keep the wording natural for Chinese LinkedIn readers.";
    }
    return "The current LinkedIn page is in English, so keep the wording natural for English-speaking LinkedIn readers.";
  }

  function resolveReplyHintInstruction(input) {
    const hint = normalizeReplyPromptHint(
      sparkToString(input?.replyHint, sparkToString(replyPromptHint, ""))
    );
    if (!hint) return "";
    return `Treat this as a mandatory extra instruction: ${hint}`;
  }

  function hintRequiresEndingEmoji(input) {
    const hint = normalizeReplyPromptHint(
      sparkToString(input?.replyHint, sparkToString(replyPromptHint, ""))
    ).toLowerCase();
    if (!hint) return false;
    return /最后.*表情|结尾.*表情|末尾.*表情|end.*emoji|emoji.*end|add.*emoji/.test(hint);
  }

  function ensureEndingEmojiByHint(text, input) {
    const normalized = normalizeSparkOutput(text);
    if (!normalized) return normalized;
    if (!hintRequiresEndingEmoji(input)) return normalized;
    if (containsEmoji(normalized.slice(-8))) return normalized;
    return `${normalized} 🙂`;
  }

  function ensureCommentAnchoredToPost(text, input) {
    const normalized = normalizeSparkOutput(text);
    if (!normalized) return normalized;
    const anchor = extractContextAnchor(input?.postText, true);
    if (!anchor || anchor === "the key point you raised") return normalized;

    const normalizedLower = normalized.toLowerCase();
    const tokens = anchor
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((part) => part.length >= 4)
      .slice(0, 3);
    if (tokens.some((token) => normalizedLower.includes(token))) return normalized;

    const paragraphs = splitCommentParagraphs(normalized);
    if (!paragraphs.length) return normalized;
    paragraphs[0] = `${paragraphs[0].trim()} One concrete point worth highlighting is ${anchor}.`.trim();
    return normalizeSparkOutput(paragraphs.join("\n\n"));
  }

  function extractContextAnchor(rawText, useEnglish = true) {
    const fallback = useEnglish ? "the key point you raised" : "你提到的关键点";
    const normalized = sparkToString(rawText, "")
      .replace(/https?:\/\/\S+/gi, " ")
      .replace(/[#@][\w-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!normalized) return fallback;

    const parts = normalized
      .split(/[.!?。！？]/)
      .map((part) => part.trim())
      .filter(Boolean);
    const picked = parts.find((part) => part.length >= 14) || parts[0] || "";
    if (!picked) return fallback;

    const clipped = picked.length > 84 ? `${picked.slice(0, 84).trim()}...` : picked;
    return clipped || fallback;
  }

  function normalizeSparkOutput(text) {
    return sparkToString(text, "")
      .replace(/^\s*```(?:json|text)?/i, "")
      .replace(/```\s*$/i, "")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function debugCommentTrace(stage, payload) {
    try {
      const summary = payload && typeof payload === "object" ? payload : { value: payload };
      console.info("[CE comment trace]", stage, summary);
    } catch (_err) {
      // Ignore debug logging failures.
    }
  }

  function isEnabledLike(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const lowered = value.trim().toLowerCase();
      return ["1", "true", "yes", "y", "on"].includes(lowered);
    }
    return false;
  }

  function isEmojiPreferenceEnabled(pref) {
    if (!sparkIsPlainObject(pref)) return false;
    return (
      isEnabledLike(pref.commentUseEmojis) ||
      isEnabledLike(pref.commentUseEmoji) ||
      isEnabledLike(pref.useEmojis) ||
      isEnabledLike(pref.useEmoji)
    );
  }

  function containsEmoji(text) {
    if (!text) return false;
    return /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text);
  }

  function tokenizeWords(text) {
    return sparkToString(text, "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean);
  }

  function truncateToWords(text, maxWords) {
    const words = tokenizeWords(text);
    if (!Number.isFinite(maxWords) || maxWords <= 0 || words.length <= maxWords) {
      return sparkToString(text, "").trim();
    }
    return words.slice(0, maxWords).join(" ").trim();
  }

  function ensureQuestionEnding(text) {
    const normalized = sparkToString(text, "").trim();
    if (!normalized) return normalized;
    if (/[?？]\s*$/.test(normalized)) return normalized;
    return `${normalized}?`;
  }

  function ensureMentionPrefix(text, author) {
    const normalized = sparkToString(text, "").trim();
    const name = sparkToString(author, "").trim();
    if (!normalized || !name) return normalized;
    const mention = `@${name}`;
    if (normalized.includes(mention)) return normalized;
    return `${mention} ${normalized}`.trim();
  }

  function resolveCommentParagraphCount(preferences) {
    const level = resolveCommentLength(preferences);
    return Math.max(1, Math.min(3, level));
  }

  function resolveCommentCharacterLimit(preferences) {
    return resolveCommentParagraphCount(preferences) * 200;
  }

  function resolveReplyWordLimit(preferences) {
    void preferences;
    return 40;
  }

  function countEmoji(text) {
    const source = sparkToString(text, "");
    const matches = source.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu);
    return matches ? matches.length : 0;
  }

  function ensureMultiEmoji(text, minCount = 2) {
    const normalized = normalizeSparkOutput(text);
    if (!normalized) return normalized;
    let out = normalized;
    const target = Math.max(1, Math.round(minCount));
    const palette = ["\u{1F642}", "\u{1F44D}", "\u{1F680}", "\u{1F4A1}"];
    let index = 0;
    while (countEmoji(out) < target) {
      const emoji = palette[index % palette.length];
      out = `${out} ${emoji}`.trim();
      index += 1;
    }
    return out;
  }

  function splitCommentParagraphs(text) {
    return normalizeSparkOutput(text)
      .split(/\n{2,}/)
      .map((part) => sparkToString(part, "").replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  function escapeHtmlText(text) {
    return sparkToString(text, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function dispatchEditorInput(element, inputType, data) {
    if (!element) return;
    try {
      element.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        inputType,
        data
      }));
      return;
    } catch (_err) {}
    try {
      element.dispatchEvent(new Event("input", { bubbles: true }));
    } catch (_err) {}
  }

  function dispatchEditorBeforeInput(element, inputType, data) {
    if (!element) return;
    try {
      element.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType,
        data
      }));
    } catch (_err) {}
  }

  function dispatchEditorLifecycleEvents(element, text) {
    if (!element) return;
    const payload = sparkToString(text, "");
    dispatchEditorBeforeInput(element, "insertText", payload);
    dispatchEditorInput(element, "insertText", payload);
    try {
      element.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (_err) {}
    try {
      element.dispatchEvent(new KeyboardEvent("keyup", {
        bubbles: true,
        key: "Enter"
      }));
    } catch (_err) {}
  }

  function moveCaretToEnd(element) {
    if (!element) return;
    try {
      const selection = window.getSelection?.();
      if (!selection) return;
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (_err) {}
  }

  function clearEditableContent(element) {
    if (!element) return;
    try {
      element.focus();
    } catch (_err) {}
    try {
      const selection = window.getSelection?.();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (_err) {}
    try {
      document.execCommand("delete", false, null);
    } catch (_err) {}
    try {
      element.innerHTML = "";
    } catch (_err) {
      element.textContent = "";
    }
    moveCaretToEnd(element);
  }

  function readEditableParagraphCount(element) {
    const raw = sparkToString(element?.innerText || element?.textContent, "")
      .replace(/\u00A0/g, " ")
      .replace(/\r\n/g, "\n");
    return raw
      .split(/\n+/)
      .map((part) => part.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .length;
  }

  function tryExecInsertParagraphs(element, paragraphs) {
    if (!element || !Array.isArray(paragraphs) || !paragraphs.length) return false;
    clearEditableContent(element);
    try {
      element.focus();
    } catch (_err) {}
    moveCaretToEnd(element);

    try {
      for (let index = 0; index < paragraphs.length; index += 1) {
        if (index > 0) {
          document.execCommand("insertParagraph", false, null);
        }
        document.execCommand("insertText", false, paragraphs[index]);
      }
      dispatchEditorInput(element, "insertParagraph", paragraphs.join("\n\n"));
      return readEditableParagraphCount(element) >= paragraphs.length;
    } catch (_err) {
      return false;
    }
  }

  function tryHtmlInsertParagraphs(element, paragraphs) {
    if (!element || !Array.isArray(paragraphs) || !paragraphs.length) return false;
    clearEditableContent(element);
    const html = paragraphs.map((part) => `<p>${escapeHtmlText(part)}</p>`).join("");

    try {
      element.focus();
    } catch (_err) {}
    moveCaretToEnd(element);

    try {
      document.execCommand("insertHTML", false, html);
    } catch (_err) {
      try {
        element.innerHTML = html;
      } catch (_innerErr) {
        return false;
      }
    }

    moveCaretToEnd(element);
    dispatchEditorInput(element, "insertParagraph", paragraphs.join("\n\n"));
    return readEditableParagraphCount(element) >= paragraphs.length;
  }

  function pasteCommentIntoLinkedInEditor(element, text) {
    if (!element) return;
    const paragraphs = splitCommentParagraphs(text);
    if (!paragraphs.length) {
      clearEditableContent(element);
      dispatchEditorInput(element, "deleteContentBackward", "");
      return;
    }

    let pasted = tryExecInsertParagraphs(element, paragraphs);
    if (!pasted) {
      pasted = tryHtmlInsertParagraphs(element, paragraphs);
    }
    if (!pasted) {
      clearEditableContent(element);
      element.textContent = paragraphs.join("\n\n");
      moveCaretToEnd(element);
      dispatchEditorInput(element, "insertText", paragraphs.join("\n\n"));
    }
    dispatchEditorLifecycleEvents(element, paragraphs.join("\n\n"));

    debugCommentTrace("paste-verify", {
      requestedParagraphs: paragraphs.length,
      actualParagraphs: readEditableParagraphCount(element),
      actualText: sparkToString(element?.innerText || element?.textContent, "").trim()
    });
  }

  function splitSentences(text) {
    const normalized = sparkToString(text, "").replace(/\s+/g, " ").trim();
    if (!normalized) return [];
    return normalized
      .split(/(?<=[.!?。！？])\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function containsCjk(text) {
    return /[\u3400-\u9FFF]/u.test(sparkToString(text, ""));
  }

  function looksMostlyEnglish(text) {
    const normalized = sparkToString(text, "").trim();
    if (!normalized) return false;
    if (containsCjk(normalized)) return false;
    return /[A-Za-z]/.test(normalized);
  }

  function resolveCommentOutputEnglish(input, text) {
    return true;
  }

  function trimParagraphToMaxChars(text, maxChars = 200) {
    const normalized = sparkToString(text, "").replace(/\s+/g, " ").trim();
    if (!normalized) return normalized;
    // Keep length as a soft preference. Only guard against extreme outliers.
    const hardLimit = Math.max(420, maxChars);
    if (normalized.length <= hardLimit) return normalized;
    const clipped = normalized.slice(0, hardLimit);
    const minPreferredCut = Math.max(1, Math.floor(hardLimit * 0.72));
    let cutIndex = -1;

    try {
      const sentenceMatches = Array.from(clipped.matchAll(/[.!?。！？](?=\s|$)/gu));
      if (sentenceMatches.length) {
        const lastMatch = sentenceMatches[sentenceMatches.length - 1];
        cutIndex = Number(lastMatch.index) + String(lastMatch[0] || "").length;
      }
    } catch (_err) {}

    if (!Number.isFinite(cutIndex) || cutIndex < minPreferredCut) {
      const lastSpace = clipped.lastIndexOf(" ");
      if (lastSpace >= minPreferredCut) {
        cutIndex = lastSpace;
      }
    }

    const safeText = cutIndex >= minPreferredCut ? clipped.slice(0, cutIndex) : clipped;
    return safeText.trim().replace(/[，,、;；:：\-–—\s]+$/u, "").trim();
  }

  function buildParagraphFallback(index, total, useEnglish) {
    if (useEnglish) {
      const samples = [
        "A practical takeaway here is how clearly the idea can be applied in real work.",
        "I like that this focuses on execution instead of staying at the abstract level.",
        "This also opens up a useful next step for teams trying to move faster."
      ];
      return trimParagraphToMaxChars(samples[index % samples.length], 200);
    }
    const samples = [
      "很认同这个思路，真正有价值的是它能直接落到实际执行里。",
      "我尤其喜欢这里强调的方法感，不只是观点本身，而是可操作性很强。",
      "如果继续展开下去，这个方向对团队协作和结果推进都会很有帮助。"
    ];
    return trimParagraphToMaxChars(samples[index % samples.length], 200);
  }

  function extendParagraphToMinChars(text, index, useEnglish = false, minChars = 120, maxChars = 200) {
    let normalized = trimParagraphToMaxChars(text, maxChars);
    if (!normalized) {
      normalized = buildParagraphFallback(index, 3, useEnglish);
    }

    const extras = useEnglish
      ? [
          "It also feels relevant because the point is immediately usable in day-to-day execution.",
          "That practical angle is what makes the post more credible and worth engaging with.",
          "There is enough substance here to spark a more meaningful discussion with the broader team."
        ]
      : [
          "而且这种表达不是停留在概念层面，放到真实工作里也很容易找到对应的应用场景。",
          "这也是我觉得它特别有价值的原因，因为观点和执行之间的连接被讲得比较清楚。",
          "如果从团队协作和实际结果推进的角度看，这个思路也确实很值得继续展开。"
        ];

    let cursor = 0;
    while (normalized.length < minChars) {
      const addition = extras[cursor % extras.length];
      const next = `${normalized} ${addition}`.replace(/\s+/g, " ").trim();
      const trimmed = trimParagraphToMaxChars(next, maxChars);
      if (!trimmed || trimmed === normalized) break;
      normalized = trimmed;
      cursor += 1;
    }

    if (normalized.length < minChars) {
      const fallback = trimParagraphToMaxChars(buildParagraphFallback(index, 3, useEnglish), maxChars);
      if (fallback && fallback !== normalized) {
        const combined = trimParagraphToMaxChars(`${normalized} ${fallback}`, maxChars);
        if (combined) normalized = combined;
      }
    }

    return normalized;
  }

  function ensureParagraphCount(text, count, useEnglish = false) {
    const normalized = normalizeSparkOutput(text);
    if (!normalized) return normalized;
    const targetCount = Math.max(1, Math.min(3, Math.round(sparkToNumber(count, 1))));
    const existing = splitCommentParagraphs(normalized);
    if (existing.length >= targetCount) {
      return existing.slice(0, targetCount).join("\n\n");
    }

    const sentences = splitSentences(normalized);
    if (sentences.length >= targetCount) {
      const groups = [];
      let cursor = 0;
      const baseSize = Math.floor(sentences.length / targetCount);
      let remainder = sentences.length % targetCount;
      for (let i = 0; i < targetCount; i += 1) {
        const size = baseSize + (remainder > 0 ? 1 : 0);
        remainder = Math.max(0, remainder - 1);
        const chunk = sentences.slice(cursor, cursor + Math.max(1, size));
        cursor += Math.max(1, size);
        groups.push(chunk.join(" ").trim());
      }
      return groups.filter(Boolean).join("\n\n");
    }

    const paragraphs = [normalized.replace(/\n+/g, " ").trim()].filter(Boolean);
    while (paragraphs.length < targetCount) {
      paragraphs.push(buildParagraphFallback(paragraphs.length, targetCount, useEnglish));
    }
    return paragraphs.filter(Boolean).join("\n\n");
  }

  function ensureParagraphCompleteThought(paragraph) {
    const text = sparkToString(paragraph, "").trim();
    if (!text) return text;
    if (endsLikeCompleteThought(text)) return text;
    const matches = Array.from(text.matchAll(/[.!?。！？](?=\s|$)/gu));
    if (matches.length) {
      const last = matches[matches.length - 1];
      const endAt = Number(last.index) + String(last[0] || "").length;
      if (Number.isFinite(endAt) && endAt >= Math.floor(text.length * 0.55)) {
        return text.slice(0, endAt).trim();
      }
    }
    return `${text}.`;
  }

  function enforceEmojiByPreference(text, pref) {
    const normalized = normalizeSparkOutput(text);
    if (!normalized) return normalized;
    if (!isEmojiPreferenceEnabled(pref)) return normalized;
    return ensureMultiEmoji(normalized, 2);
  }

  function enforceCommentByPreference(text, input) {
    const pref = sparkIsPlainObject(input?.preferences) ? input.preferences : {};
    const author = sparkToString(input?.postAuthor, "").trim();
    const length = Number(input?.__ceEffectiveLength) || resolveCommentLength(pref);
    const paragraphCount = resolveCommentParagraphCount({ ...pref, commentLength: length });
    let out = normalizeSparkOutput(text);
    if (!out) return out;
    const useEnglish = resolveCommentOutputEnglish(input, out);

    out = ensureCommentAnchoredToPost(out, input);

    if (isEnabledLike(pref.commentMentionPostAuthor)) {
      out = ensureMentionPrefix(out, author);
    }

    out = ensureParagraphCount(out, paragraphCount, useEnglish);
    out = splitCommentParagraphs(out).map(ensureParagraphCompleteThought).filter(Boolean).join("\n\n");
    out = enforceEmojiByPreference(out, pref);
    if (isEmojiPreferenceEnabled(pref) && paragraphCount >= 3) {
      out = ensureMultiEmoji(out, 3);
    }

    if (isEnabledLike(pref.commentEndWithQuestion)) {
      out = ensureQuestionEnding(out);
    }

    out = ensureEndingEmojiByHint(out, input);
    return normalizeSparkOutput(out);
  }

  function enforceReplyByPreference(text, input) {
    const pref = sparkIsPlainObject(input?.preferences) ? input.preferences : {};
    let out = normalizeSparkOutput(text);
    if (!out) return out;

    const replyWordLimit = resolveReplyWordLimit(pref);
    out = truncateToWords(out, replyWordLimit);

    if (isEnabledLike(pref.replyEndWithQuestion)) {
      out = ensureQuestionEnding(out);
    }

    out = ensureEndingEmojiByHint(out, input);
    return normalizeSparkOutput(out);
  }

  function buildCommentPrompt(input) {
    const pref = sparkIsPlainObject(input?.preferences) ? input.preferences : {};
    const profile = sparkIsPlainObject(input?.__ceGenerationProfile) ? input.__ceGenerationProfile : {};
    const length = Number(profile.length) || resolveEffectiveCommentLength(pref);
    const useEnglish = true;
    const mentionAuthor = !!pref.commentMentionPostAuthor;
    const useEmoji = !!pref.commentUseEmojis;
    const endQuestion = !!pref.commentEndWithQuestion;
    const tone = sparkToString(profile.tone, resolveCommentTone(pref));
    const author = sparkToString(input?.postAuthor, "").trim();
    const postText = sparkToString(input?.postText, "").trim();
    const voiceGenderGuide = resolveVoiceGenderInstruction(pref.voiceGender);
    const industryGuide = resolveIndustryInstruction(pref.commentIndustry);
    const linkedInUiGuide = resolveLinkedInUiLanguageInstruction(input?.linkedInUiLanguage || currentLang, useEnglish);
    const replyHintGuide = resolveReplyHintInstruction(input);

    const lengthGuide = length === 1
      ? "Output exactly 1 paragraph."
      : length === 2
        ? "Output exactly 2 paragraphs."
        : "Output exactly 3 paragraphs.";

    const languageGuide = "Use English only. Do not output any Chinese or any other non-English sentence.";
    const mentionGuide = mentionAuthor && author
      ? `Start the first paragraph naturally with @${author}.`
      : "Do not force @mentions.";
    const emojiGuide = useEmoji
      ? (length >= 3
        ? "Use emojis naturally across the full comment, with at least 3 total emojis overall."
        : "Use emojis naturally, with at least 2 total emojis overall.")
      : "Do not use emoji.";
    const endingGuide = endQuestion
      ? "End the final paragraph with one natural question."
      : "Do not force a question ending.";
    const linkedInGuide = linkedInUiGuide || "Stay aligned with LinkedIn feed discussion style and professional wording.";

    return {
      systemPrompt: "You are a senior LinkedIn engagement writer. Follow every structure and preference constraint exactly. Think silently, self-check silently, and return only the final LinkedIn comment text.",
      prompt:
`Write a high-quality LinkedIn feed comment for the post below.

Hard output requirements:
- ${lengthGuide}
- Separate paragraphs with a single blank line.
- Keep paragraph length natural; 120-200 characters is only a loose recommendation, not a hard limit.
- Every paragraph must end as a complete thought.
- Never cut off a word, never leave a sentence unfinished, and never end with a dangling fragment.
- If any paragraph would be too long, rewrite it shorter. Do not trim or compress it by dropping the ending.
- Return plain text only. No bullets, no numbering, no labels like "Paragraph 1", no hashtags, no quotation marks, no markdown, and no explanations.

Preference profile:
- Tone: ${tone}.
- ${voiceGenderGuide}
- ${languageGuide}
- ${linkedInGuide}
- ${mentionGuide}
- ${emojiGuide}
- ${endingGuide}
${industryGuide ? `- ${industryGuide}` : ""}
${replyHintGuide ? `- ${replyHintGuide}` : ""}

Quality requirements:
- Sound like a real LinkedIn professional reacting to a published post.
- Be specific and insightful instead of generic praise.
- Focus on one or two concrete takeaways from the post and why they matter.
- Do not copy the post sentence by sentence or paraphrase it mechanically.
- Avoid weak filler such as "Great post" unless it is followed by a concrete observation.
- Keep the wording native to LinkedIn comments: thoughtful, concise, credible, and easy to paste directly into the feed.

Self-check before answering:
1. Paragraph count is exactly ${length}.
2. Paragraph lengths are natural and readable (120-200 is only a guideline).
3. No paragraph ends mid-word or mid-sentence.
4. The full comment is entirely in English.
5. The final text is ready to paste into LinkedIn as-is.

Post author: ${author || "(unknown)"}
Post content:
${postText || "(empty)"}

Return only the final comment text.` 
    };
  }

  function buildReplyPrompt(input) {
    const pref = sparkIsPlainObject(input?.preferences) ? input.preferences : {};
    const useEnglish = !!pref.engageInEnglish;
    const endQuestion = !!pref.replyEndWithQuestion;
    const tone = sparkToString(pref.commentTone, "Professional");
    const postAuthor = sparkToString(input?.postAuthor, "").trim();
    const postText = sparkToString(input?.postText, "").trim();
    const commentText = sparkToString(input?.commentText, "").trim();
    const me = sparkToString(input?.me, "").trim();
    const voiceGenderGuide = resolveVoiceGenderInstruction(pref.voiceGender);
    const industryGuide = resolveIndustryInstruction(pref.commentIndustry);
    const replyHintGuide = resolveReplyHintInstruction(input);
    const linkedInUiGuide = resolveLinkedInUiLanguageInstruction(input?.linkedInUiLanguage || currentLang, useEnglish);

    const languageGuide = useEnglish
      ? "Use English only."
      : "Use the same language as the thread.";
    const lengthGuide = "Keep the reply brief: 1-2 sentences, ideally around 20-35 words, and never above 40 words.";
    const endingGuide = endQuestion
      ? "End with one natural question."
      : "Do not force a question ending.";
    const linkedInGuide = linkedInUiGuide || "Stay aligned with LinkedIn thread wording and professional discussion style.";

    return {
      systemPrompt: "You are a senior LinkedIn reply writer for public LinkedIn threads. Obey every preference exactly, think silently, self-check silently, and return only the final reply text.",
      prompt:
`Write a LinkedIn reply to an existing comment.

Hard output requirements:
- Return exactly one reply and nothing else.
- ${lengthGuide}
- Every sentence must end cleanly. Never cut off a word, phrase, or sentence.
- Return plain text only. No hashtags, no quotation marks, no markdown, no explanations, and no bullet formatting.

Preference profile:
- Tone: ${tone}.
- ${voiceGenderGuide}
- ${languageGuide}
- ${linkedInGuide}
- ${endingGuide}
${industryGuide ? `- ${industryGuide}` : ""}
${replyHintGuide ? `- ${replyHintGuide}` : ""}

Quality requirements:
- Keep the reply natural, professional, and context-aware for a public LinkedIn discussion.
- Respond to the actual comment, not just the post in general.
- Avoid repeating the same sentence patterns or sounding robotic.
- The reply should feel useful, warm, and credible for LinkedIn.

Self-check before answering:
1. The reply follows the requested language exactly.
2. The reply respects the requested length limit.
3. The reply ends cleanly with no cut-off text.
4. The reply is ready to paste directly into the thread.

My name: ${me || "(unknown)"}
Post author: ${postAuthor || "(unknown)"}
Post content:
${postText || "(empty)"}

Comment to reply:
${commentText || "(empty)"}
`
    };
  }

  function buildCommentFallbackText(input, profile) {
    const pref = sparkIsPlainObject(input?.preferences) ? input.preferences : {};
    const useEnglish = true;
    const author = sparkToString(input?.postAuthor, "").trim();
    const mention = isEnabledLike(pref.commentMentionPostAuthor) && author ? `@${author} ` : "";
    const length = Number(profile?.length) || resolveEffectiveCommentLength(pref);
    const postAnchor = extractContextAnchor(input?.postText, useEnglish);
    const hint = normalizeReplyPromptHint(
      sparkToString(input?.replyHint, sparkToString(replyPromptHint, ""))
    );
    const hintLine = hint
      ? (useEnglish
        ? `I'll follow this angle as well: ${hint}.`
        : `我也会按这个方向补充：${hint}。`)
      : (useEnglish
        ? "This angle can make the discussion immediately more actionable."
        : "这个角度能让讨论更可落地。");

    if (useEnglish) {
      const p1 = `${mention}Your point about "${postAnchor}" stood out to me, especially the way it connects strategy with execution decisions that teams can actually apply.`;
      const p2 = `${hintLine} A practical next step could be showing one concrete scenario with tradeoffs, owners, and how you'd measure impact over the next iteration.`;
      const p3 = "That would make this insight even easier for others to operationalize and adapt to their own context without losing the core intent.";
      if (length >= 3) return `${p1}\n\n${p2}\n\n${p3}`;
      if (length === 1) return `${p1} ${p2}`.trim();
      return `${p1}\n\n${p2}`;
    }

    const p1 = `${mention}你提到“${postAnchor}”这个点很关键，尤其是把思路和执行动作连接起来这部分，对实际推进很有参考价值。`;
    const p2 = hintLine;
    const p3 = "如果方便的话，也期待你后续补充一个更具体的案例。";
    if (length >= 3) return `${p1}\n\n${p2}\n\n${p3}`;
    if (length === 1) return `${p1}${p2}`.trim();
    return `${p1}\n\n${p2}`;
  }

  function buildReplyFallbackText(input) {
    const pref = sparkIsPlainObject(input?.preferences) ? input.preferences : {};
    const useEnglish = !!pref.engageInEnglish;
    const commentAnchor = extractContextAnchor(input?.commentText, useEnglish);
    const hint = normalizeReplyPromptHint(
      sparkToString(input?.replyHint, sparkToString(replyPromptHint, ""))
    );
    if (useEnglish) {
      const base = `Thanks for your comment on "${commentAnchor}" - really appreciate that perspective.`;
      return hint ? `${base} I'll apply this direction: ${hint}.` : base;
    }
    const base = `感谢你的评论，特别是你提到“${commentAnchor}”这个点很有价值。`;
    return hint ? `${base} 我会按这个方向补充：${hint}。` : base;
  }

  function endsLikeCompleteThought(text) {
    const normalized = sparkToString(text, "").trim();
    if (!normalized) return false;
    if (/[.!?。！？…]["')\]]*$/u.test(normalized)) return true;
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]["')\]]*$/u.test(normalized)) return true;
    return false;
  }

  function validateCommentOutput(text, input) {
    const pref = sparkIsPlainObject(input?.preferences) ? input.preferences : {};
    const author = sparkToString(input?.postAuthor, "").trim();
    const expectedLength = Number(input?.__ceEffectiveLength) || resolveCommentLength(pref);
    const expectedParagraphs = resolveCommentParagraphCount({ ...pref, commentLength: expectedLength });
    const normalized = normalizeSparkOutput(text);
    const paragraphs = splitCommentParagraphs(normalized);
    const issues = [];
    const requiredEmojiCount = isEmojiPreferenceEnabled(pref)
      ? (expectedParagraphs >= 3 ? 3 : 2)
      : 0;

    if (!normalized) {
      issues.push("The comment is empty.");
      return { ok: false, issues, paragraphCount: 0, paragraphLengths: [] };
    }

    if (paragraphs.length !== expectedParagraphs) {
      issues.push(`Expected exactly ${expectedParagraphs} paragraph(s), but got ${paragraphs.length}.`);
    }

    paragraphs.forEach((paragraph, index) => {
      if (!endsLikeCompleteThought(paragraph)) {
        issues.push(`Paragraph ${index + 1} must end as a complete sentence or complete thought.`);
      }
    });

    if (containsCjk(normalized)) {
      issues.push("The full comment must be English only.");
    }

    if (author && isEnabledLike(pref.commentMentionPostAuthor) && !normalized.startsWith(`@${author}`)) {
      issues.push(`The comment must begin naturally with @${author}.`);
    }

    if (requiredEmojiCount > 0 && countEmoji(normalized) < requiredEmojiCount) {
      issues.push(`Use at least ${requiredEmojiCount} emoji(s) overall.`);
    }
    if (requiredEmojiCount === 0 && containsEmoji(normalized)) {
      issues.push("Do not use emoji.");
    }

    if (isEnabledLike(pref.commentEndWithQuestion)) {
      const lastParagraph = paragraphs[paragraphs.length - 1] || "";
      if (!/[?？]["')\]]*$/u.test(lastParagraph.trim())) {
        issues.push("The final paragraph must end with one natural question.");
      }
    }

    return {
      ok: issues.length === 0,
      issues,
      paragraphCount: paragraphs.length,
      paragraphLengths: paragraphs.map((part) => sparkToString(part, "").length)
    };
  }

  function validateReplyOutput(text, input) {
    const pref = sparkIsPlainObject(input?.preferences) ? input.preferences : {};
    const normalized = normalizeSparkOutput(text);
    const issues = [];
    const wordCount = tokenizeWords(normalized).length;
    const maxWords = resolveReplyWordLimit(pref);

    if (!normalized) {
      issues.push("The reply is empty.");
      return { ok: false, issues, wordCount: 0 };
    }

    if (wordCount > maxWords) {
      issues.push(`The reply must stay within ${maxWords} words, but it currently has ${wordCount}.`);
    }

    if (isEnabledLike(pref.engageInEnglish) && containsCjk(normalized)) {
      issues.push("The reply must be English only.");
    }

    if (!endsLikeCompleteThought(normalized)) {
      issues.push("The reply must end as a complete sentence or complete thought.");
    }

    if (isEnabledLike(pref.replyEndWithQuestion) && !/[?？]["')\]]*$/u.test(normalized)) {
      issues.push("The reply must end with one natural question.");
    }

    return {
      ok: issues.length === 0,
      issues,
      wordCount
    };
  }

  function buildValidationIssueText(issues) {
    if (!Array.isArray(issues) || issues.length === 0) return "- The output did not satisfy the required rules.";
    return issues.map((issue) => `- ${sparkToString(issue, "").trim()}`).filter(Boolean).join("\n");
  }

  function buildCommentRepairPrompt(input, failedText, issues) {
    const base = buildCommentPrompt(input);
    return {
      systemPrompt: "You are fixing a LinkedIn comment draft that failed strict structural validation. Preserve the best ideas, but obey every output rule exactly. Return only the corrected comment text.",
      prompt: `${base.prompt}

Draft that failed validation:
${sparkToString(failedText, "(empty)")}

Validation failures to fix:
${buildValidationIssueText(issues)}

Rewrite the draft so it fully satisfies every rule above.
Return only the corrected comment text.`
    };
  }

  function buildReplyRepairPrompt(input, failedText, issues) {
    const base = buildReplyPrompt(input);
    return {
      systemPrompt: "You are fixing a LinkedIn reply draft that failed strict validation. Preserve the best intent, but obey every output rule exactly. Return only the corrected reply text.",
      prompt: `${base.prompt}

Draft that failed validation:
${sparkToString(failedText, "(empty)")}

Validation failures to fix:
${buildValidationIssueText(issues)}

Rewrite the draft so it fully satisfies every rule above.
Return only the corrected reply text.`
    };
  }

  async function buildEffectiveLinkedInAiInput(input, options = {}) {
    const safeInput = sparkIsPlainObject(input) ? input : {};
    const includeReplyHint = sparkToBoolean(options?.includeReplyHint, false);
    const storedPreferences = await loadLegacyPreferences();
    if (includeReplyHint) {
      await loadReplyPromptHint();
    }
    return {
      ...safeInput,
      preferences: sanitizeLegacyPreferences({
        ...storedPreferences,
        ...(sparkIsPlainObject(safeInput.preferences) ? safeInput.preferences : {})
      }),
      linkedInUiLanguage: normalizeLinkedInPageLang(
        sparkToString(safeInput.linkedInUiLanguage, document.documentElement?.lang || navigator.language || "")
      ),
      replyHint: includeReplyHint
        ? normalizeReplyPromptHint(sparkToString(safeInput.replyHint, replyPromptHint || ""))
        : sparkToString(safeInput.replyHint, "")
    };
  }

  function setupSparkRuntime() {
    window.__ceGetSparkSettings = async () => await getSparkSettings();
    window.__ceSetSparkSettings = async (partial) => {
      const current = await getSparkSettings();
      const next = normalizeSparkSettings(partial, current);
      await new Promise((resolve) => {
        try {
          chrome?.storage?.local?.set?.({ [SPARK_SETTINGS_KEY]: next }, () => resolve());
        } catch (_err) {
          resolve();
        }
      });
      return next;
    };
    window.__ceSparkComplete = async (requestPayload) => {
      const text = await callSparkModel(requestPayload || {});
      return normalizeSparkOutput(text);
    };
    window.__ceSparkGenerateComment = async (input) => {
      const safeInput = await buildEffectiveLinkedInAiInput(input, { includeReplyHint: true });
      const profile = resolveCommentGenerationProfile(safeInput.preferences);
      const commentInput = {
        ...safeInput,
        __ceGenerationProfile: profile
      };
      const prompt = buildCommentPrompt(commentInput);
      let text = "";
      try {
        text = await callSparkModel({
          ...prompt,
          timeoutMs: 35000
        });
      } catch (_err) {
        text = buildCommentFallbackText(safeInput, profile);
      }
      debugCommentTrace("model-output", {
        requestedLength: profile.length,
        rawLength: sparkToString(text, "").length,
        rawParagraphs: sparkToString(text, "").split(/\n{2,}/).filter(Boolean).length,
        rawText: sparkToString(text, "")
      });
      let finalText = enforceCommentByPreference(text, {
        ...safeInput,
        __ceEffectiveLength: profile.length
      });
      let validation = validateCommentOutput(finalText, {
        ...safeInput,
        __ceEffectiveLength: profile.length
      });
      if (!validation.ok) {
        debugCommentTrace("validation-fail", {
          scope: "comment",
          requestedLength: profile.length,
          issues: validation.issues,
          paragraphCount: validation.paragraphCount,
          paragraphLengths: validation.paragraphLengths,
          candidateText: finalText
        });
        try {
          const repairedText = await callSparkModel({
            ...buildCommentRepairPrompt(commentInput, finalText, validation.issues),
            timeoutMs: 22000
          });
          debugCommentTrace("repair-output", {
            scope: "comment",
            repairedLength: sparkToString(repairedText, "").length,
            repairedParagraphs: sparkToString(repairedText, "").split(/\n{2,}/).filter(Boolean).length,
            repairedText: sparkToString(repairedText, "")
          });
          finalText = enforceCommentByPreference(repairedText, {
            ...safeInput,
            __ceEffectiveLength: profile.length
          });
          validation = validateCommentOutput(finalText, {
            ...safeInput,
            __ceEffectiveLength: profile.length
          });
        } catch (_repairErr) {}
      }
      debugCommentTrace("post-enforce", {
        requestedLength: profile.length,
        validationPassed: validation.ok,
        validationIssues: validation.issues,
        finalLength: sparkToString(finalText, "").length,
        finalParagraphs: sparkToString(finalText, "").split(/\n{2,}/).filter(Boolean).length,
        finalText
      });
      return finalText;
    };
    window.__ceSparkGenerateReply = async (input) => {
      const safeInput = await buildEffectiveLinkedInAiInput(input, { includeReplyHint: true });
      const prompt = buildReplyPrompt(safeInput);
      let text = "";
      try {
        text = await callSparkModel({
          ...prompt,
          timeoutMs: 35000
        });
      } catch (_err) {
        text = buildReplyFallbackText(safeInput);
      }
      let finalText = enforceReplyByPreference(text, safeInput);
      let validation = validateReplyOutput(finalText, safeInput);
      if (!validation.ok) {
        debugCommentTrace("validation-fail", {
          scope: "reply",
          issues: validation.issues,
          wordCount: validation.wordCount,
          candidateText: finalText
        });
        try {
          const repairedText = await callSparkModel({
            ...buildReplyRepairPrompt(safeInput, finalText, validation.issues),
            timeoutMs: 22000
          });
          finalText = enforceReplyByPreference(repairedText, safeInput);
          validation = validateReplyOutput(finalText, safeInput);
        } catch (_repairErr) {}
      }
      return finalText;
    };
  }

  function patchGlobalJsonParse() {
    try {
      if (JSON[JSON_PARSE_PATCH_FLAG]) return;
      const originalParse = JSON.parse.bind(JSON);

      JSON.parse = function patchedJSONParse(value, reviver) {
        if (value !== null && typeof value === "object") {
          return value;
        }

        if (value === "[object Object]") {
          return {};
        }

        return originalParse(value, reviver);
      };

      Object.defineProperty(JSON, JSON_PARSE_PATCH_FLAG, {
        value: true,
        configurable: true
      });
    } catch (_err) {
      // Ignore if JSON.parse cannot be monkey-patched.
    }
  }

  function decodeStoredObjectValue(raw) {
    if (!raw) return null;
    if (typeof raw === "object" && !Array.isArray(raw)) return raw;

    let current = raw;
    for (let depth = 0; depth < 3; depth += 1) {
      if (current && typeof current === "object" && !Array.isArray(current)) return current;
      if (typeof current !== "string") return null;
      try {
        current = JSON.parse(current);
      } catch (_err) {
        return null;
      }
    }

    return current && typeof current === "object" && !Array.isArray(current) ? current : null;
  }

  function parseStoredAccount(raw) {
    return decodeStoredObjectValue(raw) || {};
  }

  function stringifyStoredAccount(account) {
    try {
      return JSON.stringify(account ?? {});
    } catch (_err) {
      return "{}";
    }
  }

  function stringifyLegacyStoredObject(value) {
    try {
      return JSON.stringify(JSON.stringify(value ?? {}));
    } catch (_err) {
      return "\"{}\"";
    }
  }


  function parseStoredObject(raw, fallback = {}) {
    const parsed = decodeStoredObjectValue(raw);
    if (parsed) return { ...fallback, ...parsed };
    return { ...fallback };
  }

  function stringifyStoredObject(value) {
    try {
      return JSON.stringify(value ?? {});
    } catch (_err) {
      return "{}";
    }
  }

  function readLocalStorageValue(key, fallback = "") {
    try {
      const value = localStorage.getItem(key);
      return value === null || value === undefined ? fallback : value;
    } catch (_err) {
      return fallback;
    }
  }

  function writeLocalStorageValue(key, value) {
    try {
      if (value === undefined || value === null || value === "") {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, String(value));
      }
    } catch (_err) {}
  }

  function includesStorageKey(keys, targetKey) {
    if (keys === undefined || keys === null) return true;
    if (typeof keys === "string") return keys === targetKey;
    if (Array.isArray(keys)) return keys.includes(targetKey);
    return !!(keys && typeof keys === "object" && !Array.isArray(keys) && Object.prototype.hasOwnProperty.call(keys, targetKey));
  }

  function normalizeLegacyStorageWrite(key, rawValue, authSnapshot = getCurrentGasGxAuthSnapshot()) {
    if (key === ACCOUNT_KEY) {
      const existingAccount = parseStoredAccount(rawValue);
      return stringifyLegacyStoredObject(
        isGasGxExtensionEnabled(authSnapshot)
          ? buildEnabledAccount(authSnapshot, existingAccount)
          : buildLockedAccount(authSnapshot)
      );
    }
    if (key === LEGACY_PREFERENCES_STORAGE_KEY) {
      return stringifyLegacyStoredObject(
        sanitizeLegacyPreferences(parseStoredObject(rawValue, getDefaultLegacyPreferences()))
      );
    }
    if (key === UI_KEY) {
      return stringifyLegacyStoredObject(
        deriveUiState(parseStoredObject(rawValue, DEFAULT_UI_STATE), authSnapshot)
      );
    }
    if (key === LINKEDIN_PROFILE_STORAGE_KEY) {
      return stringifyLegacyStoredObject(
        sanitizeLinkedInProfile(parseStoredObject(rawValue, getDefaultLinkedInProfile()))
      );
    }
    if (key === "automation") {
      return stringifyLegacyStoredObject(parseStoredObject(rawValue, {}));
    }
    return rawValue;
  }

  function getDefaultGasGxAuthSnapshot() {
    return {
      status: "anonymous",
      userId: "",
      email: "",
      plan: "",
      profileEnabled: false,
      enabledAt: "",
      accessToken: "",
      refreshToken: "",
      sessionExpiresAt: 0,
      errorMessage: "",
      lastValidatedAt: 0
    };
  }

  function sanitizeGasGxAuthSnapshot(raw) {
    const base = getDefaultGasGxAuthSnapshot();
    const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const status = ["anonymous", "signed_in_but_not_enabled", "enabled", "auth_error", "loading"].includes(source.status)
      ? source.status
      : base.status;
    return {
      ...base,
      ...source,
      status,
      userId: sparkToString(source.userId, base.userId).trim(),
      email: sparkToString(source.email, base.email).trim(),
      plan: sparkToString(source.plan, base.plan).trim(),
      enabledAt: sparkToString(source.enabledAt, base.enabledAt).trim(),
      accessToken: sparkToString(source.accessToken, base.accessToken).trim(),
      refreshToken: sparkToString(source.refreshToken, base.refreshToken).trim(),
      errorMessage: sparkToString(source.errorMessage, base.errorMessage).trim(),
      profileEnabled: sparkToBoolean(source.profileEnabled, base.profileEnabled),
      sessionExpiresAt: Math.max(0, Math.floor(sparkToNumber(source.sessionExpiresAt, base.sessionExpiresAt))),
      lastValidatedAt: Math.max(0, Math.floor(sparkToNumber(source.lastValidatedAt, base.lastValidatedAt)))
    };
  }

  function getCurrentGasGxAuthSnapshot() {
    return gasgxAuthState.snapshot || getDefaultGasGxAuthSnapshot();
  }

  function isGasGxExtensionEnabled(snapshot = getCurrentGasGxAuthSnapshot()) {
    return snapshot.status === "enabled" && !!snapshot.profileEnabled;
  }

  function buildGasGxSignedOutSnapshot(seedSnapshot = getCurrentGasGxAuthSnapshot()) {
    return sanitizeGasGxAuthSnapshot({
      ...getDefaultGasGxAuthSnapshot(),
      email: sparkToString(seedSnapshot?.email, "").trim()
    });
  }

  function setGasGxSignedOutRuntimeSnapshot(seedSnapshot = getCurrentGasGxAuthSnapshot()) {
    const anonymous = buildGasGxSignedOutSnapshot(seedSnapshot);
    gasgxAuthState.snapshot = anonymous;
    gasgxAuthState.loaded = true;
    dispatchGasGxAuthChanged(anonymous);
    return anonymous;
  }

  async function loadGasGxLoginState() {
    const storage = chrome?.storage?.local;
    if (storage?.get) {
      const raw = await rawStorageGet(storage, GASGX_LOGIN_STATE_KEY);
      if (Object.prototype.hasOwnProperty.call(raw || {}, GASGX_LOGIN_STATE_KEY)) {
        return normalizeFeatureToggle(raw?.[GASGX_LOGIN_STATE_KEY], false);
      }
      const fallbackLocalLoginState = normalizeFeatureToggle(readLocalStorageValue(GASGX_LOGIN_STATE_KEY, false), false);
      if (fallbackLocalLoginState) {
        await setStorageValue(storage, { [GASGX_LOGIN_STATE_KEY]: true });
        return true;
      }
      let inferredLoginState = false;
      try {
        const fallbackRaw = await rawStorageGet(storage, [
          GASGX_AUTH_STORAGE_KEY,
          GASGX_LOCAL_SIGNED_IN_KEY,
          GASGX_SIGNED_OUT_FLAG_KEY
        ]);
        const signedOut = normalizeFeatureToggle(fallbackRaw?.[GASGX_SIGNED_OUT_FLAG_KEY], false);
        const localSignedIn = normalizeFeatureToggle(fallbackRaw?.[GASGX_LOCAL_SIGNED_IN_KEY], false);
        const persistedSnapshot = sanitizeGasGxAuthSnapshot(
          parseStoredObject(
            sparkToString(fallbackRaw?.[GASGX_AUTH_STORAGE_KEY], ""),
            getDefaultGasGxAuthSnapshot()
          )
        );
        inferredLoginState = !signedOut && (
          localSignedIn
          || persistedSnapshot.status === "enabled"
          || persistedSnapshot.status === "signed_in_but_not_enabled"
          || !!persistedSnapshot.profileEnabled
        );
      } catch (_err) {
        inferredLoginState = false;
      }
      await setStorageValue(storage, { [GASGX_LOGIN_STATE_KEY]: inferredLoginState });
      return inferredLoginState;
    }
    return normalizeFeatureToggle(readLocalStorageValue(GASGX_LOGIN_STATE_KEY, false), false);
  }

  async function persistGasGxLoginState(value) {
    const enabled = !!value;
    writeLocalStorageValue(GASGX_LOGIN_STATE_KEY, enabled ? "true" : "false");
    const storage = chrome?.storage?.local;
    if (!storage?.set) return;
    await setStorageValue(storage, { [GASGX_LOGIN_STATE_KEY]: enabled });
  }

  async function recoverGasGxAuthSnapshotFromLegacyStorage(baseSnapshot = getCurrentGasGxAuthSnapshot()) {
    const storage = chrome?.storage?.local;
    if (!storage?.get) return null;
    if (await loadGasGxSignedOutFlag()) return null;

    let account = {};
    let ui = {};
    try {
      const raw = await rawStorageGet(storage, [ACCOUNT_KEY, UI_KEY]);
      account = parseStoredAccount(raw?.[ACCOUNT_KEY]);
      ui = parseStoredObject(raw?.[UI_KEY], DEFAULT_UI_STATE);
    } catch (_err) {
      return null;
    }

    const subscriberId = sparkToString(account?.subscriberId, "").trim();
    const email = sparkToString(account?.email, "").trim();
    const accessToken = sparkToString(account?.accessToken, "").trim();
    const refreshToken = sparkToString(account?.refreshToken, "").trim();
    const uiEnabled = sparkToBoolean(ui?.enabled, false);
    const looksEnabled = !!(
      uiEnabled
      || accessToken
      || refreshToken
      || (email && subscriberId.length === 24)
    );
    if (!looksEnabled) return null;

    const recovered = sanitizeGasGxAuthSnapshot({
      ...baseSnapshot,
      status: "enabled",
      profileEnabled: true,
      email: email || sparkToString(baseSnapshot?.email, "").trim(),
      userId: sparkToString(baseSnapshot?.userId, "").trim(),
      plan: sparkToString(account?.plan, "").trim() || sparkToString(baseSnapshot?.plan, "").trim() || "GasGx",
      accessToken: sparkToString(baseSnapshot?.accessToken, "").trim() || accessToken,
      refreshToken: sparkToString(baseSnapshot?.refreshToken, "").trim() || refreshToken,
      errorMessage: "",
      lastValidatedAt: Date.now()
    });

    return await persistGasGxAuthSnapshot(recovered);
  }

  async function resolveGasGxAuthSnapshotForCommenting() {
    const current = getCurrentGasGxAuthSnapshot();
    const signedOut = await loadGasGxSignedOutFlag();
    gasgxSignedOutCache = signedOut;
    gasgxSignedOutCacheReady = true;
    if (signedOut) {
      return setGasGxSignedOutRuntimeSnapshot(current);
    }

    const refreshed = await ensureGasGxAuthSnapshotLoaded(true);
    if (isGasGxExtensionEnabled(refreshed)) return refreshed;

    const signedOutAfterRefresh = await loadGasGxSignedOutFlag();
    gasgxSignedOutCache = signedOutAfterRefresh;
    gasgxSignedOutCacheReady = true;
    if (signedOutAfterRefresh) {
      return setGasGxSignedOutRuntimeSnapshot(refreshed || current);
    }

    return refreshed;
  }

  function getGasGxCommentBlockedMessage(snapshot = getCurrentGasGxAuthSnapshot()) {
    const status = sparkToString(snapshot?.status, "");
    if (status === "auth_error") {
      return currentLang === "zh-CN"
        ? (snapshot?.errorMessage || "GasGx 登录异常，请先重新登录后再评论。")
        : (sparkToString(snapshot?.errorMessage, "GasGx sign-in failed. Please sign in again before commenting.").trim());
    }
    if (status === "signed_in_but_not_enabled" || (status === "enabled" && !snapshot?.profileEnabled)) {
      return currentLang === "zh-CN"
        ? "你当前已登录，但评论权限未启用，请先在 GasGx 中重新登录后再评论。"
        : "You're signed in, but commenting isn't enabled yet. Please sign in again in GasGx before commenting.";
    }
    if (status === "loading") {
      return currentLang === "zh-CN"
        ? "正在读取 GasGx 登录状态，请稍后再试。"
        : "Loading GasGx sign-in state. Please try again in a moment.";
    }
    return currentLang === "zh-CN"
      ? "你已退出登录，请先在扩展弹窗重新登录后再评论。"
      : "You're signed out. Please sign in from the extension popup before commenting.";
  }

  function hasUsableLocalGasGxAuth(snapshot, localSignedIn = false) {
    const current = sanitizeGasGxAuthSnapshot(snapshot);
    return !!(
      current.accessToken
      || current.refreshToken
      || current.status === "enabled"
      || current.status === "signed_in_but_not_enabled"
      || (localSignedIn && (current.email || current.userId || current.plan || current.profileEnabled))
    );
  }

  function isLegacyPopupSubscriberId(value) {
    return sparkToString(value, "").trim().length === 24;
  }

  function buildLegacyPopupSubscriberId(snapshot = getCurrentGasGxAuthSnapshot(), existing = {}) {
    const existingId = sparkToString(existing?.subscriberId, "").trim();
    if (isLegacyPopupSubscriberId(existingId)) return existingId;

    const seed = sparkToString(snapshot?.userId, "").trim()
      || sparkToString(snapshot?.email, "").trim().toLowerCase()
      || TEST_SUBSCRIBER_ID;
    let derived = "";

    for (let index = 0; index < seed.length && derived.length < 24; index += 1) {
      derived += seed.charCodeAt(index).toString(16).padStart(2, "0");
    }

    return (derived + TEST_SUBSCRIBER_ID).slice(0, 24);
  }

  function buildLockedAccount(snapshot = getCurrentGasGxAuthSnapshot()) {
    return {
      subscriberId: "",
      email: snapshot.email || "",
      password: "",
      plan: "",
      isTrialEligible: false,
      accessToken: "",
      refreshToken: ""
    };
  }

  function buildEnabledAccount(snapshot = getCurrentGasGxAuthSnapshot(), existing = {}) {
    return {
      ...DEFAULT_ACCOUNT,
      ...existing,
      subscriberId: buildLegacyPopupSubscriberId(snapshot, existing),
      email: snapshot.email || existing.email || "",
      password: "",
      plan: snapshot.plan || "GasGx",
      isTrialEligible: false,
      accessToken: snapshot.accessToken || "",
      refreshToken: snapshot.refreshToken || ""
    };
  }

  function deriveUiState(existing = {}, snapshot = getCurrentGasGxAuthSnapshot()) {
    const base = { ...DEFAULT_UI_STATE, ...existing };
    const enabled = isGasGxExtensionEnabled(snapshot);
    return {
      ...base,
      initializationInProgress: false,
      enabled,
      isSignInVisible: !isGasGxExtensionEnabled(snapshot),
      isResetSeatsVisible: enabled ? !!base.isResetSeatsVisible : false
    };
  }

  function dispatchGasGxAuthChanged(snapshot) {
    try {
      window.dispatchEvent(new CustomEvent(GASGX_AUTH_CHANGED_EVENT, { detail: snapshot }));
    } catch (_err) {}
  }

  async function rawStorageGet(area, keys) {
    const getter = ORIGINAL_STORAGE_GETTERS.get(area) || area?.get?.bind(area);
    if (typeof getter !== "function") return {};
    return await new Promise((resolve) => {
      let settled = false;
      const done = (value) => {
        if (settled) return;
        settled = true;
        resolve(value || {});
      };
      try {
        const ret = getter(keys, (res) => done(res));
        if (ret && typeof ret.then === "function") {
          ret.then((res) => done(res)).catch(() => done({}));
        } else if (getter.length < 2) {
          done(ret || {});
        }
      } catch (_err) {
        done({});
      }
    });
  }

  async function persistGasGxAuthSnapshot(snapshot) {
    const storage = chrome?.storage?.local;
    const next = sanitizeGasGxAuthSnapshot(snapshot);
    const nextRaw = stringifyStoredObject(next);
    gasgxAuthState.snapshot = next;
    gasgxAuthState.loaded = true;
    writeLocalStorageValue(GASGX_AUTH_STORAGE_KEY, nextRaw);
    if (storage?.set && gasgxLastPersistedSnapshotRaw !== nextRaw) {
      await new Promise((resolve) => {
        try {
          storage.set({ [GASGX_AUTH_STORAGE_KEY]: nextRaw }, () => resolve());
        } catch (_err) {
          resolve();
        }
      });
      gasgxLastPersistedSnapshotRaw = nextRaw;
    }
    if (next.accessToken || next.refreshToken || next.status === "enabled" || next.status === "signed_in_but_not_enabled") {
      await persistGasGxSignedOutFlag(false);
      await persistGasGxLocalSignedInFlag(true);
    }
    dispatchGasGxAuthChanged(next);
    return next;
  }

  async function loadPersistedGasGxAuthSnapshot() {
    const storage = chrome?.storage?.local;
    if (storage?.get) {
      const raw = await rawStorageGet(storage, GASGX_AUTH_STORAGE_KEY);
      const storageValue = sparkToString(raw?.[GASGX_AUTH_STORAGE_KEY], "");
      const fallbackValue = readLocalStorageValue(GASGX_AUTH_STORAGE_KEY, "");
      const effectiveValue = sparkToString(storageValue, "").trim() ? storageValue : fallbackValue;
      gasgxLastPersistedSnapshotRaw = effectiveValue;
      if (!sparkToString(storageValue, "").trim() && sparkToString(fallbackValue, "").trim()) {
        try {
          await setStorageValue(storage, { [GASGX_AUTH_STORAGE_KEY]: fallbackValue });
        } catch (_err) {}
      }
      return sanitizeGasGxAuthSnapshot(
        parseStoredObject(effectiveValue, getDefaultGasGxAuthSnapshot())
      );
    }
    const fallbackValue = readLocalStorageValue(GASGX_AUTH_STORAGE_KEY, "");
    gasgxLastPersistedSnapshotRaw = fallbackValue;
    return sanitizeGasGxAuthSnapshot(
      parseStoredObject(fallbackValue, getDefaultGasGxAuthSnapshot())
    );
  }

  function getDefaultLinkedInProfile() {
    return {
      seat: "",
      me: "",
      imageUrl: ""
    };
  }

  function sanitizeLinkedInProfile(raw) {
    const base = getDefaultLinkedInProfile();
    const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    return {
      seat: sparkToString(source.seat, base.seat).trim(),
      me: sparkToString(source.me, base.me).trim(),
      imageUrl: sparkToString(source.imageUrl, base.imageUrl).trim()
    };
  }

  function hasLinkedInProfileData(profile) {
    const next = sanitizeLinkedInProfile(profile);
    return !!(next.seat || next.me || next.imageUrl);
  }

  async function loadPersistedLinkedInProfile() {
    const storage = chrome?.storage?.local;
    if (!storage) return getDefaultLinkedInProfile();
    const raw = await rawStorageGet(storage, LINKEDIN_PROFILE_STORAGE_KEY);
    return sanitizeLinkedInProfile(parseStoredObject(raw?.[LINKEDIN_PROFILE_STORAGE_KEY], getDefaultLinkedInProfile()));
  }

  async function persistLinkedInProfile(profile) {
    const storage = chrome?.storage?.local;
    const next = sanitizeLinkedInProfile(profile);
    if (!storage?.set || !hasLinkedInProfileData(next)) return next;
    await setStorageValue(storage, {
      [LINKEDIN_PROFILE_STORAGE_KEY]: stringifyLegacyStoredObject(next)
    });
    return next;
  }

  async function probeActiveLinkedInProfile() {
    try {
      const tabs = await chrome?.tabs?.query?.({ active: true, currentWindow: true });
      const tab = Array.isArray(tabs) ? tabs[0] : null;
      const tabId = Number(tab?.id);
      const url = sparkToString(tab?.url, "");
      if (!Number.isFinite(tabId) || !/linkedin\.com/i.test(url)) {
        return await loadPersistedLinkedInProfile();
      }

      const results = await chrome?.scripting?.executeScript?.({
        target: { tabId },
        func: () => {
          const toText = (value) => {
            if (value === undefined || value === null) return "";
            return String(value).trim();
          };
          const parseSeat = (href) => {
            const raw = toText(href);
            if (!raw) return "";
            try {
              const url = new URL(raw, window.location.origin);
              const match = url.pathname.match(/\/in\/([^/?#]+)/i);
              return match ? decodeURIComponent(match[1]) : "";
            } catch (_err) {
              return "";
            }
          };
          const pickText = (selectors) => {
            for (const selector of selectors) {
              const node = document.querySelector(selector);
              const text = toText(node?.textContent || node?.getAttribute?.("alt"));
              if (text) return text;
            }
            return "";
          };
          const pickAttr = (selectors, attr) => {
            for (const selector of selectors) {
              const node = document.querySelector(selector);
              const value = toText(node?.getAttribute?.(attr));
              if (value) return value;
            }
            return "";
          };
          return {
            seat: parseSeat(
              pickAttr([
                "a[data-control-name='nav.settings_view_profile'][href*='/in/']",
                "a.global-nav__secondary-link[href*='/in/']",
                ".feed-identity-module a[href*='/in/']",
                "a[href*='linkedin.com/in/']"
              ], "href")
            ),
            me: pickText([
              ".feed-identity-module__actor-meta strong",
              ".feed-identity-module__actor-meta div",
              "a[data-control-name='nav.settings_view_profile'] span[aria-hidden='true']",
              "img.global-nav__me-photo"
            ]),
            imageUrl: pickAttr([
              "img.global-nav__me-photo",
              ".feed-identity-module img",
              "img.presence-entity__image"
            ], "src")
          };
        }
      });

      const profile = sanitizeLinkedInProfile(Array.isArray(results) ? results[0]?.result : null);
      if (hasLinkedInProfileData(profile)) {
        await persistLinkedInProfile(profile);
        return profile;
      }
    } catch (_err) {}

    return await loadPersistedLinkedInProfile();
  }

  async function probeActiveLinkedInPageLanguage() {
    try {
      const tabs = await chrome?.tabs?.query?.({ active: true, currentWindow: true });
      const tab = Array.isArray(tabs) ? tabs[0] : null;
      const tabId = Number(tab?.id);
      const url = sparkToString(tab?.url, "");
      if (!Number.isFinite(tabId) || !/linkedin\.com/i.test(url)) {
        return "";
      }
      const results = await chrome?.scripting?.executeScript?.({
        target: { tabId },
        func: () => {
          const htmlLang = document.documentElement?.getAttribute("lang") || document.documentElement?.lang || "";
          const navLang = navigator.language || "";
          return String(htmlLang || navLang || "").trim();
        }
      });
      return normalizeLinkedInPageLang(Array.isArray(results) ? results[0]?.result : "");
    } catch (_err) {
      return "";
    }
  }

  function getDefaultLegacyPreferences() {
    return {
      commentLength: 2,
      commentTone: "Polite",
      commentMentionPostAuthor: false,
      commentUseEmojis: false,
      commentEndWithQuestion: false,
      commentOfferServices: false,
      commentIndustry: "NotSpecified",
      replyEndWithQuestion: false,
      engageInEnglish: false,
      voiceGender: "NotSpecified",
      reengagementCooldown: "NotSpecified"
    };
  }

  function sanitizeLegacyPreferences(raw) {
    const base = getDefaultLegacyPreferences();
    const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    return {
      ...base,
      ...source,
      commentLength: Math.max(1, Math.min(3, Math.round(sparkToNumber(source.commentLength, base.commentLength)))),
      commentTone: sparkToString(source.commentTone, base.commentTone).trim() || base.commentTone,
      commentIndustry: sparkToString(source.commentIndustry, base.commentIndustry).trim() || base.commentIndustry,
      voiceGender: sparkToString(source.voiceGender, base.voiceGender).trim() || base.voiceGender,
      reengagementCooldown: sparkToString(source.reengagementCooldown, base.reengagementCooldown).trim() || base.reengagementCooldown,
      commentMentionPostAuthor: sparkToBoolean(source.commentMentionPostAuthor, base.commentMentionPostAuthor),
      commentUseEmojis: sparkToBoolean(source.commentUseEmojis, base.commentUseEmojis),
      commentEndWithQuestion: sparkToBoolean(source.commentEndWithQuestion, base.commentEndWithQuestion),
      commentOfferServices: sparkToBoolean(source.commentOfferServices, base.commentOfferServices),
      replyEndWithQuestion: sparkToBoolean(source.replyEndWithQuestion, base.replyEndWithQuestion),
      engageInEnglish: sparkToBoolean(source.engageInEnglish, base.engageInEnglish)
    };
  }

  async function loadLegacyPreferences() {
    const storage = chrome?.storage?.local;
    const cachedRaw = readLocalStorageValue(LEGACY_PREFERENCES_CACHE_KEY, "");
    const cachedAt = sparkToNumber(readLocalStorageValue(LEGACY_PREFERENCES_CACHE_AT_KEY, "0"), 0);
    const cached = cachedRaw
      ? sanitizeLegacyPreferences(parseStoredObject(cachedRaw, getDefaultLegacyPreferences()))
      : null;
    if (!storage?.get) return cached || getDefaultLegacyPreferences();
    const canonicalRaw = await rawStorageGet(storage, LEGACY_PREFERENCES_CANONICAL_KEY);
    const canonicalValue = canonicalRaw?.[LEGACY_PREFERENCES_CANONICAL_KEY];
    const canonicalAt = sparkToNumber(canonicalRaw?.ce_legacy_preferences_canonical_at, 0);
    if (cached && cachedAt >= canonicalAt) {
      return cached;
    }
    if (canonicalValue) {
      return sanitizeLegacyPreferences(parseStoredObject(canonicalValue, getDefaultLegacyPreferences()));
    }
    const raw = await rawStorageGet(storage, LEGACY_PREFERENCES_STORAGE_KEY);
    return sanitizeLegacyPreferences(parseStoredObject(raw?.[LEGACY_PREFERENCES_STORAGE_KEY], getDefaultLegacyPreferences()));
  }

  async function persistLegacyPreferences(patch) {
    const storage = chrome?.storage?.local;
    if (!storage?.set || !sparkIsPlainObject(patch)) return getDefaultLegacyPreferences();
    legacyPreferencesWriteQueue = legacyPreferencesWriteQueue
      .catch(() => {})
      .then(async () => {
        const current = await loadLegacyPreferences();
        const persistedAt = Date.now();
        const next = sanitizeLegacyPreferences({
          ...current,
          ...patch
        });
        writeLocalStorageValue(LEGACY_PREFERENCES_CACHE_KEY, stringifyStoredObject(next));
        writeLocalStorageValue(LEGACY_PREFERENCES_CACHE_AT_KEY, String(persistedAt));
        await setStorageValue(storage, {
          [LEGACY_PREFERENCES_STORAGE_KEY]: stringifyLegacyStoredObject(next),
          [LEGACY_PREFERENCES_CANONICAL_KEY]: stringifyStoredObject(next),
          ce_legacy_preferences_canonical_at: persistedAt
        });
        return await loadLegacyPreferences();
      });
    return await legacyPreferencesWriteQueue;
  }

  async function loadGasGxSignedOutFlag() {
    const storage = chrome?.storage?.local;
    if (storage?.get) {
      const raw = await rawStorageGet(storage, GASGX_SIGNED_OUT_FLAG_KEY);
      if (Object.prototype.hasOwnProperty.call(raw || {}, GASGX_SIGNED_OUT_FLAG_KEY)) {
        return normalizeFeatureToggle(raw?.[GASGX_SIGNED_OUT_FLAG_KEY], false);
      }
      return normalizeFeatureToggle(readLocalStorageValue(GASGX_SIGNED_OUT_FLAG_KEY, false), false);
    }
    return normalizeFeatureToggle(readLocalStorageValue(GASGX_SIGNED_OUT_FLAG_KEY, false), false);
  }

  async function persistGasGxSignedOutFlag(value) {
    const storage = chrome?.storage?.local;
    writeLocalStorageValue(GASGX_SIGNED_OUT_FLAG_KEY, value ? "true" : "false");
    if (!storage?.set) return;
    await setStorageValue(storage, {
      [GASGX_SIGNED_OUT_FLAG_KEY]: !!value
    });
  }

  async function loadGasGxLocalSignedInFlag() {
    const storage = chrome?.storage?.local;
    if (storage?.get) {
      const raw = await rawStorageGet(storage, GASGX_LOCAL_SIGNED_IN_KEY);
      if (Object.prototype.hasOwnProperty.call(raw || {}, GASGX_LOCAL_SIGNED_IN_KEY)) {
        return normalizeFeatureToggle(raw?.[GASGX_LOCAL_SIGNED_IN_KEY], false);
      }
      return normalizeFeatureToggle(readLocalStorageValue(GASGX_LOCAL_SIGNED_IN_KEY, false), false);
    }
    return normalizeFeatureToggle(readLocalStorageValue(GASGX_LOCAL_SIGNED_IN_KEY, false), false);
  }

  async function persistGasGxLocalSignedInFlag(value) {
    const storage = chrome?.storage?.local;
    writeLocalStorageValue(GASGX_LOCAL_SIGNED_IN_KEY, value ? "true" : "false");
    if (!storage?.set) return;
    await setStorageValue(storage, {
      [GASGX_LOCAL_SIGNED_IN_KEY]: !!value
    });
  }

  async function supabaseFetchJson(path, init = {}) {
    const response = await fetch(`${GASGX_SUPABASE_URL}${path}`, {
      ...init,
      headers: {
        apikey: GASGX_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
        ...(init.headers || {})
      }
    });
    const text = await response.text();
    let payload = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (_err) {
        payload = { message: text };
      }
    }
    if (!response.ok) {
      const message = sparkToString(payload?.msg || payload?.error_description || payload?.message || response.statusText, "Authentication request failed.").trim();
      throw new Error(message);
    }
    return payload;
  }

  async function signInWithGasGxPassword(email, password) {
    const normalizedEmail = sparkToString(email, "").trim().toLowerCase();
    const normalizedPassword = sparkToString(password, "");
    if (!normalizedEmail || !normalizedPassword) {
      throw new Error(currentLang === "zh-CN"
        ? "请输入 GasGx 邮箱和密码。"
        : "Please enter your GasGx email and password.");
    }
    return await supabaseFetchJson("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword })
    });
  }

  async function refreshGasGxSessionByRefreshToken(refreshToken) {
    const normalizedRefreshToken = sparkToString(refreshToken, "").trim();
    if (!normalizedRefreshToken) {
      throw new Error(currentLang === "zh-CN"
        ? "登录会话已过期，请重新登录。"
        : "Session expired. Please sign in again.");
    }
    return await supabaseFetchJson("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: normalizedRefreshToken })
    });
  }

  function buildGasGxAuthErrorSnapshot(seedSnapshot, message) {
    const seed = sanitizeGasGxAuthSnapshot(seedSnapshot);
    return sanitizeGasGxAuthSnapshot({
      ...getDefaultGasGxAuthSnapshot(),
      status: "auth_error",
      email: sparkToString(seed?.email, "").trim(),
      errorMessage: sparkToString(message, "").trim() || (currentLang === "zh-CN"
        ? "GasGx 登录已失效，请重新登录。"
        : "GasGx session expired. Please sign in again."),
      lastValidatedAt: Date.now()
    });
  }

  async function rawStorageSet(area, value) {
    const setter = ORIGINAL_STORAGE_SETTERS.get(area) || area?.set?.bind(area);
    if (typeof setter !== "function") return;
    await new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      try {
        const ret = setter(value, () => done());
        if (ret && typeof ret.then === "function") {
          ret.then(() => done()).catch(() => done());
        } else if (setter.length < 2) {
          done();
        }
      } catch (_err) {
        done();
      }
    });
  }

  async function loadCanonicalLegacyPreferences(area = chrome?.storage?.local) {
    if (!area) return null;
    const raw = await rawStorageGet(area, LEGACY_PREFERENCES_CANONICAL_KEY);
    const value = raw?.[LEGACY_PREFERENCES_CANONICAL_KEY];
    if (!value) return null;
    return sanitizeLegacyPreferences(parseStoredObject(value, getDefaultLegacyPreferences()));
  }

  async function clearGasGxAuthSnapshot() {
    await persistGasGxLoginState(false);
    await persistGasGxLocalSignedInFlag(false);
    return await persistGasGxAuthSnapshot(getDefaultGasGxAuthSnapshot());
  }

  async function buildGasGxSnapshotFromSession(sessionPayload) {
    const sessionSource = sessionPayload?.session && typeof sessionPayload.session === "object"
      ? sessionPayload.session
      : sessionPayload;
    const accessToken = sparkToString(
      sessionSource?.access_token ?? sessionPayload?.access_token,
      ""
    ).trim();
    const refreshToken = sparkToString(
      sessionSource?.refresh_token ?? sessionPayload?.refresh_token,
      ""
    ).trim();
    const expiresAtRaw = sparkToNumber(
      sessionSource?.expires_at ?? sessionPayload?.expires_at,
      0
    );
    const expiresInRaw = sparkToNumber(
      sessionSource?.expires_in ?? sessionPayload?.expires_in,
      0
    );
    const nowSec = Math.floor(Date.now() / 1000);
    let expiresAt = 0;
    if (Number.isFinite(expiresAtRaw) && expiresAtRaw > 0) {
      expiresAt = Math.floor(expiresAtRaw);
    } else if (Number.isFinite(expiresInRaw) && expiresInRaw > 0) {
      expiresAt = nowSec + Math.floor(expiresInRaw);
    } else {
      // Some Supabase responses omit expiry fields; keep a conservative fallback window.
      expiresAt = nowSec + 86400;
    }
    const userFromSession = (
      (sessionSource?.user && typeof sessionSource.user === "object" && sessionSource.user)
      || (sessionPayload?.user && typeof sessionPayload.user === "object" && sessionPayload.user)
      || {}
    );
    const userId = sparkToString(userFromSession.id, "").trim();
    const userEmail = sparkToString(userFromSession.email, "").trim();
    const user = userId || userEmail
      ? { id: userId, email: userEmail }
      : { id: "", email: "" };
    return sanitizeGasGxAuthSnapshot({
      status: "enabled",
      userId: user.id,
      email: user.email,
      plan: "GasGx",
      profileEnabled: true,
      enabledAt: new Date().toISOString(),
      accessToken,
      refreshToken,
      sessionExpiresAt: expiresAt * 1000,
      errorMessage: "",
      lastValidatedAt: Date.now()
    });
  }

  async function validatePersistedGasGxAuthSnapshot(snapshot) {
    const current = sanitizeGasGxAuthSnapshot(snapshot);
    const sessionExpired = current.sessionExpiresAt > 0 && current.sessionExpiresAt <= (Date.now() + 60_000);
    const hasAccessToken = !!sparkToString(current.accessToken, "").trim();
    const hasRefreshToken = !!sparkToString(current.refreshToken, "").trim();
    if (current.status === "enabled" && current.profileEnabled) {
      if (!hasAccessToken && !hasRefreshToken) {
        const [loginState, localSignedIn, signedOut] = await Promise.all([
          loadGasGxLoginState(),
          loadGasGxLocalSignedInFlag(),
          loadGasGxSignedOutFlag()
        ]);
        if (!signedOut && (loginState || localSignedIn)) {
          return sanitizeGasGxAuthSnapshot({
            ...current,
            plan: sparkToString(current.plan, "").trim() || "GasGx",
            lastValidatedAt: Date.now(),
            errorMessage: ""
          });
        }
        return buildGasGxAuthErrorSnapshot(current, currentLang === "zh-CN"
          ? "未检测到登录会话，请重新登录。"
          : "No login session found. Please sign in again.");
      }
      if (sessionExpired && hasRefreshToken) {
        try {
          const refreshedSession = await refreshGasGxSessionByRefreshToken(current.refreshToken);
          const refreshedSnapshot = await buildGasGxSnapshotFromSession(refreshedSession);
          return sanitizeGasGxAuthSnapshot({
            ...refreshedSnapshot,
            enabledAt: sparkToString(current.enabledAt, "").trim() || refreshedSnapshot.enabledAt
          });
        } catch (error) {
          return buildGasGxAuthErrorSnapshot(current, error?.message);
        }
      }
      if (sessionExpired && !hasRefreshToken) {
        return buildGasGxAuthErrorSnapshot(current, currentLang === "zh-CN"
          ? "登录会话已过期，请重新登录。"
          : "Session expired. Please sign in again.");
      }
      return sanitizeGasGxAuthSnapshot({
        ...current,
        lastValidatedAt: Date.now()
      });
    }
    return getDefaultGasGxAuthSnapshot();
  }

  function canReusePersistedGasGxAuthSnapshot(snapshot) {
    const current = sanitizeGasGxAuthSnapshot(snapshot);
    return current.status === "enabled"
      && !!current.profileEnabled
      && !!(sparkToString(current.accessToken, "").trim() || sparkToString(current.refreshToken, "").trim());
  }

  async function ensureGasGxAuthSnapshotLoaded(forceRefresh = false) {
    if (!forceRefresh && gasgxAuthState.loaded && gasgxAuthState.snapshot) return gasgxAuthState.snapshot;
    if (!forceRefresh && gasgxAuthState.loadingPromise) return await gasgxAuthState.loadingPromise;
    gasgxAuthState.loadingPromise = (async () => {
      const [persisted, signedOut, localSignedIn, loginState] = await Promise.all([
        loadPersistedGasGxAuthSnapshot(),
        loadGasGxSignedOutFlag(),
        loadGasGxLocalSignedInFlag(),
        loadGasGxLoginState()
      ]);

      const restoredSnapshot = sanitizeGasGxAuthSnapshot({
        ...persisted,
        status: (loginState || localSignedIn) ? "enabled" : persisted?.status,
        profileEnabled: (loginState || localSignedIn) ? true : persisted?.profileEnabled,
        plan: sparkToString(persisted?.plan, "").trim() || ((loginState || localSignedIn) ? "GasGx" : "")
      });
      const persistedHasSessionEvidence = hasUsableLocalGasGxAuth(restoredSnapshot, localSignedIn);
      if (signedOut) {
        const anonymous = sanitizeGasGxAuthSnapshot({
          ...getDefaultGasGxAuthSnapshot(),
          email: sparkToString(persisted?.email, "").trim()
        });
        gasgxAuthState.snapshot = anonymous;
        gasgxAuthState.loaded = true;
        dispatchGasGxAuthChanged(anonymous);
        return anonymous;
      }

      const hasPersistedAuth = !signedOut && (loginState || persistedHasSessionEvidence);
      if (hasPersistedAuth) {
        if (!loginState) {
          await persistGasGxLoginState(true);
        }
        if (!localSignedIn) {
          await persistGasGxLocalSignedInFlag(true);
        }
        const validatedRestored = await validatePersistedGasGxAuthSnapshot(restoredSnapshot);
        gasgxAuthState.snapshot = validatedRestored;
        gasgxAuthState.loaded = true;
        dispatchGasGxAuthChanged(validatedRestored);
        return validatedRestored;
      }

      if (!forceRefresh && !signedOut && (loginState || localSignedIn) && canReusePersistedGasGxAuthSnapshot(persisted)) {
        gasgxAuthState.snapshot = persisted;
        gasgxAuthState.loaded = true;
        dispatchGasGxAuthChanged(persisted);
        return persisted;
      }
      const validated = await validatePersistedGasGxAuthSnapshot(persisted);
      const next = signedOut
        ? sanitizeGasGxAuthSnapshot({
          ...validated,
          status: "anonymous"
        })
        : validated;
      return await persistGasGxAuthSnapshot(next);
    })();
    try {
      return await gasgxAuthState.loadingPromise;
    } finally {
      gasgxAuthState.loadingPromise = null;
    }
  }

  function normalizeStorageShape(result, requestedKeys) {
    if (!result || typeof result !== "object") return result;

    const patched = { ...result };
    const authSnapshot = getCurrentGasGxAuthSnapshot();
    const versionKey = sparkToString(chrome?.runtime?.getManifest?.()?.version, "").trim();

    if (isPopupContext() && versionKey) {
      if (includesStorageKey(requestedKeys, versionKey) && patched[versionKey] !== LEGACY_TRUE_RAW) {
        patched[versionKey] = LEGACY_TRUE_RAW;
      }
      if (includesStorageKey(requestedKeys, "Pixel Fresh Install") && patched["Pixel Fresh Install"] !== LEGACY_TRUE_RAW) {
        patched["Pixel Fresh Install"] = LEGACY_TRUE_RAW;
      }
    }

    for (const key of Object.keys(patched)) {
      const rawValue = patched[key];
      let normalizedValue = rawValue;

      if (
        key === ACCOUNT_KEY
        || key === LEGACY_PREFERENCES_STORAGE_KEY
        || key === UI_KEY
        || key === LINKEDIN_PROFILE_STORAGE_KEY
        || key === "automation"
      ) {
        normalizedValue = normalizeLegacyStorageWrite(key, rawValue, authSnapshot);
      } else if (rawValue && typeof rawValue === "object") {
        try {
          normalizedValue = JSON.stringify(rawValue);
        } catch (_err) {
          normalizedValue = rawValue;
        }
      }

      if (normalizedValue !== rawValue) {
        patched[key] = normalizedValue;
      }
    }

    return patched;
  }

  function patchStorageAreaGet(area) {
    if (!area || area.__ceGetPatched) return;
    if (typeof area.get !== "function") return;

    const originalGet = area.get.bind(area);
    ORIGINAL_STORAGE_GETTERS.set(area, originalGet);

    try {
      area.get = function patchedGet(keys, callback) {
        const run = async () => {
          if (!isPopupContext()) {
            await ensureGasGxAuthSnapshotLoaded();
          }
          const raw = await rawStorageGet(area, keys);
          if (includesStorageKey(keys, LEGACY_PREFERENCES_STORAGE_KEY)) {
            const canonical = await loadCanonicalLegacyPreferences(area);
            if (canonical) {
              raw[LEGACY_PREFERENCES_STORAGE_KEY] = stringifyLegacyStoredObject(canonical);
            }
          }
          return normalizeStorageShape(raw || {}, keys);
        };

        if (typeof callback === "function") {
          Promise.resolve().then(run).then((res) => callback(res)).catch(() => callback({}));
          return;
        }

        return Promise.resolve().then(run);
      };

      Object.defineProperty(area, "__ceGetPatched", {
        value: true,
        configurable: true
      });
    } catch (_err) {
      // Ignore when storage APIs are not patchable in current context.
    }
  }

  function patchStorageAreaSet(area) {
    if (!area || area.__ceSetPatched) return;
    if (typeof area.set !== "function") return;

    const originalSet = area.set.bind(area);
    ORIGINAL_STORAGE_SETTERS.set(area, originalSet);

    try {
      area.set = function patchedSet(items, callback) {
        const run = async () => {
          const payload = items && typeof items === "object" ? { ...items } : {};
          const authSnapshot = getCurrentGasGxAuthSnapshot();

          for (const key of [ACCOUNT_KEY, LEGACY_PREFERENCES_STORAGE_KEY, UI_KEY, LINKEDIN_PROFILE_STORAGE_KEY, "automation"]) {
            if (Object.prototype.hasOwnProperty.call(payload, key)) {
              payload[key] = normalizeLegacyStorageWrite(key, payload[key], authSnapshot);
            }
          }

          if (Object.prototype.hasOwnProperty.call(payload, LEGACY_PREFERENCES_STORAGE_KEY)) {
            const canonical = sanitizeLegacyPreferences(
              parseStoredObject(payload[LEGACY_PREFERENCES_STORAGE_KEY], getDefaultLegacyPreferences())
            );
            payload[LEGACY_PREFERENCES_STORAGE_KEY] = stringifyLegacyStoredObject(canonical);
            payload[LEGACY_PREFERENCES_CANONICAL_KEY] = stringifyStoredObject(canonical);
          }

          const keys = Object.keys(payload);
          if (!keys.length) return;

          const current = await rawStorageGet(area, keys);
          const changedPayload = {};
          for (const key of keys) {
            if (current?.[key] !== payload[key]) {
              changedPayload[key] = payload[key];
            }
          }

          if (!Object.keys(changedPayload).length) return;
          await rawStorageSet(area, changedPayload);
        };

        if (typeof callback === "function") {
          Promise.resolve().then(run).then(() => callback()).catch(() => callback());
          return;
        }

        return Promise.resolve().then(run);
      };

      Object.defineProperty(area, "__ceSetPatched", {
        value: true,
        configurable: true
      });
    } catch (_err) {
      // Ignore when storage APIs are not patchable in current context.
    }
  }

  const STORAGE_AREAS = [];
  patchGlobalJsonParse();
  if (typeof chrome !== "undefined" && chrome.storage) {
    if (chrome.storage.local) {
      patchStorageAreaGet(chrome.storage.local);
      patchStorageAreaSet(chrome.storage.local);
      STORAGE_AREAS.push(chrome.storage.local);
    }
    if (chrome.storage.sync) {
      patchStorageAreaGet(chrome.storage.sync);
      patchStorageAreaSet(chrome.storage.sync);
      STORAGE_AREAS.push(chrome.storage.sync);
    }
  }

  const DEFAULT_ACCOUNT = {
    subscriberId: TEST_SUBSCRIBER_ID,
    email: "",
    password: "",
    plan: "Advanced",
    isTrialEligible: true,
    accessToken: "",
    refreshToken: ""
  };

  const DICT = [
    ["Account", "账号"],
    ["Preferences", "偏好"],
    ["Automation", "自动化"],
    ["Have an account?", "已有账号？"],
    ["Sign in", "登录"],
    ["Sign out", "退出登录"],
    ["Sign up", "注册"],
    ["Plan:", "套餐："],
    ["Length:", "长度："],
    ["Use Emojis", "使用表情"],
    ["Using emojis", "已启用表情"],
    ["Not using emojis", "已关闭表情"]
  ];

  const enToZh = new Map(DICT);
  const zhToEn = new Map(DICT.map(([en, zh]) => [zh, en]));
  const FIXED_EN_TO_ZH = new Map([
    ["Account", "\u8d26\u53f7"],
    ["Preferences", "\u504f\u597d"],
    ["Automation", "\u81ea\u52a8\u5316"],
    ["Have an account?", "\u5df2\u6709\u8d26\u53f7\uff1f"],
    ["Sign in", "\u767b\u5f55"],
    ["Sign out", "\u9000\u51fa\u767b\u5f55"],
    ["Sign up", "\u6ce8\u518c"],
    ["Length:", "\u957f\u5ea6\uff1a"],
    ["Tone", "\u8bed\u6c14"],
    ["Voice Gender", "\u8bed\u6c14\u6027\u522b"],
    ["Not Specified", "\u672a\u6307\u5b9a"],
    ["Male", "\u7537\u6027"],
    ["Female", "\u5973\u6027"],
    ["Open Ended", "\u5f00\u653e\u5f0f\u7ed3\u5c3e"],
    ["Use Emojis", "\u4f7f\u7528\u8868\u60c5"],
    ["Comment/Reply in English", "\u8bc4\u8bba/\u56de\u590d\u4f7f\u7528\u82f1\u6587"],
    ["Keep Replies Short", "\u4fdd\u6301\u7b80\u77ed\u56de\u590d"],
    ["On My Own Posts 鈥?Reply Only with Ack", "\u6211\u7684\u5e16\u5b50\u4ec5\u786e\u8ba4\u5f0f\u56de\u590d"],
    ["On My Own Posts - Reply Only with Ack", "\u6211\u7684\u5e16\u5b50\u4ec5\u786e\u8ba4\u5f0f\u56de\u590d"],
    ["Extension enabled", "\u6269\u5c55\u5df2\u542f\u7528"],
    ["Extension disabled", "\u6269\u5c55\u5df2\u7981\u7528"],
    ["Commenting in English", "\u5df2\u5207\u6362\u4e3a\u82f1\u6587\u8bc4\u8bba"],
    ["Commenting in post language", "\u5df2\u6309\u5e16\u5b50\u8bed\u8a00\u8bc4\u8bba"],
    ["Using emojis", "\u5df2\u542f\u7528\u8868\u60c5"],
    ["Not using emojis", "\u5df2\u5173\u95ed\u8868\u60c5"],
    ["Ending comments with a question", "\u8bc4\u8bba\u5c06\u4ee5\u95ee\u9898\u7ed3\u5c3e"],
    ["Ending comments natively", "\u8bc4\u8bba\u7ed3\u5c3e\u6062\u590d\u9ed8\u8ba4"],
    ["Replying with acknowledge", "\u56de\u590d\u5c06\u4ee5\u786e\u8ba4\u5f0f\u8868\u8fbe"],
    ["Replying natively", "\u56de\u590d\u6062\u590d\u9ed8\u8ba4"],
    ["Disabled on short comments", "\u77ed\u8bc4\u8bba\u6a21\u5f0f\u4e0b\u4e0d\u53ef\u7528"],
    ["Reset CommenTron Seats", "\u91cd\u7f6e CommenTRON \u914d\u989d"],
    ["Click here", "\u70b9\u51fb\u8fd9\u91cc"],
    ["Email", "\u90ae\u7bb1"],
    ["Password", "\u5bc6\u7801"],
    ["Version:", "\u7248\u672c\uff1a"],
    ["Seat:", "\u5e2d\u4f4d\uff1a"],
    ["Comment", "\u8bc4\u8bba"],
    ["Reply", "\u56de\u590d"],
    ["<span>Same password you used to register with RocketPod. <br /> <a style='color: white' href='https://rocket-pod.ai/my-account/lost-password' target='_blank'>Forgot password?</a></span>", "<span>\u8bf7\u8f93\u5165\u4f60\u6ce8\u518c RocketPod \u65f6\u4f7f\u7528\u7684\u5bc6\u7801\u3002<br /> <a style='color: white' href='https://rocket-pod.ai/my-account/lost-password' target='_blank'>\u5fd8\u8bb0\u5bc6\u7801\uff1f</a></span>"],
    ["On my own posts \u2014 do not get involved too much in the context and just acknowledge by showing appreciation for the comment.", "\u5728\u6211\u7684\u5e16\u5b50\u4e0b\uff0c\u4e0d\u8981\u8fc7\u591a\u4ecb\u5165\u4e0a\u4e0b\u6587\uff0c\u4ec5\u901a\u8fc7\u611f\u8c22\u8fdb\u884c\u786e\u8ba4\u56de\u590d\u3002"],
    ["On my own posts - do not get involved too much in the context and just acknowledge by showing appreciation for the comment.", "\u5728\u6211\u7684\u5e16\u5b50\u4e0b\uff0c\u4e0d\u8981\u8fc7\u591a\u4ecb\u5165\u4e0a\u4e0b\u6587\uff0c\u4ec5\u901a\u8fc7\u611f\u8c22\u8fdb\u884c\u786e\u8ba4\u56de\u590d\u3002"],
    ["On my own posts ? do not get involved too much in the context and just acknowledge by showing appreciation for the comment.", "\u5728\u6211\u7684\u5e16\u5b50\u4e0b\uff0c\u4e0d\u8981\u8fc7\u591a\u4ecb\u5165\u4e0a\u4e0b\u6587\uff0c\u4ec5\u901a\u8fc7\u611f\u8c22\u8fdb\u884c\u786e\u8ba4\u56de\u590d\u3002"]
  ]);
  const FIXED_ZH_TO_EN = new Map(Array.from(FIXED_EN_TO_ZH.entries(), ([en, zh]) => [zh, en]));
  const OPTION_EN_TO_ZH = new Map([
    ["Super Short", "\u8d85\u77ed"],
    ["SuperShort", "\u8d85\u77ed"],
    ["Brief", "\u7b80\u77ed"],
    ["Concise", "\u7cbe\u70bc"],
    ["In-Length", "\u9002\u4e2d"],
    ["InLength", "\u9002\u4e2d"],
    ["Multi-Paragraph", "\u591a\u6bb5"],
    ["MultiParagraph", "\u591a\u6bb5"],
    ["Detailed", "\u8be6\u7ec6"],
    ["Excited", "\u5174\u594b"],
    ["Surprised", "\u60ca\u559c"],
    ["Happy", "\u5f00\u5fc3"],
    ["Gracious", "\u4eb2\u5207"],
    ["Friendly", "\u53cb\u597d"],
    ["Supportive", "\u652f\u6301"],
    ["Polite", "\u793c\u8c8c"],
    ["Formal", "\u6b63\u5f0f"],
    ["Professional", "\u4e13\u4e1a"],
    ["Academic", "\u5b66\u672f"],
    ["Witty", "\u673a\u667a"],
    ["Comic", "\u5e7d\u9ed8"],
    ["Sarcastic", "\u8bbd\u523a"],
    ["Direct", "\u76f4\u63a5"],
    ["Assertive", "\u575a\u5b9a"],
    ["Respectfully Opposed", "\u793c\u8c8c\u53cd\u5bf9"],
    ["RespectfullyOpposed", "\u793c\u8c8c\u53cd\u5bf9"],
    ["Controversial", "\u6709\u4e89\u8bae"],
    ["Disappointed", "\u5931\u671b"],
    ["Frustrated", "\u6cae\u4e27"],
    ["Sad", "\u96be\u8fc7"],
    ["Angry", "\u6124\u6012"],
    ["Basic", "\u57fa\u7840\u7248"],
    ["Light", "\u8f7b\u91cf\u7248"],
    ["Ultra", "\u8d85\u7ea7\u7248"],
    ["Agency", "\u673a\u6784\u7248"],
    ["NotSpecified", "\u672a\u6307\u5b9a"],
    ["OneDay", "\u4e00\u5929"],
    ["ThreeDays", "\u4e09\u5929"],
    ["OneWeek", "\u4e00\u5468"],
    ["OneMonth", "\u4e00\u4e2a\u6708"],
    ["ThreeMonths", "\u4e09\u4e2a\u6708"],
    ["Week", "\u4e00\u5468"],
    ["Month", "\u4e00\u4e2a\u6708"],
    ["Quarter", "\u4e00\u5b63\u5ea6"],
    ["Year", "\u4e00\u5e74"],
    ["Forever", "\u6c38\u4e45"],
    ["Company", "\u516c\u53f8"],
    ["Accounting", "\u4f1a\u8ba1"],
    ["Animation & Video Production", "\u52a8\u753b\u4e0e\u89c6\u9891\u5236\u4f5c"],
    ["Architecture", "\u5efa\u7b51"],
    ["Arts & Design", "\u827a\u672f\u4e0e\u8bbe\u8ba1"],
    ["Artificial Intelligence (AI)", "\u4eba\u5de5\u667a\u80fd\uff08AI\uff09"],
    ["Automotive", "\u6c7d\u8f66"],
    ["Banking & Finance", "\u94f6\u884c\u4e0e\u91d1\u878d"],
    ["Consultation", "\u54a8\u8be2"],
    ["Copywriting", "\u6587\u6848\u5199\u4f5c"],
    ["Customer Support", "\u5ba2\u670d\u652f\u6301"],
    ["Data Analytics", "\u6570\u636e\u5206\u6790"],
    ["E-Commerce", "\u7535\u5b50\u5546\u52a1"],
    ["Education", "\u6559\u80b2"],
    ["Entertainment", "\u5a31\u4e50"],
    ["Events", "\u6d3b\u52a8"],
    ["Fitness & Wellness", "\u5065\u8eab\u4e0e\u5065\u5eb7"],
    ["Graphic Design", "\u5e73\u9762\u8bbe\u8ba1"],
    ["Healthcare", "\u533b\u7597\u5065\u5eb7"],
    ["Hospitality & Tourism", "\u9152\u5e97\u4e0e\u65c5\u6e38"],
    ["Human Resources", "\u4eba\u529b\u8d44\u6e90"],
    ["Information Technology", "\u4fe1\u606f\u6280\u672f"],
    ["Insurance & Actuaries", "\u4fdd\u9669\u4e0e\u7cbe\u7b97"],
    ["Interior Design", "\u5ba4\u5185\u8bbe\u8ba1"],
    ["Legal", "\u6cd5\u52a1"],
    ["Logistics & Supply Chain", "\u7269\u6d41\u4e0e\u4f9b\u5e94\u94fe"],
    ["Manufacturing", "\u5236\u9020\u4e1a"],
    ["Marketing & Advertising", "\u5e02\u573a\u8425\u9500\u4e0e\u5e7f\u544a"],
    ["Mental Health Care", "\u5fc3\u7406\u5065\u5eb7\u62a4\u7406"],
    ["Non-Profit", "\u975e\u8425\u5229\u7ec4\u7ec7"],
    ["Photography", "\u6444\u5f71"],
    ["Public Relations", "\u516c\u5171\u5173\u7cfb"],
    ["Real Estate", "\u623f\u5730\u4ea7"],
    ["Research & Development", "\u7814\u53d1"],
    ["Software Development", "\u8f6f\u4ef6\u5f00\u53d1"],
    ["Venture Capital & Private Equity", "\u98ce\u9669\u6295\u8d44\u4e0e\u79c1\u52df\u80a1\u6743"],
    ["one day", "\u4e00\u5929"],
    ["three days", "\u4e09\u5929"],
    ["one week", "\u4e00\u5468"],
    ["one month", "\u4e00\u4e2a\u6708"],
    ["three months", "\u4e09\u4e2a\u6708"],
    ["Confident", "\u81ea\u4fe1"],
    ["Empathetic", "\u5171\u60c5"],
    ["Inspirational", "\u9f13\u821e"],
    ["Advanced", "\u9ad8\u7ea7"],
    ["Trial", "\u8bd5\u7528"],
    ["Free", "\u514d\u8d39"]
  ]);
  const OPTION_ZH_TO_EN = new Map(Array.from(OPTION_EN_TO_ZH.entries(), ([en, zh]) => [zh, en]));

  let currentMode = normalizeTheme(localStorage.getItem(MODE_KEY));
  let currentLang = normalizeLang(localStorage.getItem(LANG_KEY));
  let applyQueued = false;

  function isPopupContext() {
    try {
      return window.location.pathname.endsWith("popup.html");
    } catch (_err) {
      return false;
    }
  }

  function isPopupReloadExecution(details) {
    const source = sparkToString(details?.func?.toString?.(), "");
    return /window\.location\.reload\s*\(/.test(source);
  }

  function isPopupLoadProfileExecution(details) {
    const source = sparkToString(details?.func?.toString?.(), "");
    return /window\.loadProfile\s*\(/.test(source);
  }

  async function executeLinkedInProfileProbe(originalExecuteScript, details) {
    const probeDetails = {
      target: details?.target,
      world: details?.world,
      injectImmediately: details?.injectImmediately,
      func: async () => {
        const toText = (value) => {
          if (value === undefined || value === null) return "";
          return String(value).trim();
        };
        const parseSeat = (href) => {
          const raw = toText(href);
          if (!raw) return "";
          try {
            const url = new URL(raw, window.location.origin);
            const match = url.pathname.match(/\/in\/([^/?#]+)/i);
            return match ? decodeURIComponent(match[1]) : "";
          } catch (_err) {
            return "";
          }
        };
        const buildImageUrlFromVector = (vector) => {
          if (!vector || typeof vector !== "object") return "";
          const rootUrl = toText(vector.rootUrl);
          const artifacts = Array.isArray(vector.artifacts) ? vector.artifacts : [];
          const artifact = artifacts.length ? artifacts[artifacts.length - 1] : null;
          const path = toText(artifact?.fileIdentifyingUrlPathSegment);
          return rootUrl && path ? `${rootUrl}${path}` : "";
        };
        const pickText = (selectors) => {
          for (const selector of selectors) {
            const node = document.querySelector(selector);
            const text = toText(node?.textContent || node?.getAttribute?.("alt"));
            if (text) return text;
          }
          return "";
        };
        const pickAttr = (selectors, attr) => {
          for (const selector of selectors) {
            const node = document.querySelector(selector);
            const value = toText(node?.getAttribute?.(attr));
            if (value) return value;
          }
          return "";
        };
        const fromDom = () => ({
          seat: parseSeat(
            pickAttr([
              "a[data-control-name='nav.settings_view_profile'][href*='/in/']",
              "a.global-nav__secondary-link[href*='/in/']",
              ".feed-identity-module a[href*='/in/']",
              "a[href*='linkedin.com/in/']"
            ], "href")
          ),
          me: pickText([
            ".feed-identity-module__actor-meta strong",
            ".feed-identity-module__actor-meta div",
            "a[data-control-name='nav.settings_view_profile'] span[aria-hidden='true']",
            "img.global-nav__me-photo"
          ]),
          imageUrl: pickAttr([
            "img.global-nav__me-photo",
            ".feed-identity-module img",
            "img.presence-entity__image"
          ], "src")
        });

        const domProfile = fromDom();

        try {
          const sessionMatch = document.cookie.match(/JSESSIONID=\"?(.*?)\"?(?:;|$)/);
          const csrfToken = toText(sessionMatch?.[1]);
          if (!csrfToken) return domProfile;

          const response = await fetch("https://www.linkedin.com/voyager/api/me", {
            credentials: "include",
            headers: {
              "csrf-token": csrfToken,
              "x-restli-protocol-version": "2.0.0"
            }
          });
          if (!response.ok) return domProfile;

          const payload = await response.json();
          const miniProfile = payload?.miniProfile && typeof payload.miniProfile === "object" ? payload.miniProfile : {};
          const fullName = [toText(miniProfile.firstName), toText(miniProfile.lastName)].filter(Boolean).join(" ").trim();
          const vectorImage = miniProfile?.picture?.["com.linkedin.common.VectorImage"]
            || miniProfile?.picture?.vectorImage
            || miniProfile?.picture?.displayImageReference?.vectorImage
            || payload?.profilePicture?.displayImageReference?.vectorImage
            || null;

          return {
            seat: toText(miniProfile.publicIdentifier) || domProfile.seat,
            me: fullName || domProfile.me,
            imageUrl: buildImageUrlFromVector(vectorImage) || domProfile.imageUrl
          };
        } catch (_err) {
          return domProfile;
        }
      },
      args: []
    };

    const results = await originalExecuteScript(probeDetails);
    const profile = sanitizeLinkedInProfile(Array.isArray(results) ? results[0]?.result : null);
    if (hasLinkedInProfileData(profile)) {
      await persistLinkedInProfile(profile);
      return [{ result: profile }];
    }

    const stored = await loadPersistedLinkedInProfile();
    return [{ result: stored }];
  }

  function installPopupExecuteScriptPatch() {
    if (!isPopupContext()) return;
    const scriptingApi = chrome?.scripting;
    if (!scriptingApi || typeof scriptingApi.executeScript !== "function") return;
    if (scriptingApi.executeScript.__cePopupPatched) return;

    const originalExecuteScript = scriptingApi.executeScript.bind(scriptingApi);
    const patchedExecuteScript = function patchedExecuteScript(details, callback) {
      const run = async () => {
        if (isPopupReloadExecution(details)) {
          return [{ result: null }];
        }

        if (isPopupLoadProfileExecution(details)) {
          return await executeLinkedInProfileProbe(originalExecuteScript, details);
        }

        return await originalExecuteScript(details);
      };

      if (typeof callback === "function") {
        run().then((result) => callback(result)).catch(() => callback([]));
        return;
      }

      return run();
    };

    patchedExecuteScript.__cePopupPatched = true;
    patchedExecuteScript.__cePopupOriginal = originalExecuteScript;
    scriptingApi.executeScript = patchedExecuteScript;
  }

  function normalizeTheme(mode) {
    return THEMES.includes(mode) ? mode : "dark";
  }

  function normalizeLang(lang) {
    if (LANGUAGES.includes(lang)) return lang;
    return navigator.language && navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
  }

  function normalizeLinkedInPageLang(lang) {
    const normalized = sparkToString(lang, "").trim().toLowerCase();
    if (!normalized) return "";
    if (normalized.startsWith("zh")) return "zh-CN";
    if (normalized.startsWith("en")) return "en";
    return "";
  }

  function clampDelaySecond(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(30, Math.round(n)));
  }

  function normalizeDelayRange(minSec, maxSec) {
    let min = clampDelaySecond(minSec, DEFAULT_DELAY_MIN_SEC);
    let max = clampDelaySecond(maxSec, DEFAULT_DELAY_MAX_SEC);
    if (max < min) {
      const tmp = min;
      min = max;
      max = tmp;
    }
    return { min, max };
  }

  function setAutoSendDelayRange(minSec, maxSec) {
    const normalized = normalizeDelayRange(minSec, maxSec);
    autoSendDelayMinSec = normalized.min;
    autoSendDelayMaxSec = normalized.max;
    return normalized;
  }

  function normalizeAutoSendEnabled(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const lowered = value.toLowerCase();
      if (lowered === "true") return true;
      if (lowered === "false") return false;
    }
    return DEFAULT_AUTO_SEND_ENABLED;
  }

  function normalizeFeatureToggle(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const lowered = value.trim().toLowerCase();
      if (["1", "true", "yes", "y", "on"].includes(lowered)) return true;
      if (["0", "false", "no", "n", "off"].includes(lowered)) return false;
    }
    return fallback;
  }

  function normalizeReplyPromptHint(value) {
    if (typeof value !== "string") return DEFAULT_REPLY_PROMPT_HINT;
    return value.replace(/\s+/g, " ").trim().slice(0, 240);
  }

  function persistAutoSendDelayRange() {
    const storage = chrome?.storage?.local;
    if (!storage?.set) return Promise.resolve();
    const normalized = setAutoSendDelayRange(autoSendDelayMinSec, autoSendDelayMaxSec);
    return new Promise((resolve) => {
      try {
        storage.set(
          {
            [DELAY_MIN_SEC_KEY]: normalized.min,
            [DELAY_MAX_SEC_KEY]: normalized.max
          },
          () => resolve()
        );
      } catch (_err) {
        resolve();
      }
    });
  }

  function persistAutoSendSettings() {
    const storage = chrome?.storage?.local;
    if (!storage?.set) return Promise.resolve();

    const normalized = setAutoSendDelayRange(autoSendDelayMinSec, autoSendDelayMaxSec);
    autoSendEnabled = normalizeAutoSendEnabled(autoSendEnabled);
    const persistedAt = Date.now();
    writeLocalStorageValue(
      AUTO_SEND_CACHE_KEY,
      stringifyStoredObject({
        enabled: autoSendEnabled,
        minSec: normalized.min,
        maxSec: normalized.max
      })
    );
    writeLocalStorageValue(AUTO_SEND_CACHE_AT_KEY, String(persistedAt));

    return new Promise((resolve) => {
      try {
        storage.set(
          {
            [AUTO_SEND_ENABLED_KEY]: autoSendEnabled,
            [DELAY_MIN_SEC_KEY]: normalized.min,
            [DELAY_MAX_SEC_KEY]: normalized.max,
            ce_auto_send_settings_at: persistedAt
          },
          () => resolve()
        );
      } catch (_err) {
        resolve();
      }
    });
  }

  function loadAutoSendDelayRange() {
    const storage = chrome?.storage?.local;
    const cachedRaw = readLocalStorageValue(AUTO_SEND_CACHE_KEY, "");
    const cachedAt = sparkToNumber(readLocalStorageValue(AUTO_SEND_CACHE_AT_KEY, "0"), 0);
    const cached = cachedRaw ? parseStoredObject(cachedRaw, null) : null;
    if (!storage?.get) {
      applyAutoSendSnapshot(
        cachedRaw ? cached?.enabled : DEFAULT_AUTO_SEND_ENABLED,
        cached?.minSec ?? DEFAULT_DELAY_MIN_SEC,
        cached?.maxSec ?? DEFAULT_DELAY_MAX_SEC
      );
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      try {
        storage.get(
          {
            [AUTO_SEND_ENABLED_KEY]: DEFAULT_AUTO_SEND_ENABLED,
            [DELAY_MIN_SEC_KEY]: DEFAULT_DELAY_MIN_SEC,
            [DELAY_MAX_SEC_KEY]: DEFAULT_DELAY_MAX_SEC,
            ce_auto_send_settings_at: 0
          },
          (obj) => {
            if (cached && cachedAt >= sparkToNumber(obj?.ce_auto_send_settings_at, 0)) {
              applyAutoSendSnapshot(cached?.enabled, cached?.minSec, cached?.maxSec);
              resolve();
              return;
            }
            applyAutoSendSnapshot(
              obj?.[AUTO_SEND_ENABLED_KEY],
              obj?.[DELAY_MIN_SEC_KEY],
              obj?.[DELAY_MAX_SEC_KEY]
            );
            resolve();
          }
        );
      } catch (_err) {
        applyAutoSendSnapshot(DEFAULT_AUTO_SEND_ENABLED, DEFAULT_DELAY_MIN_SEC, DEFAULT_DELAY_MAX_SEC);
        resolve();
      }
    });
  }

  function getAutoSendDelayMs() {
    const minMs = Math.max(0, autoSendDelayMinSec * 1000);
    const maxMs = Math.max(minMs, autoSendDelayMaxSec * 1000);
    return Math.floor(minMs + Math.random() * (maxMs - minMs + 1));
  }

  function showAutoSendDebugHint(message) {
    if (isPopupContext() || !document?.body) return;
    const text = sparkToString(message, "").trim();
    if (!text) return;

    let node = document.getElementById("ce-auto-send-debug-hint");
    if (!node) {
      ensureGasGxPopupStyles();
      node = document.createElement("div");
      node.id = "ce-auto-send-debug-hint";
      node.className = "ce-gasgx-toast ce-gasgx-toast-debug";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      document.body.appendChild(node);
    }

    node.textContent = text;
    node.style.display = "block";
    if (autoSendDebugHintTimer) {
      clearTimeout(autoSendDebugHintTimer);
      autoSendDebugHintTimer = 0;
    }
  }

  function applyAutoSendSnapshot(enabled, minSec, maxSec, reason = "") {
    autoSendEnabled = normalizeAutoSendEnabled(enabled);
    setAutoSendDelayRange(minSec, maxSec);
    autoSendSettingsLoaded = true;
    const persistedAt = Date.now();
    writeLocalStorageValue(
      AUTO_SEND_CACHE_KEY,
      stringifyStoredObject({
        enabled: autoSendEnabled,
        minSec: autoSendDelayMinSec,
        maxSec: autoSendDelayMaxSec
      })
    );
    writeLocalStorageValue(AUTO_SEND_CACHE_AT_KEY, String(persistedAt));
    if (!isPopupContext()) {
      const suffix = reason ? ` | ${reason}` : "";
      showAutoSendDebugHint(
        `自动发送状态：${autoSendEnabled ? "开启" : "关闭"}（${autoSendDelayMinSec}~${autoSendDelayMaxSec}秒）${suffix}`
      );
    }
  }

  function hydrateAutoSendFromLocalCache() {
    const cachedRaw = readLocalStorageValue(AUTO_SEND_CACHE_KEY, "");
    if (!cachedRaw) return false;
    const cached = parseStoredObject(cachedRaw, null);
    if (!cached || typeof cached !== "object") return false;
    applyAutoSendSnapshot(cached?.enabled, cached?.minSec, cached?.maxSec, "cached");
    return true;
  }

  function setupAutoSendDelayRuntime() {
    hydrateAutoSendFromLocalCache();
    try {
      const storageChanges = chrome?.storage?.onChanged;
      if (storageChanges?.addListener && !storageChanges.__ceAutoSendPatched) {
        storageChanges.addListener((changes, areaName) => {
          if (areaName !== "local" || !changes || typeof changes !== "object") return;
          const enabledChange = changes[AUTO_SEND_ENABLED_KEY];
          const minChange = changes[DELAY_MIN_SEC_KEY];
          const maxChange = changes[DELAY_MAX_SEC_KEY];
          if (!enabledChange && !minChange && !maxChange) return;
          applyAutoSendSnapshot(
            enabledChange ? enabledChange.newValue : autoSendEnabled,
            minChange ? minChange.newValue : autoSendDelayMinSec,
            maxChange ? maxChange.newValue : autoSendDelayMaxSec,
            "storage changed"
          );
        });
        Object.defineProperty(storageChanges, "__ceAutoSendPatched", {
          value: true,
          configurable: true
        });
      }
    } catch (_err) {}

    window.__ceGetAutoSendDelayMs = () => {
      if (!autoSendSettingsLoaded) {
        hydrateAutoSendFromLocalCache();
        void loadAutoSendDelayRange();
      }
      const delayMs = getAutoSendDelayMs();
      showAutoSendDebugHint(
        `自动发送调试：已开启，等待 ${Math.max(0, Math.round(delayMs / 100) / 10)} 秒（${autoSendDelayMinSec}~${autoSendDelayMaxSec}秒）`
      );
      return delayMs;
    };
    window.__ceIsAutoSendEnabled = () => {
      if (!autoSendSettingsLoaded) {
        hydrateAutoSendFromLocalCache();
        void loadAutoSendDelayRange();
      }
      const enabled = !!autoSendEnabled;
      if (!enabled) {
        showAutoSendDebugHint("自动发送调试：当前 LinkedIn 页面仍为关闭状态。");
      }
      return enabled;
    };
    void loadAutoSendDelayRange();
    setInterval(() => {
      void loadAutoSendDelayRange();
    }, 15_000);
  }

  function persistRandomStrategySettings() {
    const storage = chrome?.storage?.local;
    if (!storage?.set) return Promise.resolve();
    randomToneEnabled = normalizeFeatureToggle(randomToneEnabled, DEFAULT_RANDOM_TONE_ENABLED);
    randomLengthEnabled = normalizeFeatureToggle(randomLengthEnabled, DEFAULT_RANDOM_LENGTH_ENABLED);
    randomStrategyUpdatedAt = Date.now();
    writeLocalStorageValue(
      RANDOM_STRATEGY_CACHE_KEY,
      stringifyStoredObject({
        randomToneEnabled,
        randomLengthEnabled
      })
    );
    writeLocalStorageValue(RANDOM_STRATEGY_CACHE_AT_KEY, String(randomStrategyUpdatedAt));
    return new Promise((resolve) => {
      try {
        storage.set(
          {
            [RANDOM_TONE_ENABLED_KEY]: randomToneEnabled,
            [RANDOM_LENGTH_ENABLED_KEY]: randomLengthEnabled,
            ce_random_strategy_settings_at: randomStrategyUpdatedAt
          },
          () => resolve()
        );
      } catch (_err) {
        resolve();
      }
    });
  }

  function loadRandomStrategySettings() {
    const storage = chrome?.storage?.local;
    const cachedRaw = readLocalStorageValue(RANDOM_STRATEGY_CACHE_KEY, "");
    const cachedAt = sparkToNumber(readLocalStorageValue(RANDOM_STRATEGY_CACHE_AT_KEY, "0"), 0);
    const cached = cachedRaw ? parseStoredObject(cachedRaw, null) : null;
    if (!storage?.get) {
      randomToneEnabled = normalizeFeatureToggle(cached?.randomToneEnabled, DEFAULT_RANDOM_TONE_ENABLED);
      randomLengthEnabled = normalizeFeatureToggle(cached?.randomLengthEnabled, DEFAULT_RANDOM_LENGTH_ENABLED);
      return Promise.resolve();
    }

    const requestStartedAt = Date.now();

    return new Promise((resolve) => {
      try {
        storage.get(
          {
            [RANDOM_TONE_ENABLED_KEY]: DEFAULT_RANDOM_TONE_ENABLED,
            [RANDOM_LENGTH_ENABLED_KEY]: DEFAULT_RANDOM_LENGTH_ENABLED,
            ce_random_strategy_settings_at: 0
          },
          (obj) => {
            if (requestStartedAt < randomStrategyUpdatedAt) {
              resolve();
              return;
            }
            if (cached && cachedAt >= sparkToNumber(obj?.ce_random_strategy_settings_at, 0)) {
              randomToneEnabled = normalizeFeatureToggle(cached?.randomToneEnabled, DEFAULT_RANDOM_TONE_ENABLED);
              randomLengthEnabled = normalizeFeatureToggle(cached?.randomLengthEnabled, DEFAULT_RANDOM_LENGTH_ENABLED);
              resolve();
              return;
            }
            randomToneEnabled = normalizeFeatureToggle(obj?.[RANDOM_TONE_ENABLED_KEY], DEFAULT_RANDOM_TONE_ENABLED);
            randomLengthEnabled = normalizeFeatureToggle(obj?.[RANDOM_LENGTH_ENABLED_KEY], DEFAULT_RANDOM_LENGTH_ENABLED);
            resolve();
          }
        );
      } catch (_err) {
        randomToneEnabled = DEFAULT_RANDOM_TONE_ENABLED;
        randomLengthEnabled = DEFAULT_RANDOM_LENGTH_ENABLED;
        resolve();
      }
    });
  }

  function setupRandomStrategyRuntime() {
    window.__ceIsRandomToneEnabled = () => !!randomToneEnabled;
    window.__ceIsRandomLengthEnabled = () => !!randomLengthEnabled;
    void loadRandomStrategySettings();
    setInterval(() => {
      void loadRandomStrategySettings();
    }, 15_000);
  }

  function persistReplyPromptHint() {
    const storage = chrome?.storage?.local;
    replyPromptHint = normalizeReplyPromptHint(replyPromptHint);
    const persistedAt = Date.now();
    writeLocalStorageValue(REPLY_PROMPT_HINT_CACHE_KEY, replyPromptHint);
    writeLocalStorageValue(REPLY_PROMPT_HINT_CACHE_AT_KEY, String(persistedAt));
    if (!storage?.set) return Promise.resolve();
    return new Promise((resolve) => {
      try {
        storage.set(
          {
            [REPLY_PROMPT_HINT_KEY]: replyPromptHint,
            ce_reply_prompt_hint_at: persistedAt
          },
          () => resolve()
        );
      } catch (_err) {
        resolve();
      }
    });
  }

  function loadReplyPromptHint() {
    const storage = chrome?.storage?.local;
    const cachedHint = normalizeReplyPromptHint(
      readLocalStorageValue(REPLY_PROMPT_HINT_CACHE_KEY, DEFAULT_REPLY_PROMPT_HINT)
    );
    const cachedAt = sparkToNumber(
      readLocalStorageValue(REPLY_PROMPT_HINT_CACHE_AT_KEY, "0"),
      0
    );
    if (!storage?.get) {
      replyPromptHint = cachedHint;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      try {
        storage.get(
          {
            [REPLY_PROMPT_HINT_KEY]: DEFAULT_REPLY_PROMPT_HINT,
            ce_reply_prompt_hint_at: 0
          },
          (obj) => {
            const storedAt = sparkToNumber(obj?.ce_reply_prompt_hint_at, 0);
            const storedHint = normalizeReplyPromptHint(obj?.[REPLY_PROMPT_HINT_KEY]);
            replyPromptHint = cachedAt >= storedAt
              ? cachedHint
              : storedHint || cachedHint;
            resolve();
          }
        );
      } catch (_err) {
        replyPromptHint = cachedHint;
        resolve();
      }
    });
  }

  function setupReplyPromptHintRuntime() {
    window.__ceGetReplyPromptHint = () => replyPromptHint || "";
    void loadReplyPromptHint();
    setInterval(() => {
      void loadReplyPromptHint();
    }, 15_000);
  }

  function findLegacyParcelRequire() {
    try {
      const globalObj = typeof globalThis !== "undefined" ? globalThis : window;
      for (const key of Object.getOwnPropertyNames(globalObj)) {
        if (!/^parcelRequire/i.test(key)) continue;
        const candidate = globalObj[key];
        if (typeof candidate === "function" && candidate.isParcelRequire) {
          return candidate;
        }
      }
    } catch (_err) {}
    return null;
  }

  function patchLegacyAutomationPreferences(bundleRequire) {
    try {
      const preferencesModule = bundleRequire?.("cNKw6");
      const PreferencesModel = preferencesModule?.PreferencesModel;
      if (!PreferencesModel || PreferencesModel.__ceAutomationPreferencesPatched) return true;

      const originalLoad = typeof PreferencesModel.load === "function"
        ? PreferencesModel.load.bind(PreferencesModel)
        : null;

      if (originalLoad && !PreferencesModel.__ceLoadPatched) {
        PreferencesModel.load = async () => {
          const loaded = sanitizeLegacyPreferences(
            await originalLoad().catch(() => getDefaultLegacyPreferences())
          );
          PreferencesModel.__ceLastRawPreferences = loaded;
          return adaptPreferencesForLegacyContentBundle(loaded);
        };
        Object.defineProperty(PreferencesModel, "__ceLoadPatched", {
          value: true,
          configurable: true
        });
      }

      PreferencesModel.createAutomationPreferences = (voiceGender, reengagementCooldown) => {
        const basePreferences = sanitizeLegacyPreferences(
          sparkIsPlainObject(PreferencesModel.__ceLastRawPreferences)
            ? PreferencesModel.__ceLastRawPreferences
            : getDefaultLegacyPreferences()
        );

        return adaptPreferencesForLegacyContentBundle({
          ...basePreferences,
          voiceGender: sparkToString(voiceGender, basePreferences.voiceGender).trim() || basePreferences.voiceGender,
          reengagementCooldown: sparkToString(
            reengagementCooldown,
            basePreferences.reengagementCooldown
          ).trim() || basePreferences.reengagementCooldown
        });
      };

      Object.defineProperty(PreferencesModel, "__ceAutomationPreferencesPatched", {
        value: true,
        configurable: true
      });
      return true;
    } catch (_err) {
      return false;
    }
  }

  function patchLegacyCommentScraper(bundleRequire) {
    try {
      const { commentScraper } = bundleRequire?.("3gkXb") || {};
      if (!commentScraper || commentScraper.__cePasteCommentPatched) return true;

      commentScraper.pasteComment = function patchedPasteComment(inputBox, text) {
        const finalText = normalizeSparkOutput(text);
        const paragraphs = splitCommentParagraphs(finalText);
        pasteCommentIntoLinkedInEditor(inputBox, finalText);
        debugCommentTrace("paste-legacy", {
          finalLength: finalText.length,
          finalParagraphs: paragraphs.length,
          finalText
        });
      };

      Object.defineProperty(commentScraper, "__cePasteCommentPatched", {
        value: true,
        configurable: true
      });
      return true;
    } catch (_err) {
      return false;
    }
  }

  function patchLegacyCommentCreator(bundleRequire) {
    try {
      const commentCreator = bundleRequire?.("7DfH5")?.commentCreator;
      if (!commentCreator || commentCreator.__ceCreateCommentPatched) return true;

      const { dev } = bundleRequire("aCTJn");
      const { digerr } = bundleRequire("euMK0");
      const { helper } = bundleRequire("f03J7");
      const { profiler } = bundleRequire("4xGxE");
      const { toast } = bundleRequire("2A88X");
      const types = bundleRequire("92lQT");
      const { PreferencesModel } = bundleRequire("cNKw6");
      const sharedTypes = bundleRequire("lWcfI");
      const { UIModel } = bundleRequire("bPAMv");
      const { api } = bundleRequire("llJQG");
      const { versioning } = bundleRequire("d94Ng");
      const { commentScraper } = bundleRequire("3gkXb");

      if (!commentScraper.__cePasteCommentPatched) {
        commentScraper.pasteComment = function patchedPasteComment(inputBox, text) {
          const finalText = sparkToString(text, "");
          try {
            console.info("[CE comment trace]", "paste-comment", {
              finalLength: finalText.length,
              finalParagraphs: splitCommentParagraphs(finalText).length,
              finalText
            });
          } catch (_err) {}
          pasteCommentIntoLinkedInEditor(inputBox, finalText);
        };
        Object.defineProperty(commentScraper, "__cePasteCommentPatched", {
          value: true,
          configurable: true
        });
      }

      const isSubmitButtonClickable = (button) => {
        if (!button || typeof button.click !== "function") return false;
        if (button.disabled) return false;
        const ariaDisabled = sparkToString(button.getAttribute?.("aria-disabled"), "").trim().toLowerCase();
        if (ariaDisabled === "true") return false;
        return true;
      };

      const COMMENT_SUBMIT_SELECTORS = [
        "button[data-view-name=comment-post]",
        "button.comments-comment-box__submit-button--cr"
      ];

      const resolveCommentSubmitButton = (container, inputBox, initialButton, requireClickable) => {
        const candidates = [];
        const seen = new Set();
        const inputRect = inputBox?.getBoundingClientRect?.() || null;
        const scopes = [];

        if (inputBox?.closest) {
          const localRoot = inputBox.closest(".comments-comment-box, form, [data-view-name='comment-post'], [role='dialog']");
          if (localRoot) scopes.push(localRoot);
        }
        if (container) scopes.push(container);

        const pushCandidate = (node) => {
          if (!node || seen.has(node)) return;
          seen.add(node);
          if (!isVisibleElement(node)) return;
          if (requireClickable && !isSubmitButtonClickable(node)) return;
          const rect = node.getBoundingClientRect?.();
          if (!rect || !rect.width || !rect.height) return;
          let score = 0;
          if (inputRect) {
            const verticalGap = Math.abs(rect.top - inputRect.bottom);
            const horizontalGap = Math.abs(rect.left - inputRect.left);
            score = verticalGap + horizontalGap * 0.35;
            if (rect.top < inputRect.top - 24) score += 1200;
          } else {
            score = rect.top;
          }
          candidates.push({ node, score });
        };

        pushCandidate(initialButton);
        for (const scope of scopes) {
          for (const selector of COMMENT_SUBMIT_SELECTORS) {
            const nodes = Array.from(scope?.querySelectorAll?.(selector) || []);
            for (const node of nodes) pushCandidate(node);
          }
        }

        candidates.sort((left, right) => left.score - right.score);
        return candidates[0]?.node || null;
      };

      const triggerSubmitButtonClick = (button) => {
        if (!button) return false;
        const rect = button.getBoundingClientRect?.();
        const clientX = rect ? rect.left + rect.width / 2 : 0;
        const clientY = rect ? rect.top + rect.height / 2 : 0;
        try {
          button.scrollIntoView?.({ block: "nearest", inline: "nearest" });
        } catch (_err) {}
        try {
          button.focus?.({ preventScroll: true });
        } catch (_err) {}

        const mouseInit = {
          bubbles: true,
          cancelable: true,
          composed: true,
          view: window,
          button: 0,
          buttons: 1,
          clientX,
          clientY
        };

        try {
          if (typeof PointerEvent === "function") {
            button.dispatchEvent(new PointerEvent("pointerdown", mouseInit));
            button.dispatchEvent(new PointerEvent("pointerup", mouseInit));
          }
        } catch (_err) {}
        try {
          button.dispatchEvent(new MouseEvent("mouseover", mouseInit));
          button.dispatchEvent(new MouseEvent("mousedown", mouseInit));
          button.dispatchEvent(new MouseEvent("mouseup", mouseInit));
        } catch (_err) {}
        try {
          // Use a single terminal click. Dispatching both a synthetic click event and
          // button.click() can post successfully once, then trigger LinkedIn's retry toast.
          button.click();
          return true;
        } catch (_err) {
          return false;
        }
      };

      const waitForSubmitButton = async (container, inputBox, initialButton, timeoutMs, intervalMs, requireClickable) => {
        const startedAt = Date.now();
        const maxWaitMs = Math.max(0, sparkToNumber(timeoutMs, 0));
        const nextIntervalMs = Math.max(120, sparkToNumber(intervalMs, 250));
        let currentButton = resolveCommentSubmitButton(container, inputBox, initialButton, requireClickable);

        while (true) {
          if (currentButton && (!requireClickable || isSubmitButtonClickable(currentButton))) {
            return currentButton;
          }
          if (Date.now() - startedAt >= maxWaitMs) {
            return currentButton;
          }
          await helper.delay(nextIntervalMs);
          try {
            currentButton = resolveCommentSubmitButton(
              container,
              inputBox,
              await commentScraper.getSubmitButton(container),
              requireClickable
            );
          } catch (_err) {
            currentButton = currentButton || null;
          }
        }
      };

      commentCreator.createComment = async function patchedCreateComment(button) {
        const finish = async () => {
          this.inProgress = false;
          commentScraper.removeSpinner(button);
        };

        try {
          if (!(await UIModel.load()).enabled || await versioning.isNewerVersionExists()) return;
          const authSnapshot = await resolveGasGxAuthSnapshotForCommenting();
          if (!isGasGxExtensionEnabled(authSnapshot)) {
            toast.info(getGasGxCommentBlockedMessage(authSnapshot));
            return;
          }
          if (this.inProgress) {
            toast.info("Please wait for the previous comment to be generated.");
            return;
          }

          this.inProgress = true;
          commentScraper.displaySpinner(button);
          await Promise.all([
            loadAutoSendDelayRange(),
            loadRandomStrategySettings(),
            loadReplyPromptHint()
          ]);

          let preferences = await PreferencesModel.load();
          const canonicalPreferences = await loadLegacyPreferences();
          preferences = sanitizeLegacyPreferences({
            ...(sparkIsPlainObject(preferences) ? preferences : {}),
            ...(sparkIsPlainObject(canonicalPreferences) ? canonicalPreferences : {})
          });
          const isAutomation = button.hasAttribute(types.DataAttribute.IsAutomation);

          const profile = await profiler.loadProfile();
          profiler.updateProfileOccasionally();
          if (!profile?.seat) {
            toast.info("Failed to locate current LinkedIn user 😢<br>Maybe refresh will help?");
            await finish();
            return;
          }

          const container = commentScraper.getPostContainer(button);
          if (!container) {
            toast.info("Failed to read current post.");
            await finish();
            return;
          }

          const inputBox = await commentScraper.getCommentInputBoxElement(container);
          if (!inputBox) {
            toast.info("Couldn't find comment text box.");
            await finish();
            return;
          }

          const postAuthor = preferences.commentMentionPostAuthor
            ? commentScraper.getPostAuthor(container)
            : null;
          const postText = commentScraper.getPostText(container);
          if (!postText) {
            toast.info("Couldn't read post text.");
            await finish();
            return;
          }

          const postAuthorSeat = commentScraper.getPostAuthorSeat(container);
          const urn = commentScraper.getPostUrn(container);
          const generationProfile = resolveCommentGenerationProfile(preferences);
          let commentText = "";
          try {
            commentText = await api.generateComment(
              postAuthorSeat,
              urn,
              postAuthor,
              postText,
              {
                ...preferences,
                replyHint: replyPromptHint || ""
              }
            );
          } catch (_err) {
            commentText = buildCommentFallbackText({
              postAuthor,
              postText,
              preferences,
              replyHint: replyPromptHint || ""
            }, generationProfile);
            commentText = enforceCommentByPreference(commentText, {
              postAuthor,
              postText,
              preferences,
              replyHint: replyPromptHint || "",
              __ceEffectiveLength: generationProfile.length
            });
          }

          commentText = normalizeSparkOutput(commentText);
          commentText = enforceCommentByPreference(commentText, {
            postAuthor,
            postText,
            preferences,
            replyHint: replyPromptHint || "",
            __ceEffectiveLength: generationProfile.length
          });
          if (typeof commentText === "string") {
            commentText = commentText
              .replace(/^["'“”‘’]+/, "")
              .replace(/["'“”‘’]+$/u, "")
              .replace(/^\s*Great point\s*:\s*/i, "")
              .replace(/\s*\.\.\.\s*$/u, "")
              .replace(/(?:话题标(?:签)?|标签)\s*[:：]?\s*(?=[#＃])/g, "")
              .replace(/＃/g, "#")
              .replace(/#\s+/g, "#")
              .trim();
          }

          const finalParagraphCount = resolveCommentParagraphCount(preferences);
          commentText = ensureParagraphCount(commentText, finalParagraphCount, true);
          commentText = splitCommentParagraphs(commentText).map(ensureParagraphCompleteThought).filter(Boolean).join("\n\n");
          commentText = enforceEmojiByPreference(commentText, preferences);
          commentText = ensureEndingEmojiByHint(commentText, { replyHint: replyPromptHint || "" });

          if (typeof commentText !== "string" || !commentText.trim()) {
            throw new Error("API generateComment normalized to empty result");
          }

          if (await loadGasGxSignedOutFlag()) {
            toast.info(getGasGxCommentBlockedMessage(sanitizeGasGxAuthSnapshot({ status: "anonymous" })));
            await finish();
            return;
          }

          commentScraper.pasteComment(inputBox, commentText);
          const submitButton = await waitForSubmitButton(container, inputBox, null, 4_000, 250, false);
          if (!submitButton) {
            toast.info("Couldn't find comment send button.");
            await finish();
            return;
          }

          if (!submitButton.hasAttribute(types.DataAttribute.AlreadyRegistered)) {
            submitButton.setAttribute(types.DataAttribute.AlreadyRegistered, "true");
            submitButton.addEventListener("click", () => {
              api.engaged(postAuthorSeat, urn, types.EngagementType.Comment, isAutomation).catch((error) =>
                api.logFrontError("commentCreator.createComment - failed calling api.engaged", error)
              );
              dev.successToast("Engagement succeeded.");
              if (isAutomation) return;
              const link = urn ? `https://www.linkedin.com/feed/update/${urn}` : window.location.href;
              api.peep(types.EngagementType.Comment, link).catch((error) =>
                api.logFrontError("commentCreator.createComment - failed calling api.peep", error)
              );
            });
          }

          (() => {
            let delayMs = 2_000 + Math.floor(Math.random() * 5_000);
            let enabled = true;
            try {
              if (typeof window.__ceIsAutoSendEnabled === "function") {
                enabled = !!window.__ceIsAutoSendEnabled();
              }
            } catch (_err) {}
            if (!enabled) return;
            try {
              if (typeof window.__ceGetAutoSendDelayMs === "function") {
                const nextDelay = window.__ceGetAutoSendDelayMs();
                if (Number.isFinite(nextDelay) && nextDelay >= 0) {
                  delayMs = nextDelay;
                }
              }
            } catch (_err) {}
            setTimeout(() => {
              void (async () => {
                if (await loadGasGxSignedOutFlag()) {
                  debugCommentTrace("auto-send-blocked-signed-out", { delayMs });
                  return;
                }
                let readyButton = null;
                try {
                  readyButton = await waitForSubmitButton(container, inputBox, submitButton, 10_000, 400, true);
                } catch (_err) {
                  readyButton = submitButton;
                }

                const tracePayload = {
                  delayMs,
                  found: !!readyButton,
                  disabled: !!readyButton?.disabled,
                  ariaDisabled: sparkToString(readyButton?.getAttribute?.("aria-disabled"), "").trim()
                };

                try {
                  const latestAuthSnapshot = await resolveGasGxAuthSnapshotForCommenting();
                  if (!isGasGxExtensionEnabled(latestAuthSnapshot)) {
                    debugCommentTrace("auto-send-blocked-auth", tracePayload);
                    toast.info(getGasGxCommentBlockedMessage(latestAuthSnapshot));
                    return;
                  }
                } catch (_err) {}

                try {
                  if (isSubmitButtonClickable(readyButton)) {
                    debugCommentTrace("auto-send-click", tracePayload);
                    triggerSubmitButtonClick(readyButton);
                    await helper.delay(1_200);
                    const followUpButton = resolveCommentSubmitButton(container, inputBox, null, true);
                    if (!followUpButton) return;
                    const draftText = sparkToString(inputBox?.innerText || inputBox?.textContent, "").trim();
                    debugCommentTrace("auto-send-still-open", {
                      ...tracePayload,
                      draftLength: draftText.length,
                      draftPreview: draftText.slice(0, 120)
                    });
                    toast.info(
                      "Auto-send attempted the visible Send button, but LinkedIn kept the composer open. Tell me whether manual click on Send works right now."
                    );
                    return;
                  }
                } catch (_err) {}

                debugCommentTrace("auto-send-blocked", tracePayload);
                toast.info(
                  "Auto-send is enabled, but LinkedIn didn't expose a clickable Send button. Keep the draft open and tell me whether Send is missing or disabled."
                );
              })();
            }, delayMs);
          })();

          await finish();
          await helper.delay(1_000);
        } catch (error) {
          const message = digerr.getMessage(error);
          if (message === sharedTypes.ErrorText.ExtensionContextInvalidated) {
            window.location.reload();
            await finish();
            return;
          }
          if (
            message.startsWith(sharedTypes.ErrorText.YourFreeTrialHasExpired) ||
            message.startsWith(sharedTypes.ErrorText.YouHaveReachedTheMaximumUsageAllowed) ||
            message.startsWith(sharedTypes.ErrorText.YouHaveAlreadyEngaged) ||
            GATE_TEXT_PATTERN.test(message)
          ) {
            await finish();
            return;
          }
          if (message.includes(sharedTypes.ErrorText.YouCanReset)) {
            const nextUi = await UIModel.load();
            nextUi.isResetSeatsVisible = true;
            await UIModel.save(nextUi);
            await finish();
            return;
          }
          toast.error(message);
          api.logFrontError("commentCreator.createComment", error);
          await finish();
        }
      };

      Object.defineProperty(commentCreator, "__ceCreateCommentPatched", {
        value: true,
        configurable: true
      });
      return true;
    } catch (_err) {
      return false;
    }
  }

  function patchLegacyContentBundleBehavior() {
    if (legacyContentBundlePatched) return;
    const bundleRequire = findLegacyParcelRequire();
    if (!bundleRequire) return;

    const automationPatched = patchLegacyAutomationPreferences(bundleRequire);
    const commentScraperPatched = patchLegacyCommentScraper(bundleRequire);
    const commentCreatorPatched = patchLegacyCommentCreator(bundleRequire);
    legacyContentBundlePatched =
      automationPatched && commentScraperPatched && commentCreatorPatched;
  }

  function getStorageValue(area, key) {
    return new Promise((resolve) => {
      try {
        area.get(key, (obj) => resolve(obj || {}));
      } catch (_err) {
        resolve({});
      }
    });
  }

  function setStorageValue(area, value) {
    return new Promise(async (resolve) => {
      try {
        const payload = value && typeof value === "object" ? { ...value } : {};
        const keys = Object.keys(payload);
        if (!keys.length) {
          resolve();
          return;
        }

        const current = await rawStorageGet(area, keys);
        const changedPayload = {};
        for (const key of keys) {
          if (current?.[key] !== payload[key]) {
            changedPayload[key] = payload[key];
          }
        }

        if (!Object.keys(changedPayload).length) {
          resolve();
          return;
        }

        area.set(changedPayload, () => resolve());
      } catch (_err) {
        resolve();
      }
    });
  }

  async function persistPopupFirstRunFlags() {
    if (!isPopupContext()) return;
    const storage = chrome?.storage?.local;
    const version = sparkToString(chrome?.runtime?.getManifest?.()?.version, "").trim();
    if (!storage?.set || !version) return;
    const current = await rawStorageGet(storage, [version, "Pixel Fresh Install"]);
    if (current?.[version] === LEGACY_TRUE_RAW && current?.["Pixel Fresh Install"] === LEGACY_TRUE_RAW) return;
    await setStorageValue(storage, {
      [version]: LEGACY_TRUE_RAW,
      "Pixel Fresh Install": LEGACY_TRUE_RAW
    });
  }

  function getPopupLegacyVersion() {
    try {
      return sparkToString(chrome?.runtime?.getManifest?.()?.version, "").trim();
    } catch (_err) {
      return "";
    }
  }

  function parsePopupLegacyRequestBody(body) {
    if (body === undefined || body === null || body === "") return {};
    if (typeof body === "string") {
      try {
        const parsed = JSON.parse(body);
        return sparkIsPlainObject(parsed) ? parsed : {};
      } catch (_err) {
        return {};
      }
    }
    return sparkIsPlainObject(body) ? body : {};
  }

  function normalizePopupLegacyStats(raw) {
    const source = sparkIsPlainObject(raw) ? raw : {};
    return {
      total: Math.max(0, Math.floor(sparkToNumber(source.total, POPUP_EMPTY_AUTOMATION_STATS.total))),
      since: Math.max(0, Math.floor(sparkToNumber(source.since, POPUP_EMPTY_AUTOMATION_STATS.since))),
      today: Math.max(0, Math.floor(sparkToNumber(source.today, POPUP_EMPTY_AUTOMATION_STATS.today)))
    };
  }

  function normalizePopupLegacyCompletions(raw) {
    const source = sparkIsPlainObject(raw) ? raw : {};
    const generated = sparkIsPlainObject(source.generated) ? source.generated : {};
    const posted = sparkIsPlainObject(source.posted) ? source.posted : {};
    return {
      generated: {
        comments: Math.max(0, Math.floor(sparkToNumber(generated.comments, POPUP_EMPTY_COMPLETIONS.generated.comments))),
        replies: Math.max(0, Math.floor(sparkToNumber(generated.replies, POPUP_EMPTY_COMPLETIONS.generated.replies)))
      },
      posted: {
        comments: Math.max(0, Math.floor(sparkToNumber(posted.comments, POPUP_EMPTY_COMPLETIONS.posted.comments))),
        replies: Math.max(0, Math.floor(sparkToNumber(posted.replies, POPUP_EMPTY_COMPLETIONS.posted.replies)))
      }
    };
  }

  function normalizePopupLegacyAutomationList(raw, fallbackId = "") {
    const source = sparkIsPlainObject(raw) ? raw : {};
    const nextId = sparkToString(source._id, fallbackId || `gasgx-${Date.now()}`).trim() || `gasgx-${Date.now()}`;
    return {
      ...source,
      _id: nextId,
      enabledSeats: Array.isArray(source.enabledSeats) ? source.enabledSeats.filter(Boolean) : []
    };
  }

  async function readPopupLegacyCompatState() {
    const snapshot = getCurrentGasGxAuthSnapshot();
    const storage = chrome?.storage?.local;
    let account = buildLockedAccount(snapshot);
    let automation = {};

    if (storage) {
      try {
        const raw = await rawStorageGet(storage, [ACCOUNT_KEY, "automation", "completions"]);
        account = parseStoredAccount(raw?.[ACCOUNT_KEY]);
        automation = parseStoredObject(raw?.automation, {});
      } catch (_err) {}
    }

    const plan = sparkToString(account.plan, "").trim()
      || sparkToString(snapshot.plan, "").trim()
      || (isGasGxExtensionEnabled(snapshot) ? "GasGx" : "");
    const subscriberId = sparkToString(account.subscriberId, "").trim()
      || sparkToString(snapshot.userId, "").trim()
      || TEST_SUBSCRIBER_ID;

    return {
      snapshot,
      account,
      plan,
      subscriberId,
      isTrialEligible: sparkToBoolean(account.isTrialEligible, false),
      lists: Array.isArray(automation.lists) ? automation.lists.map((item, index) => normalizePopupLegacyAutomationList(item, `gasgx-${index + 1}`)) : [],
      stats: normalizePopupLegacyStats(automation.stats),
      completions: normalizePopupLegacyCompletions(automation.completions)
    };
  }

  async function writePopupLegacyAutomationPatch(patch) {
    const storage = chrome?.storage?.local;
    if (!storage) return;
    const raw = await rawStorageGet(storage, "automation");
    const current = parseStoredObject(raw?.automation, {});
    await setStorageValue(storage, {
      automation: stringifyLegacyStoredObject({
        ...current,
        ...patch
      })
    });
  }

  async function getPopupLegacyMockResponse(method, url, body) {
    let parsedUrl = null;
    try {
      parsedUrl = new URL(url, location.origin);
    } catch (_err) {
      return null;
    }

    if (parsedUrl.host !== POPUP_LEGACY_HOST) return null;

    const compat = await readPopupLegacyCompatState();
    const pathname = parsedUrl.pathname;
    const requestBody = parsePopupLegacyRequestBody(body);

    switch (pathname) {
      case "/api/commentron/get-priming":
        return {
          status: 200,
          body: {
            latestVersion: getPopupLegacyVersion(),
            plan: compat.plan,
            isTrialEligible: compat.isTrialEligible,
            automationStats: compat.stats
          }
        };
      case "/api/commentron/latest-version":
        return {
          status: 200,
          body: getPopupLegacyVersion()
        };
      case "/api/commentron/is-subscribed":
        return {
          status: 200,
          body: isGasGxExtensionEnabled(compat.snapshot)
        };
      case "/api/commentron/get-plan":
        return {
          status: 200,
          body: compat.plan
        };
      case "/api/commentron/get-automation-lists":
        return {
          status: 200,
          body: compat.lists
        };
      case "/api/commentron/get-automation-stats":
        return {
          status: 200,
          body: compat.stats
        };
      case "/api/commentron/get-completions":
        return {
          status: 200,
          body: compat.completions
        };
      case "/api/commentron/automation-lists": {
        const nextList = normalizePopupLegacyAutomationList({
          ...requestBody,
          subscriberId: sparkToString(requestBody.subscriberId, compat.subscriberId).trim() || compat.subscriberId
        });
        const nextLists = [...compat.lists, nextList];
        await writePopupLegacyAutomationPatch({ lists: nextLists });
        return {
          status: 200,
          body: nextList
        };
      }
      case "/api/commentron/enable-automation-list-seat": {
        const listId = sparkToString(requestBody._id, "").trim();
        const seat = sparkToString(requestBody.seat, "").trim();
        const nextLists = compat.lists.map((item) => {
          if (item._id !== listId) return item;
          const nextSeats = seat && !item.enabledSeats.includes(seat)
            ? [...item.enabledSeats, seat]
            : item.enabledSeats;
          return {
            ...item,
            enabledSeats: nextSeats
          };
        });
        await writePopupLegacyAutomationPatch({ lists: nextLists });
        return {
          status: 200,
          body: { success: true }
        };
      }
      case "/api/commentron/disable-automation-list-seat": {
        const listId = sparkToString(requestBody._id, "").trim();
        const seat = sparkToString(requestBody.seat, "").trim();
        const nextLists = compat.lists.map((item) => {
          if (item._id !== listId) return item;
          return {
            ...item,
            enabledSeats: item.enabledSeats.filter((entry) => entry !== seat)
          };
        });
        await writePopupLegacyAutomationPatch({ lists: nextLists });
        return {
          status: 200,
          body: { success: true }
        };
      }
      case "/api/commentron/delete-automation-list": {
        const listId = sparkToString(requestBody._id, "").trim();
        const nextLists = compat.lists.filter((item) => item._id !== listId);
        await writePopupLegacyAutomationPatch({ lists: nextLists });
        return {
          status: 200,
          body: { success: true }
        };
      }
      case "/api/commentron/reset-seats": {
        const nextLists = compat.lists.map((item) => ({
          ...item,
          enabledSeats: []
        }));
        await writePopupLegacyAutomationPatch({
          lists: nextLists,
          stats: {
            ...compat.stats,
            today: 0
          },
          resetTimestamp: Date.now()
        });
        return {
          status: 200,
          body: { success: true }
        };
      }
      case "/api/commentron/engagements":
      case "/api/commentron/peep":
      case "/api/logging/front-error":
      case "/api/logging/email-admin":
        return {
          status: 200,
          body: { success: true }
        };
      default:
        return null;
    }
  }

  function shouldMockPopupLegacyRequest(url) {
    if (!isPopupContext() || !url) return false;
    try {
      const parsed = new URL(url, location.origin);
      return parsed.host === POPUP_LEGACY_HOST;
    } catch (_err) {
      return false;
    }
  }

  function installPopupLegacyXhrMock() {
    if (!isPopupContext()) return;
    if (window[POPUP_MOCK_XHR_FLAG]) return;

    const NativeXHR = window.XMLHttpRequest;
    if (typeof NativeXHR !== "function") return;

    const listenerMap = new WeakMap();
    const ensureListenerBucket = (instance, type) => {
      let bucket = listenerMap.get(instance);
      if (!bucket) {
        bucket = new Map();
        listenerMap.set(instance, bucket);
      }
      let set = bucket.get(type);
      if (!set) {
        set = new Set();
        bucket.set(type, set);
      }
      return set;
    };

    const emitMockEvent = (instance, type) => {
      const handler = instance[`on${type}`];
      const event = typeof Event === "function" ? new Event(type) : { type };
      if (typeof handler === "function") {
        try {
          handler.call(instance, event);
        } catch (_err) {}
      }
      const bucket = listenerMap.get(instance);
      const listeners = bucket?.get(type);
      if (!listeners) return;
      for (const listener of Array.from(listeners)) {
        try {
          listener.call(instance, event);
        } catch (_err) {}
      }
    };

    class PopupLegacyMockXHR {
      constructor() {
        this._xhr = new NativeXHR();
        this._mock = null;
        this._mockResponseText = "";
        this._mockStatus = 0;
        this._mockReadyState = 0;
        this._responseType = "";
        this._timeout = 0;
        this._withCredentials = false;
        this._aborted = false;
        this.onreadystatechange = null;
        this.onload = null;
        this.onerror = null;
        this.onabort = null;
        this.ontimeout = null;
        this.onloadend = null;
        this.upload = this._xhr.upload;

        const forward = (type) => {
          this._xhr.addEventListener(type, (event) => {
            const handler = this[`on${type}`];
            if (typeof handler === "function") {
              try {
                handler.call(this, event);
              } catch (_err) {}
            }
            const bucket = listenerMap.get(this);
            const listeners = bucket?.get(type);
            if (!listeners) return;
            for (const listener of Array.from(listeners)) {
              try {
                listener.call(this, event);
              } catch (_err) {}
            }
          });
        };

        [
          "readystatechange",
          "load",
          "error",
          "abort",
          "timeout",
          "loadend",
          "loadstart",
          "progress"
        ].forEach(forward);
      }

      open(method, url, async = true, username, password) {
        this._aborted = false;
        if (shouldMockPopupLegacyRequest(url)) {
          this._mock = {
            method: sparkToString(method, "GET").toUpperCase(),
            url: sparkToString(url, ""),
            async,
            username,
            password,
            headers: {}
          };
          this._mockReadyState = 1;
          emitMockEvent(this, "readystatechange");
          return;
        }

        this._mock = null;
        return this._xhr.open(method, url, async, username, password);
      }

      setRequestHeader(name, value) {
        if (this._mock) {
          this._mock.headers[sparkToString(name, "")] = sparkToString(value, "");
          return;
        }
        return this._xhr.setRequestHeader(name, value);
      }

      addEventListener(type, listener, options) {
        if (this._mock) {
          ensureListenerBucket(this, type).add(listener);
          return;
        }
        return this._xhr.addEventListener(type, listener, options);
      }

      removeEventListener(type, listener, options) {
        if (this._mock) {
          ensureListenerBucket(this, type).delete(listener);
          return;
        }
        return this._xhr.removeEventListener(type, listener, options);
      }

      send(body = null) {
        if (!this._mock) {
          return this._xhr.send(body);
        }

        Promise.resolve()
          .then(() => getPopupLegacyMockResponse(this._mock?.method, this._mock?.url, body))
          .then((mock) => {
            if (!this._mock) return;
            if (!mock) {
              const current = this._mock;
              this._mock = null;
              this._xhr.open(current.method, current.url, current.async, current.username, current.password);
              for (const [name, value] of Object.entries(current.headers || {})) {
                this._xhr.setRequestHeader(name, value);
              }
              this._xhr.responseType = this._responseType;
              this._xhr.withCredentials = this._withCredentials;
              this._xhr.timeout = this._timeout;
              this._xhr.send(body);
              return;
            }

            this._mockStatus = Math.max(100, Math.floor(sparkToNumber(mock.status, 200)));
            this._mockResponseText = JSON.stringify(mock.body ?? {});
            this._mockReadyState = 2;
            emitMockEvent(this, "readystatechange");

            setTimeout(() => {
              if (!this._mock || this._aborted) return;
              this._mockReadyState = 4;
              emitMockEvent(this, "readystatechange");
              emitMockEvent(this, "load");
              emitMockEvent(this, "loadend");
            }, 0);
          })
          .catch(() => {
            if (!this._mock || this._aborted) return;
            this._mockStatus = 500;
            this._mockResponseText = JSON.stringify({ message: "Popup compatibility bridge failed." });
            this._mockReadyState = 4;
            emitMockEvent(this, "readystatechange");
            emitMockEvent(this, "error");
            emitMockEvent(this, "loadend");
          });
      }

      abort() {
        if (this._mock) {
          this._aborted = true;
          this._mockReadyState = 0;
          emitMockEvent(this, "abort");
          emitMockEvent(this, "loadend");
          return;
        }
        return this._xhr.abort();
      }

      getAllResponseHeaders() {
        if (this._mock) {
          return "content-type: application/json\r\n";
        }
        return typeof this._xhr.getAllResponseHeaders === "function"
          ? this._xhr.getAllResponseHeaders()
          : "";
      }

      getResponseHeader(name) {
        if (this._mock) {
          return /^content-type$/i.test(sparkToString(name, "")) ? "application/json" : null;
        }
        return typeof this._xhr.getResponseHeader === "function"
          ? this._xhr.getResponseHeader(name)
          : null;
      }

      overrideMimeType(type) {
        if (this._mock) return;
        return this._xhr.overrideMimeType?.(type);
      }

      get readyState() {
        return this._mock ? this._mockReadyState : this._xhr.readyState;
      }

      get status() {
        return this._mock ? this._mockStatus : this._xhr.status;
      }

      get statusText() {
        return this._mock ? "OK" : this._xhr.statusText;
      }

      get responseText() {
        return this._mock ? this._mockResponseText : this._xhr.responseText;
      }

      get response() {
        if (!this._mock) return this._xhr.response;
        if (this._responseType === "json") {
          try {
            return JSON.parse(this._mockResponseText);
          } catch (_err) {
            return null;
          }
        }
        return this._mockResponseText;
      }

      get responseURL() {
        return this._mock ? this._mock.url : this._xhr.responseURL;
      }

      get timeout() {
        return this._mock ? this._timeout : this._xhr.timeout;
      }

      set timeout(value) {
        this._timeout = sparkToNumber(value, 0);
        this._xhr.timeout = value;
      }

      get withCredentials() {
        return this._mock ? this._withCredentials : this._xhr.withCredentials;
      }

      set withCredentials(value) {
        this._withCredentials = !!value;
        this._xhr.withCredentials = value;
      }

      get responseType() {
        return this._mock ? this._responseType : this._xhr.responseType;
      }

      set responseType(value) {
        this._responseType = sparkToString(value, "");
        this._xhr.responseType = value;
      }
    }

    PopupLegacyMockXHR.UNSENT = NativeXHR.UNSENT ?? 0;
    PopupLegacyMockXHR.OPENED = NativeXHR.OPENED ?? 1;
    PopupLegacyMockXHR.HEADERS_RECEIVED = NativeXHR.HEADERS_RECEIVED ?? 2;
    PopupLegacyMockXHR.LOADING = NativeXHR.LOADING ?? 3;
    PopupLegacyMockXHR.DONE = NativeXHR.DONE ?? 4;

    window.XMLHttpRequest = PopupLegacyMockXHR;
    window[POPUP_MOCK_XHR_FLAG] = true;
  }

  async function syncGasGxDerivedStorage() {
    if (!STORAGE_AREAS.length) return;
    if (gasgxDerivedStorageSyncPromise) {
      return await gasgxDerivedStorageSyncPromise;
    }

    const now = Date.now();
    if (isPopupContext() && now - gasgxDerivedStorageLastRunAt < 5000) {
      return;
    }

    gasgxDerivedStorageSyncPromise = (async () => {
    const snapshot = await ensureGasGxAuthSnapshotLoaded();
    const pendingWrites = [];

    for (const area of STORAGE_AREAS) {
      const accountObj = await getStorageValue(area, ACCOUNT_KEY);
      const uiObj = await getStorageValue(area, UI_KEY);
      const currentAccountRaw = sparkToString(accountObj[ACCOUNT_KEY], "");
      const currentUiRaw = sparkToString(uiObj[UI_KEY], "");
      const nextAccount = isGasGxExtensionEnabled(snapshot)
        ? buildEnabledAccount(snapshot, parseStoredAccount(accountObj[ACCOUNT_KEY]))
        : buildLockedAccount(snapshot);
      const nextUi = deriveUiState(parseStoredObject(uiObj[UI_KEY], DEFAULT_UI_STATE), snapshot);
      const nextAccountRaw = stringifyLegacyStoredObject(nextAccount);
      const nextUiRaw = stringifyLegacyStoredObject(nextUi);

      if (currentAccountRaw === nextAccountRaw && currentUiRaw === nextUiRaw) {
        continue;
      }

      pendingWrites.push({
        area,
        areaName: sparkToString(area?.__ceAreaName, ""),
        account: nextAccountRaw,
        ui: nextUiRaw
      });
    }

    const nextSignature = stringifyStoredObject({
      status: sparkToString(snapshot?.status, ""),
      userId: sparkToString(snapshot?.userId, ""),
      email: sparkToString(snapshot?.email, ""),
      plan: sparkToString(snapshot?.plan, ""),
      profileEnabled: !!snapshot?.profileEnabled,
      writes: pendingWrites.map((item) => ({
        areaName: item.areaName,
        account: item.account,
        ui: item.ui
      }))
    });

    if (nextSignature === gasgxDerivedStorageLastSignature) {
      gasgxDerivedStorageLastRunAt = Date.now();
      return;
    }

    for (const item of pendingWrites) {
      await setStorageValue(item.area, {
        [ACCOUNT_KEY]: item.account,
        [UI_KEY]: item.ui
      });
    }

    gasgxDerivedStorageLastRunAt = Date.now();
    gasgxDerivedStorageLastSignature = nextSignature;
    })();

    try {
      return await gasgxDerivedStorageSyncPromise;
    } finally {
      gasgxDerivedStorageSyncPromise = null;
    }
  }

  function applyTheme(mode) {
    currentMode = normalizeTheme(mode);
    document.documentElement.setAttribute("data-theme", currentMode);
    localStorage.setItem(MODE_KEY, currentMode);
    updateControls();
  }

  function applyLanguage(lang) {
    currentLang = normalizeLang(lang);
    document.documentElement.setAttribute("data-lang", currentLang);
    localStorage.setItem(LANG_KEY, currentLang);
    queueApplyRuntime();
    updateControls();
  }

  function translateOptionLabel(text, lang) {
    const map = lang === "zh-CN" ? OPTION_EN_TO_ZH : OPTION_ZH_TO_EN;
    if (map.has(text)) return map.get(text);

    for (const [from, to] of map.entries()) {
      if (text.endsWith(` ${from}`)) {
        return `${text.slice(0, -from.length)}${to}`;
      }
      if (text.endsWith(from) && text.length > from.length) {
        const prefix = text.slice(0, -from.length);
        if (/^[\s\p{P}\p{S}]+$/u.test(prefix)) {
          return `${prefix}${to}`;
        }
      }
    }

    return text;
  }

  function translateCore(text, lang) {
    if (!text) return text;

    const fixedMap = lang === "zh-CN" ? FIXED_EN_TO_ZH : FIXED_ZH_TO_EN;
    if (fixedMap.has(text)) return fixedMap.get(text);

    const optionTranslated = translateOptionLabel(text, lang);
    if (optionTranslated !== text) return optionTranslated;

    const fallbackMap = lang === "zh-CN" ? enToZh : zhToEn;
    if (fallbackMap.has(text)) return fallbackMap.get(text);

    return text;
  }

  function translateTextValue(raw, lang) {

    if (!raw) return raw;
    const match = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match) return raw;
    const leading = match[1];
    const core = match[2];
    const trailing = match[3];
    const translated = translateCore(core, lang);
    if (translated === core) return raw;
    return `${leading}${translated}${trailing}`;
  }

  function applyLanguageToDom() {
    if (!document.body) return;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    for (const node of textNodes) {
      const next = translateTextValue(node.nodeValue, currentLang);
      if (next !== node.nodeValue) node.nodeValue = next;
    }

    const attrs = ["title", "aria-label", "placeholder"];
    const elements = document.querySelectorAll("[title], [aria-label], [placeholder]");
    for (const el of elements) {
      for (const attr of attrs) {
        const value = el.getAttribute(attr);
        if (!value) continue;
        const next = translateCore(value, currentLang);
        if (next !== value) el.setAttribute(attr, next);
      }
    }
  }

  function unlockDisabledControls() {
    if (!document.body) return;

    const disabledEls = document.querySelectorAll("button[disabled], input[disabled], select[disabled], textarea[disabled]");
    for (const el of disabledEls) {
      el.removeAttribute("disabled");
      if ("disabled" in el) {
        try {
          el.disabled = false;
        } catch (_err) {
          // Ignore readonly descriptors.
        }
      }
    }

    const ariaDisabled = document.querySelectorAll("[aria-disabled='true']");
    for (const el of ariaDisabled) {
      el.setAttribute("aria-disabled", "false");
      el.style.pointerEvents = "auto";
      el.style.opacity = "1";
    }

    const muiDisabled = document.querySelectorAll(".Mui-disabled");
    for (const el of muiDisabled) {
      el.classList.remove("Mui-disabled");
      el.style.pointerEvents = "auto";
      el.style.opacity = "1";
    }
  }

  function enforceBrandTitle() {
    if (!document.body) return;

    document.title = BRAND_TITLE;

    const header = document.querySelector(".header");
    if (!header) return;

    header.style.position = "relative";

    const titleOverlayId = "ce-brand-title-overlay";
    let overlay = document.getElementById(titleOverlayId);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = titleOverlayId;
      overlay.style.position = "absolute";
      overlay.style.left = "50%";
      overlay.style.top = "50%";
      overlay.style.transform = "translate(-50%, -50%)";
      overlay.style.pointerEvents = "none";
      overlay.style.whiteSpace = "nowrap";
      overlay.style.maxWidth = "calc(100% - 116px)";
      overlay.style.overflow = "hidden";
      overlay.style.textOverflow = "ellipsis";
      overlay.style.textAlign = "center";
      overlay.style.fontWeight = "700";
      overlay.style.fontSize = "16px";
      overlay.style.lineHeight = "1";
      overlay.style.textShadow = "0 4px 4px rgba(0,0,0,.25)";
      overlay.style.color = "inherit";
      header.appendChild(overlay);
    }
    overlay.textContent = BRAND_TITLE;

    const walker = document.createTreeWalker(
      header,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const value = (node.nodeValue || "").trim();
          if (!value) return NodeFilter.FILTER_REJECT;
          return /CommenTRON|CommenTron|Commen|TRON/i.test(value)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      node.nodeValue = (node.nodeValue || "").replace(/CommenTRON|CommenTron|Commen|TRON/gi, "");
    }

    const elementCandidates = header.querySelectorAll("span, b, strong, div");
    for (const el of elementCandidates) {
      const txt = (el.textContent || "").trim();
      if (!txt) continue;
      if (/^(CommenTRON|CommenTron|Commen|TRON)$/i.test(txt)) {
        el.style.display = "none";
      }
    }
  }

  function hideBottomRightLogo() {
    if (!document.body) return;

    const logoImgs = document.querySelectorAll("img[src*='/assets/logo.png'], img.logo");
    for (const img of logoImgs) {
      const rect = img.getBoundingClientRect();
      const inBottomRight =
        rect.bottom >= window.innerHeight - 140 &&
        rect.right >= window.innerWidth - 140 &&
        rect.width > 0 &&
        rect.height > 0;
      const inHeader = rect.top <= 130;
      if (!inBottomRight || inHeader) continue;

      const container = img.closest("a, div, span");
      if (container) container.style.display = "none";
      img.style.display = "none";
    }
  }

  function replaceLicensedToLabel() {
    if (!document.body) return;
    const candidates = document.querySelectorAll("#__plasmo .MuiGrid-item, #__plasmo .info-flex, #__plasmo div, #__plasmo span, #__plasmo p");
    for (const node of candidates) {
      if (isInsideGasGxPopupUi(node)) continue;
      const text = normalizePopupUiText(node.textContent);
      if (!text || !/^licensed to[:\s]/i.test(text)) continue;

      let replaced = false;
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType !== Node.TEXT_NODE) continue;
        const raw = child.nodeValue || "";
        if (!/licensed to/i.test(raw)) continue;
        child.nodeValue = raw.replace(/licensed to\s*:?\s*/i, "Linkedin当前账号 ");
        replaced = true;
      }

      if (!replaced) {
        continue;
      }

      node.style.cursor = "default";
      if (!node.dataset.ceLicensedLabelLocked) {
        node.dataset.ceLicensedLabelLocked = "true";
        node.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation?.();
        }, true);
      }
    }
  }

  function hideBottomLeftFloatingToggle() {
    if (!document.body) return;
    const candidates = document.querySelectorAll("#__plasmo input[type='checkbox'], #__plasmo [role='switch'], #__plasmo .MuiSwitch-root, #__plasmo .MuiCheckbox-root");
    for (const node of candidates) {
      if (isInsideGasGxPopupUi(node)) continue;
      const host = node.closest(".MuiSwitch-root, .MuiCheckbox-root, label, button, span, div");
      const target = host || node;
      const rect = target.getBoundingClientRect?.();
      if (!rect || !rect.width || !rect.height) continue;
      const nearBottom = rect.bottom >= window.innerHeight - 90;
      const nearLeft = rect.left <= 120;
      const isolated = !normalizePopupUiText(target.parentElement?.textContent || "").replace(normalizePopupUiText(target.textContent || ""), "").trim();
      if (!nearBottom || !nearLeft || !isolated) continue;
      target.style.display = "none";
      target.setAttribute("data-ce-hidden", "floating-bottom-toggle");
    }
  }

  function isGateText(text) {
    return !!(text && GATE_TEXT_PATTERN.test(text));
  }

  function isGateToastPayload(payload) {
    if (!payload) return false;
    if (typeof payload === "string") return isGateText(payload);
    if (typeof payload !== "object") return false;

    const candidates = [
      payload.message,
      payload.msg,
      payload.title,
      payload.text,
      payload.body,
      payload.description,
      payload?.response?.data?.message,
      payload?.response?.data?.error?.message
    ];

    return candidates.some((item) => typeof item === "string" && isGateText(item));
  }

  function suppressGateToastApis() {
    if (window.__ceGateToastPatched) return;

    const patchMethods = (obj) => {
      if (!obj || typeof obj !== "object") return;

      for (const method of ["show", "info", "success", "warning", "error"]) {
        const original = obj[method];
        if (typeof original !== "function" || original.__ceGateWrapped) continue;

        const wrapped = function patchedGateToast(...args) {
          if (args.some(isGateToastPayload)) return;
          return original.apply(this, args);
        };
        wrapped.__ceGateWrapped = true;
        obj[method] = wrapped;
      }
    };

    try {
      patchMethods(window.iziToast);
    } catch (_err) {
      // Ignore missing iziToast.
    }

    try {
      patchMethods(window.toast);
    } catch (_err) {
      // Ignore missing toast adapter.
    }

    try {
      Object.defineProperty(window, "__ceGateToastPatched", {
        value: true,
        configurable: true
      });
    } catch (_err) {
      window.__ceGateToastPatched = true;
    }
  }

  function hideGateToasts() {
    if (!document.body) return;

    const removeNodeIfGate = (node) => {
      if (!node) return;
      const text = (node.textContent || "").trim();
      if (!isGateText(text)) return;

      const host = node.closest(".iziToast, [id^='iziToast'], .Toastify__toast, [role='alert'], [aria-live='polite'], [aria-live='assertive']");
      const target = host || node;

      const closeBtn = target.querySelector?.(".iziToast-close, .Toastify__close-button, button[aria-label*='Close'], button[aria-label*='close'], button[aria-label*='??']");
      try {
        if (closeBtn && typeof closeBtn.click === "function") closeBtn.click();
      } catch (_err) {
        // Ignore close button click failures.
      }

      if (typeof target.remove === "function") target.remove();
      else target.style.display = "none";
    };

    const candidates = Array.from(document.querySelectorAll(".iziToast, [id^='iziToast'], .Toastify__toast, [role='alert'], [aria-live='polite'], [aria-live='assertive']"));
    for (const el of candidates) removeNodeIfGate(el);
  }

  function setSliderValueByClientX(root, clientX) {
    if (!root) return;
    const input = root.querySelector("input[type='range']");
    if (!input) return;

    const rect = root.getBoundingClientRect();
    if (!rect || !rect.width) return;

    const min = Number(input.min || "0");
    const max = Number(input.max || "100");
    const step = Number(input.step || "1") || 1;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + (max - min) * ratio;
    const snapped = Math.round(raw / step) * step;
    const next = String(Math.max(min, Math.min(max, snapped)));

    try {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      if (valueSetter) valueSetter.call(input, next);
      else input.value = next;
    } catch (_err) {
      input.value = next;
    }

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function ensureSliderInteractive(root) {
    if (!root || root.__ceSliderPatched) return;
    root.__ceSliderPatched = true;

    root.style.pointerEvents = "auto";
    root.style.touchAction = "none";

    root.addEventListener("click", (ev) => {
      if (!Number.isFinite(ev.clientX)) return;
      setSliderValueByClientX(root, ev.clientX);
    });

    root.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      setSliderValueByClientX(root, ev.clientX);
      const onMove = (moveEv) => setSliderValueByClientX(root, moveEv.clientX);
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
    });
  }

  function ensurePopupSlidersInteractive() {
    const sliders = document.querySelectorAll(".MuiSlider-root");
    for (const slider of sliders) ensureSliderInteractive(slider);
  }

  function applyRuntimeLayers() {
    applyLanguageToDom();
    unlockDisabledControls();
    enforceBrandTitle();
    replaceLicensedToLabel();
    const controlledPreferencesRoot = document.getElementById("ce-controlled-preferences-root");
    if (controlledPreferencesRoot) controlledPreferencesRoot.remove();
    ensureLegacyPreferencesMonitor();
    if (isPreferencesTabActive()) {
      void applyLegacyPreferencesToDom();
    } else if (document.body) {
      delete document.body.dataset.ceLegacyPrefsApplied;
      legacyPreferencesLastSnapshot = "";
    }
    mountPreferencesAutoSendControls();
    ensurePopupSlidersInteractive();
    mountReplyPromptHintControl();
    renderGasGxPopupAccountPanel();
    hideBottomRightLogo();
    hideBottomLeftFloatingToggle();
    suppressGateToastApis();
    hideGateToasts();
  }

  function queueApplyRuntime() {
    if (applyQueued) return;
    applyQueued = true;
    window.requestAnimationFrame(() => {
      applyQueued = false;
      applyRuntimeLayers();
    });
  }

  function updateControls() {
    const modeBtn = document.getElementById("ce-theme-toggle");
    const langBtn = document.getElementById("ce-lang-toggle");
    const autoToggle = document.getElementById("ce-pref-auto-send-toggle");
    const autoToggleText = document.getElementById("ce-pref-auto-send-text");
    const randomToneToggle = document.getElementById("ce-pref-random-tone-toggle");
    const randomToneText = document.getElementById("ce-pref-random-tone-text");
    const randomLengthToggle = document.getElementById("ce-pref-random-length-toggle");
    const randomLengthText = document.getElementById("ce-pref-random-length-text");
    const delayCaption = document.getElementById("ce-pref-delay-caption");
    const delayLabel = document.getElementById("ce-pref-delay-label");
    const minInput = document.getElementById("ce-pref-delay-min");
    const maxInput = document.getElementById("ce-pref-delay-max");
    const replyHintLabel = document.getElementById("ce-reply-prompt-hint-label");
    const replyHintInput = document.getElementById("ce-reply-prompt-hint-input");
    if (!modeBtn || !langBtn) return;
    modeBtn.classList.add("toggle-group-btn");
    langBtn.classList.add("toggle-group-btn");
    modeBtn.classList.toggle("active", currentMode === "dark");
    langBtn.classList.toggle("active", currentLang === "zh-CN");
    modeBtn.setAttribute("data-state", currentMode);
    langBtn.setAttribute("data-state", currentLang);

    modeBtn.textContent = currentMode === "dark" ? "L" : "D";
    modeBtn.title = currentLang === "zh-CN"
      ? (currentMode === "dark"
        ? "\u5207\u6362\u5230\u6d45\u8272\u6a21\u5f0f"
        : "\u5207\u6362\u5230\u6df1\u8272\u6a21\u5f0f")
      : (currentMode === "dark" ? "Switch to light mode" : "Switch to dark mode");

    langBtn.textContent = currentLang === "zh-CN" ? "EN" : "ZH";
    langBtn.title = currentLang === "zh-CN" ? "\u5207\u6362\u5230\u82f1\u6587" : "Switch to Chinese";

    if (autoToggle) {
      autoToggle.checked = !!autoSendEnabled;
      autoToggle.title = currentLang === "zh-CN"
        ? "\u751f\u6210\u8bc4\u8bba\u540e\u81ea\u52a8\u70b9\u51fb\u53d1\u9001"
        : "Auto click comment send after generation";
    }

    if (autoToggleText) {
      autoToggleText.textContent = currentLang === "zh-CN"
        ? "\u81ea\u52a8\u70b9\u51fb\u8bc4\u8bba\u53d1\u9001"
        : "Auto click comment send";
    }

    if (randomToneToggle) {
      randomToneToggle.checked = !!randomToneEnabled;
      randomToneToggle.title = currentLang === "zh-CN"
        ? "\u6bcf\u6b21\u751f\u6210\u8bc4\u8bba\u65f6\uff0c\u968f\u673a\u4f7f\u7528\u4e00\u79cd\u8bed\u6c14"
        : "Randomly choose one tone for each generated comment";
    }

    if (randomToneText) {
      randomToneText.textContent = currentLang === "zh-CN"
        ? "\u968f\u673a\u8bed\u6c14"
        : "Random tone";
    }

    if (randomLengthToggle) {
      randomLengthToggle.checked = !!randomLengthEnabled;
      randomLengthToggle.title = currentLang === "zh-CN"
        ? "\u6bcf\u6b21\u751f\u6210\u8bc4\u8bba\u65f6\uff0c\u968f\u673a\u4f7f\u7528\u4e00\u4e2a\u957f\u5ea6\u6863\u4f4d"
        : "Randomly choose one length level for each generated comment";
    }

    if (randomLengthText) {
      randomLengthText.textContent = currentLang === "zh-CN"
        ? "\u968f\u673a\u957f\u5ea6"
        : "Random length";
    }

    if (delayCaption) {
      delayCaption.textContent = currentLang === "zh-CN"
        ? "\u5ef6\u65f6\u53d1\u5e03"
        : "Delayed publish";
    }

    if (delayLabel) {
      delayLabel.textContent = `${autoSendDelayMinSec}~${autoSendDelayMaxSec}s`;
      delayLabel.title = currentLang === "zh-CN"
        ? "\u81ea\u52a8\u53d1\u9001\u968f\u673a\u5ef6\u65f6"
        : "Auto-send random delay";
    }

    if (minInput) {
      minInput.value = String(autoSendDelayMinSec);
      minInput.disabled = !autoSendEnabled;
      minInput.title = currentLang === "zh-CN" ? "\u6700\u5c0f\u79d2\u6570" : "Min seconds";
    }

    if (maxInput) {
      maxInput.value = String(autoSendDelayMaxSec);
      maxInput.disabled = !autoSendEnabled;
      maxInput.title = currentLang === "zh-CN" ? "\u6700\u5927\u79d2\u6570" : "Max seconds";
    }

    if (replyHintLabel) {
      replyHintLabel.textContent = currentLang === "zh-CN"
        ? "\u56de\u590d\u63d0\u793a\u8bed:"
        : "Reply Prompt Hint:";
    }

    if (replyHintInput) {
      const normalized = normalizeReplyPromptHint(replyPromptHint);
      if (replyHintInput.value !== normalized) replyHintInput.value = normalized;
      replyHintInput.placeholder = currentLang === "zh-CN"
        ? "\u4f8b\u5982\uff1a\u5148\u8ba4\u53ef\u89c2\u70b9\uff0c\u518d\u8865\u5145\u4e00\u4e2a\u5177\u4f53\u89c1\u89e3\uff08\u6700\u591a240\u5b57\uff09"
        : "Example: acknowledge first, then add one concrete insight (max 240 chars)";
      replyHintInput.title = currentLang === "zh-CN"
        ? "\u751f\u6210\u56de\u590d\u65f6\u4f1a\u9644\u52a0\u8be5\u63d0\u793a\u8bed"
        : "This hint will be appended when generating replies";
    }
  }

  function mountControls() {

    if (!document.body || document.getElementById("ce-runtime-controls")) return;

    const controls = document.createElement("div");
    controls.id = "ce-runtime-controls";
    controls.className = "toggle-group-container";

    const modeBtn = document.createElement("button");
    modeBtn.id = "ce-theme-toggle";
    modeBtn.type = "button";
    modeBtn.addEventListener("click", () => {
      const next = currentMode === "dark" ? "light" : "dark";
      applyTheme(next);
      queueApplyRuntime();
    });

    const langBtn = document.createElement("button");
    langBtn.id = "ce-lang-toggle";
    langBtn.type = "button";
    langBtn.addEventListener("click", () => {
      const next = currentLang === "zh-CN" ? "en" : "zh-CN";
      applyLanguage(next);
    });

    controls.appendChild(modeBtn);
    controls.appendChild(langBtn);

    const header = document.querySelector(".header");
    if (header) {
      header.style.position = "relative";
      header.appendChild(controls);
    } else {
      document.body.appendChild(controls);
    }
    updateControls();
  }

  function findPreferenceAnchorRow() {
    const labels = Array.from(document.querySelectorAll("label, span, p, div"));
    for (const el of labels) {
      const text = (el.textContent || "").trim();
      if (!text) continue;
      const normalized = text.toLowerCase();
      if (
        normalized.includes("comment/reply in english") ||
        normalized.includes("use emojis") ||
        text.includes("评论/回复使用英文") ||
        text.includes("使用表情")
      ) {
        return el.closest(".info-flex") || el.closest("div");
      }
    }
    const fallback = document.querySelector(".tab-content,.tabs-content,.accordion,.content,main,body");
    return fallback && fallback !== document.body ? fallback : null;
  }

  function getLegacyPreferencesHost() {
    const anchor = findPreferenceAnchorRow();
    if (!anchor) {
      return document.querySelector("#__plasmo .tab-content, #__plasmo .tabs-content, #__plasmo .accordion, #__plasmo .content, #__plasmo main, #__plasmo");
    }
    return anchor.parentElement || anchor;
  }

  function isPreferencesTabActive() {
    const buttons = Array.from(document.querySelectorAll("#__plasmo button, #__plasmo [role='tab'], #__plasmo .MuiButtonBase-root"));
    for (const button of buttons) {
      const text = normalizePopupUiText(button.textContent);
      if (!text) continue;
      if (!/^(preferences|偏好)$|(^偏好 )|( preferences$)/i.test(text) && !/^偏好$/i.test(text)) continue;
      const isSelected = button.getAttribute("aria-selected") === "true";
      const className = sparkToString(button.className, "");
      const activeByClass = /active|selected|Mui-selected|MuiTab-textColorPrimary/i.test(className);
      return isSelected || activeByClass;
    }
    return false;
  }

  function getLegacyPreferenceToneOptions() {
    const select = findLegacyPreferenceSelect([/^语气$/, /^tone$/i]) || getVisibleLegacySelects()[0];
    const options = Array.from(select?.options || []).map((option) => ({
      value: sparkToString(option.value, "").trim(),
      label: sparkToString(option.textContent, "").trim() || sparkToString(option.value, "").trim()
    })).filter((option) => option.value);
    if (options.length) return options;
    return [
      { value: "Polite", label: "Polite" },
      { value: "Casual", label: "Casual" },
      { value: "Friendly", label: "Friendly" },
      { value: "Professional", label: "Professional" }
    ];
  }

  function getLegacyPreferenceVoiceGenderOptions() {
    const select = findLegacyPreferenceSelect([/语气性别/, /voice gender/i]) || getVisibleLegacySelects()[1];
    const options = Array.from(select?.options || []).map((option) => ({
      value: sparkToString(option.value, "").trim(),
      label: sparkToString(option.textContent, "").trim() || sparkToString(option.value, "").trim()
    })).filter((option) => option.value);
    if (options.length) return options;
    return [
      { value: "NotSpecified", label: "Not Specified" },
      { value: "Male", label: "Male" },
      { value: "Female", label: "Female" }
    ];
  }

  function hideLegacyPreferencesSurface() {
    const rows = Array.from(document.querySelectorAll("#__plasmo .info-flex, #__plasmo label, #__plasmo .MuiFormControl-root, #__plasmo .MuiSlider-root"))
      .filter((element) => !element.closest("#ce-controlled-preferences-root, #ce-preferences-auto-send-root, #ce-reply-prompt-hint-root"));
    const matchers = [
      /comment\/reply in english/i,
      /use emojis/i,
      /open-ended/i,
      /^tone$/i,
      /voice gender/i,
      /^length[:：]?/i,
      /评论\/回复使用英文/,
      /使用表情/,
      /开放式结尾/,
      /语气性别/,
      /^语气$/,
      /^长度[:：]?/
    ];
    for (const row of rows) {
      const text = normalizePopupUiText(row.textContent);
      if (!text || !matchers.some((matcher) => matcher.test(text))) continue;
      row.style.display = "none";
      row.style.margin = "0";
      row.style.padding = "0";
      row.style.minHeight = "0";
      row.dataset.ceLegacyPreferenceHidden = "true";
    }
  }

  function buildControlledPreferenceField(documentRef, preferences, toneOptions, voiceOptions) {
    const root = documentRef.createElement("div");
    root.id = "ce-controlled-preferences-root";
    root.style.cssText = "margin:8px 0 12px;padding:12px;border:1px solid rgba(27,183,110,.18);border-radius:12px;background:rgba(10,21,18,.04);display:grid;gap:10px;";

    const title = documentRef.createElement("div");
    title.textContent = currentLang === "zh-CN" ? "偏好设置（Runtime 接管持久化）" : "Preferences (runtime-managed persistence)";
    title.style.cssText = "font-weight:700;font-size:13px;";
    root.appendChild(title);

    const subtitle = documentRef.createElement("div");
    subtitle.textContent = currentLang === "zh-CN"
      ? "这里的修改会直接写入 runtime canonical preferences，重新打开 popup 后仍会保留。"
      : "Changes here write directly to the runtime canonical preferences and persist after popup reopen.";
    subtitle.style.cssText = "font-size:11px;opacity:.74;line-height:1.45;";
    root.appendChild(subtitle);

    const fieldsWrap = documentRef.createElement("div");
    fieldsWrap.style.cssText = "display:grid;gap:8px;";
    root.appendChild(fieldsWrap);

    const fields = [
      {
        key: "commentLength",
        label: currentLang === "zh-CN" ? "评论长度" : "Comment length",
        type: "select",
        value: String(Math.max(1, Math.min(5, sparkToNumber(preferences.commentLength, 2)))),
        options: [
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
          { value: "5", label: "5" }
        ]
      },
      {
        key: "commentTone",
        label: currentLang === "zh-CN" ? "语气" : "Tone",
        type: "select",
        value: sparkToString(preferences.commentTone, "Polite"),
        options: toneOptions
      },
      {
        key: "voiceGender",
        label: currentLang === "zh-CN" ? "语气性别" : "Voice gender",
        type: "select",
        value: sparkToString(preferences.voiceGender, "NotSpecified"),
        options: voiceOptions
      },
      {
        key: "engageInEnglish",
        label: currentLang === "zh-CN" ? "评论 / 回复使用英文" : "Comment / reply in English",
        type: "checkbox",
        value: !!preferences.engageInEnglish
      },
      {
        key: "commentUseEmojis",
        label: currentLang === "zh-CN" ? "使用表情" : "Use emojis",
        type: "checkbox",
        value: !!preferences.commentUseEmojis
      },
      {
        key: "commentEndWithQuestion",
        label: currentLang === "zh-CN" ? "开放式结尾" : "Open-ended ending",
        type: "checkbox",
        value: !!preferences.commentEndWithQuestion
      }
    ];

    for (const field of fields) {
      const row = documentRef.createElement("label");
      row.style.cssText = field.type === "checkbox"
        ? "display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.03);"
        : "display:grid;gap:6px;font-size:12px;";
      const caption = documentRef.createElement("span");
      caption.textContent = field.label;
      caption.style.cssText = field.type === "checkbox"
        ? "font-weight:600;line-height:1.35;flex:1;"
        : "font-weight:600;";
      row.appendChild(caption);

      let control;
      if (field.type === "checkbox") {
        control = documentRef.createElement("input");
        control.type = "checkbox";
        control.checked = !!field.value;
        control.style.cssText = "width:16px;height:16px;flex:0 0 auto;";
      } else {
        control = documentRef.createElement("select");
        control.style.cssText = "width:100%;min-height:34px;border-radius:10px;border:1px solid rgba(27,183,110,.22);padding:6px 10px;background:rgba(255,255,255,.03);box-sizing:border-box;";
        for (const option of field.options) {
          const optionEl = documentRef.createElement("option");
          optionEl.value = option.value;
          optionEl.textContent = option.label;
          if (option.value === field.value) optionEl.selected = true;
          control.appendChild(optionEl);
        }
      }

      control.dataset.cePrefKey = field.key;
      row.appendChild(control);
      fieldsWrap.appendChild(row);
    }

    return root;
  }

  function getControlledPreferencesPanelSignature(preferences, toneOptions, voiceOptions) {
    return stringifyStoredObject({
      lang: currentLang,
      preferences: sanitizeLegacyPreferences(preferences),
      toneOptions: Array.isArray(toneOptions) ? toneOptions : [],
      voiceOptions: Array.isArray(voiceOptions) ? voiceOptions : []
    });
  }

  async function mountControlledLegacyPreferencesPanel() {
    if (!document.body) return;
    const existing = document.getElementById("ce-controlled-preferences-root");
    const anchor = findPreferenceAnchorRow();
    if (!isPreferencesTabActive()) {
      if (existing) existing.style.display = "none";
      if (document.body) {
        delete document.body.dataset.ceLegacyPrefsApplied;
        legacyPreferencesLastSnapshot = "";
      }
      return;
    }

    const host = getLegacyPreferencesHost();
    if (!host) return;

    hideLegacyPreferencesSurface();
    const preferences = await loadLegacyPreferences();
    const toneOptions = getLegacyPreferenceToneOptions();
    const voiceOptions = getLegacyPreferenceVoiceGenderOptions();
    const nextSignature = getControlledPreferencesPanelSignature(preferences, toneOptions, voiceOptions);

    if (existing && existing.dataset.cePanelSignature === nextSignature) {
      existing.style.display = "";
      document.body.dataset.ceLegacyPrefsApplied = "true";
      return;
    }

    if (existing) existing.remove();
    const panel = buildControlledPreferenceField(document, preferences, toneOptions, voiceOptions);
    panel.dataset.cePanelSignature = nextSignature;
    panel.addEventListener("change", async (event) => {
      const target = event.target;
      const key = sparkToString(target?.dataset?.cePrefKey, "").trim();
      if (!key) return;
      const patch = {
        [key]: target instanceof HTMLInputElement && target.type === "checkbox"
          ? !!target.checked
          : sparkToString(target?.value, "")
      };
      if (key === "commentLength") {
        patch[key] = Math.max(1, Math.min(5, Math.round(sparkToNumber(target?.value, 2))));
      }
      const next = await persistLegacyPreferences(patch);
      legacyPreferencesLastSnapshot = serializeLegacyPreferencesSnapshot(next);
      panel.dataset.cePanelSignature = getControlledPreferencesPanelSignature(next, toneOptions, voiceOptions);
    });

    if (anchor && anchor.parentElement === host) {
      host.insertBefore(panel, anchor);
    } else {
      host.insertBefore(panel, host.firstChild || null);
    }
    document.body.dataset.ceLegacyPrefsApplied = "true";
  }

  function findLegacyPreferenceCheckbox(labelMatchers) {
    const labels = Array.from(document.querySelectorAll("#__plasmo label"));
    for (const label of labels) {
      const text = normalizePopupUiText(label.textContent);
      if (!text) continue;
      if (!labelMatchers.some((matcher) => matcher.test(text))) continue;
      const input = label.querySelector('input[type="checkbox"]');
      if (input) return input;
    }
    return null;
  }

  function isVisibleElement(element) {
    if (!element || !element.getBoundingClientRect) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getVisibleLegacyCheckboxes() {
    return Array.from(document.querySelectorAll("#__plasmo input[type='checkbox']"))
      .filter((input) => !input.closest("#ce-controlled-preferences-root, #ce-preferences-auto-send-root, #ce-reply-prompt-hint-root"))
      .filter((input) => isVisibleElement(input));
  }

  function getVisibleLegacySelects() {
    return Array.from(document.querySelectorAll("#__plasmo select"))
      .filter((select) => !select.closest("#ce-controlled-preferences-root, #ce-preferences-auto-send-root, #ce-reply-prompt-hint-root"))
      .filter((select) => isVisibleElement(select));
  }

  function getVisibleLegacyRanges() {
    return Array.from(document.querySelectorAll("#__plasmo input[type='range']"))
      .filter((input) => !input.closest("#ce-controlled-preferences-root, #ce-preferences-auto-send-root, #ce-reply-prompt-hint-root"))
      .filter((input) => isVisibleElement(input));
  }

  function hasCompleteLegacyPreferencesControls() {
    return !!(
      (findLegacyPreferenceLengthSlider() || getVisibleLegacyRanges()[0])
      && (findLegacyPreferenceSelect([/^语气$/, /^tone$/i]) || getVisibleLegacySelects()[0])
      && (findLegacyPreferenceCheckbox([/评论\/回复使用英文/, /comment\/reply in english/i]) || getVisibleLegacyCheckboxes()[0])
      && (findLegacyPreferenceCheckbox([/使用表情/, /use emojis/i]) || getVisibleLegacyCheckboxes()[1])
      && (findLegacyPreferenceCheckbox([/开放式结尾/, /open-ended/i]) || getVisibleLegacyCheckboxes()[2])
      && (findLegacyPreferenceSelect([/语气性别/, /voice gender/i]) || getVisibleLegacySelects()[1])
    );
  }

  function findLegacyPreferenceSelect(labelMatchers) {
    const labels = Array.from(document.querySelectorAll("#__plasmo label, #__plasmo span, #__plasmo div"));
    for (const label of labels) {
      const text = normalizePopupUiText(label.textContent);
      if (!text) continue;
      if (!labelMatchers.some((matcher) => matcher.test(text))) continue;
      const container = label.closest("div, label");
      const select = container?.parentElement?.querySelector("select") || container?.querySelector("select");
      if (select) return select;
    }
    return null;
  }

  function findLegacyPreferenceLengthSlider() {
    const labels = Array.from(document.querySelectorAll("#__plasmo label, #__plasmo span, #__plasmo div"));
    for (const label of labels) {
      const text = normalizePopupUiText(label.textContent);
      if (!/^长度[:：]?\s*/.test(text) && !/^length[:：]?\s*/i.test(text)) continue;
      const container = label.closest("div");
      const slider = container?.parentElement?.querySelector(".MuiSlider-root input[type='range']") || container?.querySelector(".MuiSlider-root input[type='range']");
      if (slider) return slider;
    }
    return document.querySelector("#__plasmo .MuiSlider-root input[type='range']");
  }

  function setInputChecked(input, checked) {
    if (!input) return;
    const next = !!checked;
    if (!!input.checked === next) return;
    try {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked");
      descriptor?.set ? descriptor.set.call(input, next) : (input.checked = next);
    } catch (_err) {
      input.checked = next;
    }
  }

  function setSelectValue(select, value) {
    if (!select || value === undefined || value === null) return;
    const next = sparkToString(value, "").trim();
    if (!next) return;
    if (sparkToString(select.value, "").trim() === next) return;
    try {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
      descriptor?.set ? descriptor.set.call(select, next) : (select.value = next);
    } catch (_err) {
      select.value = next;
    }
  }

  function setRangeValue(input, value) {
    if (!input) return;
    const next = String(Math.max(1, Math.min(5, Math.round(sparkToNumber(value, 2)))));
    if (sparkToString(input.value, "") === next) return;
    try {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
      descriptor?.set ? descriptor.set.call(input, next) : (input.value = next);
    } catch (_err) {
      input.value = next;
    }
  }

  function serializeLegacyPreferencesSnapshot(preferences) {
    return stringifyStoredObject(
      sanitizeLegacyPreferences(preferences && typeof preferences === "object" ? preferences : getDefaultLegacyPreferences())
    );
  }

  function buildLegacyPreferencesStateFromDom() {
    if (!hasCompleteLegacyPreferencesControls()) return null;
    const patch = collectLegacyPreferencesFromDom();
    if (!Object.keys(patch).length) return null;
    return sanitizeLegacyPreferences({
      ...getDefaultLegacyPreferences(),
      ...patch
    });
  }

  async function syncLegacyPreferencesFromDom(forcePersist = false) {
    if (!isPreferencesTabActive()) return;
    const next = buildLegacyPreferencesStateFromDom();
    if (!next) return;

    const snapshot = serializeLegacyPreferencesSnapshot(next);
    if (!legacyPreferencesLastSnapshot) {
      legacyPreferencesLastSnapshot = snapshot;
      if (!forcePersist) return;
    }

    if (!forcePersist && snapshot === legacyPreferencesLastSnapshot) return;
    legacyPreferencesLastSnapshot = snapshot;
    await persistLegacyPreferences(next);
  }

  async function applyLegacyPreferencesToDom() {
    if (!isPreferencesTabActive() || !document.body) return;
    if (document.body.dataset.ceLegacyPrefsApplied === "true") return;
    if (!hasCompleteLegacyPreferencesControls()) return;
    const preferences = await loadLegacyPreferences();
    const [lengthRange] = getVisibleLegacyRanges();
    const [toneSelect, voiceGenderSelect] = getVisibleLegacySelects();
    const [englishCheckbox, emojiCheckbox, openEndedCheckbox] = getVisibleLegacyCheckboxes();

    setRangeValue(lengthRange || findLegacyPreferenceLengthSlider(), preferences.commentLength);
    setSelectValue(toneSelect || findLegacyPreferenceSelect([/^语气$/, /^tone$/i]), preferences.commentTone);
    setInputChecked(englishCheckbox || findLegacyPreferenceCheckbox([/评论\/回复使用英文/, /comment\/reply in english/i]), preferences.engageInEnglish);
    setInputChecked(emojiCheckbox || findLegacyPreferenceCheckbox([/使用表情/, /use emojis/i]), preferences.commentUseEmojis);
    setInputChecked(openEndedCheckbox || findLegacyPreferenceCheckbox([/开放式结尾/, /open-ended/i]), preferences.commentEndWithQuestion);
    setSelectValue(voiceGenderSelect || findLegacyPreferenceSelect([/语气性别/, /voice gender/i]), preferences.voiceGender);
    legacyPreferencesLastSnapshot = serializeLegacyPreferencesSnapshot(preferences);
    document.body.dataset.ceLegacyPrefsApplied = "true";
  }

  function collectLegacyPreferencesFromDom() {
    const patch = {};
    const [visibleLengthSlider] = getVisibleLegacyRanges();
    const lengthSlider = visibleLengthSlider || findLegacyPreferenceLengthSlider();
    if (lengthSlider) patch.commentLength = Number(lengthSlider.value);

    const [visibleToneSelect, visibleVoiceGenderSelect] = getVisibleLegacySelects();
    const toneSelect = visibleToneSelect || findLegacyPreferenceSelect([/^语气$/, /^tone$/i]);
    const voiceGenderSelect = visibleVoiceGenderSelect || findLegacyPreferenceSelect([/语气性别/, /voice gender/i]);
    if (toneSelect) patch.commentTone = toneSelect.value;

    const [visibleEnglishCheckbox, visibleEmojiCheckbox, visibleOpenEndedCheckbox] = getVisibleLegacyCheckboxes();
    const englishCheckbox = visibleEnglishCheckbox || findLegacyPreferenceCheckbox([/评论\/回复使用英文/, /comment\/reply in english/i]);
    const emojiCheckbox = visibleEmojiCheckbox || findLegacyPreferenceCheckbox([/使用表情/, /use emojis/i]);
    const openEndedCheckbox = visibleOpenEndedCheckbox || findLegacyPreferenceCheckbox([/开放式结尾/, /open-ended/i]);
    if (englishCheckbox) patch.engageInEnglish = !!englishCheckbox.checked;

    if (emojiCheckbox) patch.commentUseEmojis = !!emojiCheckbox.checked;

    if (openEndedCheckbox) patch.commentEndWithQuestion = !!openEndedCheckbox.checked;

    if (voiceGenderSelect) patch.voiceGender = voiceGenderSelect.value;

    return patch;
  }

  function scheduleLegacyPreferencesPersistence() {
    if (!isPreferencesTabActive()) return;
    clearTimeout(legacyPreferencesSyncTimer);
    legacyPreferencesSyncTimer = window.setTimeout(() => {
      void syncLegacyPreferencesFromDom(true);
    }, 120);
  }

  function installLegacyPreferencesPersistence() {
    if (!isPopupContext() || !document.body || document.body.dataset.ceLegacyPrefsBound === "true") return;
    document.body.dataset.ceLegacyPrefsBound = "true";

    document.body.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !isPreferencesTabActive() || !event.isTrusted) return;
      delete document.body.dataset.ceLegacyPrefsApplied;
      scheduleLegacyPreferencesPersistence();
    }, true);

    document.body.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !isPreferencesTabActive() || !event.isTrusted) return;
      delete document.body.dataset.ceLegacyPrefsApplied;
      scheduleLegacyPreferencesPersistence();
    }, true);

    const flush = () => {
      clearTimeout(legacyPreferencesSyncTimer);
      void syncLegacyPreferencesFromDom(true);
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }

  function ensureLegacyPreferencesMonitor() {
    if (!isPopupContext() || legacyPreferencesWatchTimer) return;
    legacyPreferencesWatchTimer = window.setInterval(() => {
      if (!isPreferencesTabActive()) return;
      void syncLegacyPreferencesFromDom(false);
    }, 400);
  }

  function mountPreferencesAutoSendControls() {
    if (!document.body) return;
    const existingRoot = document.getElementById("ce-preferences-auto-send-root");
    if (!isPreferencesTabActive()) {
      if (existingRoot) existingRoot.style.display = "none";
      const existingReply = document.getElementById("ce-reply-prompt-hint-root");
      if (existingReply) existingReply.style.display = "none";
      return;
    }
    if (existingRoot) {
      existingRoot.style.display = "";
      const existingReply = document.getElementById("ce-reply-prompt-hint-root");
      if (existingReply) existingReply.style.display = "";
      void Promise.all([
        loadAutoSendDelayRange(),
        loadRandomStrategySettings(),
        loadReplyPromptHint()
      ]).then(() => updateControls());
      return;
    }

    const anchorRow = findPreferenceAnchorRow();
    if (!anchorRow || !anchorRow.parentElement) return;

    const root = document.createElement("div");
    root.id = "ce-preferences-auto-send-root";
    root.className = "ce-preferences-auto-send";

    const toggleRow = document.createElement("div");
    toggleRow.className = "ce-pref-row";
    const toggleLabel = document.createElement("label");
    toggleLabel.className = "ce-pref-toggle";
    const autoToggle = document.createElement("input");
    autoToggle.id = "ce-pref-auto-send-toggle";
    autoToggle.type = "checkbox";
    toggleLabel.setAttribute("for", autoToggle.id);
    autoToggle.addEventListener("change", async () => {
      autoSendEnabled = !!autoToggle.checked;
      await persistAutoSendSettings();
      updateControls();
    });
    const autoToggleText = document.createElement("span");
    autoToggleText.id = "ce-pref-auto-send-text";
    toggleLabel.appendChild(autoToggle);
    toggleLabel.appendChild(autoToggleText);
    toggleRow.appendChild(toggleLabel);

    const randomToneRow = document.createElement("div");
    randomToneRow.className = "ce-pref-row";
    const randomToneLabel = document.createElement("label");
    randomToneLabel.className = "ce-pref-toggle";
    const randomToneToggle = document.createElement("input");
    randomToneToggle.id = "ce-pref-random-tone-toggle";
    randomToneToggle.type = "checkbox";
    randomToneLabel.setAttribute("for", randomToneToggle.id);
    randomToneToggle.addEventListener("change", async () => {
      randomToneEnabled = !!randomToneToggle.checked;
      await persistRandomStrategySettings();
      updateControls();
    });
    const randomToneText = document.createElement("span");
    randomToneText.id = "ce-pref-random-tone-text";
    randomToneLabel.appendChild(randomToneToggle);
    randomToneLabel.appendChild(randomToneText);
    randomToneRow.appendChild(randomToneLabel);

    const randomLengthRow = document.createElement("div");
    randomLengthRow.className = "ce-pref-row";
    const randomLengthLabel = document.createElement("label");
    randomLengthLabel.className = "ce-pref-toggle";
    const randomLengthToggle = document.createElement("input");
    randomLengthToggle.id = "ce-pref-random-length-toggle";
    randomLengthToggle.type = "checkbox";
    randomLengthLabel.setAttribute("for", randomLengthToggle.id);
    randomLengthToggle.addEventListener("change", async () => {
      randomLengthEnabled = !!randomLengthToggle.checked;
      await persistRandomStrategySettings();
      updateControls();
    });
    const randomLengthText = document.createElement("span");
    randomLengthText.id = "ce-pref-random-length-text";
    randomLengthLabel.appendChild(randomLengthToggle);
    randomLengthLabel.appendChild(randomLengthText);
    randomLengthRow.appendChild(randomLengthLabel);

    const delayRow = document.createElement("div");
    delayRow.className = "ce-pref-row ce-pref-delay-row";
    const delayCaption = document.createElement("span");
    delayCaption.id = "ce-pref-delay-caption";
    const delayLabel = document.createElement("span");
    delayLabel.id = "ce-pref-delay-label";

    const minInput = document.createElement("input");
    minInput.id = "ce-pref-delay-min";
    minInput.type = "number";
    minInput.min = "0";
    minInput.max = "30";
    minInput.step = "1";

    const separator = document.createElement("span");
    separator.textContent = "~";

    const maxInput = document.createElement("input");
    maxInput.id = "ce-pref-delay-max";
    maxInput.type = "number";
    maxInput.min = "0";
    maxInput.max = "30";
    maxInput.step = "1";

    const onDelayChange = async () => {
      setAutoSendDelayRange(Number(minInput.value), Number(maxInput.value));
      await persistAutoSendSettings();
      updateControls();
    };

    minInput.addEventListener("change", onDelayChange);
    maxInput.addEventListener("change", onDelayChange);

    delayRow.appendChild(delayCaption);
    delayRow.appendChild(delayLabel);
    delayRow.appendChild(minInput);
    delayRow.appendChild(separator);
    delayRow.appendChild(maxInput);

    root.appendChild(toggleRow);
    root.appendChild(randomToneRow);
    root.appendChild(randomLengthRow);
    root.appendChild(delayRow);

    anchorRow.insertAdjacentElement("afterend", root);
    void Promise.all([
      loadAutoSendDelayRange(),
      loadRandomStrategySettings(),
      loadReplyPromptHint()
    ]).then(() => updateControls());
    updateControls();
  }

  function mountReplyPromptHintControl() {
    const settingsRoot = document.getElementById("ce-preferences-auto-send-root");
    if (!settingsRoot) return;
    const existingRoot = document.getElementById("ce-reply-prompt-hint-root");
    if (existingRoot) {
      existingRoot.style.display = isPreferencesTabActive() ? "" : "none";
      return;
    }

    const root = document.createElement("div");
    root.id = "ce-reply-prompt-hint-root";
    root.className = "ce-pref-field";

    const label = document.createElement("label");
    label.id = "ce-reply-prompt-hint-label";
    label.className = "ce-pref-field-label";
    label.setAttribute("for", "ce-reply-prompt-hint-input");

    const input = document.createElement("textarea");
    input.id = "ce-reply-prompt-hint-input";
    input.className = "ce-pref-field-textarea";
    input.maxLength = 240;
    input.rows = 3;
    input.spellcheck = false;
    input.autocomplete = "off";

    input.addEventListener("input", () => {
      const raw = typeof input.value === "string" ? input.value : "";
      const clipped = raw.slice(0, 240);
      if (clipped !== raw) input.value = clipped;
      replyPromptHint = clipped;
    });

    input.addEventListener("change", async () => {
      replyPromptHint = normalizeReplyPromptHint(input.value);
      input.value = replyPromptHint;
      await persistReplyPromptHint();
      updateControls();
    });

    input.addEventListener("blur", async () => {
      replyPromptHint = normalizeReplyPromptHint(input.value);
      input.value = replyPromptHint;
      await persistReplyPromptHint();
      updateControls();
    });

    root.appendChild(label);
    root.appendChild(input);
    settingsRoot.appendChild(root);
    updateControls();
  }

  function normalizePopupUiText(text) {
    return sparkToString(text, "").replace(/\s+/g, " ").trim();
  }

  function isInsideGasGxPopupUi(node) {
    return !!node?.closest?.(`#${GASGX_AUTH_OVERLAY_ID}, #${GASGX_AUTH_BADGE_ID}, #${GASGX_ACCOUNT_PANEL_ID}`);
  }

  function shouldHideLegacyPopupAccountNode(node) {
    if (!node || isInsideGasGxPopupUi(node)) return false;

    const text = normalizePopupUiText(node.textContent);
    if (!text) return false;

    if (
      /free trial ended/i.test(text)
      || /early bird mode/i.test(text)
      || /have an account\?/i.test(text)
      || /已有账号/.test(text)
      || /登录/.test(text)
      || /watch tutorial/i.test(text)
      || /write us a review/i.test(text)
      || /^plan:/i.test(text)
      || /^sign up$/i.test(text)
      || /^登录$/.test(text)
      || /^已有账号？?$/.test(text)
      || /^sign out$/i.test(text)
      || /same email you used to sign in to gasgx/i.test(text)
      || /same password you used to register/i.test(text)
      || /forgot password/i.test(text)
    ) {
      return true;
    }

    return !!node.querySelector("input") && (/^email$/i.test(text) || /^password$/i.test(text));
  }

  function hideLegacyPopupAccountUi() {
    if (!isPopupContext() || !document.body) return;

    const nodes = document.querySelectorAll("#__plasmo .MuiGrid-item, #__plasmo .info-flex, #__plasmo .left-margin, #__plasmo .stick-to-bottom, #__plasmo .MuiFormControl-root");
    for (const node of nodes) {
      if (!shouldHideLegacyPopupAccountNode(node)) continue;
      node.style.display = "none";
      node.setAttribute("data-ce-gasgx-hidden", "legacy-account-auth");
    }
  }

  function findGasGxAccountPanelAnchor() {
    const root = document.getElementById("__plasmo");
    if (!root) return null;

    const candidates = root.querySelectorAll(".MuiGrid-item, .left-margin, .info-flex, div");
    for (const node of candidates) {
      if (isInsideGasGxPopupUi(node)) continue;
      const text = normalizePopupUiText(node.textContent);
      if (!text) continue;
      if (
        /^licensed to:/i.test(text)
        || /^licensed to\s/i.test(text)
        || /^linkedin当前账号[:\s]?/i.test(text)
      ) return node;
    }

    return null;
  }

  function ensureGasGxAccountPanel() {
    if (!isPopupContext() || !document.body) return null;

    ensureGasGxPopupStyles();
    const anchor = findGasGxAccountPanelAnchor();
    let panel = document.getElementById(GASGX_ACCOUNT_PANEL_ID);
    if (!anchor?.parentElement) {
      panel?.remove();
      return null;
    }

    if (!panel) {
      panel = document.createElement("div");
      panel.id = GASGX_ACCOUNT_PANEL_ID;
    }

    if (panel.parentElement !== anchor.parentElement || panel.previousElementSibling !== anchor) {
      anchor.insertAdjacentElement("afterend", panel);
    }

    return panel;
  }

  function renderGasGxPopupAccountPanel() {
    if (!isPopupContext() || !document.body) return;

    hideLegacyPopupAccountUi();
    const panel = ensureGasGxAccountPanel();
    if (!panel) return;

    const snapshot = getCurrentGasGxAuthSnapshot();
    const enabled = isGasGxExtensionEnabled(snapshot);
    const isBlocked = snapshot.status === "signed_in_but_not_enabled";
    const isError = snapshot.status === "auth_error";
    const title = currentLang === "zh-CN" ? "GasGx 账号" : "GasGx Account";
    const statusText = enabled
      ? (currentLang === "zh-CN" ? "已登录" : "Signed in")
      : isBlocked
        ? (currentLang === "zh-CN" ? "账号状态受限" : "Account state blocked")
        : isError
          ? (currentLang === "zh-CN" ? "登录异常" : "Sign-in error")
          : (currentLang === "zh-CN" ? "需要登录" : "Sign-in required");
    const summaryText = enabled
      ? (currentLang === "zh-CN"
        ? "当前扩展直接使用本地保存的 GasGx 登录会话和偏好配置。"
        : "This popup now uses your persisted GasGx session and preferences.")
      : isBlocked
        ? (currentLang === "zh-CN"
          ? "当前账号状态不可用，请切换账号重新登录。"
          : "The current account state is unavailable. Please switch accounts and sign in again.")
        : isError
          ? (snapshot.errorMessage || (currentLang === "zh-CN" ? "GasGx 登录失败，请重新登录。" : "GasGx sign-in failed. Please sign in again."))
          : (currentLang === "zh-CN"
            ? "请使用 GasGx 账号登录，扩展会把登录状态和偏好保存在本地。"
            : "Sign in with your GasGx account. The extension will keep the sign-in state and preferences locally.");
    const emailText = snapshot.email || (currentLang === "zh-CN" ? "未连接账号" : "No account connected");
    const primaryActionLabel = enabled
      ? (currentLang === "zh-CN" ? "退出登录" : "Sign out")
      : (currentLang === "zh-CN" ? "切换账号" : "Switch account");
    const secondaryActionLabel = currentLang === "zh-CN" ? "打开 GasGx" : "Open GasGx";

    panel.innerHTML = `
      <div class="ce-gasgx-account-card" data-status="${enabled ? "enabled" : isBlocked ? "blocked" : isError ? "error" : "signin"}">
        <div class="ce-gasgx-account-head">
          <div>
            <div class="ce-gasgx-account-title">${title}</div>
            <div class="ce-gasgx-account-email">${emailText}</div>
          </div>
          <span class="ce-gasgx-account-pill">${statusText}</span>
        </div>
        <div class="ce-gasgx-account-summary">${summaryText}</div>
        <div class="ce-gasgx-account-actions">
          <a class="ce-gasgx-account-link" href="${GASGX_EXTENSION_CONTACT_URL}" target="_blank" rel="noreferrer">${secondaryActionLabel}</a>
          ${snapshot.email || enabled || isBlocked ? `<button type="button" class="ce-gasgx-account-btn" id="ce-gasgx-account-action">${primaryActionLabel}</button>` : ""}
        </div>
      </div>`;

    const actionBtn = document.getElementById("ce-gasgx-account-action");
    actionBtn?.addEventListener("click", () => { void handleGasGxPopupSignOut(); }, { once: true });
  }

  function ensureGasGxPopupStyles() {
    if (document.getElementById("ce-gasgx-auth-style")) return;
    const style = document.createElement("style");
    style.id = "ce-gasgx-auth-style";
    style.textContent = `
      :root {
        --ce-ui-bg-main: #0c0e0c;
        --ce-ui-bg-card: rgba(20,22,20,0.86);
        --ce-ui-bg-ghost: rgba(255,255,255,0.03);
        --ce-ui-bg-input: #0b0d0b;
        --ce-ui-text-primary: #f4f7f1;
        --ce-ui-text-secondary: #7b8578;
        --ce-ui-text-on-primary: #091009;
        --ce-ui-border: rgba(255,255,255,0.1);
        --ce-ui-accent: #84cc16;
        --ce-ui-accent-15: rgba(132,204,22,0.15);
        --ce-ui-accent-24: rgba(132,204,22,0.24);
        --ce-ui-success: #28a745;
        --ce-ui-warning: #ff9900;
        --ce-ui-danger: #ff3366;
        --ce-ui-shadow: 0 24px 48px rgba(0,0,0,0.45);
        --ce-ui-font: "Segoe UI", "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
      }
      #${GASGX_AUTH_OVERLAY_ID} { position: fixed; inset: 0; z-index: 2147483646; display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, rgba(12,14,12,0.96), rgba(20,22,20,0.94)); padding: 18px; font-family: var(--ce-ui-font); }
      #${GASGX_AUTH_OVERLAY_ID}[data-mode="hidden"] { display: none; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-card { width: min(100%, 360px); border-radius: 22px; padding: 22px; background: var(--ce-ui-bg-card); backdrop-filter: blur(14px); border: 1px solid var(--ce-ui-border); box-shadow: var(--ce-ui-shadow); color: var(--ce-ui-text-primary); }
      #${GASGX_AUTH_OVERLAY_ID} .ce-card-loading { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 24px 20px; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-loading-spinner { width: 34px; height: 34px; margin-bottom: 14px; border-radius: 50%; border: 3px solid var(--ce-ui-accent-15); border-top-color: var(--ce-ui-accent); animation: ce-gasgx-spin 0.9s linear infinite; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-title { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-subtitle { font-size: 12px; line-height: 1.5; color: var(--ce-ui-text-secondary); margin-bottom: 16px; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-error { min-height: 18px; color: #ffdce5; font-size: 12px; margin-bottom: 10px; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-success { color: var(--ce-ui-success); }
      #${GASGX_AUTH_OVERLAY_ID} .ce-inline-status { display: inline-flex; align-items: center; gap: 8px; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-inline-spinner { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--ce-ui-accent-15); border-top-color: var(--ce-ui-accent); animation: ce-gasgx-spin 0.9s linear infinite; flex: 0 0 auto; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-label { font-size: 12px; color: var(--ce-ui-text-secondary); }
      #${GASGX_AUTH_OVERLAY_ID} .ce-input { width: 100%; border: 1px solid var(--ce-ui-border); border-radius: 12px; background: var(--ce-ui-bg-input); color: var(--ce-ui-text-primary); padding: 10px 12px; font-size: 13px; box-sizing: border-box; box-shadow: inset 0 2px 6px rgba(0,0,0,0.6); }
      #${GASGX_AUTH_OVERLAY_ID} .ce-input:focus { outline: none; border-color: var(--ce-ui-accent); box-shadow: inset 0 2px 6px rgba(0,0,0,0.45), 0 0 0 3px var(--ce-ui-accent-15); }
      #${GASGX_AUTH_OVERLAY_ID} .ce-row { display: flex; gap: 10px; align-items: center; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-btn { appearance: none; border: 0; border-radius: 12px; padding: 10px 14px; cursor: pointer; font-size: 13px; font-weight: 800; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-btn-primary { background: var(--ce-ui-accent); color: var(--ce-ui-text-on-primary); flex: 1; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-link { color: var(--ce-ui-accent); text-decoration: none; font-size: 12px; }
      #${GASGX_AUTH_BADGE_ID} { position: fixed; top: 8px; right: 8px; z-index: 2147483645; display: none; gap: 8px; align-items: center; padding: 8px 10px; border-radius: 999px; background: rgba(20,22,20,0.9); color: var(--ce-ui-text-primary); border: 1px solid var(--ce-ui-border); font-family: var(--ce-ui-font); font-size: 11px; }
      #${GASGX_AUTH_BADGE_ID} button { appearance: none; border: 0; border-radius: 999px; padding: 4px 8px; cursor: pointer; font-size: 11px; background: var(--ce-ui-accent); color: var(--ce-ui-text-on-primary); }
      #${GASGX_ACCOUNT_PANEL_ID} { margin: 14px 0 18px; }
      #${GASGX_ACCOUNT_PANEL_ID} .ce-gasgx-account-card { border-radius: 18px; padding: 14px 16px; background: var(--ce-ui-bg-card); backdrop-filter: blur(14px); border: 1px solid var(--ce-ui-border); box-shadow: var(--ce-ui-shadow); }
      #${GASGX_ACCOUNT_PANEL_ID} .ce-gasgx-account-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
      #${GASGX_ACCOUNT_PANEL_ID} .ce-gasgx-account-title { font-size: 14px; font-weight: 800; color: var(--ce-ui-text-primary); }
      #${GASGX_ACCOUNT_PANEL_ID} .ce-gasgx-account-email { margin-top: 4px; font-size: 12px; color: var(--ce-ui-text-secondary); word-break: break-all; }
      #${GASGX_ACCOUNT_PANEL_ID} .ce-gasgx-account-pill { flex-shrink: 0; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 800; color: var(--ce-ui-accent); background: var(--ce-ui-accent-15); border: 1px solid var(--ce-ui-accent-24); }
      #${GASGX_ACCOUNT_PANEL_ID} .ce-gasgx-account-summary { font-size: 12px; line-height: 1.55; color: var(--ce-ui-text-secondary); }
      #${GASGX_ACCOUNT_PANEL_ID} .ce-gasgx-account-actions { display: flex; gap: 10px; align-items: center; margin-top: 12px; flex-wrap: wrap; }
      #${GASGX_ACCOUNT_PANEL_ID} .ce-gasgx-account-link,
      #${GASGX_ACCOUNT_PANEL_ID} .ce-gasgx-account-btn { appearance: none; border: 0; border-radius: 12px; font-size: 12px; font-weight: 800; line-height: 1; text-decoration: none; cursor: pointer; }
      #${GASGX_ACCOUNT_PANEL_ID} .ce-gasgx-account-link { padding: 10px 12px; color: var(--ce-ui-text-primary); background: transparent; border: 1px solid var(--ce-ui-border); }
      #${GASGX_ACCOUNT_PANEL_ID} .ce-gasgx-account-btn { padding: 10px 14px; color: var(--ce-ui-text-on-primary); background: var(--ce-ui-accent); }
      #ce-preferences-auto-send-root.ce-preferences-auto-send { position: relative; z-index: 8; margin-top: 12px; padding: 14px 12px 4px; border-radius: 18px; background: var(--ce-ui-bg-card); border: 1px solid var(--ce-ui-border); pointer-events: auto; box-shadow: var(--ce-ui-shadow); }
      #ce-preferences-auto-send-root .ce-pref-row { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; pointer-events: auto; }
      #ce-preferences-auto-send-root .ce-pref-toggle { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; pointer-events: auto; user-select: none; color: var(--ce-ui-text-primary); font-size: 13px; line-height: 1.4; }
      #ce-preferences-auto-send-root .ce-pref-toggle input[type="checkbox"] { appearance: auto; width: 16px; height: 16px; margin: 0; cursor: pointer; accent-color: var(--ce-ui-accent); pointer-events: auto; flex: 0 0 auto; }
      #ce-preferences-auto-send-root .ce-pref-delay-row { flex-wrap: wrap; color: var(--ce-ui-text-secondary); font-size: 13px; }
      #ce-preferences-auto-send-root .ce-pref-delay-row input[type="number"] { width: 54px; height: 28px; padding: 2px 6px; border-radius: 8px; border: 1px solid var(--ce-ui-border); background: var(--ce-ui-bg-input); color: var(--ce-ui-text-primary); box-sizing: border-box; pointer-events: auto; box-shadow: inset 0 2px 6px rgba(0,0,0,0.6); }
      #ce-reply-prompt-hint-root.ce-pref-field { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
      #ce-reply-prompt-hint-label.ce-pref-field-label { display: block; font-size: 13px; font-weight: 700; line-height: 1.4; color: var(--ce-ui-text-primary); }
      #ce-reply-prompt-hint-input.ce-pref-field-textarea { width: 100%; min-height: 78px; padding: 12px 14px; border: 1px solid var(--ce-ui-border); border-radius: 12px; background: var(--ce-ui-bg-input); color: var(--ce-ui-text-primary); font-size: 13px; line-height: 1.5; box-sizing: border-box; resize: vertical; box-shadow: inset 0 2px 6px rgba(0,0,0,0.6); }
      #ce-reply-prompt-hint-input.ce-pref-field-textarea::placeholder { color: var(--ce-ui-text-secondary); }
      #ce-reply-prompt-hint-input.ce-pref-field-textarea:focus { outline: none; border-color: var(--ce-ui-accent); box-shadow: inset 0 2px 6px rgba(0,0,0,0.45), 0 0 0 2px var(--ce-ui-accent-15); }
      .iziToast-wrapper { z-index: 2147483647 !important; padding: 12px 14px !important; }
      .iziToast-wrapper-topLeft, .iziToast-wrapper-topCenter, .iziToast-wrapper-topRight { top: 6px !important; }
      .iziToast-wrapper-bottomLeft, .iziToast-wrapper-bottomCenter, .iziToast-wrapper-bottomRight { bottom: 6px !important; }
      .iziToast {
        border-radius: 14px !important;
        border: 1px solid var(--ce-ui-border) !important;
        background: rgba(20,22,20,0.94) !important;
        color: var(--ce-ui-text-primary) !important;
        font-family: var(--ce-ui-font) !important;
        box-shadow: 0 16px 34px rgba(0,0,0,0.42) !important;
      }
      .iziToast::after { display: none !important; }
      .iziToast > .iziToast-progressbar { background: rgba(132,204,22,0.14) !important; }
      .iziToast > .iziToast-progressbar > div { background: var(--ce-ui-accent) !important; height: 3px !important; border-radius: 0 0 12px 12px !important; }
      .iziToast > .iziToast-body { margin: 0 0 0 14px !important; padding: 0 2px 0 10px !important; min-height: 38px !important; }
      .iziToast > .iziToast-body .iziToast-texts { margin: 8px 0 8px !important; padding-right: 4px !important; }
      .iziToast > .iziToast-body .iziToast-title { color: var(--ce-ui-text-primary) !important; font-size: 13px !important; line-height: 1.4 !important; font-weight: 700 !important; }
      .iziToast > .iziToast-body .iziToast-message { color: rgba(244,247,241,0.92) !important; font-size: 13px !important; line-height: 1.5 !important; margin: 0 !important; }
      .iziToast > .iziToast-close { filter: brightness(0) invert(1); opacity: 0.72 !important; }
      .iziToast > .iziToast-close:hover { opacity: 1 !important; }
      .iziToast.iziToast-color-blue { border-color: rgba(132,204,22,0.45) !important; background: rgba(20,22,20,0.95) !important; }
      .iziToast.iziToast-color-green { border-color: rgba(40,167,69,0.52) !important; background: rgba(18,26,20,0.95) !important; }
      .iziToast.iziToast-color-red { border-color: rgba(255,51,102,0.56) !important; background: rgba(28,16,22,0.95) !important; }
      .iziToast.iziToast-color-orange, .iziToast.iziToast-color-yellow { border-color: rgba(255,153,0,0.56) !important; background: rgba(30,24,16,0.95) !important; }
      #ce-auto-send-debug-hint.ce-gasgx-toast.ce-gasgx-toast-debug {
        position: fixed;
        right: 14px;
        bottom: 84px;
        z-index: 2147483647;
        max-width: min(420px, calc(100vw - 26px));
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid rgba(132,204,22,0.45);
        background: rgba(20,22,20,0.95);
        color: var(--ce-ui-text-primary);
        font: 12px/1.5 var(--ce-ui-font);
        box-shadow: 0 16px 34px rgba(0,0,0,0.42);
        pointer-events: none;
        backdrop-filter: blur(10px);
      }
      @keyframes ce-gasgx-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }

  function setPopupRootInteractivity(enabled) {
    const root = document.getElementById("__plasmo");
    if (!root) return;
    root.style.pointerEvents = enabled ? "" : "none";
    root.style.filter = enabled ? "" : "blur(2px)";
    root.style.opacity = enabled ? "1" : "0.18";
  }

  function ensureGasGxPopupOverlay() {
    ensureGasGxPopupStyles();
    let overlay = document.getElementById(GASGX_AUTH_OVERLAY_ID);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = GASGX_AUTH_OVERLAY_ID;
      document.body.appendChild(overlay);
    }
    const badge = document.getElementById(GASGX_AUTH_BADGE_ID);
    badge?.remove();
    return { overlay, badge };
  }

  async function handleGasGxPopupSignInSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const emailInput = form.querySelector('input[name="email"]');
    const passwordInput = form.querySelector('input[name="password"]');
    const errorNode = form.querySelector("[data-role='error']");
    const submitBtn = form.querySelector("button[type='submit']");
    const signingInLabel = currentLang === "zh-CN" ? "正在登录 GasGx..." : "Signing in to GasGx...";
    const submitLoadingLabel = currentLang === "zh-CN" ? "登录中..." : "Signing in...";
    form.dataset.ceLoading = "true";
    if (submitBtn) {
      if (!submitBtn.dataset.ceDefaultLabel) {
        submitBtn.dataset.ceDefaultLabel = sparkToString(submitBtn.textContent, "").trim() || (currentLang === "zh-CN" ? "登录" : "Sign in");
      }
      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");
      submitBtn.innerHTML = `<span class="ce-inline-status"><span class="ce-inline-spinner" aria-hidden="true"></span><span>${submitLoadingLabel}</span></span>`;
    }
    if (errorNode) {
      errorNode.innerHTML = `<span class="ce-inline-status"><span class="ce-inline-spinner" aria-hidden="true"></span><span>${signingInLabel}</span></span>`;
      errorNode.classList.remove("ce-success");
    }
    try {
      const sessionPayload = await signInWithGasGxPassword(emailInput?.value, passwordInput?.value);
      const snapshot = await buildGasGxSnapshotFromSession(sessionPayload);
      await persistGasGxSignedOutFlag(false);
      await persistGasGxLocalSignedInFlag(true);
      await persistGasGxAuthSnapshot(snapshot);
      await persistGasGxLoginState(true);
      void syncGasGxDerivedStorage().catch(() => {});
      if (errorNode) {
        errorNode.textContent = currentLang === "zh-CN" ? "登录成功。" : "Sign-in successful.";
        errorNode.classList.add("ce-success");
      }
    } catch (error) {
      await persistGasGxSignedOutFlag(false);
      await persistGasGxLocalSignedInFlag(false);
      await persistGasGxLoginState(false);
      await persistGasGxAuthSnapshot(buildGasGxAuthErrorSnapshot(getCurrentGasGxAuthSnapshot(), error?.message));
      if (errorNode) {
        errorNode.textContent = sparkToString(error?.message, currentLang === "zh-CN"
          ? "GasGx 登录失败，请检查邮箱和密码。"
          : "GasGx sign-in failed. Please check your email and password.");
        errorNode.classList.remove("ce-success");
      }
    } finally {
      delete form.dataset.ceLoading;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
        submitBtn.textContent = submitBtn.dataset.ceDefaultLabel || (currentLang === "zh-CN" ? "登录" : "Sign in");
      }
      try {
        await ensureGasGxAuthSnapshotLoaded(true);
      } catch (_err) {}
      renderGasGxPopupAuth();
    }
  }

  async function handleGasGxPopupSignOut() {
    await persistGasGxSignedOutFlag(true);
    await clearGasGxAuthSnapshot();
    await persistGasGxSignedOutFlag(true);
    await persistGasGxLoginState(false);
    await persistGasGxLocalSignedInFlag(false);
    await syncGasGxDerivedStorage();
  }

  function renderGasGxPopupLoading() {
    if (!isPopupContext() || !document.body) return;
    const { overlay } = ensureGasGxPopupOverlay();
    setPopupRootInteractivity(false);
    overlay.setAttribute("data-mode", "active");
    overlay.innerHTML = `
      <div class="ce-card ce-card-loading">
        <div class="ce-loading-spinner" aria-hidden="true"></div>
        <div class="ce-title">${currentLang === "zh-CN" ? "正在读取登录状态" : "Loading sign-in state"}</div>
        <div class="ce-subtitle">${currentLang === "zh-CN"
          ? "扩展正在读取本地保存的账号状态与偏好配置。"
          : "Loading account state and preferences."}</div>
      </div>`;
  }

  function renderGasGxPopupAuth() {
    if (!isPopupContext() || !document.body) return;
    const snapshot = getCurrentGasGxAuthSnapshot();
    const { overlay, badge } = ensureGasGxPopupOverlay();
    const enabled = isGasGxExtensionEnabled(snapshot);
    setPopupRootInteractivity(enabled);
    if (enabled) {
      overlay.setAttribute("data-mode", "hidden");
      overlay.innerHTML = "";
      renderGasGxPopupAccountPanel();
      queueApplyRuntime();
      return;
    }
    if (badge) {
      badge.style.display = "none";
      badge.innerHTML = "";
    }
    const isBlocked = snapshot.status === "signed_in_but_not_enabled";
    const isError = snapshot.status === "auth_error";
    overlay.setAttribute("data-mode", "active");
    overlay.innerHTML = `
      <div class="ce-card">
        <div class="ce-title">GasGx sign-in</div>
        <div class="ce-subtitle">Sign in with your GasGx account. The extension will reuse your persisted session and preferences.</div>
        <div class="ce-error ${!isError && !isBlocked ? "ce-success" : ""}" data-role="status">${isBlocked ? "This account state is blocked. Please switch account." : isError ? (snapshot.errorMessage || "GasGx sign-in failed. Please sign in again.") : "Sign in with your GasGx account. The extension keeps your session and preferences after success."}</div>
        ${isBlocked ? `<div class="ce-row"><button type="button" class="ce-btn ce-btn-primary" id="ce-gasgx-switch-account">Switch account</button><a class="ce-link" href="${GASGX_EXTENSION_CONTACT_URL}" target="_blank" rel="noreferrer">Contact GasGx</a></div>` : `<form id="ce-gasgx-sign-in-form"><div class="ce-field"><label class="ce-label">GasGx email</label><input class="ce-input" type="email" name="email" autocomplete="username" placeholder="you@gasgx.com" value="${snapshot.email || ""}"></div><div class="ce-field"><label class="ce-label">Password</label><input class="ce-input" type="password" name="password" autocomplete="current-password" placeholder="Enter password"></div><div class="ce-error" data-role="error">${isError ? (snapshot.errorMessage || "") : ""}</div><div class="ce-row"><button type="submit" class="ce-btn ce-btn-primary">Sign in</button><a class="ce-link" href="${GASGX_EXTENSION_CONTACT_URL}" target="_blank" rel="noreferrer">Open GasGx</a></div></form>`}
      </div>`;
    const form = document.getElementById("ce-gasgx-sign-in-form");
    form?.addEventListener("submit", (event) => { void handleGasGxPopupSignInSubmit(event); });
    const switchAccountBtn = document.getElementById("ce-gasgx-switch-account");
    switchAccountBtn?.addEventListener("click", () => { void handleGasGxPopupSignOut(); });
    renderGasGxPopupAccountPanel();
  }

  async function refreshGasGxSignedOutRuntimeCache() {
    const signedOut = await loadGasGxSignedOutFlag();
    const previous = gasgxSignedOutCache;
    gasgxSignedOutCache = signedOut;
    gasgxSignedOutCacheReady = true;
    if (!signedOut) return signedOut;

    const current = getCurrentGasGxAuthSnapshot();
    if (!previous || isGasGxExtensionEnabled(current) || current.status !== "anonymous") {
      setGasGxSignedOutRuntimeSnapshot(current);
    }
    return signedOut;
  }

  function showGasGxSignedOutCommentGuardHint() {
    const now = Date.now();
    if (now - gasgxCommentGuardHintAt < 1400) return;
    gasgxCommentGuardHintAt = now;
    showAutoSendDebugHint(getGasGxCommentBlockedMessage(buildGasGxSignedOutSnapshot()));
  }

  function findCommentActionTriggerElement(startNode) {
    const target = startNode && typeof startNode.closest === "function" ? startNode : null;
    if (!target) return null;
    const control = target.closest("button, [role='button'], a");
    if (!control) return null;
    if (control.closest(`#${GASGX_AUTH_OVERLAY_ID}, #${GASGX_ACCOUNT_PANEL_ID}, #ce-popup-root`)) return null;

    const className = sparkToString(control.className, "").toLowerCase();
    const dataViewName = sparkToString(control.getAttribute?.("data-view-name"), "").toLowerCase();
    const dataControlName = sparkToString(control.getAttribute?.("data-control-name"), "").toLowerCase();
    const ariaLabel = sparkToString(control.getAttribute?.("aria-label"), "").toLowerCase();
    const title = sparkToString(control.getAttribute?.("title"), "").toLowerCase();
    const text = sparkToString(control.textContent, "").toLowerCase();
    const keywordText = `${dataViewName} ${dataControlName} ${ariaLabel} ${title} ${text}`;
    const hasCommentKeyword = /(comment|reply|评论|回覆|回復|回复|評論)/i.test(keywordText);
    const inCommentScope = !!control.closest(".feed-shared-social-action-bar, .comments-comment-box, .comments-comment-item, .comments-comments-list, [data-view-name='comments-module']");
    const knownCommentControl = (
      dataViewName.includes("comment-post")
      || dataViewName.includes("reply")
      || dataControlName.includes("comment")
      || dataControlName.includes("reply")
      || className.includes("comments-comment-box__submit-button")
      || className.includes("feed-shared-social-action-bar__action-button")
    );
    if (!inCommentScope) return null;
    if (knownCommentControl || hasCommentKeyword) return control;
    return null;
  }

  function findCommentEditorElement(startNode) {
    const target = startNode && typeof startNode.closest === "function" ? startNode : null;
    if (!target) return null;
    const editor = target.closest("[contenteditable='true'], [contenteditable='plaintext-only']");
    if (!editor) return null;
    if (!editor.closest(".comments-comment-box, .comments-comment-item, form, [data-view-name='comment-post'], [data-view-name='comments-module']")) {
      return null;
    }
    const className = sparkToString(editor.className, "").toLowerCase();
    const ariaLabel = sparkToString(editor.getAttribute?.("aria-label"), "").toLowerCase();
    const placeholder = sparkToString(editor.getAttribute?.("data-placeholder"), "").toLowerCase();
    const text = `${className} ${ariaLabel} ${placeholder}`;
    if (/(comment|reply|评论|回覆|回復|回复|評論)/i.test(text) || className.includes("ql-editor")) {
      return editor;
    }
    return null;
  }

  function blockCommentInteractionWhileSignedOut(event) {
    if (isPopupContext()) return;
    if (!gasgxSignedOutCacheReady || !gasgxSignedOutCache) return;
    const target = event?.target && typeof event.target === "object" ? event.target : null;
    if (!target || typeof target.closest !== "function") return;

    const actionControl = findCommentActionTriggerElement(target);
    const commentEditor = actionControl ? null : findCommentEditorElement(target);
    if (!actionControl && !commentEditor) return;

    if (event.cancelable) {
      event.preventDefault();
    }
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
    event.stopPropagation?.();
    try {
      (actionControl || commentEditor || target).blur?.();
    } catch (_err) {}
    showGasGxSignedOutCommentGuardHint();
  }

  function setupGasGxSignedOutCommentGuard() {
    if (isPopupContext() || window.__ceGasGxSignedOutCommentGuardPatched) return;
    const captureHandler = (event) => {
      try {
        blockCommentInteractionWhileSignedOut(event);
      } catch (_err) {}
    };
    const enterKeyHandler = (event) => {
      if (!gasgxSignedOutCacheReady || !gasgxSignedOutCache) return;
      if (sparkToString(event?.key, "") !== "Enter") return;
      try {
        const target = event?.target && typeof event.target === "object" ? event.target : null;
        if (!findCommentEditorElement(target)) return;
      } catch (_err) {
        return;
      }
      if (event.cancelable) {
        event.preventDefault();
      }
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      event.stopPropagation?.();
      showGasGxSignedOutCommentGuardHint();
    };
    document.addEventListener("pointerdown", captureHandler, true);
    document.addEventListener("mousedown", captureHandler, true);
    document.addEventListener("click", captureHandler, true);
    document.addEventListener("keydown", enterKeyHandler, true);
    Object.defineProperty(window, "__ceGasGxSignedOutCommentGuardPatched", {
      value: true,
      configurable: true
    });
  }

  function setupGasGxAuthStorageRuntimeWatch() {
    const storageChanges = chrome?.storage?.onChanged;
    if (!storageChanges?.addListener || storageChanges.__ceGasGxAuthWatchPatched) return;
    storageChanges.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes || typeof changes !== "object") return;
      const hasSignedOutChange = sparkHasOwn(changes, GASGX_SIGNED_OUT_FLAG_KEY);
      const hasAuthChange = sparkHasOwn(changes, GASGX_AUTH_STORAGE_KEY)
        || sparkHasOwn(changes, GASGX_LOCAL_SIGNED_IN_KEY)
        || sparkHasOwn(changes, GASGX_LOGIN_STATE_KEY);
      if (!hasSignedOutChange && !hasAuthChange) return;

      if (hasSignedOutChange) {
        const nextSignedOut = normalizeFeatureToggle(changes?.[GASGX_SIGNED_OUT_FLAG_KEY]?.newValue, false);
        gasgxSignedOutCache = nextSignedOut;
        gasgxSignedOutCacheReady = true;
        if (nextSignedOut) {
          setGasGxSignedOutRuntimeSnapshot(getCurrentGasGxAuthSnapshot());
        }
      }

      if (hasAuthChange) {
        gasgxAuthState.loaded = false;
      }
      void ensureGasGxAuthSnapshotLoaded(true).then((snapshot) => {
        gasgxSignedOutCache = snapshot.status === "anonymous";
        gasgxSignedOutCacheReady = true;
      }).catch(() => {});
    });
    Object.defineProperty(storageChanges, "__ceGasGxAuthWatchPatched", {
      value: true,
      configurable: true
    });
  }

  function initContentContext() {
    const run = async () => {
      try {
        ensureGasGxPopupStyles();
        patchLegacyContentBundleBehavior();
        await refreshGasGxSignedOutRuntimeCache();
        await syncGasGxDerivedStorage();
        suppressGateToastApis();
        hideGateToasts();
      } catch (_err) {
        // Keep content script resilient.
      }
    };

    setupGasGxAuthStorageRuntimeWatch();
    setupGasGxSignedOutCommentGuard();
    void run();

    if (document.body) {
      const observer = new MutationObserver(() => {
        void run();
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    setInterval(() => {
      void run();
    }, 600);
  }

  function initPopupContext() {
    const applyPopupShellTheme = (mode) => {
      currentMode = normalizeTheme(mode);
      document.documentElement.setAttribute("data-theme", currentMode);
      localStorage.setItem(MODE_KEY, currentMode);
      return currentMode;
    };

    const applyPopupShellLanguage = (lang) => {
      currentLang = normalizeLang(lang);
      document.documentElement.setAttribute("data-lang", currentLang);
      localStorage.setItem(LANG_KEY, currentLang);
      return currentLang;
    };

    const resolvePopupAuthSnapshot = async () => {
      const [persisted, signedOut, localSignedIn, loginState] = await Promise.all([
        loadPersistedGasGxAuthSnapshot(),
        loadGasGxSignedOutFlag(),
        loadGasGxLocalSignedInFlag(),
        loadGasGxLoginState()
      ]);
      const restoredSnapshot = sanitizeGasGxAuthSnapshot({
        ...persisted,
        status: (loginState || localSignedIn) ? "enabled" : persisted?.status,
        profileEnabled: (loginState || localSignedIn) ? true : persisted?.profileEnabled,
        plan: sparkToString(persisted?.plan, "").trim() || ((loginState || localSignedIn) ? "GasGx" : "")
      });
      const persistedHasSessionEvidence = hasUsableLocalGasGxAuth(restoredSnapshot, localSignedIn);
      if (signedOut) {
        const anonymous = sanitizeGasGxAuthSnapshot({
          ...getDefaultGasGxAuthSnapshot(),
          email: sparkToString(persisted?.email, "").trim()
        });
        gasgxAuthState.snapshot = anonymous;
        gasgxAuthState.loaded = true;
        return anonymous;
      }

      const hasPersistedAuth = !signedOut && (loginState || persistedHasSessionEvidence);

      if (hasPersistedAuth) {
        if (!loginState) {
          await persistGasGxLoginState(true);
        }
        if (!localSignedIn) {
          await persistGasGxLocalSignedInFlag(true);
        }
        const validatedRestored = await validatePersistedGasGxAuthSnapshot(restoredSnapshot);
        gasgxAuthState.snapshot = validatedRestored;
        gasgxAuthState.loaded = true;
        return validatedRestored;
      }

      const nextSnapshot = signedOut
        ? sanitizeGasGxAuthSnapshot({
          ...getDefaultGasGxAuthSnapshot(),
          email: sparkToString(persisted?.email, "").trim()
        })
        : await validatePersistedGasGxAuthSnapshot(persisted);
      gasgxAuthState.snapshot = nextSnapshot;
      gasgxAuthState.loaded = true;
      return nextSnapshot;
    };

    const loadPopupState = async () => {
      const authSnapshot = await resolvePopupAuthSnapshot();
      await Promise.all([
        loadAutoSendDelayRange(),
        loadRandomStrategySettings(),
        loadReplyPromptHint()
      ]).catch(() => {});
      void syncGasGxDerivedStorage().catch(() => {});

      const [preferences, linkedInProfile, linkedInUiLanguage] = await Promise.all([
        loadLegacyPreferences(),
        probeActiveLinkedInProfile(),
        probeActiveLinkedInPageLanguage()
      ]);

      if (linkedInUiLanguage && linkedInUiLanguage !== currentLang) {
        applyPopupShellLanguage(linkedInUiLanguage);
      }

      return {
        themeMode: currentMode,
        lang: currentLang,
        linkedInProfile,
        gasgxAuth: sanitizeGasGxAuthSnapshot(authSnapshot),
        preferences,
        randomStrategy: {
          randomToneEnabled: !!randomToneEnabled,
          randomLengthEnabled: !!randomLengthEnabled
        },
        autoSend: {
          enabled: !!autoSendEnabled,
          minSec: autoSendDelayMinSec,
          maxSec: autoSendDelayMaxSec
        },
        replyHint: replyPromptHint || ""
      };
    };

    const ensurePopupGasGxVerified = async () => {
      const snapshot = await resolvePopupAuthSnapshot();
      if (isGasGxExtensionEnabled(snapshot)) return snapshot;
      throw new Error(currentLang === "zh-CN"
        ? "请先完成一次 GasGx 登录验证，然后再使用扩展功能。"
        : "Please complete one-time GasGx login verification before using extension features.");
    };

    const verifyGasGxLoginOnce = async (email, password) => {
      try {
        const sessionPayload = await signInWithGasGxPassword(email, password);
        const signedIn = await buildGasGxSnapshotFromSession(sessionPayload);
        const verified = sanitizeGasGxAuthSnapshot({
          ...signedIn,
          status: "enabled",
          plan: sparkToString(signedIn?.plan, "").trim() || "GasGx",
          profileEnabled: true,
          errorMessage: "",
          lastValidatedAt: Date.now()
        });
        await persistGasGxSignedOutFlag(false);
        await persistGasGxLocalSignedInFlag(true);
        await persistGasGxAuthSnapshot(verified);
        await persistGasGxLoginState(true);
        await syncGasGxDerivedStorage();
      } catch (error) {
        await persistGasGxSignedOutFlag(false);
        await persistGasGxLocalSignedInFlag(false);
        await persistGasGxLoginState(false);
        await persistGasGxAuthSnapshot(buildGasGxAuthErrorSnapshot(getCurrentGasGxAuthSnapshot(), error?.message));
        throw error;
      }
      await ensureGasGxAuthSnapshotLoaded(true);
      const nextState = await loadPopupState();
      if (!isGasGxExtensionEnabled(nextState?.gasgxAuth)) {
        const reason = sparkToString(nextState?.gasgxAuth?.errorMessage, "").trim();
        const stateHint = sparkToString(nextState?.gasgxAuth?.status, "unknown");
        const [signedOutNow, loginStateNow, localSignedNow, persistedNow] = await Promise.all([
          loadGasGxSignedOutFlag(),
          loadGasGxLoginState(),
          loadGasGxLocalSignedInFlag(),
          loadPersistedGasGxAuthSnapshot()
        ]);
        const hasTokenNow = !!(
          sparkToString(persistedNow?.accessToken, "").trim()
          || sparkToString(persistedNow?.refreshToken, "").trim()
        );
        const debugHint = `status=${stateHint}, signedOut=${signedOutNow}, loginState=${loginStateNow}, localSignedIn=${localSignedNow}, hasToken=${hasTokenNow}`;
        throw new Error(reason || (currentLang === "zh-CN"
          ? `登录结果无效，请重新登录。(${debugHint})`
          : `Login result is invalid. Please sign in again. (${debugHint})`));
      }
      return nextState;
    };

    const saveRandomStrategy = async (next) => {
      await ensurePopupGasGxVerified();
      const patch = next && typeof next === "object" ? next : {};
      randomToneEnabled = normalizeFeatureToggle(patch.randomToneEnabled, randomToneEnabled);
      randomLengthEnabled = normalizeFeatureToggle(patch.randomLengthEnabled, randomLengthEnabled);
      await persistRandomStrategySettings();
      return {
        randomToneEnabled: !!randomToneEnabled,
        randomLengthEnabled: !!randomLengthEnabled
      };
    };

    const saveAutoSend = async (next) => {
      await ensurePopupGasGxVerified();
      const patch = next && typeof next === "object" ? next : {};
      autoSendEnabled = normalizeAutoSendEnabled(
        sparkHasOwn(patch, "enabled") ? patch.enabled : autoSendEnabled
      );
      setAutoSendDelayRange(
        sparkHasOwn(patch, "minSec") ? patch.minSec : autoSendDelayMinSec,
        sparkHasOwn(patch, "maxSec") ? patch.maxSec : autoSendDelayMaxSec
      );
      await persistAutoSendSettings();
      return {
        enabled: !!autoSendEnabled,
        minSec: autoSendDelayMinSec,
        maxSec: autoSendDelayMaxSec
      };
    };

    const saveReplyHint = async (value) => {
      await ensurePopupGasGxVerified();
      replyPromptHint = normalizeReplyPromptHint(value);
      await persistReplyPromptHint();
      return replyPromptHint;
    };

    const openGasGx = async () => {
      if (chrome?.tabs?.create) {
        return await chrome.tabs.create({ url: GASGX_EXTENSION_CONTACT_URL });
      }
      window.open(GASGX_EXTENSION_CONTACT_URL, "_blank", "noopener,noreferrer");
      return null;
    };

    const signOutGasGx = async () => {
      gasgxDerivedStorageLastRunAt = 0;
      gasgxDerivedStorageLastSignature = "";
      await handleGasGxPopupSignOut();
      return await loadPopupState();
    };

    const subscribeAuthChanged = (callback) => {
      if (typeof callback !== "function") return () => {};
      const listener = () => {
        void loadPopupState().then((state) => callback(state)).catch(() => {});
      };
      window.addEventListener(GASGX_AUTH_CHANGED_EVENT, listener);
      return () => window.removeEventListener(GASGX_AUTH_CHANGED_EVENT, listener);
    };

    applyPopupShellTheme(currentMode);
    applyPopupShellLanguage(currentLang);
    void persistPopupFirstRunFlags();
    window.__cePopupRuntime = {
      loadState: loadPopupState,
      setTheme: async (mode) => applyPopupShellTheme(mode),
      setLanguage: async (lang) => applyPopupShellLanguage(lang),
      savePreferences: async (patch) => {
        await ensurePopupGasGxVerified();
        return await persistLegacyPreferences(patch);
      },
      saveRandomStrategy,
      saveAutoSend,
      saveReplyHint,
      openGasGx,
      verifyGasGxLoginOnce,
      signOutGasGx,
      subscribeAuthChanged
    };
    void syncGasGxDerivedStorage().catch(() => {});
  }

  void syncGasGxDerivedStorage();
  if (!isPopupContext()) {
    setInterval(() => {
      void syncGasGxDerivedStorage();
    }, 60_000);
  }

  setupAutoSendDelayRuntime();
  setupRandomStrategyRuntime();
  setupReplyPromptHintRuntime();
  setupSparkRuntime();
  installPopupExecuteScriptPatch();
  installPopupLegacyXhrMock();

  if (!isPopupContext()) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initContentContext);
    } else {
      initContentContext();
    }
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPopupContext);
  } else {
    initPopupContext();
  }
})();








