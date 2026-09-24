# shadcn UI 重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 OCConfiger 的 UI 从 Chakra UI v3 + Emotion 全量重构为 shadcn/ui（Tailwind v4 + Radix），采用 base-nova 默认风格，移除 Chakra/Emotion。

**Architecture:** 一次性全量替换——先搭 Tailwind v4 + shadcn 基础设施，整理目录，迁移共享组件，逐页转写 6 个页面，实现会话管理 UI 收尾，最后清理 Chakra/Emotion。无长期共存期，规避 preflight 冲突。

**Tech Stack:** Tailwind v4 (`@tailwindcss/vite`)、shadcn/ui (base-nova preset, `radix-ui` 聚合包)、next-themes（复用）、lucide-react、React 19、Vite 7、Electron 39。

**Spec:** `docs/superpowers/specs/2026-09-25-shadcn-refactor-design.md`（映射表、实现顺序、风险点详见 spec §4-§5）

## Global Constraints

- 所有文案/注释/错误消息用简体中文（与现有一致）
- 不改功能逻辑，只换 UI 实现，交互流程保持等价
- 视觉采用 shadcn base-nova 默认风格（neutral/slate），不保留现有靛蓝 accent
- next-themes 保留（`attribute="class"` 与 shadcn `.dark` 兼容）
- 现有 174 测试不得回归（断言随结构变化更新不算回归）
- 子代理执行用 `deepseek/deepseek-flash` 模型
- Tailwind 插件必须加在 `electron.vite.config.ts` 的 **renderer 段**（加顶层会失效）
- shadcn CLI 在嵌套 renderer 目录探测可能失败，需手工配 `components.json`

## Review Focus

1. **Tailwind preflight 共存冲击**：步骤 3-4 期间 Chakra 组件样式被 reset 覆盖→快速推进 + 必要时 `@layer` 限定 preflight 作用域
2. **shadcn CLI 嵌套目录探测失败**：手工创建 `components.json` 指定 `css=src/renderer/src/index.css`、`aliases @/*`
3. **success/warning 无 shadcn 对应**：自定义 `--success/--warning` CSS 变量 + `@theme` 映射，否则语义色丢失
4. **MenuSelect 重写**：shadcn Select 无 `xs` size、无 allowEmpty 占位，需用 placeholder 或空值选项适配
5. **vitest 处理 Tailwind v4 CSS 导入**：`@import "tailwindcss"` 在 jsdom 可能报错，需在 vitest config stub CSS 或确认不崩

---

## File Structure

**新增**：
- `src/renderer/src/index.css` — Tailwind v4 入口（`@import "tailwindcss"` + base-nova 变量 + success/warning + `@custom-variant dark`）
- `src/renderer/src/lib/utils.ts` — shadcn `cn` 工具（CLI 生成）
- `src/renderer/src/components/ui/*.tsx` — shadcn 生成组件（button/input/textarea/switch/dialog/card/label/select/tooltip）
- `src/renderer/src/components/app/provider.tsx`、`color-mode.tsx`、`theme-order.ts` — 从 `ui/` 迁入（provider 简化）
- `src/renderer/src/pages/SessionsPage.tsx` — 会话管理 UI（收尾）
- `components.json` — shadcn 配置

**修改**：
- `electron.vite.config.ts` — renderer.plugins 加 `tailwindcss()`，alias 加 `@`
- `tsconfig.web.json` — paths 加 `@/*`
- `package.json` — 加 tailwindcss/@tailwindcss/vite/clsx/tailwind-merge/radix-ui，移除 @chakra-ui/react/@emotion/react
- `src/renderer/src/main.tsx` — 加 `import './index.css'`
- `src/renderer/src/components/{Section,ConfigViewButton,ListEditor,KeyValueEditor,PermissionRulesEditor,motion}.tsx` — Chakra→shadcn
- `src/renderer/src/components/fields/{Field,controls,MenuSelect,useField,path}.tsx` — Chakra→shadcn
- `src/renderer/src/components/layout/{AppLayout,Sidebar}.tsx` — Chakra→shadcn
- `src/renderer/src/pages/{SettingsPage,McpPage,PluginPage,AgentsPage,CredentialsPage,FileManagerPage}.tsx` — Chakra→shadcn
- `src/renderer/src/App.tsx` — NAV 加 sessions 项
- 各 `.test.tsx` — DOM 断言跟随更新
- `src/renderer/src/motion.css` — 移除 `.chakra-button` 选择器

**删除**：
- `src/renderer/src/theme.ts` — Chakra createSystem（不再需要）

---

