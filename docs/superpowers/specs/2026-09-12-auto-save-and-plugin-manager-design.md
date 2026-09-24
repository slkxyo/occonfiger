# 配置立即生效与插件管理 设计文档

日期：2026-09-12
状态：待评审

## 背景

OCConfiger 目前采用「草稿 + 脏标记 + 未保存对话框」的保存模型：配置页修改进入 `configStore.draft`，离开页面时弹窗询问，点保存才写入 `opencode.jsonc`。用户希望配置类页面改为**立即生效**，同时新增一个**插件管理**页面。

opencode 1.18.30 的配置 schema 中 `plugin` 为字符串（或带选项）数组，**没有原生禁用字段**（上游 `disabled_plugins` 的 PR 尚未合并）。因此「停用插件」需要由本应用在配置之外自行记录。

## 目标

1. 配置类页面（MCP 服务、设置）的修改立即写入 `opencode.jsonc`，无需保存按钮。
2. 新增插件管理页面：列出、删除、快速启用/停用 `plugin` 数组中的插件，启用的插件在列表中置顶。
3. SKILL 管理与全局提示词保持手动保存，行为不变。

## 非目标

- 不做插件安装/新增入口（删除后如需重新添加，由用户自行编辑配置或用 `opencode plugin` 命令）。
- 不管理 `~/.config/opencode/plugins/` 目录下的本地插件（它们自动加载，无法通过配置启停）。
- 不改造写入层为保留注释的增量编辑。
- 不改动 SKILL 管理与全局提示词的保存方式，不新增离开页面拦截。

## 一、配置立即生效

### 状态模型（`configStore.ts`）

移除：`original`、`dirty`、`markSaved`、`discardChanges`。

保留：`draft`、`setField`、`deleteField`。

新增：

- `revision: number`：每次字段变更自增，供保存副作用监听。
- `saveDelay: number`：本次变更的写盘延迟，`0` 表示立即，`600` 表示防抖。
- `saveState: 'idle' | 'saving' | 'saved' | 'error'`。
- `saveErrors: string[]`。

`setField(path, value, options?)` 与 `deleteField(path, options?)` 接受可选的 `{ immediate?: boolean }`，据此设置 `saveDelay`。`saveDelay` 以最近一次变更为准，用于连续输入与立即操作混合时的调度决策。

### 写盘时机

- 立即（`immediate: true`）：`SwitchField`、`SelectField`、`TagsField` 的增删、`ListEditor` 的增删、`KeyValueEditor` 的增删。
- 防抖 600ms：`TextField`、`NumberField`、多行 `Textarea` 的 `onChange`；同时在其 `onBlur` 触发一次立即保存。

### 保存副作用（`useAutoSave`）

新增 `src/renderer/src/hooks/useAutoSave.ts` 取代 `useSaveConfig.ts`：

- 监听 `revision`，按 `saveDelay` 调度保存（`0` 立即，否则防抖 600ms）。
- 保存流程：`normalizeDraft(draft)` → `window.api.saveConfig(normalized, false)`。
- 成功：`saveState = 'saved'`，清空 `saveErrors`，提示「已保存，需重启 opencode 生效」。
- 失败：`saveState = 'error'`，保留用户输入与 `draft`，展示校验错误；提供「强制保存」按钮调用 `saveConfig(data, true)`。

### App 调整（`App.tsx`）

- 移除 `pendingNav`、`dirty` 拦截、`confirmSave`、`discardAndLeave`。
- 移除 `UnsavedChangesDialog` 的渲染与组件文件及其测试。
- 顶部保留：加载错误条、校验错误条（含「强制保存」）、保存状态文本。

### 保持不变

- SKILL 管理（`FileManagerPage`）与全局提示词（`AgentsPage`）维持页面内手动保存按钮与 `dirty` 提示。
- `McpPage`、`SettingsPage` 基于 `useField` 的实现基本不变，仅调整文本输入控件以支持失焦/防抖提交。

## 二、插件管理

### 停用记录（应用侧）

