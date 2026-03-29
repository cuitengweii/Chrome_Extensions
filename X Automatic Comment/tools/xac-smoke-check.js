#!/usr/bin/env node
"use strict"

const fs = require("fs")
const path = require("path")
const cp = require("child_process")

const ROOT = path.resolve(__dirname, "..")
const FILES = {
  ui: path.join(ROOT, "xac-ui.js"),
  content: path.join(ROOT, "xac-content.js"),
  background: path.join(ROOT, "xac-background.js"),
  popup: path.join(ROOT, "popup.html"),
  options: path.join(ROOT, "options.html")
}

function runNodeCheck(filePath) {
  cp.execFileSync(process.execPath, ["--check", filePath], { stdio: "pipe" })
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8")
}

function extractBetween(src, startMarker, endMarker) {
  const start = src.indexOf(startMarker)
  if (start < 0) throw new Error(`Missing marker: ${startMarker}`)
  const end = src.indexOf(endMarker, start)
  if (end < 0) throw new Error(`Missing marker: ${endMarker}`)
  return src.slice(start + startMarker.length, end).trim().replace(/;$/, "")
}

function evalObjectLiteral(rawObjectLiteral) {
  return Function(`return (${rawObjectLiteral})`)()
}

function compareKeys(leftObj, rightObj) {
  const left = new Set(Object.keys(leftObj || {}))
  const right = new Set(Object.keys(rightObj || {}))
  return {
    missingRight: [...left].filter((x) => !right.has(x)).sort(),
    missingLeft: [...right].filter((x) => !left.has(x)).sort()
  }
}

function assert(condition, label) {
  if (!condition) throw new Error(label)
}

