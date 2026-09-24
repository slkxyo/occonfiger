import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { useConfigStore } from '../store/configStore'
import { normalizeDraft } from '../store/normalize'

export function ConfigViewButton(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const draft = useConfigStore((s) => s.draft)
  const text = useMemo(() => JSON.stringify(normalizeDraft(draft), null, 2), [draft])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" variant="outline" />}>查看配置文件</DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>配置文件</DialogTitle>
        </DialogHeader>
        <pre className="max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
          {text}
        </pre>
        <DialogFooter>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
