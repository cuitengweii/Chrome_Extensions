# X-to-follow-builders 决策记录（DECISIONS）

- 更新时间：2026-03-29
- 说明：以下内容基于当前代码实现核查提炼，属于已落地的稳定默认规则，不是新方案草稿。

## 已确认的稳定决策

1. 数据模型采用“单表快照 + meta 行”方案
- 表名：`fb_candidate_pool_snapshots`
- owner：`allen_local`
- 每个池子使用一行记录保存 `candidates`
- 自定义集合列表放在 `pool_key = "__meta__"` 的行里，通过 `custom_pools` 维护

2. 内置基础集合固定为 3 个
- `ai_builders`
- `ai_agents`
- `ai_research`
- 基础集合默认存在，自定义集合才允许重命名和删除

3. 采集入口采用“多入口汇总到同一后台写入层”
- popup 手动剪贴板导入
- popup 自动剪贴板监听
- X 页面 content script 自动捕获复制后的状态链接
- 右键上下文菜单按目标集合入池
- options 管理中心手动新增 / 移动 / 删除 / 导出

4. 支持的链接类型当前收敛为 4 类
- X 账号页
- X status 链接
- YouTube 频道
- YouTube 播放列表
- 对 X status 的持久化会归一化到账号级 URL，并保留原始发现来源

5. `ai_builders` 采用默认种子初始化策略
- 初始种子包含一批 X builder 账号
- 同时混入部分 AI 播客 / YouTube 来源
- 对旧的仅 X 种子数据，后台会在初始化时尝试补齐 YouTube 种子并升级名称

6. 名称补全采取“两级兜底”
- 优先通过 `cdn.syndication.twimg.com` 批量拉取 X 展示名
- 批量接口未命中时，再回退到 profile 页面抓取

7. 同池写入必须串行化
- `service-worker.js` 通过 `poolWriteQueue` 对同一个 pool 的写入排队
- 目标是减少并发导入时的覆盖冲突

8. popup / options 的状态同步统一走 `chrome.storage.local`
- 当前活跃集合
- 最近一次数据库写入结果
- 池子变更信号
- 这样可以让 popup、options、background 之间做轻量状态同步