function run() {
  runNodeCheck(FILES.ui)
  runNodeCheck(FILES.content)
  runNodeCheck(FILES.background)

  const uiSource = read(FILES.ui)
  const contentSource = read(FILES.content)
  const bgSource = read(FILES.background)
  const popupHtml = read(FILES.popup)
  const optionsHtml = read(FILES.options)

  const uiI18n = evalObjectLiteral(extractBetween(uiSource, "const I18N = ", "\n\n  const TEXT_REPLACE"))
  const contentI18n = evalObjectLiteral(extractBetween(contentSource, "const I18N = ", "\n\n  const S ="))

  const uiI18nDiff = compareKeys(uiI18n.en, uiI18n.zh)
  const contentI18nDiff = compareKeys(contentI18n.en, contentI18n.zh)

  assert(uiI18nDiff.missingLeft.length === 0 && uiI18nDiff.missingRight.length === 0, `UI i18n key mismatch: en-only=[${uiI18nDiff.missingRight.join(", ")}], zh-only=[${uiI18nDiff.missingLeft.join(", ")}]`)
  assert(contentI18nDiff.missingLeft.length === 0 && contentI18nDiff.missingRight.length === 0, `Content i18n key mismatch: en-only=[${contentI18nDiff.missingRight.join(", ")}], zh-only=[${contentI18nDiff.missingLeft.join(", ")}]`)

  const criticalChecks = [
    [/\"xac:open-advanced-panel\"/, uiSource, "Popup missing xac:open-advanced-panel action"],
    [/const isOptions = \/\\\/options\\.html\$\/i\.test\(window\.location\.pathname \|\| \"\"\)/, uiSource, "UI init missing options-mode detection"],
    [/case\s+\"xac:open-advanced-panel\"/, bgSource, "Background missing xac:open-advanced-panel handler"],
    [/case\s+\"xac:open-x-search\"/, bgSource, "Background missing xac:open-x-search handler"],
    [/case\s+\"xac:start-auto\"/, bgSource, "Background missing xac:start-auto handler"],
    [/case\s+\"xac:get-runtime-state\"/, bgSource, "Background missing xac:get-runtime-state handler"],
    [/case\s+\"xac:sync-scheduled-starts\"/, bgSource, "Background missing xac:sync-scheduled-starts handler"],
    [/case\s+\"xac:get-schedule-runtime\"/, bgSource, "Background missing xac:get-schedule-runtime handler"],
    [/case\s+\"xac:save-settings\"/, bgSource, "Background missing xac:save-settings handler"],
    [/case\s+\"xac:get-saved-settings\"/, bgSource, "Background missing xac:get-saved-settings handler"],
    [/chrome\.alarms\.onAlarm\.addListener/, bgSource, "Background missing schedule alarm listener"],
    [/XAC_SCHEDULE_ALARM_PREFIX/, bgSource, "Background missing schedule alarm prefix"],
    [/XAC_SCHEDULE_RETRY_ALARM_PREFIX/, bgSource, "Background missing schedule retry alarm prefix"],
    [/message\.xacAction\s*===\s*'xac:content-open-advanced'/, contentSource, "Content missing xac:content-open-advanced handler"],
    [/message\.xacAction\s*===\s*'xac:content-start-auto'/, contentSource, "Content missing xac:content-start-auto handler"],
    [/message\.xacAction\s*===\s*'xac:content-get-runtime-state'/, contentSource, "Content missing xac:content-get-runtime-state handler"],
    [/xac-content\.js/, popupHtml, "popup.html must load xac-content.js"],
    [/xac-content\.js/, optionsHtml, "options.html must load xac-content.js"]
  ]

  for (const [regex, source, errorLabel] of criticalChecks) {
    assert(regex.test(source), errorLabel)
  }

  const advancedIds = [
    "xac-reply-delay-min",
    "xac-reply-delay-max",
    "xac-action-delay",
    "xac-max-idle",
    "xac-min-chars",
    "xac-skip-links",
    "xac-skip-images",
    "xac-follow-min-followers",
    "xac-follow-max-followers",
    "xac-follow-min-mutuals",
    "xac-follow-require-signals",
    "xac-schedule-add",
    "xac-schedule-runtime-refresh",
    "xac-schedule-retry-enabled",
    "xac-schedule-retry-max-attempts",
    "xac-schedule-retry-first-delay",
    "xac-schedule-retry-next-delay",
    "xac-reply-like-frequency",
    "xac-extra-likes-frequency",
    "xac-retweet-min-likes",
    "xac-retweet-min-retweets",
    "xac-retweet-min-replies",
    "xac-session-min",
    "xac-session-max",
    "xac-session-total",
    "xac-session-wait-min",
    "xac-session-wait-max",
    "xac-bot-speed",
    "xac-random-skips",
    "xac-use-refresh-feed",
    "xac-random-mouse",
    "xac-post-within-minutes",
    "xac-only-blue-checks",
    "xac-name-replacement-mode",
    "xac-name-replacements",
    "xac-followed-end-enabled",
    "xac-followed-end-pool",
    "xac-cloud-save",
    "xac-cloud-load",
    "xac-template-name",
    "xac-add-gm-button",
    "xac-show-sidebar-controls",
    "xac-rated-us"
  ]

  for (const id of advancedIds) {
    const inTemplate = contentSource.includes(`id="${id}"`) || contentSource.includes(`id='${id}'`)
    const inBinding = contentSource.includes(`getElementById('${id}')`) || contentSource.includes(`getElementById("${id}")`)
    assert(inTemplate && inBinding, `Missing advanced control wiring: ${id}`)
  }

  const replyRuleControls = [
    "xac-rule-add",
    "xac-rule-reset",
    "xac-rule-import",
    "xac-rule-export",
    "xac-rule-import-file",
    "xac-rule-export-file",
    "xac-rule-file-input"
  ]
  for (const id of replyRuleControls) {
    const inTemplate = contentSource.includes(`id="${id}"`) || contentSource.includes(`id='${id}'`)
    const inBinding = contentSource.includes(`getElementById('${id}')`) || contentSource.includes(`getElementById("${id}")`)
    assert(inTemplate && inBinding, `Missing reply-rule control wiring: ${id}`)
  }

  assert(contentSource.includes("xac.replyRules"), "Missing reply-rules storage key")
  assert(/function\s+messages\(ctx,\s*triggeredRule\s*=/.test(contentSource), "messages() missing triggered-rule input")
  assert(/const\s+triggeredRule\s*=\s*matchReplyRule\(ctx,\s*S\.replyRules\)/.test(contentSource), "generate() missing rule matcher")
  assert(/const\s+ruledText\s*=\s*applyReplyRule/.test(contentSource), "generate() missing rule post-process")
  assert(contentSource.includes("replyRuleStartPool"), "Missing reply-rule pool i18n keys")
  assert(contentSource.includes("xac-rule-start-pool-"), "Missing reply-rule pool template ids")
  assert(contentSource.includes("followMinFollowers"), "Missing follow condition i18n keys")
  assert(contentSource.includes("canFollowByRules"), "Missing follow gating logic")
  assert(contentSource.includes("sectionSchedule"), "Missing schedule i18n keys")
  assert(contentSource.includes("xac.scheduledStarts"), "Missing scheduled-starts storage key")
  assert(contentSource.includes("normalizeScheduledStarts"), "Missing schedule normalize helper")
  assert(contentSource.includes("scheduleModeCustom"), "Missing custom schedule mode i18n")
  assert(contentSource.includes("data-schedule-day"), "Missing schedule day selector wiring")
  assert(contentSource.includes("scheduleRuntimeTitle"), "Missing schedule runtime i18n")
  assert(contentSource.includes("normalizeScheduleRuntimeState"), "Missing schedule runtime normalize helper")
  assert(contentSource.includes("scheduleRetryEnabled"), "Missing schedule retry controls/i18n")
  assert(bgSource.includes("buildScheduleRetryDelayPlan"), "Missing schedule retry delay planner")
  assert(contentSource.includes("startTime"), "Missing schedule startTime support")
  assert(contentSource.includes("endTime"), "Missing schedule endTime support")
  assert(contentSource.includes("probability"), "Missing schedule probability support")
  assert(contentSource.includes("imageFrequency"), "Missing reply-rule image frequency support")
  assert(contentSource.includes("attachImageToComposer"), "Missing reply image attach pipeline")
  assert(contentSource.includes("useNameReplacements"), "Missing name replacement mode support")
  assert(contentSource.includes("followedReplaceEndGreeting"), "Missing followed end greeting replacement support")
  assert(contentSource.includes("saveSettingsToCloud"), "Missing cloud backup save helper")
  assert(contentSource.includes("loadSettingsFromCloud"), "Missing cloud backup load helper")
  assert(bgSource.includes("saveSettingsCloudBackup"), "Missing background cloud backup save")
  assert(bgSource.includes("getSettingsCloudBackup"), "Missing background cloud backup load")

  console.log("xac-smoke-check: PASS")
}

try {
  run()
} catch (error) {
  console.error("xac-smoke-check: FAIL")
  console.error(error && error.stack ? error.stack : String(error))
  process.exit(1)
}
