import { useCallback, useEffect, useState } from 'react'
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
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

// 消息数量 → 颜色深浅（<10 不变色；10-500 间 amber→orange→red 渐变；>500 固定最深红）
function messageCountClass(count: number): string {
  if (count < 10) return ''
  if (count <= 50) return 'text-amber-500'
  if (count <= 100) return 'text-amber-600'
  if (count <= 200) return 'text-orange-500'
  if (count <= 350) return 'text-orange-600'
  if (count <= 500) return 'text-red-500'
  return 'font-semibold text-red-700'
}

// token 数 → 可读文本（如 950 / 9.3k / 99.3k / 1.2M）
function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}`
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}k`
  return `${(tokens / 1_000_000).toFixed(1)}M`
}

// 上下文规模 → 颜色深浅（<10k 不变色；10k 以上 amber→orange→red 渐变；>250k 固定最深红）
function contextSizeClass(tokens: number): string {
  if (tokens < 10_000) return ''
  if (tokens <= 30_000) return 'text-amber-500'
  if (tokens <= 60_000) return 'text-amber-600'
  if (tokens <= 100_000) return 'text-orange-500'
  if (tokens <= 150_000) return 'text-orange-600'
  if (tokens <= 250_000) return 'text-red-500'
  return 'font-semibold text-red-700'
}

// 会话活跃判定阈值：5 分钟内有更新视为可能正在进行
const LIVE_THRESHOLD_MS = 5 * 60 * 1000

function isLive(session: SessionSummary): boolean {
  return Date.now() - session.timeUpdated < LIVE_THRESHOLD_MS
}