## Task 1: 基础设施搭建

**Files:**
- Create: `components.json`、`src/renderer/src/index.css`、`src/renderer/src/lib/utils.ts`
- Modify: `electron.vite.config.ts`、`tsconfig.web.json`、`package.json`、`src/renderer/src/main.tsx`

**Interfaces:**
- Produces: Tailwind v4 在 renderer 生效；`@` alias 可用；shadcn CLI 可运行；`cn()` 工具可用；next-themes 仍工作

- [ ] **Step 1: 安装依赖**
```bash
pnpm add tailwindcss @tailwindcss/vite clsx tailwind-merge
pnpm add -D @types/node
```

- [ ] **Step 2: 配置 vite + alias**

`electron.vite.config.ts` renderer 段：
```ts
import tailwindcss from '@tailwindcss/vite'
// renderer:
renderer: {
  resolve: { alias: { '@renderer': resolve('src/renderer/src'), '@': resolve('src/renderer/src') } },
  plugins: [react(), tailwindcss()]
}
```
`tsconfig.web.json` 的 `paths` 加 `"@/*": ["src/renderer/src/*"]`（保留 `@renderer/*`）。

- [ ] **Step 3: 手工创建 components.json**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/renderer/src/index.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 4: 运行 shadcn init + add 组件**

```bash
pnpm dlx shadcn@latest init    # 若交互问起，选 base-nova/neutral/cssVariables
pnpm dlx shadcn@latest add -y button input textarea switch dialog card label select tooltip
```
确认 `src/renderer/src/index.css` 生成（含 `@import "tailwindcss"`、base-nova 变量、`@custom-variant dark`）和 `src/renderer/src/lib/utils.ts`（`cn`）。

- [ ] **Step 5: 补 success/warning 变量**

在 `index.css` 的 `:root`/`.dark` 追加 success/warning，并在 `@theme inline` 加映射（值见 spec §4.3）。

- [ ] **Step 6: main.tsx 加 CSS 导入**

`src/renderer/src/main.tsx` 顶部加 `import './index.css'`（保留现有 `import './motion.css'`）。

- [ ] **Step 7: 验证 Tailwind 生效 + dev 启动**

```bash
pnpm run dev
```
确认应用启动不崩、Tailwind class 生效（可临时在某处加 `className="text-red-500"` 看渲染）。Chakra 页面此时仍正常（共存期短暂）。

- [ ] **Step 8: 提交**
```bash
git add -A && git commit -m "feat(shadcn): 基础设施 Tailwind v4 + shadcn 初始化"
```

---

## Task 2: 目录整理 + provider 简化

**Files:**
- Move: `src/renderer/src/components/ui/{provider,color-mode,theme-order}.tsx` → `src/renderer/src/components/app/`
- Modify: `src/renderer/src/components/app/provider.tsx`（移除 ChakraProvider）

**Interfaces:**
- Produces: `components/ui/` 腾空给 shadcn；`Provider` 组件只含 next-themes

- [ ] **Step 1: 迁移文件**

```bash
mkdir -p src/renderer/src/components/app
git mv src/renderer/src/components/ui/provider.tsx src/renderer/src/components/app/provider.tsx
git mv src/renderer/src/components/ui/color-mode.tsx src/renderer/src/components/app/color-mode.tsx
git mv src/renderer/src/components/ui/theme-order.ts src/renderer/src/components/app/theme-order.ts
```
更新所有 import 引用（`from '@/components/ui/provider'` → `from '@/components/app/provider'`，或 `@renderer` 等价路径）。

- [ ] **Step 2: 简化 provider.tsx**

移除 ChakraProvider，只留 next-themes：
```tsx
import { ThemeProvider } from 'next-themes'
export function Provider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class" disableTransitionOnChange>{children}</ThemeProvider>
}
```

- [ ] **Step 3: 验证 typecheck + dev 启动**

```bash
pnpm typecheck && pnpm run dev
```
确认无 ChakraProvider 报错（此时 Chakra 组件仍能在没有 Provider 下渲染基础样式，共存期短暂）。

- [ ] **Step 4: 提交**
```bash
git add -A && git commit -m "refactor(shadcn): 整理目录 ui→app，简化 provider"
```

---

## Task 3: 共享组件迁移（Chakra → shadcn）

**Files:**
- Modify: `src/renderer/src/components/{Section,ConfigViewButton,ListEditor,KeyValueEditor,PermissionRulesEditor,motion}.tsx`
- Modify: `src/renderer/src/components/fields/{Field,controls,MenuSelect,useField,path}.tsx`
- Modify: `src/renderer/src/components/layout/{AppLayout,Sidebar}.tsx`
- Modify: `src/renderer/src/motion.css`
- Test: 各对应 `.test.tsx`

