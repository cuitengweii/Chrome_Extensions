(() => {
  "use strict";

  const ACCOUNT_KEY = "account";
  const MODE_KEY = "commentron_theme_mode";
  const LANG_KEY = "commentron_language";
  const BRAND_TITLE = "LinkedIn Automatic Comments";
  const THEMES = ["dark", "light"];
  const LANGUAGES = ["en", "zh-CN"];
  const JSON_PARSE_PATCH_FLAG = "__ceJsonParsePatched";

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

  function normalizeStorageShape(result, area) {
    if (!result || typeof result !== "object") return result;

    let changed = false;
    const patchPayload = {};
    const patched = { ...result };

    for (const key of Object.keys(patched)) {
      const rawValue = patched[key];
      let normalizedValue = rawValue;

      if (key === ACCOUNT_KEY) {
        normalizedValue = stringifyStoredAccount(parseStoredAccount(rawValue));
      } else if (rawValue && typeof rawValue === "object") {
        // The extension storage helper expects JSON strings for object/array payloads.
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
      } catch (_err) {
        // Ignore storage write-back failures.
      }
    }

    return patched;
  }

  function patchStorageAreaGet(area) {
    if (!area || area.__ceGetPatched) return;
    if (typeof area.get !== "function") return;

    const originalGet = area.get.bind(area);

    try {
      area.get = function patchedGet(keys, callback) {
        if (typeof callback === "function") {
          return originalGet(keys, (res) => {
            callback(normalizeStorageShape(res || {}, area));
          });
        }

        const ret = originalGet(keys);
        if (ret && typeof ret.then === "function") {
          return ret.then((res) => normalizeStorageShape(res || {}, area));
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
    ["Same password you used to register with RocketPod. Forgot password?", "请输入你注册 RocketPod 时使用的密码。忘记密码？"],
    ["<span>Same password you used to register with RocketPod. <br /> <a style='color: white' href='https://rocket-pod.ai/my-account/lost-password' target='_blank'>Forgot password?</a></span>", "<span>请输入你注册 RocketPod 时使用的密码。<br /> <a style='color: white' href='https://rocket-pod.ai/my-account/lost-password' target='_blank'>忘记密码？</a></span>"],
    ["On my own posts — do not get involved too much in the context and just acknowledge by showing appreciation for the comment.", "在我的帖子下，不要过多介入上下文，仅通过感谢进行确认回复。"],
    ["On my own posts - do not get involved too much in the context and just acknowledge by showing appreciation for the comment.", "在我的帖子下，不要过多介入上下文，仅通过感谢进行确认回复。"],
    ["On my own posts ? do not get involved too much in the context and just acknowledge by showing appreciation for the comment.", "在我的帖子下，不要过多介入上下文，仅通过感谢进行确认回复。"]
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
    ["On My Own Posts — Reply Only with Ack", "\u6211\u7684\u5e16\u5b50\u4ec5\u786e\u8ba4\u5f0f\u56de\u590d"],
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

    if (lang === "zh-CN") {
      const ackTip = text.match(/^On my own posts\s*[\u2014\-\?]\s*do not get involved too much in the context and just acknowledge by showing appreciation for the comment\.$/i);
      if (ackTip) return "在我的帖子下，不要过多介入上下文，仅通过感谢进行确认回复。";

      const m1 = text.match(/^Free trial ended, upgrade to '(.+)' plan to access this feature$/);
      if (m1) return `免费试用已结束，请升级到“${translateOptionLabel(m1[1], "zh-CN")}”套餐后使用该功能`;

      const m2 = text.match(/^Upgrade to '(.+)' plan to access this feature$/);
      if (m2) return `请升级到“${translateOptionLabel(m2[1], "zh-CN")}”套餐后使用该功能`;

      const m3 = text.match(/^Plan:\s*(.+)$/);
      if (m3) return `套餐：${translateOptionLabel(m3[1].trim(), "zh-CN")}`;

      const m4 = text.match(/^Length:\s*'?(.*?)'?$/);
      if (m4) return `长度：${translateOptionLabel(m4[1].trim(), "zh-CN")}`;

      const m5 = text.match(/^Tone:\s*'?(.*?)'?$/);
      if (m5) return `语气：${translateOptionLabel(m5[1].trim(), "zh-CN")}`;
    } else {
      if (/^\u5728\u6211\u7684\u5e16\u5b50\u4e0b\uff0c\u4e0d\u8981\u8fc7\u591a\u4ecb\u5165\u4e0a\u4e0b\u6587\uff0c\u4ec5\u901a\u8fc7\u611f\u8c22\u8fdb\u884c\u786e\u8ba4\u56de\u590d\u3002$/u.test(text)) {
        return "On my own posts — do not get involved too much in the context and just acknowledge by showing appreciation for the comment.";
      }

      const m1 = text.match(/^\u514d\u8d39\u8bd5\u7528\u5df2\u7ed3\u675f\uff0c\u8bf7\u5347\u7ea7\u5230\u201c(.+)\u201d\u5957\u9910\u540e\u4f7f\u7528\u8be5\u529f\u80fd$/u);
      if (m1) return `Free trial ended, upgrade to '${translateOptionLabel(m1[1], "en")}' plan to access this feature`;

      const m2 = text.match(/^\u8bf7\u5347\u7ea7\u5230\u201c(.+)\u201d\u5957\u9910\u540e\u4f7f\u7528\u8be5\u529f\u80fd$/u);
      if (m2) return `Upgrade to '${translateOptionLabel(m2[1], "en")}' plan to access this feature`;

      const m3 = text.match(/^\u5957\u9910\uff1a\s*(.+)$/u);
      if (m3) return `Plan: ${translateOptionLabel(m3[1].trim(), "en")}`;

      const m4 = text.match(/^\u957f\u5ea6\uff1a\s*(.+)$/u);
      if (m4) return `Length: '${translateOptionLabel(m4[1].trim(), "en")}'`;

      const m5 = text.match(/^\u8bed\u6c14\uff1a\s*(.+)$/u);
      if (m5) return `Tone: '${translateOptionLabel(m5[1].trim(), "en")}'`;
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

  function enforceBrandTitle() {
    if (!document.body) return;

    if (/commen\s*tron/i.test(document.title || "")) {
      document.title = BRAND_TITLE;
    }

    const header = document.querySelector(".header");
    if (!header) return;

    const walker = document.createTreeWalker(
      header,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const value = (node.nodeValue || "").trim();
          if (!value) return NodeFilter.FILTER_REJECT;
          return /CommenTRON|CommenTron/.test(value)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      node.nodeValue = (node.nodeValue || "").replace(/CommenTRON|CommenTron/g, BRAND_TITLE);
    }
  }

  function hideBottomRightLogo() {
    if (!document.body) return;

    const logoImgs = document.querySelectorAll("img[src*='/assets/logo.png'], img.logo");
    for (const img of logoImgs) {
      const fixedParent = img.closest("[style*='position: fixed'][style*='right'][style*='bottom']");
      if (fixedParent) {
        fixedParent.style.display = "none";
      }
    }
  }

  function applyRuntimeLayers() {
    applyLanguageToDom();
    unlockDisabledControls();
    enforceBrandTitle();
    hideBottomRightLogo();
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

    modeBtn.textContent = currentMode === "dark" ? "L" : "D";
    modeBtn.title = currentLang === "zh-CN"
      ? (currentMode === "dark" ? "\u5207\u6362\u5230\u6d45\u8272\u6a21\u5f0f" : "\u5207\u6362\u5230\u6df1\u8272\u6a21\u5f0f")
      : (currentMode === "dark" ? "Switch to light mode" : "Switch to dark mode");

    langBtn.textContent = currentLang === "zh-CN" ? "EN" : "\u4e2d";
    langBtn.title = currentLang === "zh-CN" ? "\u5207\u6362\u5230\u82f1\u6587" : "Switch to Chinese";
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
