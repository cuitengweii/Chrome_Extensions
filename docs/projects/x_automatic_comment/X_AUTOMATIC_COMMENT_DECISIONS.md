# X Automatic Comment 决策记录（DECISIONS）

## 2026-03-29：会话级风控采用“会话循环 + 局部随机”而非全局固定频率
- 决策：自动运行按 session 组织，每个 session 随机抽取互动目标数，并在 session 间执行等待窗口。
- 依据：与参考设置语义一致，同时降低固定节奏带来的行为特征。
- 影响：`startAuto()` 改为多会话循环，接入 `MaxInteractionsPerSession*`、`MaxTotalSessions`、`SessionWait*`、`BotSpeed`、`RandomSkips`、`UseRefreshFeed`、`RandomMouseMovement`。

## 2026-03-29：名称替换采用三态策略（never/smart/always）
- 决策：`{name}` 占位渲染不再只用作者原名，改为策略驱动替换。
- 依据：参考实现中该能力是完整风格系统的一部分，且能覆盖匿名/复杂账号名场景。
- 影响：新增 `UseNameReplacements` + `UsernameReplacements[]` 并接入模板变量解析。

## 2026-03-29：关注后尾句替换在“预关注成功”后生效
- 决策：若命中规则且开启 `FollowedReplaceEndGreeting`，先尝试关注，再在规则 end 模板使用 `EndGreetingsFollowed[]`。
- 依据：要保证“关注后文案”语义成立，必须以关注动作结果为前提。
- 影响：`generate()` 增加预关注逻辑，并在 post actions 中避免重复 follow。

## 2026-03-29：规则图片采用“本地可落地优先”链路
- 决策：每条规则支持 `images[]` + `imageFrequency`，前台提供 URL/本地/Giphy 三入口，发送时尝试写入 composer 文件输入。
- 依据：当前仓库已具备 content-script 操作能力，优先不用额外第三方上传接口即可闭环。
- 影响：新增图片归一化、导入导出字段、附图发送函数和对应 UI 绑定。

## 2026-03-29：定时启动扩展为“时间窗口 + 概率触发”
- 决策：调度项从单 `time` 扩展为 `startTime/endTime/probability`，后台每轮调度在窗口内随机取点，并按概率决定是否启动。
- 依据：与参考语义对齐，且保留已有 day/mode/max 逻辑兼容。
- 影响：`xac-content.js` 和 `xac-background.js` 的 schedule normalize、UI、alarm 触发流程同步升级。

## 2026-03-29：云备份接口采用扩展内置 sync 存储实现
- 决策：实现 `save-settings/get-saved-settings`（含 `xac:` 前缀别名），使用 `chrome.storage.sync` 保存完整设置快照并记录时间戳状态。
- 依据：当前工程无稳定可复用外部设置云 API，先保证本地可用与跨浏览器实例同步能力。
- 影响：新增后台备份读写、前台 Save/Load 按钮与 `Last synced/Last pulled` 状态展示。

## 2026-03-28：自动执行按钮统一为单按钮切换
- 决策：用一个 `run-toggle` 按钮承载开始/停止两种状态，而非分离的 Start/Stop 双按钮。
- 依据：减少误触与布局抖动，按钮语义直接反映当前运行态。
- 影响：`xac-content.js` 中执行区模板与事件绑定逻辑同步改造。

## 2026-03-28：自动执行状态变更必须立即触发渲染
- 决策：`S.auto.active` 在关键节点（启动、停止）变化后，立即调用 `render()`。
- 依据：此前存在状态已变但视图未更新的窗口期，用户会感知为“按钮未生效”。
- 影响：`startAuto()` 与 `stopAuto()` 都显式触发 UI 重绘。

## 2026-03-28：搜索公式只拼用户选择项，不追加默认 GM/GN
- 决策：搜索查询只由“包含词/排除词 + `min_replies` + `-filter:replies`”组成，不再自动追加 `(gm OR gn)`。
- 依据：自动追加词组会污染查询语义，导致用户输入场景出现“无结果/偏结果”。
- 影响：`xac-content.js` 的查询构建逻辑和默认查询模板已收敛为 X 语法直出。

## 2026-03-28：搜索配置改为人类可理解输入模型
- 决策：包含词改为“双输入框 + OR”，排除词单独输入，去掉 `启用 GM / 启用 GN` 开关。
- 依据：用户按“包含什么/排除什么”思考，不按底层查询参数思考。
- 影响：搜索区 UI、事件绑定、查询预览全部围绕自然选择模型实现。

## 2026-03-28：弹窗账号区去技术噪音
- 决策：移除与操作无关的 Supabase host 展示及冗余状态文案，保留“邮箱 + 小退出按钮 / 未登录登录按钮”。
- 依据：账号区目标是“确认登录与切换登录”，不应夹杂环境细节。
- 影响：`xac-ui.js` 账号模块改为紧凑卡片，入口区去除“打开 X 搜索”按钮。
