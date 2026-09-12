<div align="center">

# OCConfiger

**opencode 全局配置的可视化编辑器**

在图形界面中管理 MCP 服务、插件、服务商凭证、SKILL、全局提示词与权限，无需手动编辑 `~/.config/opencode/opencode.jsonc`。

[简体中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

<img src="https://img.shields.io/badge/Electron-39-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Chakra_UI-3-319795?style=flat-square&logo=chakraui&logoColor=white" alt="Chakra UI" />
<img src="https://img.shields.io/badge/Platform-macOS-000000?style=flat-square&logo=apple&logoColor=white" alt="macOS" />
<img src="https://img.shields.io/badge/Version-1.0.0-2F80ED?style=flat-square" alt="Version" />

</div>

---

## 截图

<table>
<tr>
<td width="50%" align="center"><sub><b>MCP 服务 · 亮色</b></sub></td>
<td width="50%" align="center"><sub><b>MCP 服务 · 暗色</b></sub></td>
</tr>
<tr>
<td><img src="https://slkxyo-note-media.oss-cn-shanghai.aliyuncs.com/occonfiger/readme/mcp-light.png" alt="MCP 服务（亮色）" /></td>
<td><img src="https://slkxyo-note-media.oss-cn-shanghai.aliyuncs.com/occonfiger/readme/mcp-dark.png" alt="MCP 服务（暗色）" /></td>
</tr>
<tr>
<td align="center"><sub><b>SKILL 管理 · 亮色</b></sub></td>
<td align="center"><sub><b>全局设置 · 暗色</b></sub></td>
</tr>
<tr>
<td><img src="https://slkxyo-note-media.oss-cn-shanghai.aliyuncs.com/occonfiger/readme/skills-light.png" alt="SKILL 管理（亮色）" /></td>
<td><img src="https://slkxyo-note-media.oss-cn-shanghai.aliyuncs.com/occonfiger/readme/settings-dark.png" alt="全局设置（暗色）" /></td>
</tr>
</table>

## 功能

| 模块 | 说明 |
| :--- | :--- |
| **MCP 服务** | 管理 `mcp` 下的服务器配置，支持展开编辑、启用开关与删除 |
| **插件管理** | 查看全局插件，一键启用 / 停用与删除 |
| **服务商凭证** | 管理 `/connect` 已连接的服务商凭证，修改密钥或删除 |
| **SKILL 管理** | 管理 `skills` 目录下的 SKILL，支持打开、编辑与删除 |
| **全局提示词** | 编辑 `~/.config/opencode/AGENTS.md` |
| **全局设置** | 配置全局权限（allow / ask / deny）与自动更新开关 |

此外：

- 改动**即时写入**配置文件，无需手动保存
- 亮色 / 暗色 / 跟随系统三种主题
- 任意页面可随时查看当前完整配置的 JSON

## 工作原理

OCConfiger 直接读写本地 opencode 配置文件，不引入中间层或云端服务，所有数据都留在你的机器上。

| 内容 | 路径 |
| :--- | :--- |
| 主配置 | `~/.config/opencode/opencode.jsonc` |
| 全局提示词 | `~/.config/opencode/AGENTS.md` |
| SKILL | `~/.config/opencode/skills/<name>/SKILL.md` |
| 服务商凭证 | `~/.local/share/opencode/auth.json` |

## 安装

从 [Releases](https://github.com/slkxyo/occonfiger/releases) 下载 `OCConfiger-1.0.0.dmg`，打开后将应用拖入「应用程序」。

应用未签名，首次打开请**右键 → 打开**；或在终端执行：

```bash
xattr -dr com.apple.quarantine /Applications/OCConfiger.app
```

## 开发

```bash
pnpm install
pnpm dev        # 启动开发环境
pnpm test       # 运行测试
pnpm typecheck  # 类型检查
pnpm lint       # 代码检查
pnpm build      # 构建
pnpm build:mac  # 打包 macOS 安装包
```

## 技术栈

Electron · React · TypeScript · Chakra UI · zustand · electron-vite · Vitest

<div align="center">
<sub>为 opencode 用户打造</sub>
</div>
