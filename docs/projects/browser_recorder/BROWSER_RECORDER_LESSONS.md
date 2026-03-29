# BROWSER_RECORDER_LESSONS

## 2026-03-29

### Pitfall
- 在压缩 bundle 中直接按关键字改逻辑，极易误伤和造成不可预期副作用。

### What Worked
- 先锁定“入口注入层”，将主题、语言、付费放开统一下沉到 runtime patch。
- 后台补丁和页面补丁分层处理，避免只改页面导致后台仍拦截。

### Avoid Next Time
- 后续若拿到源码仓库，优先把主题、i18n、授权开关迁回源码层并重新构建，逐步替代产物补丁。
