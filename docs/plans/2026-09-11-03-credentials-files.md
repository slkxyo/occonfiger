# occonfiger 实现计划 · Plan 3：凭证与文件管理（credentials-files）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现服务商凭证管理页与 agent/command/skill 文件管理页，并整合进应用导航，完成整个 MVP。

**Architecture:** 复用 Plan 1 的 preload API 与 Plan 2 的 `Section`、`ListEditor` 风格组件。凭证页只管理 `auth.json` 已有条目（改密钥/删除）；文件管理页做增删改与「用系统编辑器打开」。

**Tech Stack:** React 19、TypeScript、Chakra UI v3、zustand、Vitest、@testing-library/react。

**Spec:** `docs/specs/2026-09-11-opencode-config-editor-design.md`

## Global Constraints

- 前置：Plan 1、Plan 2 已完成并通过全部测试。
- 语言：面向用户文案用简体中文；代码标识符用英文；不写任何注释。
- 颜色一律用语义 token；禁止写死颜色。
- 凭证密钥只展示末 4 位（脱敏），完整值不得进入 UI 或日志。
- 新增凭证不在应用内提供，UI 明确提示用 `/connect` 或 `opencode auth login`。
- 每个任务结束必须 `pnpm test`、`pnpm typecheck`、`pnpm lint` 通过后提交。

---

### Task 1: 服务商凭证页

**Files:**
- Create: `src/renderer/src/pages/CredentialsPage.tsx`
- Test: `src/renderer/src/pages/CredentialsPage.test.tsx`

**Interfaces:**
- Consumes: `Section`（Plan 2 Task 2）、`window.api.listCredentials` / `updateCredentialKey` / `deleteCredential`（Plan 1 Task 11）
- Produces: `<CredentialsPage />`

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/pages/CredentialsPage.test.tsx`：
```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { CredentialsPage } from './CredentialsPage'

function stubApi(overrides: Record<string, unknown> = {}) {
  const api = {
    listCredentials: vi.fn().mockResolvedValue([
      { provider: 'deepseek', type: 'api', keyTail: 'abcd' },
      { provider: 'anthropic', type: 'oauth' }
    ]),
    updateCredentialKey: vi.fn().mockResolvedValue(null),
    deleteCredential: vi.fn().mockResolvedValue(null),
    ...overrides
  }
  vi.stubGlobal('api', api)
  return api
}

