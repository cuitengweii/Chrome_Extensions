# Chrome_Extensions Workspace 结构（WORKSPACE_STRUCTURE）

- 仓库根：`D:\code\Chrome_Extensions`
- 当前主要项目目录：
  - `D:\code\Chrome_Extensions\Browser-IP`
  - `D:\code\Chrome_Extensions\KongLai-NotebookLM`
  - `D:\code\Chrome_Extensions\Linkedin-to-GasGx`
  - `D:\code\Chrome_Extensions\X Automatic Comment`
  - `D:\code\Chrome_Extensions\X-to-follow-builders`

## 当前 docs 路由
- `KongLai-NotebookLM`
  - 项目级文档目录：`D:\code\Chrome_Extensions\docs\projects\konglai_notebooklm\`
- `X Automatic Comment`
  - 项目级文档目录：`D:\code\Chrome_Extensions\docs\projects\x_automatic_comment\`
- `X-to-follow-builders`
  - 项目级文档目录：`D:\code\Chrome_Extensions\docs\projects\x_to_follow_builders\`
- `Linkedin-to-GasGx`
  - 当前按 repo 级文档维护：`D:\code\Chrome_Extensions\docs\repo\WORKSPACE_STRUCTURE.md`
  - 最新主目录：`D:\code\Chrome_Extensions\Linkedin-to-GasGx\`

## 2026-03-29 路径同步（Linkedin-to-GasGx）
- 已按最新目录结构确认并同步以下关键入口路径：
  - `D:\code\Chrome_Extensions\Linkedin-to-GasGx\manifest.json`
  - `D:\code\Chrome_Extensions\Linkedin-to-GasGx\background.js`
  - `D:\code\Chrome_Extensions\Linkedin-to-GasGx\content.js`
  - `D:\code\Chrome_Extensions\Linkedin-to-GasGx\popup.html`
  - `D:\code\Chrome_Extensions\Linkedin-to-GasGx\popup.js`
  - `D:\code\Chrome_Extensions\Linkedin-to-GasGx\options.html`
  - `D:\code\Chrome_Extensions\Linkedin-to-GasGx\options.js`
  - `D:\code\Chrome_Extensions\Linkedin-to-GasGx\collector-settings.js`
  - `D:\code\Chrome_Extensions\Linkedin-to-GasGx\supabase-config.js`
- 当前尚未建立 `Linkedin-to-GasGx` 的项目级 docs；后续若该项目持续迭代，建议升级为 `docs/projects/linkedin_to_gasgx/` 专属路由。

## 其他说明
- 仓库归档与路径路由统一以 `D:\code\Chrome_Extensions` 为准。
- 历史旧路径不再作为当前仓库事实写入目标。

## 2026-03-29 Browser Recorder Route Sync
- New sub-project detected: `D:\code\Chrome_Extensions\Browser Recorder`
- Upgraded from repo-level default routing to project-level docs routing:
  - `D:\code\Chrome_Extensions\docs\projects\browser_recorder\BROWSER_RECORDER_STATE.md`
  - `D:\code\Chrome_Extensions\docs\projects\browser_recorder\BROWSER_RECORDER_DECISIONS.md`
  - `D:\code\Chrome_Extensions\docs\projects\browser_recorder\BROWSER_RECORDER_LESSONS.md`
- Current scope archived for this thread:
  - Theme style: tech-green + dark/light mode support
  - Language: `zh-CN / en` switch
  - Paid features: runtime unlock patch (page + background)
  - No layout restructuring

## 2026-03-29 Browser Recorder Loadability Fix
- Fixed unpacked extension load blockers in:
  - `D:\code\Chrome_Extensions\Browser Recorder\manifest.json`
- Added missing manifest-referenced resources:
  - `D:\code\Chrome_Extensions\Browser Recorder\content.styles.css`
  - `D:\code\Chrome_Extensions\Browser Recorder\blank.mp4`
  - `D:\code\Chrome_Extensions\Browser Recorder\worker.js`
  - `D:\code\Chrome_Extensions\Browser Recorder\wrapper.html`
- Verified `_metadata` reserved directory is not present in Browser Recorder root.

## 2026-03-29 Browser Recorder Extension Name Sync
- Unified extension display name in manifest:
  - `Browser Recorder`
- Updated targets:
  - `D:\code\Chrome_Extensions\Browser Recorder\manifest.json` (`name`)

## 2026-03-29 LinkedIn Automatic Comments Route Sync
- New stable project route added: `D:\code\Chrome_Extensions\LinkedIn automatic comments`
- Upgraded from repo-level default routing to project-level docs routing:
  - `D:\code\Chrome_Extensions\docs\projects\linkedin_automatic_comments\LINKEDIN_AUTOMATIC_COMMENTS_STATE.md`
  - `D:\code\Chrome_Extensions\docs\projects\linkedin_automatic_comments\LINKEDIN_AUTOMATIC_COMMENTS_DECISIONS.md`
  - `D:\code\Chrome_Extensions\docs\projects\linkedin_automatic_comments\LINKEDIN_AUTOMATIC_COMMENTS_LESSONS.md`
- Current archived scope:
  - Tech-green theme with dark/light mode
  - `zh-CN / en` switch in popup runtime
  - Local paid-gate unlock patch without layout restructuring
- 2026-03-29 loadability hardening:
  - rebuilt clean unpacked `manifest.json` (removed `key` / `update_url`, normalized name encoding)
  - ensured full runtime artifact set is included for local loading

## 2026-04-25 GasGx Matrix Route Sync
- New stable project route added: `D:\code\Chrome_Extensions\gasgx matrix`
- Project-level docs routing:
  - `D:\code\Chrome_Extensions\docs\projects\gasgx_matrix\GASGX_MATRIX_STATE.md`
  - `D:\code\Chrome_Extensions\docs\projects\gasgx_matrix\GASGX_MATRIX_DECISIONS.md`
  - `D:\code\Chrome_Extensions\docs\projects\gasgx_matrix\GASGX_MATRIX_LESSONS.md`
- Project classification:
  - standalone Python video-generation tool
  - Streamlit operator UI
  - FFmpeg / ffprobe rendering pipeline
  - local-first batch cyber-industrial output workflow
