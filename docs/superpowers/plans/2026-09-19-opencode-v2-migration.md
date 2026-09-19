# opencode V2 配置格式迁移 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 OCConfiger 从面向 opencode V1 配置格式切换为 V2，覆盖内置 Schema、MCP 页面、插件、权限编辑器。

**Architecture:** 以 `anomalyco/opencode` dev 分支源码为权威依据，重写内置 JSON Schema，并把三个编辑页面（MCP/插件/权限）的字段路径与结构迁移到 V2。权限部分新建一个规则列表编辑器组件，遵循现有 Chakra UI 设计语言。

**Tech Stack:** Electron + React 19 + TypeScript + Chakra UI 3 + zustand + vitest。

**Spec:** `docs/superpowers/specs/2026-09-19-opencode-v2-migration-design.md`

## Global Constraints

- 不考虑 V1 兼容、不做 V1→V2 迁移功能。
- `autoupdate` 字段在 V2 中保留，不改。
- MCP 超时只编辑 `timeout.request` 单值。
- 权限做成完整规则列表编辑器（action/resource/effect + 排序 + 增删）。
- 所有文案用简体中文；UI 遵循现有设计 token（`border.default`、`borderRadius.card`、`bg.default`、等宽字体 `fontFamily.mono`）。
- 现有测试框架为 vitest + @testing-library/react + user-event，测试用 `useConfigStore.getState().loadConfig(...)` 预置状态。

## Review Focus

1. **MCP `disabled` 取反**：`enabled`(V1) → `disabled`(V2) 语义取反，未设置(`undefined`) = 启用。开关必须正确处理 undefined/false/true 三态。
2. **权限规则顺序**：`findLast` 匹配，最后一条匹配生效。排序按钮必须真正改变数组顺序。
3. **权限 `action:"*"` 与 `resource:"*"` 通配**：`*` 是合法值，不得被当作空值清除。
4. **插件对象形式 `{package, options}`**：`pluginName` 必须从 `package` 提取名称，不得误判为无名。
5. **Schema 严格性**：V1 遗留字段（`plugin`、`permission` 单数、`mcp` 扁平）应被校验拒绝；空对象 `{}` 必须仍通过。

---

## File Structure

- **重写** `resources/schema/opencode-config.schema.json` — V2 JSON Schema（校验唯一依据）。
- **修改** `src/main/schema/validate.ts` — 移除 models.dev stub。
- **修改** `src/main/config/plugins.ts` — `plugin`→`plugins`。
- **修改** `src/renderer/src/pages/McpPage.tsx` — 路径 `mcp.servers`、`disabled`、`timeout.request`。
- **新建** `src/renderer/src/components/PermissionRulesEditor.tsx` — 权限规则列表编辑器。
- **修改** `src/renderer/src/pages/SettingsPage.tsx` — 接入权限编辑器，移除旧下拉。
- **删除** `src/renderer/src/store/permission.ts`、`src/renderer/src/store/permission.test.ts`。
- **修改** `src/renderer/src/App.tsx` — 移除 `permissionDefault` 与 `setField`。
- **测试** 同步更新 `validate.test.ts`、`plugins.test.ts`、`ipc.test.ts`、`McpPage.test.tsx`、`SettingsPage.test.tsx`；新建 `PermissionRulesEditor.test.tsx`。

---

## Task 1: 重写内置 V2 Schema 与校验

**Files:**
- Rewrite: `resources/schema/opencode-config.schema.json`
- Modify: `src/main/schema/validate.ts`
- Test: `src/main/schema/validate.test.ts`

**Interfaces:**
- Produces: 内置 schema 文件（`loadBuiltinSchema()` 仍通过现有三路径候选加载）；`validateConfig(data)` 签名不变，仍返回 `{valid, errors}`。

- [ ] **Step 1: 用以下完整内容重写 schema 文件**

