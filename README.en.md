<div align="center">

# OCConfiger

**A visual editor for your global opencode configuration**

Manage MCP servers, plugins, provider credentials, skills, global prompts and permissions from a native GUI — no more hand-editing `~/.config/opencode/opencode.jsonc`.

[简体中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

<img src="https://img.shields.io/badge/Electron-39-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Chakra_UI-3-319795?style=flat-square&logo=chakraui&logoColor=white" alt="Chakra UI" />
<img src="https://img.shields.io/badge/Platform-macOS-000000?style=flat-square&logo=apple&logoColor=white" alt="macOS" />
<img src="https://img.shields.io/badge/Version-1.1.0-2F80ED?style=flat-square" alt="Version" />

</div>

---

## Screenshots

<table>
<tr>
<td width="50%" align="center"><sub><b>MCP Servers · Light</b></sub></td>
<td width="50%" align="center"><sub><b>MCP Servers · Dark</b></sub></td>
</tr>
<tr>
<td><img src="https://slkxyo-note-media.oss-cn-shanghai.aliyuncs.com/occonfiger/readme/mcp-light.png" alt="MCP Servers (Light)" /></td>
<td><img src="https://slkxyo-note-media.oss-cn-shanghai.aliyuncs.com/occonfiger/readme/mcp-dark.png" alt="MCP Servers (Dark)" /></td>
</tr>
<tr>
<td align="center"><sub><b>Skills · Light</b></sub></td>
<td align="center"><sub><b>Global Settings · Dark</b></sub></td>
</tr>
<tr>
<td><img src="https://slkxyo-note-media.oss-cn-shanghai.aliyuncs.com/occonfiger/readme/skills-light.png" alt="Skills (Light)" /></td>
<td><img src="https://slkxyo-note-media.oss-cn-shanghai.aliyuncs.com/occonfiger/readme/settings-dark.png" alt="Global Settings (Dark)" /></td>
</tr>
</table>

## Features

| Module | Description |
| :--- | :--- |
| **MCP Servers** | Manage servers under `mcp` with inline editing, enable toggles and deletion |
| **Plugins** | Inspect global plugins, enable / disable them with one click, or remove them |
| **Provider Credentials** | Manage credentials connected via `/connect`, update keys or delete them |
| **Skills** | Manage skills under the `skills` directory — open, edit and delete |
| **Global Prompt** | Edit `~/.config/opencode/AGENTS.md` |
| **Global Settings** | Configure global permissions (allow / ask / deny) and auto-update |

Also included:

- Changes are **written instantly** to disk — no manual save
- Light / dark / follow-system themes
- Inspect the full current configuration as JSON from any page

## How It Works

OCConfiger reads and writes your local opencode configuration files directly. There is no middleware and no cloud service — everything stays on your machine.

| Content | Path |
| :--- | :--- |
| Main config | `~/.config/opencode/opencode.jsonc` |
| Global prompt | `~/.config/opencode/AGENTS.md` |
| Skills | `~/.config/opencode/skills/<name>/SKILL.md` |
| Provider credentials | `~/.local/share/opencode/auth.json` |

## Installation

Download `OCConfiger-1.1.0.dmg` from [Releases](https://github.com/slkxyo/occonfiger/releases), open it and drag the app into **Applications**.

The app is not signed, so on first launch use **Right click → Open**, or run:

```bash
xattr -dr com.apple.quarantine /Applications/OCConfiger.app
```

## Development

```bash
pnpm install
pnpm dev        # start the dev environment
pnpm test       # run tests
pnpm typecheck  # type checking
pnpm lint       # linting
pnpm build      # build
pnpm build:mac  # package the macOS app
```

## Tech Stack

Electron · React · TypeScript · Chakra UI · zustand · electron-vite · Vitest

<div align="center">
<sub>Built for opencode users</sub>
</div>
