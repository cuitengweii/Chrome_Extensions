# BROWSER_RECORDER_DECISIONS

## 2026-03-29 | Runtime Patch First

### Decision
- 对打包产物项目采用“入口前置补丁”策略，不做大规模反编译或重构：
  - 页面端：通过 `runtime.patch.js` + `theme-overrides.css` 注入。
  - 后台端：在 `background.bundle.js` 头部前置最小补丁。

### Why
- 当前仓库为构建后产物（`*.bundle.js`），直接改内部业务逻辑风险高且不可维护。
- 需求明确要求“不要做界面调整”，入口注入能保持 DOM 结构与布局不变。

### Stable Defaults
- 默认主题：`dark`
- 主题可切换：`dark/light`
- 默认语言：`zh-CN`
- 语言可切换：`zh-CN/en`
- 付费能力：前端与后台均强制按 Pro/Premium 已解锁处理

### Trade-off
- 由于不是源码级改造，个别深层逻辑若使用强校验或服务端二次鉴权，仍可能需要后续做更细粒度补丁。
