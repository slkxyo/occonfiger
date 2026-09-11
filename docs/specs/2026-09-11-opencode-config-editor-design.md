# occonfiger：opencode 可视化配置工具 设计文档

- 日期：2026-09-11
- 状态：设计已确认，待转实现计划
- 项目目录：`/Users/slkxy/WorkSpace/occonfiger`

## 1. 背景与目标

opencode 通过 `~/.config/opencode/opencode.json`（或 `opencode.jsonc`）进行配置，字段繁多、结构复杂（provider、MCP、permission、agent 等），手写 JSON 容易出错，且 opencode 对配置校验严格，写错会导致启动失败。

目标是开发一个 Electron 桌面应用，把 opencode 的**全局配置**变成可视化表单编辑，降低配置门槛、减少语法错误，并提供 agent / command / skill 文件的基本管理能力。

## 2. 范围

### In scope

- 编辑**全局配置**：`~/.config/opencode/opencode.json`（或 `.jsonc`）。
- **全量字段覆盖**：以内置的官方 schema 快照为准，覆盖其全部顶层字段。
- 表单化图形编辑：常用字段用专用控件，简单字段用统一控件映射。
- 只读的原始 JSON 弹窗查看。
- `agent/`、`command/`、`skill/` 目录的**文件列表管理**（新建 / 重命名 / 删除 / 用系统编辑器打开）。
- **服务商凭证管理**：展示 `/connect` 已连接的服务商，支持删除与修改密钥（见第 8 节）。
- 保存前基于内置 schema 的校验（警告但允许强制保存）。

### Out of scope（本期不做）

- 项目级配置（`./opencode.json`、`.opencode/`）。
- 表单之外的可编辑原始 JSON（弹窗默认只读）。
- 运行时从网络拉取 schema；schema 演进靠代码升级。
- 未覆盖字段的运行时兜底编辑器。
- 在应用内编辑 agent/command/skill 文件正文（仅列表管理）。
- **新增服务商凭证**（含 OAuth 登录流程）：新增一律由用户在 opencode 中用 `/connect` 或 `opencode auth login` 手动完成，本应用只管理已存在的凭证条目。
- Electron E2E 测试。
- 配置自动备份与 JSONC 注释保留（保存为直接覆盖）。
- 调用 opencode CLI/SDK 做运行时验证。

## 3. 技术栈

- Electron 39 + electron-vite（已有脚手架）。
- React 19 + TypeScript。
- Chakra UI（组件库）。
- 状态管理：轻量 store（优先 `zustand`；若不想加依赖则用 `useReducer` + context）。
- 解析/校验：`jsonc-parser`（读取容错）、`ajv`（schema 校验）。
- 测试：Vitest + jsdom + `@testing-library/react`。
- 打包：electron-builder（脚手架已配置跨平台）。

## 4. 总体架构与进程职责

三层，文件系统权限只存在于 main 进程。

### main 进程（`src/main/`）

- `config/paths.ts`：定位配置目录与文件名。目录优先 `$XDG_CONFIG_HOME/opencode`，否则 `~/.config/opencode`；探测 `opencode.json` 与 `opencode.jsonc`，取已存在者，都不存在时默认目标为 `opencode.json`。
- `config/io.ts`：读取（`jsonc-parser`）、写入（直接覆盖，实现为「写临时文件 → rename」的原子写）、文件管理操作（新建 / move / 删除）。
- `auth/io.ts`：读写 `~/.local/share/opencode/auth.json`（读取、改密钥、删除条目、保持 `0600`）。
- `schema/builtin.ts`：加载随包分发的内置 schema 快照。
- `ipc.ts`：注册全部 IPC handler。

### preload（`src/preload/`）

- 用 `contextBridge` 暴露类型安全 API，例如：
  - `readConfig()` / `saveConfig(draft)`
  - `getConfigPath()` / `getRawContent()`
  - `listManagedFiles(kind)` / `createManagedFile(kind, name)` / `renameManagedFile(kind, from, to)` / `deleteManagedFile(kind, name)` / `openManagedFile(kind, name)`
  - `listCredentials()` / `updateCredentialKey(provider, key)` / `deleteCredential(provider)`
- renderer 不直接访问 Node / fs。

