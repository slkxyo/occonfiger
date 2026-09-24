# OCConfiger UI 框架重构为 shadcn — 设计文档

日期：2026-09-25
状态：待评审

## 1. 背景与目标

OCConfiger 当前 UI 基于 Chakra UI v3 + Emotion。目标是**全量重构为 shadcn/ui**（Tailwind v4 + Radix UI），统一到主流组件方案，降低长期维护成本，并为后续 UI 扩展（如会话管理页面）打基础。

**已确认的三个核心决策**：
- **版本路线**：最新 shadcn（Tailwind v4 + `radix-ui` 聚合包 + `base-nova` preset）
- **迁移策略**：一次性全量替换（无 Chakra+Tailwind 长期共存期，规避 preflight 冲突）
- **视觉风格**：采用 shadcn `base-nova` 默认风格（neutral/slate 配色 + shadcn 标准语义），不保留现有靛蓝 accent

**成功标准**：所有 6 个现有页面 + 共享组件用 shadcn/Tailwind 实现，视觉为 shadcn 默认风格；Chakra/Emotion 依赖移除；全量测试、typecheck、lint 通过；应用在 dev 模式正常启动运行。

## 2. 权威依据

- shadcn/ui 官方文档（context7 `/shadcn-ui/ui` + https://ui.shadcn.com/docs/installation/vite）
- 现有 UI 栈调研报告（本会话内子代理产出，见调研记录）

### 2.1 现有 UI 栈关键事实

- Chakra UI v3 用法干净：**0 处** `css=/sx=/useToast/useColorMode/chakra()` 工厂，迁移负担低
- 高频组件：`Box(33)/Text(41)/Button(22)/HStack(22)/Input(9)/Switch(6组)/IconButton(5)/Dialog(1组)`
- `next-themes` + `attribute="class"` 暗色机制，与 shadcn `.dark` **天然兼容，可零成本复用**
- 图标库已是 `lucide-react`（shadcn 默认）
- Emotion 源码 0 处直接 import，移除无代码迁移问题
- 无任何 Tailwind/PostCSS 配置，唯一 CSS 是 `src/renderer/src/motion.css`（自定义 keyframes + `.chakra-button` 选择器）
- 构建：`electron.vite.config.ts` 三段式（main/preload/renderer），renderer 段仅有 `@vitejs/plugin-react` + alias `@renderer`

### 2.2 shadcn 最新版集成要点

- Tailwind v4：`@import "tailwindcss"` + `@tailwindcss/vite` 插件，**无需 config 文件**（CSS-first）
- 组件分发：CLI 复制源码到 `components/ui/*.tsx`，基于 `radix-ui` 聚合包 + CVA + clsx + tailwind-merge
- `components.json`：`style=base-nova`、`css` 指向入口 CSS、`aliases` 用 `@/*`
- 暗色：`.dark` class + CSS 变量 + `@custom-variant dark (&:is(.dark *))`

## 3. 范围与非目标

**范围**：
- 6 个页面 + ~12 共享组件全量转写为 shadcn/Tailwind
- 基础设施搭建（Tailwind v4 + shadcn CLI + alias + CSS 入口）
- 主题系统切换（base-nova + next-themes 复用 + 补 success/warning）
- `MenuSelect`（自研下拉）重写为 shadcn `Select`
- 测试断言跟随更新
- 移除 Chakra/Emotion 依赖

**非目标**：
- 不改变功能逻辑（只换 UI 实现）
- 不重新设计交互流程（布局保持等价转换）
- 不做会话管理 UI 的完整实现（SessionsPage 作为收尾任务，见 §7，但纳入本次范围以便交付完整应用）

## 4. 设计

### 4.1 基础设施搭建

**安装**：
```bash
pnpm add tailwindcss @tailwindcss/vite
pnpm add -D @types/node   # shadcn CLI 需要
pnpm dlx shadcn@latest init   # 交互式，或手工配 components.json
```

**`electron.vite.config.ts`**（renderer 段加 Tailwind 插件 + 补 `@` alias）：
```ts
import tailwindcss from '@tailwindcss/vite'
// renderer 段：
renderer: {
  resolve: { alias: { '@renderer': resolve('src/renderer/src'), '@': resolve('src/renderer/src') } },
  plugins: [react(), tailwindcss()]
}
```

**`tsconfig.web.json`**：`paths` 加 `"@/*": ["src/renderer/src/*"]`（保留现有 `@renderer/*`）。

**`components.json`**（手工创建，CLI 探测嵌套目录大概率失败）：
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

**新建 `src/renderer/src/index.css`**：CLI init 会生成（含 `@import "tailwindcss"`、`@custom-variant dark`、base-nova 的 `:root`/`.dark` CSS 变量、`@theme inline` 映射）。在此基础上**追加 success/warning 变量**（见 §4.3）。

