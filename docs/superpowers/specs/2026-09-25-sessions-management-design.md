# OCConfiger 会话管理功能 — 设计文档

日期：2026-09-25
状态：待评审

## 1. 背景与目标

OCConfiger 当前只编辑 opencode 的配置文件（`opencode.jsonc` 等），不涉及会话数据。用户希望在 OCConfiger 内浏览和管理 opencode 的会话（V2），具体能力：

- **会话列表**：列出 opencode V2 的顶层会话，按最后更新时间倒序
- **会话概要**：每条会话展示标题、创建时间、最后更新时间、归档状态、所属目录、消息条数
- **重命名**：修改会话标题
- **删除**：删除会话（含其所有子会话和消息）

opencode V2 的会话持久化在本地 SQLite 数据库 `~/.local/share/opencode/opencode.db`（WAL 模式）的 `session_v2` 表，消息在 `session_message` 表。OCConfiger 已有 `paths.dataDir` 指向该目录，Electron 39（Node 22.22.1）内置实验性 `node:sqlite` 模块，无需引入 native 依赖。

**成功标准**：在 OCConfiger 的「会话管理」页面能列出 V2 会话、查看概要、重命名标题、删除会话；删除会递归清理其子会话与消息；不破坏 opencode 运行时（通过前置确认规避并发风险）。

## 2. 权威依据

字段定义以 opencode 数据库实际 schema 为准（本机 `~/.local/share/opencode/opencode.db`）。

### 2.1 `session_v2` 表（关键字段）

```text
id              text PRIMARY KEY
project_id      text NOT NULL          -- 外键 → project(id) ON DELETE CASCADE
workspace_id    text
parent_id       text                    -- 父会话 ID（fork 关系，无外键约束 → 删除需手动递归）
fork_session_id text
fork_boundary   text
slug            text NOT NULL
directory       text NOT NULL
path            text
title           text
version         text NOT NULL
share_url       text
summary_additions / deletions / files  integer
summary_diffs   text
metadata        text                    -- JSON
cost            real DEFAULT 0
tokens_input/output/reasoning           integer
tokens_cache_read/write                 integer
revert          text                    -- JSON
permission      text                    -- JSON
agent           text
model           text                    -- JSON: {id, providerID, variant}
time_created    integer NOT NULL
time_updated    integer NOT NULL
time_compacting integer
time_archived   integer                 -- 非 null 表示已归档
time_suspended  integer
resume_attempts / time_idle / time_viewed / idle_outcome   -- 运行时状态
```

### 2.2 `session_message` 表

```text
id           text PRIMARY KEY
session_id   text NOT NULL   -- 外键 → session_v2(id) ON DELETE CASCADE
type         text NOT NULL
seq          integer NOT NULL
time_created integer NOT NULL
time_updated integer NOT NULL
data         text NOT NULL   -- JSON
```

关键约束：`session_message.session_id` 有 `ON DELETE CASCADE`，删 `session_v2` 行会自动清其消息。但 `session_v2.parent_id` **无外键约束**，删父会话不会级联删子会话——必须手动递归（仿 opencode 的 `remove` 逻辑：`for (const child of kids) yield* remove(child.id)`）。

### 2.3 opencode CLI 对照

`opencode session list` 只列「当前项目」顶层会话（按 directory 过滤），非全局；`session delete <id>` 走 opencode 完整清理逻辑但依赖 background service/standalone；**无 rename 子命令**。故列表与重命名只能走 DB，删除若走 CLI 则依赖 opencode 运行环境不稳定——本设计统一用 `node:sqlite` 直接读写。

## 3. 范围与非目标

**范围**：
- 只管 V2 会话（`session_v2` 表），不含 V1 历史会话（`session` 表）。
- 只列顶层会话（`parent_id IS NULL`），fork 子会话不单独列出（属于父会话）。
- 概要内容：标题、创建时间、更新时间、归档状态、所属目录、消息数。不展示 model/agent/cost/tokens/代码变更/fork 来源（用户已确认不需要）。

