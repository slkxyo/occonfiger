import { useCallback, useEffect, useState } from 'react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Section } from '../components/Section'
import { enterStyle } from '../components/motion'

type ManagedFile = { name: string; path: string }

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function FileManagerPage(): React.JSX.Element {
  const [files, setFiles] = useState<ManagedFile[]>([])
  const [selected, setSelected] = useState('')
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const reload = useCallback((): Promise<void> => {
    return window.api
      .listManagedFiles()
      .then((next) => {
        setFiles(next)
        setError('')
      })
      .catch((e: unknown) => setError(toMessage(e)))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const select = (skill: string): void => {
    setSelected(skill)
    setStatus('')
    setError('')
    window.api
      .readManagedFile(skill)
      .then((text) => {
        setContent(text)
        setSaved(text)
      })
      .catch((e: unknown) => setError(toMessage(e)))
  }

  const dirty = content !== saved

  const save = (): void => {
    if (!selected || saving || !dirty) return
    setSaving(true)
    setStatus('')
    setError('')
    window.api
      .writeManagedFile(selected, content)
      .then(() => {
        setSaved(content)
        setStatus('已保存')
      })
      .catch((e: unknown) => setError(toMessage(e)))
      .finally(() => setSaving(false))
  }

  return (
    <Section title="SKILL 管理" description="管理 skills 目录下的 SKILL，可直接预览并编辑内容。">
      {error ? (
        <div role="alert" className="mb-3 rounded-xl border border-destructive p-3">
          <p className="text-sm text-destructive">操作失败：{error}</p>
        </div>
      ) : null}
      <div className="flex items-stretch gap-4">
        <div className="max-h-[60vh] w-[220px] shrink-0 overflow-y-auto">
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无 SKILL。</p>
          ) : (
            files.map((file, index) => {
              const active = selected === file.name
              return (
                <Button
                  key={file.path}
                  className={cn(
                    'oc-enter mb-1 w-full justify-start font-mono font-normal',
                    active && 'font-medium'
                  )}
                  style={enterStyle(index)}
                  variant={active ? 'secondary' : 'ghost'}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => select(file.name)}
                >
                  {file.name}
                </Button>
              )
            })
          )}
        </div>
        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-sm font-medium">{selected}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    aria-label={`打开 ${selected}`}
                    onClick={() => {
                      window.api.openManagedFile(selected).catch((e: unknown) => {
                        setError(toMessage(e))
                      })
                    }}
                  >
                    打开
                  </Button>
                  <Button
                    size="xs"
                    variant="destructive"
                    aria-label={`删除 ${selected}`}
                    onClick={() => {
                      if (!window.confirm(`确定删除 ${selected} 吗？`)) return
                      window.api
                        .deleteManagedFile(selected)
                        .then(() => {
                          setSelected('')
                          setContent('')
                          setSaved('')
                          reload()
                        })
                        .catch((e: unknown) => {
                          setError(toMessage(e))
                        })
                    }}
                  >
                    删除
                  </Button>
                </div>
              </div>
              <Textarea
                aria-label="SKILL 内容"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  setStatus('')
                }}
                className="min-h-[52vh] resize-y bg-background p-4 font-mono text-sm leading-[1.7]"
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
            </>
          ) : (
            <div className="flex h-[52vh] items-center justify-center rounded-xl border border-border bg-background">
              <p className="text-sm text-muted-foreground">请选择一个 SKILL。</p>
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}
