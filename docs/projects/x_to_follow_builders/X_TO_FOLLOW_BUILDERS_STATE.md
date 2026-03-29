# X-to-follow-builders 状态（STATE）

- 更新时间：2026-03-29
- 归档类型：进度梳理归档（状态核查 + docs 同步）
- 主路径：`D:\code\Chrome_Extensions\X-to-follow-builders`
- 当前版本：`manifest.json` 中为 `0.5.1`

## 本线程确认的当前进度（OUTPUT）
1. 扩展主体已经是可运行的 MV3 MVP，不是空骨架：
   - `popup.html` + `popup.js` 已提供集合切换、剪贴板导入、自动监听剪贴板、管理中心入口。
   - `options.html` + `options.js` 已提供集合管理、账号池搜索、单条移动、批量移动、删除、JSON 导出、手动新增账号、剪贴板批量入池。
   - `service-worker.js` 已提供 Supabase REST 读写、默认种子初始化、同池串行写入、上下文菜单、写入结果广播。
   - `x-copy-capture.js` 已提供 X 页面复制链接捕获、文章上下文记忆、自动上报后台、页面 toast。
2. 账号池数据已经不是空库：
   - 2026-03-29 核查时，`allen_local` 名下共有 6 个账号池、81 个候选账号。
   - 来源分布为 `76` 个 X 账号、`4` 个 YouTube 频道、`1` 个 YouTube 播放列表。
3. 该项目此前没有项目级 docs；本线程已补建项目级状态文档与决策文档，后续可直接从 `docs\projects\x_to_follow_builders\` 接续。

## 当前线上数据状态（STATE）
- 数据表：`fb_candidate_pool_snapshots`
- Supabase owner：`allen_local`
- 最新一笔池子更新时间：
  - `Ai 中文博主` / `custom_ai`
  - UTC：`2026-03-28T10:20:22.960732+00:00`
  - Asia/Shanghai：`2026-03-28 18:20:22`
- 当前池子概览：
  - `AI 构建者`：43 个候选，状态全部为 `approved`
  - `AI Agent`：1 个候选，状态为 `pending`
  - `AI 研究`：3 个候选，状态为 `applied`
  - `Ai 中文博主`：32 个候选，状态全部为 `pending`
  - `闲鱼池子`：2 个候选，状态全部为 `pending`
  - `Ai 应用`：0 个候选

## 当前做到哪（STATE）
- 已经打通的主链路：
  - 在 popup 里切换目标集合。
  - 从剪贴板一次性导入 X / YouTube 链接。
  - 开启自动剪贴板监听，持续把新复制的链接入池。
  - 在 X 页面点击或右键时记录当前推文上下文，再捕获刚复制的状态链接。
  - 在 options 管理中心维护集合和候选账号。
- 已经固化的数据同步方式：
  - popup / options 通过 `chrome.storage.local` 同步最后一次写入结果和池子变更。
  - service worker 负责与 Supabase 交互，并对同一池子的写入做串行化处理。

## 已知缺口 / 待继续（STATE）
1. 当前仓库里 `X-to-follow-builders` 目录仍是未跟踪状态，说明项目代码还没有正式纳入这个 Git 仓库的版本历史。
2. 没找到自动化测试、打包脚本或专项回归脚本；目前更像是“直接加载扩展 + 联机使用”的工作流。
3. Supabase URL、publishable key、owner id、table 名仍硬编码在 `service-worker.js` / `options.js` 中，暂时没有环境切换层。
4. 候选状态目前已出现 `pending / approved / applied` 三种值，但代码侧还没有看到完整的状态流转规范文档。
5. 项目已有真实数据，但缺少专门的项目说明文档、操作手册和回归清单。

## 本线程未落地源码变更
- 本线程没有改动 `D:\code\Chrome_Extensions\X-to-follow-builders` 业务源码。
- 本线程只补做了项目状态梳理与 docs 同步。

## Next Step
1. 决定是否将 `D:\code\Chrome_Extensions\X-to-follow-builders` 正式纳入当前 Git 仓库跟踪，并理清与仓库内旧目录迁移的边界。
2. 增加一份最小回归清单或自动化脚本，至少覆盖：
   - popup 剪贴板导入
   - popup 自动监听
   - options 集合 CRUD / 移动 / 导出
   - X 页面复制链接捕获
3. 抽离 Supabase 配置，避免 owner / table / key 只能写死在源码里。
4. 明确候选状态流转规则，补一份使用/审核口径文档。
