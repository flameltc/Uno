import { LoaderCircle, Square, XCircle } from 'lucide-react'

import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { describeTaskProgress } from '@renderer/lib/app-helpers'
import type { TaskProgressEvent } from '@shared/types'

function getTaskTone(task: TaskProgressEvent | null) {
  if (!task) {
    return 'neutral'
  }

  if (task.state === 'failed') {
    return 'danger'
  }

  if (task.state === 'cancelled') {
    return 'warning'
  }

  if (task.state === 'completed') {
    return 'success'
  }

  return 'accent'
}

export function TaskProgressCard({
  task,
  canCancel,
  onCancel
}: {
  task: TaskProgressEvent | null
  canCancel: boolean
  onCancel: () => void
}) {
  if (!task) {
    return null
  }

  const tone = getTaskTone(task)
  const width = `${Math.max(6, task.percent ?? 12)}%`

  return (
    <Card className="overflow-hidden border-[rgba(9,105,218,0.15)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {task.state === 'running' ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-accent" />
              ) : task.state === 'completed' ? (
                <Square className="h-4 w-4 fill-success text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-warning" />
              )}
              <span className="text-sm font-semibold text-fg-default">
                {task.kind === 'preview'
                  ? '预览任务'
                  : task.kind === 'run'
                    ? '整理任务'
                    : task.kind === 'undo'
                      ? '撤销任务'
                      : '字段分析'}
              </span>
              <Badge variant={tone}>{task.phase}</Badge>
            </div>
            <p className="text-sm text-fg-muted">{describeTaskProgress(task)}</p>
            {task.currentPath ? <p className="text-code text-fg-subtle">{task.currentPath}</p> : null}
          </div>
          {canCancel ? (
            <Button size="sm" variant="outline" onClick={onCancel}>
              取消任务
            </Button>
          ) : null}
        </div>

        <div className="h-2 rounded-full bg-[#dbe7f3]">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#0f6cfd_0%,#39b8ff_100%)] transition-all duration-200" style={{ width }} />
        </div>
      </CardContent>
    </Card>
  )
}
