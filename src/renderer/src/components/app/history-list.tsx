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
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="panel-kicker">History</p>
          <CardTitle className="mt-2 text-lg">最近任务</CardTitle>
          <p className="mt-2 text-sm leading-7 text-fg-muted">
            查看最近整理结果，也可以直接撤销最近一次可恢复的任务。
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {history.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-fg-muted">
            还没有整理记录。
          </div>
        ) : (
          history.slice(0, 5).map((runLog) => (
            <div key={runLog.runId} className="history-run-card">
              <div className="history-run-main">
                <div className="history-run-content">
                  <div className="history-run-header">
                    <div>
                      <p className="history-run-time">{formatDateTime(runLog.finishedAt)}</p>
                      <p className="history-run-summary">
                        本次整理 {runLog.summary.moved} 个文件
                        {runLog.summary.errors > 0 ? `，其中 ${runLog.summary.errors} 个失败` : '，执行顺利完成'}
                      </p>
                    </div>

                    <div className="history-run-badges">
                      <Badge variant={runLog.summary.errors > 0 ? 'warning' : 'success'}>
                        已整理 {runLog.summary.moved}
                      </Badge>
                      {runLog.summary.renamed > 0 ? <Badge variant="accent">改名 {runLog.summary.renamed}</Badge> : null}
                      {runLog.undoneAt ? <Badge variant="neutral">已撤销</Badge> : null}
                    </div>
                  </div>

                  <div className="history-path-grid">
                    <div className="history-path-block">
                      <p className="history-path-label">源目录</p>
                      <p className="history-path-value" title={runLog.sourceRoot}>
                        {runLog.sourceRoot}
                      </p>
                    </div>
                    <div className="history-path-block">
                      <p className="history-path-label">输出目录</p>
                      <p className="history-path-value" title={runLog.outputRoot}>
                        {runLog.outputRoot}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={!runLog.isUndoAvailable}
                  onClick={() => onUndo(runLog.runId)}
                >
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