**Interfaces:**
- Consumes: shadcn 组件（button/card/dialog/input/switch/select/label）、`cn()`、Tailwind class
- Produces: 共享组件无 Chakra 依赖，供页面使用

映射遵循 spec §4.4 映射表。每个组件：
1. 替换 Chakra 组件为 shadcn/Tailwind 等价
2. 语义 token 字符串（`fg.muted`/`error`/`bg.subtle`/`border.default`/`borderRadius=card`/`fontFamily=mono`/`colorPalette=accent|error`）→ Tailwind class（见 spec §4.4 映射表）
3. 更新对应 `.test.tsx` 的 DOM 断言（结构/选择器变化）

- [ ] **Step 1: Section.tsx → 基于 shadcn Card 重写**
保持 `title/description/action/children` props。Card/CardHeader/CardTitle/CardDescription/CardContent。

- [ ] **Step 2: ConfigViewButton.tsx → shadcn Dialog**
DialogTrigger/DialogContent/DialogHeader/DialogTitle，内容展示 JSON。

- [ ] **Step 3: layout/AppLayout.tsx + Sidebar.tsx → div + Tailwind flex 布局**
保持 navItems/active/onNavigate props。Sidebar 折叠逻辑保留。

- [ ] **Step 4: fields/Field.tsx + controls.tsx → shadcn Input/Switch + label**
TextField/NumberField/BooleanField 受控输入，用 shadcn Input/Switch。注意 controls.tsx 的 `kind='number'` 模式（空串 clear、合法写 number）保留逻辑。

- [ ] **Step 5: fields/MenuSelect.tsx → 重写为 shadcn Select**
shadcn Select 无 xs size、无 allowEmpty 占位→用 placeholder 或空值选项适配。保持 value/onChange/options 接口。

- [ ] **Step 6: ListEditor.tsx + KeyValueEditor.tsx + PermissionRulesEditor.tsx → div + shadcn Button/Switch/Select**
PermissionRulesEditor 的上下移/增删/通配 action 保留逻辑。

- [ ] **Step 7: motion.ts + motion.css**
保留入场动画 class（`oc-enter/oc-fade/oc-rotate`）。motion.css 移除 `.chakra-button` 选择器，shadcn 按钮 `:active` 缩放用 `[data-slot="button"]:active { transform: scale(0.95) }` 或 Tailwind `active:scale-95`。

- [ ] **Step 8: 更新所有对应 .test.tsx 断言**
DOM 结构变化，更新 querySelector/getByText/role 断言匹配新结构。

- [ ] **Step 9: 验证**
```bash
pnpm test && pnpm typecheck && pnpm lint
```
若共存期 preflight 视觉异常严重，在 index.css 用 `@layer` 限定 preflight 作用域临时缓解。

- [ ] **Step 10: 提交**
```bash
git add -A && git commit -m "refactor(shadcn): 共享组件迁移 Chakra→shadcn"
```

---

## Task 4: 页面迁移（6 页面）

**Files:**
- Modify: `src/renderer/src/pages/{SettingsPage,McpPage,PluginPage,AgentsPage,CredentialsPage,FileManagerPage}.tsx`
- Test: 各对应 `.test.tsx`

**Interfaces:**
- Consumes: Task 3 的共享组件
- Produces: 6 页面无 Chakra 依赖

每页按 spec §4.4 映射表机械替换 Chakra 组件 + 语义 token。更新对应测试断言。

- [ ] **Step 1: SettingsPage.tsx**（autoupdate + 权限编辑器）
- [ ] **Step 2: McpPage.tsx**（MCP servers，含 kind='number' 超时字段）
- [ ] **Step 3: PluginPage.tsx**（插件列表，Switch 启停）
- [ ] **Step 4: AgentsPage.tsx**（提示词编辑）
- [ ] **Step 5: CredentialsPage.tsx**（凭证）
- [ ] **Step 6: FileManagerPage.tsx**（SKILL 管理）
- [ ] **Step 7: 更新各页 .test.tsx 断言**
- [ ] **Step 8: 验证**
```bash
pnpm test && pnpm typecheck && pnpm lint
```
- [ ] **Step 9: 提交**
```bash
git add -A && git commit -m "refactor(shadcn): 6 页面迁移 Chakra→shadcn"
```

---

## Task 5: SessionsPage 实现（会话管理 UI 收尾）

