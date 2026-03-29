(() => {
  if (window.__xacContentLoaded) return
  window.__xacContentLoaded = true

  const VIEW = (() => {
    const pathname = String(window.location.pathname || '')
    const isPopup = /\/popup\.html$/i.test(pathname)
    const isOptions = /\/options\.html$/i.test(pathname)
    return {
      pathname,
      isPopup,
      isOptions,
      isExtensionPage: isPopup || isOptions,
      isContentPage: !(isPopup || isOptions)
    }
  })()

  const K = {
    lang: 'xac.language',
    autoPost: 'xac.autoPostEnabled',
    googleSession: 'xac.googleSession',
    profileMeta: 'xac.profileMeta',
    advanced: 'xac.advancedSettings',
    replyRules: 'xac.replyRules',
    scheduledStarts: 'xac.scheduledStarts',
    scheduleRuntime: 'xac.scheduleRuntime',
    cloudSyncStatus: 'xac.cloudSyncStatus'
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
    templateName: 'Default',
    addGMButton: true,
    showSideBarControls: true,
    ratedUs: false,
    autoLike: false,
    autoRetweet: false,
    autoFollow: false,
    maxInteractionsPerSessionMin: 30,
    maxInteractionsPerSessionMax: 50,
    maxTotalSessions: 3,
    sessionWaitMin: 5,
    sessionWaitMax: 15,
    useRefreshFeed: false,
    botSpeed: 30,
    randomSkips: 0,
    randomMouseMovement: true,
    postWithinMinutes: 720,
    onlyBlueChecks: false,
    useNameReplacements: 'smart',
    usernameReplacements: ['fam', 'homie', 'OG', 'boss', 'legend', 'degen', 'fren'],
    endGreetingsFollowed: [
      'Thanks for the follow, {name}.',
      'Appreciate the follow {name}, let us build together.',
      'Great to connect after the follow, {name}.'
    ],
    followedReplaceEndGreeting: false,
    followMinFollowers: 0,
    followMaxFollowers: 20000,
    followMinMutuals: 30,
    followRequireSignals: false,
    replyLikeFrequency: 100,
    extraLikesFrequency: 0,
    retweetMinLikes: 50,
    retweetMinRetweets: 50,
    retweetMinReplies: 50,
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
    scheduleRetryEnabled: true,
    scheduleRetryMaxAttempts: 2,
    scheduleRetryFirstDelayMin: 2,
    scheduleRetryNextDelayMin: 5,
    debugPrompt: '',
    debugOutput: ''
  }
  const DEFAULT_REPLY_RULES = [
    {
      id: 'preset_gm',
      name: 'GM Focus',
      keywords: 'gm, good morning, 早, 早上好',
      type: 'combo',
      start: 'GM!',
      end: 'What is your key focus today?',
      startPool: 'GM {name}!\n---\nGood morning {name}!',
      endPool: 'What is your key focus today?\n---\nWhat are you building today?',
      images: [],
      imageFrequency: 0,
      enabled: true,
      preset: true
    },
    {
      id: 'preset_gn',
      name: 'GN Wrap-up',
      keywords: 'gn, good night, 晚安, 收工',
      type: 'combo',
      start: 'GN!',
      end: 'One lesson from today before you log off?',
      startPool: 'GN {name}!\n---\nGood night {name}!',
      endPool: 'One lesson from today before you log off?\n---\nSleep well and see you tomorrow.',
      images: [],
      imageFrequency: 0,
      enabled: true,
      preset: true
    }
  ]
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
      sectionFollowRules: 'Follow Conditions',
      sectionRetweetRules: 'Retweet Conditions',
      sectionFlow: 'Flow Pace',
      sectionFilter: 'Content Filters',
      followMinFollowers: 'Follow min followers',
      followMaxFollowers: 'Follow max followers',
      followMinMutuals: 'Follow min mutuals',
      followRequireSignals: 'Require detectable profile stats',
      followRuleHint: 'If stats are not visible in timeline, enable strict mode to skip follow.',
      replyLikeFrequency: 'Reply like frequency (%)',
      extraLikesFrequency: 'Extra likes frequency (%)',
      retweetMinLikes: 'Retweet min likes',
      retweetMinRetweets: 'Retweet min retweets',
      retweetMinReplies: 'Retweet min replies',
      retweetRuleHint: 'Retweet only when all three metrics reach their minimum values.',
      sectionSchedule: 'Scheduled Starts',
      scheduleDesc: 'Auto-start at fixed local times via background alarms.',
      scheduleTime: 'Start time',
      scheduleMode: 'Repeat mode',
      scheduleModeDaily: 'Daily',
      scheduleModeWeekdays: 'Weekdays',
      scheduleModeWeekend: 'Weekend',
      scheduleModeCustom: 'Custom Days',
      scheduleDays: 'Days',
      scheduleDaysHint: 'Choose exact weekdays when mode is custom.',
      daySun: 'S',
      dayMon: 'M',
      dayTue: 'T',
      dayWed: 'W',
      dayThu: 'T',
      dayFri: 'F',
      daySat: 'S',
      scheduleMax: 'Run max (0 = unlimited)',
      scheduleEnabled: 'Enabled',
      scheduleAdd: 'Add Schedule',
      scheduleDelete: 'Delete',
      savedSchedules: 'Schedules saved.',
      sectionScheduleRetry: 'Retry Policy',
      scheduleRetryEnabled: 'Enable retry',
      scheduleRetryMaxAttempts: 'Retry attempts',
      scheduleRetryFirstDelayMin: 'First retry delay (min)',
      scheduleRetryNextDelayMin: 'Next retry delay (min)',
      scheduleRuntimeTitle: 'Runtime Status',
      scheduleRuntimeUpdated: 'Updated',
      scheduleRuntimeRefresh: 'Refresh Runtime',
      scheduleRuntimeNext: 'Next run',
      scheduleRuntimeLast: 'Last run',
      scheduleRuntimeResult: 'Last result',
      scheduleRuntimeAttempts: 'Attempts',
      scheduleRuntimeError: 'Last error',
      scheduleResultSuccess: 'Success',
      scheduleResultFailed: 'Failed',
      scheduleResultRetry: 'Retry queued',
      scheduleResultSkipped: 'Skipped',
      scheduleResultIdle: 'Idle',
      sectionReplyRules: 'Reply Trigger Rules',
      replyRulesDesc: 'Match keywords and wrap generated reply with rule templates.',
      replyRuleLabel: 'Rule',
      replyRuleName: 'Rule name',
      replyRuleKeywords: 'Trigger keywords',
      replyRuleKeywordsPlaceholder: 'keyword1, keyword2',
      replyRuleType: 'Rule type',
      replyRuleTypeSimple: 'Simple',
      replyRuleTypeCombo: 'Start + End',
      replyRuleStart: 'Start template',
      replyRuleEnd: 'End template',
      replyRuleStartPool: 'Start templates (--- split)',
      replyRuleEndPool: 'End templates (--- split)',
      replyRulePoolHint: 'One template per block. Use --- on a new line to separate.',
      replyRuleEnabled: 'Enabled',
      replyRuleAdd: 'Add Rule',
      replyRuleReset: 'Reset Presets',
      replyRuleDelete: 'Delete',
      replyRuleImport: 'Import Templates',
      replyRuleExport: 'Export Templates',
      replyRuleJson: 'Template JSON',
      replyRuleJsonHint: 'Paste JSON array and click import. Export writes current rules to this box.',
      replyRuleImportSuccess: 'Templates imported.',
      replyRuleImportFail: 'Invalid template JSON.',
      replyRuleExportCopied: 'Template JSON copied.',
      replyRuleImportFile: 'Import File',
      replyRuleExportFile: 'Export File',
      helpMode: 'Controls tone intensity: Safe = low risk, Spicy = more direct, Viral = strongest hook.',
      helpGoal: 'Defines reply objective: Engage / Authority / Debate / Network.',
      helpLen: 'Controls expected length of generated replies: Short / Medium / Long.',
      helpCi: 'Temporary instruction for this run only. Best for campaign-specific constraints.',
      helpPersona: 'Long-term identity memory. Keeps stable voice across replies.',
      helpAutoPost: 'When on, the extension will click the send button right after inserting generated text.',
      helpMax: 'Auto-reply cap per run. 0 means unlimited until stopped.',
      helpAutoActions: 'Extra actions after generating reply: like / retweet / follow.',
      helpFollowConditions: 'Gate auto-follow with follower range and mutual threshold.',
      helpRetweetConditions: 'Set minimum likes/retweets/replies required before auto-retweet executes.',
      helpFlow: 'Controls scan and pacing speed: scroll speed, delay, reply interval, idle limit.',
      helpFilter: 'Skip unsuitable posts by min text length, links/images, and quickly jump to search.',
      helpReplyRules: 'Keyword-based trigger rules. Matched rules can wrap reply with preset start/end lines.',
      helpReplyTemplates: 'Use multiple templates split by --- to randomize start/end wrappers.',
      helpSchedule: 'Set fixed times for automatic start. Runs in background alarm mode.',
      helpScheduleRetry: 'Configure background retry attempts and delay strategy when scheduled start fails.',
      helpDebug: 'Manual one-off prompt testing area. Use to tune output before full automation.',
      stepAi: 'Preparation · AI Engine',
      stepAiDesc: 'Confirm Spark and GasGx sync settings before generation or automation.',
      sparkStatus: 'AI Engine Status',
      sparkUrl: 'Spark URL',
      sparkAppId: 'App ID',
      sparkApiKey: 'API Key',
      sparkApiSecret: 'API Secret',
      sparkDomain: 'Domain',
      sparkTemp: 'Temperature',
      sparkTokens: 'Max Tokens',
      saveSpark: 'Save AI Settings',
      syncSpark: 'Sync From GasGx',
      sparkReady: 'AI settings are ready.',
      sparkMissingPrefix: 'Missing AI fields',
      sparkMissingHint: 'Save the required fields first.',
      saveSparkTip: 'Leave secret fields empty to keep existing values.',
      sparkHint: 'These settings follow the GasGx Spark config used by the content pipeline.',
      sparkSynced: 'AI settings synced from GasGx.',
      savedReplyRules: 'Reply trigger rules saved.',
      openAdvancedPanel: 'Open X Sidebar',
      openDetailedOptions: 'Open Full Config'
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
      sectionFollowRules: '关注条件',
      sectionRetweetRules: '转推条件',
      sectionFlow: '节奏控制',
      sectionFilter: '内容过滤',
      followMinFollowers: '关注最小粉丝数',
      followMaxFollowers: '关注最大粉丝数',
      followMinMutuals: '关注最小互关数',
      followRequireSignals: '必须检测到资料统计',
      followRuleHint: '若时间线看不到资料统计，开启严格模式会跳过关注。',
      replyLikeFrequency: '回复点赞频率 (%)',
      extraLikesFrequency: '额外点赞频率 (%)',
      retweetMinLikes: '转推最小点赞数',
      retweetMinRetweets: '转推最小转推数',
      retweetMinReplies: '转推最小评论数',
      retweetRuleHint: '仅当点赞/转推/评论三个指标都达到阈值时才自动转推。',
      sectionSchedule: '定时启动',
      scheduleDesc: '通过后台闹钟在本地固定时间自动启动。',
      scheduleTime: '启动时间',
      scheduleMode: '重复模式',
      scheduleModeDaily: '每天',
      scheduleModeWeekdays: '工作日',
      scheduleModeWeekend: '周末',
      scheduleModeCustom: '自定义周几',
      scheduleDays: '星期',
      scheduleDaysHint: '仅在“自定义周几”模式下生效。',
      daySun: '日',
      dayMon: '一',
      dayTue: '二',
      dayWed: '三',
      dayThu: '四',
      dayFri: '五',
      daySat: '六',
      scheduleMax: '本轮上限 (0=不限)',
      scheduleEnabled: '启用',
      scheduleAdd: '新增定时',
      scheduleDelete: '删除',
      savedSchedules: '定时配置已保存。',
      sectionScheduleRetry: '重试策略',
      scheduleRetryEnabled: '启用重试',
      scheduleRetryMaxAttempts: '重试次数',
      scheduleRetryFirstDelayMin: '首次重试延迟（分钟）',
      scheduleRetryNextDelayMin: '后续重试延迟（分钟）',
      scheduleRuntimeTitle: '运行状态',
      scheduleRuntimeUpdated: '更新时间',
      scheduleRuntimeRefresh: '刷新状态',
      scheduleRuntimeNext: '下次运行',
      scheduleRuntimeLast: '最近运行',
      scheduleRuntimeResult: '最近结果',
      scheduleRuntimeAttempts: '尝试次数',
      scheduleRuntimeError: '最近错误',
      scheduleResultSuccess: '成功',
      scheduleResultFailed: '失败',
      scheduleResultRetry: '已排队重试',
      scheduleResultSkipped: '已跳过',
      scheduleResultIdle: '空闲',
      sectionReplyRules: '回复触发规则',
      replyRulesDesc: '按关键词触发规则，并给生成内容套用开头/结尾模板。',
      replyRuleLabel: '规则',
      replyRuleName: '规则名',
      replyRuleKeywords: '触发关键词',
      replyRuleKeywordsPlaceholder: '关键词1, 关键词2',
      replyRuleType: '规则类型',
      replyRuleTypeSimple: '仅正文',
      replyRuleTypeCombo: '开头 + 结尾',
      replyRuleStart: '开头模板',
      replyRuleEnd: '结尾模板',
      replyRuleStartPool: '开头模板池（--- 分隔）',
      replyRuleEndPool: '结尾模板池（--- 分隔）',
      replyRulePoolHint: '每段一个模板；用独立一行 --- 作为分隔。',
      replyRuleEnabled: '启用',
      replyRuleAdd: '新增规则',
      replyRuleReset: '重置预设',
      replyRuleDelete: '删除',
      replyRuleImport: '导入模板',
      replyRuleExport: '导出模板',
      replyRuleJson: '模板 JSON',
      replyRuleJsonHint: '粘贴 JSON 数组后点导入；导出会把当前规则写入该输入框。',
      replyRuleImportSuccess: '模板导入成功。',
      replyRuleImportFail: '模板 JSON 无效。',
      replyRuleExportCopied: '模板 JSON 已复制。',
      replyRuleImportFile: '导入文件',
      replyRuleExportFile: '导出文件',
      helpMode: '控制语气强度：稳健=低风险，激进=更直接，爆款=钩子最强。',
      helpGoal: '定义回复目标：参与 / 权威 / 辩论 / 网络。',
      helpLen: '控制期望回复长度：短 / 中等 / 长。',
      helpCi: '本次任务的临时约束，适合活动或话题专项要求。',
      helpPersona: '长期身份记忆，让回复风格在多次生成中保持稳定。',
      helpAutoPost: '开启后，写入回复框后会自动点击发送按钮。',
      helpMax: '本轮自动回复上限，0 表示不限制直到手动停止。',
      helpAutoActions: '生成后附加动作：点赞 / 转推 / 关注。',
      helpFollowConditions: '用粉丝区间与互关阈值控制自动关注。',
      helpRetweetConditions: '设置自动转推前的最低点赞/转推/评论门槛。',
      helpFlow: '控制扫描与执行节奏：滚动速度、间隔、回复间隔、空转次数。',
      helpFilter: '通过最小字数、链接/图片过滤跳过不合适推文，并可快速跳转搜索。',
      helpReplyRules: '关键词触发规则。命中后可自动拼接开头/结尾模板。',
      helpReplyTemplates: '支持用 --- 分隔多模板，实现开头/结尾随机化。',
      helpSchedule: '设置固定启动时间，由后台闹钟自动触发运行。',
      helpScheduleRetry: '配置定时启动失败后的后台重试次数与延迟策略。',
      helpDebug: '手动单次调试区，先试提示词效果，再用于自动化。',
      stepAi: '准备项 · AI 引擎',
      stepAiDesc: '在生成和自动化前，先确认 Spark 与 GasGx 同步配置。',
      sparkStatus: 'AI 引擎状态',
      sparkUrl: 'Spark URL',
      sparkAppId: 'App ID',
      sparkApiKey: 'API Key',
      sparkApiSecret: 'API Secret',
      sparkDomain: '领域',
      sparkTemp: '温度',
      sparkTokens: '最大 Tokens',
      saveSpark: '保存 AI 配置',
      syncSpark: '从 GasGx 同步',
      sparkReady: 'AI 配置已就绪。',
      sparkMissingPrefix: '缺少 AI 字段',
      sparkMissingHint: '请先保存必填字段。',
      saveSparkTip: '密钥字段留空即可保留现有值。',
      sparkHint: '这组配置与 GasGx 内容采集链路使用的 Spark 配置保持一致。',
      sparkSynced: '已从 GasGx 同步 AI 配置。',
      savedReplyRules: '回复触发规则已保存。',
      openAdvancedPanel: '打开 X 侧栏',
      openDetailedOptions: '打开完整配置页'
    }
  }

  const S = {
    lang: 'en', open: false, myHandle: '',
    profile: { profiles: [...DEFAULT_PROFILES], activeProfileId: DEFAULT_PROFILES[0].id, quickSettings: { ...DEFAULT_QUICK } },
    profileMeta: {},
    advanced: { ...DEFAULT_ADVANCED },
    replyRules: DEFAULT_REPLY_RULES.map((rule) => ({ ...rule })),
    scheduledStarts: [],
    scheduleRuntime: { updatedAt: 0, lastSyncAt: 0, entries: {} },
    cloudSyncStatus: { lastSyncedAt: 0, lastPulledAt: 0, lastError: '' },
    replyRuleBulkText: '',
    editor: { open: false, mode: 'new', targetId: '', draft: null },
    autoPost: false,
    signedIn: false,
    googleSession: null,
    authConfig: null,
    sparkPublic: null,
    sparkDraft: {
      url: '',
      app_id: '',
      api_key: '',
      api_secret: '',
      domain: 'generalv3.5',
      temperature: 0.3,
      max_tokens: 512
    },
    pendingAction: '',
    auto: { active: false, count: 0, max: 0 },
    status: '',
    scheduled: false,
    idle: 0
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
    followConditions: 'helpFollowConditions',
    retweetConditions: 'helpRetweetConditions',
    flow: 'helpFlow',
    filter: 'helpFilter',
    replyRules: 'helpReplyRules',
    replyTemplates: 'helpReplyTemplates',
    schedule: 'helpSchedule',
    scheduleRetry: 'helpScheduleRetry',
    debug: 'helpDebug'
  })
  const SPARK_REQUIRED_FIELDS = ['url', 'app_id', 'api_key', 'api_secret']

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
  const parseTemplatePool = (rawValue) => {
    if (Array.isArray(rawValue)) {
      return rawValue
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    }
    const source = String(rawValue || '')
    if (!source.trim()) return []
    return source
      .split(/\n\s*---\s*\n/g)
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  }
  const normalizeTemplatePoolText = (rawValue) => parseTemplatePool(rawValue).join('\n---\n')
  const pickTemplateFromPool = (poolText) => {
    const pool = parseTemplatePool(poolText)
    if (!pool.length) return ''
    const index = Math.floor(Math.random() * pool.length)
    return pool[index] || ''
  }
  const normalizeNameReplacementMode = (value) => {
    const mode = s(value, DEFAULT_ADVANCED.useNameReplacements).toLowerCase()
    if (mode === 'never' || mode === 'smart' || mode === 'always') return mode
    return DEFAULT_ADVANCED.useNameReplacements
  }
  const normalizeUsernameReplacements = (rawValue) => {
    const source = Array.isArray(rawValue) ? rawValue : String(rawValue || '').split(/[,\n;；，]+/)
    const out = []
    source.forEach((item) => {
      const text = String(item || '').trim().replace(/^@+/, '')
      if (!text) return
      if (!out.includes(text)) out.push(text)
    })
    return out.slice(0, 40)
  }
  const normalizeImageList = (rawValue) => {
    const source = Array.isArray(rawValue) ? rawValue : String(rawValue || '').split(/[,\n;；，]+/)
    const out = []
    source.forEach((item) => {
      const text = String(item || '').trim()
      if (!text) return
      if (!/^(https?:\/\/|data:image\/)/i.test(text)) return
      if (!out.includes(text)) out.push(text)
    })
    return out.slice(0, 20)
  }
  const pickDisplayName = (rawName, advanced = S.advanced) => {
    const original = String(rawName || '').trim()
    const mode = normalizeNameReplacementMode(advanced?.useNameReplacements)
    const replacements = normalizeUsernameReplacements(advanced?.usernameReplacements || [])
    if (mode === 'never') return original
    if (!replacements.length) return original
    if (mode === 'smart') {
      const shouldReplace = !original || original.length > 16 || /[0-9_]/.test(original) || /@/.test(original)
      if (!shouldReplace) return original
    }
    const picked = replacements[Math.floor(Math.random() * replacements.length)] || ''
    return picked || original
  }
  const applyTemplateVariables = (template, vars = {}) => {
    const source = String(template || '')
    if (!source) return ''
    const name = pickDisplayName(vars.name, vars.advanced)
    const output = source.replace(/\{\s*name\s*\}/gi, name)
    return output.replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  }
  const normalizeScheduleTime = (value, fallback = '09:00') => {
    const source = String(value || '').trim()
    const match = source.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
    if (!match) return fallback
    const hour = String(match[1]).padStart(2, '0')
    const minute = String(match[2]).padStart(2, '0')
    return `${hour}:${minute}`
  }
  const normalizeScheduleMode = (value) => {
    const mode = s(value, 'daily').toLowerCase()
    if (mode === 'weekdays' || mode === 'weekend' || mode === 'custom') return mode
    return 'daily'
  }
  const scheduleDaysForMode = (mode) => {
    if (mode === 'weekdays') return [1, 2, 3, 4, 5]
    if (mode === 'weekend') return [0, 6]
    if (mode === 'custom') return [1, 2, 3, 4, 5]
    return [0, 1, 2, 3, 4, 5, 6]
  }
  const normalizeScheduleDays = (rawValue, mode = 'daily') => {
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
  const normalizeScheduledStart = (raw, index = 0) => {
    const source = raw && typeof raw === 'object' ? raw : {}
    const mode = normalizeScheduleMode(source.mode)
    const startTime = normalizeScheduleTime(source.startTime || source.time, '09:00')
    const endTime = normalizeScheduleTime(source.endTime || source.time || source.startTime, startTime)
    return {
      id: s(source.id, `schedule_${index + 1}`).replace(/\s+/g, '_'),
      time: startTime,
      startTime,
      endTime,
      mode,
      days: normalizeScheduleDays(source.days, mode),
      max: clampNum(source.max, 0, 200, 0),
      probability: clampNum(source.probability, 10, 100, 100),
      enabled: b(source.enabled, true)
    }
  }
  const normalizeScheduledStarts = (raw) => {
    if (!Array.isArray(raw) || !raw.length) return []
    const seen = new Set()
    const out = []
    raw.forEach((item, index) => {
      const normalized = normalizeScheduledStart(item, index)
      let id = normalized.id
      if (!id || seen.has(id)) id = `schedule_${Date.now().toString(36)}_${index}`
      seen.add(id)
      out.push({ ...normalized, id })
    })
    return out.slice(0, 20)
  }
  const normalizeRuntimeTimestamp = (value) => Math.max(0, Math.round(n(value, 0)))
  const normalizeScheduleRuntimeResult = (value) => {
    const result = s(value, '').toLowerCase()
    if (['success', 'failed', 'retry_scheduled', 'skipped'].includes(result)) return result
    return ''
  }
  const normalizeScheduleRuntimeEntry = (raw, scheduleId = '') => {
    const source = raw && typeof raw === 'object' ? raw : {}
    return {
      id: s(source.id, scheduleId),
      nextRunAt: normalizeRuntimeTimestamp(source.nextRunAt),
      retryAt: normalizeRuntimeTimestamp(source.retryAt),
      lastTriggeredAt: normalizeRuntimeTimestamp(source.lastTriggeredAt),
      lastSuccessAt: normalizeRuntimeTimestamp(source.lastSuccessAt),
      lastFailureAt: normalizeRuntimeTimestamp(source.lastFailureAt),
      lastErrorAt: normalizeRuntimeTimestamp(source.lastErrorAt),
      lastResult: normalizeScheduleRuntimeResult(source.lastResult),
      lastError: s(source.lastError, ''),
      attemptCount: clampNum(source.attemptCount, 0, 99, 0),
      totalSuccess: clampNum(source.totalSuccess, 0, 999999, 0),
      totalFailure: clampNum(source.totalFailure, 0, 999999, 0)
    }
  }
  const normalizeScheduleRuntimeState = (raw) => {
    const source = raw && typeof raw === 'object' ? raw : {}
    const entries = {}
    const rawEntries = source.entries && typeof source.entries === 'object' ? source.entries : {}
    Object.keys(rawEntries).forEach((id) => {
      const safeId = s(id, '')
      if (!safeId) return
      entries[safeId] = normalizeScheduleRuntimeEntry(rawEntries[safeId], safeId)
    })
    return {
      updatedAt: normalizeRuntimeTimestamp(source.updatedAt),
      lastSyncAt: normalizeRuntimeTimestamp(source.lastSyncAt),
      entries
    }
  }
  const formatScheduleRuntimeTimestamp = (value) => {
    const ts = normalizeRuntimeTimestamp(value)
    if (!ts) return '--'
    try {
      const locale = S.lang === 'zh' ? 'zh-CN' : 'en-US'
      return new Date(ts).toLocaleString(locale, {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return '--'
    }
  }
  const formatScheduleRuntimeResult = (entry) => {
    const rt = normalizeScheduleRuntimeEntry(entry)
    if (rt.lastResult === 'success') return t('scheduleResultSuccess')
    if (rt.lastResult === 'failed') return t('scheduleResultFailed')
    if (rt.lastResult === 'retry_scheduled') return t('scheduleResultRetry')
    if (rt.lastResult === 'skipped') return t('scheduleResultSkipped')
    return t('scheduleResultIdle')
  }
  const normalizeReplyRuleType = (value) => {
    const type = s(value, 'combo').toLowerCase()
    return type === 'simple' ? 'simple' : 'combo'
  }
  const normalizeReplyRule = (raw, index = 0) => {
    const source = raw && typeof raw === 'object' ? raw : {}
    const id = s(source.id, `reply_rule_${index + 1}`).replace(/\s+/g, '_')
    return {
      id,
      name: s(source.name, `Rule ${index + 1}`),
      keywords: normalizeSearchTermInput(source.keywords || ''),
      type: normalizeReplyRuleType(source.type),
      start: String(source.start || '').trim(),
      end: String(source.end || '').trim(),
      startPool: normalizeTemplatePoolText(source.startPool || source.startPoolText || source.start || ''),
      endPool: normalizeTemplatePoolText(source.endPool || source.endPoolText || source.end || ''),
      images: normalizeImageList(source.images || source.imageList || []),
      imageFrequency: clampNum(source.imageFrequency, 0, 100, 0),
      enabled: b(source.enabled, true),
      preset: b(source.preset, false)
    }
  }
  const cloneDefaultReplyRules = () => DEFAULT_REPLY_RULES.map((rule, index) => normalizeReplyRule(rule, index))
  const normalizeReplyRules = (raw) => {
    const source = Array.isArray(raw) && raw.length ? raw : cloneDefaultReplyRules()
    const seen = new Set()
    const out = []
    source.forEach((item, index) => {
      const normalized = normalizeReplyRule(item, index)
      let safeId = normalized.id
      if (seen.has(safeId)) safeId = `${safeId}_${index + 1}`
      seen.add(safeId)
      out.push({ ...normalized, id: safeId })
    })
    return out.length ? out.slice(0, 12) : cloneDefaultReplyRules()
  }
  const matchReplyRule = (ctx, rules = S.replyRules) => {
    const haystack = `${ctx?.tweetText || ''}\n${ctx?.quoteText || ''}\n${ctx?.threadText || ''}`.toLowerCase()
    if (!haystack.trim()) return null
    const list = normalizeReplyRules(rules)
    for (const rule of list) {
      if (!rule.enabled) continue
      const keys = parseSearchTerms(rule.keywords).map((item) => item.toLowerCase()).filter(Boolean)
      if (!keys.length) continue
      if (keys.some((keyword) => haystack.includes(keyword))) return rule
    }
    return null
  }
  const applyReplyRule = (text, rule, ctx = null) => {
    const core = String(text || '').trim()
    if (!core) return ''
    if (!rule || rule.type === 'simple') return core
    const vars = { name: s(ctx?.authorName, ''), advanced: S.advanced }
    const startTemplate = applyTemplateVariables(pickTemplateFromPool(rule.startPool) || rule.start, vars)
    let endSource = pickTemplateFromPool(rule.endPool) || rule.end
    if (ctx?.followed && S.advanced?.followedReplaceEndGreeting) {
      const followedPool = parseTemplatePool(S.advanced?.endGreetingsFollowed || [])
      if (followedPool.length) {
        endSource = followedPool[Math.floor(Math.random() * followedPool.length)] || endSource
      }
    }
    const endTemplate = applyTemplateVariables(endSource, vars)
    const out = []
    if (startTemplate) out.push(startTemplate)
    out.push(core)
    if (endTemplate) out.push(endTemplate)
    return out.join('\n')
  }
  const normalizeAdvanced = (raw) => {
    const source = raw && typeof raw === 'object' ? raw : {}
    const followRange = Array.isArray(source.followRange) ? source.followRange : (Array.isArray(source.FollowRange) ? source.FollowRange : null)
    const followMinFromRange = followRange ? clampNum(followRange[0], 0, 9999999, DEFAULT_ADVANCED.followMinFollowers) : null
    const followMaxFromRange = followRange ? clampNum(followRange[1], 0, 9999999, DEFAULT_ADVANCED.followMaxFollowers) : null
    const followMinLegacy = source.followMinFollwers ?? source.FollowMinFollwers ?? source.FollowMinFollowers
    const followMinRaw = followMinLegacy ?? source.followMinFollowers ?? followMinFromRange
    const followMaxRaw = source.followMaxFollowers ?? source.FollowMaxFollowers ?? followMaxFromRange
    const parsedSearch = deriveSearchControlsFromQuery(source.searchQuery)
    const searchIncludeTerms = normalizeSearchTermInput(source.searchIncludeTerms || source.searchKeyword || parsedSearch.searchIncludeTerms || parsedSearch.searchKeyword || '')
    const searchExcludeTerms = normalizeSearchTermInput(source.searchExcludeTerms || parsedSearch.searchExcludeTerms || '')
    const searchKeyword = searchIncludeTerms
    const searchUseGm = true
    const searchUseGn = true
    const searchMinReplies = clampNum(source.searchMinReplies, 0, 9999, parsedSearch.searchMinReplies)
    const searchExcludeReplies = b(source.searchExcludeReplies, parsedSearch.searchExcludeReplies)
    const followMinFollowers = clampNum(followMinRaw, 0, 9999999, DEFAULT_ADVANCED.followMinFollowers)
    const followMaxFollowers = Math.max(
      followMinFollowers,
      clampNum(followMaxRaw, 0, 9999999, DEFAULT_ADVANCED.followMaxFollowers)
    )
    const scheduleRetryMaxAttempts = clampNum(source.scheduleRetryMaxAttempts, 0, 5, DEFAULT_ADVANCED.scheduleRetryMaxAttempts)
    const scheduleRetryFirstDelayMin = clampNum(source.scheduleRetryFirstDelayMin, 1, 120, DEFAULT_ADVANCED.scheduleRetryFirstDelayMin)
    const scheduleRetryNextDelayMin = clampNum(source.scheduleRetryNextDelayMin, 1, 240, DEFAULT_ADVANCED.scheduleRetryNextDelayMin)
    const maxInteractionsPerSessionMin = clampNum(source.maxInteractionsPerSessionMin ?? source.MaxInteractionsPerSessionMin, 1, 500, DEFAULT_ADVANCED.maxInteractionsPerSessionMin)
    const maxInteractionsPerSessionMax = Math.max(
      maxInteractionsPerSessionMin,
      clampNum(source.maxInteractionsPerSessionMax ?? source.MaxInteractionsPerSessionMax, 1, 600, DEFAULT_ADVANCED.maxInteractionsPerSessionMax)
    )
    const sessionWaitMin = clampNum(source.sessionWaitMin ?? source.SessionWaitMin, 1, 240, DEFAULT_ADVANCED.sessionWaitMin)
    const sessionWaitMax = Math.max(sessionWaitMin, clampNum(source.sessionWaitMax ?? source.SessionWaitMax, 1, 360, DEFAULT_ADVANCED.sessionWaitMax))
    return {
      templateName: s(source.templateName ?? source.TemplateName, DEFAULT_ADVANCED.templateName),
      addGMButton: b(source.addGMButton ?? source.AddGMButton, DEFAULT_ADVANCED.addGMButton),
      showSideBarControls: b(source.showSideBarControls ?? source.ShowSideBarControls, DEFAULT_ADVANCED.showSideBarControls),
      ratedUs: b(source.ratedUs, DEFAULT_ADVANCED.ratedUs),
      autoLike: b(source.autoLike, DEFAULT_ADVANCED.autoLike),
      autoRetweet: b(source.autoRetweet, DEFAULT_ADVANCED.autoRetweet),
      autoFollow: b(source.autoFollow, DEFAULT_ADVANCED.autoFollow),
      maxInteractionsPerSessionMin,
      maxInteractionsPerSessionMax,
      maxTotalSessions: clampNum(source.maxTotalSessions ?? source.MaxTotalSessions, 1, 30, DEFAULT_ADVANCED.maxTotalSessions),
      sessionWaitMin,
      sessionWaitMax,
      useRefreshFeed: b(source.useRefreshFeed ?? source.UseRefreshFeed, DEFAULT_ADVANCED.useRefreshFeed),
      botSpeed: clampNum(source.botSpeed ?? source.BotSpeed, 1, 100, DEFAULT_ADVANCED.botSpeed),
      randomSkips: clampNum(source.randomSkips ?? source.RandomSkips, 0, 95, DEFAULT_ADVANCED.randomSkips),
      randomMouseMovement: b(source.randomMouseMovement ?? source.RandomMouseMovement, DEFAULT_ADVANCED.randomMouseMovement),
      postWithinMinutes: clampNum(source.postWithinMinutes ?? source.PostWithinMinutes, 5, 10080, DEFAULT_ADVANCED.postWithinMinutes),
      onlyBlueChecks: b(source.onlyBlueChecks ?? source.OnlyBlueChecks, DEFAULT_ADVANCED.onlyBlueChecks),
      useNameReplacements: normalizeNameReplacementMode(source.useNameReplacements ?? source.UseNameReplacements),
      usernameReplacements: normalizeUsernameReplacements(source.usernameReplacements ?? source.UsernameReplacements ?? DEFAULT_ADVANCED.usernameReplacements),
      endGreetingsFollowed: parseTemplatePool(source.endGreetingsFollowed ?? source.EndGreetingsFollowed ?? DEFAULT_ADVANCED.endGreetingsFollowed),
      followedReplaceEndGreeting: b(source.followedReplaceEndGreeting ?? source.FollowedReplaceEndGreeting, DEFAULT_ADVANCED.followedReplaceEndGreeting),
      followMinFollowers,
      followMaxFollowers,
      followMinMutuals: clampNum(source.followMinMutuals ?? source.FollowMinMutuals, 0, 9999999, DEFAULT_ADVANCED.followMinMutuals),
      followRequireSignals: b(source.followRequireSignals, DEFAULT_ADVANCED.followRequireSignals),
      replyLikeFrequency: clampNum(source.replyLikeFrequency, 0, 100, DEFAULT_ADVANCED.replyLikeFrequency),
      extraLikesFrequency: clampNum(source.extraLikesFrequency, 0, 100, DEFAULT_ADVANCED.extraLikesFrequency),
      retweetMinLikes: clampNum(source.retweetMinLikes, 0, 9999999, DEFAULT_ADVANCED.retweetMinLikes),
      retweetMinRetweets: clampNum(source.retweetMinRetweets, 0, 9999999, DEFAULT_ADVANCED.retweetMinRetweets),
      retweetMinReplies: clampNum(source.retweetMinReplies, 0, 9999999, DEFAULT_ADVANCED.retweetMinReplies),
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
      scheduleRetryEnabled: b(source.scheduleRetryEnabled, DEFAULT_ADVANCED.scheduleRetryEnabled),
      scheduleRetryMaxAttempts,
      scheduleRetryFirstDelayMin,
      scheduleRetryNextDelayMin,
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
  const getSparkMissingFields = (sparkSettings) => {
    const source = sparkSettings && typeof sparkSettings === 'object' ? sparkSettings : {}
    if (Array.isArray(source.missingRequiredFields) && source.missingRequiredFields.length > 0) {
      return source.missingRequiredFields
        .map((field) => String(field || '').trim())
        .filter(Boolean)
    }
    return SPARK_REQUIRED_FIELDS.filter((field) => !s(source[field], ''))
  }
  const formatSparkMissingMessage = (sparkSettings) => {
    const missing = getSparkMissingFields(sparkSettings)
    if (!missing.length) return t('sparkReady')
    return `${t('sparkMissingPrefix')}: ${missing.join(', ')}. ${t('sparkMissingHint')}`
  }
  const setSparkDraftFromPublic = (sparkSettings) => {
    const source = sparkSettings && typeof sparkSettings === 'object' ? sparkSettings : {}
    S.sparkPublic = source
    S.sparkDraft = {
      url: s(source.url, ''),
      app_id: '',
      api_key: '',
      api_secret: '',
      domain: s(source.domain, 'generalv3.5'),
      temperature: Number.isFinite(Number(source.temperature)) ? Number(source.temperature) : 0.3,
      max_tokens: Number.isFinite(Number(source.max_tokens)) ? Number(source.max_tokens) : 512
    }
  }
  const maskEmail = (session) => {
    const email =
      session?.user?.email ||
      session?.user?.user_metadata?.email ||
      session?.user?.identities?.[0]?.identity_data?.email ||
      ''
    return s(email, '-')
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
  const downloadTextFile = (filename, content, mimeType = 'application/json;charset=utf-8') => {
    try {
      const blob = new Blob([String(content || '')], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.style.display = 'none'
      document.documentElement.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      return true
    } catch {
      return false
    }
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

  function convertLegacyMessagesToRules(legacyMessages) {
    if (!Array.isArray(legacyMessages) || !legacyMessages.length) return []
    const out = []
    legacyMessages.forEach((item, index) => {
      if (!item || typeof item !== 'object') return
      const keywords = normalizeSearchTermInput(item.keywords || item.triggerKeywords || item.keyword || '')
      const startPool = normalizeTemplatePoolText(item.startPool || item.startGreeting || item.start || '')
      const endPool = normalizeTemplatePoolText(item.endPool || item.endGreeting || item.end || '')
      out.push({
        id: s(item.id, `legacy_rule_${index + 1}`),
        name: s(item.name, `Legacy Rule ${index + 1}`),
        keywords,
        type: 'combo',
        start: pickTemplateFromPool(startPool) || '',
        end: pickTemplateFromPool(endPool) || '',
        startPool,
        endPool,
        images: normalizeImageList(item.images || []),
        imageFrequency: clampNum(item.imageFrequency, 0, 100, 0),
        enabled: b(item.enabled, true),
        preset: false
      })
    })
    return out
  }

  function normalizeCloudSyncStatus(raw) {
    const source = raw && typeof raw === 'object' ? raw : {}
    return {
      lastSyncedAt: Math.max(0, Math.round(n(source.lastSyncedAt, 0))),
      lastPulledAt: Math.max(0, Math.round(n(source.lastPulledAt, 0))),
      lastError: s(source.lastError, '')
    }
  }

  async function loadState() {
    const rs = await send('xac:get-state')
    if (rs.ok && rs.state) {
      S.lang = normLang(rs.state.language || navigator.language)
      S.signedIn = Boolean(rs.state.googleSession && rs.state.googleSession.accessToken)
      S.googleSession = rs.state.googleSession || null
      S.authConfig = rs.state.authConfig || null
      setSparkDraftFromPublic(rs.state.sparkSettings || null)
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
      S.googleSession = null
      setSparkDraftFromPublic(null)
    }
    const local = await g([
      K.autoPost,
      K.profileMeta,
      K.advanced,
      K.replyRules,
      K.scheduledStarts,
      K.scheduleRuntime,
      K.cloudSyncStatus,
      'settings',
      'messages'
    ]).catch(() => ({}))
    const legacySettings = local.settings && typeof local.settings === 'object' ? local.settings : null
    const hasCurrentAdvanced = local[K.advanced] && typeof local[K.advanced] === 'object'
    const hasCurrentRules = Array.isArray(local[K.replyRules]) && local[K.replyRules].length > 0
    S.autoPost = b(local[K.autoPost], false)
    S.profileMeta = local[K.profileMeta] && typeof local[K.profileMeta] === 'object' ? local[K.profileMeta] : {}
    S.advanced = normalizeAdvanced(hasCurrentAdvanced ? local[K.advanced] : legacySettings)
    const legacyRules = convertLegacyMessagesToRules(local.messages || legacySettings?.messages || [])
    S.replyRules = normalizeReplyRules(hasCurrentRules ? local[K.replyRules] : legacyRules)
    S.scheduledStarts = normalizeScheduledStarts(local[K.scheduledStarts])
    S.scheduleRuntime = normalizeScheduleRuntimeState(local[K.scheduleRuntime])
    S.cloudSyncStatus = normalizeCloudSyncStatus(local[K.cloudSyncStatus])
    if (!hasCurrentAdvanced && legacySettings) {
      await set({ [K.advanced]: S.advanced }).catch(() => {})
    }
    if (!hasCurrentRules && legacyRules.length) {
      await set({ [K.replyRules]: S.replyRules }).catch(() => {})
    }
  }

  async function saveProfileState() {
    await send('xac:set-profile-state', { profileState: S.profile })
  }

  async function saveAdvanced(silent = true) {
    S.advanced = normalizeAdvanced(S.advanced)
    await set({ [K.advanced]: S.advanced }).catch(() => {})
    if (!silent) toast(t('savedAdvanced'), 'ok')
  }

  async function saveReplyRules(silent = true) {
    S.replyRules = normalizeReplyRules(S.replyRules)
    await set({ [K.replyRules]: S.replyRules }).catch(() => {})
    if (!silent) toast(t('savedReplyRules'), 'ok')
  }

  async function saveScheduledStarts(silent = true) {
    S.scheduledStarts = normalizeScheduledStarts(S.scheduledStarts)
    await set({ [K.scheduledStarts]: S.scheduledStarts }).catch(() => {})
    const syncResult = await send('xac:sync-scheduled-starts').catch(() => ({ ok: false }))
    if (syncResult.ok && syncResult.runtime) {
      S.scheduleRuntime = normalizeScheduleRuntimeState(syncResult.runtime)
    }
    if (!silent) toast(t('savedSchedules'), 'ok')
  }

  async function refreshScheduleRuntimeState(shouldRender = true) {
    const result = await send('xac:get-schedule-runtime')
    if (result.ok && result.runtime) {
      S.scheduleRuntime = normalizeScheduleRuntimeState(result.runtime)
    }
    if (shouldRender) render()
    return S.scheduleRuntime
  }

  async function saveSettingsToCloud() {
    const payload = {
      [K.autoPost]: S.autoPost,
      [K.profileMeta]: S.profileMeta,
      [K.advanced]: normalizeAdvanced(S.advanced),
      [K.replyRules]: normalizeReplyRules(S.replyRules),
      [K.scheduledStarts]: normalizeScheduledStarts(S.scheduledStarts),
      [K.scheduleRuntime]: normalizeScheduleRuntimeState(S.scheduleRuntime)
    }
    const result = await send('xac:save-settings', { settings: payload })
    if (!result.ok) throw new Error(s(result.error, 'save-settings failed'))
    S.cloudSyncStatus = normalizeCloudSyncStatus({
      ...(S.cloudSyncStatus || {}),
      lastSyncedAt: n(result.savedAt, Date.now()),
      lastError: ''
    })
    await set({ [K.cloudSyncStatus]: S.cloudSyncStatus }).catch(() => {})
    return result
  }

  async function loadSettingsFromCloud() {
    const result = await send('xac:get-saved-settings', { applyToLocal: true })
    if (!result.ok) throw new Error(s(result.error, 'get-saved-settings failed'))
    if (!result.found) {
      throw new Error(S.lang === 'zh' ? '云端暂无备份。' : 'No cloud backup found.')
    }
    const local = await g([K.autoPost, K.profileMeta, K.advanced, K.replyRules, K.scheduledStarts, K.scheduleRuntime]).catch(() => ({}))
    S.autoPost = b(local[K.autoPost], false)
    S.profileMeta = local[K.profileMeta] && typeof local[K.profileMeta] === 'object' ? local[K.profileMeta] : {}
    S.advanced = normalizeAdvanced(local[K.advanced])
    S.replyRules = normalizeReplyRules(local[K.replyRules])
    S.scheduledStarts = normalizeScheduledStarts(local[K.scheduledStarts])
    S.scheduleRuntime = normalizeScheduleRuntimeState(local[K.scheduleRuntime])
    S.cloudSyncStatus = normalizeCloudSyncStatus({
      ...(S.cloudSyncStatus || {}),
      lastPulledAt: n(result.savedAt, Date.now()),
      lastError: ''
    })
    await set({ [K.cloudSyncStatus]: S.cloudSyncStatus }).catch(() => {})
    await saveScheduledStarts(true)
    return result
  }

  async function saveSparkSettingsFromDraft() {
    const payload = {
      url: s(S.sparkDraft.url, ''),
      app_id: s(S.sparkDraft.app_id, ''),
      api_key: s(S.sparkDraft.api_key, ''),
      api_secret: s(S.sparkDraft.api_secret, ''),
      domain: s(S.sparkDraft.domain, 'generalv3.5'),
      temperature: Number(S.sparkDraft.temperature || 0.3),
      max_tokens: Number(S.sparkDraft.max_tokens || 512)
    }
    const result = await send('xac:set-spark-settings', { settings: payload })
    if (!result.ok) {
      throw new Error(s(result.error, t('unknownError')))
    }
    setSparkDraftFromPublic(result.sparkSettings || null)
    return result.sparkSettings || null
  }

  async function syncSparkSettings() {
    const result = await send('xac:sync-spark-settings')
    if (!result.ok) {
      throw new Error(s(result.error, t('unknownError')))
    }
    setSparkDraftFromPublic(result.sparkSettings || null)
    return result.sparkSettings || null
  }

  async function refreshRemoteRuntimeState() {
    if (!VIEW.isExtensionPage) return S.auto
    const [result, scheduleResult] = await Promise.all([
      send('xac:get-runtime-state', { query: S.advanced?.searchQuery || DEFAULT_X_SEARCH_QUERY }),
      send('xac:get-schedule-runtime').catch(() => ({ ok: false }))
    ])
    if (scheduleResult.ok && scheduleResult.runtime) {
      S.scheduleRuntime = normalizeScheduleRuntimeState(scheduleResult.runtime)
    }
    if (!result.ok || !result.state) {
      S.auto = { active: false, count: 0, max: Math.max(0, Math.round(n(S.auto.max, 0))) }
      if (!S.pendingAction) setStatus(t('idle'))
      render()
      return S.auto
    }
    const remote = result.state || {}
    S.auto = {
      active: !!remote.auto?.active,
      count: Math.max(0, Math.round(n(remote.auto?.count, 0))),
      max: Math.max(0, Math.round(n(remote.auto?.max, S.auto.max || 0)))
    }
    setStatus(s(remote.status, S.auto.active ? t('run') : t('idle')))
    render()
    return S.auto
  }

  async function requestRemoteStartAuto(maxValue) {
    const result = await send('xac:start-auto', {
      query: S.advanced?.searchQuery || DEFAULT_X_SEARCH_QUERY,
      max: Math.max(0, Math.round(n(maxValue, 0)))
    })
    if (!result.ok) {
      throw new Error(s(result.error, t('unknownError')))
    }
    const remote = result.state || {}
    S.auto = {
      active: !!remote.auto?.active,
      count: Math.max(0, Math.round(n(remote.auto?.count, 0))),
      max: Math.max(0, Math.round(n(remote.auto?.max, maxValue)))
    }
    setStatus(s(remote.status, t('run')))
    render()
    return S.auto
  }

  async function requestRemoteStopAuto() {
    const result = await send('xac:stop-auto', {
      query: S.advanced?.searchQuery || DEFAULT_X_SEARCH_QUERY
    })
    if (!result.ok) {
      throw new Error(s(result.error, t('unknownError')))
    }
    const remote = result.state || {}
    S.auto = {
      active: !!remote.auto?.active,
      count: Math.max(0, Math.round(n(remote.auto?.count, 0))),
      max: Math.max(0, Math.round(n(remote.auto?.max, S.auto.max || 0)))
    }
    setStatus(s(remote.status, t('stopped')))
    render()
    return S.auto
  }

  function styles() {
    if (document.getElementById('xac-style')) return
    const st = document.createElement('style')
    st.id = 'xac-style'
    st.textContent = `
${VIEW.isExtensionPage ? 'html,body{background:radial-gradient(circle at top right,#173124,#09130f 45%);color:#d9ffe9}body{margin:0}' : ''}
#xac-root{position:${VIEW.isExtensionPage ? 'static' : 'fixed'};right:${VIEW.isExtensionPage ? 'auto' : '14px'};bottom:${VIEW.isExtensionPage ? 'auto' : '16px'};z-index:2147483645;width:${VIEW.isExtensionPage ? 'clamp(340px,96vw,360px)' : 'min(94vw,360px)'};max-width:${VIEW.isExtensionPage ? 'clamp(340px,96vw,360px)' : 'none'};margin:${VIEW.isExtensionPage ? '0 auto' : '0'};padding:${VIEW.isExtensionPage ? '10px' : '0'};box-sizing:border-box;font-family:Segoe UI,Microsoft YaHei,sans-serif}
#xac-root .shell{border:1px solid #2f6e48;border-radius:14px;background:linear-gradient(180deg,#132c21,#08140f);box-shadow:0 12px 32px rgba(0,0,0,.42);overflow:hidden}
#xac-root .top{width:100%;border:0;cursor:pointer;background:transparent;color:#d9ffe9;padding:10px 12px;display:flex;justify-content:space-between;align-items:center}
#xac-root .top .t1{font-size:15px;font-weight:800;line-height:1.1}
#xac-root .top .t2{font-size:11px;color:#89bca1;line-height:1.2}
#xac-root .quota{border:1px solid #2f6e48;border-radius:999px;padding:2px 8px;font-size:11px;color:#8df4be;background:#0d2219;white-space:nowrap}
#xac-root .body{border-top:1px solid #1f4933;display:grid;gap:8px;padding:10px 12px;max-height:${VIEW.isExtensionPage ? 'none' : '76vh'};overflow:${VIEW.isExtensionPage ? 'visible' : 'auto'}}
#xac-root.collapsed .body{display:none}
#xac-root .sec{font-size:11px;color:#76b396;padding-left:2px}
#xac-root .sec.flash{color:#bafdd6;text-shadow:0 0 8px rgba(96,246,161,.5)}
#xac-root .group{border:1px solid #24543a;background:linear-gradient(180deg,#10231b,#0b1913);border-radius:10px;padding:9px;display:grid;gap:8px}
#xac-root .group-h{font-size:12px;color:#c7f8df;font-weight:800;letter-spacing:.2px}
#xac-root .step{display:grid;gap:3px;padding-bottom:7px;margin-bottom:1px;border-bottom:1px solid #1f4b35}
#xac-root .step-title{font-size:15px;color:#dcffed;font-weight:900;line-height:1.15;letter-spacing:.25px}
#xac-root .step-desc{font-size:11px;color:#8ec4a7;line-height:1.35}
#xac-root .flash{box-shadow:0 0 0 2px rgba(96,246,161,.35),0 0 14px rgba(96,246,161,.25)}
#xac-root .guide-banner{border:1px solid #2d6649;border-left:3px solid #56df93;background:linear-gradient(180deg,#123126,#0d2119);border-radius:10px;padding:8px 9px;display:grid;gap:4px}
#xac-root .guide-banner .meta{font-size:11px;color:#b8ebd0;line-height:1.4}
#xac-root .mini-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
#xac-root .mini-btn{padding:6px 4px;font-size:11px;line-height:1.1;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#xac-root .hlabel{display:flex;align-items:center;justify-content:space-between;gap:8px}
#xac-root .hlabel label,#xac-root .hlabel .mini{font-size:11px;color:#93c9ad}
#xac-root .subh{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:6px;margin-top:2px;border-top:1px dashed #25533b;font-size:11px;color:#84bea0}
#xac-root .subh.first{border-top:0;padding-top:0}
#xac-root .card{border:1px solid #24543a;background:#0d1b15;border-radius:10px;padding:8px 9px;display:grid;gap:3px}
#xac-root .card.schedule-runtime{gap:5px}
#xac-root .meta{font-size:11px;color:#9cd8b8}
#xac-root .schedule-runtime-line{font-size:11px;color:#b6ecd0}
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
#xac-root .chip-group.days{grid-template-columns:repeat(7,minmax(0,1fr))}
#xac-root .chip{border:1px solid #365f4a;background:#101c16;color:#c9f4de;font-size:12px;padding:8px 6px;text-align:center}
#xac-root .chip.small{padding:6px 4px;font-size:11px}
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
@media (max-width:520px){#xac-root{right:${VIEW.isExtensionPage ? 'auto' : '8px'};bottom:${VIEW.isExtensionPage ? 'auto' : '10px'};width:calc(100vw - 16px);max-width:calc(100vw - 16px)}}`
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
    const authorNameCandidates = Array.from(article.querySelectorAll('[data-testid="User-Name"] span'))
      .map((node) => String(node?.textContent || '').trim())
      .filter(Boolean)
      .filter((text) => !text.startsWith('@') && text !== '·')
    const authorName = authorNameCandidates[0] || ''
    const tweetTimeRaw = s(article.querySelector('time')?.getAttribute('datetime'), '')
    const tweetTs = tweetTimeRaw ? Date.parse(tweetTimeRaw) : 0
    const ageMinutes = Number.isFinite(tweetTs) && tweetTs > 0 ? Math.max(0, Math.floor((Date.now() - tweetTs) / 60000)) : Number.POSITIVE_INFINITY
    const isBlueCheck = Boolean(
      article.querySelector('[data-testid*="icon-verified"]') ||
      article.querySelector('svg[aria-label*="Verified"]') ||
      article.querySelector('svg[aria-label*="认证"]')
    )
    return {
      tweetText: cap(txt.join('\n').trim(), 1600),
      quoteText: cap(Array.from(new Set(quote)).join('\n---\n').trim(), 1200),
      threadText: cap(parent.join('\n---\n').trim(), 1200),
      images: Array.from(new Set(images)).slice(0, 4),
      authorName: cap(authorName, 120),
      ageMinutes,
      isBlueCheck,
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

  function pickReplyRuleImage(rule) {
    const list = normalizeImageList(rule?.images || [])
    if (!list.length) return ''
    const index = Math.floor(Math.random() * list.length)
    return list[index] || ''
  }

  async function blobToFile(blob, filename = 'xac-image.png') {
    const type = String(blob?.type || 'image/png')
    if (typeof File === 'function') {
      return new File([blob], filename, { type })
    }
    const fallback = blob
    fallback.name = filename
    fallback.lastModified = Date.now()
    return fallback
  }

  async function readDataUrlAsFile(dataUrl) {
    const match = String(dataUrl || '').match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i)
    if (!match) return null
    const mime = match[1]
    const base64 = match[2]
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    const ext = mime.includes('jpeg') ? 'jpg' : (mime.split('/')[1] || 'png')
    return blobToFile(new Blob([bytes], { type: mime }), `xac-local-${Date.now()}.${ext}`)
  }

  async function fetchUrlAsFile(url) {
    try {
      const response = await fetch(url, { credentials: 'omit', cache: 'no-store' })
      if (!response.ok) return null
      const blob = await response.blob()
      const ext = String(blob.type || '').includes('jpeg') ? 'jpg' : 'png'
      return blobToFile(blob, `xac-rule-${Date.now()}.${ext}`)
    } catch {
      return null
    }
  }

  function findComposerImageInput() {
    const selectors = [
      'div[role="dialog"] input[type="file"][accept*="image"]',
      'input[data-testid="fileInput"]',
      'input[type="file"][accept*="image"]'
    ]
    for (const selector of selectors) {
      const node = document.querySelector(selector)
      if (node instanceof HTMLInputElement) return node
    }
    return null
  }

  async function attachImageToComposer(imageSource) {
    const source = String(imageSource || '').trim()
    if (!source) return false
    let file = null
    if (/^data:image\//i.test(source)) {
      file = await readDataUrlAsFile(source)
    } else if (/^https?:\/\//i.test(source)) {
      file = await fetchUrlAsFile(source)
    }
    if (!file) return false
    const input = findComposerImageInput()
    if (!input) return false
    try {
      const dt = new DataTransfer()
      dt.items.add(file)
      input.files = dt.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
      await sleep(300)
      return true
    } catch {
      return false
    }
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
      return text === 'follow' || text === '关注'
    })
    if (!fallback) return false
    fallback.click()
    return true
  }

  function rollByFrequency(frequency) {
    const freq = clampNum(frequency, 0, 100, 0)
    if (freq <= 0) return false
    if (freq >= 100) return true
    return Math.random() * 100 < freq
  }

  function parseCompactCount(raw) {
    const text = String(raw || '').trim().replace(/,/g, '')
    if (!text) return 0
    const match = text.match(/(\d+(?:\.\d+)?)\s*([kmb万]?)/i)
    if (!match) return 0
    const value = Number(match[1] || 0)
    if (!Number.isFinite(value)) return 0
    const unit = String(match[2] || '').toLowerCase()
    if (unit === 'k') return Math.round(value * 1000)
    if (unit === 'm') return Math.round(value * 1000000)
    if (unit === 'b') return Math.round(value * 1000000000)
    if (unit === '万') return Math.round(value * 10000)
    return Math.round(value)
  }

  function parseCountByKeywords(raw, keywordRe) {
    const source = String(raw || '')
    if (!source.trim()) return null
    const match = source.match(new RegExp(`(\\d[\\d,]*(?:\\.\\d+)?\\s*[kmb万]?)\\s*(?:${keywordRe.source})`, 'i'))
    if (!match?.[1]) return null
    const parsed = parseCompactCount(match[1])
    return Number.isFinite(parsed) ? parsed : null
  }

  function readFollowSignals(article) {
    const pieces = []
    if (article) pieces.push(String(article.innerText || ''))
    article?.querySelectorAll('[aria-label]').forEach((el) => {
      const label = s(el.getAttribute('aria-label'), '')
      if (label) pieces.push(label)
    })
    const combined = pieces.join('\n')
    const followers = parseCountByKeywords(combined, /followers?|粉丝/)
    const mutuals = parseCountByKeywords(combined, /mutuals?|共同关注|互关/)
    return { followers, mutuals }
  }

  function canFollowByRules(article, cfg) {
    const minFollowers = clampNum(cfg.followMinFollowers, 0, 9999999, DEFAULT_ADVANCED.followMinFollowers)
    const maxFollowers = Math.max(minFollowers, clampNum(cfg.followMaxFollowers, 0, 9999999, DEFAULT_ADVANCED.followMaxFollowers))
    const minMutuals = clampNum(cfg.followMinMutuals, 0, 9999999, DEFAULT_ADVANCED.followMinMutuals)
    const strict = b(cfg.followRequireSignals, DEFAULT_ADVANCED.followRequireSignals)
    const signals = readFollowSignals(article)

    if (signals.followers != null) {
      if (signals.followers < minFollowers || signals.followers > maxFollowers) return false
    } else if (strict && (minFollowers > 0 || maxFollowers < 9999999)) {
      return false
    }

    if (minMutuals > 0) {
      if (signals.mutuals == null) return !strict
      if (signals.mutuals < minMutuals) return false
    }

    return true
  }

  function readActionCount(article, testId) {
    const action = article?.querySelector(`button[data-testid="${testId}"], div[data-testid="${testId}"]`)
    if (!action) return 0
    const host = action.closest('button, div[role="button"], [data-testid]') || action
    const text = `${host.getAttribute?.('aria-label') || ''} ${host.innerText || ''}`
    const tokens = Array.from(String(text || '').matchAll(/(\d[\d,]*(?:\.\d+)?)\s*([kmb万]?)/gi))
    if (!tokens.length) return 0
    const parsed = tokens.map((m) => parseCompactCount(`${m[1]}${m[2] || ''}`)).filter((v) => Number.isFinite(v) && v >= 0)
    if (!parsed.length) return 0
    return Math.max(...parsed)
  }

  function readTweetEngagement(article) {
    return {
      likes: readActionCount(article, 'like'),
      retweets: readActionCount(article, 'retweet'),
      replies: readActionCount(article, 'reply')
    }
  }

  function canRetweetByThreshold(article, cfg) {
    const stats = readTweetEngagement(article)
    return (
      stats.likes >= clampNum(cfg.retweetMinLikes, 0, 9999999, DEFAULT_ADVANCED.retweetMinLikes) &&
      stats.retweets >= clampNum(cfg.retweetMinRetweets, 0, 9999999, DEFAULT_ADVANCED.retweetMinRetweets) &&
      stats.replies >= clampNum(cfg.retweetMinReplies, 0, 9999999, DEFAULT_ADVANCED.retweetMinReplies)
    )
  }

  function clickExtraLike(article) {
    const candidates = []
    article?.querySelectorAll('article[data-testid="tweet"] button[data-testid="like"], article[data-testid="tweet"] div[data-testid="like"]').forEach((node) => {
      candidates.push(node)
    })
    const cell = article?.closest('[data-testid="cellInnerDiv"]')
    if (cell) {
      let prev = cell.previousElementSibling
      let depth = 0
      while (prev && depth < 2) {
        const node = prev.querySelector('article[data-testid="tweet"] button[data-testid="like"], article[data-testid="tweet"] div[data-testid="like"]')
        if (node) candidates.push(node)
        prev = prev.previousElementSibling
        depth += 1
      }
    }
    const target = candidates.find((node) => node instanceof HTMLElement && node.offsetParent !== null)
    if (!target) return false
    target.click()
    return true
  }

  async function runPostActions(article, options = {}) {
    const cfg = normalizeAdvanced(S.advanced)
    const skipFollow = Boolean(options.skipFollow)
    if (cfg.autoLike && rollByFrequency(cfg.replyLikeFrequency)) {
      clickLike(article)
      await sleep(cfg.actionDelayMs)
    }
    if (cfg.autoRetweet && canRetweetByThreshold(article, cfg)) {
      await clickRetweet(article)
      await sleep(cfg.actionDelayMs)
    }
    if (cfg.autoLike && rollByFrequency(cfg.extraLikesFrequency)) {
      clickExtraLike(article)
      await sleep(cfg.actionDelayMs)
    }
    if (!skipFollow && cfg.autoFollow && canFollowByRules(article, cfg)) {
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
    if (!cfg.minTweetChars && !cfg.skipIfContainsLinks && !cfg.skipIfContainsImages && !cfg.onlyBlueChecks && !cfg.postWithinMinutes) return true
    const ctx = context(article)
    const tweetText = String(ctx?.tweetText || '')
    if (cfg.minTweetChars > 0 && tweetText.length < cfg.minTweetChars) return false
    const combined = `${ctx?.tweetText || ''}\n${ctx?.quoteText || ''}\n${ctx?.threadText || ''}`
    if (cfg.skipIfContainsLinks && /(?:https?:\/\/|www\.)\S+/i.test(combined)) return false
    if (cfg.skipIfContainsImages && Array.isArray(ctx?.images) && ctx.images.length > 0) return false
    if (cfg.onlyBlueChecks && !ctx?.isBlueCheck) return false
    if (cfg.postWithinMinutes > 0 && Number.isFinite(ctx?.ageMinutes) && ctx.ageMinutes > cfg.postWithinMinutes) return false
    return true
  }

  function messages(ctx, triggeredRule = null) {
    const p = promptSettings()
    const ctaRuleZh = p.includeCta ? '结尾添加简短行动号召（例如提问或邀请互动）。' : ''
    const ctaRuleEn = p.includeCta ? 'End with a short CTA (question or invite to respond).' : ''
    const ruleHintZh = triggeredRule
      ? (triggeredRule.type === 'combo'
          ? `触发规则: ${triggeredRule.name}。你只输出中间正文，不要重复开头/结尾模板。`
          : `触发规则: ${triggeredRule.name}。正文需自然贴合该关键词语境。`)
      : ''
    const ruleHintEn = triggeredRule
      ? (triggeredRule.type === 'combo'
          ? `Triggered rule: ${triggeredRule.name}. Output body text only. Do not repeat the rule start/end templates.`
          : `Triggered rule: ${triggeredRule.name}. Keep the reply naturally aligned with the matched keyword context.`)
      : ''
    const sys = p.language === 'zh'
      ? ['你是X平台评论助手。', `语气: ${p.tone}`, `目标: ${p.goal}`, `长度: ${p.length}`, `互动强度: ${p.engagementMode}`, p.persona ? `人设: ${p.persona}` : '', p.instructions ? `额外约束: ${p.instructions}` : '', ctaRuleZh, ruleHintZh, '必须适配 X 普通账号限制：按字符权重总长度不超过 280，优先控制在 240 以内。', '只输出一条可直接发布的中文回复，不要解释。'].filter(Boolean).join('\n')
      : ['You are an assistant for generating X/Twitter replies.', `Tone: ${p.tone}`, `Goal: ${p.goal}`, `Length: ${p.length}`, `Engagement mode: ${p.engagementMode}`, p.persona ? `Persona: ${p.persona}` : '', p.instructions ? `Extra rules: ${p.instructions}` : '', ctaRuleEn, ruleHintEn, 'Must fit X non-premium limits: weighted length <= 280, preferably <= 240.', 'Return one post-ready reply only. No explanation.'].filter(Boolean).join('\n')
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
    S.googleSession = r.ok ? (r.googleSession || null) : null
    S.signedIn = !!(r.ok && r.googleSession && r.googleSession.accessToken)
    return S.signedIn
  }

  async function signInFromPanel() {
    const r = await send('xac:google-sign-in')
    const ok = !!(r.ok && r.googleSession && r.googleSession.accessToken)
    S.googleSession = ok ? (r.googleSession || null) : null
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
      const cfg = normalizeAdvanced(S.advanced)
      const triggeredRule = matchReplyRule(ctx, S.replyRules)
      let followedByPreAction = false
      if (triggeredRule && triggeredRule.type === 'combo' && cfg.autoFollow && cfg.followedReplaceEndGreeting && canFollowByRules(article, cfg)) {
        followedByPreAction = clickFollow(article)
        if (followedByPreAction) await sleep(cfg.actionDelayMs)
      }
      const ed = await openEditor(article)
      if (!ed) { btnState(btn, 'f', t('fail')); toast(t('editorMissing'), 'warn'); return false }
      const r = await send('xac:spark-complete', { messages: messages(ctx, triggeredRule), timeoutMs: 70000 })
      if (!r.ok || !s(r.text, '')) {
        const reason = formatUserError(s(r.error, t('emptyModelOutput')))
        btnState(btn, 'f', t('fail')); toast(`${t('fail')}: ${reason}`, 'warn')
        return false
      }
      const ruledText = applyReplyRule(s(r.text, ''), triggeredRule, { ...ctx, followed: followedByPreAction })
      const limited = trimToXLimit(ruledText, X_NON_PREMIUM_MAX_LENGTH)
      if (!limited.text) {
        btnState(btn, 'f', t('fail')); toast(`${t('fail')}: ${t('emptyModelOutput')}`, 'warn')
        return false
      }
      if (!putText(ed, limited.text)) {
        btnState(btn, 'f', t('fail')); toast(t('insertFailed'), 'warn')
        return false
      }
      if (triggeredRule?.images?.length && rollByFrequency(triggeredRule.imageFrequency)) {
        const imageSource = pickReplyRuleImage(triggeredRule)
        if (imageSource) {
          await attachImageToComposer(imageSource)
        }
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
      await runPostActions(article, { skipFollow: followedByPreAction }).catch(() => {})
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
    const cfg = normalizeAdvanced(S.advanced)
    const all = Array.from(document.querySelectorAll('article[data-testid="tweet"]'))
    for (const a of all) {
      if (!(a instanceof HTMLElement) || a.closest('div[role="dialog"]') || isOwn(a)) continue
      let b = a.parentElement?.querySelector('.xac-inline-btn'); if (!b) b = makeBtn(a)
      if (!b || b.dataset.autoDone === '1' || b.dataset.busy === '1') continue
      if (b.classList.contains('o')) { b.dataset.autoDone = '1'; continue }
      if (!passesAdvancedFilter(a)) { b.dataset.autoFiltered = '1'; continue }
      if (cfg.randomSkips > 0 && Math.random() * 100 < cfg.randomSkips) {
        b.dataset.autoSkipped = '1'
        continue
      }
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

  function speedFactorFromBotSpeed(botSpeed) {
    const safe = clampNum(botSpeed, 1, 100, DEFAULT_ADVANCED.botSpeed)
    return Math.max(0.35, Math.min(2.4, (120 - safe) / 60))
  }

  function simulateRandomMouseMovement(target) {
    if (!(target instanceof HTMLElement)) return
    const rect = target.getBoundingClientRect()
    const x = rect.left + Math.max(8, Math.random() * Math.max(10, rect.width - 16))
    const y = rect.top + Math.max(8, Math.random() * Math.max(10, rect.height - 16))
    target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }))
  }

  async function waitWithStop(totalMs) {
    let remain = Math.max(0, Math.round(n(totalMs, 0)))
    while (S.auto.active && remain > 0) {
      const chunk = Math.min(1200, remain)
      await sleep(chunk)
      remain -= chunk
    }
  }

  async function startAuto(max) {
    if (S.auto.active) return
    S.auto.active = true; S.auto.count = 0; S.auto.max = Math.max(0, Math.round(n(max, 0))); S.idle = 0
    setStatus(t('run')); ind(true)
    render()
    const cfg = normalizeAdvanced(S.advanced)
    const speedFactor = speedFactorFromBotSpeed(cfg.botSpeed)
    const maxSessions = Math.max(1, cfg.maxTotalSessions)
    let sessionIndex = 0

    while (S.auto.active && sessionIndex < maxSessions) {
      sessionIndex += 1
      const sessionTarget = randomBetween(cfg.maxInteractionsPerSessionMin, cfg.maxInteractionsPerSessionMax)
      let sessionDone = 0
      S.idle = 0

      while (S.auto.active && sessionDone < sessionTarget) {
        if (S.auto.max > 0 && S.auto.count >= S.auto.max) break
        const c = nextCandidate()
        if (!c) {
          S.idle += 1
          if (S.idle > cfg.maxIdleLoops) break
          window.scrollBy({ top: cfg.scrollStep, behavior: 'smooth' })
          await sleep(Math.max(120, Math.round(cfg.scrollDelayMs * speedFactor)))
          continue
        }
        S.idle = 0
        c.article.scrollIntoView({ behavior: 'smooth', block: 'center' })
        if (cfg.randomMouseMovement) simulateRandomMouseMovement(c.article)
        await sleep(Math.max(120, Math.round(700 * speedFactor)))
        const ok = await generate(c.article, c.btn, true)
        c.btn.dataset.autoDone = '1'
        if (ok) {
          S.auto.count += 1
          sessionDone += 1
          ind(true)
        }
        await sleep(Math.max(180, Math.round(randomBetween(cfg.replyDelayMinMs, cfg.replyDelayMaxMs) * speedFactor)))
      }

      if (!S.auto.active || (S.auto.max > 0 && S.auto.count >= S.auto.max) || sessionIndex >= maxSessions) break
      if (cfg.useRefreshFeed) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        await sleep(Math.max(200, Math.round(800 * speedFactor)))
      }
      const waitMs = randomBetween(cfg.sessionWaitMin, cfg.sessionWaitMax) * 60 * 1000
      await waitWithStop(waitMs)
    }

    S.auto.active = false; ind(false); setStatus(t('stopped')); toast(`${t('done')}: ${S.auto.count}`, 'ok'); render()
  }

  function stopAuto() { S.auto.active = false; ind(false); setStatus(t('stopped')); render() }

  function runtimeStateSnapshot() {
    return {
      auto: {
        active: !!S.auto.active,
        count: Math.max(0, Math.round(n(S.auto.count, 0))),
        max: Math.max(0, Math.round(n(S.auto.max, 0)))
      },
      status: s(S.status, t('idle')),
      open: !!S.open
    }
  }

  function openDetailedOptionsPage() {
    const target = chrome.runtime.getURL('options.html')
    window.open(target, '_blank')
  }

  function openPanelAndFocusAdvanced() {
    S.open = true
    render()
    setTimeout(() => {
      const anchor = document.getElementById(VIEW.isContentPage ? 'xac-run-toggle' : 'xac-advanced-anchor')
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
    S.replyRules = normalizeReplyRules(S.replyRules)
    S.scheduledStarts = normalizeScheduledStarts(S.scheduledStarts)
    const p = activeProfile(), q = S.profile.quickSettings || DEFAULT_QUICK, ps = S.profile.profiles || []
    const replyRules = S.replyRules || []
    const scheduledStarts = S.scheduledStarts || []
    const scheduleRuntime = normalizeScheduleRuntimeState(S.scheduleRuntime)
    const isBusy = Boolean(S.pendingAction)
    const signInLabel = S.pendingAction === 'login' ? t('loggingIn') : (S.signedIn ? t('logout') : t('signIn'))
    const accountEmail = maskEmail(S.googleSession)
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
    const scheduleModeOptions = [
      { id: 'daily', label: t('scheduleModeDaily') },
      { id: 'weekdays', label: t('scheduleModeWeekdays') },
      { id: 'weekend', label: t('scheduleModeWeekend') },
      { id: 'custom', label: t('scheduleModeCustom') }
    ]
    const dayOptions = [
      { day: 0, label: t('daySun') },
      { day: 1, label: t('dayMon') },
      { day: 2, label: t('dayTue') },
      { day: 3, label: t('dayWed') },
      { day: 4, label: t('dayThu') },
      { day: 5, label: t('dayFri') },
      { day: 6, label: t('daySat') }
    ]
    const quotaNum = Math.max(0, 8 - (S.auto.count % 9))
    const includeTerms = parseSearchTerms(S.advanced.searchIncludeTerms || S.advanced.searchKeyword)
    const includeTermA = includeTerms[0] || ''
    const includeTermB = includeTerms[1] || ''
    const usernameReplacementsText = normalizeUsernameReplacements(S.advanced.usernameReplacements || []).join(', ')
    const followedEndText = parseTemplatePool(S.advanced.endGreetingsFollowed || []).join('\n---\n')
    const cloudSyncedLabel = S.cloudSyncStatus?.lastSyncedAt ? formatScheduleRuntimeTimestamp(S.cloudSyncStatus.lastSyncedAt) : '--'
    const cloudPulledLabel = S.cloudSyncStatus?.lastPulledAt ? formatScheduleRuntimeTimestamp(S.cloudSyncStatus.lastPulledAt) : '--'
    const runToggleLabel = S.auto.active ? t('stop') : t('start')
    const runToggleClass = S.auto.active ? '' : 'p'
    const d = S.editor?.draft || emptyProfileDraft()
    const hintBtn = (key) => `<button class="hint" type="button" data-help="${esc(key)}">?</button>`
    const hintLabel = (text, key) => `<div class="hlabel"><label>${esc(text)}</label>${key ? hintBtn(key) : ''}</div>`
    const stepHead = (titleKey, descKey, anchorId = '') => `<div class="step"><div class="step-title"${anchorId ? ` id="${esc(anchorId)}"` : ''}>${esc(t(titleKey))}</div><div class="step-desc">${esc(t(descKey))}</div></div>`
    if (VIEW.isContentPage) {
      root.className = S.open ? '' : 'collapsed'
      root.innerHTML = `<div class="shell">
        <button class="top" id="xac-t">
          <span><div class="t1">${esc(t('title'))}</div><div class="t2">${esc(t('sub'))}</div></span>
          <span class="quota">● ${S.lang === 'zh' ? `剩余${quotaNum}次` : `${quotaNum} left`}</span>
        </button>
        <div class="body">
          <div class="guide-banner">
            <div class="meta">• ${esc(t('stepExecutionDesc'))}</div>
            <div class="meta">• ${esc(t('guideLine2'))}</div>
          </div>

          <div class="group">
            ${stepHead('stepExecution', 'stepExecutionDesc')}
            <div class="hlabel"><span class="mini">${esc(t('autoPost'))}</span>${hintBtn('autoPost')}</div>
            <div class="switch"><span>${esc(t('autoPost'))}</span><input id="xac-ap" type="checkbox" ${S.autoPost ? 'checked' : ''}/></div>
            ${hintLabel(t('max'), 'max')}
            <input id="xac-max" type="number" min="0" max="200" value="${esc(String(S.auto.max || 0))}"/>
            <button class="${runToggleClass}" id="xac-run-toggle" ${isBusy ? 'disabled' : ''}>${esc(runToggleLabel)}</button>
            <div class="r2">
              <button id="xac-open-search">${esc(t('openSearch'))}</button>
              <button id="xac-open-options">${esc(t('openDetailedOptions'))}</button>
            </div>
            <div class="status" id="xac-status">${esc(S.status || t('idle'))}</div>
          </div>
        </div>
      </div>`

      document.getElementById('xac-t')?.addEventListener('click', () => { S.open = !S.open; render() })
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
      document.getElementById('xac-ap')?.addEventListener('change', async (e) => {
        S.autoPost = !!e.target.checked
        await set({ [K.autoPost]: S.autoPost })
      })
      document.getElementById('xac-max')?.addEventListener('change', (e) => {
        S.auto.max = Math.max(0, Math.round(n(e.target.value, 0)))
      })
      document.getElementById('xac-open-options')?.addEventListener('click', openDetailedOptionsPage)
      document.getElementById('xac-open-search')?.addEventListener('click', async () => {
        const query = syncSearchQueryFromControls(true)
        await saveAdvanced(true)
        window.location.href = buildSearchUrl(query)
      })
      document.getElementById('xac-run-toggle')?.addEventListener('click', async () => {
        if (S.auto.active) {
          stopAuto()
          return
        }
        const maxValue = Math.max(0, Math.round(n(document.getElementById('xac-max')?.value, 0)))
        await startAuto(maxValue)
      })
      restorePanelUiState(uiState)
      return
    }
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
          <div class="card">
            <div class="meta xac-account-email">${esc(accountEmail)}</div>
            <div class="meta">${esc(S.signedIn ? t('signedIn') : t('signedOut'))}</div>
          </div>
          <div class="mini-row">
            <button class="mini-btn" id="xac-login" ${isBusy ? 'disabled' : ''}>${esc(signInLabel)}</button>
            <button class="mini-btn pro" id="xac-upgrade">${esc(t('upgradePro'))}</button>
            <button class="mini-btn chip ${S.lang === 'en' ? 'active' : ''}" id="xac-l-en" ${isBusy ? 'disabled' : ''}>EN</button>
            <button class="mini-btn chip ${S.lang === 'zh' ? 'active' : ''}" id="xac-l-zh" ${isBusy ? 'disabled' : ''}>中文</button>
          </div>
        </div>

        <div class="group">
          ${stepHead('stepAi', 'stepAiDesc')}
          <div class="card">
            <div class="meta">${esc(t('sparkStatus'))}: ${esc(formatSparkMissingMessage(S.sparkPublic))}</div>
          </div>
          <label>${esc(t('sparkUrl'))}</label><input id="xac-spark-url" type="text" value="${esc(S.sparkDraft.url || '')}" placeholder="${esc(t('sparkUrl'))}"/>
          <div class="r2">
            <div><label>${esc(t('sparkAppId'))}</label><input id="xac-spark-app-id" type="text" value="" placeholder="${esc(t('sparkAppId'))}"/></div>
            <div><label>${esc(t('sparkDomain'))}</label><input id="xac-spark-domain" type="text" value="${esc(String(S.sparkDraft.domain || 'generalv3.5'))}" placeholder="${esc(t('sparkDomain'))}"/></div>
          </div>
          <div class="r2">
            <div><label>${esc(t('sparkApiKey'))}</label><input id="xac-spark-api-key" type="text" value="" placeholder="${esc(t('sparkApiKey'))}"/></div>
            <div><label>${esc(t('sparkApiSecret'))}</label><input id="xac-spark-api-secret" type="text" value="" placeholder="${esc(t('sparkApiSecret'))}"/></div>
          </div>
          <div class="r2">
            <div><label>${esc(t('sparkTemp'))}</label><input id="xac-spark-temp" type="number" min="0" max="1" step="0.01" value="${esc(String(S.sparkDraft.temperature))}" placeholder="${esc(t('sparkTemp'))}"/></div>
            <div><label>${esc(t('sparkTokens'))}</label><input id="xac-spark-max-tokens" type="number" min="128" max="4096" step="1" value="${esc(String(S.sparkDraft.max_tokens))}" placeholder="${esc(t('sparkTokens'))}"/></div>
          </div>
          <div class="r2">
            <button id="xac-save-spark" ${isBusy ? 'disabled' : ''}>${esc(t('saveSpark'))}</button>
            <button id="xac-sync-spark" ${isBusy ? 'disabled' : ''}>${esc(t('syncSpark'))}</button>
          </div>
          <div class="meta">${esc(t('saveSparkTip'))}</div>
          <div class="meta">${esc(t('sparkHint'))}</div>
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
          <div class="r2">
            <button id="xac-open-advanced-panel">${esc(t('openAdvancedPanel'))}</button>
            ${VIEW.isPopup ? `<button id="xac-open-options">${esc(t('openDetailedOptions'))}</button>` : '<span></span>'}
          </div>
          <div class="status" id="xac-status">${esc(S.status || t('idle'))}</div>
        </div>

        <div class="group">
          ${stepHead('stepAdvanced', 'stepAdvancedDesc', 'xac-advanced-anchor')}
          <div class="subh first"><span>${esc(t('sectionAutoActions'))}</span>${hintBtn('autoActions')}</div>
          <div class="switch"><span>${esc(t('autoLike'))}</span><input id="xac-like" type="checkbox" ${S.advanced.autoLike ? 'checked' : ''}/></div>
          <div class="switch"><span>${esc(t('autoRetweet'))}</span><input id="xac-retweet" type="checkbox" ${S.advanced.autoRetweet ? 'checked' : ''}/></div>
          <div class="switch"><span>${esc(t('autoFollow'))}</span><input id="xac-follow" type="checkbox" ${S.advanced.autoFollow ? 'checked' : ''}/></div>
          <label>${esc(t('replyLikeFrequency'))}</label><input id="xac-reply-like-frequency" type="number" min="0" max="100" step="1" value="${esc(String(S.advanced.replyLikeFrequency))}"/>
          <label>${esc(t('extraLikesFrequency'))}</label><input id="xac-extra-likes-frequency" type="number" min="0" max="100" step="1" value="${esc(String(S.advanced.extraLikesFrequency))}"/>

          <div class="subh"><span>${esc(S.lang === 'zh' ? '会话风控' : 'Session Risk Controls')}</span></div>
          <label>${esc(S.lang === 'zh' ? '每会话互动最小值' : 'Interactions/session min')}</label><input id="xac-session-min" type="number" min="1" max="500" step="1" value="${esc(String(S.advanced.maxInteractionsPerSessionMin))}"/>
          <label>${esc(S.lang === 'zh' ? '每会话互动最大值' : 'Interactions/session max')}</label><input id="xac-session-max" type="number" min="1" max="600" step="1" value="${esc(String(S.advanced.maxInteractionsPerSessionMax))}"/>
          <label>${esc(S.lang === 'zh' ? '总会话上限' : 'Max total sessions')}</label><input id="xac-session-total" type="number" min="1" max="30" step="1" value="${esc(String(S.advanced.maxTotalSessions))}"/>
          <label>${esc(S.lang === 'zh' ? '会话等待最短（分钟）' : 'Session wait min (min)')}</label><input id="xac-session-wait-min" type="number" min="1" max="240" step="1" value="${esc(String(S.advanced.sessionWaitMin))}"/>
          <label>${esc(S.lang === 'zh' ? '会话等待最长（分钟）' : 'Session wait max (min)')}</label><input id="xac-session-wait-max" type="number" min="1" max="360" step="1" value="${esc(String(S.advanced.sessionWaitMax))}"/>
          <label>${esc(S.lang === 'zh' ? 'Bot 速度 (1-100)' : 'Bot speed (1-100)')}</label><input id="xac-bot-speed" type="number" min="1" max="100" step="1" value="${esc(String(S.advanced.botSpeed))}"/>
          <label>${esc(S.lang === 'zh' ? '随机跳过比例 (%)' : 'Random skips (%)')}</label><input id="xac-random-skips" type="number" min="0" max="95" step="1" value="${esc(String(S.advanced.randomSkips))}"/>
          <div class="switch"><span>${esc(S.lang === 'zh' ? '会话间刷新 Feed' : 'Refresh feed between sessions')}</span><input id="xac-use-refresh-feed" type="checkbox" ${S.advanced.useRefreshFeed ? 'checked' : ''}/></div>
          <div class="switch"><span>${esc(S.lang === 'zh' ? '随机鼠标轨迹' : 'Random mouse movement')}</span><input id="xac-random-mouse" type="checkbox" ${S.advanced.randomMouseMovement ? 'checked' : ''}/></div>

          <div class="subh"><span>${esc(t('sectionFollowRules'))}</span>${hintBtn('followConditions')}</div>
          <div class="meta">${esc(t('followRuleHint'))}</div>
          <label>${esc(t('followMinFollowers'))}</label><input id="xac-follow-min-followers" type="number" min="0" max="9999999" step="1" value="${esc(String(S.advanced.followMinFollowers))}"/>
          <label>${esc(t('followMaxFollowers'))}</label><input id="xac-follow-max-followers" type="number" min="0" max="9999999" step="1" value="${esc(String(S.advanced.followMaxFollowers))}"/>
          <label>${esc(t('followMinMutuals'))}</label><input id="xac-follow-min-mutuals" type="number" min="0" max="9999999" step="1" value="${esc(String(S.advanced.followMinMutuals))}"/>
          <div class="switch"><span>${esc(t('followRequireSignals'))}</span><input id="xac-follow-require-signals" type="checkbox" ${S.advanced.followRequireSignals ? 'checked' : ''}/></div>

          <div class="subh"><span>${esc(S.lang === 'zh' ? '名称替换系统' : 'Name Replacements')}</span></div>
          <label>${esc(S.lang === 'zh' ? '名称替换策略' : 'Replacement strategy')}</label>
          <select id="xac-name-replacement-mode">
            <option value="never" ${S.advanced.useNameReplacements === 'never' ? 'selected' : ''}>${esc(S.lang === 'zh' ? 'never（不替换）' : 'never')}</option>
            <option value="smart" ${S.advanced.useNameReplacements === 'smart' ? 'selected' : ''}>${esc(S.lang === 'zh' ? 'smart（智能）' : 'smart')}</option>
            <option value="always" ${S.advanced.useNameReplacements === 'always' ? 'selected' : ''}>${esc(S.lang === 'zh' ? 'always（总是替换）' : 'always')}</option>
          </select>
          <label>${esc(S.lang === 'zh' ? '替换词库（逗号分隔）' : 'Replacement dictionary (comma separated)')}</label>
          <input id="xac-name-replacements" type="text" value="${esc(usernameReplacementsText)}" />

          <div class="subh"><span>${esc(S.lang === 'zh' ? '关注后尾句替换' : 'Followed End Greetings')}</span></div>
          <div class="switch"><span>${esc(S.lang === 'zh' ? '关注成功后替换结尾' : 'Replace end greeting after follow')}</span><input id="xac-followed-end-enabled" type="checkbox" ${S.advanced.followedReplaceEndGreeting ? 'checked' : ''}/></div>
          <label>${esc(S.lang === 'zh' ? '关注后尾句模板（--- 分隔）' : 'Followed end templates (--- split)')}</label>
          <textarea id="xac-followed-end-pool">${esc(followedEndText)}</textarea>

          <div class="subh"><span>${esc(t('sectionRetweetRules'))}</span>${hintBtn('retweetConditions')}</div>
          <div class="meta">${esc(t('retweetRuleHint'))}</div>
          <label>${esc(t('retweetMinLikes'))}</label><input id="xac-retweet-min-likes" type="number" min="0" max="9999999" step="1" value="${esc(String(S.advanced.retweetMinLikes))}"/>
          <label>${esc(t('retweetMinRetweets'))}</label><input id="xac-retweet-min-retweets" type="number" min="0" max="9999999" step="1" value="${esc(String(S.advanced.retweetMinRetweets))}"/>
          <label>${esc(t('retweetMinReplies'))}</label><input id="xac-retweet-min-replies" type="number" min="0" max="9999999" step="1" value="${esc(String(S.advanced.retweetMinReplies))}"/>

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
          <label>${esc(S.lang === 'zh' ? '发布时间限制（分钟内）' : 'Post within minutes')}</label><input id="xac-post-within-minutes" type="number" min="5" max="10080" step="5" value="${esc(String(S.advanced.postWithinMinutes))}"/>
          <div class="switch"><span>${esc(S.lang === 'zh' ? '仅蓝标账户' : 'Only blue checks')}</span><input id="xac-only-blue-checks" type="checkbox" ${S.advanced.onlyBlueChecks ? 'checked' : ''}/></div>
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

          <div class="subh"><span>${esc(t('sectionSchedule'))}</span>${hintBtn('schedule')}</div>
          <div class="meta">${esc(t('scheduleDesc'))}</div>
          <div class="card schedule-runtime">
            <div class="hlabel">
              <span class="mini">${esc(t('scheduleRuntimeTitle'))}</span>
              <button id="xac-schedule-runtime-refresh">${esc(t('scheduleRuntimeRefresh'))}</button>
            </div>
            <div class="meta">${esc(`${t('scheduleRuntimeUpdated')}: ${formatScheduleRuntimeTimestamp(scheduleRuntime.updatedAt || scheduleRuntime.lastSyncAt)}`)}</div>
          </div>
          <div class="subh"><span>${esc(t('sectionScheduleRetry'))}</span>${hintBtn('scheduleRetry')}</div>
          <div class="switch"><span>${esc(t('scheduleRetryEnabled'))}</span><input id="xac-schedule-retry-enabled" type="checkbox" ${S.advanced.scheduleRetryEnabled ? 'checked' : ''}/></div>
          <label>${esc(t('scheduleRetryMaxAttempts'))}</label>
          <input id="xac-schedule-retry-max-attempts" type="number" min="0" max="5" step="1" value="${esc(String(S.advanced.scheduleRetryMaxAttempts || 0))}" />
          <label>${esc(t('scheduleRetryFirstDelayMin'))}</label>
          <input id="xac-schedule-retry-first-delay" type="number" min="1" max="120" step="1" value="${esc(String(S.advanced.scheduleRetryFirstDelayMin || 2))}" />
          <label>${esc(t('scheduleRetryNextDelayMin'))}</label>
          <input id="xac-schedule-retry-next-delay" type="number" min="1" max="240" step="1" value="${esc(String(S.advanced.scheduleRetryNextDelayMin || 5))}" />
          <button id="xac-schedule-add">${esc(t('scheduleAdd'))}</button>
          ${scheduledStarts.map((item, idx) => `
            <div class="card">
              <div class="hlabel">
                <span class="mini">${esc(`${t('sectionSchedule')} ${idx + 1}`)}</span>
                <button id="xac-schedule-remove-${idx}">${esc(t('scheduleDelete'))}</button>
              </div>
              <label>${esc(S.lang === 'zh' ? '开始时间' : 'Start time')}</label>
              <input id="xac-schedule-start-${idx}" type="time" value="${esc(item.startTime || item.time || '09:00')}" />
              <label>${esc(S.lang === 'zh' ? '结束时间' : 'End time')}</label>
              <input id="xac-schedule-end-${idx}" type="time" value="${esc(item.endTime || item.startTime || item.time || '09:00')}" />
              <label>${esc(S.lang === 'zh' ? '启动概率 (%)' : 'Probability (%)')}</label>
              <input id="xac-schedule-probability-${idx}" type="number" min="10" max="100" step="1" value="${esc(String(item.probability || 100))}" />
              <label>${esc(t('scheduleMode'))}</label>
              <select id="xac-schedule-mode-${idx}">
                ${scheduleModeOptions.map((opt) => `<option value="${esc(opt.id)}" ${item.mode === opt.id ? 'selected' : ''}>${esc(opt.label)}</option>`).join('')}
              </select>
              <label>${esc(t('scheduleDays'))}</label>
              <div class="chip-group days">
                ${dayOptions.map((dayItem) => `<button class="chip small ${Array.isArray(item.days) && item.days.includes(dayItem.day) ? 'active' : ''}" data-schedule-day-idx="${idx}" data-schedule-day="${dayItem.day}" ${item.mode !== 'custom' ? 'disabled' : ''}>${esc(dayItem.label)}</button>`).join('')}
              </div>
              <div class="meta">${esc(t('scheduleDaysHint'))}</div>
              <label>${esc(t('scheduleMax'))}</label>
              <input id="xac-schedule-max-${idx}" type="number" min="0" max="200" step="1" value="${esc(String(item.max || 0))}" />
              <div class="switch"><span>${esc(t('scheduleEnabled'))}</span><input id="xac-schedule-enabled-${idx}" type="checkbox" ${item.enabled ? 'checked' : ''}/></div>
              ${(() => {
                const runtime = normalizeScheduleRuntimeEntry(scheduleRuntime.entries[item.id], item.id)
                const lastAt = runtime.lastSuccessAt || runtime.lastFailureAt || runtime.lastTriggeredAt
                const retryAt = runtime.retryAt ? ` / ${formatScheduleRuntimeTimestamp(runtime.retryAt)}` : ''
                const resultText = runtime.lastResult === 'retry_scheduled' && retryAt
                  ? `${formatScheduleRuntimeResult(runtime)}${retryAt}`
                  : formatScheduleRuntimeResult(runtime)
                return `
                  <div class="schedule-runtime-line">${esc(`${t('scheduleRuntimeNext')}: ${formatScheduleRuntimeTimestamp(runtime.nextRunAt)}`)}</div>
                  <div class="schedule-runtime-line">${esc(`${t('scheduleRuntimeLast')}: ${formatScheduleRuntimeTimestamp(lastAt)}`)}</div>
                  <div class="schedule-runtime-line">${esc(`${t('scheduleRuntimeResult')}: ${resultText}`)}</div>
                  <div class="schedule-runtime-line">${esc(`${t('scheduleRuntimeAttempts')}: ${String(runtime.attemptCount || 0)}`)}</div>
                  <div class="schedule-runtime-line">${esc(`${t('scheduleRuntimeError')}: ${runtime.lastError || '--'}`)}</div>
                `
              })()}
            </div>
          `).join('')}

          <div class="subh"><span>${esc(S.lang === 'zh' ? '设置云备份' : 'Cloud Backup')}</span></div>
          <div class="r2">
            <button id="xac-cloud-save">${esc(S.lang === 'zh' ? '保存到云端' : 'Save settings')}</button>
            <button id="xac-cloud-load">${esc(S.lang === 'zh' ? '从云端读取' : 'Get saved settings')}</button>
          </div>
          <div class="meta">${esc(`Last synced: ${cloudSyncedLabel}`)}</div>
          <div class="meta">${esc(`Last pulled: ${cloudPulledLabel}`)}</div>
          <div class="meta">${esc(S.cloudSyncStatus?.lastError || '--')}</div>

          <div class="subh"><span>${esc(S.lang === 'zh' ? '轻量元字段' : 'Meta Fields')}</span></div>
          <label>${esc(S.lang === 'zh' ? '模板名称' : 'Template name')}</label><input id="xac-template-name" type="text" value="${esc(String(S.advanced.templateName || 'Default'))}" />
          <div class="switch"><span>${esc('AddGMButton')}</span><input id="xac-add-gm-button" type="checkbox" ${S.advanced.addGMButton ? 'checked' : ''}/></div>
          <div class="switch"><span>${esc('ShowSideBarControls')}</span><input id="xac-show-sidebar-controls" type="checkbox" ${S.advanced.showSideBarControls ? 'checked' : ''}/></div>
          <div class="switch"><span>${esc('ratedUs')}</span><input id="xac-rated-us" type="checkbox" ${S.advanced.ratedUs ? 'checked' : ''}/></div>
          ${S.advanced.showSideBarControls ? `
            <div class="r3">
              <button id="xac-tool-activity">Activity</button>
              <button id="xac-tool-followus">Follow Us</button>
              <button id="xac-tool-rateus">Rate Us</button>
            </div>
          ` : ''}

          <div class="subh"><span>${esc(t('sectionReplyRules'))}</span>${hintBtn('replyRules')}</div>
          <div class="meta">${esc(t('replyRulesDesc'))}</div>
          <div class="r2">
            <button id="xac-rule-add">${esc(t('replyRuleAdd'))}</button>
            <button id="xac-rule-reset">${esc(t('replyRuleReset'))}</button>
          </div>
          <div class="r2">
            <button id="xac-rule-import">${esc(t('replyRuleImport'))}</button>
            <button id="xac-rule-export">${esc(t('replyRuleExport'))}</button>
          </div>
          <div class="r2">
            <button id="xac-rule-import-file">${esc(t('replyRuleImportFile'))}</button>
            <button id="xac-rule-export-file">${esc(t('replyRuleExportFile'))}</button>
          </div>
          <label>${esc(t('replyRuleJson'))}</label>
          <textarea id="xac-rule-json">${esc(S.replyRuleBulkText || '')}</textarea>
          <input id="xac-rule-file-input" type="file" accept=".json,application/json" style="display:none"/>
          <div class="meta">${esc(t('replyRuleJsonHint'))}</div>
          ${replyRules.map((rule, idx) => `
            <div class="card">
              <div class="hlabel">
                <span class="mini">${esc(`${t('replyRuleLabel')} ${idx + 1}`)}</span>
                <button id="xac-rule-remove-${idx}" ${replyRules.length <= 1 ? 'disabled' : ''}>${esc(t('replyRuleDelete'))}</button>
              </div>
              <label>${esc(t('replyRuleName'))}</label>
              <input id="xac-rule-name-${idx}" type="text" value="${esc(rule.name || '')}" />
              <label>${esc(t('replyRuleKeywords'))}</label>
              <input id="xac-rule-keywords-${idx}" type="text" placeholder="${esc(t('replyRuleKeywordsPlaceholder'))}" value="${esc(rule.keywords || '')}" />
              <label>${esc(t('replyRuleType'))}</label>
              <select id="xac-rule-type-${idx}">
                <option value="simple" ${rule.type === 'simple' ? 'selected' : ''}>${esc(t('replyRuleTypeSimple'))}</option>
                <option value="combo" ${rule.type === 'combo' ? 'selected' : ''}>${esc(t('replyRuleTypeCombo'))}</option>
              </select>
              <div class="switch"><span>${esc(t('replyRuleEnabled'))}</span><input id="xac-rule-enabled-${idx}" type="checkbox" ${rule.enabled ? 'checked' : ''}/></div>
              <div class="meta">${esc(t('replyRulePoolHint'))}</div>
              <label>${esc(t('replyRuleStartPool'))}</label>
              <textarea id="xac-rule-start-pool-${idx}" ${rule.type === 'simple' ? 'disabled' : ''}>${esc(rule.startPool || '')}</textarea>
              <label>${esc(t('replyRuleEndPool'))}</label>
              <textarea id="xac-rule-end-pool-${idx}" ${rule.type === 'simple' ? 'disabled' : ''}>${esc(rule.endPool || '')}</textarea>
              <label>${esc(S.lang === 'zh' ? '图片频率 (%)' : 'Image frequency (%)')}</label>
              <input id="xac-rule-image-frequency-${idx}" type="number" min="0" max="100" step="1" value="${esc(String(rule.imageFrequency || 0))}" />
              <label>${esc(S.lang === 'zh' ? '图片列表（URL 或 data:image）' : 'Images (URL or data:image)')}</label>
              <textarea id="xac-rule-images-${idx}">${esc((rule.images || []).join('\n'))}</textarea>
              <label>${esc(S.lang === 'zh' ? '新增图片 URL / Giphy URL' : 'Add image URL / Giphy URL')}</label>
              <div class="r2">
                <input id="xac-rule-image-input-${idx}" type="text" value="" placeholder="${esc(S.lang === 'zh' ? '粘贴图片地址' : 'Paste image URL')}" />
                <button id="xac-rule-image-add-${idx}">${esc(S.lang === 'zh' ? '添加' : 'Add')}</button>
              </div>
              <div class="r2">
                <button id="xac-rule-image-upload-${idx}">${esc(S.lang === 'zh' ? '本地上传' : 'Upload local')}</button>
                <button id="xac-rule-image-giphy-${idx}">Giphy</button>
              </div>
              <input id="xac-rule-image-file-${idx}" type="file" accept="image/*" style="display:none"/>
            </div>
          `).join('')}

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
    const syncSparkDraftField = (key, coerce = (value) => value) => {
      const node = document.getElementById(key)
      if (!node) return
      const handler = (event) => {
        const value = event?.target?.value
        if (key === 'xac-spark-url') S.sparkDraft.url = coerce(value)
        if (key === 'xac-spark-app-id') S.sparkDraft.app_id = coerce(value)
        if (key === 'xac-spark-api-key') S.sparkDraft.api_key = coerce(value)
        if (key === 'xac-spark-api-secret') S.sparkDraft.api_secret = coerce(value)
        if (key === 'xac-spark-domain') S.sparkDraft.domain = coerce(value)
        if (key === 'xac-spark-temp') S.sparkDraft.temperature = coerce(value)
        if (key === 'xac-spark-max-tokens') S.sparkDraft.max_tokens = coerce(value)
      }
      node.addEventListener('input', handler)
      node.addEventListener('change', handler)
    }
    syncSparkDraftField('xac-spark-url', (value) => String(value || ''))
    syncSparkDraftField('xac-spark-app-id', (value) => String(value || ''))
    syncSparkDraftField('xac-spark-api-key', (value) => String(value || ''))
    syncSparkDraftField('xac-spark-api-secret', (value) => String(value || ''))
    syncSparkDraftField('xac-spark-domain', (value) => String(value || ''))
    syncSparkDraftField('xac-spark-temp', (value) => Number(value || 0.3))
    syncSparkDraftField('xac-spark-max-tokens', (value) => Number(value || 512))
    document.getElementById('xac-save-spark')?.addEventListener('click', async () => {
      await runPendingAction('save-spark', t('saving'), async () => {
        await saveSparkSettingsFromDraft()
        toast(S.lang === 'zh' ? 'AI 配置已保存' : 'AI settings saved', 'ok')
        render()
      }, false)
    })
    document.getElementById('xac-sync-spark')?.addEventListener('click', async () => {
      await runPendingAction('sync-spark', t('working'), async () => {
        await syncSparkSettings()
        toast(t('sparkSynced'), 'ok')
        render()
      }, false)
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
    document.getElementById('xac-session-min')?.addEventListener('change', async (e) => {
      S.advanced.maxInteractionsPerSessionMin = clampNum(e.target.value, 1, 500, DEFAULT_ADVANCED.maxInteractionsPerSessionMin)
      S.advanced.maxInteractionsPerSessionMax = Math.max(S.advanced.maxInteractionsPerSessionMax || 0, S.advanced.maxInteractionsPerSessionMin)
      e.target.value = String(S.advanced.maxInteractionsPerSessionMin)
      const maxInput = document.getElementById('xac-session-max')
      if (maxInput) maxInput.value = String(S.advanced.maxInteractionsPerSessionMax)
      await saveAdvanced(true)
    })
    document.getElementById('xac-session-max')?.addEventListener('change', async (e) => {
      S.advanced.maxInteractionsPerSessionMax = clampNum(e.target.value, 1, 600, DEFAULT_ADVANCED.maxInteractionsPerSessionMax)
      S.advanced.maxInteractionsPerSessionMin = Math.min(S.advanced.maxInteractionsPerSessionMin || 1, S.advanced.maxInteractionsPerSessionMax)
      e.target.value = String(S.advanced.maxInteractionsPerSessionMax)
      const minInput = document.getElementById('xac-session-min')
      if (minInput) minInput.value = String(S.advanced.maxInteractionsPerSessionMin)
      await saveAdvanced(true)
    })
    document.getElementById('xac-session-total')?.addEventListener('change', async (e) => {
      S.advanced.maxTotalSessions = clampNum(e.target.value, 1, 30, DEFAULT_ADVANCED.maxTotalSessions)
      e.target.value = String(S.advanced.maxTotalSessions)
      await saveAdvanced(true)
    })
    document.getElementById('xac-session-wait-min')?.addEventListener('change', async (e) => {
      S.advanced.sessionWaitMin = clampNum(e.target.value, 1, 240, DEFAULT_ADVANCED.sessionWaitMin)
      S.advanced.sessionWaitMax = Math.max(S.advanced.sessionWaitMax || 1, S.advanced.sessionWaitMin)
      e.target.value = String(S.advanced.sessionWaitMin)
      const maxInput = document.getElementById('xac-session-wait-max')
      if (maxInput) maxInput.value = String(S.advanced.sessionWaitMax)
      await saveAdvanced(true)
    })
    document.getElementById('xac-session-wait-max')?.addEventListener('change', async (e) => {
      S.advanced.sessionWaitMax = clampNum(e.target.value, 1, 360, DEFAULT_ADVANCED.sessionWaitMax)
      S.advanced.sessionWaitMin = Math.min(S.advanced.sessionWaitMin || 1, S.advanced.sessionWaitMax)
      e.target.value = String(S.advanced.sessionWaitMax)
      const minInput = document.getElementById('xac-session-wait-min')
      if (minInput) minInput.value = String(S.advanced.sessionWaitMin)
      await saveAdvanced(true)
    })
    document.getElementById('xac-bot-speed')?.addEventListener('change', async (e) => {
      S.advanced.botSpeed = clampNum(e.target.value, 1, 100, DEFAULT_ADVANCED.botSpeed)
      e.target.value = String(S.advanced.botSpeed)
      await saveAdvanced(true)
    })
    document.getElementById('xac-random-skips')?.addEventListener('change', async (e) => {
      S.advanced.randomSkips = clampNum(e.target.value, 0, 95, DEFAULT_ADVANCED.randomSkips)
      e.target.value = String(S.advanced.randomSkips)
      await saveAdvanced(true)
    })
    document.getElementById('xac-use-refresh-feed')?.addEventListener('change', async (e) => { S.advanced.useRefreshFeed = !!e.target.checked; await saveAdvanced(true) })
    document.getElementById('xac-random-mouse')?.addEventListener('change', async (e) => { S.advanced.randomMouseMovement = !!e.target.checked; await saveAdvanced(true) })
    document.getElementById('xac-follow-min-followers')?.addEventListener('change', async (e) => {
      S.advanced.followMinFollowers = clampNum(e.target.value, 0, 9999999, DEFAULT_ADVANCED.followMinFollowers)
      S.advanced.followMaxFollowers = Math.max(
        clampNum(S.advanced.followMaxFollowers, 0, 9999999, DEFAULT_ADVANCED.followMaxFollowers),
        S.advanced.followMinFollowers
      )
      e.target.value = String(S.advanced.followMinFollowers)
      const maxInput = document.getElementById('xac-follow-max-followers')
      if (maxInput) maxInput.value = String(S.advanced.followMaxFollowers)
      await saveAdvanced(true)
    })
    document.getElementById('xac-follow-max-followers')?.addEventListener('change', async (e) => {
      S.advanced.followMaxFollowers = clampNum(e.target.value, 0, 9999999, DEFAULT_ADVANCED.followMaxFollowers)
      S.advanced.followMinFollowers = Math.min(
        clampNum(S.advanced.followMinFollowers, 0, 9999999, DEFAULT_ADVANCED.followMinFollowers),
        S.advanced.followMaxFollowers
      )
      e.target.value = String(S.advanced.followMaxFollowers)
      const minInput = document.getElementById('xac-follow-min-followers')
      if (minInput) minInput.value = String(S.advanced.followMinFollowers)
      await saveAdvanced(true)
    })
    document.getElementById('xac-follow-min-mutuals')?.addEventListener('change', async (e) => {
      S.advanced.followMinMutuals = clampNum(e.target.value, 0, 9999999, DEFAULT_ADVANCED.followMinMutuals)
      e.target.value = String(S.advanced.followMinMutuals)
      await saveAdvanced(true)
    })
    document.getElementById('xac-follow-require-signals')?.addEventListener('change', async (e) => {
      S.advanced.followRequireSignals = !!e.target.checked
      await saveAdvanced(true)
    })
    document.getElementById('xac-name-replacement-mode')?.addEventListener('change', async (e) => {
      S.advanced.useNameReplacements = normalizeNameReplacementMode(e.target.value)
      await saveAdvanced(true)
    })
    document.getElementById('xac-name-replacements')?.addEventListener('input', (e) => {
      S.advanced.usernameReplacements = normalizeUsernameReplacements(e.target.value || '')
      debounceRun('name-replacements', () => saveAdvanced(true))
    })
    document.getElementById('xac-followed-end-enabled')?.addEventListener('change', async (e) => {
      S.advanced.followedReplaceEndGreeting = !!e.target.checked
      await saveAdvanced(true)
    })
    document.getElementById('xac-followed-end-pool')?.addEventListener('input', (e) => {
      S.advanced.endGreetingsFollowed = parseTemplatePool(e.target.value || '')
      debounceRun('followed-end-pool', () => saveAdvanced(true))
    })
    document.getElementById('xac-reply-like-frequency')?.addEventListener('change', async (e) => {
      S.advanced.replyLikeFrequency = clampNum(e.target.value, 0, 100, DEFAULT_ADVANCED.replyLikeFrequency)
      e.target.value = String(S.advanced.replyLikeFrequency)
      await saveAdvanced(true)
    })
    document.getElementById('xac-extra-likes-frequency')?.addEventListener('change', async (e) => {
      S.advanced.extraLikesFrequency = clampNum(e.target.value, 0, 100, DEFAULT_ADVANCED.extraLikesFrequency)
      e.target.value = String(S.advanced.extraLikesFrequency)
      await saveAdvanced(true)
    })
    document.getElementById('xac-retweet-min-likes')?.addEventListener('change', async (e) => {
      S.advanced.retweetMinLikes = clampNum(e.target.value, 0, 9999999, DEFAULT_ADVANCED.retweetMinLikes)
      e.target.value = String(S.advanced.retweetMinLikes)
      await saveAdvanced(true)
    })
    document.getElementById('xac-retweet-min-retweets')?.addEventListener('change', async (e) => {
      S.advanced.retweetMinRetweets = clampNum(e.target.value, 0, 9999999, DEFAULT_ADVANCED.retweetMinRetweets)
      e.target.value = String(S.advanced.retweetMinRetweets)
      await saveAdvanced(true)
    })
    document.getElementById('xac-retweet-min-replies')?.addEventListener('change', async (e) => {
      S.advanced.retweetMinReplies = clampNum(e.target.value, 0, 9999999, DEFAULT_ADVANCED.retweetMinReplies)
      e.target.value = String(S.advanced.retweetMinReplies)
      await saveAdvanced(true)
    })
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
    document.getElementById('xac-post-within-minutes')?.addEventListener('change', async (e) => {
      S.advanced.postWithinMinutes = clampNum(e.target.value, 5, 10080, DEFAULT_ADVANCED.postWithinMinutes)
      e.target.value = String(S.advanced.postWithinMinutes)
      await saveAdvanced(true)
    })
    document.getElementById('xac-only-blue-checks')?.addEventListener('change', async (e) => { S.advanced.onlyBlueChecks = !!e.target.checked; await saveAdvanced(true) })
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
    document.getElementById('xac-schedule-runtime-refresh')?.addEventListener('click', async () => {
      await refreshScheduleRuntimeState(true).catch(() => {})
    })
    document.getElementById('xac-schedule-retry-enabled')?.addEventListener('change', async (e) => {
      S.advanced.scheduleRetryEnabled = !!e.target.checked
      await saveAdvanced(true)
    })
    document.getElementById('xac-schedule-retry-max-attempts')?.addEventListener('change', async (e) => {
      S.advanced.scheduleRetryMaxAttempts = clampNum(e.target.value, 0, 5, DEFAULT_ADVANCED.scheduleRetryMaxAttempts)
      e.target.value = String(S.advanced.scheduleRetryMaxAttempts)
      await saveAdvanced(true)
      await saveScheduledStarts(true)
    })
    document.getElementById('xac-schedule-retry-first-delay')?.addEventListener('change', async (e) => {
      S.advanced.scheduleRetryFirstDelayMin = clampNum(e.target.value, 1, 120, DEFAULT_ADVANCED.scheduleRetryFirstDelayMin)
      e.target.value = String(S.advanced.scheduleRetryFirstDelayMin)
      await saveAdvanced(true)
    })
    document.getElementById('xac-schedule-retry-next-delay')?.addEventListener('change', async (e) => {
      S.advanced.scheduleRetryNextDelayMin = clampNum(e.target.value, 1, 240, DEFAULT_ADVANCED.scheduleRetryNextDelayMin)
      e.target.value = String(S.advanced.scheduleRetryNextDelayMin)
      await saveAdvanced(true)
    })
    document.getElementById('xac-schedule-add')?.addEventListener('click', async () => {
      const next = {
        id: `schedule_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        time: '09:00',
        startTime: '09:00',
        endTime: '09:00',
        mode: 'daily',
        days: scheduleDaysForMode('daily'),
        max: 0,
        probability: 100,
        enabled: true
      }
      S.scheduledStarts = [...normalizeScheduledStarts(S.scheduledStarts), next]
      await saveScheduledStarts(true)
      render()
    })
    scheduledStarts.forEach((_item, idx) => {
      document.getElementById(`xac-schedule-start-${idx}`)?.addEventListener('change', async (e) => {
        S.scheduledStarts[idx].startTime = normalizeScheduleTime(e.target.value, '09:00')
        S.scheduledStarts[idx].time = S.scheduledStarts[idx].startTime
        e.target.value = S.scheduledStarts[idx].startTime
        await saveScheduledStarts(true)
      })
      document.getElementById(`xac-schedule-end-${idx}`)?.addEventListener('change', async (e) => {
        S.scheduledStarts[idx].endTime = normalizeScheduleTime(e.target.value, S.scheduledStarts[idx].startTime || '09:00')
        e.target.value = S.scheduledStarts[idx].endTime
        await saveScheduledStarts(true)
      })
      document.getElementById(`xac-schedule-probability-${idx}`)?.addEventListener('change', async (e) => {
        S.scheduledStarts[idx].probability = clampNum(e.target.value, 10, 100, 100)
        e.target.value = String(S.scheduledStarts[idx].probability)
        await saveScheduledStarts(true)
      })
      document.getElementById(`xac-schedule-mode-${idx}`)?.addEventListener('change', async (e) => {
        S.scheduledStarts[idx].mode = normalizeScheduleMode(e.target.value)
        if (S.scheduledStarts[idx].mode !== 'custom') {
          S.scheduledStarts[idx].days = scheduleDaysForMode(S.scheduledStarts[idx].mode)
        } else {
          S.scheduledStarts[idx].days = normalizeScheduleDays(S.scheduledStarts[idx].days, 'custom')
        }
        await saveScheduledStarts(true)
        render()
      })
      document.getElementById(`xac-schedule-max-${idx}`)?.addEventListener('change', async (e) => {
        S.scheduledStarts[idx].max = clampNum(e.target.value, 0, 200, 0)
        e.target.value = String(S.scheduledStarts[idx].max)
        await saveScheduledStarts(true)
      })
      document.getElementById(`xac-schedule-enabled-${idx}`)?.addEventListener('change', async (e) => {
        S.scheduledStarts[idx].enabled = !!e.target.checked
        await saveScheduledStarts(true)
      })
      document.getElementById(`xac-schedule-remove-${idx}`)?.addEventListener('click', async () => {
        S.scheduledStarts = (S.scheduledStarts || []).filter((_, scheduleIndex) => scheduleIndex !== idx)
        await saveScheduledStarts(true)
        render()
      })
    })
    document.querySelectorAll('#xac-root [data-schedule-day-idx]').forEach((el) => {
      el.addEventListener('click', async () => {
        const scheduleIdx = clampNum(el.getAttribute('data-schedule-day-idx'), 0, 999, 0)
        const day = clampNum(el.getAttribute('data-schedule-day'), 0, 6, 0)
        const item = S.scheduledStarts[scheduleIdx]
        if (!item || item.mode !== 'custom') return
        const current = normalizeScheduleDays(item.days, 'custom')
        const exists = current.includes(day)
        const nextDays = exists ? current.filter((d) => d !== day) : [...current, day]
        item.days = normalizeScheduleDays(nextDays, 'custom')
        await saveScheduledStarts(true)
        render()
      })
    })
    document.getElementById('xac-cloud-save')?.addEventListener('click', async () => {
      await runPendingAction('cloud-save', S.lang === 'zh' ? '正在保存云备份...' : 'Saving cloud backup...', async () => {
        await saveSettingsToCloud()
        toast(S.lang === 'zh' ? '设置已同步到云端。' : 'Settings saved to cloud.', 'ok')
        render()
      }, false)
    })
    document.getElementById('xac-cloud-load')?.addEventListener('click', async () => {
      try {
        await runPendingAction('cloud-load', S.lang === 'zh' ? '正在加载云备份...' : 'Loading cloud backup...', async () => {
          await loadSettingsFromCloud()
          toast(S.lang === 'zh' ? '已从云端恢复设置。' : 'Settings restored from cloud.', 'ok')
          render()
        }, false)
      } catch (error) {
        S.cloudSyncStatus = normalizeCloudSyncStatus({ ...(S.cloudSyncStatus || {}), lastError: String(error?.message || error || '') })
        set({ [K.cloudSyncStatus]: S.cloudSyncStatus }).catch(() => {})
        toast(String(error?.message || error || ''), 'warn')
      }
    })
    document.getElementById('xac-template-name')?.addEventListener('input', (e) => {
      S.advanced.templateName = String(e.target.value || '')
      debounceRun('template-name', () => saveAdvanced(true))
    })
    document.getElementById('xac-add-gm-button')?.addEventListener('change', async (e) => { S.advanced.addGMButton = !!e.target.checked; await saveAdvanced(true) })
    document.getElementById('xac-show-sidebar-controls')?.addEventListener('change', async (e) => { S.advanced.showSideBarControls = !!e.target.checked; await saveAdvanced(true); render() })
    document.getElementById('xac-rated-us')?.addEventListener('change', async (e) => { S.advanced.ratedUs = !!e.target.checked; await saveAdvanced(true) })
    document.getElementById('xac-tool-activity')?.addEventListener('click', () => window.open(chrome.runtime.getURL('tabs/activity.html'), '_blank'))
    document.getElementById('xac-tool-followus')?.addEventListener('click', () => window.open('https://x.com', '_blank'))
    document.getElementById('xac-tool-rateus')?.addEventListener('click', async () => {
      S.advanced.ratedUs = true
      await saveAdvanced(true)
      window.open('https://chromewebstore.google.com/', '_blank')
      render()
    })
    document.getElementById('xac-rule-add')?.addEventListener('click', async () => {
      S.replyRules = normalizeReplyRules(S.replyRules)
      const next = {
        id: `reply_rule_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        name: `${t('replyRuleLabel')} ${S.replyRules.length + 1}`,
        keywords: '',
        type: 'combo',
        start: '',
        end: '',
        startPool: '',
        endPool: '',
        images: [],
        imageFrequency: 0,
        enabled: true,
        preset: false
      }
      S.replyRules = [...S.replyRules, next]
      await saveReplyRules(true)
      render()
    })
    document.getElementById('xac-rule-reset')?.addEventListener('click', async () => {
      S.replyRules = cloneDefaultReplyRules()
      await saveReplyRules(false)
      render()
    })
    document.getElementById('xac-rule-json')?.addEventListener('input', (e) => {
      S.replyRuleBulkText = String(e.target.value || '')
    })
    const serializeReplyRules = () => normalizeReplyRules(S.replyRules).map((rule) => ({
      id: rule.id,
      name: rule.name,
      keywords: rule.keywords,
      type: rule.type,
      start: rule.start,
      end: rule.end,
      startPool: rule.startPool,
      endPool: rule.endPool,
      images: normalizeImageList(rule.images || []),
      imageFrequency: clampNum(rule.imageFrequency, 0, 100, 0),
      enabled: !!rule.enabled
    }))
    const importReplyRulesText = async (rawText) => {
      const text = String(rawText || '').trim()
      if (!text) throw new Error('empty')
      const parsed = JSON.parse(text)
      const source = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.rules) ? parsed.rules : null)
      if (!source) throw new Error('invalid')
      S.replyRules = normalizeReplyRules(source)
      S.replyRuleBulkText = JSON.stringify(S.replyRules, null, 2)
      await saveReplyRules(true)
      return true
    }
    document.getElementById('xac-rule-export')?.addEventListener('click', async () => {
      const payload = serializeReplyRules()
      S.replyRuleBulkText = JSON.stringify(payload, null, 2)
      const textArea = document.getElementById('xac-rule-json')
      if (textArea) textArea.value = S.replyRuleBulkText
      try {
        await navigator.clipboard.writeText(S.replyRuleBulkText)
        toast(t('replyRuleExportCopied'), 'ok')
      } catch {
        // ignore clipboard failures in restricted contexts
      }
    })
    document.getElementById('xac-rule-import')?.addEventListener('click', async () => {
      const text = String(document.getElementById('xac-rule-json')?.value || S.replyRuleBulkText || '').trim()
      try {
        await importReplyRulesText(text)
        toast(t('replyRuleImportSuccess'), 'ok')
        render()
      } catch {
        toast(t('replyRuleImportFail'), 'warn')
      }
    })
    document.getElementById('xac-rule-import-file')?.addEventListener('click', () => {
      const input = document.getElementById('xac-rule-file-input')
      if (input instanceof HTMLInputElement) input.click()
    })
    document.getElementById('xac-rule-file-input')?.addEventListener('change', async (e) => {
      const file = e?.target?.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        await importReplyRulesText(text)
        toast(t('replyRuleImportSuccess'), 'ok')
        render()
      } catch {
        toast(t('replyRuleImportFail'), 'warn')
      } finally {
        if (e?.target) e.target.value = ''
      }
    })
    document.getElementById('xac-rule-export-file')?.addEventListener('click', () => {
      const payload = serializeReplyRules()
      const jsonText = JSON.stringify(payload, null, 2)
      S.replyRuleBulkText = jsonText
      const textArea = document.getElementById('xac-rule-json')
      if (textArea) textArea.value = jsonText
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      downloadTextFile(`xac-reply-rules-${stamp}.json`, jsonText)
    })
    replyRules.forEach((_rule, idx) => {
      document.getElementById(`xac-rule-name-${idx}`)?.addEventListener('input', (e) => {
        S.replyRules[idx].name = String(e.target.value || '')
        debounceRun(`reply-rule-name-${idx}`, () => saveReplyRules(true))
      })
      document.getElementById(`xac-rule-keywords-${idx}`)?.addEventListener('input', (e) => {
        S.replyRules[idx].keywords = normalizeSearchTermInput(e.target.value || '')
        debounceRun(`reply-rule-keywords-${idx}`, () => saveReplyRules(true))
      })
      document.getElementById(`xac-rule-type-${idx}`)?.addEventListener('change', async (e) => {
        S.replyRules[idx].type = normalizeReplyRuleType(e.target.value)
        await saveReplyRules(true)
        render()
      })
      document.getElementById(`xac-rule-enabled-${idx}`)?.addEventListener('change', async (e) => {
        S.replyRules[idx].enabled = !!e.target.checked
        await saveReplyRules(true)
      })
      document.getElementById(`xac-rule-start-pool-${idx}`)?.addEventListener('input', (e) => {
        S.replyRules[idx].startPool = normalizeTemplatePoolText(e.target.value || '')
        S.replyRules[idx].start = pickTemplateFromPool(S.replyRules[idx].startPool) || S.replyRules[idx].start || ''
        debounceRun(`reply-rule-start-pool-${idx}`, () => saveReplyRules(true))
      })
      document.getElementById(`xac-rule-end-pool-${idx}`)?.addEventListener('input', (e) => {
        S.replyRules[idx].endPool = normalizeTemplatePoolText(e.target.value || '')
        S.replyRules[idx].end = pickTemplateFromPool(S.replyRules[idx].endPool) || S.replyRules[idx].end || ''
        debounceRun(`reply-rule-end-pool-${idx}`, () => saveReplyRules(true))
      })
      document.getElementById(`xac-rule-image-frequency-${idx}`)?.addEventListener('change', async (e) => {
        S.replyRules[idx].imageFrequency = clampNum(e.target.value, 0, 100, 0)
        e.target.value = String(S.replyRules[idx].imageFrequency)
        await saveReplyRules(true)
      })
      document.getElementById(`xac-rule-images-${idx}`)?.addEventListener('input', (e) => {
        const list = String(e.target.value || '').split(/\n+/g).map((line) => line.trim()).filter(Boolean)
        S.replyRules[idx].images = normalizeImageList(list)
        debounceRun(`reply-rule-images-${idx}`, () => saveReplyRules(true))
      })
      document.getElementById(`xac-rule-image-add-${idx}`)?.addEventListener('click', async () => {
        const input = document.getElementById(`xac-rule-image-input-${idx}`)
        if (!(input instanceof HTMLInputElement)) return
        const value = String(input.value || '').trim()
        if (!value) return
        S.replyRules[idx].images = normalizeImageList([...(S.replyRules[idx].images || []), value])
        input.value = ''
        await saveReplyRules(true)
        render()
      })
      document.getElementById(`xac-rule-image-upload-${idx}`)?.addEventListener('click', () => {
        const fileInput = document.getElementById(`xac-rule-image-file-${idx}`)
        if (fileInput instanceof HTMLInputElement) fileInput.click()
      })
      document.getElementById(`xac-rule-image-file-${idx}`)?.addEventListener('change', async (e) => {
        const file = e?.target?.files?.[0]
        if (!file) return
        try {
          const reader = new FileReader()
          const dataUrl = await new Promise((resolve, reject) => {
            reader.onerror = () => reject(new Error('read file failed'))
            reader.onload = () => resolve(String(reader.result || ''))
            reader.readAsDataURL(file)
          })
          S.replyRules[idx].images = normalizeImageList([...(S.replyRules[idx].images || []), dataUrl])
          await saveReplyRules(true)
          render()
        } catch {
          toast(S.lang === 'zh' ? '本地图片读取失败。' : 'Failed to read local image.', 'warn')
        } finally {
          if (e?.target) e.target.value = ''
        }
      })
      document.getElementById(`xac-rule-image-giphy-${idx}`)?.addEventListener('click', () => {
        window.open('https://giphy.com/search/reaction', '_blank')
      })
      document.getElementById(`xac-rule-remove-${idx}`)?.addEventListener('click', async () => {
        if ((S.replyRules || []).length <= 1) return
        S.replyRules = (S.replyRules || []).filter((_, ruleIndex) => ruleIndex !== idx)
        await saveReplyRules(true)
        render()
      })
    })
    document.getElementById('xac-open-advanced-panel')?.addEventListener('click', async () => {
      if (VIEW.isExtensionPage) {
        await runPendingAction('open-advanced', t('working'), async () => {
          const query = syncSearchQueryFromControls(true)
          await saveAdvanced(true)
          const result = await send('xac:open-advanced-panel', { query })
          if (!result.ok) throw new Error(s(result.error, t('unknownError')))
          toast(S.lang === 'zh' ? '已打开 X 侧栏' : 'X sidebar opened', 'ok')
        }, false)
        return
      }
      openPanelAndFocusAdvanced()
    })
    document.getElementById('xac-open-options')?.addEventListener('click', openDetailedOptionsPage)
    document.getElementById('xac-open-search')?.addEventListener('click', async () => {
      const query = syncSearchQueryFromControls(true)
      await saveAdvanced(true)
      if (VIEW.isExtensionPage) {
        const result = await send('xac:open-x-search', { query })
        if (!result.ok) {
          toast(`${t('fail')}: ${s(result.error, t('unknownError'))}`, 'warn')
          return
        }
        toast(S.lang === 'zh' ? '已打开搜索页' : 'Search page opened', 'ok')
        return
      }
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
      const m = Math.max(0, Math.round(n(document.getElementById('xac-max')?.value, 0)))
      if (VIEW.isExtensionPage) {
        await runPendingAction(S.auto.active ? 'stop-remote' : 'start-remote', t('working'), async () => {
          if (S.auto.active) await requestRemoteStopAuto()
          else await requestRemoteStartAuto(m)
        }, false)
        return
      }
      if (S.auto.active) {
        stopAuto()
        return
      }
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
    const root = document.createElement('div'); root.id = 'xac-root'; root.className = S.open ? '' : 'collapsed'; (document.body || document.documentElement).appendChild(root)
    render()
  }

  function observe() {
    new MutationObserver(() => schedule()).observe(document.documentElement, { childList: true, subtree: true })
    setInterval(() => schedule(), 1800)
  }

  async function init() {
    if (VIEW.isExtensionPage) {
      S.open = true
    }
    styles(); await loadState(); await syncPresetQuickSettingsByLanguage().catch(() => {}); mount(); setStatus(t('idle'))
    if (VIEW.isContentPage) {
      scanNow()
      observe()
    } else {
      await refreshRemoteRuntimeState().catch(() => {})
      setInterval(() => { refreshRemoteRuntimeState().catch(() => {}) }, 1800)
    }
    const runtimeOnMessage = globalThis.chrome?.runtime?.onMessage
    if (runtimeOnMessage && typeof runtimeOnMessage.addListener === 'function') {
      runtimeOnMessage.addListener((message, _sender, sendResponse) => {
        if (!message || !message.xacAction) return
        if (message.xacAction === 'xac:content-open-advanced') {
          openPanelAndFocusAdvanced()
          sendResponse({ opened: true, state: runtimeStateSnapshot() })
          return
        }
        if (message.xacAction === 'xac:content-open-search') {
          window.location.href = buildSearchUrl(message.query || S.advanced?.searchQuery || '')
          sendResponse({ opened: true })
          return
        }
        if (message.xacAction === 'xac:content-get-runtime-state') {
          sendResponse({ state: runtimeStateSnapshot() })
          return
        }
        if (message.xacAction === 'xac:content-start-auto') {
          if (!S.auto.active) {
            const maxValue = Math.max(0, Math.round(n(message.max, 0)))
            startAuto(maxValue).catch((error) => {
              console.error('[XAC] remote start failed', error)
            })
          }
          sendResponse({ started: true, state: runtimeStateSnapshot() })
          return
        }
        if (message.xacAction === 'xac:content-stop-auto') {
          stopAuto()
          sendResponse({ stopped: true, state: runtimeStateSnapshot() })
          return
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
        if (ch[K.googleSession]) {
          S.googleSession = ch[K.googleSession].newValue || null
          S.signedIn = !!(S.googleSession && S.googleSession.accessToken)
          render()
        }
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
        if (ch[K.replyRules]) {
          S.replyRules = normalizeReplyRules(ch[K.replyRules].newValue)
          const ae = document.activeElement
          const editingInPanel =
            ae instanceof HTMLElement &&
            !!ae.closest('#xac-root') &&
            (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.getAttribute('contenteditable') === 'true')
          if (!editingInPanel) render()
        }
        if (ch[K.scheduledStarts]) {
          S.scheduledStarts = normalizeScheduledStarts(ch[K.scheduledStarts].newValue)
          const ae = document.activeElement
          const editingInPanel =
            ae instanceof HTMLElement &&
            !!ae.closest('#xac-root') &&
            (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.getAttribute('contenteditable') === 'true')
          if (!editingInPanel) render()
        }
        if (ch[K.scheduleRuntime]) {
          S.scheduleRuntime = normalizeScheduleRuntimeState(ch[K.scheduleRuntime].newValue)
          const ae = document.activeElement
          const editingInPanel =
            ae instanceof HTMLElement &&
            !!ae.closest('#xac-root') &&
            (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.getAttribute('contenteditable') === 'true')
          if (!editingInPanel) render()
        }
        if (ch[K.cloudSyncStatus]) {
          S.cloudSyncStatus = normalizeCloudSyncStatus(ch[K.cloudSyncStatus].newValue)
          render()
        }
      })
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true })
  else init()
})()


