# OCConfiger 迁移至 opencode V2 配置格式 — 设计文档

日期：2026-09-19
状态：待评审

## 1. 背景与目标

OCConfiger 当前面向 **opencode V1** 配置格式：内置的 JSON Schema（`resources/schema/opencode-config.schema.json`）和编辑页面使用的字段结构均为 V1（`mcp` 扁平、`plugin` 单数、`permission` 分组等）。

用户当前已在使用 **opencode V2** 客户端，配置文件即为 V2 格式。因此需要把 OCConfiger **整体切换到 V2 格式**。

**明确前提（已与用户确认）**：

- 不考虑 V1 兼容，不做 V1→V2 迁移功能。
- 编辑范围只覆盖现有页面/模块，不新增 agents/providers/commands 等 V2 字段的编辑页面。
- 现有 `autoupdate` 字段在 V2 中保留，不改。

**成功标准**：OCConfiger 能够正确读写 V2 格式的 `opencode.jsonc`，现有 6 个页面（MCP、插件、权限、自动更新、凭证、SKILL、提示词）在 V2 字段下正常工作，schema 校验通过。

## 2. 权威依据

V2 字段定义以 opencode 官方仓库 `anomalyco/opencode`（dev 分支）源码为准，而非网站文档（文档存在多处滞后/不一致，如 `media` vs `attachments`、`{catalog, execution}` vs `{startup, request}`）。

关键源码文件：

- `packages/core/src/config.ts` — V2 顶层 `Config.Info` 定义
- `packages/core/src/config/{mcp,plugin,agent,provider,compaction,command,reference,formatter,lsp,watcher,tool-output,experimental,attachments}.ts`
- `packages/schema/src/permission.ts` — `Permission.Rule` / `Permission.Ruleset`

## 3. V2 配置字段（权威清单）

### 3.1 顶层字段

```text
$schema, shell, model, default_agent,
autoupdate: boolean | "notify",
share: "manual" | "auto" | "disabled",
enterprise: { url? }, username,
permissions: Rule[],
agents: Record<string, Agent>,
snapshots: boolean,
watcher: { ignore?: string[] },
formatter: boolean | Record<string, Entry>,
lsp: boolean | Record<string, Disabled|Server>,
attachments: { image?: { auto_resize?, max_width?, max_height?, max_base64_bytes? } },
tool_output: { max_lines?, max_bytes? },
mcp: { timeout?: {startup?, request?}, servers?: Record<string, Local|Remote> },
compaction: { auto?, prune?, keep?: {tokens?}, buffer? },
skills: string[],
commands: Record<string, Command>,
instructions: string[],
references: Record<string, string | Git | Local>,
plugins: (string | {package: string, options?: object})[],
experimental: { policies?: Policy[] },
providers: Record<string, Provider>
```

### 3.2 MCP（本次改造重点）

```text
mcp: {
  timeout?: { startup?: int, request?: int },
  servers?: {
    <name>: Local | Remote
  }
}
Local:  { type: "local",  command: string[], cwd?, environment?, disabled?, timeout?: {startup?, request?} }
Remote: { type: "remote", url: string, headers?, oauth?: OAuth | false, disabled?, timeout?: {startup?, request?} }
OAuth:  { client_id?, client_secret?, scope?, callback_port?, redirect_uri? }
```

与 V1 差异：

| V1 | V2 |
| --- | --- |
| `mcp.<name>` 扁平 | `mcp.servers.<name>` |
| `enabled` | `disabled`（语义取反） |
| `timeout: number` | `timeout: {startup?, request?}` |
| OAuth `clientId` 等 camelCase | `client_id` 等 snake_case |

### 3.3 插件（本次改造重点）

```text
plugins: (string | { package: string, options?: object })[]
```

与 V1 差异：`plugin` → `plugins`；条目由 `[pkg, options]` 元组变为 `{package, options}` 对象。

### 3.4 权限（本次改造重点）

```text
permissions: { action: string, resource: string, effect: "allow"|"ask"|"deny" }[]
```

