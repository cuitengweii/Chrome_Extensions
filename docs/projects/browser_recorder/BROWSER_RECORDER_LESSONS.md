# BROWSER_RECORDER_LESSONS

## 2026-03-29

### Pitfall
- 在压缩 bundle 中直接按关键字改逻辑，极易误伤和造成不可预期副作用。

### What Worked
- 先锁定“入口注入层”，将主题、语言、付费放开统一下沉到 runtime patch。
- 后台补丁和页面补丁分层处理，避免只改页面导致后台仍拦截。

### Avoid Next Time
- 后续若拿到源码仓库，优先把主题、i18n、授权开关迁回源码层并重新构建，逐步替代产物补丁。

## 2026-03-29 (Load Failure)

### Pitfall
- 从 CRX 解包目录直接开发时，`manifest` 里的声明资源可能和目录实际文件不一致，导致 Chrome 在加载阶段直接失败。
- unpacked 目录若残留保留命名目录（如 `_metadata`），会触发加载拒绝。

### What Worked
- 将“加载可用性”独立成一轮修复：先对齐 `manifest` 再补齐资源，再做保留目录检查。
- 为缺失的根目录资源提供本地 fallback 文件，优先恢复可加载性。

### Avoid Next Time
- 每次接手“解包扩展”先做一次自动扫描：`manifest` 解析 + 资源存在 + 保留目录命名，再进入功能开发。
