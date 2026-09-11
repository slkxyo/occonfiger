import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { SelectField, TagsField, TextField } from '../fields/controls'

export function SkillsPage(): React.JSX.Element {
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
              <TextField
                path={['references', alias, 'path']}
                label="本地路径"
                placeholder="../docs"
              />
              <TextField
                path={['references', alias, 'repository']}
                label="仓库"
                placeholder="owner/repo"
              />
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
