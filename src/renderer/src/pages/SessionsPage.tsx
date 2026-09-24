import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Section } from '../components/Section'
import { enterStyle } from '../components/motion'
import type { SessionSummary } from '../../../shared/session-types'

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})

function formatTime(timestamp: number): string {
  return dateFormatter.format(new Date(timestamp))
}

function displayTitle(title: string | null): string {
  return title ?? '未命名会话'
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function SessionsPage(): React.JSX.Element {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [confirmTarget, setConfirmTarget] = useState<SessionSummary | null>(null)
  const skipBlur = useRef(false)

  const reload = useCallback((): Promise<void> => {
    return window.api
      .listSessions()
      .then((next) => {
        setSessions(next)
        setError('')
      })
      .catch((e: unknown) => setError(toMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const startEdit = (session: SessionSummary): void => {
    skipBlur.current = false
    setEditingId(session.id)
    setDraft(session.title ?? '')
  }

  const cancelEdit = (): void => {
    skipBlur.current = true
    setEditingId(null)
  }

  const commitEdit = (session: SessionSummary): void => {
    if (skipBlur.current) {
      skipBlur.current = false
      return
    }
    if (editingId !== session.id) return
    const next = draft.trim()
    setEditingId(null)
    if (!next) return
    if (next === (session.title ?? '')) return
    window.api
      .renameSession(session.id, next)
      .then(() => reload())
      .catch((e: unknown) => setError(toMessage(e)))
  }

  const remove = (session: SessionSummary): void => {
    setConfirmTarget(session)
  }

  const confirmDelete = (): void => {
    const target = confirmTarget
    if (target === null) return
    window.api
      .deleteSession(target.id)
      .then(() => reload())
      .catch((e: unknown) => setError(toMessage(e)))
      .finally(() => setConfirmTarget(null))
  }

  const needle = query.trim().toLowerCase()
  const filtered = needle
    ? sessions.filter((session) => displayTitle(session.title).toLowerCase().includes(needle))
    : sessions

  return (
    <Section
      title="会话管理"
      description="浏览 opencode V2 会话，支持按标题搜索、重命名与删除。删除会递归清理子会话与消息，操作前请先关闭 opencode。"
    >
      {error ? (
        <div role="alert" className="mb-3 rounded-xl border border-destructive p-3">
          <p className="text-sm text-destructive">操作失败：{error}</p>
        </div>
      ) : null}

      <div className="mb-4 flex items-center gap-2">
        <Input
          aria-label="搜索会话"
          placeholder="按标题搜索…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" aria-label="刷新列表" onClick={() => reload()}>
          刷新
        </Button>
      </div>

      {loading && sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">加载会话中…</p>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {needle ? '没有匹配的会话。' : '暂无会话。'}
        </p>
      ) : null}

      {filtered.map((session, index) => {
        const title = displayTitle(session.title)
        const editing = editingId === session.id
        return (
          <Card key={session.id} size="sm" className="oc-enter mb-3" style={enterStyle(index)}>
            <CardContent className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {editing ? (
                    <Input
                      autoFocus
                      aria-label="编辑会话标题"
                      value={draft}
                      className="h-7 max-w-xs"
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => commitEdit(session)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) e.currentTarget.blur()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className="truncate text-left font-medium hover:underline"
                      onClick={() => startEdit(session)}
                    >
                      {title}
                    </button>
                  )}
                  {session.timeArchived !== null ? (
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      已归档
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span>创建 {formatTime(session.timeCreated)}</span>
                  {' · '}
                  <span>更新 {formatTime(session.timeUpdated)}</span>
                  {' · '}
                  <span>{session.messageCount} 条消息</span>
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                  {session.directory}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="xs"
                  variant="ghost"
                  aria-label={`重命名 ${title}`}
                  onClick={() => startEdit(session)}
                >
                  重命名
                </Button>
                <Button
                  size="xs"
                  variant="destructive"
                  aria-label={`删除 ${title}`}
                  onClick={() => remove(session)}
                >
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      <AlertDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除会话</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget !== null
                ? `确定删除会话「${displayTitle(confirmTarget.title)}」吗？此操作不可恢复，会一并删除其所有子会话和消息。建议先关闭 opencode 后再删除，避免运行中的 opencode 数据不一致。`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  )
}
