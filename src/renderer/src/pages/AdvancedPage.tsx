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
  {
    kind: 'tags',
    path: ['experimental', 'primary_tools'],
    label: '仅主 Agent 工具',
    placeholder: '回车添加'
  }
]

const enterprise: FieldSpec[] = [
  { kind: 'text', path: ['enterprise', 'url'], label: 'Enterprise URL' }
]

export function AdvancedPage(): React.JSX.Element {
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