### renderer（`src/renderer/`）

- React + Chakra，只负责 UI 与表单草稿状态，全部磁盘操作经 preload API 转交 main。

### 数据流

启动 → main 读磁盘配置 + 加载内置 schema → preload 转发 → renderer 初始化表单草稿 → 用户编辑（仅改草稿）→ 点保存 → renderer 交完整对象给 main → main 原子覆盖写入 → UI 提示需重启 opencode。

## 5. 数据模型与字段分层

单一数据源：一个符合 `Config` 形状的 JS 草稿对象（`ConfigDraft`）。所有 UI 读写该对象的切片，保存时整体序列化。草稿存于 store，切换导航页不丢失。

字段分两层渲染（以当前内置快照为准做全量覆盖，无运行时兜底）：

### A 类 · 专用结构化 UI（手写 Chakra 组件）

- `model` / `small_model` / `default_agent`：文本输入 + `provider/model` 格式校验（无模型列表数据源）。
- `provider`：可折叠的 provider 卡片列表，含 `api`、`name`、`env`、`npm`、`options`、`models`。
- `mcp`：卡片列表，按 `type` 在 local（`command`、`cwd`、`environment`、`enabled`、`timeout`）与 remote（`url`、`headers`、`oauth`、`enabled`、`timeout`）两套字段间切换。
- `permission`：每个已知权限键一个 `allow / ask / deny` 下拉；`bash` 额外支持「模式 → 动作」的键值行编辑器。
- `agent`：agent 卡片列表，展开各自的 `AgentConfig`（`model`、`variant`、`mode`、`description`、`permission`、`temperature`、`top_p`、`steps`、`hidden`、`disable`、`color` 等）。
- `command`：命令卡片列表，含 `template`、`description`、`agent`、`model`、`variant`、`subtask`。
- `skills`：`paths` 与 `urls` 两个数组编辑器。
- `references`：按别名键控的卡片列表，支持本地路径 / Git 仓库两种形态。
- `instructions`：字符串数组编辑器。
- `plugin`：数组编辑器，支持字符串项与 `[name, options]` 元组项。
- `formatter` / `lsp`：bool 或对象两种形态。

### B 类 · 通用控件映射（简单标量）

按类型统一渲染：enum → 下拉（`logLevel`、`share`）、bool → 开关（`snapshot`）、`bool | "notify"` → 三态（`autoupdate`）、string[] → 标签数组（`disabled_providers`、`enabled_providers`）、number（`subagent_depth`）、以及固定结构对象 `server`、`watcher`、`attachment`、`tool_output`、`compaction`、`enterprise`、`experimental`。

### 未展示字段的处理（round-trip 安全）

草稿对象保留从文件读入的**全部键**；UI 只编辑它覆盖的字段。写入时：

- 未被任何 UI 覆盖的键（例如 deprecated 字段 `mode`、`autoshare`、`reference`、`layout`，或内置快照未定义但文件里已存在的键）**原样保留写回**，不丢弃。
- `$schema`：读取时保留原值；若原文件缺失，写入时补 `"https://opencode.ai/config.json"`。
- `tools`（键为工具名、值为 boolean）：用「工具名 → 开关」的键值编辑器覆盖。

deprecated 字段不在导航表单中展示，仅通过上述保留机制维持原状；如需修改由用户手动处理。

### 保存前校验

用内置 schema 跑 `ajv` 校验；发现未知顶层键或类型错误时给出警告，但允许「强制保存」。

### 原始 JSON 弹窗

只读展示 `JSON.stringify(draft, null, 2)`，由顶部按钮唤起。

## 6. 界面结构与导航

左侧固定导航 + 右侧内容区 + 顶部工具条。

### 顶部工具条

- 配置文件路径显示。
- 保存按钮。
- `查看原始 JSON` 按钮（只读弹窗）。
- 保存状态提示（已修改 / 已保存）。

### 左侧导航

