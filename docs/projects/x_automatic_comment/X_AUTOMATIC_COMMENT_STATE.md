# X Automatic Comment 状态（STATE）

- 更新时间：2026-03-29
- 归档类型：代码归档（非纯讨论）
- 主路径：`D:\code\Chrome_Extensions\X Automatic Comment`

## 本线程产出（OUTPUT）
1. 会话级风控参数已落地到设置模型、UI 和执行链路：
   - `MaxInteractionsPerSessionMin/Max`
   - `MaxTotalSessions`
   - `SessionWaitMin/Max`
   - `UseRefreshFeed`
   - `BotSpeed`
   - `RandomSkips`
   - `RandomMouseMovement`
   - `PostWithinMinutes`
   - `OnlyBlueChecks`
2. 名称替换系统已落地：
   - `UseNameReplacements`（`never/smart/always`）
   - `UsernameReplacements[]`
   - `{name}` 占位替换接入策略选择。
3. 关注后尾句替换已落地：
   - `EndGreetingsFollowed[]`
   - `FollowedReplaceEndGreeting`
   - 在自动关注成功后优先替换规则尾句。
4. 回复规则图片能力已落地：
   - 每条规则新增 `images[]` 与 `imageFrequency`
   - 支持 URL 添加、本地上传（转 data URL）、Giphy 快捷入口
   - 生成链路支持尝试附图发送。
5. 定时启动 1:1 细项已补齐：
   - 调度项新增 `startTime/endTime` 随机窗口
   - 新增 `probability`（10-100%）与后台概率跳过逻辑。
6. 设置云备份已落地：
   - 后台新增 `xac:save-settings` / `xac:get-saved-settings`（兼容 `save-settings` / `get-saved-settings`）
   - 前台新增 Save/Load 按钮与 `Last synced/Last pulled` 状态显示。
7. 兼容键迁移已落地：
   - 支持旧 `settings/messages` 迁移
   - 兼容历史键如 `FollowMinFollwers`、`FollowRange`、`TemplateName`、`AddGMButton`、`ShowSideBarControls`。
8. 侧栏工具入口与轻量元字段已对齐（保留必要项）：
   - `Activity / Follow Us / Rate Us`
   - `TemplateName / AddGMButton / ShowSideBarControls / ratedUs`。
9. 回归能力增强：
   - `tools/xac-smoke-check.js` 已补本线程新增能力的静态断言。

## 关键状态（STATE）
- 已改动源码文件：
  - `D:\code\Chrome_Extensions\X Automatic Comment\xac-content.js`
  - `D:\code\Chrome_Extensions\X Automatic Comment\xac-background.js`
  - `D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-smoke-check.js`
- 已改动文档文件：
  - `D:\code\Chrome_Extensions\docs\projects\x_automatic_comment\X_AUTOMATIC_COMMENT_STATE.md`
  - `D:\code\Chrome_Extensions\docs\projects\x_automatic_comment\X_AUTOMATIC_COMMENT_DECISIONS.md`
  - `D:\code\Chrome_Extensions\docs\projects\x_automatic_comment\X_AUTOMATIC_COMMENT_LESSONS.md`
- 自动化回归：
  - `node --check xac-content.js`：通过
  - `node --check xac-background.js`：通过
  - `node tools/xac-smoke-check.js`：通过
- 未完成项：
  - `tools/xac-e2e-regression.js` 需要本机先安装 Playwright 依赖后再跑端到端。

## 2026-03-29 UI Style Hotfix
1. Fixed extension-page narrow-strip rendering in `D:\code\Chrome_Extensions\X Automatic Comment\xac-content.js`.
2. Updated `VIEW.isExtensionPage` styles:
   - `html,body` now enforce width bounds and horizontal overflow protection.
   - popup mode now has `min-width: 340px` fallback.
   - `#xac-root` width moved from `clamp(340px,96vw,360px)` to adaptive `min(100%,360px)` with `min-width`/`max-width` safeguards.
3. Regression checks:
   - `node --check xac-content.js` passed.
   - `tools/xac-smoke-check.js` currently fails due stale marker dependency (`const TEXT_REPLACE`).
   - `$env:NODE_PATH='C:\Temp\xac-playwright-runtime\node_modules'; node tools/xac-e2e-regression.js` passed.

## 2026-03-29 Wide Options + i18n Cleanup
1. Layout:
   - options page upgraded to wide mode (`min(96vw,1180px)`), with responsive fallback below 900px.
   - advanced group promoted to full-width block to reduce vertical crowding and improve readability.
2. i18n:
   - replaced hardcoded mixed-language labels in advanced/schedule/cloud/meta/reply-image sections with centralized i18n keys.
   - normalized Chinese runtime messages for cloud sync status, sidebar/search toast, copy toast, and local image upload errors.
3. Validation:
   - `node --check D:\code\Chrome_Extensions\X Automatic Comment\xac-content.js` passed.
   - `$env:NODE_PATH='C:\Temp\xac-playwright-runtime\node_modules'; node D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-e2e-regression.js` passed.
   - `node D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-smoke-check.js` still fails due known stale marker dependency (`const TEXT_REPLACE`).

## 2026-04-01 Dark + Green Simplification
1. Theme update (`D:\code\Chrome_Extensions\X Automatic Comment\xac-content.js`):
   - unified extension UI to a restrained dark base + green accent palette.
   - removed most high-saturation gradients and switched to a variable-driven color system for consistency.
   - kept warning/error/status colors low-contrast to avoid visual noise.