**`src/renderer/src/main.tsx`**：加 `import './index.css'`。

**`src/renderer/src/lib/utils.ts`**：shadcn 需要 `cn` 工具（clsx + tailwind-merge），CLI 会生成。

### 4.2 目录整理

现有 `src/renderer/src/components/ui/` 含 `provider.tsx`、`color-mode.tsx`、`theme-order.ts`（Chakra 专用）。shadcn 要往 `components/ui/` 放 `button.tsx` 等。

**整理**：
- 把 `provider.tsx`、`color-mode.tsx`、`theme-order.ts` 迁到 `src/renderer/src/components/app/`
- 腾空 `components/ui/` 给 shadcn 生成组件
- `provider.tsx` 简化：移除 ChakraProvider，只留 next-themes ThemeProvider：
  ```tsx
  export function Provider({ children }: { children: React.ReactNode }) {
    return <ThemeProvider attribute="class" disableTransitionOnChange>{children}</ThemeProvider>
  }
  ```

### 4.3 主题系统

- **base-nova 默认 CSS 变量**：用 CLI init 生成的 `:root` + `.dark`（neutral/slate 配色 + `--background/--foreground/--primary/--destructive/--border/--ring` 等）
- **next-themes 复用**：保留 `next-themes`，`attribute="class"` 与 shadcn `.dark` 兼容，`color-mode.tsx` 三态轮转逻辑几乎不改（只改 Chakra 图标组件 → lucide，已是 lucide）
- **补 success/warning**（shadcn 无对应）：在 `index.css` 追加：
  ```css
  :root {
    --success: oklch(0.62 0.19 149);      /* 绿 */
    --success-foreground: oklch(0.98 0.02 149);
    --warning: oklch(0.75 0.18 75);       /* 琥珀 */
    --warning-foreground: oklch(0.32 0.05 75);
  }
  .dark {
    --success: oklch(0.7 0.19 149);
    --success-foreground: oklch(0.12 0.02 149);
    --warning: oklch(0.78 0.17 75);
    --warning-foreground: oklch(0.15 0.03 75);
  }
  @theme inline {
    --color-success: var(--success);
    --color-success-foreground: var(--success-foreground);
    --color-warning: var(--warning);
    --color-warning-foreground: var(--warning-foreground);
  }
  ```
  现有用到 success/warning 语义处改用 `text-success`/`bg-success` 等 class。

### 4.4 组件映射与共享组件迁移

**add 的 shadcn 组件**：
```bash
pnpm dlx shadcn@latest add -y button input textarea switch dialog card label select tooltip
```

**Chakra → shadcn/Tailwind 映射**：

| Chakra | 迁移目标 |
|---|---|
| `Box/Flex/HStack/VStack` | `<div>` + Tailwind class（`flex gap-3 items-center` / `flex flex-col` 等） |
| `Text` | `<p>/<span>` + class（`text-sm text-muted-foreground` / `text-sm font-medium` 等） |
| `Button` | shadcn `Button`（variant: default/destructive/outline/ghost；size: default/sm/xs/icon） |
| `IconButton` | `Button size="icon" variant="ghost"` |
| `Input`/`Textarea` | shadcn `Input`/`Textarea` |
| `Switch.Root/HiddenInput/Control` | shadcn `Switch`（`checked`/`onCheckedChange`） |
| `Dialog.*` | shadcn `Dialog`（`DialogContent/DialogHeader/DialogTitle`） |
| `Heading` | `<h2>` + class |
| `Section`（自定义） | shadcn `Card`（`CardHeader/CardTitle/CardDescription/CardContent`） |
| `MenuSelect`（自研） | 重写为 shadcn `Select` |
| `ConfigViewButton` | shadcn `Dialog` |
| `AppLayout/Sidebar` | `<div>` + Tailwind 布局 |
| `Portal` | shadcn Dialog 内部自处理，移除 |

**语义 token 字符串 → Tailwind class**：

| Chakra token | Tailwind class |
|---|---|
| `color="fg.muted"` | `text-muted-foreground` |
| `color="fg.default"` | `text-foreground` |
| `color="error"` | `text-destructive` |
| `color="success"` | `text-success` |
| `color="warning"` | `text-warning` |
| `bg="bg.subtle"` | `bg-card` |
| `bg="bg.default"` | `bg-background` |
| `borderColor="border.default"` | `border-border` |
| `borderRadius="card"` | `rounded-xl`（或 `rounded-lg`，对齐 base-nova） |
| `fontFamily="mono"` | `font-mono` |
| `colorPalette="accent"` | `variant="default"`（primary） |
| `colorPalette="error"` | `variant="destructive"` |

