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

## 2026-03-29 | Unpacked Load Compatibility Baseline

### Decision
- 对本地开发/测试环境，`manifest.json` 采用“可加载优先”的兼容基线：
  - 移除 `key`
  - 移除 `update_url`
- 对 `manifest` 中声明的根目录资源执行“声明即落地”：
  - 若存在声明缺失，补齐对应文件，不保留悬空声明。

### Why
- 当前任务要求直接在本地 Chrome 通过“加载已解压扩展”可用。
- unpacked 扩展对目录结构和资源声明完整性更敏感，悬空资源和保留目录命名会导致加载失败。

### Stable Rule
- 每次改动后都执行：
  1. `manifest` JSON 解析检查
  2. `manifest` 引用文件存在性检查
  3. `_metadata` 保留目录检查（必须不存在）

## 2026-03-29 | Extension Name Single Source of Truth

### Decision
- 扩展名改为固定字面量，直接写入 `manifest.json > name`：
  - `Browser Recorder`

### Why
- 当前项目为解包产物维护模式，直接改 `manifest` 可最小变更立即生效。
- 避免引入大量 locale 文件变更，保持本次改动聚焦于“仅改扩展名”。
