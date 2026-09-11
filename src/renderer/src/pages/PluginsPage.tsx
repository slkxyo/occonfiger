import { Section } from '../components/Section'
import { SwitchField, TagsField } from '../fields/controls'

export function PluginsPage(): React.JSX.Element {
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
