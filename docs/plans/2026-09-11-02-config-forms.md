# occonfiger 实现计划 · Plan 2：配置表单（config-forms）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Plan 1 的底座上，实现全部配置表单页面：字段基础设施、通用控件、11 个导航页、原始 JSON 弹窗、保存与校验流程，并用 round-trip 回归测试保证不丢字段。

**Architecture:** 声明式字段层。简单标量用 `FieldSpec` 数据驱动渲染；结构复杂的字段（provider / mcp / permission / agent / command / plugin）用专用组件。所有控件通过 `useField(path)` 读写 Plan 1 的 zustand 草稿。

**Tech Stack:** React 19、TypeScript、Chakra UI v3、zustand、Vitest、@testing-library/react。

**Spec:** `docs/specs/2026-09-11-opencode-config-editor-design.md`

## Global Constraints

- 前置：Plan 1 已完成并通过全部测试。
- 语言：面向用户文案用简体中文；代码标识符用英文；不写任何注释。
- 颜色一律用语义 token（`bg.*`、`fg.*`、`border.*`、`accent.*`），禁止写死颜色。
- 表单 label 置顶、控件全宽；卡片圆角 12px、控件 8px；间距 8px 基准。
- 未展示字段必须 round-trip 保留，不丢数据。
- 每个任务结束必须 `pnpm test`、`pnpm typecheck`、`pnpm lint` 通过后提交。

---

### Task 1: 字段基础设施与通用控件

**Files:**
- Create: `src/renderer/src/fields/path.ts`
- Create: `src/renderer/src/fields/useField.ts`
- Create: `src/renderer/src/fields/Field.tsx`
- Create: `src/renderer/src/fields/controls.tsx`
- Test: `src/renderer/src/fields/path.test.ts`
- Test: `src/renderer/src/fields/controls.test.tsx`

**Interfaces:**
- Consumes: `useConfigStore`（Plan 1 Task 12）
- Produces:
  - `getAt(root, path)` / `setAt(root, path, value)` / `deleteAt(root, path)`
  - `useField(path: string[]) => { value: unknown; set(v: unknown): void; clear(): void }`
  - `<Field label description>{children}</Field>`
  - `<TextField path label description placeholder />`
  - `<NumberField path label description />`
  - `<SwitchField path label description />`
  - `<SelectField path label description options />`
  - `<TagsField path label description placeholder />`

- [ ] **Step 1: 写失败测试（path 工具）**

创建 `src/renderer/src/fields/path.test.ts`：
```ts
import { describe, expect, it } from 'vitest'
import { deleteAt, getAt, setAt } from './path'

describe('path utils', () => {
  it('reads nested values', () => {
    expect(getAt({ a: { b: 1 } }, ['a', 'b'])).toBe(1)
    expect(getAt({ a: 1 }, ['a', 'b'])).toBeUndefined()
  })

  it('creates missing objects on set', () => {
    const root: Record<string, unknown> = {}
    setAt(root, ['a', 'b'], 2)
    expect(root).toEqual({ a: { b: 2 } })
  })

  it('deletes and prunes empty parents', () => {
    const root: Record<string, unknown> = { a: { b: 1 } }
    deleteAt(root, ['a', 'b'])
    expect(root).toEqual({})
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/fields/path.test.ts`
Expected: FAIL，找不到 `./path`

- [ ] **Step 3: 实现 path 与 useField**

创建 `src/renderer/src/fields/path.ts`：
```ts
type Node = Record<string, unknown>

export function getAt(root: unknown, path: string[]): unknown {
  let node: unknown = root
  for (const key of path) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Node)[key]
  }
  return node
}

export function setAt(root: Node, path: string[], value: unknown): void {
  let node = root
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i]
    if (typeof node[key] !== 'object' || node[key] === null) node[key] = {}
    node = node[key] as Node
  }
  node[path[path.length - 1]] = value
}

export function deleteAt(root: Node, path: string[]): void {
  const parents: Node[] = [root]
  let node = root
  for (let i = 0; i < path.length - 1; i += 1) {
    const next = node[path[i]]
    if (typeof next !== 'object' || next === null) return
    node = next as Node
    parents.push(node)
  }
  delete node[path[path.length - 1]]
  for (let i = parents.length - 1; i > 0; i -= 1) {
    if (Object.keys(parents[i]).length === 0) delete parents[i - 1][path[i - 1]]
    else break
  }
}
```

创建 `src/renderer/src/fields/useField.ts`：
```ts
import { useConfigStore } from '../store/configStore'
import { getAt } from './path'

export function useField(path: string[]) {
  const value = useConfigStore((s) => getAt(s.draft, path))
  const setField = useConfigStore((s) => s.setField)
  const deleteField = useConfigStore((s) => s.deleteField)
  const key = path.join('.')
  return {
    key,
    value,
    set: (v: unknown) => setField(path, v),
    clear: () => deleteField(path)
  }
}
```

- [ ] **Step 4: 写失败测试（控件）**

创建 `src/renderer/src/fields/controls.test.tsx`：
```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { TextField, TagsField, SwitchField } from './controls'

function wrap(ui: React.ReactElement) {
  return render(<Provider>{ui}</Provider>)
}

describe('controls', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))

  it('TextField writes to the draft', async () => {
    wrap(<TextField path={['shell']} label="Shell" />)
    await userEvent.type(screen.getByLabelText('Shell'), '/bin/zsh')
    expect(useConfigStore.getState().draft.shell).toBe('/bin/zsh')
  })

  it('SwitchField toggles boolean', async () => {
    wrap(<SwitchField path={['snapshot']} label="快照" />)
    await userEvent.click(screen.getByRole('checkbox', { name: '快照' }))
    expect(useConfigStore.getState().draft.snapshot).toBe(true)
  })

  it('TagsField adds entries on Enter', async () => {
    wrap(<TagsField path={['instructions']} label="指令" />)
    await userEvent.type(screen.getByLabelText('指令'), 'AGENTS.md{enter}')
    expect(useConfigStore.getState().draft.instructions).toEqual(['AGENTS.md'])
  })
})
```

- [ ] **Step 5: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/fields/controls.test.tsx`
Expected: FAIL，找不到 `./controls`

- [ ] **Step 6: 实现 Field 与控件**

创建 `src/renderer/src/fields/Field.tsx`：
```tsx
import { Box, Text } from '@chakra-ui/react'

export function Field(props: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Box mb="16px">
      <Text as="label" display="block" fontSize="sm" fontWeight="medium" mb="4px">
        {props.label}
      </Text>
      {props.children}
      {props.description ? (
        <Text fontSize="xs" color="fg.muted" mt="4px">
          {props.description}
        </Text>
      ) : null}
    </Box>
  )
}
```

创建 `src/renderer/src/fields/controls.tsx`：
```tsx
import { HStack, IconButton, Input, Switch, Text, Textarea } from '@chakra-ui/react'
import { Field } from './Field'
import { useField } from './useField'

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

