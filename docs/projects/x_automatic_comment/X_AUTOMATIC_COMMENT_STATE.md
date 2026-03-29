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

## Next Step
1. 在真实 X 页面做一次人工回归：
   - 名称替换 `never/smart/always`
   - 关注后尾句替换
   - 规则图片附图发送
   - 定时窗口 + 概率触发。
2. 安装 Playwright 依赖后补跑 `tools/xac-e2e-regression.js` 并记录结果。
