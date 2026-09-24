import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Section } from '../components/Section'

type Credential = { provider: string; type: string; keyTail?: string }

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function CredentialsPage(): React.JSX.Element {
  const [items, setItems] = useState<Credential[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [newKey, setNewKey] = useState('')
  const [error, setError] = useState('')

  const reload = (): Promise<void> =>
    window.api
      .listCredentials()
      .then((next) => {
        setItems(next)
        setError('')
      })
      .catch((e: unknown) => {
        setError(toMessage(e))
      })

  useEffect(() => {
    reload()
  }, [])

  return (
    <Section
      title="服务商凭证"
      description="管理 /connect 已连接的服务商。新增凭证请在 opencode 中运行 /connect 或 opencode auth login。"
    >
      {error ? (
        <div role="alert" className="mb-3 rounded-xl border border-destructive p-3">
          <p className="text-sm text-destructive">操作失败：{error}</p>
        </div>
      ) : null}
      {!error && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          尚无已连接的服务商，请在 opencode 中运行 /connect 添加。
        </p>
      ) : null}
      {items.map((item) => (
        <div key={item.provider} className="mb-3 rounded-xl border border-border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium">{item.provider}</span>
              <span className="text-xs text-muted-foreground">{item.type}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.type === 'api' ? (
                <Button size="xs" variant="ghost" onClick={() => setEditing(item.provider)}>
                  修改密钥
                </Button>
              ) : null}
              <Button
                size="xs"
                variant="destructive"
                aria-label={`删除 ${item.provider}`}
                onClick={() => {
                  if (!window.confirm(`确定删除 ${item.provider} 的凭证吗？`)) return
                  window.api
                    .deleteCredential(item.provider)
                    .then(reload)
                    .catch((e: unknown) => {
                      setError(toMessage(e))
                    })
                }}
              >
                删除
              </Button>
            </div>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {item.keyTail ? `••••${item.keyTail}` : '（OAuth，需在 opencode 中重新连接）'}
          </p>
          {editing === item.provider ? (
            <div className="mt-3 flex items-center gap-2">
              <Input
                aria-label="新密钥"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="sk-..."
              />
              <Button
                size="sm"
                onClick={() => {
                  window.api
                    .updateCredentialKey(item.provider, newKey)
                    .then(() => {
                      setEditing(null)
                      setNewKey('')
                      reload()
                    })
                    .catch((e: unknown) => {
                      setError(toMessage(e))
                    })
                }}
              >
                保存密钥
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                取消
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </Section>
  )
}