**Files:**
- Create: `src/renderer/src/pages/SessionsPage.tsx`、`src/renderer/src/pages/SessionsPage.test.tsx`
- Modify: `src/renderer/src/App.tsx`（NAV 加 sessions 项，用 lucide `MessageSquareText` 或 `History` 图标）

**Interfaces:**
- Consumes: `window.api.listSessions/renameSession/deleteSession`（数据层已就绪 `fca96cf`）、会话管理 spec §5 布局
- Produces: 会话管理页面可用

按会话管理 spec §5 实现（用 shadcn 组件）：
- 搜索框（标题模糊过滤）+ 刷新按钮
- 卡片列表：标题（内联编辑→回车/Esc/失焦保存）、副信息（创建/更新时间、消息数、目录）、归档徽章、重命名/删除按钮
- 删除二次确认（文案见 spec §5.3）
- 时间戳 `Intl.DateTimeFormat('zh-CN', ...)`

- [ ] **Step 1: 写 SessionsPage.test.tsx**（mock window.api，测列表渲染/搜索/重命名/删除确认）
- [ ] **Step 2: 实现 SessionsPage.tsx**
- [ ] **Step 3: App.tsx NAV 加 sessions 项**
- [ ] **Step 4: 验证**
```bash
pnpm test && pnpm typecheck && pnpm lint && pnpm run dev
```
dev 模式确认会话列表加载真实 opencode.db 数据、重命名/删除生效。
- [ ] **Step 5: 提交**
```bash
git add -A && git commit -m "feat: 会话管理 UI 页面（shadcn 实现）"
```

---

## Task 6: 清理 Chakra/Emotion

**Files:**
- Delete: `src/renderer/src/theme.ts`
- Modify: `package.json`（移除依赖）、`src/renderer/index.html`（若有 Chakra reset 内联样式）

- [ ] **Step 1: 确认无残留 Chakra 引用**
```bash
grep -r "@chakra-ui" src/ || echo "无 Chakra 引用"
```
- [ ] **Step 2: 移除依赖**
```bash
pnpm remove @chakra-ui/react @emotion/react
```
- [ ] **Step 3: 删除 theme.ts**
```bash
git rm src/renderer/src/theme.ts
```
- [ ] **Step 4: 验证**
```bash
pnpm test && pnpm typecheck && pnpm lint && pnpm run dev
```
- [ ] **Step 5: 提交**
```bash
git add -A && git commit -m "chore(shadcn): 移除 Chakra/Emotion 依赖与 theme.ts"
```

---

## Task 7: 全量验证 + 收尾

- [ ] **Step 1: 全量测试**
```bash
pnpm test
```
预期：全部通过（原 174 + SessionsPage 新增，断言已更新）。
- [ ] **Step 2: typecheck + lint**
```bash
pnpm typecheck && pnpm lint
```
预期：0 error 0 warning。
- [ ] **Step 3: dev 启动 + 人工核验**
```bash
pnpm run dev
```
逐页切换确认视觉（base-nova 风格）、交互（编辑/保存/切换）、暗色切换、会话管理列表/重命名/删除。
- [ ] **Step 4: grep 确认无残留**
```bash
grep -r "@chakra-ui\|@emotion\|ChakraProvider\|createSystem" src/ || echo "清理干净"
```
- [ ] **Step 5: 最终提交（如有零散改动）**
```bash
git add -A && git commit -m "chore(shadcn): 全量验证通过" --allow-empty || true
```

---

## Self-Review（写计划后自检）

1. **Spec coverage**：spec §4.1 基础设施→Task1；§4.2 目录整理→Task2；§4.3 主题→Task1(Step5)+Task6；§4.4 组件映射→Task3；§4.5 页面→Task4；§4.6 SessionsPage→Task5；§8 清理→Task6。全覆盖。
2. **Placeholder scan**：无 TBD/TODO，每步有具体改动/命令。
3. **Type consistency**：SessionsPage 依赖 `listSessions/renameSession/deleteSession`（数据层 `fca96cf` 已就绪，preload api 已暴露），类型一致。
4. **Review Focus**：5 项均在对应任务步骤标注（preflight→Task3 Step9，CLI 探测→Task1 Step3，success/warning→Task1 Step5，MenuSelect→Task3 Step5，vitest CSS→Task1 Step7 + 各 test 步骤）。

## Execution Handoff

用户已明确选择 **Subagent-driven**（子代理执行，模型 `deepseek/deepseek-flash`）。任务间强顺序依赖（Task N 依赖 Task N-1 的产出），故**顺序派发**子代理（前一个完成验证后再派下一个），不并行。