2. Scope control:
   - only style layer was updated; no runtime logic, selector IDs, or event wiring changed in this pass.
3. Manual responsive regression:
   - options layout keeps 2-column flow on wide viewport (`1280px`).
   - options layout falls back to 1-column on small viewport (`480px`), pipeline grid also falls back correctly.
4. Validation:
   - `node --check D:\code\Chrome_Extensions\X Automatic Comment\xac-content.js` passed.
   - `node D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-smoke-check.js` passed.
   - `$env:NODE_PATH='C:\Temp\xac-playwright-runtime\node_modules'; node D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-e2e-regression.js` passed.
   - `python D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-e2e-regression.py` passed.

## 2026-04-01 Pure Palette + Sidebar Key Config Hints
1. Visual simplification (`D:\code\Chrome_Extensions\X Automatic Comment\xac-content.js`):
   - reduced mixed accent colors and consolidated to dark base + single green accent direction.
   - toned down flash/glow effects to keep panel appearance clean and less noisy.
   - normalized inline status/button variants to avoid strong blue/yellow contrast spikes.
2. Sidebar guidance update (popup execution section):
   - added in-panel key-config hints for search pipeline:
     - include terms
     - exclude terms
     - min comments
     - exclude replies feed
   - added in-panel key-config hints for auto-reply:
     - mode / goal / length
     - auto send
     - max per run
     - start/stop toggle
3. Validation:
   - `node --check D:\code\Chrome_Extensions\X Automatic Comment\xac-content.js` passed.
   - `node D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-smoke-check.js` passed.
   - `$env:NODE_PATH='C:\Temp\xac-playwright-runtime\node_modules'; node D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-e2e-regression.js` passed.
   - `python D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-e2e-regression.py` passed.

## 2026-04-01 Sidebar UI Round 2 (More Minimal)
1. Popup hierarchy simplification (`D:\code\Chrome_Extensions\X Automatic Comment\xac-content.js`):
   - popup now uses `popup-lite` style mode:
     - hides step description lines to reduce visual noise.
     - compresses section spacing for faster scanning.
   - keeps functional controls unchanged (selectors and event wiring intact).
2. Key config visibility upgrade:
   - execution section now shows live key-config summary instead of generic bullets.
   - search summary now displays:
     - include terms
     - exclude terms
     - min comments
     - exclude replies feed
   - auto-reply summary now displays:
     - mode / goal / length
     - auto-send on/off
     - max per run
     - run switch entry point
3. Palette refinement:
   - further reduced mixed tone contrast; aligned `PRO` and status surfaces to the same dark-green system.
   - trimmed extra glow effects for a cleaner dark + green presentation.
4. Validation:
   - `node --check D:\code\Chrome_Extensions\X Automatic Comment\xac-content.js` passed.
   - `node D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-smoke-check.js` passed.
   - `$env:NODE_PATH='C:\Temp\xac-playwright-runtime\node_modules'; node D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-e2e-regression.js` passed.
   - `python D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-e2e-regression.py` passed.

## 2026-04-02 Sidebar UI Round 3 (Primary/Secondary Actions)
1. Execution-area action hierarchy (`D:\code\Chrome_Extensions\X Automatic Comment\xac-content.js`):
   - primary action: `Start/Stop Auto Reply` remains as the single main CTA.
   - secondary actions: `Open Search` + `Open Full Config` moved to lighter secondary buttons.
   - tertiary action: `Open X Sidebar` moved to a low-emphasis dashed helper button.
2. Visual consistency:
   - added shared action layout classes (`actions-main`, `actions-secondary`, `actions-tertiary`) for cleaner rhythm.
   - secondary/tertiary styles reduce noise while keeping all existing IDs and behavior unchanged.
3. Validation:
   - `node --check D:\code\Chrome_Extensions\X Automatic Comment\xac-content.js` passed.
   - `node D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-smoke-check.js` passed.
   - `$env:NODE_PATH='C:\Temp\xac-playwright-runtime\node_modules'; node D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-e2e-regression.js` passed.
   - `python D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-e2e-regression.py` passed.

## 2026-04-02 Sidebar UI Round 4 (Merged Account + AI Summary)
1. Popup information architecture (`D:\code\Chrome_Extensions\X Automatic Comment\xac-content.js`):
   - merged account state and AI state into one compact summary card in Step Account.
   - removed separate AI block from popup to reduce duplicated status scanning.
   - kept `#xac-sync-spark` action in popup account section (behavior unchanged).
2. Guidance simplification:
   - guide banner now supports explicit expand/collapse (`View Notes` / `Hide Notes`).
   - default view keeps only one core line; secondary notes are shown on demand.
3. UI consistency:
   - added lightweight style hooks for compact summary (`summary-compact`) and guide toggle.
   - retained existing control IDs and core action flow.
4. Validation:
   - `node --check D:\code\Chrome_Extensions\X Automatic Comment\xac-content.js` passed.
   - `node D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-smoke-check.js` passed.
   - `$env:NODE_PATH='C:\Temp\xac-playwright-runtime\node_modules'; node D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-e2e-regression.js` passed.
   - `python D:\code\Chrome_Extensions\X Automatic Comment\tools\xac-e2e-regression.py` passed.

## Next Step
1. 在真实 X 页面做一次人工回归：
   - 名称替换 `never/smart/always`
   - 关注后尾句替换
   - 规则图片附图发送
   - 定时窗口 + 概率触发。
2. 安装 Playwright 依赖后补跑 `tools/xac-e2e-regression.js` 并记录结果。