**共享组件逐个迁移**：
- `Section.tsx` → 基于 shadcn Card 重写（保持标题/描述/操作区 props）
- `ListEditor.tsx`、`KeyValueEditor.tsx`、`PermissionRulesEditor.tsx` → div + Tailwind + shadcn Button/Switch/Select
- `ConfigViewButton.tsx` → shadcn Dialog
- `fields/Field.tsx`、`controls.tsx`、`MenuSelect.tsx` → shadcn Input/Switch/Select + label
- `layout/AppLayout.tsx`、`Sidebar.tsx` → div + Tailwind flex 布局
- `motion.ts` + `motion.css` → 保留入场动画 class（`oc-enter/oc-fade`），但移除 `.chakra-button` 选择器，改 shadcn 按钮 `:active` 缩放用 `[data-slot="button"]:active:scale-95`

### 4.5 页面迁移（6 页面全量）

逐页转写，每页：
1. 替换所有 Chakra 组件为 shadcn/Tailwind 等价
2. 语义 token 字符串 → Tailwind class
3. 更新对应 `.test.tsx` 的 DOM 断言

页面：`SettingsPage` / `McpPage` / `PluginPage` / `AgentsPage` / `CredentialsPage` / `FileManagerPage`。

### 4.6 SessionsPage 收尾（会话管理 UI）

会话管理数据层已就绪（提交 `fca96cf`：node:sqlite 读写 opencode.db，list/rename/delete + IPC + preload）。shadcn 重构完成后，按会话管理 spec §5 用 shadcn 组件实现 `SessionsPage.tsx` + `App.tsx` NAV 项 + UI 测试。布局：搜索框 + 卡片列表（标题内联编辑、时间/消息数/目录/归档徽章、重命名/删除按钮）、删除二次确认。

## 5. 实现顺序

为规避 preflight 共存冲击，按以下顺序作为一个交付单元：

1. **基础设施**：安装 Tailwind/shadcn，配 vite alias + components.json + index.css，验证 Tailwind 在 renderer 生效
2. **目录整理**：迁移 `components/ui/*` → `components/app/*`，简化 provider
3. **共享组件迁移**：逐个把共享组件从 Chakra 转 shadcn（Section/ListEditor/KeyValueEditor/PermissionRulesEditor/ConfigViewButton/fields/layout）
4. **页面迁移**：6 页面逐页转写 + 测试更新
5. **SessionsPage**：用 shadcn 实现会话管理 UI
6. **清理**：移除 Chakra/Emotion 依赖、theme.ts、motion.css 的 chakra 选择器
7. **全量验证**：test + typecheck + lint + dev 启动

实现中 Chakra 与 Tailwind 短暂共存（步骤 3-4 期间），但 preflight 冲突通过**快速推进、不长期停留**缓解；若共存期视觉异常严重，临时在 index.css 用 `@layer` 限定 preflight 作用域。

## 6. 测试

- 跟随组件替换更新各 `.test.tsx` 的 DOM 断言（结构/选择器变化）
- 确认 vitest/jsdom 能处理 Tailwind v4 CSS 导入（`@import "tailwindcss"` 在测试环境可能需 mock 或 stub；若报错，在 vitest config 用 `css: false` 或 stub）
- 全量测试通过（原 174 + SessionsPage 新增）

## 7. 边界与风险

- **shadcn CLI 在嵌套 renderer 目录探测失败**：手工配 `components.json`，CLI 用 `--css`/`--components` 等参数指定路径
- **Tailwind v4 + electron-vite 兼容**：`@tailwindcss/vite` 加在 renderer.plugins；若 HMR/CSS 注入异常，排查 import 顺序与 CSP（现 CSP 允许 `style-src 'self' 'unsafe-inline'`，Tailwind dev 可工作）
- **preflight 共存冲击**：步骤 3-4 期间 Chakra 组件样式可能被 reset 覆盖；通过快速推进 + 必要时 `@layer` 限定缓解
- **success/warning 无 shadcn 对应**：自定义 CSS 变量 + @theme 映射
- **`MenuSelect` 重写**：shadcn Select 无 `xs` size、无 allowEmpty 占位语义，需适配（空值选项或 placeholder）
- **测试 DOM 断言**：组件结构变化大，断言需同步更新；`vitest` 处理 CSS 导入需验证
- **Electron 离线/内网**：`pnpm dlx shadcn@latest` 与 registry 拉取需网络（本机可走 Clash `127.0.0.1:7897`）
- **Tailwind v4 较新**：与某些工具兼容性可能有边缘问题，遇阻时查官方文档或降级考量
