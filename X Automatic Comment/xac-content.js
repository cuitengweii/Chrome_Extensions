(() => {
  if (window.__xacContentLoaded) return
  window.__xacContentLoaded = true

  const K = {
    lang: 'xac.language',
    autoPost: 'xac.autoPostEnabled',
    googleSession: 'xac.googleSession',
    profileMeta: 'xac.profileMeta',
    advanced: 'xac.advancedSettings'
  }
  const DEFAULT_PROFILES = [
    { id: 'preset_growth', name: 'Growth Hacker', emoji: 'GH', tone: 'bold and data-driven', goal: 'engagement', length: 'short', instructions: 'Use one concrete insight and end with a thought-provoking line.', persona: 'I build growth systems for creator products.', language: 'en', preset: true },
    { id: 'preset_authority', name: 'Authority Mode', emoji: 'AM', tone: 'authoritative and precise', goal: 'authority', length: 'medium', instructions: 'Use a strong framing sentence and one practical takeaway.', persona: 'I focus on strategic analysis and market positioning.', language: 'en', preset: true },
    { id: 'preset_friendly', name: 'Friendly Builder', emoji: 'FB', tone: 'warm and approachable', goal: 'networking', length: 'short', instructions: 'Be supportive, specific, and easy to respond to.', persona: 'I collaborate with founders and operators in public.', language: 'en', preset: true }
  ]
  const PRESET_PROFILE_I18N = {
    en: {
      preset_growth: {
        name: 'Growth Hacker',
        tone: 'bold and data-driven',
        instructions: 'Use one concrete insight and end with a thought-provoking line.',
        persona: 'I build growth systems for creator products.'
      },
      preset_authority: {
        name: 'Authority Mode',
        tone: 'authoritative and precise',
        instructions: 'Use a strong framing sentence and one practical takeaway.',
        persona: 'I focus on strategic analysis and market positioning.'
      },
      preset_friendly: {
        name: 'Friendly Builder',
        tone: 'warm and approachable',
        instructions: 'Be supportive, specific, and easy to respond to.',
        persona: 'I collaborate with founders and operators in public.'
      }
    },
    zh: {
      preset_growth: {
        name: '增长黑客',
        tone: '大胆、数据驱动',
        instructions: '先给一个具体洞察，再抛出一个可讨论的问题。',
        persona: '我专注于创作者产品增长系统。'
      },
      preset_authority: {
        name: '权威模式',
        tone: '权威、精准',
        instructions: '先立观点，再给一个可执行结论。',
        persona: '我专注战略分析和市场定位。'
      },
      preset_friendly: {
        name: '友好建设者',
        tone: '温和、易互动',
        instructions: '表达支持，给出具体点，便于对方接话。',
        persona: '我在公开场景与创始人和运营者协作。'
      }
    }
  }
  const DEFAULT_QUICK = { engagementMode: 'safe', goal: 'engagement', length: 'short', customInstructions: '', persona: '' }
  const DEFAULT_X_SEARCH_QUERY = 'min_replies:1 -filter:replies'
  const DEFAULT_ADVANCED = {
    autoLike: false,
    autoRetweet: false,
    autoFollow: false,
    scrollStep: 900,
    scrollDelayMs: 1800,
    replyDelayMinMs: 3500,
    replyDelayMaxMs: 8000,
    actionDelayMs: 220,
    maxIdleLoops: 6,
    minTweetChars: 0,
    skipIfContainsLinks: false,
    skipIfContainsImages: false,
    searchQuery: DEFAULT_X_SEARCH_QUERY,
    searchIncludeTerms: '',
    searchExcludeTerms: '',
    searchKeyword: '',
    searchUseGm: true,
    searchUseGn: true,
    searchMinReplies: 1,
    searchExcludeReplies: true,
    debugPrompt: '',
    debugOutput: ''
  }
  const I18N = {
    en: {
      title: 'X Automatic Comment', sub: 'Profile + Context + Auto Reply', open: 'Open', close: 'Close', lang: 'Language',
      profile: 'Profile', newP: 'New', delP: 'Delete', mode: 'Mode', modeSafe: 'Safe', modeSpicy: 'Spicy', modeViral: 'Viral',
      goal: 'Goal', len: 'Length', ci: 'Custom instructions', persona: 'Persona', autoPost: 'Auto-post after generate',
      max: 'Max auto replies (0 = unlimited)', start: 'Start Auto Reply', stop: 'Stop Auto Reply', reply: 'AI Reply',
      gen: 'Generating', ok: 'Inserted', fail: 'Failed', login: 'Google login required', signIn: 'Sign in with Google',
      logout: 'Logout',
      working: 'Working...', saving: 'Saving settings...', loggingIn: 'Signing in with Google...',
      signedIn: 'Google signed in', signedOut: 'Google not signed in', signInDone: 'Google login success', signInFail: 'Google login failed',
      noc: 'No tweet content found', idle: 'Idle', run: 'Running', stopped: 'Stopped', done: 'Done',
      trimmed: 'Auto-shortened to fit X non-premium limit',
      accountSec: 'Account',
      aiProfileSec: 'AI Profile',
      interactionSec: 'Interaction Mode',
      quickSec: 'Quick Settings',
      settingsSec: 'Settings',
      planLine: 'Plan: Free',
      remainLine: 'Replies left today: local mode',
      upgradePro: 'Upgrade to PRO',
      editP: 'Edit',
      profileNewTitle: 'New Profile',
      profileEditTitle: 'Edit Profile',
      profileName: 'Name',
      profileEmoji: 'Emoji',
      profileTone: 'Tone',
      profileLang: 'Language',
      includeCta: 'Include CTA',
      saveProfile: 'Save Profile',
      cancel: 'Cancel',
      statusSaved: 'Profile saved',
      langZh: 'Chinese',
      langEn: 'English',
      unknownError: 'Unknown error',
      emptyModelOutput: 'Empty model output',
      editorMissing: 'No editor found',
      insertFailed: 'Failed to insert text into editor',
      guideSec: 'Usage Guide',
      guideLine1: 'Prompt + Output is debug mode for manual one-off generation.',
      guideLine2: 'Custom instructions are short-term task constraints for this run.',
      guideLine3: 'Persona memory is your long-term identity and stable tone.',
      advancedSec: 'Advanced (Fully Open)',
      autoLike: 'Auto-like',
      autoRetweet: 'Auto-retweet',
      autoFollow: 'Auto-follow',
      scrollStep: 'Scroll step (px)',
      scrollDelayMs: 'Scroll delay (ms)',
      replyDelayMinMs: 'Reply delay min (ms)',
      replyDelayMaxMs: 'Reply delay max (ms)',
      actionDelayMs: 'Action delay (ms)',
      maxIdleLoops: 'Max idle loops',
      minTweetChars: 'Min tweet chars',
      skipIfContainsLinks: 'Skip posts with links',
      skipIfContainsImages: 'Skip posts with images',
      searchQuery: 'Search query',
      searchKeyword: 'Include words',
      searchIncludeTerms: 'Include words',
      searchExcludeTerms: 'Exclude words',
      searchIncludePlaceholder: 'e.g. 闲鱼, 二手, 捡漏',
      searchIncludePlaceholderA: 'Term A',
      searchIncludePlaceholderB: 'Term B',
      searchOr: 'OR',
      searchExcludePlaceholder: 'e.g. 返利, 广告, 抽奖',
      searchUseGm: 'Use GM',
      searchUseGn: 'Use GN',
      searchMinReplies: 'Min comments',
      searchExcludeReplies: 'Exclude replies feed',
      searchPreview: 'Query Preview',
      openSearch: 'Open Search',
      debugSec: 'Debug Prompt + Output',
      debugGenerate: 'Generate Debug',
      debugCopy: 'Copy Debug',
      debugPrompt: 'Debug prompt',
      debugOutput: 'Debug output',
      savedAdvanced: 'Advanced settings saved',
      stepProfile: 'Step 1 · Choose Profile',
      stepProfileDesc: 'Select and edit who this account sounds like before generating anything.',
      stepAccount: 'Preparation · Account',
      stepAccountDesc: 'Confirm login status and language first to avoid misconfigured runs.',
      stepStrategy: 'Step 2 · Set Strategy',
      stepStrategyDesc: 'Choose interaction intensity, objective, and target reply length.',
      stepContent: 'Step 3 · Content Constraints',
      stepContentDesc: 'Add short-term instructions and long-term persona memory for output control.',
      stepExecution: 'Step 4 · Run Settings',
      stepExecutionDesc: 'Set send behavior and run limits before starting automation.',
      stepAdvanced: 'Step 5 · Advanced',
      stepAdvancedDesc: 'Fine-tune actions, pacing, filters, and debugging tools.',
      sectionAutoActions: 'Auto Actions',
      sectionFlow: 'Flow Pace',
      sectionFilter: 'Content Filters',
      helpMode: 'Controls tone intensity: Safe = low risk, Spicy = more direct, Viral = strongest hook.',
      helpGoal: 'Defines reply objective: Engage / Authority / Debate / Network.',
      helpLen: 'Controls expected length of generated replies: Short / Medium / Long.',
      helpCi: 'Temporary instruction for this run only. Best for campaign-specific constraints.',
      helpPersona: 'Long-term identity memory. Keeps stable voice across replies.',
      helpAutoPost: 'When on, the extension will click the send button right after inserting generated text.',
      helpMax: 'Auto-reply cap per run. 0 means unlimited until stopped.',
      helpAutoActions: 'Extra actions after generating reply: like / retweet / follow.',
      helpFlow: 'Controls scan and pacing speed: scroll speed, delay, reply interval, idle limit.',
      helpFilter: 'Skip unsuitable posts by min text length, links/images, and quickly jump to search.',
      helpDebug: 'Manual one-off prompt testing area. Use to tune output before full automation.'
    },
    zh: {
      title: 'X Automatic Comment', sub: '人设 + 上下文 + 自动回复', open: '展开', close: '收起', lang: '语言',
      profile: '人设', newP: '新建', delP: '删除', mode: '模式', modeSafe: '稳健', modeSpicy: '激进', modeViral: '爆款',
      goal: '目标', len: '长度', ci: '自定义指令', persona: '人设记忆', autoPost: '生成后自动发送',
      max: '自动回复上限(0=不限)', start: '开始自动回复', stop: '停止自动回复', reply: 'AI回复',
      gen: '生成中', ok: '已写入', fail: '失败', login: '需要先完成 Google 登录', signIn: 'Google 登录',
      logout: '登出',
      working: '处理中...', saving: '正在保存设置...', loggingIn: '正在登录 Google...',
      signedIn: 'Google 已登录', signedOut: 'Google 未登录', signInDone: 'Google 登录成功', signInFail: 'Google 登录失败',
      noc: '未提取到推文内容', idle: '空闲', run: '运行中', stopped: '已停止', done: '完成',
      trimmed: '已自动缩短到 X 普通账号字数限制内',
      accountSec: '账户',
      aiProfileSec: 'AI配置文件',
      interactionSec: '互动模式',
      quickSec: '快速设置',
      settingsSec: '设置',
      planLine: '计划：免费',
      remainLine: '剩余回复：本地模式',
      upgradePro: '升级到PRO版',
      editP: '编辑',
      profileNewTitle: '新建个人资料',
      profileEditTitle: '编辑个人资料',
      profileName: '姓名',
      profileEmoji: '表情符号',
      profileTone: '语气风格',
      profileLang: '语言',
      includeCta: '包含行动号召',
      saveProfile: '保存资料',
      cancel: '取消',
      statusSaved: '资料已保存',
      langZh: '中文',
      langEn: '英文',
      unknownError: '未知错误',
      emptyModelOutput: '模型返回为空',
      editorMissing: '未找到回复输入框',
      insertFailed: '写入回复框失败',
      guideSec: '功能说明',
      guideLine1: '提示词 + 输出是调试模式，用于手动单次生成。',
      guideLine2: '自定义指令是本轮任务约束，影响当前回复策略。',
      guideLine3: '人设记忆是长期身份设定，决定稳定语气与风格。',
      advancedSec: '高级功能（全开放）',
      autoLike: '自动点赞',
      autoRetweet: '自动转推',
      autoFollow: '自动关注',
      scrollStep: '滚动步长（px）',
      scrollDelayMs: '滚动间隔（ms）',
      replyDelayMinMs: '回复间隔最小值（ms）',
      replyDelayMaxMs: '回复间隔最大值（ms）',
      actionDelayMs: '动作间隔（ms）',
      maxIdleLoops: '最大空转次数',
      minTweetChars: '推文字数下限',
      skipIfContainsLinks: '跳过含链接推文',
      skipIfContainsImages: '跳过含图片推文',
      searchQuery: '搜索配置',
      searchKeyword: '包含词',
      searchIncludeTerms: '包含词',
      searchExcludeTerms: '排除词',
      searchIncludePlaceholder: '例如：闲鱼, 二手, 捡漏',
      searchIncludePlaceholderA: '词1',
      searchIncludePlaceholderB: '词2',
      searchOr: '或',
      searchExcludePlaceholder: '例如：返利, 广告, 抽奖',
      searchUseGm: '启用 GM',
      searchUseGn: '启用 GN',
      searchMinReplies: '最小评论数',
      searchExcludeReplies: '排除回复流',
      searchPreview: '查询预览',
      openSearch: '打开搜索',
      debugSec: '调试提示词 + 输出',
      debugGenerate: '调试生成',
      debugCopy: '复制调试输出',
      debugPrompt: '调试提示词',
      debugOutput: '调试输出',
      savedAdvanced: '高级设置已保存',
      stepProfile: '步骤1 · 选择人设',
      stepProfileDesc: '先选定账号“说话的人设”，再进行后续生成。',
      stepAccount: '准备阶段 · 账号',
      stepAccountDesc: '先确认登录状态与语言，避免后续配置错位。',
      stepStrategy: '步骤2 · 设置策略',
      stepStrategyDesc: '确定互动强度、目标和回复长度预期。',
      stepContent: '步骤3 · 内容约束',
      stepContentDesc: '补充本次任务约束与长期人设记忆，控制输出风格。',
      stepExecution: '步骤4 · 执行设置',
      stepExecutionDesc: '开始前先设置发送行为和自动回复上限。',
      stepAdvanced: '步骤5 · 高级功能',
      stepAdvancedDesc: '精细控制动作、节奏、过滤规则和调试能力。',
      sectionAutoActions: '自动动作',
      sectionFlow: '节奏控制',
      sectionFilter: '内容过滤',
      helpMode: '控制语气强度：稳健=低风险，激进=更直接，爆款=钩子最强。',
      helpGoal: '定义回复目标：参与 / 权威 / 辩论 / 网络。',
      helpLen: '控制期望回复长度：短 / 中等 / 长。',
      helpCi: '本次任务的临时约束，适合活动或话题专项要求。',
      helpPersona: '长期身份记忆，让回复风格在多次生成中保持稳定。',
      helpAutoPost: '开启后，写入回复框后会自动点击发送按钮。',
      helpMax: '本轮自动回复上限，0 表示不限制直到手动停止。',
      helpAutoActions: '生成后附加动作：点赞 / 转推 / 关注。',
      helpFlow: '控制扫描与执行节奏：滚动速度、间隔、回复间隔、空转次数。',
      helpFilter: '通过最小字数、链接/图片过滤跳过不合适推文，并可快速跳转搜索。',
      helpDebug: '手动单次调试区，先试提示词效果，再用于自动化。'
    }
  }

  const S = {
    lang: 'en', open: false, myHandle: '',
    profile: { profiles: [...DEFAULT_PROFILES], activeProfileId: DEFAULT_PROFILES[0].id, quickSettings: { ...DEFAULT_QUICK } },
    profileMeta: {},
    advanced: { ...DEFAULT_ADVANCED },
    editor: { open: false, mode: 'new', targetId: '', draft: null },
    autoPost: false, signedIn: false, pendingAction: '', auto: { active: false, count: 0, max: 0 }, status: '', scheduled: false, idle: 0
  }

  const HELP_KEY_TO_I18N = Object.freeze({
    mode: 'helpMode',
    goal: 'helpGoal',
    len: 'helpLen',
    ci: 'helpCi',
    persona: 'helpPersona',
    autoPost: 'helpAutoPost',
    max: 'helpMax',
    autoActions: 'helpAutoActions',
    flow: 'helpFlow',
    filter: 'helpFilter',
    debug: 'helpDebug'
  })

  const t = (k) => (I18N[S.lang] && I18N[S.lang][k]) || I18N.en[k] || k
  const normLang = (v) => String(v || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  const s = (v, f = '') => { const t = typeof v === 'string' ? v.trim() : ''; return t || f }
  const n = (v, f = 0) => { const x = Number(v); return Number.isFinite(x) ? x : f }
  const b = (v, f = false) => typeof v === 'boolean' ? v : (typeof v === 'string' ? ['1','true','yes','on'].includes(v.toLowerCase()) : f)
  const clampNum = (v, min, max, f) => Math.min(max, Math.max(min, Math.round(n(v, f))))
  const normalizeSearchKeyword = (v) => String(v || '').replace(/\s+/g, ' ').trim()
  const normalizeSearchTermInput = (v) => String(v || '')
    .split(/[,\n;；，]+/)
    .map((item) => normalizeSearchKeyword(item))
    .filter(Boolean)
    .join(', ')
  const parseSearchTerms = (v) => normalizeSearchTermInput(v)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const formatSearchTermForQuery = (term) => {
    const clean = normalizeSearchKeyword(term).replace(/^[-+]+/, '')
    if (!clean) return ''
    const unquoted = clean.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
    const escaped = unquoted.replace(/"/g, '\\"')
    return /\s/.test(unquoted) ? `"${escaped}"` : escaped
  }
  const deriveSearchControlsFromQuery = (rawQuery) => {
    const text = s(rawQuery, DEFAULT_X_SEARCH_QUERY)
    const hasGm = /\bgm\b/i.test(text)
    const hasGn = /\bgn\b/i.test(text)
    const minMatch = text.match(/\bmin_replies:(\d{1,4})\b/i)
    const excludeReplies = /\-filter:replies\b/i.test(text)
    const excludedRawTerms = Array.from(text.matchAll(/(?:^|\s)-(?:"([^"]+)"|'([^']+)'|([^\s()]+))/g))
      .map((match) => match[1] || match[2] || match[3] || '')
      .map((term) => normalizeSearchKeyword(term))
      .filter((term) => term && !/^filter:replies$/i.test(term))
    const includeTerms = normalizeSearchTermInput(
      text
        .replace(/\bmin_replies:\d+\b/ig, ' ')
        .replace(/\-filter:replies\b/ig, ' ')
        .replace(/(?:^|\s)-(?:"[^"]+"|'[^']+'|[^\s()]+)/g, ' ')
        .replace(/[()]/g, ' ')
        .replace(/\bOR\b/ig, ' ')
        .replace(/\bAND\b/ig, ' ')
        .replace(/\bgm\b/ig, ' ')
        .replace(/\bgn\b/ig, ' ')
    )
    return {
      searchIncludeTerms: includeTerms,
      searchExcludeTerms: normalizeSearchTermInput(excludedRawTerms.join(', ')),
      searchKeyword: includeTerms,
      searchUseGm: hasGm || (!hasGm && !hasGn),
      searchUseGn: hasGn || (!hasGm && !hasGn),
      searchMinReplies: clampNum(minMatch?.[1], 0, 9999, DEFAULT_ADVANCED.searchMinReplies),
      searchExcludeReplies: excludeReplies
    }
  }
  const buildSearchQueryFromControls = (source) => {
    const adv = source && typeof source === 'object' ? source : {}
    const minReplies = clampNum(adv.searchMinReplies, 0, 9999, DEFAULT_ADVANCED.searchMinReplies)
    const includeTerms = parseSearchTerms(adv.searchIncludeTerms || adv.searchKeyword)
    const excludeTerms = parseSearchTerms(adv.searchExcludeTerms)
    const baseTerms = []
    if (includeTerms.length === 1) {
      const only = formatSearchTermForQuery(includeTerms[0])
      if (only) baseTerms.push(only)
    } else if (includeTerms.length > 1) {
      const formatted = includeTerms.map((term) => formatSearchTermForQuery(term)).filter(Boolean)
      if (formatted.length) baseTerms.push(`(${formatted.join(' OR ')})`)
    }
    excludeTerms.forEach((term) => {
      const formatted = formatSearchTermForQuery(term)
      if (formatted) baseTerms.push(`-${formatted}`)
    })
    baseTerms.push(`min_replies:${minReplies}`)
    if (b(adv.searchExcludeReplies, DEFAULT_ADVANCED.searchExcludeReplies)) baseTerms.push('-filter:replies')
    return baseTerms.join(' ')
  }
  const normalizeAdvanced = (raw) => {
    const source = raw && typeof raw === 'object' ? raw : {}
    const parsedSearch = deriveSearchControlsFromQuery(source.searchQuery)
    const searchIncludeTerms = normalizeSearchTermInput(source.searchIncludeTerms || source.searchKeyword || parsedSearch.searchIncludeTerms || parsedSearch.searchKeyword || '')
    const searchExcludeTerms = normalizeSearchTermInput(source.searchExcludeTerms || parsedSearch.searchExcludeTerms || '')
    const searchKeyword = searchIncludeTerms
    const searchUseGm = true
    const searchUseGn = true
    const searchMinReplies = clampNum(source.searchMinReplies, 0, 9999, parsedSearch.searchMinReplies)
    const searchExcludeReplies = b(source.searchExcludeReplies, parsedSearch.searchExcludeReplies)
    return {
      autoLike: b(source.autoLike, DEFAULT_ADVANCED.autoLike),
      autoRetweet: b(source.autoRetweet, DEFAULT_ADVANCED.autoRetweet),
      autoFollow: b(source.autoFollow, DEFAULT_ADVANCED.autoFollow),
      scrollStep: clampNum(source.scrollStep, 300, 2000, DEFAULT_ADVANCED.scrollStep),
      scrollDelayMs: clampNum(source.scrollDelayMs, 400, 10000, DEFAULT_ADVANCED.scrollDelayMs),
      replyDelayMinMs: clampNum(source.replyDelayMinMs, 500, 30000, DEFAULT_ADVANCED.replyDelayMinMs),
      replyDelayMaxMs: clampNum(source.replyDelayMaxMs, 500, 60000, DEFAULT_ADVANCED.replyDelayMaxMs),
      actionDelayMs: clampNum(source.actionDelayMs, 100, 5000, DEFAULT_ADVANCED.actionDelayMs),
      maxIdleLoops: clampNum(source.maxIdleLoops, 1, 50, DEFAULT_ADVANCED.maxIdleLoops),
      minTweetChars: clampNum(source.minTweetChars, 0, 1000, DEFAULT_ADVANCED.minTweetChars),
      skipIfContainsLinks: b(source.skipIfContainsLinks, DEFAULT_ADVANCED.skipIfContainsLinks),
      skipIfContainsImages: b(source.skipIfContainsImages, DEFAULT_ADVANCED.skipIfContainsImages),
      searchIncludeTerms,
      searchExcludeTerms,
      searchKeyword,
      searchUseGm,
      searchUseGn,
      searchMinReplies,
      searchExcludeReplies,
      searchQuery: buildSearchQueryFromControls({
        searchIncludeTerms,
        searchExcludeTerms,
        searchKeyword,
        searchUseGm,
        searchUseGn,
        searchMinReplies,
        searchExcludeReplies
      }),
      debugPrompt: String(source.debugPrompt || ''),
      debugOutput: String(source.debugOutput || '')
    }
  }
  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const debounceTimers = Object.create(null)
  const debounceRun = (key, job, delayMs = 320) => {
    const safeKey = String(key || 'default')
    if (debounceTimers[safeKey]) clearTimeout(debounceTimers[safeKey])
    debounceTimers[safeKey] = setTimeout(() => {
      Promise.resolve()
        .then(() => job())
        .catch(() => {})
    }, Math.max(120, Number(delayMs) || 320))
  }
  const cap = (value, max = 1200) => {
    const text = String(value || '').trim()
    if (!text) return ''
    return text.length > max ? `${text.slice(0, max)}...` : text
  }
  const isContextInvalidatedError = (value) => /Extension context invalidated|Receiving end does not exist/i.test(String(value || ''))
  const X_NON_PREMIUM_MAX_LENGTH = 280
  const X_URL_WEIGHT = 23
  const URL_RE = /(?:https?:\/\/|www\.)\S+/gi
  let notifiedInvalidContext = false

  const send = (a, p = {}) => new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ xacAction: a, ...p }, (res) => {
        if (chrome.runtime.lastError) {
          const err = chrome.runtime.lastError.message
          if (isContextInvalidatedError(err)) {
            if (!notifiedInvalidContext) {
              notifiedInvalidContext = true
              toast('扩展刚更新，请刷新当前页面后重试。', 'warn')
            }
            return resolve({ ok: false, error: 'Extension context invalidated. Please refresh current page.', code: 'CONTEXT_INVALIDATED' })
          }
          return resolve({ ok: false, error: err })
        }
        resolve(res || { ok: false, error: 'No response' })
      })
    } catch (e) {
      if (isContextInvalidatedError(e)) {
        if (!notifiedInvalidContext) {
          notifiedInvalidContext = true
          toast('扩展刚更新，请刷新当前页面后重试。', 'warn')
        }
        resolve({ ok: false, error: 'Extension context invalidated. Please refresh current page.', code: 'CONTEXT_INVALIDATED' })
        return
      }
      resolve({ ok: false, error: String(e) })
    }
  })
  const g = (keys) => new Promise((resolve, reject) => chrome.storage.local.get(keys, (x) => chrome.runtime.lastError ? reject(new Error(chrome.runtime.lastError.message)) : resolve(x || {})))
  const set = (obj) => new Promise((resolve, reject) => chrome.storage.local.set(obj, () => chrome.runtime.lastError ? reject(new Error(chrome.runtime.lastError.message)) : resolve()))

  function toast(msg, kind = 'info') {
    let e = document.getElementById('xac-toast')
    if (!e) { e = document.createElement('div'); e.id = 'xac-toast'; document.documentElement.appendChild(e) }
    e.className = `xac-toast ${kind}`; e.textContent = String(msg || ''); e.style.opacity = '1'; e.style.transform = 'translate(-50%,0)'
    clearTimeout(toast._t); toast._t = setTimeout(() => { e.style.opacity = '0'; e.style.transform = 'translate(-50%,8px)' }, 2200)
  }

  function formatUserError(errorMessage) {
    const text = s(errorMessage, t('unknownError'))
    if (/Spark settings missing required fields|Spark settings incomplete/i.test(text)) {
      const match = text.match(/(?:missing required fields:\s*|Missing:\s*)([a-z_,\s]+)/i)
      const fields = match?.[1] ? match[1].split(',').map((x) => x.trim()).filter(Boolean) : []
      const missing = fields.length ? fields.join(', ') : 'url, app_id, api_key, api_secret'
      if (S.lang === 'zh') {
        return `AI 配置缺失: ${missing}。请打开扩展弹窗 -> AI Settings 保存后重试。`
      }
      return `AI settings missing: ${missing}. Open extension popup -> AI Settings, save, then retry.`
    }
    return text
  }

  function isCjkLike(codePoint) {
    if (!Number.isFinite(codePoint)) return false
    return (
      (codePoint >= 0x1100 && codePoint <= 0x11ff) ||
      (codePoint >= 0x2e80 && codePoint <= 0x2eff) ||
      (codePoint >= 0x2f00 && codePoint <= 0x2fdf) ||
      (codePoint >= 0x3040 && codePoint <= 0x30ff) ||
      (codePoint >= 0x3100 && codePoint <= 0x312f) ||
      (codePoint >= 0x3130 && codePoint <= 0x318f) ||
      (codePoint >= 0x31a0 && codePoint <= 0x31bf) ||
      (codePoint >= 0x31c0 && codePoint <= 0x31ef) ||
      (codePoint >= 0x31f0 && codePoint <= 0x31ff) ||
      (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
      (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7af) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0x1f300 && codePoint <= 0x1faff) ||
      (codePoint >= 0x20000 && codePoint <= 0x2fffd) ||
      (codePoint >= 0x30000 && codePoint <= 0x3fffd)
    )
  }

  function xCharWeight(ch) {
    const cp = ch.codePointAt(0)
    if (!Number.isFinite(cp)) return 0
    if (cp <= 0x10ff) return 1
    return isCjkLike(cp) ? 2 : 2
  }

  function appendTextByWeight(sourceText, maxRemain) {
    let out = ''
    let used = 0
    for (const ch of String(sourceText || '')) {
      const w = xCharWeight(ch)
      if (used + w > maxRemain) break
      out += ch
      used += w
    }
    return { text: out, weight: used }
  }

  function calcXLength(text) {
    const source = String(text || '').replace(/\r\n/g, '\n')
    let total = 0
    let cursor = 0
    URL_RE.lastIndex = 0
    let match = URL_RE.exec(source)
    while (match) {
      const index = Number(match.index || 0)
      const before = source.slice(cursor, index)
      for (const ch of before) total += xCharWeight(ch)
      total += X_URL_WEIGHT
      cursor = index + String(match[0] || '').length
      match = URL_RE.exec(source)
    }
    const tail = source.slice(cursor)
    for (const ch of tail) total += xCharWeight(ch)
    return total
  }

  function trimToXLimit(text, limit = X_NON_PREMIUM_MAX_LENGTH) {
    const source = String(text || '').replace(/\r\n/g, '\n').trim()
    if (!source) return { text: '', length: 0, truncated: false }

    const current = calcXLength(source)
    if (current <= limit) {
      return { text: source, length: current, truncated: false }
    }

    let out = ''
    let used = 0
    let cursor = 0
    URL_RE.lastIndex = 0
    let match = URL_RE.exec(source)

    while (match) {
      const index = Number(match.index || 0)
      const before = source.slice(cursor, index)
      const part = appendTextByWeight(before, limit - used)
      out += part.text
      used += part.weight
      if (used >= limit) break

      if (used + X_URL_WEIGHT > limit) break
      out += String(match[0] || '')
      used += X_URL_WEIGHT
      cursor = index + String(match[0] || '').length
      match = URL_RE.exec(source)
    }

    if (used < limit && cursor < source.length) {
      const tail = source.slice(cursor)
      const part = appendTextByWeight(tail, limit - used)
      out += part.text
      used += part.weight
    }

    const cleaned = out
      .trim()
      .replace(/[，,;；:：\-—\s]+$/g, '')
      .trim()

    return {
      text: cleaned || source.slice(0, 120).trim(),
      length: calcXLength(cleaned || source.slice(0, 120).trim()),
      truncated: true
    }
  }

  function setStatus(x) { S.status = x; const e = document.getElementById('xac-status'); if (e) e.textContent = x || '' }

  async function runPendingAction(action, statusText, task, restoreIdle = true) {
    if (S.pendingAction) return null
    S.pendingAction = action
    if (statusText) setStatus(statusText)
    render()
    try {
      return await task()
    } finally {
      S.pendingAction = ''
      if (restoreIdle && !S.auto.active) setStatus(t('idle'))
      render()
    }
  }

  function mergeProfiles(raw) {
    const out = new Map(DEFAULT_PROFILES.map((p) => [p.id, { ...p }]))
    ;(Array.isArray(raw) ? raw : []).forEach((p) => { if (p && p.id && !out.has(p.id)) out.set(p.id, p) })
    return Array.from(out.values())
  }

  function emptyProfileDraft() {
    return {
      name: '',
      emoji: '⚡',
      tone: '',
      goal: 'engagement',
      length: 'short',
      language: S.lang,
      instructions: '',
      persona: '',
      includeCta: false
    }
  }

  function profileToDraft(profile) {
    if (!profile) return emptyProfileDraft()
    return {
      name: s(profile.name, ''),
      emoji: s(profile.emoji, '⚡'),
      tone: s(profile.tone, ''),
      goal: s(profile.goal, 'engagement'),
      length: s(profile.length, 'short'),
      language: s(profile.language, S.lang),
      instructions: s(profile.instructions, ''),
      persona: s(profile.persona, ''),
      includeCta: Boolean(S.profileMeta?.[profile.id]?.includeCta)
    }
  }

  function updateProfileMeta(profileId, includeCta) {
    if (!profileId) return
    S.profileMeta = { ...(S.profileMeta || {}), [profileId]: { includeCta: Boolean(includeCta) } }
  }

  function localizePresetProfile(profile, lang = S.lang) {
    if (!profile || !profile.preset) return profile
    const patch = PRESET_PROFILE_I18N?.[lang]?.[profile.id]
    if (!patch) return profile
    return { ...profile, ...patch, language: lang }
  }

  function activeProfileRaw() {
    const ps = S.profile.profiles || []
    return ps.find((p) => p.id === S.profile.activeProfileId) || ps[0] || DEFAULT_PROFILES[0]
  }

  function activeProfile() {
    return localizePresetProfile(activeProfileRaw(), S.lang)
  }

  async function syncPresetQuickSettingsByLanguage() {
    const raw = activeProfileRaw()
    if (!raw?.preset) return
    const localized = localizePresetProfile(raw, S.lang)
    S.profile.quickSettings.goal = localized.goal
    S.profile.quickSettings.length = localized.length
    S.profile.quickSettings.customInstructions = localized.instructions
    S.profile.quickSettings.persona = localized.persona
    await saveProfileState()
  }

  function promptSettings() {
    const p = activeProfile(), q = S.profile.quickSettings || DEFAULT_QUICK
    return {
      tone: p.tone,
      goal: q.goal || p.goal,
      length: q.length || p.length,
      engagementMode: q.engagementMode || 'safe',
      instructions: (q.customInstructions || '').trim() || p.instructions || '',
      persona: (q.persona || '').trim() || p.persona || '',
      language: S.lang,
      includeCta: Boolean(S.profileMeta?.[p.id]?.includeCta)
    }
  }

  async function loadState() {
    const rs = await send('xac:get-state')
    if (rs.ok && rs.state) {
      S.lang = normLang(rs.state.language || navigator.language)
      S.signedIn = Boolean(rs.state.googleSession && rs.state.googleSession.accessToken)
      const rps = rs.state.profileState || {}
      const ps = mergeProfiles(rps.profiles)
      const aid = ps.some((p) => p.id === rps.activeProfileId) ? rps.activeProfileId : ps[0].id
      const ap = localizePresetProfile(ps.find((p) => p.id === aid) || ps[0], S.lang)
      S.profile = {
        profiles: ps,
        activeProfileId: aid,
        quickSettings: {
          engagementMode: s(rps.quickSettings?.engagementMode, 'safe'),
          goal: s(rps.quickSettings?.goal, ap.goal),
          length: s(rps.quickSettings?.length, ap.length),
          customInstructions: s(rps.quickSettings?.customInstructions, ap.instructions),
          persona: s(rps.quickSettings?.persona, ap.persona)
        }
      }
    } else {
      S.lang = normLang(navigator.language)
    }
    const local = await g([K.autoPost, K.profileMeta, K.advanced]).catch(() => ({}))
    S.autoPost = b(local[K.autoPost], false)
    S.profileMeta = local[K.profileMeta] && typeof local[K.profileMeta] === 'object' ? local[K.profileMeta] : {}
    S.advanced = normalizeAdvanced(local[K.advanced])
  }

  async function saveProfileState() {
    await send('xac:set-profile-state', { profileState: S.profile })
  }

  async function saveAdvanced(silent = true) {
    S.advanced = normalizeAdvanced(S.advanced)
    await set({ [K.advanced]: S.advanced }).catch(() => {})
    if (!silent) toast(t('savedAdvanced'), 'ok')
  }

  function styles() {
    if (document.getElementById('xac-style')) return
    const st = document.createElement('style')
    st.id = 'xac-style'
    st.textContent = `
#xac-root{position:fixed;right:14px;bottom:16px;z-index:2147483645;width:min(94vw,360px);font-family:Segoe UI,Microsoft YaHei,sans-serif}
#xac-root .shell{border:1px solid #2f6e48;border-radius:14px;background:linear-gradient(180deg,#132c21,#08140f);box-shadow:0 12px 32px rgba(0,0,0,.42);overflow:hidden}
#xac-root .top{width:100%;border:0;cursor:pointer;background:transparent;color:#d9ffe9;padding:10px 12px;display:flex;justify-content:space-between;align-items:center}
#xac-root .top .t1{font-size:15px;font-weight:800;line-height:1.1}
#xac-root .top .t2{font-size:11px;color:#89bca1;line-height:1.2}
#xac-root .quota{border:1px solid #2f6e48;border-radius:999px;padding:2px 8px;font-size:11px;color:#8df4be;background:#0d2219;white-space:nowrap}
#xac-root .body{border-top:1px solid #1f4933;display:grid;gap:8px;padding:10px 12px;max-height:76vh;overflow:auto}
#xac-root.collapsed .body{display:none}
#xac-root .sec{font-size:11px;color:#76b396;padding-left:2px}
#xac-root .sec.flash{color:#bafdd6;text-shadow:0 0 8px rgba(96,246,161,.5)}
#xac-root .group{border:1px solid #24543a;background:linear-gradient(180deg,#10231b,#0b1913);border-radius:10px;padding:9px;display:grid;gap:8px}
#xac-root .group-h{font-size:12px;color:#c7f8df;font-weight:800;letter-spacing:.2px}
#xac-root .step{display:grid;gap:3px;padding-bottom:7px;margin-bottom:1px;border-bottom:1px solid #1f4b35}
#xac-root .step-title{font-size:15px;color:#dcffed;font-weight:900;line-height:1.15;letter-spacing:.25px}
#xac-root .step-desc{font-size:11px;color:#8ec4a7;line-height:1.35}
#xac-root .guide-banner{border:1px solid #2d6649;border-left:3px solid #56df93;background:linear-gradient(180deg,#123126,#0d2119);border-radius:10px;padding:8px 9px;display:grid;gap:4px}
#xac-root .guide-banner .meta{font-size:11px;color:#b8ebd0;line-height:1.4}
#xac-root .mini-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
#xac-root .mini-btn{padding:6px 4px;font-size:11px;line-height:1.1;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#xac-root .hlabel{display:flex;align-items:center;justify-content:space-between;gap:8px}
#xac-root .hlabel label,#xac-root .hlabel .mini{font-size:11px;color:#93c9ad}
#xac-root .subh{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:6px;margin-top:2px;border-top:1px dashed #25533b;font-size:11px;color:#84bea0}
#xac-root .subh.first{border-top:0;padding-top:0}
#xac-root .card{border:1px solid #24543a;background:#0d1b15;border-radius:10px;padding:8px 9px;display:grid;gap:3px}
#xac-root .meta{font-size:11px;color:#9cd8b8}
#xac-root .r2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#xac-root .r3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
#xac-root .or-row{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:center}
#xac-root .or-tag{display:inline-flex;align-items:center;justify-content:center;border:1px solid #2f6e48;border-radius:999px;padding:4px 10px;min-height:28px;font-size:11px;color:#9dddb8;background:#10241b;white-space:nowrap}
#xac-root .profile-row{grid-template-columns:minmax(0,1.7fr) minmax(88px,1fr) minmax(88px,1fr)}
#xac-root label{font-size:11px;color:#8ebca4}
#xac-root select,#xac-root input,#xac-root textarea,#xac-root button{border-radius:8px}
#xac-root select,#xac-root input,#xac-root textarea{width:100%;box-sizing:border-box;border:1px solid #265a3c;background:#0a1a14;color:#d9ffe9;padding:7px 9px;font-size:12px;outline:none}
#xac-root textarea{min-height:52px;resize:vertical}
#xac-root #xac-debug-output{min-height:72px}
#xac-root button{border:1px solid #2b6543;background:#10251d;color:#d9ffe9;font-size:12px;padding:8px 10px;cursor:pointer}
#xac-root .profile-act{font-size:13px;font-weight:700;color:#e8fff2}
#xac-root button:disabled{opacity:.58;cursor:not-allowed;filter:saturate(.65)}
#xac-root button.p{border-color:#2fb065;background:linear-gradient(120deg,#2ea860,#49d581);color:#04140d;font-weight:700}
#xac-root button.hint{width:19px;min-width:19px;height:19px;padding:0;border-radius:999px;border:1px solid #3b7658;background:#10291f;color:#9fe4be;font-size:11px;font-weight:800;line-height:1;text-align:center}
#xac-root button.hint:hover{border-color:#57bf85;color:#d7ffe9}
#xac-root .chip-group{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
#xac-root .chip-group.mode{grid-template-columns:repeat(3,minmax(0,1fr))}
#xac-root .chip{border:1px solid #365f4a;background:#101c16;color:#c9f4de;font-size:12px;padding:8px 6px;text-align:center}
#xac-root .chip.active{border-color:#36cf79;background:#153527;color:#8ef1bd;font-weight:700}
#xac-root .status{font-size:11px;color:#9ad6b5}
#xac-root .switch{display:flex;align-items:center;justify-content:space-between;border:1px solid #2f6e48;border-radius:9px;padding:8px 10px;background:#0f1d17;min-height:40px}
#xac-root .switch span{color:#d8ffe8 !important;font-weight:650;font-size:13px;letter-spacing:.1px}
#xac-root .switch input{width:34px;height:18px;appearance:none;background:#274536;border-radius:999px;position:relative;outline:none;border:1px solid #355a47;cursor:pointer;padding:0}
#xac-root .switch input::after{content:'';position:absolute;left:2px;top:1px;width:13px;height:13px;border-radius:50%;background:#c9f4de;transition:all .15s ease}
#xac-root .switch input:checked{background:#2fb065}
#xac-root .switch input:checked::after{left:17px;background:#04140d}
#xac-root .modal{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.52);display:flex;align-items:center;justify-content:center;padding:14px}
#xac-root .modal-card{width:min(96vw,350px);max-height:86vh;overflow:auto;border:1px solid #2f6e48;border-radius:12px;background:linear-gradient(180deg,#132b21,#0a1712);padding:12px;display:grid;gap:8px}
#xac-root .modal-h{display:flex;justify-content:space-between;align-items:center;color:#d8ffe8;font-size:15px;font-weight:800}
#xac-root .modal-h button{width:auto;padding:5px 9px}
#xac-root .label-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.xac-inline-host{margin-top:8px;width:100%}
.xac-inline-btn{display:block;width:100%;border:1px solid #7ea729;background:linear-gradient(120deg,#b8e62f,#b0e238);color:#10210e;border-radius:8px;font-size:12px;font-weight:800;padding:8px 12px;cursor:pointer;transition:all .15s ease;text-align:left}
.xac-inline-btn.w{border-color:#3ea7ff;background:#13273a;color:#a8ddff}
.xac-inline-btn.o{border-color:#56d689;background:#193329;color:#9ff3c2}
.xac-inline-btn.f{border-color:#b85b5b;background:#311f1f;color:#ffb0b0}
.xac-toast{position:fixed;left:50%;bottom:16px;transform:translate(-50%,8px);background:#0f2018;border:1px solid #2f6e48;color:#d9ffe9;font-size:12px;border-radius:8px;padding:8px 12px;z-index:2147483647;opacity:0;transition:all .2s ease;pointer-events:none;max-width:min(92vw,520px);line-height:1.4;white-space:normal}
.xac-toast.warn{border-color:#b88e53;color:#ffd6a8}.xac-toast.ok{border-color:#4bbf78;color:#b9ffd6}
#xac-ind{position:fixed;left:14px;top:14px;z-index:2147483646;background:#0e1f18;border:1px solid #2f6e48;color:#d9ffe9;border-radius:10px;padding:7px 10px;display:none;align-items:center;gap:8px;font-size:12px;box-shadow:0 10px 28px rgba(0,0,0,.38)}
#xac-ind.show{display:inline-flex}#xac-ind .d{width:8px;height:8px;border-radius:50%;background:#4bd98b;box-shadow:0 0 8px rgba(75,217,139,.9)}
#xac-ind .s{border:1px solid #a86060;background:#352020;color:#ffbcbc;border-radius:6px;font-size:10px;padding:3px 7px;cursor:pointer}
#xac-root .pro{border-color:#7a7a2a;background:#232314;color:#f0f0a7}
@media (max-width:520px){#xac-root{right:8px;bottom:10px;width:calc(100vw - 16px)}}`
    document.documentElement.appendChild(st)
  }
  function context(article) {
    const txt = []
    article.querySelectorAll('[data-testid="tweetText"]').forEach((n) => { if (n.closest('article[data-testid="tweet"]') === article) { const t = (n.innerText || '').trim(); if (t) txt.push(t) } })
    const quote = []
    article.querySelectorAll('article[data-testid="tweet"]').forEach((a) => { if (a !== article) { const t = []; a.querySelectorAll('[data-testid="tweetText"]').forEach((n) => { if (n.closest('article[data-testid="tweet"]') === a) { const x = (n.innerText || '').trim(); if (x) t.push(x) } }); if (t.length) quote.push(t.join('\n')) } })
    const cell = article.closest('[data-testid="cellInnerDiv"]')
    const parent = []
    if (cell) {
      let p = cell.previousElementSibling, k = 0
      while (p && k < 5 && parent.length < 2) {
        const a = p.querySelector('article[data-testid="tweet"]')
        if (a) {
          const t = []
          a.querySelectorAll('[data-testid="tweetText"]').forEach((n) => { if (n.closest('article[data-testid="tweet"]') === a) { const x = (n.innerText || '').trim(); if (x) t.push(x) } })
          if (t.length) parent.unshift(t.join('\n'))
        }
        p = p.previousElementSibling; k += 1
      }
    }
    const images = []
    article.querySelectorAll('img[src*="pbs.twimg.com/media/"]').forEach((img) => { const src = s(img.getAttribute('src'), ''); if (src) images.push(src) })
    return {
      tweetText: cap(txt.join('\n').trim(), 1600),
      quoteText: cap(Array.from(new Set(quote)).join('\n---\n').trim(), 1200),
      threadText: cap(parent.join('\n---\n').trim(), 1200),
      images: Array.from(new Set(images)).slice(0, 4),
      url: window.location.href
    }
  }

  function detectMyHandle() {
    const p = document.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.getAttribute('href')
    const q = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"] a[href^="/"]')?.getAttribute('href')
    const x = (p || q || '').replace(/^\//, '').split('?')[0].trim().toLowerCase()
    if (x) S.myHandle = x
    return S.myHandle
  }

  function isOwn(article) {
    const me = detectMyHandle(); if (!me) return false
    const h = article?.querySelector('[data-testid="User-Name"] a[href^="/"]')?.getAttribute('href')
    const u = s(h || '', '').replace(/^\//, '').split('/')[0].toLowerCase()
    return Boolean(u && u === me)
  }

  async function openEditor(article) {
    const dialogEditor = Array.from(document.querySelectorAll('div[role="dialog"] div[contenteditable="true"][role="textbox"], div[role="dialog"] div[contenteditable="true"][data-testid^="tweetTextarea"]'))
      .find((e) => e instanceof HTMLElement && e.offsetParent !== null)
    if (dialogEditor) return dialogEditor

    const rb = article?.querySelector('button[data-testid="reply"], div[data-testid="reply"]')
    if (!rb) return null
    rb.click()
    const start = Date.now()
    while (Date.now() - start < 7000) {
      const c = Array.from(document.querySelectorAll('div[role="textbox"][data-testid^="tweetTextarea"], div[contenteditable="true"][role="textbox"], div[contenteditable="true"][data-testid^="tweetTextarea"]'))
      const t = c.find((e) => e instanceof HTMLElement && e.offsetParent !== null)
      if (t) return t
      await sleep(100)
    }
    return null
  }

  function putText(editor, text) {
    if (!editor || !text) return false
    editor.focus()
    try {
      const sel = window.getSelection(), rg = document.createRange(); rg.selectNodeContents(editor); sel?.removeAllRanges(); sel?.addRange(rg)
      document.execCommand('insertText', false, text)
    } catch {}
    if (!((editor.innerText || '').trim())) {
      try {
        editor.innerHTML = ''
        editor.appendChild(document.createTextNode(text))
        editor.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }))
      } catch {}
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }))
      editor.dispatchEvent(new Event('change', { bubbles: true }))
    }
    return Boolean((editor.innerText || '').trim())
  }

  function sendButton() {
    const bs = Array.from(document.querySelectorAll('button[data-testid="tweetButtonInline"], button[data-testid="tweetButton"]'))
    return bs.find((b) => b instanceof HTMLButtonElement && !b.disabled && b.offsetParent !== null) || null
  }

  function normalizeSearchQuery(rawQuery) {
    const text = s(rawQuery, '').trim()
    if (!text) return DEFAULT_X_SEARCH_QUERY
    const hasXSyntax = /(?:min_[a-z_]+:|filter:|since:|until:|lang:|from:|to:|\(|\)|\bOR\b|\bAND\b)/i.test(text)
    if (hasXSyntax) return text
    return `(${text}) min_replies:1 -filter:replies`
  }

  function syncSearchQueryFromControls(updatePreview = true) {
    const query = buildSearchQueryFromControls(S.advanced)
    S.advanced.searchQuery = query
    if (updatePreview) {
      const preview = document.getElementById('xac-search-preview')
      if (preview) preview.value = query
    }
    return query
  }

  function buildSearchUrl(rawQuery) {
    const q = normalizeSearchQuery(rawQuery)
    return `https://x.com/search?q=${encodeURIComponent(q)}&src=typed_query&f=live`
  }

  function clickLike(article) {
    const btn = article?.querySelector('button[data-testid="like"], div[data-testid="like"]')
    if (!btn) return false
    btn.click()
    return true
  }

  async function clickRetweet(article) {
    const btn = article?.querySelector('button[data-testid="retweet"], div[data-testid="retweet"]')
    if (!btn) return false
    btn.click()
    await sleep(220)
    const confirm = document.querySelector('div[role="menuitem"][data-testid="retweetConfirm"]')
    if (confirm) {
      confirm.click()
      return true
    }
    return false
  }

  function clickFollow(article) {
    const direct = article?.querySelector('button[data-testid$="-follow"]')
    if (direct) {
      direct.click()
      return true
    }
    const fallback = Array.from(article?.querySelectorAll('button') || []).find((btn) => {
      const text = String(btn?.innerText || '').trim().toLowerCase()
      return text === 'follow'
    })
    if (!fallback) return false
    fallback.click()
    return true
  }

  async function runPostActions(article) {
    const cfg = normalizeAdvanced(S.advanced)
    if (cfg.autoLike) {
      clickLike(article)
      await sleep(cfg.actionDelayMs)
    }
    if (cfg.autoRetweet) {
      await clickRetweet(article)
      await sleep(cfg.actionDelayMs)
    }
    if (cfg.autoFollow) {
      clickFollow(article)
    }
  }

  async function runDebugGeneration() {
    const prompt = String(S.advanced?.debugPrompt || '').trim()
    if (!prompt) {
      toast(S.lang === 'zh' ? '请先输入调试提示词' : 'Please input debug prompt first', 'warn')
      return
    }
    const result = await send('xac:spark-complete', {
      prompt,
      timeoutMs: 70000,
      systemPrompt: S.lang === 'zh'
        ? '你是评论调试助手。仅返回可直接发布的一条回复内容，不要解释。'
        : 'You are a comment debugging assistant. Return only one post-ready reply and no explanation.'
    })
    if (!result.ok) {
      toast(`${t('fail')}: ${formatUserError(s(result.error, t('unknownError')))}`, 'warn')
      return
    }
    S.advanced.debugOutput = String(result.text || '').trim()
    await saveAdvanced()
    render()
  }

  function randomBetween(minValue, maxValue) {
    const low = Math.max(0, Math.round(n(minValue, 0)))
    const high = Math.max(low, Math.round(n(maxValue, low)))
    if (high <= low) return low
    return low + Math.floor(Math.random() * (high - low + 1))
  }

  function passesAdvancedFilter(article) {
    const cfg = normalizeAdvanced(S.advanced)
    if (!cfg.minTweetChars && !cfg.skipIfContainsLinks && !cfg.skipIfContainsImages) return true
    const ctx = context(article)
    const tweetText = String(ctx?.tweetText || '')
    if (cfg.minTweetChars > 0 && tweetText.length < cfg.minTweetChars) return false
    const combined = `${ctx?.tweetText || ''}\n${ctx?.quoteText || ''}\n${ctx?.threadText || ''}`
    if (cfg.skipIfContainsLinks && /(?:https?:\/\/|www\.)\S+/i.test(combined)) return false
    if (cfg.skipIfContainsImages && Array.isArray(ctx?.images) && ctx.images.length > 0) return false
    return true
  }

  function messages(ctx) {
    const p = promptSettings()
    const ctaRuleZh = p.includeCta ? '结尾添加简短行动号召（例如提问或邀请互动）。' : ''
    const ctaRuleEn = p.includeCta ? 'End with a short CTA (question or invite to respond).' : ''
    const sys = p.language === 'zh'
      ? ['你是X平台评论助手。', `语气: ${p.tone}`, `目标: ${p.goal}`, `长度: ${p.length}`, `互动强度: ${p.engagementMode}`, p.persona ? `人设: ${p.persona}` : '', p.instructions ? `额外约束: ${p.instructions}` : '', ctaRuleZh, '必须适配 X 普通账号限制：按字符权重总长度不超过 280，优先控制在 240 以内。', '只输出一条可直接发布的中文回复，不要解释。'].filter(Boolean).join('\n')
      : ['You are an assistant for generating X/Twitter replies.', `Tone: ${p.tone}`, `Goal: ${p.goal}`, `Length: ${p.length}`, `Engagement mode: ${p.engagementMode}`, p.persona ? `Persona: ${p.persona}` : '', p.instructions ? `Extra rules: ${p.instructions}` : '', ctaRuleEn, 'Must fit X non-premium limits: weighted length <= 280, preferably <= 240.', 'Return one post-ready reply only. No explanation.'].filter(Boolean).join('\n')
    const usr = p.language === 'zh'
      ? ['下面是上下文，请基于它写一条回复:', `主推文:\n${ctx.tweetText || '(无)'}`, `引用推文:\n${ctx.quoteText || '(无)'}`, `线程上文:\n${ctx.threadText || '(无)'}`, `图片链接:\n${ctx.images.length ? ctx.images.join('\n') : '(无)'}`].join('\n\n')
      : ['Context for one reply:', `Main tweet:\n${ctx.tweetText || '(none)'}`, `Quoted tweet:\n${ctx.quoteText || '(none)'}`, `Thread parent:\n${ctx.threadText || '(none)'}`, `Image URLs:\n${ctx.images.length ? ctx.images.join('\n') : '(none)'}`].join('\n\n')
    return [{ role: 'system', content: sys }, { role: 'user', content: usr }]
  }

  function btnState(btn, mode, txt) {
    if (!btn) return
    btn.classList.remove('w', 'o', 'f'); if (mode) btn.classList.add(mode)
    btn.textContent = txt
  }

  async function signedIn() {
    const r = await send('xac:get-google-session')
    S.signedIn = !!(r.ok && r.googleSession && r.googleSession.accessToken)
    return S.signedIn
  }

  async function signInFromPanel() {
    const r = await send('xac:google-sign-in')
    const ok = !!(r.ok && r.googleSession && r.googleSession.accessToken)
    S.signedIn = ok
    if (ok) {
      toast(t('signInDone'), 'ok')
    } else {
      toast(`${t('signInFail')}: ${s(r.error, t('unknownError'))}`, 'warn')
    }
    return ok
  }

  async function generate(article, btn, fromAuto = false) {
    if (!article || !btn || btn.dataset.busy === '1') return false
    btn.dataset.busy = '1'; btnState(btn, 'w', t('gen'))
    try {
      if (!(await signedIn())) { toast(t('login'), 'warn') }
      const ctx = context(article)
      if (!(ctx.tweetText || ctx.quoteText || ctx.threadText || ctx.images.length)) { btnState(btn, 'f', t('noc')); toast(t('noc'), 'warn'); return false }
      const ed = await openEditor(article)
      if (!ed) { btnState(btn, 'f', t('fail')); toast(t('editorMissing'), 'warn'); return false }
      const r = await send('xac:spark-complete', { messages: messages(ctx), timeoutMs: 70000 })
      if (!r.ok || !s(r.text, '')) {
        const reason = formatUserError(s(r.error, t('emptyModelOutput')))
        btnState(btn, 'f', t('fail')); toast(`${t('fail')}: ${reason}`, 'warn')
        return false
      }
      const limited = trimToXLimit(s(r.text, ''), X_NON_PREMIUM_MAX_LENGTH)
      if (!limited.text) {
        btnState(btn, 'f', t('fail')); toast(`${t('fail')}: ${t('emptyModelOutput')}`, 'warn')
        return false
      }
      if (!putText(ed, limited.text)) {
        btnState(btn, 'f', t('fail')); toast(t('insertFailed'), 'warn')
        return false
      }
      if (limited.truncated) {
        toast(`${t('trimmed')} (${limited.length}/${X_NON_PREMIUM_MAX_LENGTH})`, 'ok')
      }
      article.classList.add('xac-replied'); btnState(btn, 'o', t('ok'))
      setTimeout(() => {
        if (btn.dataset.busy === '1') return
        btnState(btn, '', t('reply'))
      }, fromAuto ? 900 : 1600)
      if (S.autoPost) { const sb = sendButton(); if (sb) { await sleep(450); sb.click() } }
      await runPostActions(article).catch(() => {})
      return true
    } catch (e) {
      console.error('[XAC] generate failed', e)
      btnState(btn, 'f', t('fail'))
      toast(`${t('fail')}: ${formatUserError(s(e?.message, t('unknownError')))}`, 'warn')
      return false
    }
    finally {
      delete btn.dataset.busy
      if (!fromAuto) setTimeout(() => { if (btn.dataset.busy !== '1') btnState(btn, '', t('reply')) }, 2000)
    }
  }

  function makeBtn(article) {
    const g = article?.querySelector('div[role="group"]'); if (!g || isOwn(article)) return null
    const ex = g.parentElement?.querySelector('.xac-inline-btn'); if (ex) return ex
    const host = document.createElement('div'); host.className = 'xac-inline-host'
    const b = document.createElement('button'); b.type = 'button'; b.className = 'xac-inline-btn'; b.textContent = t('reply')
    b.addEventListener('click', async () => { await generate(article, b, false) })
    host.appendChild(b); g.parentElement?.appendChild(host); return b
  }

  function scanNow() {
    detectMyHandle()
    document.querySelectorAll('article[data-testid="tweet"]').forEach((a) => {
      if (!(a instanceof HTMLElement)) return
      if (a.dataset.xacBound === '1') return
      a.dataset.xacBound = '1'
      if (a.closest('div[role="dialog"]')) return
      makeBtn(a)
    })
  }

  function schedule() {
    if (S.scheduled) return
    S.scheduled = true
    setTimeout(() => { S.scheduled = false; scanNow() }, 160)
  }

  function nextCandidate() {
    const all = Array.from(document.querySelectorAll('article[data-testid="tweet"]'))
    for (const a of all) {
      if (!(a instanceof HTMLElement) || a.closest('div[role="dialog"]') || isOwn(a)) continue
      let b = a.parentElement?.querySelector('.xac-inline-btn'); if (!b) b = makeBtn(a)
      if (!b || b.dataset.autoDone === '1' || b.dataset.busy === '1') continue
      if (b.classList.contains('o')) { b.dataset.autoDone = '1'; continue }
      if (!passesAdvancedFilter(a)) { b.dataset.autoFiltered = '1'; continue }
      return { article: a, btn: b }
    }
    return null
  }
  function ind(show = true) {
    let e = document.getElementById('xac-ind')
    if (!e) {
      e = document.createElement('div'); e.id = 'xac-ind'
      e.innerHTML = '<span class="d"></span><span id="xac-ind-l"></span><button class="s" id="xac-ind-s">STOP</button>'
      document.documentElement.appendChild(e)
      e.querySelector('#xac-ind-s')?.addEventListener('click', () => stopAuto())
    }
    const l = e.querySelector('#xac-ind-l'); if (l) { const m = S.auto.max > 0 ? `/${S.auto.max}` : ''; l.textContent = `${t('run')} ${S.auto.count}${m}` }
    if (show) e.classList.add('show'); else e.classList.remove('show')
  }

  async function startAuto(max) {
    if (S.auto.active) return
    S.auto.active = true; S.auto.count = 0; S.auto.max = Math.max(0, Math.round(n(max, 0))); S.idle = 0
    setStatus(t('run')); ind(true)
    render()
    const cfg = normalizeAdvanced(S.advanced)

    while (S.auto.active) {
      if (S.auto.max > 0 && S.auto.count >= S.auto.max) break
      const c = nextCandidate()
      if (!c) {
        S.idle += 1; if (S.idle > cfg.maxIdleLoops) break
        window.scrollBy({ top: cfg.scrollStep, behavior: 'smooth' }); await sleep(cfg.scrollDelayMs); continue
      }
      S.idle = 0
      c.article.scrollIntoView({ behavior: 'smooth', block: 'center' }); await sleep(700)
      const ok = await generate(c.article, c.btn, true)
      c.btn.dataset.autoDone = '1'
      if (ok) { S.auto.count += 1; ind(true) }
      await sleep(randomBetween(cfg.replyDelayMinMs, cfg.replyDelayMaxMs))
    }

    S.auto.active = false; ind(false); setStatus(t('stopped')); toast(`${t('done')}: ${S.auto.count}`, 'ok'); render()
  }

  function stopAuto() { S.auto.active = false; ind(false); setStatus(t('stopped')); render() }

  function openPanelAndFocusAdvanced() {
    S.open = true
    render()
    setTimeout(() => {
      const anchor = document.getElementById('xac-advanced-anchor')
      if (!anchor) return
      anchor.classList.add('flash')
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => anchor.classList.remove('flash'), 1300)
    }, 120)
  }

  function openProfileEditor(mode = 'new') {
    if (mode === 'edit') {
      const current = activeProfile()
      if (!current) return
      S.editor = { open: true, mode: 'edit', targetId: current.id, draft: profileToDraft(current) }
    } else {
      S.editor = { open: true, mode: 'new', targetId: '', draft: emptyProfileDraft() }
    }
    render()
  }

  function closeProfileEditor() {
    S.editor = { ...S.editor, open: false }
    render()
  }

  async function saveProfileEditorDraft() {
    const draft = S.editor?.draft || emptyProfileDraft()
    const name = s(draft.name, '')
    if (!name) {
      toast(S.lang === 'zh' ? '请填写姓名' : 'Please input profile name', 'warn')
      return
    }

    const payload = {
      name,
      emoji: s(draft.emoji, '⚡'),
      tone: s(draft.tone, 'balanced and concise'),
      goal: s(draft.goal, 'engagement'),
      length: s(draft.length, 'short'),
      instructions: s(draft.instructions, ''),
      persona: s(draft.persona, ''),
      language: s(draft.language, S.lang),
      preset: false
    }

    if (S.editor.mode === 'edit' && S.editor.targetId) {
      S.profile.profiles = (S.profile.profiles || []).map((item) => {
        if (item.id !== S.editor.targetId) return item
        return { ...item, ...payload, id: item.id, preset: Boolean(item.preset && item.id.startsWith('preset_')) }
      })
      updateProfileMeta(S.editor.targetId, draft.includeCta)
    } else {
      const newId = `custom_${Date.now().toString(36)}`
      S.profile.profiles = [...(S.profile.profiles || []), { id: newId, ...payload }]
      S.profile.activeProfileId = newId
      updateProfileMeta(newId, draft.includeCta)
    }

    const current = activeProfile()
    if (current) {
      S.profile.quickSettings.goal = current.goal
      S.profile.quickSettings.length = current.length
      S.profile.quickSettings.customInstructions = current.instructions
      S.profile.quickSettings.persona = current.persona
    }

    await saveProfileState()
    await set({ [K.profileMeta]: S.profileMeta }).catch(() => {})
    S.editor = { ...S.editor, open: false }
    toast(t('statusSaved'), 'ok')
    render()
  }

  function snapshotPanelUiState() {
    const root = document.getElementById('xac-root')
    const body = root?.querySelector('.body')
    const active = document.activeElement
    const inPanel = !!(active instanceof HTMLElement && active.closest('#xac-root'))
    const state = {
      bodyScrollTop: body ? body.scrollTop : 0,
      activeId: '',
      selStart: null,
      selEnd: null
    }

    if (!inPanel || !(active instanceof HTMLElement) || !active.id) {
      return state
    }

    state.activeId = active.id
    if (typeof active.selectionStart === 'number' && typeof active.selectionEnd === 'number') {
      state.selStart = active.selectionStart
      state.selEnd = active.selectionEnd
    }
    return state
  }

  function restorePanelUiState(state) {
    if (!state || typeof state !== 'object') return
    const root = document.getElementById('xac-root')
    const body = root?.querySelector('.body')
    if (body && Number.isFinite(state.bodyScrollTop)) {
      body.scrollTop = Math.max(0, Number(state.bodyScrollTop) || 0)
    }
    if (!state.activeId) return

    const active = document.getElementById(state.activeId)
    if (!(active instanceof HTMLElement)) return
    try {
      active.focus({ preventScroll: true })
    } catch {
      try { active.focus() } catch {}
    }

    const canRestoreSelection =
      typeof state.selStart === 'number' &&
      typeof state.selEnd === 'number' &&
      typeof active.setSelectionRange === 'function'
    if (canRestoreSelection) {
      try { active.setSelectionRange(state.selStart, state.selEnd) } catch {}
    }
  }

  function render() {
    const root = document.getElementById('xac-root'); if (!root) return
    const uiState = snapshotPanelUiState()
    const p = activeProfile(), q = S.profile.quickSettings || DEFAULT_QUICK, ps = S.profile.profiles || []
    const isBusy = Boolean(S.pendingAction)
    const signInLabel = S.pendingAction === 'login' ? t('loggingIn') : (S.signedIn ? t('logout') : t('signIn'))
    const modeOptions = [
      { id: 'safe', label: t('modeSafe') },
      { id: 'spicy', label: t('modeSpicy') },
      { id: 'viral', label: t('modeViral') }
    ]
    const goalOptions = [
      { id: 'engagement', label: S.lang === 'zh' ? '⚡ 参与' : '⚡ Engage' },
      { id: 'authority', label: S.lang === 'zh' ? '🎯 权威' : '🎯 Authority' },
      { id: 'debate', label: S.lang === 'zh' ? '🔥 辩论' : '🔥 Debate' },
      { id: 'networking', label: S.lang === 'zh' ? '🤝 网络' : '🤝 Network' }
    ]
    const lengthOptions = [
      { id: 'short', label: S.lang === 'zh' ? '短' : 'Short' },
      { id: 'medium', label: S.lang === 'zh' ? '中等' : 'Medium' },
      { id: 'long', label: S.lang === 'zh' ? '长' : 'Long' }
    ]
    const quotaNum = Math.max(0, 8 - (S.auto.count % 9))
    const includeTerms = parseSearchTerms(S.advanced.searchIncludeTerms || S.advanced.searchKeyword)
    const includeTermA = includeTerms[0] || ''
    const includeTermB = includeTerms[1] || ''
    const runToggleLabel = S.auto.active ? t('stop') : t('start')
    const runToggleClass = S.auto.active ? '' : 'p'
    const d = S.editor?.draft || emptyProfileDraft()
    const hintBtn = (key) => `<button class="hint" type="button" data-help="${esc(key)}">?</button>`
    const hintLabel = (text, key) => `<div class="hlabel"><label>${esc(text)}</label>${key ? hintBtn(key) : ''}</div>`
    const stepHead = (titleKey, descKey, anchorId = '') => `<div class="step"><div class="step-title"${anchorId ? ` id="${esc(anchorId)}"` : ''}>${esc(t(titleKey))}</div><div class="step-desc">${esc(t(descKey))}</div></div>`
    root.className = S.open ? '' : 'collapsed'
    root.innerHTML = `<div class="shell">
      <button class="top" id="xac-t">
        <span><div class="t1">${esc(t('title'))}</div><div class="t2">${esc(t('sub'))}</div></span>
        <span class="quota">● ${S.lang === 'zh' ? `剩余${quotaNum}次` : `${quotaNum} left`}</span>
      </button>
      <div class="body">
        <div class="guide-banner">
          <div class="meta">• ${esc(t('guideLine1'))}</div>
          <div class="meta">• ${esc(t('guideLine2'))}</div>
          <div class="meta">• ${esc(t('guideLine3'))}</div>
        </div>

        <div class="group">
          ${stepHead('stepAccount', 'stepAccountDesc')}
          <div class="card">
            <div class="meta">${esc(t('planLine'))}</div>
            <div class="meta">${esc(t('remainLine'))}</div>
          </div>
          <div class="mini-row">
            <button class="mini-btn" id="xac-login" ${isBusy ? 'disabled' : ''}>${esc(signInLabel)}</button>
            <button class="mini-btn pro" id="xac-upgrade">${esc(t('upgradePro'))}</button>
            <button class="mini-btn chip ${S.lang === 'en' ? 'active' : ''}" id="xac-l-en" ${isBusy ? 'disabled' : ''}>EN</button>
            <button class="mini-btn chip ${S.lang === 'zh' ? 'active' : ''}" id="xac-l-zh" ${isBusy ? 'disabled' : ''}>中文</button>
          </div>
        </div>

        <div class="group">
          ${stepHead('stepProfile', 'stepProfileDesc')}
          <div class="r3 profile-row">
            <select id="xac-p" ${isBusy ? 'disabled' : ''}>${ps.map((x) => { const pz = localizePresetProfile(x, S.lang); return `<option value="${esc(x.id)}" ${x.id === S.profile.activeProfileId ? 'selected' : ''}>${esc(`${pz.emoji} ${pz.name}`)}</option>` }).join('')}</select>
            <button class="profile-act" id="xac-p-e" ${isBusy ? 'disabled' : ''}>${esc(t('editP'))}</button>
            <button class="profile-act" id="xac-p-n" ${isBusy ? 'disabled' : ''}>+ ${esc(t('newP'))}</button>
          </div>
        </div>

        <div class="group">
          ${stepHead('stepStrategy', 'stepStrategyDesc')}
          ${hintLabel(t('mode'), 'mode')}
          <div class="chip-group mode">
            ${modeOptions.map((item) => `<button class="chip ${q.engagementMode === item.id ? 'active' : ''}" data-mode="${item.id}" ${isBusy ? 'disabled' : ''}>${esc(item.label)}</button>`).join('')}
          </div>
          ${hintLabel(t('goal'), 'goal')}
          <div class="chip-group">
            ${goalOptions.map((item) => `<button class="chip ${q.goal === item.id ? 'active' : ''}" data-goal="${item.id}" ${isBusy ? 'disabled' : ''}>${esc(item.label)}</button>`).join('')}
          </div>
          ${hintLabel(t('len'), 'len')}
          <div class="r3">
            ${lengthOptions.map((item) => `<button class="chip ${q.length === item.id ? 'active' : ''}" data-len="${item.id}" ${isBusy ? 'disabled' : ''}>${esc(item.label)}</button>`).join('')}
          </div>
        </div>

        <div class="group">
          ${stepHead('stepContent', 'stepContentDesc')}
          ${hintLabel(t('ci'), 'ci')}
          <textarea id="xac-ci">${esc(q.customInstructions || p.instructions || '')}</textarea>
          ${hintLabel(t('persona'), 'persona')}
          <textarea id="xac-pe">${esc(q.persona || p.persona || '')}</textarea>
        </div>

        <div class="group">
          ${stepHead('stepExecution', 'stepExecutionDesc')}
          <div class="hlabel"><span class="mini">${esc(t('autoPost'))}</span>${hintBtn('autoPost')}</div>
          <div class="switch"><span>${esc(t('autoPost'))}</span><input id="xac-ap" type="checkbox" ${S.autoPost ? 'checked' : ''}/></div>
          ${hintLabel(t('max'), 'max')}
          <input id="xac-max" type="number" min="0" max="200" value="${esc(String(S.auto.max || 0))}"/>
          <button class="${runToggleClass}" id="xac-run-toggle" ${isBusy ? 'disabled' : ''}>${esc(runToggleLabel)}</button>
          <div class="status" id="xac-status">${esc(S.status || t('idle'))}</div>
        </div>

        <div class="group">
          ${stepHead('stepAdvanced', 'stepAdvancedDesc', 'xac-advanced-anchor')}
          <div class="subh first"><span>${esc(t('sectionAutoActions'))}</span>${hintBtn('autoActions')}</div>
          <div class="switch"><span>${esc(t('autoLike'))}</span><input id="xac-like" type="checkbox" ${S.advanced.autoLike ? 'checked' : ''}/></div>
          <div class="switch"><span>${esc(t('autoRetweet'))}</span><input id="xac-retweet" type="checkbox" ${S.advanced.autoRetweet ? 'checked' : ''}/></div>
          <div class="switch"><span>${esc(t('autoFollow'))}</span><input id="xac-follow" type="checkbox" ${S.advanced.autoFollow ? 'checked' : ''}/></div>

          <div class="subh"><span>${esc(t('sectionFlow'))}</span>${hintBtn('flow')}</div>
          <label>${esc(t('scrollStep'))}</label><input id="xac-scroll-step" type="number" min="300" max="2000" step="50" value="${esc(String(S.advanced.scrollStep))}"/>
          <label>${esc(t('scrollDelayMs'))}</label><input id="xac-scroll-delay" type="number" min="400" max="10000" step="100" value="${esc(String(S.advanced.scrollDelayMs))}"/>
          <label>${esc(t('replyDelayMinMs'))}</label><input id="xac-reply-delay-min" type="number" min="500" max="30000" step="100" value="${esc(String(S.advanced.replyDelayMinMs))}"/>
          <label>${esc(t('replyDelayMaxMs'))}</label><input id="xac-reply-delay-max" type="number" min="500" max="60000" step="100" value="${esc(String(S.advanced.replyDelayMaxMs))}"/>
          <label>${esc(t('actionDelayMs'))}</label><input id="xac-action-delay" type="number" min="100" max="5000" step="50" value="${esc(String(S.advanced.actionDelayMs))}"/>
          <label>${esc(t('maxIdleLoops'))}</label><input id="xac-max-idle" type="number" min="1" max="50" step="1" value="${esc(String(S.advanced.maxIdleLoops))}"/>

          <div class="subh"><span>${esc(t('sectionFilter'))}</span>${hintBtn('filter')}</div>
          <label>${esc(t('minTweetChars'))}</label><input id="xac-min-chars" type="number" min="0" max="1000" step="10" value="${esc(String(S.advanced.minTweetChars))}"/>
          <div class="switch"><span>${esc(t('skipIfContainsLinks'))}</span><input id="xac-skip-links" type="checkbox" ${S.advanced.skipIfContainsLinks ? 'checked' : ''}/></div>
          <div class="switch"><span>${esc(t('skipIfContainsImages'))}</span><input id="xac-skip-images" type="checkbox" ${S.advanced.skipIfContainsImages ? 'checked' : ''}/></div>
          <label>${esc(t('searchIncludeTerms'))}</label>
          <div class="or-row">
            <input id="xac-search-include-a" type="text" placeholder="${esc(t('searchIncludePlaceholderA'))}" value="${esc(includeTermA)}"/>
            <span class="or-tag">${esc(t('searchOr'))}</span>
            <input id="xac-search-include-b" type="text" placeholder="${esc(t('searchIncludePlaceholderB'))}" value="${esc(includeTermB)}"/>
          </div>
          <label>${esc(t('searchExcludeTerms'))}</label><input id="xac-search-exclude" type="text" placeholder="${esc(t('searchExcludePlaceholder'))}" value="${esc(S.advanced.searchExcludeTerms || '')}"/>
          <label>${esc(t('searchMinReplies'))}</label><input id="xac-search-min-replies" type="number" min="0" max="9999" step="1" value="${esc(String(S.advanced.searchMinReplies))}"/>
          <div class="switch"><span>${esc(t('searchExcludeReplies'))}</span><input id="xac-search-exclude-replies" type="checkbox" ${S.advanced.searchExcludeReplies ? 'checked' : ''}/></div>
          <label>${esc(t('searchPreview'))}</label><input id="xac-search-preview" type="text" readonly value="${esc(S.advanced.searchQuery || DEFAULT_X_SEARCH_QUERY)}"/>
          <button id="xac-open-search">${esc(t('openSearch'))}</button>

          <div class="subh"><span>${esc(t('debugSec'))}</span>${hintBtn('debug')}</div>
          <label>${esc(t('debugPrompt'))}</label><textarea id="xac-debug-prompt">${esc(S.advanced.debugPrompt || '')}</textarea>
          <div class="r2">
            <button id="xac-debug-g" ${isBusy ? 'disabled' : ''}>${esc(t('debugGenerate'))}</button>
            <button id="xac-debug-c">${esc(t('debugCopy'))}</button>
          </div>
          <label>${esc(t('debugOutput'))}</label><textarea id="xac-debug-output" readonly>${esc(S.advanced.debugOutput || '')}</textarea>
        </div>
      </div>
    </div>
    ${S.editor?.open ? `<div class="modal" id="xac-editor-modal">
      <div class="modal-card">
        <div class="modal-h"><span>${esc(S.editor.mode === 'edit' ? t('profileEditTitle') : t('profileNewTitle'))}</span><button id="xac-editor-close">×</button></div>
        <div class="label-row">
          <div><label>${esc(t('profileName'))}</label><input id="xac-ed-name" value="${esc(d.name)}" placeholder="${esc(S.lang === 'zh' ? '增长黑客' : 'Growth Hacker')}"/></div>
          <div><label>${esc(t('profileEmoji'))}</label><input id="xac-ed-emoji" value="${esc(d.emoji)}" placeholder="⚡"/></div>
        </div>
        <label>${esc(t('profileTone'))}</label><input id="xac-ed-tone" value="${esc(d.tone)}" placeholder="${esc(S.lang === 'zh' ? '例如：大胆简洁，或酷炫。' : 'Example: bold and concise')}" />
        <label>${esc(t('goal'))}</label>
        <div class="chip-group">${goalOptions.map((item) => `<button class="chip ${d.goal === item.id ? 'active' : ''}" data-ed-goal="${item.id}">${esc(item.label)}</button>`).join('')}</div>
        <label>${esc(t('len'))}</label>
        <div class="r3">${lengthOptions.map((item) => `<button class="chip ${d.length === item.id ? 'active' : ''}" data-ed-len="${item.id}">${esc(item.label)}</button>`).join('')}</div>
        <label>${esc(t('profileLang'))}</label>
        <select id="xac-ed-lang"><option value="zh" ${d.language === 'zh' ? 'selected' : ''}>${esc(t('langZh'))}</option><option value="en" ${d.language === 'en' ? 'selected' : ''}>${esc(t('langEn'))}</option></select>
        <label>${esc(t('ci'))}</label><textarea id="xac-ed-ci">${esc(d.instructions)}</textarea>
        <label>${esc(t('persona'))}</label><textarea id="xac-ed-persona">${esc(d.persona)}</textarea>
        <div class="switch"><span>${esc(t('includeCta'))}</span><input id="xac-ed-cta" type="checkbox" ${d.includeCta ? 'checked' : ''}/></div>
        <div class="r2"><button class="p" id="xac-editor-save">${esc(t('saveProfile'))}</button><button id="xac-editor-cancel">${esc(t('cancel'))}</button></div>
      </div>
    </div>` : ''}`

    document.getElementById('xac-t')?.addEventListener('click', () => { S.open = !S.open; render() })
    document.getElementById('xac-login')?.addEventListener('click', async () => {
      if (S.signedIn) {
        await runPendingAction('logout', t('working'), async () => { await send('xac:google-sign-out'); S.signedIn = false; toast(t('signedOut'), 'ok') })
        return
      }
      await runPendingAction('login', t('loggingIn'), async () => { await signInFromPanel() })
    })
    document.getElementById('xac-upgrade')?.addEventListener('click', () => { window.open('https://www.gasgx.com', '_blank') })
    document.getElementById('xac-l-en')?.addEventListener('click', async () => {
      await runPendingAction('lang', t('working'), async () => {
        S.lang = 'en'
        await send('xac:set-language', { language: 'en' })
        await syncPresetQuickSettingsByLanguage()
        schedule()
        render()
      })
    })
    document.getElementById('xac-l-zh')?.addEventListener('click', async () => {
      await runPendingAction('lang', t('working'), async () => {
        S.lang = 'zh'
        await send('xac:set-language', { language: 'zh' })
        await syncPresetQuickSettingsByLanguage()
        schedule()
        render()
      })
    })
    document.getElementById('xac-p')?.addEventListener('change', async (e) => {
      await runPendingAction('save', t('saving'), async () => {
        S.profile.activeProfileId = s(e.target.value, S.profile.activeProfileId)
        const a = activeProfile(); S.profile.quickSettings.goal = a.goal; S.profile.quickSettings.length = a.length; S.profile.quickSettings.customInstructions = a.instructions; S.profile.quickSettings.persona = a.persona
        await saveProfileState(); toast(`${t('profile')}: ${a.name}`, 'ok')
      })
    })
    document.getElementById('xac-p-e')?.addEventListener('click', () => openProfileEditor('edit'))
    document.getElementById('xac-p-n')?.addEventListener('click', () => openProfileEditor('new'))
    document.querySelectorAll('#xac-root [data-mode]').forEach((el) => {
      el.addEventListener('click', async () => { S.profile.quickSettings.engagementMode = s(el.getAttribute('data-mode'), 'safe'); await saveProfileState(); render() })
    })
    document.querySelectorAll('#xac-root [data-goal]').forEach((el) => {
      el.addEventListener('click', async () => { S.profile.quickSettings.goal = s(el.getAttribute('data-goal'), 'engagement'); await saveProfileState(); render() })
    })
    document.querySelectorAll('#xac-root [data-len]').forEach((el) => {
      el.addEventListener('click', async () => { S.profile.quickSettings.length = s(el.getAttribute('data-len'), 'short'); await saveProfileState(); render() })
    })
    document.querySelectorAll('#xac-root [data-help]').forEach((el) => {
      el.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        const key = s(el.getAttribute('data-help'), '')
        const msgKey = HELP_KEY_TO_I18N[key]
        if (!msgKey) return
        toast(t(msgKey), 'info')
      })
    })
    document.getElementById('xac-ci')?.addEventListener('input', (e) => {
      S.profile.quickSettings.customInstructions = e.target.value || ''
      debounceRun('profile-custom-instructions', () => saveProfileState())
    })
    document.getElementById('xac-pe')?.addEventListener('input', (e) => {
      S.profile.quickSettings.persona = e.target.value || ''
      debounceRun('profile-persona', () => saveProfileState())
    })
    document.getElementById('xac-like')?.addEventListener('change', async (e) => { S.advanced.autoLike = !!e.target.checked; await saveAdvanced(true) })
    document.getElementById('xac-retweet')?.addEventListener('change', async (e) => { S.advanced.autoRetweet = !!e.target.checked; await saveAdvanced(true) })
    document.getElementById('xac-follow')?.addEventListener('change', async (e) => { S.advanced.autoFollow = !!e.target.checked; await saveAdvanced(true) })
    document.getElementById('xac-scroll-step')?.addEventListener('change', async (e) => { S.advanced.scrollStep = clampNum(e.target.value, 300, 2000, DEFAULT_ADVANCED.scrollStep); e.target.value = String(S.advanced.scrollStep); await saveAdvanced(true) })
    document.getElementById('xac-scroll-delay')?.addEventListener('change', async (e) => { S.advanced.scrollDelayMs = clampNum(e.target.value, 400, 10000, DEFAULT_ADVANCED.scrollDelayMs); e.target.value = String(S.advanced.scrollDelayMs); await saveAdvanced(true) })
    document.getElementById('xac-reply-delay-min')?.addEventListener('change', async (e) => {
      S.advanced.replyDelayMinMs = clampNum(e.target.value, 500, 30000, DEFAULT_ADVANCED.replyDelayMinMs)
      S.advanced.replyDelayMaxMs = Math.max(S.advanced.replyDelayMaxMs || 0, S.advanced.replyDelayMinMs)
      e.target.value = String(S.advanced.replyDelayMinMs)
      const maxInput = document.getElementById('xac-reply-delay-max')
      if (maxInput) maxInput.value = String(S.advanced.replyDelayMaxMs)
      await saveAdvanced(true)
    })
    document.getElementById('xac-reply-delay-max')?.addEventListener('change', async (e) => {
      S.advanced.replyDelayMaxMs = clampNum(e.target.value, 500, 60000, DEFAULT_ADVANCED.replyDelayMaxMs)
      S.advanced.replyDelayMinMs = Math.min(S.advanced.replyDelayMinMs || DEFAULT_ADVANCED.replyDelayMinMs, S.advanced.replyDelayMaxMs)
      e.target.value = String(S.advanced.replyDelayMaxMs)
      const minInput = document.getElementById('xac-reply-delay-min')
      if (minInput) minInput.value = String(S.advanced.replyDelayMinMs)
      await saveAdvanced(true)
    })
    document.getElementById('xac-action-delay')?.addEventListener('change', async (e) => {
      S.advanced.actionDelayMs = clampNum(e.target.value, 100, 5000, DEFAULT_ADVANCED.actionDelayMs)
      e.target.value = String(S.advanced.actionDelayMs)
      await saveAdvanced(true)
    })
    document.getElementById('xac-max-idle')?.addEventListener('change', async (e) => {
      S.advanced.maxIdleLoops = clampNum(e.target.value, 1, 50, DEFAULT_ADVANCED.maxIdleLoops)
      e.target.value = String(S.advanced.maxIdleLoops)
      await saveAdvanced(true)
    })
    document.getElementById('xac-min-chars')?.addEventListener('change', async (e) => {
      S.advanced.minTweetChars = clampNum(e.target.value, 0, 1000, DEFAULT_ADVANCED.minTweetChars)
      e.target.value = String(S.advanced.minTweetChars)
      await saveAdvanced(true)
    })
    document.getElementById('xac-skip-links')?.addEventListener('change', async (e) => { S.advanced.skipIfContainsLinks = !!e.target.checked; await saveAdvanced(true) })
    document.getElementById('xac-skip-images')?.addEventListener('change', async (e) => { S.advanced.skipIfContainsImages = !!e.target.checked; await saveAdvanced(true) })
    const syncIncludeTermsFromInputs = () => {
      const left = document.getElementById('xac-search-include-a')?.value || ''
      const right = document.getElementById('xac-search-include-b')?.value || ''
      S.advanced.searchIncludeTerms = normalizeSearchTermInput(`${left}, ${right}`)
      S.advanced.searchKeyword = S.advanced.searchIncludeTerms
    }
    document.getElementById('xac-search-include-a')?.addEventListener('input', () => {
      syncIncludeTermsFromInputs()
      syncSearchQueryFromControls(true)
      debounceRun('advanced-search-include', () => saveAdvanced(true))
    })
    document.getElementById('xac-search-include-b')?.addEventListener('input', () => {
      syncIncludeTermsFromInputs()
      syncSearchQueryFromControls(true)
      debounceRun('advanced-search-include', () => saveAdvanced(true))
    })
    document.getElementById('xac-search-exclude')?.addEventListener('input', (e) => {
      S.advanced.searchExcludeTerms = e.target.value || ''
      syncSearchQueryFromControls(true)
      debounceRun('advanced-search-exclude', () => saveAdvanced(true))
    })
    document.getElementById('xac-search-min-replies')?.addEventListener('change', async (e) => {
      S.advanced.searchMinReplies = clampNum(e.target.value, 0, 9999, DEFAULT_ADVANCED.searchMinReplies)
      e.target.value = String(S.advanced.searchMinReplies)
      syncSearchQueryFromControls(true)
      await saveAdvanced(true)
    })
    document.getElementById('xac-search-exclude-replies')?.addEventListener('change', async (e) => {
      S.advanced.searchExcludeReplies = !!e.target.checked
      syncSearchQueryFromControls(true)
      await saveAdvanced(true)
    })
    document.getElementById('xac-open-search')?.addEventListener('click', async () => {
      const query = syncSearchQueryFromControls(true)
      await saveAdvanced(true)
      window.location.href = buildSearchUrl(query)
    })
    document.getElementById('xac-debug-prompt')?.addEventListener('input', (e) => {
      S.advanced.debugPrompt = e.target.value || ''
      debounceRun('advanced-debug-prompt', () => saveAdvanced(true))
    })
    document.getElementById('xac-debug-g')?.addEventListener('click', async () => {
      await runPendingAction('debug', t('gen'), async () => { await runDebugGeneration() }, false)
    })
    document.getElementById('xac-debug-c')?.addEventListener('click', async () => {
      const text = String(S.advanced.debugOutput || '').trim()
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
        toast(S.lang === 'zh' ? '已复制' : 'Copied', 'ok')
      } catch {
        toast(t('fail'), 'warn')
      }
    })
    document.getElementById('xac-ap')?.addEventListener('change', async (e) => { S.autoPost = !!e.target.checked; await set({ [K.autoPost]: S.autoPost }) })
    document.getElementById('xac-max')?.addEventListener('change', (e) => { S.auto.max = Math.max(0, Math.round(n(e.target.value, 0))) })
    document.getElementById('xac-run-toggle')?.addEventListener('click', async () => {
      if (S.auto.active) {
        stopAuto()
        return
      }
      const m = Math.max(0, Math.round(n(document.getElementById('xac-max')?.value, 0)))
      await startAuto(m)
    })

    if (S.editor?.open) {
      const syncDraft = () => {
        S.editor.draft = {
          ...(S.editor.draft || emptyProfileDraft()),
          name: s(document.getElementById('xac-ed-name')?.value, ''),
          emoji: s(document.getElementById('xac-ed-emoji')?.value, '⚡'),
          tone: s(document.getElementById('xac-ed-tone')?.value, ''),
          language: s(document.getElementById('xac-ed-lang')?.value, S.lang),
          instructions: document.getElementById('xac-ed-ci')?.value || '',
          persona: document.getElementById('xac-ed-persona')?.value || '',
          includeCta: !!document.getElementById('xac-ed-cta')?.checked
        }
      }
      document.getElementById('xac-editor-close')?.addEventListener('click', closeProfileEditor)
      document.getElementById('xac-editor-cancel')?.addEventListener('click', closeProfileEditor)
      document.getElementById('xac-editor-modal')?.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'xac-editor-modal') closeProfileEditor()
      })
      document.querySelectorAll('#xac-root [data-ed-goal]').forEach((el) => {
        el.addEventListener('click', () => { S.editor.draft.goal = s(el.getAttribute('data-ed-goal'), 'engagement'); render() })
      })
      document.querySelectorAll('#xac-root [data-ed-len]').forEach((el) => {
        el.addEventListener('click', () => { S.editor.draft.length = s(el.getAttribute('data-ed-len'), 'short'); render() })
      })
      ;['xac-ed-name', 'xac-ed-emoji', 'xac-ed-tone', 'xac-ed-lang', 'xac-ed-ci', 'xac-ed-persona', 'xac-ed-cta'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', syncDraft)
        document.getElementById(id)?.addEventListener('change', syncDraft)
      })
      document.getElementById('xac-editor-save')?.addEventListener('click', async () => {
        syncDraft()
        await runPendingAction('save', t('saving'), async () => { await saveProfileEditorDraft() }, false)
      })
    }

    restorePanelUiState(uiState)
  }

  function mount() {
    if (document.getElementById('xac-root')) return
    const root = document.createElement('div'); root.id = 'xac-root'; root.className = S.open ? '' : 'collapsed'; document.documentElement.appendChild(root)
    render()
  }

  function observe() {
    new MutationObserver(() => schedule()).observe(document.documentElement, { childList: true, subtree: true })
    setInterval(() => schedule(), 1800)
  }

  async function init() {
    styles(); await loadState(); await syncPresetQuickSettingsByLanguage().catch(() => {}); mount(); setStatus(t('idle')); scanNow(); observe()
    const runtimeOnMessage = globalThis.chrome?.runtime?.onMessage
    if (runtimeOnMessage && typeof runtimeOnMessage.addListener === 'function') {
      runtimeOnMessage.addListener((message) => {
        if (!message || !message.xacAction) return
        if (message.xacAction === 'xac:content-open-advanced') {
          openPanelAndFocusAdvanced()
          return
        }
        if (message.xacAction === 'xac:content-open-search') {
          window.location.href = buildSearchUrl(message.query || S.advanced?.searchQuery || '')
        }
      })
    }
    const storageOnChanged = globalThis.chrome?.storage?.onChanged
    if (storageOnChanged && typeof storageOnChanged.addListener === 'function') {
      storageOnChanged.addListener((ch, area) => {
        if (area !== 'local') return
        if (ch[K.lang]) {
          S.lang = normLang(ch[K.lang].newValue)
          syncPresetQuickSettingsByLanguage().catch(() => {})
          render()
          schedule()
        }
        if (ch[K.autoPost]) { S.autoPost = b(ch[K.autoPost].newValue, false); render() }
        if (ch[K.googleSession]) { S.signedIn = !!(ch[K.googleSession].newValue && ch[K.googleSession].newValue.accessToken); render() }
        if (ch[K.profileMeta]) { S.profileMeta = ch[K.profileMeta].newValue || {}; render() }
        if (ch[K.advanced]) {
          S.advanced = normalizeAdvanced(ch[K.advanced].newValue)
          const ae = document.activeElement
          const editingInPanel =
            ae instanceof HTMLElement &&
            !!ae.closest('#xac-root') &&
            (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.getAttribute('contenteditable') === 'true')
          if (!editingInPanel) render()
        }
      })
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true })
  else init()
})()


