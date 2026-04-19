(() => {
  "use strict";

  const ACCOUNT_KEY = "account";
  const UI_KEY = "ui";
  const MODE_KEY = "commentron_theme_mode";
  const LANG_KEY = "commentron_language";
  const BRAND_TITLE = "LinkedIn Automatic Comments";
  const THEMES = ["dark", "light"];
  const LANGUAGES = ["en", "zh-CN"];
  const JSON_PARSE_PATCH_FLAG = "__ceJsonParsePatched";
  const AUTO_SEND_ENABLED_KEY = "ce_auto_send_enabled";
  const DELAY_MIN_SEC_KEY = "ce_auto_send_delay_min_sec";
  const DELAY_MAX_SEC_KEY = "ce_auto_send_delay_max_sec";
  const RANDOM_TONE_ENABLED_KEY = "ce_random_tone_enabled";
  const RANDOM_LENGTH_ENABLED_KEY = "ce_random_length_enabled";
  const REPLY_PROMPT_HINT_KEY = "ce_reply_prompt_hint";
  const DEFAULT_AUTO_SEND_ENABLED = true;
  const DEFAULT_DELAY_MIN_SEC = 2;
  const DEFAULT_DELAY_MAX_SEC = 7;
  const DEFAULT_RANDOM_TONE_ENABLED = false;
  const DEFAULT_RANDOM_LENGTH_ENABLED = false;
  const DEFAULT_REPLY_PROMPT_HINT = "";
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
  const GASGX_MAIN_SITE_STORAGE_KEY = "gasgx-main-auth";
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
  const GATE_TEXT_PATTERN = /(free\s*trial|max(?:imum)?\s*usage|maximum\s*usage\s*allowed|upgrade|subscribe|already\s*a\s*subscriber|reached\s*the\s*maximum\s*usage|active\s*commentron\s*subscription|you\s*don.?t\s*have\s*an\s*active\s*commentron\s*subscription|sign-?in\s+using\s+the\s+extension\s+window|newer\s*commentron\s*version|please\s*update\s*commentron|update\s*commentron)/i;

  let autoSendEnabled = DEFAULT_AUTO_SEND_ENABLED;
  let autoSendDelayMinSec = DEFAULT_DELAY_MIN_SEC;
  let autoSendDelayMaxSec = DEFAULT_DELAY_MAX_SEC;
  let randomToneEnabled = DEFAULT_RANDOM_TONE_ENABLED;
  let randomLengthEnabled = DEFAULT_RANDOM_LENGTH_ENABLED;
  let replyPromptHint = DEFAULT_REPLY_PROMPT_HINT;
  let sparkConfigPromise = null;
  const ORIGINAL_STORAGE_GETTERS = new WeakMap();
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
    const raw = preferences?.commentLength;
    if (typeof raw === "number") return raw;
    if (typeof raw === "string") {
      if (/super\s*short|supershort/i.test(raw)) return 1;
      if (/brief/i.test(raw)) return 2;
      if (/concise|in-?length|inlength|in\s*length/i.test(raw)) return 3;
      if (/multi|detailed/i.test(raw)) return 5;
    }
    return 3;
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
    return pickRandomItem([1, 2, 3, 4, 5], current);
  }

  function resolveCommentGenerationProfile(preferences) {
    const pref = sparkIsPlainObject(preferences) ? preferences : {};
    return {
      tone: resolveCommentTone(pref),
      length: resolveEffectiveCommentLength(pref)
    };
  }

  function normalizeSparkOutput(text) {
    return sparkToString(text, "")
      .replace(/^\s*```(?:json|text)?/i, "")
      .replace(/```\s*$/i, "")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
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

  function resolveCommentWordLimit(preferences) {
    const level = resolveCommentLength(preferences);
    if (level <= 1) return 18;
    if (level === 2) return 30;
    if (level === 3) return 45;
    if (level === 4) return 70;
    return 120;
  }

  function resolveReplyWordLimit(preferences) {
    const pref = sparkIsPlainObject(preferences) ? preferences : {};
    const keepShort = pref.replyKeepItShort !== false;
    if (keepShort) return 40;
    return 80;
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

  function splitSentences(text) {
    const normalized = sparkToString(text, "").replace(/\s+/g, " ").trim();
    if (!normalized) return [];
    return normalized
      .split(/(?<=[.!?。！？])\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function ensureThreeParagraphs(text) {
    const normalized = normalizeSparkOutput(text);
    if (!normalized) return normalized;
    const existing = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    if (existing.length >= 3) return existing.join("\n\n");

    const sentences = splitSentences(normalized);
    if (sentences.length >= 3) {
      return [sentences[0], sentences[1], sentences.slice(2).join(" ")].filter(Boolean).join("\n\n");
    }

    const base = normalized.replace(/\n+/g, " ").trim();
    return [base, "I especially appreciate the practical execution details.", "Looking forward to the next milestone updates."].join("\n\n");
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
    let out = normalizeSparkOutput(text);
    if (!out) return out;

    const commentWordLimit = resolveCommentWordLimit(pref);
    out = truncateToWords(out, commentWordLimit);

    if (isEnabledLike(pref.commentMentionPostAuthor)) {
      out = ensureMentionPrefix(out, author);
    }

    out = enforceEmojiByPreference(out, pref);
    if (isEmojiPreferenceEnabled(pref) && length >= 5) {
      out = ensureThreeParagraphs(out);
      out = ensureMultiEmoji(out, 3);
    }

    if (isEnabledLike(pref.commentEndWithQuestion)) {
      out = ensureQuestionEnding(out);
    }

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

    return normalizeSparkOutput(out);
  }

  function buildCommentPrompt(input) {
    const pref = sparkIsPlainObject(input?.preferences) ? input.preferences : {};
    const profile = sparkIsPlainObject(input?.__ceGenerationProfile) ? input.__ceGenerationProfile : {};
    const length = Number(profile.length) || resolveEffectiveCommentLength(pref);
    const useEnglish = !!pref.engageInEnglish;
    const mentionAuthor = !!pref.commentMentionPostAuthor;
    const useEmoji = !!pref.commentUseEmojis;
    const endQuestion = !!pref.commentEndWithQuestion;
    const tone = sparkToString(profile.tone, resolveCommentTone(pref));
    const author = sparkToString(input?.postAuthor, "").trim();
    const postText = sparkToString(input?.postText, "").trim();

    const lengthGuide = length >= 5
      ? "Write at least 3 short paragraphs with meaningful details."
      : length >= 4
        ? "Write one medium-length paragraph with concrete points."
        : length <= 2
          ? "Write a short but specific comment in 1-2 sentences."
          : "Write a concise comment in about 2-3 sentences.";

    const languageGuide = useEnglish
      ? "Use English."
      : "Use the same language as the original post.";

    return {
      systemPrompt: "You are an expert LinkedIn engagement writer. Return only the final comment text.",
      prompt:
`Write a high-quality LinkedIn comment.
Rules:
- Be specific and insightful, avoid generic filler.
- Do not copy the original post sentence by sentence.
- No markdown code blocks, no quotes, no explanations.
- Tone: ${tone}.
- ${lengthGuide}
- ${languageGuide}
- ${mentionAuthor && author ? `Start with @${author} naturally.` : "Do not force @mentions."}
- ${useEmoji ? (length >= 5 ? "Use emojis in multiple places across the comment (at least 3 total)." : "Use emojis in multiple places (at least 2 total).") : "Do not use emoji."}
- ${endQuestion ? "End with one natural question." : "Do not force a question ending."}

Post author: ${author || "(unknown)"}
Post content:
${postText || "(empty)"}`
    };
  }

  function buildReplyPrompt(input) {
    const pref = sparkIsPlainObject(input?.preferences) ? input.preferences : {};
    const useEnglish = !!pref.engageInEnglish;
    const keepShort = pref.replyKeepItShort !== false;
    const endQuestion = !!pref.replyEndWithQuestion;
    const ackMyPost = !!pref.replyAckIfMyPost;
    const tone = sparkToString(pref.commentTone, "Professional");
    const postAuthor = sparkToString(input?.postAuthor, "").trim();
    const postText = sparkToString(input?.postText, "").trim();
    const commentText = sparkToString(input?.commentText, "").trim();
    const me = sparkToString(input?.me, "").trim();

    const languageGuide = useEnglish
      ? "Use English."
      : "Use the same language as the thread.";

    return {
      systemPrompt: "You are an expert LinkedIn conversation assistant. Return only the final reply text.",
      prompt:
`Write a LinkedIn reply to an existing comment.
Rules:
- Keep the reply natural and context-aware.
- Do not repeat the same sentence patterns.
- No markdown code blocks, no quotes, no explanations.
- Tone: ${tone}.
- ${keepShort ? "Keep it brief (<= 40 words)." : "You may use up to 80 words."}
- ${languageGuide}
- ${endQuestion ? "End with one natural question." : "No forced question ending."}
- ${ackMyPost ? "If this is my own post context, prioritize acknowledgment first." : "Do not over-emphasize acknowledgment."}

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
    const useEnglish = !!pref.engageInEnglish;
    const author = sparkToString(input?.postAuthor, "").trim();
    const mention = isEnabledLike(pref.commentMentionPostAuthor) && author ? `@${author} ` : "";
    const length = Number(profile?.length) || resolveEffectiveCommentLength(pref);

    if (useEnglish) {
      const p1 = `${mention}Thanks for sharing this update. I appreciate the clear perspective.`;
      const p2 = "One valuable takeaway is how this can be translated into practical, day-to-day execution.";
      const p3 = "Would love to see one concrete follow-up example in your next update.";
      if (length >= 5) return `${p1}\n\n${p2}\n\n${p3}`;
      if (length <= 2) return `${p1}`;
      return `${p1} ${p2}`;
    }

    const p1 = `${mention}感谢你的分享，这个观点很有启发。`;
    const p2 = "我很认同其中强调的实践价值，落地层面也很有参考意义。";
    const p3 = "如果方便的话，也期待你后续补充一个更具体的案例。";
    if (length >= 5) return `${p1}\n\n${p2}\n\n${p3}`;
    if (length <= 2) return `${p1}`;
    return `${p1}${p2}`;
  }

  function buildReplyFallbackText(input) {
    const pref = sparkIsPlainObject(input?.preferences) ? input.preferences : {};
    const useEnglish = !!pref.engageInEnglish;
    const keepShort = pref.replyKeepItShort !== false;
    if (useEnglish) {
      return keepShort
        ? "Thanks for your thoughtful comment. Really appreciate your perspective."
        : "Thanks for your thoughtful comment. I really appreciate your perspective and the constructive angle you added here.";
    }
    return keepShort
      ? "感谢你的评论，很有价值。"
      : "感谢你的评论，很有价值，也给了我新的思考角度。";
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
      const safeInput = input || {};
      const profile = resolveCommentGenerationProfile(safeInput.preferences);
      const prompt = buildCommentPrompt({
        ...safeInput,
        __ceGenerationProfile: profile
      });
      let text = "";
      try {
        text = await callSparkModel({
          ...prompt,
          timeoutMs: 35000
        });
      } catch (_err) {
        text = buildCommentFallbackText(safeInput, profile);
      }
      return enforceCommentByPreference(text, {
        ...safeInput,
        __ceEffectiveLength: profile.length
      });
    };
    window.__ceSparkGenerateReply = async (input) => {
      const prompt = buildReplyPrompt(input || {});
      let text = "";
      try {
        text = await callSparkModel({
          ...prompt,
          timeoutMs: 35000
        });
      } catch (_err) {
        text = buildReplyFallbackText(input || {});
      }
      return enforceReplyByPreference(text, input || {});
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

  function parseStoredAccount(raw) {
    if (!raw) return {};
    if (typeof raw === "string") {
      try {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
      } catch (_err) {
        return {};
      }
      return {};
    }
    if (typeof raw === "object" && !Array.isArray(raw)) return raw;
    return {};
  }

  function stringifyStoredAccount(account) {
    try {
      return JSON.stringify(account ?? {});
    } catch (_err) {
      return "{}";
    }
  }


  function parseStoredObject(raw, fallback = {}) {
    if (!raw) return { ...fallback };
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return { ...fallback, ...parsed };
        }
      } catch (_err) {
        return { ...fallback };
      }
      return { ...fallback };
    }
    if (typeof raw === "object" && !Array.isArray(raw)) {
      return { ...fallback, ...raw };
    }
    return { ...fallback };
  }

  function stringifyStoredObject(value) {
    try {
      return JSON.stringify(value ?? {});
    } catch (_err) {
      return "{}";
    }
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
    return snapshot.status === "enabled" && !!snapshot.profileEnabled && !!snapshot.accessToken;
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
      subscriberId: snapshot.userId || existing.subscriberId || TEST_SUBSCRIBER_ID,
      email: snapshot.email || existing.email || "",
      password: "",
      plan: snapshot.plan || "GasGx Enabled",
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
      isSignInVisible: !enabled,
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
    dispatchGasGxAuthChanged(next);
    return next;
  }

  async function loadPersistedGasGxAuthSnapshot() {
    const storage = chrome?.storage?.local;
    if (!storage) return getDefaultGasGxAuthSnapshot();
    const raw = await rawStorageGet(storage, GASGX_AUTH_STORAGE_KEY);
    gasgxLastPersistedSnapshotRaw = sparkToString(raw?.[GASGX_AUTH_STORAGE_KEY], "");
    return sanitizeGasGxAuthSnapshot(parseStoredObject(raw?.[GASGX_AUTH_STORAGE_KEY], getDefaultGasGxAuthSnapshot()));
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

  async function fetchGasGxProfileEntitlement(accessToken, userId) {
    const query = new URLSearchParams({
      select: "id,linkedin_extension_enabled,linkedin_extension_plan,linkedin_extension_enabled_at",
      id: `eq.${userId}`,
      limit: "1"
    });
    const payload = await supabaseFetchJson(`/rest/v1/profiles?${query.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const row = Array.isArray(payload) ? payload[0] : null;
    if (!row || typeof row !== "object") {
      return { enabled: false, plan: "", enabledAt: "" };
    }
    return {
      enabled: !!row.linkedin_extension_enabled,
      plan: sparkToString(row.linkedin_extension_plan, "").trim(),
      enabledAt: sparkToString(row.linkedin_extension_enabled_at, "").trim()
    };
  }

  async function fetchGasGxUser(accessToken) {
    const payload = await supabaseFetchJson("/auth/v1/user", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const user = payload && typeof payload === "object" ? payload : {};
    return {
      id: sparkToString(user.id, "").trim(),
      email: sparkToString(user.email, "").trim()
    };
  }

  async function signInWithGasGxPassword(email, password) {
    const normalizedEmail = sparkToString(email, "").trim().toLowerCase();
    const normalizedPassword = sparkToString(password, "");
    if (!normalizedEmail || !normalizedPassword) {
      throw new Error("Please enter your GasGx email and password.");
    }
    return await supabaseFetchJson("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword })
    });
  }

  async function refreshGasGxSession(refreshToken) {
    const token = sparkToString(refreshToken, "").trim();
    if (!token) throw new Error("Missing refresh token.");
    return await supabaseFetchJson("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: token })
    });
  }

  async function tryImportGasGxSessionFromOpenTabs() {
    const tabsApi = chrome?.tabs;
    const scriptingApi = chrome?.scripting;
    if (!tabsApi?.query || !scriptingApi?.executeScript) return null;

    const tabs = await new Promise((resolve) => {
      try {
        tabsApi.query({}, (items) => resolve(Array.isArray(items) ? items : []));
      } catch (_err) {
        resolve([]);
      }
    });

    for (const tab of tabs) {
      const tabId = Number(tab?.id);
      if (!Number.isInteger(tabId)) continue;
      let results = null;
      try {
        results = await scriptingApi.executeScript({
          target: { tabId },
          func: (storageKey) => {
            try {
              const raw = window.localStorage.getItem(storageKey);
              return {
                href: window.location.href,
                raw
              };
            } catch (_err) {
              return null;
            }
          },
          args: [GASGX_MAIN_SITE_STORAGE_KEY]
        });
      } catch (_err) {
        results = null;
      }

      const payload = Array.isArray(results) ? results[0]?.result : null;
      const raw = sparkToString(payload?.raw, "").trim();
      if (!raw) continue;

      const parsed = parseStoredObject(raw, null);
      if (!parsed || typeof parsed !== "object") continue;
      const accessToken = sparkToString(parsed.access_token, "").trim();
      const refreshToken = sparkToString(parsed.refresh_token, "").trim();
      if (!accessToken && !refreshToken) continue;
      return parsed;
    }

    return null;
  }

  async function clearGasGxAuthSnapshot() {
    return await persistGasGxAuthSnapshot(getDefaultGasGxAuthSnapshot());
  }

  async function buildGasGxSnapshotFromSession(sessionPayload) {
    const accessToken = sparkToString(sessionPayload?.access_token, "").trim();
    const refreshToken = sparkToString(sessionPayload?.refresh_token, "").trim();
    const expiresAt = Math.max(0, Math.floor(sparkToNumber(sessionPayload?.expires_at, 0) || (Date.now() / 1000) + sparkToNumber(sessionPayload?.expires_in, 0)));
    const userFromSession = sessionPayload?.user && typeof sessionPayload.user === "object" ? sessionPayload.user : {};
    const userId = sparkToString(userFromSession.id, "").trim();
    const userEmail = sparkToString(userFromSession.email, "").trim();
    const user = userId && userEmail ? { id: userId, email: userEmail } : await fetchGasGxUser(accessToken);
    const entitlement = await fetchGasGxProfileEntitlement(accessToken, user.id);
    return sanitizeGasGxAuthSnapshot({
      status: entitlement.enabled ? "enabled" : "signed_in_but_not_enabled",
      userId: user.id,
      email: user.email,
      plan: entitlement.plan || "",
      profileEnabled: entitlement.enabled,
      enabledAt: entitlement.enabledAt || "",
      accessToken,
      refreshToken,
      sessionExpiresAt: expiresAt * 1000,
      errorMessage: "",
      lastValidatedAt: Date.now()
    });
  }

  async function validatePersistedGasGxAuthSnapshot(snapshot) {
    const current = sanitizeGasGxAuthSnapshot(snapshot);
    if (!current.refreshToken && !current.accessToken) {
      const importedSession = await tryImportGasGxSessionFromOpenTabs();
      if (importedSession) {
        return await buildGasGxSnapshotFromSession(importedSession);
      }
      return getDefaultGasGxAuthSnapshot();
    }
    try {
      const now = Date.now();
      let sessionPayload = {
        access_token: current.accessToken,
        refresh_token: current.refreshToken,
        expires_at: Math.floor(current.sessionExpiresAt / 1000),
        user: { id: current.userId, email: current.email }
      };
      const willExpireSoon = !current.accessToken || !current.sessionExpiresAt || current.sessionExpiresAt <= now + 60000;
      if (willExpireSoon) {
        sessionPayload = await refreshGasGxSession(current.refreshToken);
      }
      return await buildGasGxSnapshotFromSession(sessionPayload);
    } catch (error) {
      return sanitizeGasGxAuthSnapshot({
        ...getDefaultGasGxAuthSnapshot(),
        status: "auth_error",
        errorMessage: sparkToString(error?.message, "GasGx authentication failed.").trim()
      });
    }
  }

  async function ensureGasGxAuthSnapshotLoaded(forceRefresh = false) {
    if (!forceRefresh && gasgxAuthState.loaded && gasgxAuthState.snapshot) return gasgxAuthState.snapshot;
    if (!forceRefresh && gasgxAuthState.loadingPromise) return await gasgxAuthState.loadingPromise;
    gasgxAuthState.loadingPromise = (async () => {
      const persisted = await loadPersistedGasGxAuthSnapshot();
      const validated = await validatePersistedGasGxAuthSnapshot(persisted);
      return await persistGasGxAuthSnapshot(validated);
    })();
    try {
      return await gasgxAuthState.loadingPromise;
    } finally {
      gasgxAuthState.loadingPromise = null;
    }
  }

  function normalizeStorageShape(result, area) {
    if (!result || typeof result !== "object") return result;

    let changed = false;
    const patchPayload = {};
    const patched = { ...result };
    const authSnapshot = getCurrentGasGxAuthSnapshot();

    for (const key of Object.keys(patched)) {
      const rawValue = patched[key];
      let normalizedValue = rawValue;

      if (key === ACCOUNT_KEY) {
        const existingAccount = parseStoredAccount(rawValue);
        normalizedValue = stringifyStoredAccount(
          isGasGxExtensionEnabled(authSnapshot)
            ? buildEnabledAccount(authSnapshot, existingAccount)
            : buildLockedAccount(authSnapshot)
        );
      } else if (key === UI_KEY) {
        normalizedValue = stringifyStoredObject(deriveUiState(parseStoredObject(rawValue, DEFAULT_UI_STATE), authSnapshot));
      } else if (rawValue && typeof rawValue === "object") {
        try {
          normalizedValue = JSON.stringify(rawValue);
        } catch (_err) {
          normalizedValue = rawValue;
        }
      }

      if (normalizedValue !== rawValue) {
        patched[key] = normalizedValue;
        patchPayload[key] = normalizedValue;
        changed = true;
      }
    }

    if (changed) {
      try {
        area?.set?.(patchPayload, () => {});
      } catch (_err) {}
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
          await ensureGasGxAuthSnapshotLoaded();
          const raw = await rawStorageGet(area, keys);
          return normalizeStorageShape(raw || {}, area);
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

  const STORAGE_AREAS = [];
  patchGlobalJsonParse();
  if (typeof chrome !== "undefined" && chrome.storage) {
    if (chrome.storage.local) {
      patchStorageAreaGet(chrome.storage.local);
      STORAGE_AREAS.push(chrome.storage.local);
    }
    if (chrome.storage.sync) {
      patchStorageAreaGet(chrome.storage.sync);
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

  function normalizeTheme(mode) {
    return THEMES.includes(mode) ? mode : "dark";
  }

  function normalizeLang(lang) {
    if (LANGUAGES.includes(lang)) return lang;
    return navigator.language && navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
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

    return new Promise((resolve) => {
      try {
        storage.set(
          {
            [AUTO_SEND_ENABLED_KEY]: autoSendEnabled,
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

  function loadAutoSendDelayRange() {
    const storage = chrome?.storage?.local;
    if (!storage?.get) {
      autoSendEnabled = DEFAULT_AUTO_SEND_ENABLED;
      setAutoSendDelayRange(DEFAULT_DELAY_MIN_SEC, DEFAULT_DELAY_MAX_SEC);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      try {
        storage.get(
          {
            [AUTO_SEND_ENABLED_KEY]: DEFAULT_AUTO_SEND_ENABLED,
            [DELAY_MIN_SEC_KEY]: DEFAULT_DELAY_MIN_SEC,
            [DELAY_MAX_SEC_KEY]: DEFAULT_DELAY_MAX_SEC
          },
          (obj) => {
            autoSendEnabled = normalizeAutoSendEnabled(obj?.[AUTO_SEND_ENABLED_KEY]);
            setAutoSendDelayRange(obj?.[DELAY_MIN_SEC_KEY], obj?.[DELAY_MAX_SEC_KEY]);
            resolve();
          }
        );
      } catch (_err) {
        autoSendEnabled = DEFAULT_AUTO_SEND_ENABLED;
        setAutoSendDelayRange(DEFAULT_DELAY_MIN_SEC, DEFAULT_DELAY_MAX_SEC);
        resolve();
      }
    });
  }

  function getAutoSendDelayMs() {
    const minMs = Math.max(0, autoSendDelayMinSec * 1000);
    const maxMs = Math.max(minMs, autoSendDelayMaxSec * 1000);
    return Math.floor(minMs + Math.random() * (maxMs - minMs + 1));
  }

  function setupAutoSendDelayRuntime() {
    window.__ceGetAutoSendDelayMs = getAutoSendDelayMs;
    window.__ceIsAutoSendEnabled = () => !!autoSendEnabled;
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
    return new Promise((resolve) => {
      try {
        storage.set(
          {
            [RANDOM_TONE_ENABLED_KEY]: randomToneEnabled,
            [RANDOM_LENGTH_ENABLED_KEY]: randomLengthEnabled
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
    if (!storage?.get) {
      randomToneEnabled = DEFAULT_RANDOM_TONE_ENABLED;
      randomLengthEnabled = DEFAULT_RANDOM_LENGTH_ENABLED;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      try {
        storage.get(
          {
            [RANDOM_TONE_ENABLED_KEY]: DEFAULT_RANDOM_TONE_ENABLED,
            [RANDOM_LENGTH_ENABLED_KEY]: DEFAULT_RANDOM_LENGTH_ENABLED
          },
          (obj) => {
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
    if (!storage?.set) return Promise.resolve();
    replyPromptHint = normalizeReplyPromptHint(replyPromptHint);
    return new Promise((resolve) => {
      try {
        storage.set(
          {
            [REPLY_PROMPT_HINT_KEY]: replyPromptHint
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
    if (!storage?.get) {
      replyPromptHint = DEFAULT_REPLY_PROMPT_HINT;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      try {
        storage.get(
          {
            [REPLY_PROMPT_HINT_KEY]: DEFAULT_REPLY_PROMPT_HINT
          },
          (obj) => {
            replyPromptHint = normalizeReplyPromptHint(obj?.[REPLY_PROMPT_HINT_KEY]);
            resolve();
          }
        );
      } catch (_err) {
        replyPromptHint = DEFAULT_REPLY_PROMPT_HINT;
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
    return new Promise((resolve) => {
      try {
        area.set(value, () => resolve());
      } catch (_err) {
        resolve();
      }
    });
  }

  async function syncGasGxDerivedStorage() {
    if (!STORAGE_AREAS.length) return;
    const snapshot = await ensureGasGxAuthSnapshotLoaded();

    for (const area of STORAGE_AREAS) {
      const accountObj = await getStorageValue(area, ACCOUNT_KEY);
      const uiObj = await getStorageValue(area, UI_KEY);
      const currentAccountRaw = sparkToString(accountObj[ACCOUNT_KEY], "");
      const currentUiRaw = sparkToString(uiObj[UI_KEY], "");
      const nextAccount = isGasGxExtensionEnabled(snapshot)
        ? buildEnabledAccount(snapshot, parseStoredAccount(accountObj[ACCOUNT_KEY]))
        : buildLockedAccount(snapshot);
      const nextUi = deriveUiState(parseStoredObject(uiObj[UI_KEY], DEFAULT_UI_STATE), snapshot);
      const nextAccountRaw = stringifyStoredAccount(nextAccount);
      const nextUiRaw = stringifyStoredObject(nextUi);

      if (currentAccountRaw === nextAccountRaw && currentUiRaw === nextUiRaw) {
        continue;
      }

      await setStorageValue(area, {
        [ACCOUNT_KEY]: nextAccountRaw,
        [UI_KEY]: nextUiRaw
      });
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
    mountPreferencesAutoSendControls();
    ensurePopupSlidersInteractive();
    mountReplyPromptHintControl();
    hideBottomRightLogo();
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

  function mountPreferencesAutoSendControls() {
    if (!document.body) return;
    if (document.getElementById("ce-preferences-auto-send-root")) return;

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
    void loadRandomStrategySettings().then(() => updateControls());
    updateControls();
  }

  function mountReplyPromptHintControl() {
    const settingsRoot = document.getElementById("ce-preferences-auto-send-root");
    if (!settingsRoot) return;
    if (document.getElementById("ce-reply-prompt-hint-root")) return;

    const root = document.createElement("div");
    root.id = "ce-reply-prompt-hint-root";

    const label = document.createElement("label");
    label.id = "ce-reply-prompt-hint-label";
    label.setAttribute("for", "ce-reply-prompt-hint-input");

    const input = document.createElement("input");
    input.id = "ce-reply-prompt-hint-input";
    input.type = "text";
    input.maxLength = 240;
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

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      input.blur();
    });

    root.appendChild(label);
    root.appendChild(input);
    settingsRoot.appendChild(root);
    updateControls();
  }
  function ensureGasGxPopupStyles() {
    if (document.getElementById("ce-gasgx-auth-style")) return;
    const style = document.createElement("style");
    style.id = "ce-gasgx-auth-style";
    style.textContent = `
      #${GASGX_AUTH_OVERLAY_ID} { position: fixed; inset: 0; z-index: 2147483646; display: flex; align-items: center; justify-content: center; background: linear-gradient(160deg, rgba(9,17,28,0.96), rgba(16,47,34,0.94)); padding: 18px; }
      #${GASGX_AUTH_OVERLAY_ID}[data-mode="hidden"] { display: none; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-card { width: min(100%, 360px); border-radius: 18px; padding: 20px; background: rgba(8,13,22,0.94); border: 1px solid rgba(102,255,153,0.22); box-shadow: 0 18px 50px rgba(0,0,0,0.34); color: #f6fff7; font-family: "Segoe UI", sans-serif; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-title { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-subtitle { font-size: 12px; line-height: 1.5; color: rgba(230,244,234,0.75); margin-bottom: 16px; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-error { min-height: 18px; color: #ff9f9f; font-size: 12px; margin-bottom: 10px; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-success { color: #9df5b1; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-label { font-size: 12px; color: rgba(230,244,234,0.86); }
      #${GASGX_AUTH_OVERLAY_ID} .ce-input { width: 100%; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; background: rgba(255,255,255,0.06); color: #fff; padding: 10px 12px; font-size: 13px; box-sizing: border-box; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-input:focus { outline: none; border-color: rgba(102,255,153,0.6); box-shadow: 0 0 0 3px rgba(102,255,153,0.14); }
      #${GASGX_AUTH_OVERLAY_ID} .ce-row { display: flex; gap: 10px; align-items: center; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-btn { appearance: none; border: 0; border-radius: 12px; padding: 10px 14px; cursor: pointer; font-size: 13px; font-weight: 700; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-btn-primary { background: #66ff99; color: #0b1c12; flex: 1; }
      #${GASGX_AUTH_OVERLAY_ID} .ce-link { color: #8cf8b5; text-decoration: none; font-size: 12px; }
      #${GASGX_AUTH_BADGE_ID} { position: fixed; top: 8px; right: 8px; z-index: 2147483645; display: none; gap: 8px; align-items: center; padding: 8px 10px; border-radius: 999px; background: rgba(5,18,13,0.88); color: #dffff0; border: 1px solid rgba(102,255,153,0.22); font-family: "Segoe UI", sans-serif; font-size: 11px; }
      #${GASGX_AUTH_BADGE_ID} button { appearance: none; border: 0; border-radius: 999px; padding: 4px 8px; cursor: pointer; font-size: 11px; background: rgba(255,255,255,0.1); color: #fff; }
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
    let badge = document.getElementById(GASGX_AUTH_BADGE_ID);
    if (!badge) {
      badge = document.createElement("div");
      badge.id = GASGX_AUTH_BADGE_ID;
      document.body.appendChild(badge);
    }
    return { overlay, badge };
  }

  async function handleGasGxPopupSignInSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const emailInput = form.querySelector('input[name="email"]');
    const passwordInput = form.querySelector('input[name="password"]');
    const errorNode = form.querySelector("[data-role='error']");
    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;
    if (errorNode) {
      errorNode.textContent = "Signing in to GasGx...";
      errorNode.classList.remove("ce-success");
    }
    try {
      const sessionPayload = await signInWithGasGxPassword(emailInput?.value, passwordInput?.value);
      const snapshot = await buildGasGxSnapshotFromSession(sessionPayload);
      await persistGasGxAuthSnapshot(snapshot);
      await syncGasGxDerivedStorage();
    } catch (error) {
      await persistGasGxAuthSnapshot({
        ...getCurrentGasGxAuthSnapshot(),
        status: "auth_error",
        errorMessage: sparkToString(error?.message, "GasGx sign-in failed.").trim()
      });
      await syncGasGxDerivedStorage();
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async function handleGasGxPopupSignOut() {
    await clearGasGxAuthSnapshot();
    await syncGasGxDerivedStorage();
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
      badge.style.display = "flex";
      badge.innerHTML = `<span>GasGx verified: ${snapshot.email || "user"}</span><button type="button" id="ce-gasgx-sign-out-btn">Sign out</button>`;
      const logoutBtn = document.getElementById("ce-gasgx-sign-out-btn");
      logoutBtn?.addEventListener("click", () => { void handleGasGxPopupSignOut(); }, { once: true });
      return;
    }
    badge.style.display = "none";
    const isBlocked = snapshot.status === "signed_in_but_not_enabled";
    const isError = snapshot.status === "auth_error";
    overlay.setAttribute("data-mode", "active");
    overlay.innerHTML = `
      <div class="ce-card">
        <div class="ce-title">GasGx account verification</div>
        <div class="ce-subtitle">Only GasGx accounts with LinkedIn Automatic Comments entitlement can use this extension.</div>
        <div class="ce-error ${!isError && !isBlocked ? "ce-success" : ""}" data-role="status">${isBlocked ? "This GasGx account is signed in, but the extension is not enabled yet." : isError ? (snapshot.errorMessage || "GasGx authentication failed. Please sign in again.") : "Sign in with your GasGx account. Non-enabled accounts will remain blocked."}</div>
        ${isBlocked ? `<div class="ce-row"><button type="button" class="ce-btn ce-btn-primary" id="ce-gasgx-switch-account">Switch account</button><a class="ce-link" href="${GASGX_EXTENSION_CONTACT_URL}" target="_blank" rel="noreferrer">Contact GasGx</a></div>` : `<form id="ce-gasgx-sign-in-form"><div class="ce-field"><label class="ce-label">GasGx email</label><input class="ce-input" type="email" name="email" autocomplete="username" placeholder="you@gasgx.com" value="${snapshot.email || ""}"></div><div class="ce-field"><label class="ce-label">Password</label><input class="ce-input" type="password" name="password" autocomplete="current-password" placeholder="Enter password"></div><div class="ce-error" data-role="error">${isError ? (snapshot.errorMessage || "") : ""}</div><div class="ce-row"><button type="submit" class="ce-btn ce-btn-primary">Sign in and verify</button><a class="ce-link" href="${GASGX_EXTENSION_CONTACT_URL}" target="_blank" rel="noreferrer">Open GasGx</a></div></form>`}
      </div>`;
    const form = document.getElementById("ce-gasgx-sign-in-form");
    form?.addEventListener("submit", (event) => { void handleGasGxPopupSignInSubmit(event); });
    const switchAccountBtn = document.getElementById("ce-gasgx-switch-account");
    switchAccountBtn?.addEventListener("click", () => { void handleGasGxPopupSignOut(); });
  }

  function initContentContext() {
    const run = async () => {
      try {
        await syncGasGxDerivedStorage();
        suppressGateToastApis();
        hideGateToasts();
      } catch (_err) {
        // Keep content script resilient.
      }
    };

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
    const renderAuth = () => {
      window.requestAnimationFrame(() => {
        renderGasGxPopupAuth();
      });
    };

    void ensureGasGxAuthSnapshotLoaded().then(async () => {
      await syncGasGxDerivedStorage();
      renderAuth();
    }).catch(() => {
      renderAuth();
    });

    window.addEventListener(GASGX_AUTH_CHANGED_EVENT, renderAuth);
  }

  void ensureGasGxAuthSnapshotLoaded().then(() => syncGasGxDerivedStorage());
  setInterval(() => {
    void ensureGasGxAuthSnapshotLoaded(true).then(() => syncGasGxDerivedStorage());
  }, 60_000);

  setupAutoSendDelayRuntime();
  setupRandomStrategyRuntime();
  setupReplyPromptHintRuntime();
  setupSparkRuntime();

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