- 有序数组，匹配逻辑为 `findLast`（最后一个匹配的规则生效），因此**顺序重要**。
- 无匹配规则时默认 `effect: "ask"`。
- `action` 与 `resource` 均支持通配 `*`（用 wildcard 匹配）。
- action 候选值：`*`、`read`、`edit`、`write`、`apply_patch`、`glob`、`grep`、`list`、`shell`、`subagent`、`todowrite`、`webfetch`、`websearch`、`skill`、`lsp`、`question`、`external_directory`。

与 V1 差异：`permission`(按工具分组) + `tools`(bool) → `permissions` 有序数组；action 改名 `bash→shell`、`task→subagent`、`write/patch→edit`。

### 3.5 其他字段（仅影响 schema，无编辑页面）

| V1 | V2 |
| --- | --- |
| `snapshot` | `snapshots` |
| `attachment` | `attachments` |
| `agent` / `mode` | `agents` |
| `provider` | `providers` |
| `command` | `commands` |
| `reference` | `references` |
| `skills: {paths, urls}` | `skills: string[]` |
| `compaction.preserve_recent_tokens/reserved` | `compaction.keep.tokens` / `buffer` |
| `autoupdate` | `autoupdate`（**保留不变**） |

## 4. 改造方案

### 4.1 内置 Schema 重写（`resources/schema/opencode-config.schema.json`）

依据第 3 节字段清单手写 V2 JSON Schema，替换现有 V1 schema。要点：

- `$ref` 指向 `#/$defs/Config`，`$defs` 定义所有 V2 类型。
- 移除 V1 专有类型（`McpLocalConfig`/`McpRemoteConfig` 扁平、`plugin` 元组、`permission` 分组、`mode`、`provider` 单数等），替换为 V2 类型。
- `model` 字段在 V2 为纯字符串，不再引用 `https://models.dev/model-schema.json`。
- `allowComments` / `allowTrailingCommas` 保持 `true`（JSONC 支持）。

### 4.2 校验（`src/main/schema/validate.ts`）

- 加载 V2 schema（`builtin.ts` 路径逻辑不变）。
- `externalStubs`：V2 schema 不再引用 models.dev，可移除该 stub；`strict: false` 已规避未知关键字问题。移除后若无其他外部引用，保留空数组即可。

### 4.3 MCP 页面（`src/renderer/src/pages/McpPage.tsx`）

- 所有字段路径 `['mcp', <name>, …]` → `['mcp', 'servers', <name>, …]`；`ListEditor` 的 `path` 改为 `['mcp', 'servers']`。
- `EnabledSwitch`：`enabled` → `disabled` 取反。
  - 勾选（启用）→ 移除 `disabled`（`clear`）。
  - 取消勾选（禁用）→ 写入 `disabled: true`（`set(true)`）。
  - `checked = value !== true`。
- `timeout`：TextField 路径改为 `['mcp', 'servers', <name>, 'timeout', 'request']`，标签改为「请求超时（毫秒）」（只编辑 `request` 单值，`startup` 暂不暴露 UI）。
- `sortByEnabled`：排序依据由 `enabled` 改为 `disabled`（`disabled === true` 排后）。
- OAuth 字段结构在 schema 中为 snake_case，但页面当前仅用 `OAuthField` 开关（false 禁用自动检测），仅同步路径，不涉及具体字段编辑。

### 4.4 插件（`src/main/config/plugins.ts` + `PluginPage.tsx`）

- `readPluginArray` / `writePluginArray`：`data.plugin` → `data.plugins`。
- `pluginName`：保留 `string` / `{package}` 分支（`{package}` 即 V2 对象形式）；移除或保留 V1 元组分支（`Array.isArray`）均可，建议保留作防御。
- 停用/删除仍走 `.occonfiger/disabled-plugins.json` 记录机制，仅字段名变更。
- `PluginPage.tsx` 文案中的「plugin 数组」改为「plugins 数组」。

### 4.5 权限编辑器（新建 `PermissionRulesEditor`）

替换 `SettingsPage.tsx` 中现有的「全局默认动作」下拉，做成**完整规则列表编辑器**。