- 新增路径 `ConfigPaths.disabledPluginsFile = <configDir>/.occonfiger/disabled-plugins.json`。
- 结构：`{ "disabled": [<原始 spec>] }`，保存插件在 `plugin` 数组中的原始值（字符串、`[pkg, options]` 或 `{ package, options }`），以便启用时原样还原。
- 位于 `.occonfiger/`（非 `.opencode/`），opencode 不读取该目录，不污染 `opencode.jsonc`。

### 主进程模块（`src/main/config/plugins.ts`）

- `pluginName(spec)`：从 spec 提取展示名——字符串取自身；数组取第一项；对象取 `package`。
- `listPlugins(configFile, disabledFile)`：读取 `plugin` 数组与停用记录，合并返回 `{ name, enabled, spec }[]`，启用的在前。
- `setPluginEnabled(configFile, disabledFile, name, enabled)`：
  - 停用：从 `plugin` 数组移除匹配项并存入停用记录。
  - 启用：从停用记录取出该项并追加回 `plugin` 数组。
- `deletePlugin(configFile, disabledFile, name)`：从 `plugin` 数组与停用记录中同时移除。
- 写回复用 `writeConfig`；所有操作幂等；找不到目标时静默成功。

### IPC 与 preload

- 新增通道：`plugins:list`、`plugins:setEnabled`、`plugins:delete`。
- `Api` 新增：`listPlugins()`、`setPluginEnabled(name, enabled)`、`deletePlugin(name)`。

### 页面（`src/renderer/src/pages/PluginPage.tsx`）

- 立即生效，无保存按钮；每次操作后重新拉取列表。
- 列表：启用的在前，停用的在后；停用项淡化并标注「已停用」。
- 每项：名称（等宽字体）、启用开关、删除按钮（二次确认）。
- 空状态与错误提示。
- 无添加插件入口。

### 导航

`App.tsx` 的 `NAV` 在「设置」之后插入 `{ id: 'plugins', label: '插件管理' }`，最终顺序：

MCP 服务 → 全局提示词 → 设置 → 插件管理 → 查看原始 JSON → 服务商凭证 → SKILL 管理。

## 影响文件

新增：

- `src/main/config/plugins.ts`、`src/main/config/plugins.test.ts`
- `src/renderer/src/hooks/useAutoSave.ts`、`useAutoSave.test.tsx`
- `src/renderer/src/pages/PluginPage.tsx`、`PluginPage.test.tsx`

修改：

- `src/main/config/paths.ts` 及其测试（新增 `disabledPluginsFile`）
- `src/main/ipc.ts`、`src/main/ipc.test.ts`
- `src/shared/ipc-channels.ts`、`ipc-channels.test.ts`
- `src/preload/api.ts`、`src/preload/index.test.ts`
- `src/renderer/src/store/configStore.ts` 及其测试
- `src/renderer/src/fields/useField.ts`、`controls.tsx`、`KeyValueEditor.tsx`、`ListEditor.tsx`
- `src/renderer/src/App.tsx`、`App.test.tsx`
- `src/renderer/src/pages/McpPage.tsx`、`SettingsPage.tsx`（如受影响）

删除：

- `src/renderer/src/hooks/useSaveConfig.ts` 及其测试
- `src/renderer/src/components/UnsavedChangesDialog.tsx` 及其测试

## 测试策略

- `plugins.test.ts`：列表合并、停用移出并记录、启用还原、彻底删除、对象项原样还原、幂等、停用记录缺失/损坏时的容错。
- `configStore.test.ts`：`revision`/`saveDelay` 行为，移除旧字段后无残留引用。
- `useAutoSave.test.tsx`：防抖合并、立即写盘、成功状态、校验失败保留输入、强制保存。
- `PluginPage.test.tsx`：启用置顶排序、切换调用、删除二次确认。
- `ipc.test.ts`、`ipc-channels.test.ts`、`preload/index.test.ts`：新通道与 API 映射。
- `App.test.tsx`：移除未保存拦截后的导航行为。

## 已知限制

- 立即写盘沿用 `JSON.stringify`，会丢弃 `opencode.jsonc` 中已有的注释。若需保留注释，需后续将写入层改为 jsonc-parser 增量编辑。
- 停用记录与配置文件分离，若用户手工编辑配置，两者可能不同步；列表以配置文件为准并做容错。