describe('CredentialsPage', () => {
  it('lists providers with masked keys', async () => {
    stubApi()
    render(
      <Provider>
        <CredentialsPage />
      </Provider>
    )
    expect(await screen.findByText('deepseek')).toBeInTheDocument()
    expect(screen.getByText('••••abcd')).toBeInTheDocument()
    expect(screen.getByText('anthropic')).toBeInTheDocument()
  })

  it('updates an api key', async () => {
    const api = stubApi()
    render(
      <Provider>
        <CredentialsPage />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('button', { name: '修改密钥' }))
    await userEvent.type(screen.getByLabelText('新密钥'), 'sk-newkey')
    await userEvent.click(screen.getByRole('button', { name: '保存密钥' }))
    expect(api.updateCredentialKey).toHaveBeenCalledWith('deepseek', 'sk-newkey')
  })

  it('deletes after confirmation', async () => {
    const api = stubApi()
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    render(
      <Provider>
        <CredentialsPage />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('button', { name: '删除 deepseek' }))
    expect(api.deleteCredential).toHaveBeenCalledWith('deepseek')
  })

  it('shows empty state', async () => {
    stubApi({ listCredentials: vi.fn().mockResolvedValue([]) })
    render(
      <Provider>
        <CredentialsPage />
      </Provider>
    )
    expect(await screen.findByText(/尚无已连接的服务商/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/pages/CredentialsPage.test.tsx`
Expected: FAIL，找不到 `./CredentialsPage`

- [ ] **Step 3: 实现**

创建 `src/renderer/src/pages/CredentialsPage.tsx`：
```tsx
import { Box, Button, HStack, Input, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Section } from '../components/Section'

type Credential = { provider: string; type: string; keyTail?: string }

export function CredentialsPage() {
  const [items, setItems] = useState<Credential[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [newKey, setNewKey] = useState('')

  const reload = () => window.api.listCredentials().then(setItems)

  useEffect(() => {
    reload()
  }, [])

  return (
    <Section
      title="服务商凭证"
      description="管理 /connect 已连接的服务商。新增凭证请在 opencode 中运行 /connect 或 opencode auth login。"
    >
      {items.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          尚无已连接的服务商，请在 opencode 中运行 /connect 添加。
        </Text>
      ) : (
        items.map((item) => (
          <Box
            key={item.provider}
            borderWidth="1px"
            borderColor="border.default"
            borderRadius="card"
            p="16px"
            mb="12px"
            bg="bg.default"
          >
            <HStack justify="space-between" mb="8px">
              <HStack gap="8px">
                <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
                  {item.provider}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {item.type}
                </Text>
              </HStack>
              <HStack gap="8px">
                {item.type === 'api' ? (
                  <Button size="xs" variant="ghost" onClick={() => setEditing(item.provider)}>
                    修改密钥
                  </Button>
                ) : null}
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="error"
                  aria-label={`删除 ${item.provider}`}
                  onClick={() => {
                    if (!window.confirm(`确定删除 ${item.provider} 的凭证吗？`)) return
                    window.api.deleteCredential(item.provider).then(reload)
                  }}
                >
                  删除
                </Button>
              </HStack>
            </HStack>
            <Text fontSize="xs" color="fg.muted" fontFamily="mono">
              {item.keyTail ? `••••${item.keyTail}` : '（OAuth，需在 opencode 中重新连接）'}
            </Text>
            {editing === item.provider ? (
              <HStack mt="12px">
                <Input
                  aria-label="新密钥"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="sk-..."
                />
                <Button
                  size="sm"
                  colorPalette="accent"
                  onClick={() => {
                    window.api.updateCredentialKey(item.provider, newKey).then(() => {
                      setEditing(null)
                      setNewKey('')
                      reload()
                    })
                  }}
                >
                  保存密钥
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                  取消
                </Button>
              </HStack>
            ) : null}
          </Box>
        ))
      )}
    </Section>
  )
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/pages/CredentialsPage.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/pages/CredentialsPage.tsx src/renderer/src/pages/CredentialsPage.test.tsx
git commit -m "feat(renderer): 服务商凭证管理页"
```

---

### Task 2: 文件管理页

**Files:**
- Create: `src/renderer/src/pages/FileManagerPage.tsx`
- Test: `src/renderer/src/pages/FileManagerPage.test.tsx`

**Interfaces:**
- Consumes: `Section`、`window.api.listManagedFiles` / `createManagedFile` / `renameManagedFile` / `deleteManagedFile` / `openManagedFile`
- Produces: `<FileManagerPage />`；`ManagedKind = 'agent' | 'command' | 'skill'`

- [ ] **Step 1: 写失败测试**

创建 `src/renderer/src/pages/FileManagerPage.test.tsx`：
```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { FileManagerPage } from './FileManagerPage'

function stubApi() {
  const api = {
    listManagedFiles: vi.fn().mockResolvedValue([
      { name: 'reviewer.md', path: '/cfg/agent/reviewer.md' }
    ]),
    createManagedFile: vi.fn().mockResolvedValue('/cfg/agent/new.md'),
    renameManagedFile: vi.fn().mockResolvedValue(null),
    deleteManagedFile: vi.fn().mockResolvedValue(null),
    openManagedFile: vi.fn().mockResolvedValue(null)
  }
  vi.stubGlobal('api', api)
  return api
}

describe('FileManagerPage', () => {
  it('lists agent files', async () => {
    stubApi()
    render(
      <Provider>
        <FileManagerPage />
      </Provider>
    )
    expect(await screen.findByText('reviewer.md')).toBeInTheDocument()
  })

  it('creates a file', async () => {
    const api = stubApi()
    render(
      <Provider>
        <FileManagerPage />
      </Provider>
    )
    await userEvent.type(await screen.findByLabelText('新建名称'), 'deploy')
    await userEvent.click(screen.getByRole('button', { name: '新建' }))
    expect(api.createManagedFile).toHaveBeenCalledWith('agent', 'deploy')
  })

  it('opens a file with the system editor', async () => {
    const api = stubApi()
    render(
      <Provider>
        <FileManagerPage />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('button', { name: '打开 reviewer.md' }))
    expect(api.openManagedFile).toHaveBeenCalledWith('/cfg/agent/reviewer.md')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/pages/FileManagerPage.test.tsx`
Expected: FAIL，找不到 `./FileManagerPage`

- [ ] **Step 3: 实现**

创建 `src/renderer/src/pages/FileManagerPage.tsx`：
```tsx
import { Box, Button, HStack, Input, Tabs, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Section } from '../components/Section'

type ManagedKind = 'agent' | 'command' | 'skill'
type ManagedFile = { name: string; path: string }

const TABS: { kind: ManagedKind; label: string }[] = [
  { kind: 'agent', label: 'Agents' },
  { kind: 'command', label: 'Commands' },
  { kind: 'skill', label: 'Skills' }
]

function KindPanel({ kind }: { kind: ManagedKind }) {
  const [files, setFiles] = useState<ManagedFile[]>([])
  const [name, setName] = useState('')

  const reload = () => window.api.listManagedFiles(kind).then(setFiles)

  useEffect(() => {
    reload()
  }, [kind])

  return (
    <Box pt="16px">
      <HStack mb="16px">
        <Input
          aria-label="新建名称"
          value={name}
          placeholder="名称"
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          size="sm"
          colorPalette="accent"
          onClick={() => {
            if (!name.trim()) return
            window.api.createManagedFile(kind, name.trim()).then(() => {
              setName('')
              reload()
            })
          }}
        >
          新建
        </Button>
      </HStack>
      {files.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          该目录下暂无文件。
        </Text>
      ) : (
        files.map((file) => (
          <HStack
            key={file.path}
            justify="space-between"
            borderWidth="1px"
            borderColor="border.default"
            borderRadius="card"
            p="12px"
            mb="8px"
            bg="bg.default"
          >
            <Text fontFamily="mono" fontSize="sm">
              {file.name}
            </Text>
            <HStack gap="8px">
              <Button
                size="xs"
                variant="ghost"
                aria-label={`打开 ${file.name}`}
                onClick={() => window.api.openManagedFile(file.path)}
              >
                打开
              </Button>
              <Button
                size="xs"
                variant="ghost"
                aria-label={`重命名 ${file.name}`}
                onClick={() => {
                  const next = window.prompt('新名称', file.name.replace(/\.md$/, ''))
                  if (!next) return
                  window.api.renameManagedFile(kind, file.name, next).then(reload)
                }}
              >
                重命名
              </Button>
              <Button
                size="xs"
                variant="ghost"
                colorPalette="error"
                aria-label={`删除 ${file.name}`}
                onClick={() => {
                  if (!window.confirm(`确定删除 ${file.name} 吗？`)) return
                  window.api.deleteManagedFile(kind, file.name).then(reload)
                }}
              >
                删除
              </Button>
            </HStack>
          </HStack>
        ))
      )}
    </Box>
  )
}

export function FileManagerPage() {
  return (
    <Section
      title="文件管理"
      description="管理 agent / command / skill 目录下的文件。内容请用系统编辑器打开后编辑。"
    >
      <Tabs.Root defaultValue="agent">
        <Tabs.List>
          {TABS.map((tab) => (
            <Tabs.Trigger key={tab.kind} value={tab.kind}>
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {TABS.map((tab) => (
          <Tabs.Content key={tab.kind} value={tab.kind}>
            <KindPanel kind={tab.kind} />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </Section>
  )
}
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/pages/FileManagerPage.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/pages/FileManagerPage.tsx src/renderer/src/pages/FileManagerPage.test.tsx
git commit -m "feat(renderer): 文件管理页"
```

---

### Task 3: 应用整合与最终打磨

**Files:**
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/pages/CredentialsPage.tsx`（如需类型修正）
- Test: `src/renderer/src/App.test.tsx`

**Interfaces:**
- Consumes: `<CredentialsPage />`（Task 1）、`<FileManagerPage />`（Task 2）
- Produces: 完整 MVP

- [ ] **Step 1: 更新 App 测试覆盖新页**

修改 `src/renderer/src/App.test.tsx`，新增：
```tsx
it('renders the credentials page when selected', async () => {
  vi.stubGlobal('api', {
    ...api,
    listCredentials: vi.fn().mockResolvedValue([])
  })
  render(
    <Provider>
      <App />
    </Provider>
  )
  const { default: userEvent } = await import('@testing-library/user-event')
  await userEvent.click(screen.getByRole('button', { name: '服务商凭证' }))
  expect(await screen.findByText(/尚无已连接的服务商/)).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm exec vitest run src/renderer/src/App.test.tsx`
Expected: FAIL（App 尚未渲染凭证页）

- [ ] **Step 3: 接入两个新页面**

修改 `src/renderer/src/App.tsx`：
```tsx
import { CredentialsPage } from './pages/CredentialsPage'
import { FileManagerPage } from './pages/FileManagerPage'
```
并在 `CurrentPage` 中增加：
```tsx
  if (id === 'credentials') return <CredentialsPage />
  if (id === 'files') return <FileManagerPage />
```
移除末尾的占位 `Text` 分支。

- [ ] **Step 4: 运行确认通过**

Run: `pnpm exec vitest run src/renderer/src/App.test.tsx`
Expected: PASS

- [ ] **Step 5: 全量校验**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: 全部通过，`out/` 生成

- [ ] **Step 6: 手动验证**

Run: `pnpm dev`
Expected:
- 凭证页显示真实 `auth.json` 的 provider，密钥脱敏；改密钥、删除生效。
- 文件管理页能列出/新建/重命名/删除/打开真实文件。
- 明暗切换、原始 JSON 弹窗、保存流程均正常。

- [ ] **Step 7: 更新 README**

修改 `README.md`，补充功能说明与开发命令：
```markdown
# occonfiger

opencode 全局配置的可视化编辑器。

## 功能

- 可视化编辑 `~/.config/opencode/opencode.json(c)` 全量字段
- 管理 `/connect` 已连接的服务商凭证（改密钥 / 删除）
- 管理 agent / command / skill 文件
- 亮色 / 暗色 / 跟随系统主题

## 开发

pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "feat: 接入凭证与文件管理页，完成 MVP"
```

---

## 完成标准（Plan 3）

- 凭证页与文件管理页可用，并已接入导航。
- `pnpm test`、`pnpm typecheck`、`pnpm lint`、`pnpm build` 全部通过。
- README 更新。
- 整个 MVP 可在 `pnpm dev` 下完成：读配置 → 表单编辑 → 保存 → 管理凭证与文件。