**非目标**：
- 不做会话内容查看（消息体、parts 渲染）——超出本次范围。
- 不做会话导入/导出/fork/压缩——这些是 opencode 自身能力。
- 不做自动进程检测（跨平台假阳性风险高，概念验证项目用前置确认文本规避）。
- 不假设 opencode server 运行，不调 HTTP API。

## 4. 设计

### 4.1 架构与数据流

复用 OCConfiger 现有四层模式：

```
src/main/session/
  db.ts           # node:sqlite 连接管理（只读/读写打开 + busy_timeout）
  repository.ts   # 纯函数：listSessions / renameSession / deleteSession
src/shared/
  ipc-channels.ts     # +sessionList / sessionRename / sessionDelete
  session-types.ts    # SessionSummary 类型
src/main/ipc.ts        # +3 个 handler
src/preload/api.ts     # +listSessions / renameSession / deleteSession
src/renderer/src/pages/SessionsPage.tsx   # UI 页面（shadcn 重构后实现，见 §6）
src/renderer/src/App.tsx                 # NAV +'sessions' 项
```

数据流：`SessionsPage` → `window.api.listSessions()` → IPC `session:list` → `repository.listSessions(paths.dbPath)` → `node:sqlite` 只读查询。

### 4.2 数据访问层

#### 4.2.1 连接管理（`db.ts`）

- `dbPath = join(dataDir, 'opencode.db')`，在 `ConfigPaths` 加 `dbPath` 字段。
- 只读查询：`new DatabaseSync(dbPath, { readOnly: true })`，WAL 模式下只读并发安全。查询完即关闭（用 try/finally 或封装 openClose 辅助）。
- 写操作（rename/delete）：`new DatabaseSync(dbPath)`（读写），先 `db.exec('PRAGMA busy_timeout = 5000')` 防 opencode 持有写锁时 `SQLITE_BUSY`；操作完立即关闭，不持有锁。
- 不维护长连接，每次操作开关——简单且避免与 opencode 长期并发持锁。

#### 4.2.2 repository 纯函数

**`listSessions(dbPath): SessionSummary[]`**

```sql
SELECT s.id, s.title, s.directory, s.time_created, s.time_updated, s.time_archived,
       (SELECT COUNT(*) FROM session_message m WHERE m.session_id = s.id) AS message_count
FROM session_v2 s
WHERE s.parent_id IS NULL
ORDER BY s.time_updated DESC, s.id DESC
```

只读打开，`.prepare(sql).all()` 返回行映射为 `SessionSummary`。

**`renameSession(dbPath, id, title): void`**

```sql
UPDATE session_v2 SET title = ? WHERE id = ?
```

读写打开 + busy_timeout，`.prepare(sql).run(title, id)`。最小侵入，不改 `time_updated`（opencode 自身的 `touch` 在其下次操作时更新；避免 OCConfiger 越权改 opencode 的运行时时间戳）。

**`deleteSession(dbPath, id): void`**

递归删自身 + 所有子孙会话（`parent_id` 无 CASCADE 必须手动），事务保证原子：

```sql
PRAGMA busy_timeout = 5000;
BEGIN;
WITH RECURSIVE descendants AS (
  SELECT id FROM session_v2 WHERE id = ?
  UNION ALL
  SELECT s.id FROM session_v2 s JOIN descendants d ON s.parent_id = d.id
)
DELETE FROM session_v2 WHERE id IN (SELECT id FROM descendants);
COMMIT;
```

`session_message` 的外键 CASCADE 自动清各会话的消息。

### 4.3 类型（`src/shared/session-types.ts`）

```ts
export type SessionSummary = {
  id: string
  title: string | null
  directory: string
  timeCreated: number
  timeUpdated: number
  timeArchived: number | null
  messageCount: number
}
```

### 4.4 IPC 通道与 handler

`src/shared/ipc-channels.ts` 加：

```ts
sessionList: 'session:list',
sessionRename: 'session:rename',
sessionDelete: 'session:delete'
```

`src/main/ipc.ts` 的 `registerIpc` 加三个 handler（仿现有 `pluginsList/SetEnabled/Delete` 模式），调用 repository 纯函数，用 `ok()`/`fail()` 包装。`deps` 注入 repository 函数以便测试。

### 4.5 preload api

`src/preload/api.ts` 的 `Api` 接口加：

