import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import type { ConfirmState } from '@renderer/lib/app-helpers'

export function ConfirmDialog({
  confirmState,
  onOpenChange
}: {
  confirmState: ConfirmState | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={Boolean(confirmState)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{confirmState?.title}</DialogTitle>
          <DialogDescription>{confirmState?.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant={confirmState?.confirmTone === 'danger' ? 'danger' : 'default'} onClick={() => void confirmState?.onConfirm()}>
            {confirmState?.confirmLabel ?? '确认'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
