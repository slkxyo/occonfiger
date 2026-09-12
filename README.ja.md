<div align="center">

# OCConfiger

**opencode グローバル設定のビジュアルエディター**

MCP サーバー、プラグイン、プロバイダー認証情報、SKILL、グローバルプロンプト、権限を GUI で管理。`~/.config/opencode/opencode.jsonc` を手で編集する必要はありません。

[简体中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

<img src="https://img.shields.io/badge/Electron-39-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Chakra_UI-3-319795?style=flat-square&logo=chakraui&logoColor=white" alt="Chakra UI" />
<img src="https://img.shields.io/badge/Platform-macOS-000000?style=flat-square&logo=apple&logoColor=white" alt="macOS" />
<img src="https://img.shields.io/badge/Version-1.1.0-2F80ED?style=flat-square" alt="Version" />

</div>

---

## スクリーンショット

<table>
<tr>
<td width="50%" align="center"><sub><b>MCP サービス · ライト</b></sub></td>
<td width="50%" align="center"><sub><b>MCP サービス · ダーク</b></sub></td>
</tr>
<tr>
<td><img src="https://slkxyo-note-media.oss-cn-shanghai.aliyuncs.com/occonfiger/readme/mcp-light.png" alt="MCP サービス（ライト）" /></td>
<td><img src="https://slkxyo-note-media.oss-cn-shanghai.aliyuncs.com/occonfiger/readme/mcp-dark.png" alt="MCP サービス（ダーク）" /></td>
</tr>
<tr>
<td align="center"><sub><b>SKILL 管理 · ライト</b></sub></td>
<td align="center"><sub><b>グローバル設定 · ダーク</b></sub></td>
</tr>
<tr>
<td><img src="https://slkxyo-note-media.oss-cn-shanghai.aliyuncs.com/occonfiger/readme/skills-light.png" alt="SKILL 管理（ライト）" /></td>
<td><img src="https://slkxyo-note-media.oss-cn-shanghai.aliyuncs.com/occonfiger/readme/settings-dark.png" alt="グローバル設定（ダーク）" /></td>
</tr>
</table>

## 機能

| モジュール | 説明 |
| :--- | :--- |
| **MCP サービス** | `mcp` 配下のサーバー設定を管理。展開編集、有効化スイッチ、削除に対応 |
| **プラグイン管理** | グローバルプラグインを一覧表示し、ワンクリックで有効化 / 無効化・削除 |
| **プロバイダー認証情報** | `/connect` で接続済みの認証情報を管理。キーの変更や削除が可能 |
| **SKILL 管理** | `skills` ディレクトリ配下の SKILL を管理。開く・編集・削除に対応 |
| **グローバルプロンプト** | `~/.config/opencode/AGENTS.md` を編集 |
| **グローバル設定** | グローバル権限（allow / ask / deny）と自動更新の設定 |

そのほか：

- 変更は**即座に保存**され、手動保存は不要
- ライト / ダーク / システム連動のテーマ
- どのページからでも現在の設定全体を JSON で確認可能

## 仕組み

OCConfiger はローカルの opencode 設定ファイルを直接読み書きします。中間層やクラウドサービスはなく、データはすべて手元に留まります。

| 内容 | パス |
| :--- | :--- |
| メイン設定 | `~/.config/opencode/opencode.jsonc` |
| グローバルプロンプト | `~/.config/opencode/AGENTS.md` |
| SKILL | `~/.config/opencode/skills/<name>/SKILL.md` |
| プロバイダー認証情報 | `~/.local/share/opencode/auth.json` |

## インストール

[Releases](https://github.com/slkxyo/occonfiger/releases) から `OCConfiger-1.1.0.dmg` をダウンロードし、開いてアプリを「アプリケーション」にドラッグします。

アプリは署名されていないため、初回起動時は**右クリック → 開く**を選択するか、以下を実行してください：

```bash
xattr -dr com.apple.quarantine /Applications/OCConfiger.app
```

## 開発

```bash
pnpm install
pnpm dev        # 開発環境を起動
pnpm test       # テストを実行
pnpm typecheck  # 型チェック
pnpm lint       # リント
pnpm build      # ビルド
pnpm build:mac  # macOS アプリをパッケージング
```

## 技術スタック

Electron · React · TypeScript · Chakra UI · zustand · electron-vite · Vitest

<div align="center">
<sub>opencode ユーザーのために</sub>
</div>