- 数据源：`permissions` 数组（`getAt(draft, ['permissions'])`）。
- 每行规则：`action`（文本输入 + 候选值提示）、`resource`（文本输入）、`effect`（下拉 allow/ask/deny）、删除按钮。
- 支持「上移 / 下移」调整顺序（顺序影响匹配优先级）。
- 「添加规则」按钮：追加 `{ action: '', resource: '*', effect: 'ask' }`。
- 写回方式：整体替换数组 `setField(['permissions'], nextArray)`（避免对数组下标路径的 setAt 边界问题）。
- 空数组状态：显示「未配置权限规则」提示，可添加。

action 候选值通过 `<datalist>` 提供（action 为任意字符串，允许自定义），不强制枚举。

### 4.6 权限默认值逻辑（`src/renderer/src/store/permission.ts` + `App.tsx`）

- 现有 `permissionDefault` 基于 V1 `permission` 分组，V2 下不再适用。
- V2 无匹配规则时默认 `ask`，因此**移除**首载时强制写入默认权限的行为。
- 具体删除面（经检索仅以下三处引用）：
  - 删除 `src/renderer/src/store/permission.ts`。
  - 删除 `src/renderer/src/store/permission.test.ts`。
  - `App.tsx`：移除 `import { permissionDefault }`、`setField` 变量及其在 `useEffect` 中的调用（`setField` 仅此一处使用，一并移除）。

### 4.7 自动更新（`SettingsPage.tsx`）

`autoupdate` 字段 V2 保留，`AutoUpdateSetting` **不改**。

### 4.8 不动部分

- `CredentialsPage`（auth.json）、`FileManagerPage`（skills 目录）、`AgentsPage`（AGENTS.md）：均不涉及 config 字段，不改。
- `src/main/config/migrate.ts`：现有 `opencode.json`→`opencode.jsonc` 为文件名迁移，与字段版本无关，保留。

## 5. 测试策略

同步更新受影响的测试：

- `src/main/schema/validate.test.ts`：改为用 V2 字段（`mcp.servers`、`plugins`、`permissions`）构造用例。
- `src/main/config/plugins.test.ts`：`plugin` → `plugins` 字段断言。
- `src/main/ipc.test.ts`：如涉及字段名，同步更新。
- `src/renderer/src/pages/McpPage.test.tsx`、`SettingsPage.test.tsx`、`PluginPage.test.tsx`：字段路径断言更新。
- 新增 `PermissionRulesEditor` 的测试（增删、排序、effect 校验）。
- `store/permission.test.ts`：随 `permission.ts` 删除/改造同步处理。

遵循 TDD：先改测试，再改实现。

## 6. 风险与注意事项

1. **V2 schema 尚未官方发布**：手写 schema 可能与 opencode 实际行为存在细微差异。已以源码为准，字段结构经过逐一核对。
2. **权限模型语义变化**：V1「全局默认」与 V2「有序规则」语义不同，迁移后用户需重新理解规则优先级（最后一个匹配生效）。编辑器需在 UI 文案中说明。
3. **`disabled` 取反**：MCP 启停开关逻辑取反，需仔细处理 `undefined` 语义（未设置 = 启用）。
4. **超时 `startup` 未暴露**：UI 仅编辑 `request`，用户无法设置 `startup`。若未来需要可扩展为双输入框。
5. **`$schema` 字段**：`normalize.ts` 当前写入 `https://opencode.ai/config.json`，该 URL 目前仍返回 V1 schema。作为编辑器提示用途保留即可，不影响 opencode 实际读取；后续官方发布 V2 schema URL 后再更新。

## 7. 实施顺序（供后续 planning 参考）

1. 重写内置 V2 schema + 校验。
2. 插件字段 `plugin`→`plugins`（主进程 + 页面）。
3. MCP 页面路径/字段改造。
4. 权限编辑器（新建组件 + SettingsPage 接入 + 移除 permissionDefault）。
5. 全量测试同步更新。
6. `typecheck` / `lint` / `test` 全绿。