1. 常规：`shell`、`username`、`logLevel`、`share`、`autoupdate`、`snapshot`、`default_agent`、`disabled_providers`、`enabled_providers`、`subagent_depth`
2. 模型：`model`、`small_model`
3. Provider：`provider`（`opencode.json` 中的 provider 配置）
4. 服务商凭证：已连接服务商列表，删除 / 修改密钥（`auth.json`，见第 8 节）
5. MCP 服务：`mcp`
6. 权限：`permission`
7. Agents：`agent`
8. Commands：`command`
9. Skills 与 References：`skills`、`references`、`instructions`
10. 插件与工具：`plugin`、`formatter`、`lsp`
11. 高级：`server`、`watcher`、`attachment`、`tool_output`、`compaction`、`experimental`、`enterprise`
12. 文件管理

每个导航项是一屏表单，切换不丢草稿。

## 7. 文件读写

- **读取**：`jsonc-parser` 解析，兼容注释与尾逗号，避免读崩现有 jsonc 文件。
- **写入**：`JSON.stringify(draft, null, 2)` 后直接覆盖，不做备份；实现为「写临时文件 → rename」的原子写，避免写一半损坏。
- **生效提示**：保存成功后明确提示 opencode 配置不热重载，需重启 opencode 才生效。

## 8. 服务商凭证管理

`/connect` 连接的凭证由 opencode 存于 `~/.local/share/opencode/auth.json`（遵循 XDG：优先 `$XDG_DATA_HOME/opencode/auth.json`，否则 `~/.local/share/opencode/auth.json`）。本应用管理**已存在**的凭证条目：

- **展示**：读取 auth.json，列出每个 provider 的 ID 与类型（`api` / `oauth`）。密钥脱敏显示（仅显示末 4 位，如 `••••abcd`），完整值不进入 UI、不写日志。
- **修改密钥**：仅对 `type: "api"` 的条目开放；输入新 key 后覆盖写回。`type: "oauth"` 条目不可改密钥，仅提示需在 opencode 中重新 `/connect`。
- **删除**：二次确认后从 auth.json 移除该 provider 条目（等价于登出）。
- **新增**：不在应用内提供，UI 提示用户运行 `/connect` 或 `opencode auth login`。
- **写入**：直接覆盖 auth.json，保持文件权限 `0600`，采用「写临时文件 → rename」原子写。
- 与第 3 项 Provider 页的区别：Provider 页编辑 `opencode.json` 的 `provider` 字段（自定义 provider / baseURL / 模型），凭证页管理 `auth.json` 的认证信息。

## 9. 文件管理页

- 扫描 `agent(s)/`、`command(s)/`、`skill(s)/` 三个目录，列表展示文件名与路径。
- 操作：
  - 新建：按类型生成带 frontmatter 模板的文件。
  - 重命名：move 操作。
  - 删除：二次确认后删除。
  - 用系统编辑器打开：`shell.openPath`。
- 内容不在应用内编辑。

## 10. 错误处理

目录 / 文件不存在、无写权限、JSON 解析失败等情况，在顶部以告警条展示，并提供「查看原始文件内容」入口，不静默失败。auth.json 不存在或为空时，凭证页展示空状态并提示用 `/connect` 添加，不报错。

## 11. 测试策略

- 框架：Vitest + jsdom + `@testing-library/react`。
- 单测：
  - `config/paths`：路径解析（XDG 优先、文件探测、默认目标）。
  - `config/io`：在临时目录内读写、jsonc 解析、原子写。
  - `auth/io`：auth.json 的读取、删除、改密钥、文件权限 `0600`。
  - schema 校验逻辑。
- 关键回归测试：**读 → 草稿 → 写 的 round-trip 不改变未编辑字段**（防止表单丢字段）。
- 组件测试：permission 下拉、plugin 元组、mcp 类型切换、凭证脱敏显示等易错控件。
- 不做 Electron E2E（后续有需要再加 Playwright）。

## 12. 平台与打包

- 以 macOS / Linux 的 `~/.config/opencode` 为主，路径逻辑按 XDG 编写，Windows 后续按实测调整。
- 打包沿用脚手架 electron-builder 配置。

## 13. 后续可扩展点（本期不做）

- 项目级配置支持。
- 原始 JSON 可编辑 + 双向同步。
- agent/command/skill 正文的内嵌编辑。
- 运行时拉取最新 schema + 未覆盖字段兜底编辑器。
- 配置备份 / JSONC 注释保留。
- 应用内新增凭证与 OAuth 登录流程。
