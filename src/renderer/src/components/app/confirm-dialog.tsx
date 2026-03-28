import { AlertTriangle, ShieldAlert } from 'lucide-react'

import { AppIcon } from '@renderer/components/ui/app-icon'
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
  const isDanger = confirmState?.confirmTone === 'danger'
  const AccentIcon = isDanger ? ShieldAlert : AlertTriangle

  return (
    <Dialog open={Boolean(confirmState)} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden">
        <DialogHeader className="dialog-hero">
          <div className="dialog-hero-orb dialog-hero-orb-primary" />
          <div className="dialog-hero-orb dialog-hero-orb-secondary" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
              <AppIcon icon={AccentIcon} size="sm" accent />
              Confirmation
            </div>
            <DialogTitle className="mt-4 text-[1.55rem] tracking-[-0.05em]">{confirmState?.title}</DialogTitle>
            <DialogDescription className="mt-3 max-w-[520px] leading-7">
              {confirmState?.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant={isDanger ? 'danger' : 'default'} onClick={() => void confirmState?.onConfirm()}>
            {confirmState?.confirmLabel ?? '确认'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