export function TextField(props: {
  path: string[]
  label: string
  description?: string
  placeholder?: string
  multiline?: boolean
}) {
  const { value, set } = useField(props.path)
  return (
    <Field label={props.label} description={props.description}>
      {props.multiline ? (
        <Textarea
          aria-label={props.label}
          value={asString(value)}
          placeholder={props.placeholder}
          onChange={(e) => set(e.target.value)}
        />
      ) : (
        <Input
          aria-label={props.label}
          value={asString(value)}
          placeholder={props.placeholder}
          onChange={(e) => set(e.target.value)}
        />
      )}
    </Field>
  )
}

export function NumberField(props: { path: string[]; label: string; description?: string }) {
  const { value, set, clear } = useField(props.path)
  return (
    <Field label={props.label} description={props.description}>
      <Input
        aria-label={props.label}
        type="number"
        value={typeof value === 'number' ? value : ''}
        onChange={(e) => (e.target.value === '' ? clear() : set(Number(e.target.value)))}
      />
    </Field>
  )
}

export function SwitchField(props: { path: string[]; label: string; description?: string }) {
  const { value, set } = useField(props.path)
  return (
    <Field label={props.label} description={props.description}>
      <Switch.Root
        checked={value === true}
        onCheckedChange={(e) => set(e.checked)}
      >
        <Switch.HiddenInput aria-label={props.label} />
        <Switch.Control />
      </Switch.Root>
    </Field>
  )
}

export function SelectField(props: {
  path: string[]
  label: string
  description?: string
  options: string[]
  allowEmpty?: boolean
}) {
  const { value, set, clear } = useField(props.path)
  return (
    <Field label={props.label} description={props.description}>
      <select
        aria-label={props.label}
        value={asString(value)}
        onChange={(e) => (e.target.value === '' ? clear() : set(e.target.value))}
        style={{
          width: '100%',
          height: '32px',
          borderRadius: '8px',
          border: '1px solid var(--chakra-colors-border-default)',
          background: 'var(--chakra-colors-bg-default)',
          color: 'inherit',
          padding: '0 8px'
        }}
      >
        {props.allowEmpty !== false ? <option value="">（未设置）</option> : null}
        {props.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function TagsField(props: {
  path: string[]
  label: string
  description?: string
  placeholder?: string
}) {
  const { value, set } = useField(props.path)
  const items = asArray(value)
  return (
    <Field label={props.label} description={props.description}>
      <Input
        aria-label={props.label}
        placeholder={props.placeholder}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          e.preventDefault()
          const input = e.currentTarget
          const next = input.value.trim()
          if (!next || items.includes(next)) return
          set([...items, next])
          input.value = ''
        }}
      />
      {items.length > 0 ? (
        <HStack mt="8px" gap="8px" wrap="wrap">
          {items.map((item) => (
            <HStack
              key={item}
              gap="4px"
              bg="bg.muted"
              borderRadius="control"
              px="8px"
              py="2px"
            >
              <Text fontSize="xs" fontFamily="mono">
                {item}
              </Text>
              <IconButton
                aria-label={`删除 ${item}`}
                size="2xs"
                variant="ghost"
                onClick={() => set(items.filter((i) => i !== item))}
              >
                ×
              </IconButton>
            </HStack>
          ))}
        </HStack>
      ) : null}
    </Field>
  )
}
```

- [ ] **Step 7: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/fields`
Expected: PASS

- [ ] **Step 8: 提交**

```bash
git add src/renderer/src/fields
git commit -m "feat(renderer): 字段基础设施与通用控件"
```

---

### Task 2: 分组卡片与数据驱动表单

**Files:**
- Create: `src/renderer/src/components/Section.tsx`
- Create: `src/renderer/src/fields/FieldsForm.tsx`
- Test: `src/renderer/src/fields/FieldsForm.test.tsx`

**Interfaces:**
- Consumes: `TextField` / `NumberField` / `SwitchField` / `SelectField` / `TagsField`（Task 1）
- Produces:
  - `<Section title description>{children}</Section>`
  - `type FieldSpec`（kind 为 `text` / `number` / `switch` / `select` / `tags`）
  - `<FieldsForm specs={FieldSpec[]} />`

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/fields/FieldsForm.test.tsx`：
```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { FieldsForm } from './FieldsForm'

describe('FieldsForm', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))

  it('renders every spec kind', () => {
    render(
      <Provider>
        <FieldsForm
          specs={[
            { kind: 'text', path: ['shell'], label: 'Shell' },
            { kind: 'switch', path: ['snapshot'], label: '快照' },
            { kind: 'select', path: ['logLevel'], label: '日志', options: ['DEBUG', 'INFO'] },
            { kind: 'number', path: ['subagent_depth'], label: '深度' },
            { kind: 'tags', path: ['instructions'], label: '指令' }
          ]}
        />
      </Provider>
    )
    expect(screen.getByLabelText('Shell')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '快照' })).toBeInTheDocument()
    expect(screen.getByLabelText('日志')).toBeInTheDocument()
    expect(screen.getByLabelText('深度')).toBeInTheDocument()
    expect(screen.getByLabelText('指令')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/fields/FieldsForm.test.tsx`
Expected: FAIL，找不到 `./FieldsForm`

- [ ] **Step 3: 实现**

创建 `src/renderer/src/components/Section.tsx`：
```tsx
import { Box, Heading, Text } from '@chakra-ui/react'

export function Section(props: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Box
      as="section"
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      p="20px"
      mb="16px"
    >
      <Heading size="md" mb="4px">
        {props.title}
      </Heading>
      {props.description ? (
        <Text fontSize="sm" color="fg.muted" mb="16px">
          {props.description}
        </Text>
      ) : null}
      {props.children}
    </Box>
  )
}
```

创建 `src/renderer/src/fields/FieldsForm.tsx`：
```tsx
import { NumberField, SelectField, SwitchField, TagsField, TextField } from './controls'

export type FieldSpec =
  | { kind: 'text'; path: string[]; label: string; description?: string; placeholder?: string }
  | { kind: 'number'; path: string[]; label: string; description?: string }
  | { kind: 'switch'; path: string[]; label: string; description?: string }
  | { kind: 'select'; path: string[]; label: string; description?: string; options: string[] }
  | { kind: 'tags'; path: string[]; label: string; description?: string; placeholder?: string }

