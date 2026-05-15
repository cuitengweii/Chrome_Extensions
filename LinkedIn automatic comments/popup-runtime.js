(() => {
  "use strict";

  const root = document.getElementById("ce-popup-root");
  let runtime = null;

  if (!root) return;

  const MSG_LOGIN_START = "\u6b63\u5728\u767b\u5f55\uff0c\u8bf7\u7a0d\u5019...";
  const MSG_LOGIN_SUCCESS = "\u767b\u5f55\u6210\u529f\uff1a\u4f1a\u8bdd\u5df2\u4fdd\u5b58\uff0c\u73b0\u5728\u53ef\u4ee5\u8bc4\u8bba\u3002";
  const MSG_LOGIN_FAILED = "\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002";
  const MSG_LOGOUT_START = "\u6b63\u5728\u9000\u51fa\u767b\u5f55\uff0c\u8bf7\u7a0d\u5019...";
  const MSG_LOGOUT_SUCCESS = "\u5df2\u9000\u51fa\u767b\u5f55\uff1a\u4f1a\u8bdd\u5df2\u6e05\u9664\u3002";
  const MSG_LOGOUT_FAILED = "\u9000\u51fa\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002";
  const MSG_PREFERENCES_SIGNIN_REQUIRED = "\u8bf7\u5148\u767b\u5f55\u540e\u518d\u4f7f\u7528\u504f\u597d\u8bbe\u7f6e\u3002";

  const TONE_OPTIONS = [
    { value: "Polite", en: "Polite", zh: "礼貌" },
    { value: "Casual", en: "Casual", zh: "随意" },
    { value: "Friendly", en: "Friendly", zh: "友好" },
    { value: "Professional", en: "Professional", zh: "专业" }
  ];

  const VOICE_OPTIONS = [
    { value: "NotSpecified", en: "Not specified", zh: "未指定" },
    { value: "Male", en: "Male", zh: "男" },
    { value: "Female", en: "Female", zh: "女" }
  ];

  const COPY = {
    en: {
      brand: "GasGx To LinkedIn",
      strapline: "Cyber-industrial LinkedIn AI workspace",
      tabsAccount: "Account",
      tabsPreferences: "Preferences",
      loading: "Loading popup...",
      reload: "Reload",
      runtimeMissing: "Popup runtime failed to load.",
      genericError: "The popup could not load right now.",
      saveFailed: "Could not save this setting. Please retry.",
      accountOverview: "Runtime identity",
      accountSummary: "The extension reads the active LinkedIn seat and the local GasGx state.",
      linkedinTitle: "LinkedIn current account",
      linkedinEmpty: "No LinkedIn profile detected",
      linkedinSeat: "Seat",
      linkedinNote: "This information is pulled from the active LinkedIn tab when available.",
      gasgxTitle: "GasGx account",
      gasgxNote: "Your GasGx sign-in session and AI preferences are reused directly inside the extension.",
      statusEnabled: "Signed in",
      statusBlocked: "Account state blocked",
      statusError: "Sign-in error",
      statusAnonymous: "Sign-in required",
      gasgxSummaryEnabled: "The extension is currently using your persisted GasGx session and saved preferences.",
      gasgxSummaryBlocked: "This account state is blocked. Sign in again with your GasGx account.",
      gasgxSummaryError: "The last GasGx sign-in failed. Please sign in again.",
      gasgxSummaryAnonymous: "Open GasGx and sign in once. The extension will reuse your session and preferences.",
      gasgxNoEmail: "No connected account",
      openGasGx: "Open GasGx",
      signOut: "Sign out",
      switchAccount: "Switch account",
      preferencesOverview: "LinkedIn AI preferences",
      preferencesSummary: "These settings are mapped to LinkedIn comment / reply generation and LinkedIn page automation.",
      commentSection: "Comment",
      commentSectionNote: "Shape how the AI writes comments for LinkedIn posts.",
      replySection: "Reply",
      replySectionNote: "Control reply tone, brevity, and thread-specific guidance.",
      automationSection: "Automation",
      automationSectionNote: "Control auto-send timing and randomization on LinkedIn.",
      commentLength: "Comment length",
      commentTone: "Tone",
      voiceGender: "Voice gender",
      engageInEnglish: "Comment / reply in English",
      commentUseEmojis: "Use emojis",
      commentEndWithQuestion: "Open-ended ending",
      autoSend: "Auto click comment send",
      randomTone: "Random tone",
      randomLength: "Random length",
      delayRange: "Delayed publish window",
      delayMin: "Min seconds",
      delayMax: "Max seconds",
      delayWindowSuffix: "s",
      replyHint: "Comment / reply prompt hint",
      replyHintHelp: "This hint is appended when generating LinkedIn comments and replies.",
      replyHintPlaceholder: "Example: acknowledge first, then add one concrete insight (max 240 chars)",
      modeToLight: "Switch to light mode",
      modeToDark: "Switch to dark mode",
      langToChinese: "Switch to Chinese",
      langToEnglish: "Switch to English"
    },
    "zh-CN": {
      brand: "GasGx To LinkedIn",
      strapline: "面向 LinkedIn 的 GasGx 工作台",
      tabsAccount: "账号",
      tabsPreferences: "偏好",
      loading: "正在加载弹窗...",
      reload: "重新加载",
      runtimeMissing: "弹窗运行时加载失败。",
      genericError: "当前无法加载这个页面。",
      saveFailed: "当前设置保存失败，请重试。",
      accountOverview: "运行时身份",
      accountSummary: "扩展会读取当前活动 LinkedIn 页面账号，以及本地保存的 GasGx 状态。",
      linkedinTitle: "LinkedIn 当前账号",
      linkedinEmpty: "未检测到 LinkedIn 资料",
      linkedinSeat: "标识",
      linkedinNote: "可用时会直接从当前活动的 LinkedIn 标签页读取资料。",
      gasgxTitle: "GasGx 账号",
      gasgxNote: "扩展会直接复用本地 GasGx 登录状态和 AI 偏好配置。",
      statusEnabled: "本地已登录",
      statusBlocked: "本地状态受限",
      statusError: "登录异常",
      statusAnonymous: "需要本地登录",
      gasgxSummaryEnabled: "当前扩展正在使用你本地保存的 GasGx 登录状态和偏好设置。",
      gasgxSummaryBlocked: "当前本地账号状态不可用，请先清理本地状态，再到 GasGx 重新登录。",
      gasgxSummaryError: "最近一次 GasGx 本地登录失败，请先清理本地状态，再到 GasGx 重新登录。",
      gasgxSummaryAnonymous: "请先打开 GasGx 登录一次，扩展会复用本地登录状态和偏好设置。",
      gasgxNoEmail: "未连接账号",
      openGasGx: "打开 GasGx",
      signOut: "退出登录",
      switchAccount: "切换账号",
      preferencesOverview: "LinkedIn AI 偏好",
      preferencesSummary: "这些设置会映射到 LinkedIn 评论 / 回复生成，以及 LinkedIn 页面自动化行为。",
      commentSection: "评论",
      commentSectionNote: "控制 AI 如何为 LinkedIn 帖子生成评论。",
      replySection: "回复",
      replySectionNote: "控制回复语气、简洁度和线程附加提示。",
      automationSection: "自动化",
      automationSectionNote: "控制 LinkedIn 页面中的自动发送时机和随机策略。",
      commentLength: "评论长度",
      commentTone: "语气",
      voiceGender: "语气性别",
      engageInEnglish: "评论 / 回复使用英文",
      commentUseEmojis: "使用表情",
      commentEndWithQuestion: "开放式结尾",
      autoSend: "自动点击评论发送",
      randomTone: "随机语气",
      randomLength: "随机长度",
      delayRange: "延迟发布窗口",
      delayMin: "最小秒数",
      delayMax: "最大秒数",
      delayWindowSuffix: "秒",
      replyHint: "评论/回复提示词",
      replyHintHelp: "生成 LinkedIn 评论和回复时会附加这条提示词。",
      replyHintPlaceholder: "例如：先确认，再补充一个具体见解（最多 240 字）",
      modeToLight: "切换到浅色模式",
      modeToDark: "切换到深色模式",
      langToChinese: "切换到中文",
      langToEnglish: "切换到英文"
    }
  };

  let state = null;
  let activeTab = "account";
  let pendingAction = "";
  let pendingPreferenceKey = "";
  let pendingAutomationKey = "";
  let replyHintSaveTimer = 0;
  let errorMessage = "";
  let removeAuthListener = () => {};

  function isGasGxVerified(auth = state?.gasgxAuth) {
    return auth?.status === "enabled" && !!auth?.profileEnabled;
  }

  function getCopy(lang) {
    return COPY[lang] || COPY.en;
  }

  function t(key) {
    return getCopy("zh-CN")[key] || key;
  }

  function i18nText(en, zh) {
    return zh || en;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getOptionLabel(option) {
    return option.zh || option.en;
  }

  function getThemeButtonLabel() {
    return state?.themeMode === "dark" ? "鈽€" : "馃寵";
  }

  function getThemeButtonTitle() {
    return state?.themeMode === "dark" ? t("modeToLight") : t("modeToDark");
  }

  function getCommentLengthOptions() {
    return [
      { value: "1", label: "一段式（仅一段随机 120~200 字符）" },
      { value: "2", label: "二段式（两段随机 120~200 字符）" },
      { value: "3", label: "三段式（每段随机 120~200 字符）" }
    ];
  }

  function getActionHintText() {
    const text = String(errorMessage || "").trim();
    if (!text) return "";
    if (text.includes("请先登录") || text.includes("请先在")) return "请先登录";
    if (text.includes("邮箱") && text.includes("密码")) return "请输邮箱密码";
    if (text.includes("邮箱")) return "请输邮箱";
    if (text.includes("密码错误")) return "密码错误";
    if (text.includes("用户不存在")) return "用户不存在";
    if (text.includes("登录成功")) return "登录成功";
    if (text.includes("退出登录") && text.includes("成功")) return "退出成功";
    if (text.includes("登录失败")) return "登录失败";
    if (text.includes("退出登录") && text.includes("失败")) return "退出失败";
    if (text.includes("验证中")) return "验证中";
    return "请检查";
  }

  function getGasGxCardState(auth) {
    const safe = auth || {};
    const enabled = safe.status === "enabled" && !!safe.profileEnabled;
    const hasError = safe.status === "auth_error";
    const primaryAction = enabled ? { id: "auth-action", label: t("signOut") } : null;

    return {
      enabled,
      hasError,
      statusText: enabled
        ? t("statusEnabled")
        : hasError
          ? t("statusError")
          : t("statusAnonymous"),
      summaryText: enabled
        ? t("gasgxSummaryEnabled")
        : hasError
          ? (state?.lang === "zh-CN" ? t("gasgxSummaryError") : (safe.errorMessage || t("gasgxSummaryError")))
          : t("gasgxSummaryAnonymous"),
      primaryAction,
      emailText: enabled ? (safe.email || t("gasgxNoEmail")) : t("gasgxNoEmail")
    };
  }

  function getStatusClass(authState) {
    if (authState?.enabled) return "is-success";
    if (authState?.blocked) return "is-warning";
    if (authState?.hasError) return "is-danger";
    return "is-neutral";
  }

  function renderSelectOptions(options, value) {
    return options.map((option) => {
      const selected = String(option.value) === String(value) ? " selected" : "";
      return `<option value="${escapeHtml(option.value)}"${selected}>${escapeHtml(option.label)}</option>`;
    }).join("");
  }

  function renderPreferenceSelect(id, label, value, options) {
    const busy = pendingPreferenceKey === id ? " is-busy" : "";
    return `
      <label class="ce-field${busy}">
        <span class="ce-field-label">${escapeHtml(label)}</span>
        <div class="ce-select-wrap">
          <select class="ce-input ce-select" id="${escapeHtml(id)}">
            ${renderSelectOptions(options, value)}
          </select>
          <span class="ce-select-arrow" aria-hidden="true"></span>
        </div>
      </label>
    `;
  }

  function renderPreferenceToggle(id, label, checked) {
    const disabled = pendingPreferenceKey === id || pendingAutomationKey === id ? " disabled" : "";
    const active = checked ? " is-checked" : "";
    return `
      <label class="ce-toggle-row${active}" for="${escapeHtml(id)}">
        <span class="ce-toggle-copy">
          <span class="ce-toggle-label">${escapeHtml(label)}</span>
        </span>
        <span class="ce-toggle-control">
          <input class="ce-checkbox" type="checkbox" id="${escapeHtml(id)}"${checked ? " checked" : ""}${disabled}>
          <span class="ce-toggle-track" aria-hidden="true"><span class="ce-toggle-knob"></span></span>
        </span>
      </label>
    `;
  }

  function renderSection(title, note, body) {
    return `
      <article class="ce-card">
        <div class="ce-section-head">
          <div class="ce-section-title">${escapeHtml(title)}</div>
          <div class="ce-section-note">${escapeHtml(note)}</div>
        </div>
        <div class="ce-settings-grid">${body}</div>
      </article>
    `;
  }

  function renderBrandHeader(copy) {
    return `
      <div class="ce-brand-cluster">
        <div class="ce-brand-badge" aria-hidden="true">
          <img class="ce-brand-badge-img" src="/assets/logo.png" alt="">
        </div>
        <div class="ce-brand-block">
          <div class="ce-brand-kicker">LinkedIn Console</div>
          <div class="ce-brand">${escapeHtml(copy.brand)}</div>
        </div>
      </div>
    `;
  }

  function renderAccountTab() {
    const profile = state?.linkedInProfile || {};
    const gasgx = getGasGxCardState(state?.gasgxAuth);
    const verifyPending = pendingAction === "verify-gasgx-login";
    const avatarHtml = profile.imageUrl
      ? `<img class="ce-avatar-image" src="${escapeHtml(profile.imageUrl)}" alt="${escapeHtml(profile.me || "LinkedIn")}">`
      : `<div class="ce-avatar-fallback">${escapeHtml((profile.me || "?").slice(0, 1).toUpperCase())}</div>`;
    const metaLine = profile.seat
      ? `<div class="ce-profile-meta"><span class="data-numbers">${escapeHtml(t("linkedinSeat"))}</span> 路 ${escapeHtml(profile.seat)}</div>`
      : "";

    return `
      <section class="ce-panel-grid">
        <article class="ce-card">
          <div class="ce-card-label">${escapeHtml(t("linkedinTitle"))}</div>
          <div class="ce-profile-row">
            <div class="ce-profile-copy">
              <div class="ce-profile-name">${escapeHtml(profile.me || t("linkedinEmpty"))}</div>
              ${metaLine}
              <div class="ce-card-note">${escapeHtml(t("linkedinNote"))}</div>
            </div>
            <div class="ce-avatar">${avatarHtml}</div>
          </div>
        </article>

        <article class="ce-card ce-card-accent">
          <div class="ce-card-head">
            <div class="ce-card-head-main">
              <div class="ce-card-title">${escapeHtml(t("gasgxTitle"))}</div>
              ${gasgx.enabled ? `<div class="ce-card-subtitle">${escapeHtml(gasgx.emailText)}</div>` : ""}
              <div class="ce-card-note">${escapeHtml(gasgx.enabled ? t("gasgxNote") : "请先完成一次 GasGx 登录验证，再使用偏好设置。")}</div>
            </div>
            ${gasgx.enabled ? `<span class="ce-status-pill ${getStatusClass(gasgx)}">${escapeHtml(gasgx.statusText)}</span>` : ""}
          </div>
          ${gasgx.enabled
            ? `<div class="ce-card-body">${escapeHtml(gasgx.summaryText)}</div>`
            : ""
          }
          ${gasgx.enabled ? "" : `
            <div class="ce-settings-grid" style="margin-top: 12px;">
              <label class="ce-field">
                <span class="ce-field-label">${escapeHtml("GasGx邮箱")}</span>
                <input class="ce-input" type="email" id="gasgx-login-email" autocomplete="username" placeholder="${escapeHtml("请输GasGx邮箱")}" value="${escapeHtml(state?.gasgxAuth?.email || "")}" ${verifyPending ? "disabled" : ""}>
              </label>
              <label class="ce-field">
                <span class="ce-field-label">${escapeHtml(i18nText("Password", "瀵嗙爜"))}</span>
                <input class="ce-input" type="password" id="gasgx-login-password" autocomplete="current-password" placeholder="${escapeHtml("请输GasGx密码")}" ${verifyPending ? "disabled" : ""}>
              </label>
            </div>
          `}
          <div class="ce-action-row">
            ${getActionHintText() ? `<div class="ce-action-hint ce-card-error">${escapeHtml(getActionHintText())}</div>` : ""}
            ${gasgx.enabled
              ? (gasgx.primaryAction ? `<button class="ce-btn ce-btn-primary" type="button" id="${gasgx.primaryAction.id}" ${pendingAction ? "disabled" : ""}>${escapeHtml(gasgx.primaryAction.label)}</button>` : "")
              : `<button class="ce-btn ce-btn-primary" type="button" id="verify-gasgx-login" ${pendingAction ? "disabled" : ""}>${verifyPending ? escapeHtml("验证中...") : escapeHtml("GasGx登录")}</button>`
            }
          </div>
        </article>
      </section>
    `;
  }

  function renderPreferencesTab() {
    if (!isGasGxVerified()) {
      return `
        <section class="ce-panel-grid">
          <article class="ce-card">
            <div class="ce-card-label">${escapeHtml(i18nText("GasGx Verification Required", "闇€瑕?GasGx 楠岃瘉"))}</div>
            <div class="ce-card-body">${escapeHtml("请先在“账号”页完成一次 GasGx 登录验证，再使用偏好和自动化。")}</div>
          </article>
        </section>
      `;
    }

    const preferences = state?.preferences || {};
    const autoSend = state?.autoSend || {};
    const randomStrategy = state?.randomStrategy || {};

    const commentBody = [
      renderPreferenceSelect("pref-comment-length", t("commentLength"), String(preferences.commentLength || 2), getCommentLengthOptions()),
      renderPreferenceSelect("pref-comment-tone", t("commentTone"), preferences.commentTone || "Polite", TONE_OPTIONS.map((item) => ({ value: item.value, label: getOptionLabel(item) }))),
      renderPreferenceSelect("pref-voice-gender", t("voiceGender"), preferences.voiceGender || "NotSpecified", VOICE_OPTIONS.map((item) => ({ value: item.value, label: getOptionLabel(item) }))),
      renderPreferenceToggle("pref-engage-english", t("engageInEnglish"), !!preferences.engageInEnglish),
      renderPreferenceToggle("pref-use-emojis", t("commentUseEmojis"), !!preferences.commentUseEmojis),
      renderPreferenceToggle("pref-open-ended", t("commentEndWithQuestion"), !!preferences.commentEndWithQuestion)
    ].join("");

    const replyBody = [
      `
        <label class="ce-field">
          <span class="ce-field-label">${escapeHtml(t("replyHint"))}</span>
          <textarea class="ce-input ce-textarea" id="pref-reply-hint" rows="3" maxlength="240" placeholder="${escapeHtml(t("replyHintPlaceholder"))}">${escapeHtml(state?.replyHint || "")}</textarea>
          <span class="ce-field-help">${escapeHtml(t("replyHintHelp"))}</span>
        </label>
      `
    ].join("");

    const delayDisabled = autoSend.enabled ? "" : "disabled";
    const automationBody = [
      renderPreferenceToggle("pref-auto-send", t("autoSend"), !!autoSend.enabled),
      renderPreferenceToggle("pref-random-tone", t("randomTone"), !!randomStrategy.randomToneEnabled),
      renderPreferenceToggle("pref-random-length", t("randomLength"), !!randomStrategy.randomLengthEnabled),
      `
        <div class="ce-inline-fields">
          <label class="ce-field">
            <span class="ce-field-label">${escapeHtml(t("delayMin"))}</span>
            <input class="ce-input ce-number data-numbers" type="number" id="pref-delay-min" min="0" max="30" step="1" value="${escapeHtml(String(autoSend.minSec ?? 2))}" ${delayDisabled}>
          </label>
          <label class="ce-field">
            <span class="ce-field-label">${escapeHtml(t("delayMax"))}</span>
            <input class="ce-input ce-number data-numbers" type="number" id="pref-delay-max" min="0" max="30" step="1" value="${escapeHtml(String(autoSend.maxSec ?? 7))}" ${delayDisabled}>
          </label>
        </div>
      `,
      `<div class="ce-inline-note"><span class="ce-pill-label">${escapeHtml(t("delayRange"))}</span><span class="data-numbers">${escapeHtml(String(autoSend.minSec ?? 2))} ~ ${escapeHtml(String(autoSend.maxSec ?? 7))}${escapeHtml(t("delayWindowSuffix"))}</span></div>`
    ].join("");

    return `
      <section class="ce-panel-grid">
        ${renderSection(t("commentSection"), t("commentSectionNote"), commentBody)}
        ${renderSection(t("replySection"), t("replySectionNote"), replyBody)}
        ${renderSection(t("automationSection"), t("automationSectionNote"), automationBody)}
      </section>
    `;
  }

  function renderShell() {
    const canSeePreferences = isGasGxVerified();
    if (!canSeePreferences && activeTab === "preferences") {
      activeTab = "account";
    }
    return `
      <div class="ce-shell">
        <div class="ce-shell-bg" aria-hidden="true"></div>
        <header class="ce-header header-container">
          ${renderBrandHeader({
            brand: t("brand"),
            strapline: t("strapline")
          })}
          <div class="ce-runtime-controls">
            <button type="button" class="ce-runtime-btn" id="toggle-theme" title="${escapeHtml(getThemeButtonTitle())}">${escapeHtml(getThemeButtonLabel())}</button>
          </div>
        </header>

        <nav class="ce-tabs" aria-label="Popup tabs">
          <button type="button" class="ce-tab${activeTab === "account" ? " is-active" : ""}" data-tab="account">${escapeHtml(t("tabsAccount"))}</button>
          <button
            type="button"
            class="ce-tab${activeTab === "preferences" ? " is-active" : ""}${!canSeePreferences ? " is-locked" : ""}"
            data-tab="preferences"
            title="${escapeHtml(!canSeePreferences ? "登录后可用偏好设置" : t("tabsPreferences"))}"
          >${escapeHtml(t("tabsPreferences"))}</button>
        </nav>

        <main class="ce-main ${activeTab === "account" ? "ce-main-account" : "ce-main-preferences"}">
          ${activeTab === "account" ? renderAccountTab() : renderPreferencesTab()}
        </main>
      </div>
    `;
  }

  function renderLoading() {
    const copy = getCopy(document.documentElement.lang || state?.lang || "en");
    root.innerHTML = `
      <div class="ce-shell">
        <div class="ce-shell-bg" aria-hidden="true"></div>
        <header class="ce-header">
          ${renderBrandHeader(copy)}
        </header>
        <main class="ce-main ce-main-account">
          <article class="ce-card ce-loading-card">
            <div class="ce-spinner" aria-hidden="true"></div>
            <div class="ce-loading-text">${escapeHtml(copy.loading)}</div>
          </article>
        </main>
      </div>
    `;
  }

  function renderError(message) {
    const copy = getCopy(document.documentElement.lang || state?.lang || "en");
    root.innerHTML = `
      <div class="ce-shell">
        <div class="ce-shell-bg" aria-hidden="true"></div>
        <header class="ce-header">
          ${renderBrandHeader(copy)}
        </header>
        <main class="ce-main ce-main-account">
          <article class="ce-card ce-error-card">
            <div class="ce-error-title">${escapeHtml(message || copy.genericError)}</div>
            <button class="ce-btn ce-btn-primary" type="button" id="reload-popup">${escapeHtml(copy.reload)}</button>
          </article>
        </main>
      </div>
    `;
    root.querySelector("#reload-popup")?.addEventListener("click", () => {
      void refreshState();
    });
  }

  function render() {
    if (!runtime) {
      renderError(getCopy("en").runtimeMissing);
      return;
    }
    if (!state) {
      renderLoading();
      return;
    }
    state.lang = "zh-CN";
    document.documentElement.lang = "zh-CN";
    document.title = t("brand");
    root.innerHTML = renderShell();
    bindEvents();
  }

  function setError(message) {
    errorMessage = message || "";
    render();
  }

  async function refreshState() {
    renderLoading();
    errorMessage = "";
    try {
      state = await runtime.loadState();
      state.lang = "zh-CN";
      activeTab = isGasGxVerified(state?.gasgxAuth) ? "preferences" : "account";
      render();
    } catch (_err) {
      renderError(getCopy("en").genericError);
    }
  }

  async function withPending(actionKey, task, fallbackMessage) {
    pendingAction = actionKey;
    render();
    try {
      await task();
    } catch (err) {
      const message = err?.message ? String(err.message) : (fallbackMessage || t("saveFailed"));
      setError(message);
    } finally {
      pendingAction = "";
      render();
    }
  }

  async function savePreference(key, value) {
    const previousPreferences = { ...(state?.preferences || {}) };
    const nextPreferences = { ...previousPreferences, [key]: value };
    const keyToInputId = {
      commentLength: "pref-comment-length",
      commentTone: "pref-comment-tone",
      voiceGender: "pref-voice-gender",
      engageInEnglish: "pref-engage-english",
      commentUseEmojis: "pref-use-emojis",
      commentEndWithQuestion: "pref-open-ended",
    };
    pendingPreferenceKey = keyToInputId[key] || "";
    try {
      state.preferences = nextPreferences;
      errorMessage = "";
      render();
      state.preferences = await runtime.savePreferences({ [key]: value });
      pendingPreferenceKey = "";
      render();
    } catch (_err) {
      state.preferences = previousPreferences;
      pendingPreferenceKey = "";
      setError(t("saveFailed"));
    }
  }

  async function saveAutoSend() {
    const minInput = root.querySelector("#pref-delay-min");
    const maxInput = root.querySelector("#pref-delay-max");
    const previousAutoSend = { ...(state?.autoSend || {}) };
    const nextAutoSend = {
      enabled: !!root.querySelector("#pref-auto-send")?.checked,
      minSec: Number(minInput?.value ?? state.autoSend.minSec),
      maxSec: Number(maxInput?.value ?? state.autoSend.maxSec)
    };
    pendingAutomationKey = "auto-send";
    try {
      state.autoSend = nextAutoSend;
      errorMessage = "";
      render();
      state.autoSend = await runtime.saveAutoSend(nextAutoSend);
      pendingAutomationKey = "";
      render();
    } catch (_err) {
      state.autoSend = previousAutoSend;
      pendingAutomationKey = "";
      setError(t("saveFailed"));
    }
  }

  async function saveRandomStrategy() {
    const previousRandomStrategy = { ...(state?.randomStrategy || {}) };
    const nextRandomStrategy = {
      randomToneEnabled: !!root.querySelector("#pref-random-tone")?.checked,
      randomLengthEnabled: !!root.querySelector("#pref-random-length")?.checked
    };
    pendingAutomationKey = "random-strategy";
    try {
      state.randomStrategy = nextRandomStrategy;
      errorMessage = "";
      render();
      state.randomStrategy = await runtime.saveRandomStrategy(nextRandomStrategy);
      pendingAutomationKey = "";
      render();
    } catch (_err) {
      state.randomStrategy = previousRandomStrategy;
      pendingAutomationKey = "";
      setError(t("saveFailed"));
    }
  }

  async function saveReplyHint() {
    const input = root.querySelector("#pref-reply-hint");
    if (!(input instanceof HTMLTextAreaElement)) return;
    try {
      state.replyHint = await runtime.saveReplyHint(input.value);
      input.value = state.replyHint;
      errorMessage = "";
    } catch (_err) {
      setError(t("saveFailed"));
    }
  }

  function scheduleSaveReplyHint() {
    clearTimeout(replyHintSaveTimer);
    replyHintSaveTimer = window.setTimeout(() => {
      void saveReplyHint();
    }, 280);
  }

  function bindEvents() {
    root.querySelector("#toggle-theme")?.addEventListener("click", async () => {
      const next = state.themeMode === "dark" ? "light" : "dark";
      state.themeMode = await runtime.setTheme(next);
      errorMessage = "";
      render();
    });

    root.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextTab = button.getAttribute("data-tab") || "account";
        if (nextTab === "preferences" && !isGasGxVerified()) {
          setError(MSG_PREFERENCES_SIGNIN_REQUIRED);
          return;
        }
        activeTab = nextTab;
        errorMessage = "";
        render();
      });
    });

    root.querySelector("#auth-action")?.addEventListener("click", () => {
      void (async () => {
        pendingAction = "auth-action";
        errorMessage = MSG_LOGOUT_START;
        render();
        try {
          if (typeof runtime?.signOutGasGx === "function") {
            const runtimeState = await runtime.signOutGasGx();
            state = {
              ...(runtimeState || state || {}),
              lang: "zh-CN"
            };
          }
          activeTab = "account";
          errorMessage = MSG_LOGOUT_SUCCESS;
        } catch (error) {
          errorMessage = `${MSG_LOGOUT_FAILED} ${error?.message || ""}`.trim();
        } finally {
          pendingAction = "";
          render();
        }
      })();
    });

    root.querySelector("#verify-gasgx-login")?.addEventListener("click", () => {
      const emailInput = root.querySelector("#gasgx-login-email");
      const passwordInput = root.querySelector("#gasgx-login-password");
      const email = emailInput instanceof HTMLInputElement ? emailInput.value.trim() : "";
      const password = passwordInput instanceof HTMLInputElement ? passwordInput.value : "";
      void (async () => {
        pendingAction = "verify-gasgx-login";
        errorMessage = MSG_LOGIN_START;
        render();
        try {
          if (typeof runtime?.verifyGasGxLoginOnce !== "function") {
            throw new Error("GasGx login runtime is unavailable.");
          }
          const runtimeState = await runtime.verifyGasGxLoginOnce(email, password);
          state = {
            ...(runtimeState || state || {}),
            lang: "zh-CN"
          };
          if (!isGasGxVerified(state?.gasgxAuth)) {
            throw new Error(String(state?.gasgxAuth?.errorMessage || "GasGx session is unavailable after sign-in."));
          }
          activeTab = "account";
          errorMessage = MSG_LOGIN_SUCCESS;
        } catch (error) {
          errorMessage = `${MSG_LOGIN_FAILED} ${error?.message || ""}`.trim();
        } finally {
          pendingAction = "";
          render();
        }
      })();
    });

    root.querySelector("#pref-comment-length")?.addEventListener("change", (event) => {
      void savePreference("commentLength", Number(event.target.value));
    });
    root.querySelector("#pref-comment-tone")?.addEventListener("change", (event) => {
      void savePreference("commentTone", event.target.value);
    });
    root.querySelector("#pref-voice-gender")?.addEventListener("change", (event) => {
      void savePreference("voiceGender", event.target.value);
    });
    root.querySelector("#pref-engage-english")?.addEventListener("change", (event) => {
      void savePreference("engageInEnglish", !!event.target.checked);
    });
    root.querySelector("#pref-use-emojis")?.addEventListener("change", (event) => {
      void savePreference("commentUseEmojis", !!event.target.checked);
    });
    root.querySelector("#pref-open-ended")?.addEventListener("change", (event) => {
      void savePreference("commentEndWithQuestion", !!event.target.checked);
    });
    root.querySelector("#pref-auto-send")?.addEventListener("change", () => {
      void saveAutoSend();
    });
    root.querySelector("#pref-delay-min")?.addEventListener("change", () => {
      void saveAutoSend();
    });
    root.querySelector("#pref-delay-max")?.addEventListener("change", () => {
      void saveAutoSend();
    });

    root.querySelector("#pref-random-tone")?.addEventListener("change", () => {
      void saveRandomStrategy();
    });
    root.querySelector("#pref-random-length")?.addEventListener("change", () => {
      void saveRandomStrategy();
    });

    root.querySelector("#pref-reply-hint")?.addEventListener("input", () => {
      scheduleSaveReplyHint();
    });
    root.querySelector("#pref-reply-hint")?.addEventListener("change", () => {
      scheduleSaveReplyHint();
    });
    root.querySelector("#pref-reply-hint")?.addEventListener("blur", () => {
      clearTimeout(replyHintSaveTimer);
      void saveReplyHint();
    });
  }

  function start() {
    runtime = window.__cePopupRuntime || null;
    if (!runtime) {
      if (document.readyState !== "complete") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
        return;
      }
      renderError(getCopy("en").runtimeMissing);
      return;
    }

    removeAuthListener = runtime.subscribeAuthChanged((nextState) => {
      state = nextState;
      state.lang = "zh-CN";
      activeTab = isGasGxVerified(state?.gasgxAuth) ? "preferences" : "account";
      render();
    });

    window.addEventListener("unload", () => {
      removeAuthListener();
    }, { once: true });

    void refreshState();
  }

  start();
})();



