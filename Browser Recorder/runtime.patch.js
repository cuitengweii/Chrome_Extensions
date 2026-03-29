(function (global) {
  "use strict";

  if (global.__BR_RUNTIME_PATCH__) {
    return;
  }
  global.__BR_RUNTIME_PATCH__ = true;

  var THEME_KEY = "br_theme_mode";
  var LANG_KEY = "br_lang_mode";
  var PRO_KEY_PATTERN = /(pro|premium|subscription|billing|plan|license|pay|upgrade|unlock|trial|entitlement|quota)/i;
  var FALSE_KEY_PATTERN = /(expired|lock|locked|paywall|restricted|blocked|disabled|isfree|freeonly)/i;
  var PLAN_KEY_PATTERN = /(plan|tier|subscription|license)/i;
  var BOOL_TRUE_KEY_PATTERN = /(pro|premium|paid|unlocked|entitled|active|allowed|enabled)/i;
  var DEFAULT_THEME = "dark";
  var DEFAULT_LANG = "zh-CN";

  var activeLanguage = DEFAULT_LANG;
  var nodeOriginalText = new WeakMap();
  var translationObserver = null;

  var EN_TO_ZH = {
    "Record": "录制",
    "Recording": "录制中",
    "Stop": "停止",
    "Pause": "暂停",
    "Resume": "继续",
    "Screen": "屏幕",
    "Camera": "摄像头",
    "Microphone": "麦克风",
    "Audio": "音频",
    "Settings": "设置",
    "Share": "分享",
    "Download": "下载",
    "Save": "保存",
    "Cancel": "取消",
    "Close": "关闭",
    "Continue": "继续",
    "Done": "完成",
    "Edit": "编辑",
    "Upload": "上传",
    "Back": "返回",
    "Next": "下一步",
    "Start": "开始",
    "Finish": "完成",
    "Upgrade": "升级",
    "Pro": "专业版",
    "Premium": "高级版",
    "Free": "免费",
    "Unlimited": "无限制",
    "Region": "区域",
    "Full Screen": "全屏",
    "Tab": "标签页",
    "Language": "语言",
    "Light": "浅色",
    "Dark": "深色",
    "Theme": "主题"
  };

  function invertMap(input) {
    var output = {};
    Object.keys(input).forEach(function (key) {
      output[input[key]] = key;
    });
    return output;
  }

  var ZH_TO_EN = invertMap(EN_TO_ZH);

  function getChromeStorage() {
    try {
      if (global.chrome && global.chrome.storage && global.chrome.storage.local) {
        return global.chrome.storage.local;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function normalizeLang(lang) {
    if (!lang) {
      return DEFAULT_LANG;
    }
    var lower = String(lang).toLowerCase();
    if (lower.indexOf("zh") === 0) {
      return "zh-CN";
    }
    return "en";
  }

  function readLocalStorage(key) {
    try {
      if (global.localStorage) {
        return global.localStorage.getItem(key);
      }
    } catch (error) {}
    return null;
  }

  function writeLocalStorage(key, value) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(key, value);
      }
    } catch (error) {}
  }

  function readSetting(key, fallbackValue) {
    var localValue = readLocalStorage(key);
    if (localValue === null || localValue === undefined || localValue === "") {
      return fallbackValue;
    }
    return localValue;
  }

  function writeSetting(key, value) {
    writeLocalStorage(key, value);
    var storage = getChromeStorage();
    if (storage && typeof storage.set === "function") {
      try {
        storage.set((function () {
          var payload = {};
          payload[key] = value;
          return payload;
        })());
      } catch (error) {}
    }
  }

  function detectSystemTheme() {
    try {
      if (typeof global.matchMedia === "function" && global.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch (error) {}
    return "light";
  }

  function getThemeMode() {
    var saved = String(readSetting(THEME_KEY, "")).toLowerCase();
    if (saved === "light" || saved === "dark") {
      return saved;
    }
    return DEFAULT_THEME || detectSystemTheme();
  }

  function setThemeMode(mode, persist) {
    var normalized = String(mode).toLowerCase() === "light" ? "light" : "dark";
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("data-theme", normalized);
      document.documentElement.style.colorScheme = normalized === "dark" ? "dark" : "light";
    }
    if (persist) {
      writeSetting(THEME_KEY, normalized);
    }
  }

  function isTextInput(target) {
    if (!target || !target.tagName) {
      return false;
    }
    var tag = target.tagName.toUpperCase();
    return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function forcePremiumValueByKey(key, value) {
    if (!key) {
      return value;
    }
    var normalizedKey = String(key);
    if (!PRO_KEY_PATTERN.test(normalizedKey)) {
      return value;
    }
    if (FALSE_KEY_PATTERN.test(normalizedKey)) {
      return false;
    }
    if (PLAN_KEY_PATTERN.test(normalizedKey)) {
      return "pro";
    }
    if (BOOL_TRUE_KEY_PATTERN.test(normalizedKey)) {
      return true;
    }
    if (typeof value === "string") {
      return "pro";
    }
    if (typeof value === "number") {
      return Math.max(value, 1);
    }
    if (typeof value === "boolean") {
      return true;
    }
    return value === undefined ? true : value;
  }

  function deepForcePremium(input, depth) {
    if (depth > 6) {
      return input;
    }
    if (Array.isArray(input)) {
      return input.map(function (entry) {
        return deepForcePremium(entry, depth + 1);
      });
    }
    if (!isObject(input)) {
      return input;
    }

    var output = {};
    Object.keys(input).forEach(function (key) {
      var value = deepForcePremium(input[key], depth + 1);
      output[key] = forcePremiumValueByKey(key, value);
    });

    var forcedDefaults = {
      pro: true,
      isPro: true,
      premium: true,
      isPremium: true,
      paid: true,
      hasPaid: true,
      subscription: "pro",
      subscriptionStatus: "active",
      plan: "pro",
      planType: "pro",
      license: "pro",
      unlocked: true,
      trialExpired: false,
      paywall: false,
      paywallLocked: false
    };

    Object.keys(forcedDefaults).forEach(function (forcedKey) {
      if (output[forcedKey] === undefined) {
        output[forcedKey] = forcedDefaults[forcedKey];
      }
    });

    return output;
  }

  function patchStorageGetResult(keys, result) {
    var patched = deepForcePremium(result || {}, 0);

    if (typeof keys === "string") {
      if (patched[keys] === undefined && PRO_KEY_PATTERN.test(keys)) {
        patched[keys] = forcePremiumValueByKey(keys, undefined);
      }
      return patched;
    }

    if (Array.isArray(keys)) {
      keys.forEach(function (key) {
        if (patched[key] === undefined && PRO_KEY_PATTERN.test(String(key))) {
          patched[key] = forcePremiumValueByKey(String(key), undefined);
        }
      });
      return patched;
    }

    if (isObject(keys)) {
      Object.keys(keys).forEach(function (key) {
        if (patched[key] === undefined) {
          patched[key] = PRO_KEY_PATTERN.test(String(key)) ? forcePremiumValueByKey(String(key), keys[key]) : keys[key];
        }
      });
      return patched;
    }

    return patched;
  }

  function patchChromeStorage() {
    var storage = getChromeStorage();
    if (!storage || storage.__brPatched) {
      return;
    }

    if (typeof storage.get === "function") {
      var originalGet = storage.get.bind(storage);
      storage.get = function (keys, callback) {
        if (typeof callback === "function") {
          return originalGet(keys, function (result) {
            callback(patchStorageGetResult(keys, result));
          });
        }

        var maybePromise = originalGet(keys);
        if (maybePromise && typeof maybePromise.then === "function") {
          return maybePromise.then(function (result) {
            return patchStorageGetResult(keys, result);
          });
        }
        return maybePromise;
      };
    }

    if (typeof storage.set === "function") {
      var originalSet = storage.set.bind(storage);
      storage.set = function (items, callback) {
        var patchedItems = deepForcePremium(items || {}, 0);
        return originalSet(patchedItems, callback);
      };
    }

    storage.__brPatched = true;
  }

  function patchLocalStorage() {
    if (!global.localStorage || global.localStorage.__brPatched) {
      return;
    }

    var originalGetItem = global.localStorage.getItem.bind(global.localStorage);
    var originalSetItem = global.localStorage.setItem.bind(global.localStorage);

    global.localStorage.getItem = function (key) {
      var value = originalGetItem(key);
      if (!PRO_KEY_PATTERN.test(String(key || ""))) {
        return value;
      }
      var forced = forcePremiumValueByKey(String(key), value);
      if (typeof forced === "boolean") {
        return forced ? "true" : "false";
      }
      return String(forced);
    };

    global.localStorage.setItem = function (key, value) {
      if (PRO_KEY_PATTERN.test(String(key || ""))) {
        var forced = forcePremiumValueByKey(String(key), value);
        if (typeof forced === "boolean") {
          return originalSetItem(key, forced ? "true" : "false");
        }
        return originalSetItem(key, String(forced));
      }
      return originalSetItem(key, value);
    };

    global.localStorage.__brPatched = true;
  }

  function patchFetch() {
    if (typeof global.fetch !== "function" || global.fetch.__brPatched) {
      return;
    }

    var originalFetch = global.fetch.bind(global);

    global.fetch = function () {
      var args = arguments;
      return originalFetch.apply(null, args).then(function (response) {
        if (!response || typeof response.clone !== "function" || typeof Response === "undefined") {
          return response;
        }

        var cloned = response.clone();
        return cloned.json().then(function (jsonPayload) {
          if (!isObject(jsonPayload) && !Array.isArray(jsonPayload)) {
            return response;
          }
          var patchedPayload = deepForcePremium(jsonPayload, 0);
          var headers = new Headers(response.headers);
          headers.set("content-type", "application/json");
          return new Response(JSON.stringify(patchedPayload), {
            status: response.status,
            statusText: response.statusText,
            headers: headers
          });
        }).catch(function () {
          return response;
        });
      });
    };

    global.fetch.__brPatched = true;
  }

  function patchNavigatorLanguage() {
    activeLanguage = normalizeLang(readSetting(LANG_KEY, DEFAULT_LANG));

    if (typeof navigator !== "undefined") {
      try {
        var navProto = Object.getPrototypeOf(navigator);
        Object.defineProperty(navProto, "language", {
          configurable: true,
          get: function () {
            return activeLanguage;
          }
        });
        Object.defineProperty(navProto, "languages", {
          configurable: true,
          get: function () {
            return [activeLanguage, activeLanguage === "zh-CN" ? "en-US" : "zh-CN"];
          }
        });
      } catch (error) {}
    }

    if (global.chrome && global.chrome.i18n) {
      try {
        global.chrome.i18n.getUILanguage = function () {
          return activeLanguage;
        };
      } catch (error) {}

      try {
        global.chrome.i18n.getAcceptLanguages = function (callback) {
          var langs = [activeLanguage, activeLanguage === "zh-CN" ? "en-US" : "zh-CN"];
          if (typeof callback === "function") {
            callback(langs);
            return;
          }
          return Promise.resolve(langs);
        };
      } catch (error) {}
    }
  }

  function translateText(rawText, targetLang) {
    if (!rawText) {
      return rawText;
    }

    var output = rawText;
    var map = targetLang === "zh-CN" ? EN_TO_ZH : ZH_TO_EN;

    Object.keys(map).forEach(function (sourceText) {
      var escaped = sourceText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var regex = new RegExp("\\b" + escaped + "\\b", "g");
      output = output.replace(regex, map[sourceText]);
    });

    return output;
  }

  function processTextNode(node, targetLang) {
    if (!node || !node.parentElement) {
      return;
    }
    var parentTag = node.parentElement.tagName;
    if (!parentTag) {
      return;
    }
    var ignoredTags = ["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME"];
    if (ignoredTags.indexOf(parentTag.toUpperCase()) >= 0) {
      return;
    }

    if (!nodeOriginalText.has(node)) {
      nodeOriginalText.set(node, node.nodeValue);
    }

    if (targetLang === "zh-CN") {
      node.nodeValue = translateText(nodeOriginalText.get(node), "zh-CN");
    } else {
      node.nodeValue = nodeOriginalText.get(node);
    }
  }

  function walkAndTranslate(targetLang) {
    if (typeof document === "undefined" || !document.body) {
      return;
    }
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var current;
    while ((current = walker.nextNode())) {
      processTextNode(current, targetLang);
    }
  }

  function stopTranslationObserver() {
    if (translationObserver) {
      translationObserver.disconnect();
      translationObserver = null;
    }
  }

  function startTranslationObserver() {
    if (typeof MutationObserver === "undefined" || typeof document === "undefined" || !document.body) {
      return;
    }
    stopTranslationObserver();
    translationObserver = new MutationObserver(function () {
      if (activeLanguage === "zh-CN") {
        walkAndTranslate("zh-CN");
      }
    });
    translationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function applyLanguage(targetLang, persist) {
    activeLanguage = normalizeLang(targetLang);
    if (persist) {
      writeSetting(LANG_KEY, activeLanguage);
    }

    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("lang", activeLanguage === "zh-CN" ? "zh-CN" : "en");
    }

    patchNavigatorLanguage();

    if (activeLanguage === "zh-CN") {
      walkAndTranslate("zh-CN");
      startTranslationObserver();
    } else {
      walkAndTranslate("en");
      stopTranslationObserver();
    }
  }

  function attachHotkeys() {
    if (typeof document === "undefined") {
      return;
    }

    document.addEventListener("keydown", function (event) {
      if (!event.ctrlKey || !event.shiftKey || isTextInput(event.target)) {
        return;
      }

      if (event.code === "KeyD") {
        event.preventDefault();
        var nextTheme = getThemeMode() === "dark" ? "light" : "dark";
        setThemeMode(nextTheme, true);
        return;
      }

      if (event.code === "KeyL") {
        event.preventDefault();
        var nextLang = activeLanguage === "zh-CN" ? "en" : "zh-CN";
        applyLanguage(nextLang, true);
        if (typeof location !== "undefined" && typeof location.reload === "function") {
          setTimeout(function () {
            location.reload();
          }, 100);
        }
      }
    }, true);
  }

  function bootstrapDomFeatures() {
    if (typeof document === "undefined") {
      return;
    }

    setThemeMode(getThemeMode(), false);
    applyLanguage(readSetting(LANG_KEY, DEFAULT_LANG), false);
    attachHotkeys();
  }

  function bootstrapGlobalFeatures() {
    patchChromeStorage();
    patchLocalStorage();
    patchFetch();
    patchNavigatorLanguage();
  }

  bootstrapGlobalFeatures();

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootstrapDomFeatures, { once: true });
    } else {
      bootstrapDomFeatures();
    }
  }

  global.BrowserRecorderPatch = {
    getTheme: getThemeMode,
    setTheme: function (mode) { setThemeMode(mode, true); },
    getLanguage: function () { return activeLanguage; },
    setLanguage: function (lang) { applyLanguage(lang, true); },
    forcePremium: function () {
      patchChromeStorage();
      patchLocalStorage();
      patchFetch();
    }
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
