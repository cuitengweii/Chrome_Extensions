(() => {
  "use strict";

  const ACCOUNT_KEY = "account";
  const MODE_KEY = "commentron_theme_mode";
  const LANG_KEY = "commentron_language";
  const THEMES = ["dark", "light"];
  const LANGUAGES = ["en", "zh-CN"];

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

  function normalizeAccountStorageShape(result, area) {
    if (!result || typeof result !== "object") return result;
    if (!Object.prototype.hasOwnProperty.call(result, ACCOUNT_KEY)) return result;

    const parsed = parseStoredAccount(result[ACCOUNT_KEY]);
    const normalized = stringifyStoredAccount(parsed);

    if (result[ACCOUNT_KEY] !== normalized) {
      const patched = { ...result, [ACCOUNT_KEY]: normalized };
      try {
        area?.set?.({ [ACCOUNT_KEY]: normalized }, () => {});
      } catch (_err) {
        // Ignore storage write-back failures.
      }
      return patched;
    }

    return result;
  }

  function patchStorageAreaGet(area) {
    if (!area || area.__ceGetPatched) return;
    if (typeof area.get !== "function") return;

    const originalGet = area.get.bind(area);

    try {
      area.get = function patchedGet(keys, callback) {
        if (typeof callback === "function") {
          return originalGet(keys, (res) => {
            callback(normalizeAccountStorageShape(res || {}, area));
          });
        }

        const ret = originalGet(keys);
        if (ret && typeof ret.then === "function") {
          return ret.then((res) => normalizeAccountStorageShape(res || {}, area));
        }
        return ret;
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
    subscriberId: undefined,
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
    ["Confused?", "不清楚怎么用？"],
    ["Watch tutorial", "查看教程"],
    ["Licensed to:", "授权给："],
    ["Plan:", "套餐："],
    ["Length:", "长度："],
    ["Tone", "语气"],
    ["Open Ended", "开放式结尾"],
    ["Use Emojis", "使用表情"],
    ["Comment/Reply in English", "评论/回复使用英文"],
    ["Keep Replies Short", "保持简短回复"],
    ["On My Own Posts — Reply Only with Ack", "我的帖子仅确认式回复"],
    ["Voice Gender", "语气性别"],
    ["Not Specified", "未指定"],
    ["Male", "男性"],
    ["Female", "女性"],
    ["Enable/disable CommenTron", "启用/禁用 CommenTron"],
    ["Extension enabled", "扩展已启用"],
    ["Extension disabled", "扩展已禁用"],
    ["Commenting in English", "已切换为英文评论"],
    ["Commenting in post language", "已按帖子语言评论"],
    ["Using emojis", "已启用表情"],
    ["Not using emojis", "已关闭表情"],
    ["Ending comments with a question", "评论将以问题结尾"],
    ["Ending comments natively", "评论结尾恢复默认"],
    ["Replying with acknowledge", "回复将以确认式表达"],
    ["Replying natively", "回复恢复默认"],
    ["Disabled on short comments", "短评论模式下不可用"],
    ["Reset CommenTron Seats", "重置 CommenTron 配额"],
    ["Works only on", "仅支持"],
    ["Click here", "点击这里"],
    ["to update, then follow the steps shown below:", "完成更新后按下图步骤操作："],
    ["A new version is available ✨", "发现新版本 ✨"],
    ["Write us a review", "给我们评分"],
    ["Free trial ended 😥", "付费功能已全部放开"],
    ["Subscribe", "已放开"],
    ["to enjoy this amazing tool.", "无需订阅，可直接使用。"],
    ["Early bird mode — use without login.", "免登录模式已启用。"],
    ["Email", "邮箱"],
    ["Password", "密码"],
    ["Version:", "版本："],
    ["Environment: production", "环境：production"],
    ["Seat:", "席位："],
    ["Comment/reply in English, regardless of the post language.", "无论帖子语言如何，评论/回复都使用英文。"],
    ["Use emojis as part of the comment.", "在评论中使用表情符号。"],
    ["Ask a question at the end of the comment to encourage further engagement.", "评论末尾使用问题以提高互动。"],
    ["Control the length of comments.", "控制评论长度。"],
    ["Set the tone for the comments that are generated.", "设置生成评论的语气。"],
    ["Set the voice gender for the comments and replies that are generated.", "设置生成评论与回复的语气性别。"],
    ["Up to 10 words on a reply.", "回复最多 10 个单词。"],
    ["Sign up to CommenTron.", "注册 CommenTron。"],
    ["Sign in to CommenTron.", "登录 CommenTron。"],
    ["Same email you used to register with RocketPod.", "请输入你注册 RocketPod 时使用的邮箱。"],
    ["Same password you used to register with RocketPod. Forgot password?", "请输入你注册 RocketPod 时使用的密码。忘记密码？"]
  ];

  const enToZh = new Map(DICT);
  const zhToEn = new Map(DICT.map(([en, zh]) => [zh, en]));

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

  async function enforceUnlockedAccount() {
    if (!STORAGE_AREAS.length) return;

    for (const area of STORAGE_AREAS) {
      const obj = await getStorageValue(area, ACCOUNT_KEY);
      const existing = parseStoredAccount(obj[ACCOUNT_KEY]);

      const merged = {
        ...DEFAULT_ACCOUNT,
        ...existing,
        plan: "Advanced",
        isTrialEligible: true
      };

      await setStorageValue(area, { [ACCOUNT_KEY]: stringifyStoredAccount(merged) });
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

  function translateCore(text, lang) {
    if (!text) return text;

    const map = lang === "zh-CN" ? enToZh : zhToEn;
    if (map.has(text)) return map.get(text);

    if (lang === "zh-CN") {
      const m1 = text.match(/^Free trial ended, upgrade to '(.+)' plan to access this feature$/);
      if (m1) return `免费试用已结束，升级到“${m1[1]}”套餐即可使用此功能`;

      const m2 = text.match(/^Upgrade to '(.+)' plan to access this feature$/);
      if (m2) return `升级到“${m2[1]}”套餐即可使用此功能`;

      const m3 = text.match(/^Plan:\s*(.+)$/);
      if (m3) return `套餐：${m3[1]}`;

      const m4 = text.match(/^Length:\s*'(.+)'$/);
      if (m4) return `长度：'${m4[1]}'`;

      const m5 = text.match(/^Tone:\s*'(.+)'$/);
      if (m5) return `语气：'${m5[1]}'`;
    } else {
      const m1 = text.match(/^免费试用已结束，升级到“(.+)”套餐即可使用此功能$/);
      if (m1) return `Free trial ended, upgrade to '${m1[1]}' plan to access this feature`;

      const m2 = text.match(/^升级到“(.+)”套餐即可使用此功能$/);
      if (m2) return `Upgrade to '${m2[1]}' plan to access this feature`;

      const m3 = text.match(/^套餐：\s*(.+)$/);
      if (m3) return `Plan: ${m3[1]}`;

      const m4 = text.match(/^长度：\s*'(.+)'$/);
      if (m4) return `Length: '${m4[1]}'`;

      const m5 = text.match(/^语气：\s*'(.+)'$/);
      if (m5) return `Tone: '${m5[1]}'`;
    }

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

  function applyRuntimeLayers() {
    applyLanguageToDom();
    unlockDisabledControls();
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
    if (!modeBtn || !langBtn) return;

    modeBtn.textContent = currentMode === "dark" ? "☀" : "🌙";
    modeBtn.title = currentLang === "zh-CN"
      ? (currentMode === "dark" ? "切换到白天模式" : "切换到夜间模式")
      : (currentMode === "dark" ? "Switch to light mode" : "Switch to dark mode");

    langBtn.textContent = currentLang === "zh-CN" ? "EN" : "中";
    langBtn.title = currentLang === "zh-CN" ? "切换到英文" : "Switch to Chinese";
  }

  function mountControls() {
    if (!document.body || document.getElementById("ce-runtime-controls")) return;

    const controls = document.createElement("div");
    controls.id = "ce-runtime-controls";

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
    document.body.appendChild(controls);
    updateControls();
  }

  function initPopupContext() {
    applyTheme(currentMode);
    applyLanguage(currentLang);
    mountControls();
    queueApplyRuntime();

    if (!document.body) return;
    const observer = new MutationObserver(() => queueApplyRuntime());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["title", "aria-label", "placeholder", "class", "disabled"]
    });
  }

  void enforceUnlockedAccount();
  setInterval(() => {
    void enforceUnlockedAccount();
  }, 5_000);

  if (!isPopupContext()) return;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPopupContext);
  } else {
    initPopupContext();
  }
})();
