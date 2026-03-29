#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function read(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  return fs.readFileSync(fullPath, "utf8");
}

function checkIncludes(content, needle, label, errors) {
  if (!content.includes(needle)) {
    errors.push(`${label}: missing "${needle}"`);
  }
}

function checkRegex(content, pattern, label, errors) {
  if (!pattern.test(content)) {
    errors.push(`${label}: pattern not matched ${pattern}`);
  }
}

function main() {
  const errors = [];
  const managerHtml = read("manager.html");
  const managerJs = read("manager.js");
  const i18nJs = read("i18n.js");
  const settingsJs = read("settings.js");
  const backgroundJs = read("background.js");

  // 1) Automation page UI wiring
  checkIncludes(managerHtml, 'id="automationRuleSetSelect"', "manager.html", errors);
  checkIncludes(managerHtml, 'id="automationRuleSetType"', "manager.html", errors);
  checkIncludes(managerHtml, 'id="automationRuleNotebookCount"', "manager.html", errors);
  checkIncludes(managerHtml, 'id="automationRuleTargetCount"', "manager.html", errors);
  checkIncludes(managerHtml, 'id="automationRuleSetHint"', "manager.html", errors);
  checkIncludes(managerHtml, 'id="automationRuleSourceList"', "manager.html", errors);
  checkIncludes(managerHtml, 'id="automationRuleSetCreate"', "manager.html", errors);
  checkIncludes(managerHtml, 'id="automationRuleSetEdit"', "manager.html", errors);
  checkIncludes(managerHtml, 'id="automationRuleSetDelete"', "manager.html", errors);
  checkIncludes(managerHtml, 'id="appDialogSelectWrap"', "manager.html", errors);
  checkIncludes(managerHtml, 'id="appDialogSelect"', "manager.html", errors);

  // 2) Notebook row behavior
  checkRegex(
    managerJs,
    /addRuleBtn[\s\S]*?addRuleWithPrompt\(item\.url,\s*item\.title\)/,
    "manager.js addRuleBtn",
    errors
  );
  checkRegex(
    managerJs,
    /addSourceBtn[\s\S]*?addSourceWithPrompt\(item\.url\)/,
    "manager.js addSourceBtn",
    errors
  );
  checkRegex(
    managerJs,
    /async function addRuleWithPrompt[\s\S]*?pickRuleSet[\s\S]*?askTextDialog[\s\S]*?addRule\(url,\s*sourceLabel,\s*ruleSetId\)/,
    "manager.js addRuleWithPrompt",
    errors
  );
  checkRegex(
    managerJs,
    /async function addSourceWithPrompt[\s\S]*?promptSourceUrl[\s\S]*?addSourcesToNotebookByUrls/,
    "manager.js addSourceWithPrompt",
    errors
  );
  checkRegex(
    managerJs,
    /async function batchAddSource[\s\S]*?extractUrlsFromText[\s\S]*?addSourcesToNotebookByUrls/,
    "manager.js batchAddSource",
    errors
  );
  checkRegex(
    managerJs,
    /automationRuleSetSelect\?\.addEventListener\("change"/,
    "manager.js automation rule set listener",
    errors
  );
  checkRegex(
    managerJs,
    /state\.selectedAutomationRuleSetId\s*\|\|\s*el\.automationRuleSetSelect\.value\s*\|\|\s*ruleSets\[0\]\.id/,
    "manager.js selected rule set priority",
    errors
  );
  checkRegex(
    managerJs,
    /async function createAutomationRuleSet\(/,
    "manager.js createAutomationRuleSet",
    errors
  );
  checkRegex(
    managerJs,
    /async function editAutomationRuleSet\(/,
    "manager.js editAutomationRuleSet",
    errors
  );
  checkRegex(
    managerJs,
    /async function deleteAutomationRuleSet\(/,
    "manager.js deleteAutomationRuleSet",
    errors
  );

  // 3) i18n coverage (zh + en)
  const i18nKeys = [
    "automationRulesTitle",
    "automationRulesDesc",
    "automationRuleSetLabel",
    "automationRuleSourceLabels",
    "automationRuleNoTargets",
    "automationRuleSetScheduledRefreshName",
    "automationRuleSetScheduledRefreshDesc",
    "automationRuleSetTypeScheduled",
    "automationRuleSetCreate",
    "automationRuleSetEdit",
    "automationRuleSetDelete",
    "automationRuleNotebookCount",
    "automationRuleTargetCount",
    "promptRuleSet",
    "promptSelectRuleSet",
    "promptRuleSetName",
    "promptRuleSetCategory",
    "promptRuleSetDesc",
    "promptRuleSetFallback",
    "promptRuleSetDeleteConfirm",
    "promptRuleSetDeleteDetail",
    "promptSourceUrl",
    "promptSourceUrlPlaceholder",
    "statusRuleSetSaved",
    "statusRuleSetDeleted",
    "statusRuleSetNameRequired",
    "statusRuleSetCannotDeleteDefault",
    "statusNoValidSourceUrl",
    "statusSourceAdded"
  ];
  for (const key of i18nKeys) {
    const regex = new RegExp(`\\b${key}\\s*:`, "g");
    const hits = i18nJs.match(regex) || [];
    if (hits.length < 2) {
      errors.push(`i18n.js: key "${key}" should exist in both zh-CN and en`);
    }
  }

  // 4) Rule-set compatibility in rule model/runtime path
  checkIncludes(settingsJs, "DEFAULT_RULE_SET_ID", "settings.js", errors);
  checkRegex(
    settingsJs,
    /DEFAULT_RULE[\s\S]*?ruleSetId:\s*DEFAULT_RULE_SET_ID/,
    "settings.js default ruleSetId",
    errors
  );
  checkRegex(
    backgroundJs,
    /sortedTargets[\s\S]*?target\?\.ruleSetId/,
    "background.js sortedTargets",
    errors
  );
  checkRegex(
    backgroundJs,
    /async function getRuleSets\(/,
    "background.js getRuleSets",
    errors
  );
  checkRegex(
    backgroundJs,
    /async function saveRuleSet\(/,
    "background.js saveRuleSet",
    errors
  );
  checkRegex(
    backgroundJs,
    /async function deleteRuleSet\(/,
    "background.js deleteRuleSet",
    errors
  );
  checkRegex(
    backgroundJs,
    /if \(message\?\.type === "SAVE_RULE_SET"\)/,
    "background.js SAVE_RULE_SET handler",
    errors
  );
  checkRegex(
    backgroundJs,
    /if \(message\?\.type === "DELETE_RULE_SET"\)/,
    "background.js DELETE_RULE_SET handler",
    errors
  );
  checkRegex(
    backgroundJs,
    /const updatedAt = String\(raw\.updatedAt \|\| ""\)\.trim\(\) \|\| createdAt;/,
    "background.js normalizeRuleSet preserve updatedAt",
    errors
  );
  checkRegex(
    backgroundJs,
    /updatedAt:\s*now/,
    "background.js saveRuleSet updates updatedAt only on save",
    errors
  );

  if (errors.length) {
    console.error("Manager flow smoke check failed:");
    for (const item of errors) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log("Manager flow smoke check passed.");
}

main();