export function SessionsPage(): React.JSX.Element {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // 重命名弹窗
  const [renameTarget, setRenameTarget] = useState<SessionSummary | null>(null)
  const [renameDraft, setRenameDraft] = useState('')

  // 多选删除
  const [selectMode, setSelectMode] = useState(false)
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [batchConfirm, setBatchConfirm] = useState(false)

  // 单个删除确认
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<SessionSummary | null>(null)

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

  const openRename = (session: SessionSummary): void => {
    setRenameTarget(session)
    setRenameDraft(session.title ?? '')
  }

  const closeRename = (): void => {
    setRenameTarget(null)
    setRenameDraft('')
  }

  const commitRename = (): void => {
    const target = renameTarget
    if (target === null) return
    const next = renameDraft.trim()
    if (!next || next === (target.title ?? '')) {
      closeRename()
      return
    }
    window.api
      .renameSession(target.id, next)
      .then(() => reload())
      .catch((e: unknown) => setError(toMessage(e)))
      .finally(() => closeRename())
  }

  const remove = (session: SessionSummary): void => {
    setSingleDeleteTarget(session)
  }

  const confirmSingleDelete = (): void => {
    const target = singleDeleteTarget
    if (target === null) return
    window.api
      .deleteSession(target.id)
      .then(() => reload())
      .catch((e: unknown) => setError(toMessage(e)))
      .finally(() => setSingleDeleteTarget(null))
  }

  // —— 多选 ——
  const enterSelectMode = (): void => {
    setSelectMode(true)
    setSelection(new Set())
  }

  const exitSelectMode = (): void => {
    setSelectMode(false)
    setSelection(new Set())
  }

  const toggleSelect = (id: string): void => {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = (): void => {
    setSelection((prev) => {
      const deletable = filtered.filter((s) => !isLive(s))
      if (deletable.length > 0 && deletable.every((s) => prev.has(s.id))) return new Set()
      return new Set(deletable.map((s) => s.id))
    })
  }

  const openBatchConfirm = (): void => {
    if (selection.size === 0) return
    setBatchConfirm(true)
  }

  const confirmBatchDelete = (): void => {
    const ids = Array.from(selection)
    setBatchConfirm(false)
    Promise.allSettled(ids.map((id) => window.api.deleteSession(id)))
      .then((results) => {
        const failed = results.filter((r) => r.status === 'rejected')
        if (failed.length > 0) {
          setError(`${failed.length} 个会话删除失败（共 ${ids.length} 个）`)
        }
      })
      .then(() => reload())
      .then(() => exitSelectMode())
  }

  const needle = query.trim().toLowerCase()
  const filtered = needle
    ? sessions.filter((session) => displayTitle(session.title).toLowerCase().includes(needle))
    : sessions

  const deletable = filtered.filter((s) => !isLive(s))
  const allSelected = deletable.length > 0 && deletable.every((s) => selection.has(s.id))

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

      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        {selectMode ? (
          <>
            <Button variant="outline" onClick={toggleAll}>
              {allSelected ? '取消全选' : '全选'}
            </Button>
            <Button
              variant="destructive"
              disabled={selection.size === 0}
              onClick={openBatchConfirm}
            >
              删除选中（{selection.size}）
            </Button>
            <Button variant="ghost" onClick={exitSelectMode}>
              退出多选
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={enterSelectMode}>
            多选
          </Button>
        )}
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
        const checked = selection.has(session.id)
        const live = isLive(session)
        return (
          <Card key={session.id} size="sm" className="oc-enter mb-3" style={enterStyle(index)}>
            <CardContent className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                {selectMode ? (
                  <input
                    type="checkbox"
                    aria-label={`选择 ${title}`}
                    checked={checked}
                    disabled={live}
                    onChange={() => toggleSelect(session.id)}
                    className="mt-1 size-4 shrink-0 rounded border-border accent-primary disabled:opacity-40"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="truncate text-left font-medium hover:underline"
                      onClick={() => openRename(session)}
                    >
                      {title}
                    </button>
                    {live ? (
                      <span
                        title="会话进行中（5 分钟内有更新），不可删除"
                        className="inline-flex items-center gap-1 shrink-0 text-xs text-green-600"
                      >
                        <span className="size-1.5 rounded-full bg-green-500" aria-hidden="true" />
                        进行中
                      </span>
                    ) : null}
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
                    <span className={messageCountClass(session.messageCount)}>
                      {session.messageCount} 条消息
                    </span>
                    {' · '}
                    <span
                      className={contextSizeClass(session.contextSize)}
                      title="当前上下文规模（最近一轮的输入 token，含缓存读取）"
                    >
                      上下文 {formatTokens(session.contextSize)}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                    {session.directory}
                  </p>
                </div>
              </div>
              {selectMode ? null : (
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    aria-label={`重命名 ${title}`}
                    onClick={() => openRename(session)}
                  >
                    重命名
                  </Button>
                  <Button
                    size="xs"
                    variant="destructive"
                    aria-label={live ? `删除 ${title}（进行中，不可删除）` : `删除 ${title}`}
                    disabled={live}
                    onClick={() => remove(session)}
                  >
                    删除
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* 重命名弹窗 */}
      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) closeRename()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名会话</DialogTitle>
            <DialogDescription>修改会话标题，留空或未改动将取消。</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            aria-label="会话标题"
            placeholder="输入新的会话标题"
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) commitRename()
            }}
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button onClick={commitRename}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量删除确认 */}
      <AlertDialog
        open={batchConfirm}
        onOpenChange={(open) => {
          if (!open) setBatchConfirm(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>批量删除会话</AlertDialogTitle>
            <AlertDialogDescription>
              {`确定删除选中的 ${selection.size} 个会话吗？此操作不可恢复，会一并删除其所有子会话和消息。建议先关闭 opencode 后再删除，避免运行中的 opencode 数据不一致。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmBatchDelete}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 单个删除确认 */}
      <AlertDialog
        open={singleDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSingleDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除会话</AlertDialogTitle>
            <AlertDialogDescription>
              {singleDeleteTarget !== null
                ? `确定删除会话「${displayTitle(singleDeleteTarget.title)}」吗？此操作不可恢复，会一并删除其所有子会话和消息。建议先关闭 opencode 后再删除，避免运行中的 opencode 数据不一致。`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmSingleDelete}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  )
}