```ts
listSessions: () => Promise<SessionSummary[]>
renameSession: (id: string, title: string) => Promise<null>
deleteSession: (id: string) => Promise<null>
```

`createApi` 加三个 `unwrap` 调用。

## 5. UI 设计（框架无关的布局与交互）

> **实现时机**：UI 页面 `SessionsPage.tsx` 在 shadcn 重构完成后用 shadcn 组件实现。本节描述框架无关的布局与交互，适用于任何组件库。

### 5.1 布局

- 顶部：标题搜索框（按 title 模糊过滤，前端过滤）+ 刷新按钮
- 列表：每条会话一张卡片，包含：
  - 标题（点击进入内联编辑 → 回车保存 / Esc 取消 / 失焦保存）
  - 副信息行：创建时间、最后更新时间、消息数、所属目录
  - 归档徽章（`time_archived` 非 null 时显示「已归档」）
  - 右侧操作：重命名按钮、删除按钮
- 空状态 / 错误提示
- 时间戳用 `Intl.DateTimeFormat('zh-CN', ...)` 格式化

### 5.2 交互

- **列表加载**：进入页面 `useEffect` 调 `listSessions`；刷新按钮重新加载
- **搜索**：前端按 title 过滤（193 条规模无需后端分页）
- **重命名**：内联编辑保存 → `renameSession(id, title)` → 成功后刷新列表；失败提示
- **删除**：点击 → `window.confirm` 二次确认（文案见 §5.3）→ `deleteSession(id)` → 成功后刷新列表；失败提示

### 5.3 删除安全

二次确认文案明确告知风险：

> 确定删除会话「{title}」吗？
> 此操作不可恢复，会一并删除其所有子会话和消息。
> 建议先关闭 opencode 后再删除，避免运行中的 opencode 数据不一致。

不做自动进程检测。

## 6. 实现时机与依赖

本功能拆分为两部分，配合并行的 shadcn 重构任务：

| 部分 | 依赖 | 时机 |
|---|---|---|
| 数据访问层 + IPC + preload + 类型 + repository 测试 | 无 | 立即实现（并行任务1） |
| `SessionsPage.tsx` UI + App.tsx NAV 项 | shadcn 重构完成 | shadcn 重构后（串行收尾） |

数据层测试不依赖 UI，可先完成并合入。UI 页面等 shadcn 重构完成后，按 §5 的布局交互用 shadcn 组件实现。

## 7. 测试（关键精简）

### 7.1 `repository.test.ts`（数据层核心）

用 `:memory:` 临时 DB，建 `session_v2` + `session_message` 表（schema 对齐关键字段 + 外键 + CASCADE），插入测试数据：

- `listSessions`：返回顶层会话、按 `time_updated` 倒序、`message_count` 正确、排除 fork 子会话（`parent_id` 非 null）
- `renameSession`：title 更新生效、不影响其他会话、不改 `time_updated`
- `deleteSession`：删自身 + 递归删子孙会话、CASCADE 清 `session_message`、事务原子（中途失败回滚）

### 7.2 `ipc.test.ts`

`registerIpc` 加测三个 session handler：注入 mock repository，验证 `ok`/`fail` 包装与参数透传。

### 7.3 `SessionsPage.test.tsx`（UI，shadcn 重构后补）

渲染列表、搜索过滤、内联重命名保存、删除确认交互（mock `window.api`）。

## 8. 边界与风险

- **WAL 并发写**：opencode 运行时持写锁，OCConfigen 写操作可能 `SQLITE_BUSY`——`busy_timeout=5000` 等待；仍失败则提示用户关闭 opencode 后重试。
- **删除 active session 风险**：直接 DB 删除不走 opencode 事件清理，若删的是 opencode 正在使用的会话，opencode 内存短暂不一致、继续写入会因外键失败报错。靠前置确认文案规避，不做自动检测。
- **`node:sqlite` 实验性**：API 可能在未来 Node 版本变化。当前 Electron 39 稳定可用；若后续升级 Electron 导致 API 变动，再适配。
- **数据库 schema 变动**：若 opencode 后续改 `session_v2` 表结构，本功能的查询需同步调整。
