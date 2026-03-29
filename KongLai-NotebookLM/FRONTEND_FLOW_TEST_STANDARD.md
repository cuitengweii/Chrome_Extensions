# Frontend Flow Test Standard (Manager)

## Scope
- Page: `manager.html` / `manager.js`
- Focus: automation rule-set linkage, add-rule flow, add-source URL flow, run-now refresh flow

## Standardized Flow Checklist
1. Automation task center shows rule-set module.
2. Rule-set dropdown renders available sets (current: scheduled source refresh).
3. Rule-set create/edit/delete actions work in automation center.
4. Deleting a non-default rule set remaps existing rule targets to a fallback rule set.
5. Rule-set meta updates with notebook count, rule count, source labels.
6. Notebook row `加入规则 / Add Rule` opens rule-set selection first.
7. After selecting rule set, source-label input appears and saves rule target.
8. Notebook row `新增来源 / Add Source` asks for URL input (not source label).
9. URL input supports multiple URLs (space/newline separated).
10. Imported sources trigger notebook/source refresh state update.
11. Batch add source uses URL import pipeline for each selected notebook.
12. `立即刷新 / Run Now` remains available in automation center and keeps scheduler status/log behavior.

## Pass Criteria
- No JS syntax errors (`node --check` on modified JS files).
- Flow smoke script passes:
  - `node tools/manager-flow-smoke-check.mjs`
- Build sanity passes:
  - `npx esbuild manager.js --bundle --platform=browser --format=esm --outfile=.tmp-manager-build.js`
  - `npx esbuild background.js --bundle --platform=browser --format=iife --outfile=.tmp-background-build.js`
