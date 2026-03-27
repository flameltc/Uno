import { History, RotateCcw } from 'lucide-react'

import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { formatDateTime } from '@renderer/lib/app-helpers'
import type { RunLog } from '@shared/types'

export function HistoryList({
  history,
  onUndo
}: {
  history: RunLog[]
  onUndo: (runId: string) => void
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border-muted bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-accent" />
            最近任务
          </CardTitle>
          <p className="mt-1 text-sm text-fg-muted">查看最近整理结果，也可以直接撤销最近一次成功整理。</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-default bg-canvas-default px-4 py-6 text-center text-sm text-fg-muted">
            还没有整理记录。
          </div>
        ) : (
          history.slice(0, 5).map((runLog) => (
            <div key={runLog.runId} className="rounded-2xl border border-border-default bg-canvas-default px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-fg-default">{formatDateTime(runLog.finishedAt)}</p>
                    <Badge variant={runLog.summary.errors > 0 ? 'warning' : 'success'}>
                      已整理 {runLog.summary.moved}
                    </Badge>
                    {runLog.summary.renamed > 0 ? <Badge variant="accent">改名 {runLog.summary.renamed}</Badge> : null}
                    {runLog.undoneAt ? <Badge variant="neutral">已撤销</Badge> : null}
                  </div>
                  <p className="text-code text-fg-subtle">{runLog.sourceRoot}</p>
                  <p className="text-code text-fg-subtle">{runLog.outputRoot}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!runLog.isUndoAvailable}
                  onClick={() => onUndo(runLog.runId)}
                >
                  <RotateCcw className="h-4 w-4" />
                  撤销
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