export function FieldsForm({ specs }: { specs: FieldSpec[] }) {
  return (
    <>
      {specs.map((spec) => {
        const key = spec.path.join('.')
        if (spec.kind === 'text') return <TextField key={key} {...spec} />
        if (spec.kind === 'number') return <NumberField key={key} {...spec} />
        if (spec.kind === 'switch') return <SwitchField key={key} {...spec} />
        if (spec.kind === 'select') return <SelectField key={key} {...spec} />
        return <TagsField key={key} {...spec} />
      })}
    </>
  )
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/fields/FieldsForm.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/components/Section.tsx src/renderer/src/fields/FieldsForm.tsx src/renderer/src/fields/FieldsForm.test.tsx
git commit -m "feat(renderer): 分组卡片与数据驱动表单"
```

---

### Task 3: 常规页与模型页

**Files:**
- Create: `src/renderer/src/pages/GeneralPage.tsx`
- Create: `src/renderer/src/pages/ModelPage.tsx`
- Test: `src/renderer/src/pages/GeneralPage.test.tsx`

**Interfaces:**
- Consumes: `Section`（Task 2）、`FieldsForm`（Task 2）、`TextField`（Task 1）
- Produces: `<GeneralPage />`、`<ModelPage />`

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/pages/GeneralPage.test.tsx`：
```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { GeneralPage } from './GeneralPage'

describe('GeneralPage', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({ autoupdate: 'notify' }))

  it('renders the general fields with current values', () => {
    render(
      <Provider>
        <GeneralPage />
      </Provider>
    )
    expect(screen.getByLabelText('Shell')).toBeInTheDocument()
    expect(screen.getByLabelText('用户名')).toBeInTheDocument()
    expect(screen.getByLabelText('日志级别')).toBeInTheDocument()
    expect(screen.getByLabelText('自动更新')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/pages/GeneralPage.test.tsx`
Expected: FAIL，找不到 `./GeneralPage`

- [ ] **Step 3: 实现**

创建 `src/renderer/src/pages/GeneralPage.tsx`：
```tsx
import { Section } from '../components/Section'
import { FieldsForm, type FieldSpec } from '../fields/FieldsForm'

const specs: FieldSpec[] = [
  { kind: 'text', path: ['shell'], label: 'Shell', placeholder: '/bin/zsh' },
  { kind: 'text', path: ['username'], label: '用户名' },
  { kind: 'select', path: ['logLevel'], label: '日志级别', options: ['DEBUG', 'INFO', 'WARN', 'ERROR'] },
  { kind: 'select', path: ['share'], label: '分享', options: ['manual', 'auto', 'disabled'] },
  { kind: 'select', path: ['autoupdate'], label: '自动更新', options: ['true', 'false', 'notify'] },
  { kind: 'switch', path: ['snapshot'], label: '快照' },
  { kind: 'text', path: ['default_agent'], label: '默认 Agent' },
  { kind: 'number', path: ['subagent_depth'], label: '子 Agent 嵌套深度' },
  { kind: 'tags', path: ['disabled_providers'], label: '禁用的 Provider', placeholder: '回车添加' },
  { kind: 'tags', path: ['enabled_providers'], label: '仅启用的 Provider', placeholder: '回车添加' }
]

export function GeneralPage() {
  return (
    <Section title="常规" description="运行时与全局行为设置。">
      <FieldsForm specs={specs} />
    </Section>
  )
}
```

注意：`autoupdate` 的值可能是布尔，`select` 存字符串会与 schema 的 `bool | "notify"` 不完全一致。为避免类型错误，常规页对 `autoupdate` 用专用控件：改用 `SwitchField` 与文本组合过于复杂，本计划统一按字符串 `"true" | "false" | "notify"` 存储并在保存前转换——在 Task 13 的保存流程中实现 `normalizeDraft`，把 `autoupdate` 的 `"true"`/`"false"` 转成布尔。

创建 `src/renderer/src/pages/ModelPage.tsx`：
```tsx
import { Section } from '../components/Section'
import { FieldsForm, type FieldSpec } from '../fields/FieldsForm'

const specs: FieldSpec[] = [
  { kind: 'text', path: ['model'], label: '主模型', placeholder: 'provider/model' },
  { kind: 'text', path: ['small_model'], label: '小模型', placeholder: 'provider/model' }
]

export function ModelPage() {
  return (
    <Section title="模型" description="主模型与小模型，格式为 provider/model。">
      <FieldsForm specs={specs} />
    </Section>
  )
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/pages/GeneralPage.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/pages/GeneralPage.tsx src/renderer/src/pages/ModelPage.tsx src/renderer/src/pages/GeneralPage.test.tsx
git commit -m "feat(renderer): 常规页与模型页"
```

---

### Task 4: 权限页

**Files:**
- Create: `src/renderer/src/pages/PermissionPage.tsx`
- Test: `src/renderer/src/pages/PermissionPage.test.tsx`

**Interfaces:**
- Consumes: `Section`、`useField`、`useConfigStore`
- Produces: `<PermissionPage />`；已知权限键常量 `PERMISSION_KEYS`

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/pages/PermissionPage.test.tsx`：
```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { PermissionPage } from './PermissionPage'

describe('PermissionPage', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))

  it('sets a permission action', async () => {
    render(
      <Provider>
        <PermissionPage />
      </Provider>
    )
    const select = screen.getByLabelText('edit')
    await userEvent.selectOptions(select, 'deny')
    expect(useConfigStore.getState().draft.permission).toEqual({ edit: 'deny' })
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/pages/PermissionPage.test.tsx`
Expected: FAIL，找不到 `./PermissionPage`

- [ ] **Step 3: 实现**

创建 `src/renderer/src/pages/PermissionPage.tsx`：
```tsx
import { Box, HStack, IconButton, Input, Text } from '@chakra-ui/react'
import { Section } from '../components/Section'
import { useField } from '../fields/useField'
import { useConfigStore } from '../store/configStore'
import { getAt } from '../fields/path'

export const PERMISSION_KEYS = [
  'read',
  'edit',
  'glob',
  'grep',
  'list',
  'bash',
  'task',
  'external_directory',
  'todowrite',
  'question',
  'webfetch',
  'websearch',
  'lsp',
  'doom_loop',
  'skill'
] as const

const ACTIONS = ['', 'allow', 'ask', 'deny']

function PermissionRow({ permKey }: { permKey: string }) {
  const { value, set, clear } = useField(['permission', permKey])
  const action = typeof value === 'string' ? value : ''
  return (
    <HStack mb="8px">
      <Text fontSize="sm" fontFamily="mono" w="180px">
        {permKey}
      </Text>
      <select
        aria-label={permKey}
        value={action}
        onChange={(e) => (e.target.value === '' ? clear() : set(e.target.value))}
        style={{
          height: '32px',
          borderRadius: '8px',
          border: '1px solid var(--chakra-colors-border-default)',
          background: 'var(--chakra-colors-bg-default)',
          color: 'inherit',
          padding: '0 8px'
        }}
      >
        {ACTIONS.map((action) => (
          <option key={action || 'unset'} value={action}>
            {action || '（未设置）'}
          </option>
        ))}
      </select>
    </HStack>
  )
}

function BashRules() {
  const draft = useConfigStore((s) => s.draft)
  const setField = useConfigStore((s) => s.setField)
  const deleteField = useConfigStore((s) => s.deleteField)
  const rules = getAt(draft, ['permission', 'bash'])
  const entries =
    rules && typeof rules === 'object' && !Array.isArray(rules)
      ? Object.entries(rules as Record<string, string>)
      : []

  return (
    <Box mt="16px">
      <Text fontSize="sm" fontWeight="medium" mb="8px">
        bash 模式规则（后面的规则覆盖前面的）
      </Text>
      {entries.map(([pattern, action]) => (
        <HStack key={pattern} mb="8px">
          <Input
            aria-label={`bash 模式 ${pattern}`}
            defaultValue={pattern}
            onBlur={(e) => {
              const next = e.target.value
              if (next === pattern) return
              deleteField(['permission', 'bash', pattern])
              setField(['permission', 'bash', next], action)
            }}
          />
          <select
            aria-label={`bash 动作 ${pattern}`}
            defaultValue={action}
            onChange={(e) => setField(['permission', 'bash', pattern], e.target.value)}
            style={{ height: '32px', borderRadius: '8px', padding: '0 8px' }}
          >
            {['allow', 'ask', 'deny'].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <IconButton
            aria-label={`删除规则 ${pattern}`}
            size="sm"
            variant="ghost"
            onClick={() => deleteField(['permission', 'bash', pattern])}
          >
            ×
          </IconButton>
        </HStack>
      ))}
      <HStack>
        <Input
          aria-label="新 bash 模式"
          placeholder="git *"
          id="new-bash-pattern"
        />
        <select aria-label="新 bash 动作" id="new-bash-action" defaultValue="ask" style={{ height: '32px', borderRadius: '8px', padding: '0 8px' }}>
          {['allow', 'ask', 'deny'].map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <IconButton
          aria-label="添加 bash 规则"
          size="sm"
          onClick={() => {
            const pattern = (document.getElementById('new-bash-pattern') as HTMLInputElement)?.value
            const action = (document.getElementById('new-bash-action') as HTMLSelectElement)?.value
            if (pattern) setField(['permission', 'bash', pattern], action)
          }}
        >
          +
        </IconButton>
      </HStack>
    </Box>
  )
}

export function PermissionPage() {
  return (
    <Section title="权限" description="控制各工具的动作：allow / ask / deny。">
      {PERMISSION_KEYS.map((key) => (
        <PermissionRow key={key} permKey={key} />
      ))}
      <BashRules />
    </Section>
  )
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/pages/PermissionPage.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/pages/PermissionPage.tsx src/renderer/src/pages/PermissionPage.test.tsx
git commit -m "feat(renderer): 权限页（含 bash 模式规则）"
```

---

### Task 5: Provider 页

**Files:**
- Create: `src/renderer/src/pages/ProviderPage.tsx`
- Create: `src/renderer/src/components/ListEditor.tsx`
- Test: `src/renderer/src/pages/ProviderPage.test.tsx`

**Interfaces:**
- Consumes: `Section`、`useField`、`getAt` / `setAt` / `deleteAt`
- Produces:
  - `<ListEditor path itemLabelKey onAdd renderItem />`：通用「对象键值卡片列表」编辑器
  - `<ProviderPage />`

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/pages/ProviderPage.test.tsx`：
```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { ProviderPage } from './ProviderPage'

describe('ProviderPage', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))

  it('adds a provider card', async () => {
    render(
      <Provider>
        <ProviderPage />
      </Provider>
    )
    await userEvent.type(screen.getByLabelText('新 Provider ID'), 'myprovider')
    await userEvent.click(screen.getByRole('button', { name: '添加 Provider' }))
    expect(useConfigStore.getState().draft.provider).toEqual({ myprovider: {} })
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/pages/ProviderPage.test.tsx`
Expected: FAIL，找不到 `./ProviderPage`

- [ ] **Step 3: 实现 ListEditor**

创建 `src/renderer/src/components/ListEditor.tsx`：
```tsx
import { Button, HStack, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { Box } from '@chakra-ui/react'
import { getAt } from '../fields/path'
import { useConfigStore } from '../store/configStore'

export function ListEditor(props: {
  path: string[]
  addLabel: string
  inputLabel: string
  placeholder?: string
  children: (key: string) => React.ReactNode
}) {
  const [name, setName] = useState('')
  const draft = useConfigStore((s) => s.draft)
  const setField = useConfigStore((s) => s.setField)
  const deleteField = useConfigStore((s) => s.deleteField)
  const container = getAt(draft, props.path)
  const keys =
    container && typeof container === 'object' && !Array.isArray(container)
      ? Object.keys(container as Record<string, unknown>)
      : []

  return (
    <Box>
      <HStack mb="16px">
        <Input
          aria-label={props.inputLabel}
          placeholder={props.placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          size="sm"
          colorPalette="accent"
          onClick={() => {
            if (!name.trim()) return
            setField([...props.path, name.trim()], {})
            setName('')
          }}
        >
          {props.addLabel}
        </Button>
      </HStack>
      {keys.map((key) => (
        <Box
          key={key}
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="card"
          p="16px"
          mb="12px"
          bg="bg.default"
        >
          <HStack justify="space-between" mb="12px">
            <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
              {key}
            </Text>
            <Button
              size="xs"
              variant="ghost"
              colorPalette="error"
              onClick={() => deleteField([...props.path, key])}
            >
              删除
            </Button>
          </HStack>
          {props.children(key)}
        </Box>
      ))}
    </Box>
  )
}
```

- [ ] **Step 4: 实现 ProviderPage**

创建 `src/renderer/src/pages/ProviderPage.tsx`：
```tsx
import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { TextField, TagsField } from '../fields/controls'

export function ProviderPage() {
  return (
    <Section
      title="Provider"
      description="opencode.json 中的 provider 配置：自定义 provider、baseURL 与模型。"
    >
      <ListEditor
        path={['provider']}
        addLabel="添加 Provider"
        inputLabel="新 Provider ID"
        placeholder="myprovider"
      >
        {(key) => (
          <>
            <TextField path={['provider', key, 'name']} label="显示名称" />
            <TextField path={['provider', key, 'npm']} label="npm 包" placeholder="@ai-sdk/openai-compatible" />
            <TextField path={['provider', key, 'options', 'baseURL']} label="Base URL" />
            <TextField path={['provider', key, 'options', 'apiKey']} label="API Key" />
            <TagsField path={['provider', key, 'env']} label="环境变量" />
          </>
        )}
      </ListEditor>
    </Section>
  )
}
```

- [ ] **Step 5: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/pages/ProviderPage.test.tsx`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add src/renderer/src/components/ListEditor.tsx src/renderer/src/pages/ProviderPage.tsx src/renderer/src/pages/ProviderPage.test.tsx
git commit -m "feat(renderer): Provider 页与通用列表编辑器"
```

---

### Task 6: MCP 页

**Files:**
- Create: `src/renderer/src/pages/McpPage.tsx`
- Test: `src/renderer/src/pages/McpPage.test.tsx`

**Interfaces:**
- Consumes: `Section`、`ListEditor`、`TextField`、`SwitchField`、`TagsField`
- Produces: `<McpPage />`

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/pages/McpPage.test.tsx`：
```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { McpPage } from './McpPage'

describe('McpPage', () => {
  beforeEach(() =>
    useConfigStore.getState().loadConfig({ mcp: { exa: { type: 'remote', url: 'https://x' } } })
  )

  it('renders remote fields for a remote server', () => {
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    expect(screen.getByLabelText('URL')).toBeInTheDocument()
    expect(screen.queryByLabelText('命令')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/pages/McpPage.test.tsx`
Expected: FAIL，找不到 `./McpPage`

- [ ] **Step 3: 实现**

创建 `src/renderer/src/pages/McpPage.tsx`：
```tsx
import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { SelectField, SwitchField, TagsField, TextField } from '../fields/controls'
import { useField } from '../fields/useField'

function McpCard({ server }: { server: string }) {
  const { value } = useField(['mcp', server, 'type'])
  const type = typeof value === 'string' ? value : 'local'
  return (
    <>
      <SelectField
        path={['mcp', server, 'type']}
        label="类型"
        options={['local', 'remote']}
        allowEmpty={false}
      />
      <SwitchField path={['mcp', server, 'enabled']} label="启用" />
      {type === 'local' ? (
        <>
          <TagsField path={['mcp', server, 'command']} label="命令" placeholder="回车添加参数" />
          <TextField path={['mcp', server, 'cwd']} label="工作目录" />
          <TagsField path={['mcp', server, 'environment']} label="环境变量" placeholder="KEY=VALUE 回车添加" />
        </>
      ) : (
        <>
          <TextField path={['mcp', server, 'url']} label="URL" />
          <TextField path={['mcp', server, 'headers', 'Authorization']} label="Authorization 头" />
        </>
      )}
      <TextField path={['mcp', server, 'timeout']} label="超时（毫秒）" />
    </>
  )
}

export function McpPage() {
  return (
    <Section title="MCP 服务" description="Model Context Protocol 服务器配置。">
      <ListEditor
        path={['mcp']}
        addLabel="添加 MCP 服务"
        inputLabel="新 MCP 服务名"
        placeholder="playwright"
      >
        {(server) => <McpCard server={server} />}
      </ListEditor>
    </Section>
  )
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/pages/McpPage.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/pages/McpPage.tsx src/renderer/src/pages/McpPage.test.tsx
git commit -m "feat(renderer): MCP 服务页"
```

---

### Task 7: Agents 页

**Files:**
- Create: `src/renderer/src/pages/AgentPage.tsx`
- Test: `src/renderer/src/pages/AgentPage.test.tsx`

**Interfaces:**
- Consumes: `Section`、`ListEditor`、`TextField`、`SelectField`、`SwitchField`、`NumberField`、`PermissionPage` 的 `PERMISSION_KEYS`
- Produces: `<AgentPage />`

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/pages/AgentPage.test.tsx`：
```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { AgentPage } from './AgentPage'

describe('AgentPage', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))

  it('renders agent fields after adding an agent', () => {
    useConfigStore.getState().setField(['agent', 'reviewer'], {})
    render(
      <Provider>
        <AgentPage />
      </Provider>
    )
    expect(screen.getByLabelText('模式')).toBeInTheDocument()
    expect(screen.getByLabelText('描述')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/pages/AgentPage.test.tsx`
Expected: FAIL，找不到 `./AgentPage`

- [ ] **Step 3: 实现**

创建 `src/renderer/src/pages/AgentPage.tsx`：
```tsx
import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { NumberField, SelectField, SwitchField, TextField } from '../fields/controls'

export function AgentPage() {
  return (
    <Section title="Agents" description="自定义 agent 的模型、模式与权限。">
      <ListEditor
        path={['agent']}
        addLabel="添加 Agent"
        inputLabel="新 Agent 名称"
        placeholder="reviewer"
      >
        {(agent) => (
          <>
            <TextField path={['agent', agent, 'description']} label="描述" />
            <SelectField
              path={['agent', agent, 'mode']}
              label="模式"
              options={['primary', 'subagent', 'all']}
            />
            <TextField path={['agent', agent, 'model']} label="模型" placeholder="provider/model" />
            <NumberField path={['agent', agent, 'temperature']} label="温度" />
            <NumberField path={['agent', agent, 'top_p']} label="Top P" />
            <NumberField path={['agent', agent, 'steps']} label="最大步数" />
            <SwitchField path={['agent', agent, 'hidden']} label="在自动补全中隐藏" />
            <SwitchField path={['agent', agent, 'disable']} label="禁用" />
            <TextField path={['agent', agent, 'prompt']} label="Prompt" multiline />
          </>
        )}
      </ListEditor>
    </Section>
  )
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/pages/AgentPage.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/pages/AgentPage.tsx src/renderer/src/pages/AgentPage.test.tsx
git commit -m "feat(renderer): Agents 页"
```

---

### Task 8: Commands 页

**Files:**
- Create: `src/renderer/src/pages/CommandPage.tsx`
- Test: `src/renderer/src/pages/CommandPage.test.tsx`

**Interfaces:**
- Consumes: `Section`、`ListEditor`、`TextField`、`SwitchField`
- Produces: `<CommandPage />`

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/pages/CommandPage.test.tsx`：
```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { CommandPage } from './CommandPage'

describe('CommandPage', () => {
  it('renders command fields', () => {
    useConfigStore.getState().loadConfig({ command: { deploy: { template: 'run' } } })
    render(
      <Provider>
        <CommandPage />
      </Provider>
    )
    expect(screen.getByLabelText('模板')).toBeInTheDocument()
    expect(screen.getByLabelText('描述')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/pages/CommandPage.test.tsx`
Expected: FAIL，找不到 `./CommandPage`

- [ ] **Step 3: 实现**

创建 `src/renderer/src/pages/CommandPage.tsx`：
```tsx
import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { SwitchField, TextField } from '../fields/controls'

export function CommandPage() {
  return (
    <Section title="Commands" description="自定义命令，正文即模板。">
      <ListEditor
        path={['command']}
        addLabel="添加 Command"
        inputLabel="新 Command 名称"
        placeholder="deploy"
      >
        {(command) => (
          <>
            <TextField path={['command', command, 'description']} label="描述" />
            <TextField path={['command', command, 'template']} label="模板" multiline />
            <TextField path={['command', command, 'agent']} label="Agent" />
            <TextField path={['command', command, 'model']} label="模型" placeholder="provider/model" />
            <SwitchField path={['command', command, 'subtask']} label="作为子任务" />
          </>
        )}
      </ListEditor>
    </Section>
  )
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/pages/CommandPage.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/pages/CommandPage.tsx src/renderer/src/pages/CommandPage.test.tsx
git commit -m "feat(renderer): Commands 页"
```

---

### Task 9: Skills / References / Instructions 页

**Files:**
- Create: `src/renderer/src/pages/SkillsPage.tsx`
- Test: `src/renderer/src/pages/SkillsPage.test.tsx`

**Interfaces:**
- Consumes: `Section`、`ListEditor`、`TagsField`、`SelectField`、`TextField`
- Produces: `<SkillsPage />`

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/pages/SkillsPage.test.tsx`：
```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { SkillsPage } from './SkillsPage'

describe('SkillsPage', () => {
  it('renders skills and instructions', () => {
    useConfigStore.getState().loadConfig({})
    render(
      <Provider>
        <SkillsPage />
      </Provider>
    )
    expect(screen.getByLabelText('技能路径')).toBeInTheDocument()
    expect(screen.getByLabelText('技能 URL')).toBeInTheDocument()
    expect(screen.getByLabelText('指令文件')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/pages/SkillsPage.test.tsx`
Expected: FAIL，找不到 `./SkillsPage`

- [ ] **Step 3: 实现**

创建 `src/renderer/src/pages/SkillsPage.tsx`：
```tsx
import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { SelectField, TagsField, TextField } from '../fields/controls'

export function SkillsPage() {
  return (
    <>
      <Section title="Skills" description="额外的技能目录与来源。">
        <TagsField path={['skills', 'paths']} label="技能路径" placeholder="回车添加" />
        <TagsField path={['skills', 'urls']} label="技能 URL" placeholder="回车添加" />
      </Section>
      <Section title="References" description="本地目录或 Git 仓库引用，键为别名。">
        <ListEditor
          path={['references']}
          addLabel="添加引用"
          inputLabel="新引用别名"
          placeholder="docs"
        >
          {(alias) => (
            <>
              <SelectField
                path={['references', alias, 'kind']}
                label="类型"
                options={['path', 'repository']}
                allowEmpty={false}
              />
              <TextField path={['references', alias, 'path']} label="本地路径" placeholder="../docs" />
              <TextField path={['references', alias, 'repository']} label="仓库" placeholder="owner/repo" />
              <TextField path={['references', alias, 'branch']} label="分支" />
              <TextField path={['references', alias, 'description']} label="描述" />
            </>
          )}
        </ListEditor>
      </Section>
      <Section title="Instructions" description="附加的指令文件或匹配模式。">
        <TagsField path={['instructions']} label="指令文件" placeholder="AGENTS.md 回车添加" />
      </Section>
    </>
  )
}
```

注意：`references` 的 `kind` 是 UI 辅助字段，保存前需在 Task 13 的 `normalizeDraft` 中根据 `kind` 移除多余键（`path` 引用删掉 `repository`/`branch`，`repository` 引用删掉 `path`）并删除 `kind` 本身。

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/pages/SkillsPage.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/pages/SkillsPage.tsx src/renderer/src/pages/SkillsPage.test.tsx
git commit -m "feat(renderer): Skills / References / Instructions 页"
```

---

### Task 10: 插件与工具页

**Files:**
- Create: `src/renderer/src/pages/PluginsPage.tsx`
- Test: `src/renderer/src/pages/PluginsPage.test.tsx`

**Interfaces:**
- Consumes: `Section`、`TagsField`、`SwitchField`
- Produces: `<PluginsPage />`

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/pages/PluginsPage.test.tsx`：
```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { PluginsPage } from './PluginsPage'

describe('PluginsPage', () => {
  it('renders plugin and formatter controls', () => {
    useConfigStore.getState().loadConfig({})
    render(
      <Provider>
        <PluginsPage />
      </Provider>
    )
    expect(screen.getByLabelText('插件列表')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '启用格式化' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '启用 LSP' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/pages/PluginsPage.test.tsx`
Expected: FAIL，找不到 `./PluginsPage`

- [ ] **Step 3: 实现**

创建 `src/renderer/src/pages/PluginsPage.tsx`：
```tsx
import { Section } from '../components/Section'
import { SwitchField, TagsField } from '../fields/controls'

export function PluginsPage() {
  return (
    <>
      <Section title="插件" description="npm 包名、本地路径或 [name, options] 元组。">
        <TagsField path={['plugin']} label="插件列表" placeholder="opencode-foo@1.2.3 回车添加" />
      </Section>
      <Section title="格式化与 LSP" description="布尔开关表示启用内置项。">
        <SwitchField path={['formatter']} label="启用格式化" />
        <SwitchField path={['lsp']} label="启用 LSP" />
      </Section>
    </>
  )
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/pages/PluginsPage.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/pages/PluginsPage.tsx src/renderer/src/pages/PluginsPage.test.tsx
git commit -m "feat(renderer): 插件与工具页"
```

---

### Task 11: 高级页

**Files:**
- Create: `src/renderer/src/pages/AdvancedPage.tsx`
- Test: `src/renderer/src/pages/AdvancedPage.test.tsx`

**Interfaces:**
- Consumes: `Section`、`FieldsForm`
- Produces: `<AdvancedPage />`

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/pages/AdvancedPage.test.tsx`：
```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { AdvancedPage } from './AdvancedPage'

describe('AdvancedPage', () => {
  it('renders advanced sections', () => {
    useConfigStore.getState().loadConfig({})
    render(
      <Provider>
        <AdvancedPage />
      </Provider>
    )
    expect(screen.getByText('服务')).toBeInTheDocument()
    expect(screen.getByText('压缩')).toBeInTheDocument()
    expect(screen.getByText('实验性')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/pages/AdvancedPage.test.tsx`
Expected: FAIL，找不到 `./AdvancedPage`

- [ ] **Step 3: 实现**

创建 `src/renderer/src/pages/AdvancedPage.tsx`：
```tsx
import { Section } from '../components/Section'
import { FieldsForm, type FieldSpec } from '../fields/FieldsForm'

const server: FieldSpec[] = [
  { kind: 'number', path: ['server', 'port'], label: '端口' },
  { kind: 'text', path: ['server', 'hostname'], label: '主机名' },
  { kind: 'switch', path: ['server', 'mdns'], label: '启用 mDNS' },
  { kind: 'text', path: ['server', 'mdnsDomain'], label: 'mDNS 域名' }
]

const watcher: FieldSpec[] = [
  { kind: 'tags', path: ['watcher', 'ignore'], label: '忽略路径', placeholder: '回车添加' }
]

const attachment: FieldSpec[] = [
  { kind: 'switch', path: ['attachment', 'image', 'auto_resize'], label: '自动缩放图片' },
  { kind: 'number', path: ['attachment', 'image', 'max_width'], label: '最大宽度' },
  { kind: 'number', path: ['attachment', 'image', 'max_height'], label: '最大高度' },
  { kind: 'number', path: ['attachment', 'image', 'max_base64_bytes'], label: '最大 Base64 字节' }
]

const toolOutput: FieldSpec[] = [
  { kind: 'number', path: ['tool_output', 'max_lines'], label: '最大行数' },
  { kind: 'number', path: ['tool_output', 'max_bytes'], label: '最大字节' }
]

const compaction: FieldSpec[] = [
  { kind: 'switch', path: ['compaction', 'auto'], label: '自动压缩' },
  { kind: 'switch', path: ['compaction', 'prune'], label: '裁剪旧输出' },
  { kind: 'number', path: ['compaction', 'tail_turns'], label: '保留最近轮数' },
  { kind: 'number', path: ['compaction', 'preserve_recent_tokens'], label: '保留最近 token' },
  { kind: 'number', path: ['compaction', 'reserved'], label: '预留 token' }
]

const experimental: FieldSpec[] = [
  { kind: 'switch', path: ['experimental', 'disable_paste_summary'], label: '禁用粘贴摘要' },
  { kind: 'switch', path: ['experimental', 'batch_tool'], label: '启用 batch 工具' },
  { kind: 'switch', path: ['experimental', 'openTelemetry'], label: '启用 OpenTelemetry' },
  { kind: 'switch', path: ['experimental', 'continue_loop_on_deny'], label: '拒绝后继续循环' },
  { kind: 'number', path: ['experimental', 'mcp_timeout'], label: 'MCP 超时（毫秒）' },
  { kind: 'tags', path: ['experimental', 'primary_tools'], label: '仅主 Agent 工具', placeholder: '回车添加' }
]

const enterprise: FieldSpec[] = [{ kind: 'text', path: ['enterprise', 'url'], label: 'Enterprise URL' }]

export function AdvancedPage() {
  return (
    <>
      <Section title="服务">
        <FieldsForm specs={server} />
      </Section>
      <Section title="文件监听">
        <FieldsForm specs={watcher} />
      </Section>
      <Section title="附件">
        <FieldsForm specs={attachment} />
      </Section>
      <Section title="工具输出">
        <FieldsForm specs={toolOutput} />
      </Section>
      <Section title="压缩">
        <FieldsForm specs={compaction} />
      </Section>
      <Section title="实验性">
        <FieldsForm specs={experimental} />
      </Section>
      <Section title="企业">
        <FieldsForm specs={enterprise} />
      </Section>
    </>
  )
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/pages/AdvancedPage.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/pages/AdvancedPage.tsx src/renderer/src/pages/AdvancedPage.test.tsx
git commit -m "feat(renderer): 高级页"
```

---

### Task 12: 原始 JSON 弹窗

**Files:**
- Create: `src/renderer/src/components/RawJsonDialog.tsx`
- Test: `src/renderer/src/components/RawJsonDialog.test.tsx`

**Interfaces:**
- Consumes: `useConfigStore`
- Produces: `<RawJsonDialog open onClose />`（只读展示 `JSON.stringify(draft, null, 2)`）

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/components/RawJsonDialog.test.tsx`：
```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from './ui/provider'
import { useConfigStore } from '../store/configStore'
import { RawJsonDialog } from './RawJsonDialog'

describe('RawJsonDialog', () => {
  it('shows pretty printed draft', () => {
    useConfigStore.getState().loadConfig({ model: 'a/b' })
    render(
      <Provider>
        <RawJsonDialog open onClose={() => {}} />
      </Provider>
    )
    expect(screen.getByText(/"model": "a\/b"/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/components/RawJsonDialog.test.tsx`
Expected: FAIL，找不到 `./RawJsonDialog`

- [ ] **Step 3: 实现**

创建 `src/renderer/src/components/RawJsonDialog.tsx`：
```tsx
import { Button, Dialog, Portal } from '@chakra-ui/react'
import { useConfigStore } from '../store/configStore'

export function RawJsonDialog(props: { open: boolean; onClose: () => void; content?: string }) {
  const draft = useConfigStore((s) => s.draft)
  const text = props.content ?? JSON.stringify(draft, null, 2)
  return (
    <Dialog.Root open={props.open} onOpenChange={(e) => (e.open ? null : props.onClose())} size="lg">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>原始 JSON</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <pre
                style={{
                  fontFamily: 'var(--chakra-fonts-mono)',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {text}
              </pre>
            </Dialog.Body>
            <Dialog.Footer>
              <Button size="sm" onClick={props.onClose}>
                关闭
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/components/RawJsonDialog.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/components/RawJsonDialog.tsx src/renderer/src/components/RawJsonDialog.test.tsx
git commit -m "feat(renderer): 只读原始 JSON 弹窗"
```

---

### Task 13: 保存流程、草稿归一化与校验

**Files:**
- Create: `src/renderer/src/store/normalize.ts`
- Create: `src/renderer/src/hooks/useSaveConfig.ts`
- Test: `src/renderer/src/store/normalize.test.ts`

**Interfaces:**
- Consumes: `useConfigStore`、`window.api.saveConfig`
- Produces:
  - `normalizeDraft(draft) => Record<string, unknown>`：把 UI 辅助值转成 schema 合法值
  - `useSaveConfig() => { save(): Promise<{ saved: boolean; errors: string[] }>; status: string }`

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/store/normalize.test.ts`：
```ts
import { describe, expect, it } from 'vitest'
import { normalizeDraft } from './normalize'

describe('normalizeDraft', () => {
  it('converts autoupdate string to boolean', () => {
    expect(normalizeDraft({ autoupdate: 'true' }).autoupdate).toBe(true)
    expect(normalizeDraft({ autoupdate: 'false' }).autoupdate).toBe(false)
    expect(normalizeDraft({ autoupdate: 'notify' }).autoupdate).toBe('notify')
  })

  it('strips reference kind and prunes unused branch', () => {
    const result = normalizeDraft({
      references: { docs: { kind: 'path', path: '../docs', description: 'x' } }
    })
    expect(result.references).toEqual({ docs: { path: '../docs', description: 'x' } })
  })

  it('keeps repository references', () => {
    const result = normalizeDraft({
      references: { sdk: { kind: 'repository', repository: 'a/b', branch: 'main' } }
    })
    expect(result.references).toEqual({ sdk: { repository: 'a/b', branch: 'main' } })
  })

  it('does not mutate the input', () => {
    const input = { autoupdate: 'true' }
    normalizeDraft(input)
    expect(input.autoupdate).toBe('true')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/store/normalize.test.ts`
Expected: FAIL，找不到 `./normalize`

- [ ] **Step 3: 实现**

创建 `src/renderer/src/store/normalize.ts`：
```ts
type Obj = Record<string, unknown>

function isObject(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeReferences(references: unknown): unknown {
  if (!isObject(references)) return references
  const output: Obj = {}
  for (const [alias, value] of Object.entries(references)) {
    if (!isObject(value)) {
      output[alias] = value
      continue
    }
    const { kind, ...rest } = value
    if (kind === 'path') delete rest.repository
    if (kind === 'repository') delete rest.path
    output[alias] = rest
  }
  return output
}

export function normalizeDraft(draft: Obj): Obj {
  const output = structuredClone(draft)
  if (output.autoupdate === 'true') output.autoupdate = true
  else if (output.autoupdate === 'false') output.autoupdate = false
  if (output.references) output.references = normalizeReferences(output.references)
  if (!output.$schema) output.$schema = 'https://opencode.ai/config.json'
  return output
}
```

创建 `src/renderer/src/hooks/useSaveConfig.ts`：
```ts
import { useState } from 'react'
import { useConfigStore } from '../store/configStore'
import { normalizeDraft } from '../store/normalize'

export function useSaveConfig() {
  const [status, setStatus] = useState('')
  const save = async (): Promise<{ saved: boolean; errors: string[] }> => {
    const { draft, markSaved } = useConfigStore.getState()
    const normalized = normalizeDraft(draft)
    try {
      const errors = await window.api.saveConfig(normalized, false)
      markSaved()
      setStatus('已保存，需重启 opencode 生效')
      return { saved: true, errors }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const confirmed = window.confirm(`校验未通过：\n${message}\n\n仍要强制保存吗？`)
      if (!confirmed) {
        setStatus('已取消保存')
        return { saved: false, errors: [message] }
      }
      await window.api.saveConfig(normalized, true)
      markSaved()
      setStatus('已强制保存，需重启 opencode 生效')
      return { saved: true, errors: [message] }
    }
  }
  return { save, status }
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/store/normalize.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/store/normalize.ts src/renderer/src/store/normalize.test.ts src/renderer/src/hooks
git commit -m "feat(renderer): 保存流程与草稿归一化"
```

---

### Task 14: 页面路由整合与 round-trip 回归

**Files:**
- Modify: `src/renderer/src/App.tsx`
- Create: `src/renderer/src/store/roundtrip.test.ts`

**Interfaces:**
- Consumes: 全部页面组件、`RawJsonDialog`、`useSaveConfig`
- Produces: 完整可用的应用

- [ ] **Step 1: 写 round-trip 回归测试**

创建 `src/renderer/src/store/roundtrip.test.ts`：
```ts
import { describe, expect, it } from 'vitest'
import { normalizeDraft } from './normalize'
import { getAt, setAt, deleteAt } from '../fields/path'

describe('round-trip safety', () => {
  it('keeps unknown and deprecated fields untouched', () => {
    const loaded = {
      $schema: 'https://opencode.ai/config.json',
      model: 'a/b',
      mode: { build: { temperature: 0.2 } },
      reference: { old: '../old' },
      totally_unknown: { keep: true }
    }
    const draft = structuredClone(loaded)
    setAt(draft, ['model'], 'c/d')
    const written = normalizeDraft(draft)
    expect(written.mode).toEqual(loaded.mode)
    expect(written.reference).toEqual(loaded.reference)
    expect(written.totally_unknown).toEqual(loaded.totally_unknown)
    expect(written.model).toBe('c/d')
  })

  it('editing a nested field leaves siblings intact', () => {
    const draft: Record<string, unknown> = {
      permission: { edit: 'allow', bash: { 'git *': 'allow' } }
    }
    setAt(draft, ['permission', 'edit'], 'deny')
    expect(getAt(draft, ['permission', 'bash'])).toEqual({ 'git *': 'allow' })
    deleteAt(draft, ['permission', 'edit'])
    expect(draft.permission).toEqual({ bash: { 'git *': 'allow' } })
  })
})
```

- [ ] **Step 2: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/store/roundtrip.test.ts`
Expected: PASS（基础设施已具备）

- [ ] **Step 3: 整合 App 路由**

修改 `src/renderer/src/App.tsx`，把 Plan 1 的占位内容替换为按 `active` 渲染各页面：
```tsx
import { useEffect, useState } from 'react'
import { Box, Button, Text } from '@chakra-ui/react'
import { AppLayout } from './components/layout/AppLayout'
import { RawJsonDialog } from './components/RawJsonDialog'
import { useConfigStore } from './store/configStore'
import { useSaveConfig } from './hooks/useSaveConfig'
import { GeneralPage } from './pages/GeneralPage'
import { ModelPage } from './pages/ModelPage'
import { ProviderPage } from './pages/ProviderPage'
import { McpPage } from './pages/McpPage'
import { PermissionPage } from './pages/PermissionPage'
import { AgentPage } from './pages/AgentPage'
import { CommandPage } from './pages/CommandPage'
import { SkillsPage } from './pages/SkillsPage'
import { PluginsPage } from './pages/PluginsPage'
import { AdvancedPage } from './pages/AdvancedPage'

const NAV = [
  { id: 'general', label: '常规' },
  { id: 'model', label: '模型' },
  { id: 'provider', label: 'Provider' },
  { id: 'credentials', label: '服务商凭证' },
  { id: 'mcp', label: 'MCP 服务' },
  { id: 'permission', label: '权限' },
  { id: 'agent', label: 'Agents' },
  { id: 'command', label: 'Commands' },
  { id: 'skills', label: 'Skills 与 References' },
  { id: 'plugins', label: '插件与工具' },
  { id: 'advanced', label: '高级' },
  { id: 'files', label: '文件管理' }
]

function CurrentPage({ id }: { id: string }) {
  if (id === 'general') return <GeneralPage />
  if (id === 'model') return <ModelPage />
  if (id === 'provider') return <ProviderPage />
  if (id === 'mcp') return <McpPage />
  if (id === 'permission') return <PermissionPage />
  if (id === 'agent') return <AgentPage />
  if (id === 'command') return <CommandPage />
  if (id === 'skills') return <SkillsPage />
  if (id === 'plugins') return <PluginsPage />
  if (id === 'advanced') return <AdvancedPage />
  return <Text color="fg.muted">该页面将在 Plan 3 实现。</Text>
}

export function App() {
  const [active, setActive] = useState('general')
  const [configPath, setConfigPath] = useState('')
  const [rawOpen, setRawOpen] = useState(false)
  const [rawContent, setRawContent] = useState<string | undefined>(undefined)
  const [error, setError] = useState('')
  const dirty = useConfigStore((s) => s.dirty)
  const loadConfig = useConfigStore((s) => s.loadConfig)
  const { save, status } = useSaveConfig()

  useEffect(() => {
    Promise.all([window.api.readConfig(), window.api.getConfigPath()])
      .then(([config, path]) => {
        loadConfig(config)
        setConfigPath(path)
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [loadConfig])

  return (
    <>
      <AppLayout
        navItems={NAV}
        active={active}
        onNavigate={setActive}
        configPath={configPath}
        dirty={dirty}
        onSave={save}
        onShowRaw={() => {
          setRawContent(undefined)
          setRawOpen(true)
        }}
      >
        {error ? (
          <Box borderWidth="1px" borderColor="error" borderRadius="card" p="12px" mb="16px">
            <Text fontSize="sm" color="error">
              {error}
            </Text>
            <Button
              size="xs"
              mt="8px"
              onClick={() =>
                window.api.getRawContent().then((content) => {
                  setRawContent(content ?? '')
                  setRawOpen(true)
                })
              }
            >
              查看原始文件内容
            </Button>
          </Box>
        ) : null}
        <CurrentPage id={active} />
        {status ? (
          <Box mt="16px">
            <Text fontSize="sm" color="fg.muted">
              {status}
            </Text>
          </Box>
        ) : null}
      </AppLayout>
      <RawJsonDialog
        open={rawOpen}
        onClose={() => {
          setRawOpen(false)
          setRawContent(undefined)
        }}
        content={rawContent}
      />
    </>
  )
}
```

- [ ] **Step 4: 全量校验**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: 全部通过

- [ ] **Step 5: 手动验证**

Run: `pnpm dev`
Expected: 各导航页可编辑；保存后 `~/.config/opencode/opencode.jsonc` 被正确覆盖；重启提示出现；原始 JSON 弹窗只读展示。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: 整合全部配置表单页与保存流程"
```

---

## 完成标准（Plan 2）

- 11 个导航页全部可用，复杂字段（provider / mcp / permission / agent / command）均有专用 UI。
- 保存走校验 + 强制保存 + 重启提示流程。
- round-trip 回归测试通过，未展示字段（deprecated、未知键）不丢失。
- `pnpm test`、`pnpm typecheck`、`pnpm lint` 全部通过。
