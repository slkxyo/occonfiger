import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Section } from '../components/Section'

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function AgentsPage(): React.JSX.Element {
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.api
      .readAgents()
      .then((text) => {
        setContent(text)
        setSaved(text)
      })
      .catch((e: unknown) => setError(toMessage(e)))
  }, [])

  const dirty = content !== saved

  const save = (): void => {
    if (saving || !dirty) return
    setSaving(true)
    setStatus('')
    setError('')
    window.api
      .writeAgents(content)
      .then(() => {
        setSaved(content)
        setStatus('已保存')
      })
      .catch((e: unknown) => setError(toMessage(e)))
      .finally(() => setSaving(false))
  }

  return (
    <Section
      title="全局提示词"
      description="编辑 opencode 的全局 AGENTS.md 提示词，保存后需重启 opencode 生效。"
    >
      {error ? (
        <div role="alert" className="mb-3 rounded-xl border border-destructive p-3">
          <p className="text-sm text-destructive">操作失败：{error}</p>
        </div>
      ) : null}
      <Textarea
        aria-label="全局提示词内容"
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          setStatus('')
        }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
            e.preventDefault()
            save()
          }
        }}
        className="min-h-[60vh] resize-y bg-background p-4 font-mono text-sm leading-[1.7]"
        placeholder="在此编写全局提示词…"
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{content.length} 字符</p>
        <div className="flex items-center gap-3">
          {status ? (
            <p className="text-sm text-muted-foreground">{status}</p>
          ) : dirty ? (
            <p className="text-sm text-muted-foreground">有未保存的修改</p>
          ) : null}
          <Button size="sm" disabled={!dirty || saving} onClick={save}>
            {saving ? '保存中…' : '保存'}
          </Button>
        </div>
      </div>
    </Section>
  )
}