写入 `resources/schema/opencode-config.schema.json`（整体覆盖）：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$ref": "#/$defs/Config",
  "$defs": {
    "PermissionEffect": { "type": "string", "enum": ["allow", "ask", "deny"] },
    "PermissionRule": {
      "type": "object",
      "properties": {
        "action": { "type": "string" },
        "resource": { "type": "string" },
        "effect": { "$ref": "#/$defs/PermissionEffect" }
      },
      "required": ["action", "resource", "effect"],
      "additionalProperties": false
    },
    "AgentConfig": {
      "type": "object",
      "properties": {
        "model": { "type": "string" },
        "variant": { "type": "string" },
        "request": {
          "type": "object",
          "properties": {
            "headers": { "type": "object", "additionalProperties": { "type": "string" } },
            "body": { "type": "object" }
          },
          "additionalProperties": false
        },
        "system": { "type": "string" },
        "description": { "type": "string" },
        "mode": { "type": "string", "enum": ["subagent", "primary", "all"] },
        "hidden": { "type": "boolean" },
        "color": {
          "anyOf": [
            { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" },
            { "type": "string", "enum": ["primary", "secondary", "accent", "success", "warning", "error", "info"] }
          ]
        },
        "steps": { "type": "integer", "exclusiveMinimum": 0 },
        "disabled": { "type": "boolean" },
        "permissions": { "type": "array", "items": { "$ref": "#/$defs/PermissionRule" } }
      },
      "additionalProperties": false
    },
    "McpTimeout": {
      "type": "object",
      "properties": {
        "startup": { "type": "integer", "exclusiveMinimum": 0 },
        "request": { "type": "integer", "exclusiveMinimum": 0 }
      },
      "additionalProperties": false
    },
    "McpOAuth": {
      "type": "object",
      "properties": {
        "client_id": { "type": "string" },
        "client_secret": { "type": "string" },
        "scope": { "type": "string" },
        "callback_port": { "type": "integer", "minimum": 1, "maximum": 65535 },
        "redirect_uri": { "type": "string" }
      },
      "additionalProperties": false
    },
    "McpLocal": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["local"] },
        "command": { "type": "array", "items": { "type": "string" } },
        "cwd": { "type": "string" },
        "environment": { "type": "object", "additionalProperties": { "type": "string" } },
        "disabled": { "type": "boolean" },
        "timeout": { "$ref": "#/$defs/McpTimeout" }
      },
      "required": ["type", "command"],
      "additionalProperties": false
    },
    "McpRemote": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["remote"] },
        "url": { "type": "string" },
        "headers": { "type": "object", "additionalProperties": { "type": "string" } },
        "oauth": {
          "anyOf": [
            { "$ref": "#/$defs/McpOAuth" },
            { "type": "boolean", "enum": [false] }
          ]
        },
        "disabled": { "type": "boolean" },
        "timeout": { "$ref": "#/$defs/McpTimeout" }
      },
      "required": ["type", "url"],
      "additionalProperties": false
    },
    "McpConfig": {
      "type": "object",
      "properties": {
        "timeout": { "$ref": "#/$defs/McpTimeout" },
        "servers": {
          "type": "object",
          "additionalProperties": {
            "anyOf": [
              { "$ref": "#/$defs/McpLocal" },
              { "$ref": "#/$defs/McpRemote" }
            ]
          }
        }
      },
      "additionalProperties": false
    },
    "CompactionConfig": {
      "type": "object",
      "properties": {
        "auto": { "type": "boolean" },
        "prune": { "type": "boolean" },
        "keep": {
          "type": "object",
          "properties": { "tokens": { "type": "integer", "minimum": 0 } },
          "additionalProperties": false
        },
        "buffer": { "type": "integer", "minimum": 0 }
      },
      "additionalProperties": false
    },
    "CommandConfig": {
      "type": "object",
      "properties": {
        "template": { "type": "string" },
        "description": { "type": "string" },
        "agent": { "type": "string" },
        "model": { "type": "string" },
        "variant": { "type": "string" },
        "subtask": { "type": "boolean" }
      },
      "required": ["template"],
      "additionalProperties": false
    },
    "ReferenceGit": {
      "type": "object",
      "properties": {
        "repository": { "type": "string" },
        "branch": { "type": "string" },
        "description": { "type": "string" },
        "hidden": { "type": "boolean" }
      },
      "required": ["repository"],
      "additionalProperties": false
    },
    "ReferenceLocal": {
      "type": "object",
      "properties": {
        "path": { "type": "string" },
        "description": { "type": "string" },
        "hidden": { "type": "boolean" }
      },
      "required": ["path"],
      "additionalProperties": false
    },
    "FormatterEntry": {
      "type": "object",
      "properties": {
        "disabled": { "type": "boolean" },
        "command": { "type": "array", "items": { "type": "string" } },
        "environment": { "type": "object", "additionalProperties": { "type": "string" } },
        "extensions": { "type": "array", "items": { "type": "string" } }
      },
      "additionalProperties": false
    },
    "LspServer": {
      "type": "object",
      "properties": {
        "command": { "type": "array", "items": { "type": "string" } },
        "extensions": { "type": "array", "items": { "type": "string" } },
        "disabled": { "type": "boolean" },
        "env": { "type": "object", "additionalProperties": { "type": "string" } },
        "initialization": { "type": "object" }
      },
      "required": ["command"],
      "additionalProperties": false
    },
    "WatcherConfig": {
      "type": "object",
      "properties": { "ignore": { "type": "array", "items": { "type": "string" } } },
      "additionalProperties": false
    },
    "ToolOutputConfig": {
      "type": "object",
      "properties": {
        "max_lines": { "type": "integer", "exclusiveMinimum": 0 },
        "max_bytes": { "type": "integer", "exclusiveMinimum": 0 }
      },
      "additionalProperties": false
    },
    "AttachmentsConfig": {
      "type": "object",
      "properties": {
        "image": {
          "type": "object",
          "properties": {
            "auto_resize": { "type": "boolean" },
            "max_width": { "type": "integer", "exclusiveMinimum": 0 },
            "max_height": { "type": "integer", "exclusiveMinimum": 0 },
            "max_base64_bytes": { "type": "integer", "exclusiveMinimum": 0 }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    },
    "PluginEntry": {
      "type": "object",
      "properties": {
        "package": { "type": "string" },
        "options": { "type": "object" }
      },
      "required": ["package"],
      "additionalProperties": false
    },
    "PolicyEffect": { "type": "string", "enum": ["allow", "deny"] },
    "ExperimentalPolicy": {
      "type": "object",
      "properties": {
        "action": { "type": "string" },
        "effect": { "$ref": "#/$defs/PolicyEffect" },
        "resource": { "type": "string" }
      },
      "required": ["action", "effect", "resource"],
      "additionalProperties": false
    },
    "Config": {
      "type": "object",
      "properties": {
        "$schema": { "type": "string" },
        "shell": { "type": "string" },
        "model": { "type": "string" },
        "default_agent": { "type": "string" },
        "autoupdate": { "anyOf": [{ "type": "boolean" }, { "type": "string", "enum": ["notify"] }] },
        "share": { "type": "string", "enum": ["manual", "auto", "disabled"] },
        "enterprise": {
          "type": "object",
          "properties": { "url": { "type": "string" } },
          "additionalProperties": false
        },
        "username": { "type": "string" },
        "permissions": { "type": "array", "items": { "$ref": "#/$defs/PermissionRule" } },
        "agents": { "type": "object", "additionalProperties": { "$ref": "#/$defs/AgentConfig" } },
        "snapshots": { "type": "boolean" },
        "watcher": { "$ref": "#/$defs/WatcherConfig" },
        "formatter": {
          "anyOf": [
            { "type": "boolean" },
            { "type": "object", "additionalProperties": { "$ref": "#/$defs/FormatterEntry" } }
          ]
        },
        "lsp": {
          "anyOf": [
            { "type": "boolean" },
            {
              "type": "object",
              "additionalProperties": {
                "anyOf": [
                  { "type": "object", "properties": { "disabled": { "type": "boolean", "enum": [true] } }, "required": ["disabled"], "additionalProperties": false },
                  { "$ref": "#/$defs/LspServer" }
                ]
              }
            }
          ]
        },
        "attachments": { "$ref": "#/$defs/AttachmentsConfig" },
        "tool_output": { "$ref": "#/$defs/ToolOutputConfig" },
        "mcp": { "$ref": "#/$defs/McpConfig" },
        "compaction": { "$ref": "#/$defs/CompactionConfig" },
        "skills": { "type": "array", "items": { "type": "string" } },
        "commands": { "type": "object", "additionalProperties": { "$ref": "#/$defs/CommandConfig" } },
        "instructions": { "type": "array", "items": { "type": "string" } },
        "references": {
          "type": "object",
          "additionalProperties": {
            "anyOf": [
              { "type": "string" },
              { "$ref": "#/$defs/ReferenceGit" },
              { "$ref": "#/$defs/ReferenceLocal" }
            ]
          }
        },
        "plugins": {
          "type": "array",
          "items": {
            "anyOf": [
              { "type": "string" },
              { "$ref": "#/$defs/PluginEntry" }
            ]
          }
        },
        "experimental": {
          "type": "object",
          "properties": {
            "policies": { "type": "array", "items": { "$ref": "#/$defs/ExperimentalPolicy" } }
          },
          "additionalProperties": false
        },
        "providers": { "type": "object" }
      },
      "additionalProperties": false
    }
  },
  "allowComments": true,
  "allowTrailingCommas": true
}
```

- [ ] **Step 2: 更新校验 stubs**

修改 `src/main/schema/validate.ts`，删除 `externalStubs`（V2 schema 不再引用 models.dev）：

```ts
import Ajv2020 from 'ajv/dist/2020'
import type { ValidateFunction } from 'ajv'
import { loadBuiltinSchema } from './builtin'

export type ValidationResult = { valid: boolean; errors: string[] }

let cached: ValidateFunction | null = null

function getValidator(): ValidateFunction {
  if (cached) return cached
  const ajv = new Ajv2020({ allErrors: true, strict: false, allowUnionTypes: true })
  cached = ajv.compile(loadBuiltinSchema())
  return cached
}

export function validateConfig(data: unknown): ValidationResult {
  const validate = getValidator()
  const valid = validate(data) as boolean
  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath || '/'} ${e.message ?? 'invalid'}`
  )
  return { valid, errors }
}
```

- [ ] **Step 3: 重写测试**

用以下内容覆盖 `src/main/schema/validate.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { loadBuiltinSchema } from './builtin'
import { validateConfig } from './validate'

describe('validateConfig', () => {
  it('loads the bundled schema', () => {
    const schema = loadBuiltinSchema() as { $defs?: unknown }
    expect(schema.$defs).toBeDefined()
  })

  it('accepts an empty object', () => {
    expect(validateConfig({}).valid).toBe(true)
  })

  it('rejects an unknown top-level key', () => {
    const result = validateConfig({ totally_unknown: 1 })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('accepts a V2 mcp.servers structure', () => {
    expect(
      validateConfig({
        mcp: { servers: { exa: { type: 'remote', url: 'https://x' } } }
      }).valid
    ).toBe(true)
  })

  it('rejects V1 flat mcp structure', () => {
    expect(validateConfig({ mcp: { exa: { type: 'remote', url: 'https://x' } } }).valid).toBe(false)
  })

  it('accepts a V2 plugins array with object entries', () => {
    expect(
      validateConfig({ plugins: ['a', { package: 'b', options: { x: 1 } }] }).valid
    ).toBe(true)
  })

  it('rejects V1 singular plugin field', () => {
    expect(validateConfig({ plugin: ['a'] }).valid).toBe(false)
  })

  it('accepts V2 permissions array', () => {
    expect(
      validateConfig({ permissions: [{ action: '*', resource: '*', effect: 'ask' }] }).valid
    ).toBe(true)
  })

  it('rejects V1 grouped permission object', () => {
    expect(validateConfig({ permission: { '*': 'allow' } }).valid).toBe(false)
  })
})
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest run src/main/schema/validate.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add resources/schema/opencode-config.schema.json src/main/schema/validate.ts src/main/schema/validate.test.ts
git commit -m "feat: 将内置 schema 切换为 opencode V2 格式"
```

---

## Task 2: 插件字段 plugin → plugins

**Files:**
- Modify: `src/main/config/plugins.ts:39-47`
- Test: `src/main/config/plugins.test.ts`
- Test: `src/main/ipc.test.ts:196-220`

**Interfaces:**
- Consumes: 无（独立）。
- Produces: `listPlugins` / `setPluginEnabled` / `deletePlugin` 签名不变，内部读写 `data.plugins`。

- [ ] **Step 1: 改实现**

修改 `src/main/config/plugins.ts`，`readPluginArray` 与 `writePluginArray` 使用 `plugins` 字段：

```ts
function readPluginArray(configFile: string): unknown[] {
  const data = readConfig(configFile).data
  return Array.isArray(data.plugins) ? data.plugins : []
}

function writePluginArray(configFile: string, plugins: unknown[]): void {
  const data = readConfig(configFile).data
  writeConfig(configFile, { ...data, plugins })
}
```

`pluginName` 函数保持不变（已支持 string / tuple / `{package}` 三种形态）。

- [ ] **Step 2: 改 plugins 测试**

覆盖 `src/main/config/plugins.test.ts`：将 `pluginArray()` helper 与所有 `writeConfig(configFile, { plugin: ... })` 改为 `plugins`：

```ts
function pluginArray(): unknown[] {
  const data = readConfig(configFile).data
  return Array.isArray(data.plugins) ? data.plugins : []
}
```

其余用例数据同步替换：`{ plugin: ['a', ['b', { x: 1 }]] }` → `{ plugins: ['a', { package: 'b', options: { x: 1 } }] }`，`{ plugin: ['a', 'b'] }` → `{ plugins: ['a', 'b'] }`，`{ model: 'a/b', plugin: ['x'] }` → `{ model: 'a/b', plugins: ['x'] }`。`pluginName` 相关断言保留（`pluginName(['opencode-acme', { strict: true }])` 仍返回 `'opencode-acme'`）。

- [ ] **Step 3: 改 ipc 测试**

修改 `src/main/ipc.test.ts` 第 201 行：`writeConfig(configFile, { plugin: ['a', 'b'] })` → `writeConfig(configFile, { plugins: ['a', 'b'] })`。

- [ ] **Step 4: 运行测试**

Run: `pnpm vitest run src/main/config/plugins.test.ts src/main/ipc.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/main/config/plugins.ts src/main/config/plugins.test.ts src/main/ipc.test.ts
git commit -m "feat: 插件配置字段 plugin 迁移为 plugins"
```

---

## Task 3: MCP 页面字段改造

**Files:**
- Modify: `src/renderer/src/pages/McpPage.tsx`
- Test: `src/renderer/src/pages/McpPage.test.tsx`

**Interfaces:**
- Consumes: Task 1 的 V2 schema（校验通过）；`useField` / `ListEditor` 接口不变。
- Produces: 页面读写 `mcp.servers.<name>` 结构，`disabled` 语义、`timeout.request` 单值。

- [ ] **Step 1: 改 McpPage 实现**

用以下内容整体覆盖 `src/renderer/src/pages/McpPage.tsx`：

```tsx
import { Switch } from '@chakra-ui/react'
import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { KeyValueEditor } from '../components/KeyValueEditor'
import { OAuthField, SelectField, TagsField, TextField } from '../fields/controls'
import { useField } from '../fields/useField'
import { ConfigViewButton } from '../components/ConfigViewButton'

function EnabledSwitch({ server }: { server: string }): React.JSX.Element {
  const { value, set, clear } = useField(['mcp', 'servers', server, 'disabled'])
  return (
    <Switch.Root
      checked={value !== true}
      onCheckedChange={(e) =>
        e.checked ? clear({ immediate: true }) : set(true, { immediate: true })
      }
    >
      <Switch.HiddenInput aria-label={`${server} 启用`} />
      <Switch.Control />
    </Switch.Root>
  )
}

function McpCard({ server }: { server: string }): React.JSX.Element {
  const { value } = useField(['mcp', 'servers', server, 'type'])
  const type = typeof value === 'string' ? value : 'local'
  return (
    <>
      <SelectField
        path={['mcp', 'servers', server, 'type']}
        label="类型"
        options={['local', 'remote']}
        allowEmpty={false}
      />
      {type === 'local' ? (
        <>
          <TagsField path={['mcp', 'servers', server, 'command']} label="命令" placeholder="回车添加参数" />
          <TextField path={['mcp', 'servers', server, 'cwd']} label="工作目录" />
          <KeyValueEditor path={['mcp', 'servers', server, 'environment']} label="环境变量" valueLabel="值" />
        </>
      ) : (
        <>
          <TextField path={['mcp', 'servers', server, 'url']} label="URL" />
          <KeyValueEditor path={['mcp', 'servers', server, 'headers']} label="请求头" valueLabel="值" />
          <OAuthField
            path={['mcp', 'servers', server, 'oauth']}
            label="OAuth"
            description="勾选写入 false 以禁用自动检测；取消勾选移除配置，恢复自动检测。"
            objectHint="当前为 OAuth 对象配置，暂不支持可视化编辑"
          />
        </>
      )}
      <TextField
        path={['mcp', 'servers', server, 'timeout', 'request']}
        label="请求超时（毫秒）"
      />
    </>
  )
}

function sortByEnabled(keys: string[], container: Record<string, unknown>): string[] {
  return [...keys].sort((a, b) => {
    const av = (container[a] as { disabled?: unknown } | undefined)?.disabled
    const bv = (container[b] as { disabled?: unknown } | undefined)?.disabled
    return (av === true ? 1 : 0) - (bv === true ? 1 : 0)
  })
}

export function McpPage(): React.JSX.Element {
  return (
    <Section
      title="MCP 服务"
      description="Model Context Protocol 服务器配置。"
      action={<ConfigViewButton />}
    >
      <ListEditor
        path={['mcp', 'servers']}
        collapsible
        defaultCollapsed
        sortKeys={sortByEnabled}
        titleAccessory={(server) => <EnabledSwitch server={server} />}
      >
        {(server) => <McpCard server={server} />}
      </ListEditor>
    </Section>
  )
}
```

- [ ] **Step 2: 改测试**

用以下内容整体覆盖 `src/renderer/src/pages/McpPage.test.tsx`：

```tsx
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { McpPage } from './McpPage'

async function expand(name: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: `展开 ${name}` }))
}

describe('McpPage', () => {
  afterEach(() => cleanup())

  beforeEach(() =>
    useConfigStore
      .getState()
      .loadConfig({ mcp: { servers: { exa: { type: 'remote', url: 'https://x' } } } })
  )

  it('collapses server details by default', () => {
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    expect(screen.queryByLabelText('URL')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '展开 exa' })).toBeInTheDocument()
  })

  it('renders remote fields for a remote server after expanding', async () => {
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await expand('exa')
    expect(screen.getByLabelText('URL')).toBeInTheDocument()
    expect(screen.queryByLabelText('命令')).not.toBeInTheDocument()
  })

  it('renders local environment as a key-value editor', async () => {
    useConfigStore
      .getState()
      .loadConfig({ mcp: { servers: { s: { type: 'local', environment: { FOO: 'bar' } } } } })
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await expand('s')
    expect(screen.getByLabelText('环境变量 值 FOO')).toHaveValue('bar')
  })

  it('renders remote headers as a key-value editor', async () => {
    useConfigStore.getState().loadConfig({
      mcp: { servers: { exa: { type: 'remote', url: 'https://x', headers: { 'X-Token': 'abc' } } } }
    })
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await expand('exa')
    expect(screen.getByLabelText('请求头 值 X-Token')).toHaveValue('abc')
  })

  it('writes false when disabling auto-detection and removes the key when re-enabled', async () => {
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await expand('exa')
    const oauth = screen.getByRole('checkbox', { name: '禁用自动检测' })
    expect(oauth).not.toBeChecked()
    await userEvent.click(oauth)
    expect(useConfigStore.getState().draft.mcp).toEqual({
      servers: { exa: { type: 'remote', url: 'https://x', oauth: false } }
    })
    await userEvent.click(oauth)
    expect(useConfigStore.getState().draft.mcp).toEqual({
      servers: { exa: { type: 'remote', url: 'https://x' } }
    })
  })

  it('keeps an oauth object untouched and hides the switch', async () => {
    useConfigStore.getState().loadConfig({
      mcp: { servers: { exa: { type: 'remote', url: 'https://x', oauth: { client_id: 'abc' } } } }
    })
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await expand('exa')
    expect(screen.queryByRole('checkbox', { name: '禁用自动检测' })).not.toBeInTheDocument()
    expect(screen.getByText('当前为 OAuth 对象配置，暂不支持可视化编辑')).toBeInTheDocument()
    expect(useConfigStore.getState().draft.mcp).toEqual({
      servers: { exa: { type: 'remote', url: 'https://x', oauth: { client_id: 'abc' } } }
    })
  })

  it('shows the switch checked when oauth is false and removes the key when unchecked', async () => {
    useConfigStore.getState().loadConfig({
      mcp: { servers: { exa: { type: 'remote', url: 'https://x', oauth: false } } }
    })
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await expand('exa')
    const oauth = screen.getByRole('checkbox', { name: '禁用自动检测' })
    expect(oauth).toBeChecked()
    await userEvent.click(oauth)
    expect(useConfigStore.getState().draft.mcp).toEqual({
      servers: { exa: { type: 'remote', url: 'https://x' } }
    })
  })

  it('toggles disabled from the collapsed header', async () => {
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    const toggle = screen.getByRole('checkbox', { name: 'exa 启用' })
    expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    expect(useConfigStore.getState().draft.mcp).toEqual({
      servers: { exa: { type: 'remote', url: 'https://x', disabled: true } }
    })
    await userEvent.click(toggle)
    expect(useConfigStore.getState().draft.mcp).toEqual({
      servers: { exa: { type: 'remote', url: 'https://x' } }
    })
  })

  it('lists enabled servers before disabled ones', () => {
    useConfigStore.getState().loadConfig({
      mcp: {
        servers: {
          off: { type: 'local', disabled: true },
          on: { type: 'local' },
          explicit: { type: 'local', disabled: false }
        }
      }
    })
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    const names = screen
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'))
      .filter((label): label is string => typeof label === 'string' && /^(展开|折叠) /.test(label))
    expect(names).toEqual(['展开 on', '展开 explicit', '展开 off'])
  })

  it('does not offer a button to add a new server', () => {
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    expect(screen.queryByRole('button', { name: '添加 MCP 服务' })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 3: 运行测试**

Run: `pnpm vitest run src/renderer/src/pages/McpPage.test.tsx`
Expected: 全部 PASS。

- [ ] **Step 4: 提交**

```bash
git add src/renderer/src/pages/McpPage.tsx src/renderer/src/pages/McpPage.test.tsx
git commit -m "feat: MCP 页面迁移至 mcp.servers 结构"
```

---

## Task 4: 权限规则列表编辑器

**Files:**
- Create: `src/renderer/src/components/PermissionRulesEditor.tsx`
- Modify: `src/renderer/src/pages/SettingsPage.tsx`
- Delete: `src/renderer/src/store/permission.ts`, `src/renderer/src/store/permission.test.ts`
- Modify: `src/renderer/src/App.tsx`
- Test: `src/renderer/src/components/PermissionRulesEditor.test.tsx`
- Test: `src/renderer/src/pages/SettingsPage.test.tsx`

**Interfaces:**
- Consumes: `useConfigStore`（`draft`、`setField`）；`MenuSelect`（effect 下拉）。
- Produces: `PermissionRulesEditor` 组件（无 props，直接读写 `draft.permissions`），供 `SettingsPage` 使用。

- [ ] **Step 1: 写失败测试（新组件）**

创建 `src/renderer/src/components/PermissionRulesEditor.test.tsx`：

```tsx
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { PermissionRulesEditor } from './PermissionRulesEditor'
import { pickMenu } from '../test/menu'

describe('PermissionRulesEditor', () => {
  beforeEach(() =>
    useConfigStore
      .getState()
      .loadConfig({ permissions: [{ action: 'shell', resource: '*', effect: 'ask' }] })
  )
  afterEach(() => cleanup())

  it('renders existing rules', () => {
    render(
      <Provider>
        <PermissionRulesEditor />
      </Provider>
    )
    expect(screen.getByLabelText('权限动作 0')).toHaveValue('shell')
    expect(screen.getByLabelText('资源 0')).toHaveValue('*')
  })

  it('adds a rule', async () => {
    render(
      <Provider>
        <PermissionRulesEditor />
      </Provider>
    )
    await userEvent.click(screen.getByRole('button', { name: '添加规则' }))
    expect(useConfigStore.getState().draft.permissions).toHaveLength(2)
  })

  it('removes a rule', async () => {
    render(
      <Provider>
        <PermissionRulesEditor />
      </Provider>
    )
    await userEvent.click(screen.getByRole('button', { name: '删除规则 0' }))
    expect(useConfigStore.getState().draft.permissions).toHaveLength(0)
  })

  it('moves a rule down', async () => {
    useConfigStore.getState().loadConfig({
      permissions: [
        { action: 'read', resource: '*', effect: 'allow' },
        { action: 'edit', resource: '*', effect: 'ask' }
      ]
    })
    render(
      <Provider>
        <PermissionRulesEditor />
      </Provider>
    )
    await userEvent.click(screen.getByRole('button', { name: '下移规则 0' }))
    const actions = useConfigStore.getState().draft.permissions as { action: string }[]
    expect(actions.map((r) => r.action)).toEqual(['edit', 'read'])
  })

  it('shows empty state when no rules', () => {
    useConfigStore.getState().loadConfig({})
    render(
      <Provider>
        <PermissionRulesEditor />
      </Provider>
    )
    expect(screen.getByText('未配置权限规则')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm vitest run src/renderer/src/components/PermissionRulesEditor.test.tsx`
Expected: FAIL（`PermissionRulesEditor` 未定义）。

- [ ] **Step 3: 实现组件**

创建 `src/renderer/src/components/PermissionRulesEditor.tsx`：

```tsx
import { Box, Button, HStack, IconButton, Input, Text, VStack } from '@chakra-ui/react'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { Field } from '../fields/Field'
import { MenuSelect } from '../fields/MenuSelect'
import { useConfigStore } from '../store/configStore'
import { enterStyle } from './motion'

type Rule = { action: string; resource: string; effect: 'allow' | 'ask' | 'deny' }

const EFFECTS = ['allow', 'ask', 'deny']

const ACTION_SUGGESTIONS = [
  '*',
  'read',
  'edit',
  'write',
  'apply_patch',
  'glob',
  'grep',
  'list',
  'shell',
  'subagent',
  'todowrite',
  'webfetch',
  'websearch',
  'skill',
  'lsp',
  'question',
  'external_directory'
]

function asRules(value: unknown): Rule[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const obj = (typeof item === 'object' && item !== null ? item : {}) as Partial<Rule>
    return {
      action: typeof obj.action === 'string' ? obj.action : '',
      resource: typeof obj.resource === 'string' ? obj.resource : '*',
      effect: obj.effect === 'allow' || obj.effect === 'deny' ? obj.effect : 'ask'
    }
  })
}

export function PermissionRulesEditor(): React.JSX.Element {
  const draft = useConfigStore((s) => s.draft)
  const setField = useConfigStore((s) => s.setField)
  const rules = asRules(draft.permissions)

  const commit = (next: Rule[]): void => setField(['permissions'], next, { immediate: true })

  const update = (index: number, patch: Partial<Rule>): void => {
    const next = rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule))
    commit(next)
  }

  const remove = (index: number): void => commit(rules.filter((_, i) => i !== index))

  const move = (index: number, delta: number): void => {
    const target = index + delta
    if (target < 0 || target >= rules.length) return
    const next = [...rules]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    commit(next)
  }

  return (
    <Field
      label="权限规则"
      description="按顺序匹配，最后一条匹配的规则生效。action 支持通配 *。"
    >
      {rules.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          未配置权限规则
        </Text>
      ) : (
        <VStack align="stretch" gap="8px" mb="8px">
          {rules.map((rule, index) => (
            <Box
              key={index}
              className="oc-enter"
              style={enterStyle(index)}
              borderWidth="1px"
              borderColor="border.default"
              borderRadius="card"
              p="10px"
              bg="bg.default"
            >
              <HStack gap="8px" align="start">
                <Box w="140px" flexShrink={0}>
                  <Input
                    aria-label={`权限动作 ${index}`}
                    list="oc-permission-actions"
                    size="sm"
                    fontFamily="mono"
                    value={rule.action}
                    placeholder="action"
                    onChange={(e) => update(index, { action: e.target.value })}
                  />
                </Box>
                <Input
                  aria-label={`资源 ${index}`}
                  size="sm"
                  fontFamily="mono"
                  value={rule.resource}
                  placeholder="*"
                  onChange={(e) => update(index, { resource: e.target.value })}
                />
                <Box w="120px" flexShrink={0}>
                  <MenuSelect
                    ariaLabel={`效果 ${index}`}
                    options={EFFECTS}
                    value={rule.effect}
                    allowEmpty={false}
                    onChange={(v) => update(index, { effect: v as Rule['effect'] })}
                  />
                </Box>
                <HStack gap="2px" flexShrink={0}>
                  <IconButton
                    aria-label={`上移规则 ${index}`}
                    size="sm"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={14} />
                  </IconButton>
                  <IconButton
                    aria-label={`下移规则 ${index}`}
                    size="sm"
                    variant="ghost"
                    disabled={index === rules.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={14} />
                  </IconButton>
                  <IconButton
                    aria-label={`删除规则 ${index}`}
                    size="sm"
                    variant="ghost"
                    colorPalette="error"
                    onClick={() => remove(index)}
                  >
                    ×
                  </IconButton>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
      <datalist id="oc-permission-actions">
        {ACTION_SUGGESTIONS.map((action) => (
          <option key={action} value={action} />
        ))}
      </datalist>
      <Button size="sm" variant="outline" onClick={() => commit([...rules, { action: '', resource: '*', effect: 'ask' }])}>
        <Plus size={14} />
        添加规则
      </Button>
    </Field>
  )
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm vitest run src/renderer/src/components/PermissionRulesEditor.test.tsx`
Expected: 全部 PASS。

- [ ] **Step 5: 接入 SettingsPage 并移除旧权限逻辑**

用以下内容覆盖 `src/renderer/src/pages/SettingsPage.tsx`：

```tsx
import { Box, HStack, Switch, Text, VStack } from '@chakra-ui/react'
import { Section } from '../components/Section'
import { PermissionRulesEditor } from '../components/PermissionRulesEditor'
import { useField } from '../fields/useField'
import { ConfigViewButton } from '../components/ConfigViewButton'

function AutoUpdateSetting(): React.JSX.Element {
  const { value, set, clear } = useField(['autoupdate'])
  return (
    <HStack justify="space-between" align="start">
      <Box>
        <Text fontSize="sm" fontWeight="medium">
          自动更新
        </Text>
        <Text fontSize="xs" color="fg.muted">
          允许 opencode 自动检查并安装更新；关闭后需手动更新。
        </Text>
      </Box>
      <Switch.Root
        checked={value !== false}
        onCheckedChange={(e) =>
          e.checked ? clear({ immediate: true }) : set(false, { immediate: true })
        }
      >
        <Switch.HiddenInput aria-label="自动更新" />
        <Switch.Control />
      </Switch.Root>
    </HStack>
  )
}

export function SettingsPage(): React.JSX.Element {
  return (
    <Section title="全局设置" description="opencode 的通用设置。" action={<ConfigViewButton />}>
      <VStack align="stretch" gap="20px">
        <AutoUpdateSetting />
        <PermissionRulesEditor />
      </VStack>
    </Section>
  )
}
```

- [ ] **Step 6: 移除 permissionDefault**

修改 `src/renderer/src/App.tsx`：
- 删除第 6 行 `import { permissionDefault } from './store/permission'`。
- 删除第 39 行 `const setField = useConfigStore((s) => s.setField)`。
- 删除 `useEffect` 中第 47-48 行：

```tsx
useEffect(() => {
  window.api
    .readConfig()
    .then((config) => {
      loadConfig(config)
      setLoaded(true)
    })
    .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
}, [loadConfig])
```

并删除文件 `src/renderer/src/store/permission.ts` 与 `src/renderer/src/store/permission.test.ts`：

```bash
rm src/renderer/src/store/permission.ts src/renderer/src/store/permission.test.ts
```

- [ ] **Step 7: 更新 SettingsPage 测试**

覆盖 `src/renderer/src/pages/SettingsPage.test.tsx`：保留两个 autoupdate 用例，删除权限下拉相关用例，新增权限规则用例：

```tsx
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { SettingsPage } from './SettingsPage'

describe('SettingsPage', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))
  afterEach(() => cleanup())

  it('turns autoupdate off by writing false', async () => {
    render(
      <Provider>
        <SettingsPage />
      </Provider>
    )
    const toggle = screen.getByRole('checkbox', { name: '自动更新' })
    expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    expect(useConfigStore.getState().draft.autoupdate).toBe(false)
  })

  it('removes the field when turning autoupdate back on', async () => {
    useConfigStore.getState().loadConfig({ autoupdate: false })
    render(
      <Provider>
        <SettingsPage />
      </Provider>
    )
    const toggle = screen.getByRole('checkbox', { name: '自动更新' })
    expect(toggle).not.toBeChecked()
    await userEvent.click(toggle)
    expect(useConfigStore.getState().draft.autoupdate).toBeUndefined()
  })

  it('renders the permission rules editor', () => {
    render(
      <Provider>
        <SettingsPage />
      </Provider>
    )
    expect(screen.getByText('未配置权限规则')).toBeInTheDocument()
  })
})
```

- [ ] **Step 8: 运行测试**

Run: `pnpm vitest run src/renderer/src/components/PermissionRulesEditor.test.tsx src/renderer/src/pages/SettingsPage.test.tsx`
Expected: 全部 PASS。

- [ ] **Step 9: 提交**

```bash
git add src/renderer/src/components/PermissionRulesEditor.tsx src/renderer/src/components/PermissionRulesEditor.test.tsx src/renderer/src/pages/SettingsPage.tsx src/renderer/src/pages/SettingsPage.test.tsx src/renderer/src/App.tsx
git rm src/renderer/src/store/permission.ts src/renderer/src/store/permission.test.ts
git commit -m "feat: 权限改为 V2 有序规则列表编辑器"
```

---

## Task 5: 全量验证与收尾

**Files:**
- Modify: `src/renderer/src/store/roundtrip.test.ts`（如引用失效字段则调整）

**Interfaces:**
- Consumes: 前述所有任务产物。

- [ ] **Step 1: 检查 roundtrip 测试**

`src/renderer/src/store/roundtrip.test.ts` 测试的是 `normalizeDraft` 保留未知字段与 path 操作的通用机制，`mode`/`reference`/`permission` 仅是示例字段名，不涉及字段语义，无需改动。若执行时报错再处理（预期不报错）。

- [ ] **Step 2: 运行类型检查**

Run: `pnpm typecheck`
Expected: 通过，无类型错误。

- [ ] **Step 3: 运行 lint**

Run: `pnpm lint`
Expected: 通过，无 lint 错误。

- [ ] **Step 4: 运行全部测试**

Run: `pnpm test`
Expected: 全部 PASS。

- [ ] **Step 5: 提交（如有 roundtrip 微调）**

仅当 Step 1 触发改动时执行：

```bash
git add src/renderer/src/store/roundtrip.test.ts
git commit -m "test: 适配 V2 字段的 roundtrip 用例"
```

---

## Self-Review 记录

- **Spec coverage**：Schema 重写（§4.1/4.2）→ Task 1；插件（§4.4）→ Task 2；MCP（§4.3）→ Task 3；权限编辑器 + permissionDefault 移除（§4.5/4.6）→ Task 4；测试与收尾（§5）→ Task 5。全部覆盖。
- **Placeholder scan**：无 TBD/TODO，schema 与组件代码均给出完整内容。
- **Type consistency**：`PermissionRulesEditor` 的 `Rule`/`EFFECTS`/`ACTION_SUGGESTIONS` 在各步骤一致；测试用例的 aria-label（`权限动作 0`、`资源 0`、`删除规则 0`、`下移规则 0`）与组件实现逐一对应。
- **Review Focus**：MCP disabled 三态（Task 3 用例）、规则顺序（Task 4「moves a rule down」）、action/resource 通配（Task 4 数据含 `*`、Task 1 schema 校验含 `*`）、插件对象形式（Task 2 `{package, options}`）、schema 严格性（Task 1 拒绝 V1 字段 + 空对象通过）均有对应测试。
