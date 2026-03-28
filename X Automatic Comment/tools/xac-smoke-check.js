#!/usr/bin/env node
"use strict"

const fs = require("fs")
const path = require("path")
const cp = require("child_process")

const ROOT = path.resolve(__dirname, "..")
const FILES = {
  ui: path.join(ROOT, "xac-ui.js"),
  content: path.join(ROOT, "xac-content.js"),
  background: path.join(ROOT, "xac-background.js")
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
    [/message\.xacAction\s*===\s*'xac:content-open-advanced'/, contentSource, "Content missing xac:content-open-advanced handler"]
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
    "xac-skip-images"
  ]

  for (const id of advancedIds) {
    const inTemplate = contentSource.includes(`id="${id}"`) || contentSource.includes(`id='${id}'`)
    const inBinding = contentSource.includes(`getElementById('${id}')`) || contentSource.includes(`getElementById("${id}")`)
    assert(inTemplate && inBinding, `Missing advanced control wiring: ${id}`)
  }

  console.log("xac-smoke-check: PASS")
}

try {
  run()
} catch (error) {
  console.error("xac-smoke-check: FAIL")
  console.error(error && error.stack ? error.stack : String(error))
  process.exit(1)
}
