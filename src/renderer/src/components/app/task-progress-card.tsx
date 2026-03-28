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

function getTaskLabel(task: TaskProgressEvent) {
  if (task.kind === 'preview') {
    return '预览任务'
  }

  if (task.kind === 'run') {
    return '整理任务'
  }

  if (task.kind === 'undo') {
    return '撤销任务'
  }

  return '字段分析'
}

function getPhaseLabel(task: TaskProgressEvent) {
  switch (task.phase) {
    case 'queued':
      return '排队中'
    case 'scanning-source':
      return '扫描源目录'
    case 'scanning-output':
      return '扫描输出目录'
    case 'planning':
      return '生成计划'
    case 'executing':
      return '执行中'
    case 'undoing':
      return '撤销中'
    case 'completed':
      return '已完成'
    case 'cancelled':
      return '已取消'
    case 'failed':
      return '失败'
    default:
      return task.phase
  }
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
    <Card className="overflow-hidden border-accent/10">
      <CardContent className="task-progress-shell">
        <div className="task-progress-header">
          <div className="task-progress-copy">
            <div className="task-progress-title-row">
              <span className="text-sm font-semibold text-fg-default">{getTaskLabel(task)}</span>
              <Badge variant={tone}>{getPhaseLabel(task)}</Badge>
            </div>
            <p className="task-progress-message">{describeTaskProgress(task)}</p>
            {task.currentPath ? (
              <div className="task-progress-path-block">
                <p className="task-progress-path-label">当前文件</p>
                <p className="task-progress-path-value" title={task.currentPath}>
                  {task.currentPath}
                </p>
              </div>
            ) : null}
          </div>

          <div className="task-progress-side">
            {typeof task.percent === 'number' ? (
              <div className="task-progress-percent">{Math.round(task.percent)}%</div>
            ) : null}
            {canCancel ? (
              <Button size="sm" variant="outline" onClick={onCancel}>
                取消任务
              </Button>
            ) : null}
          </div>
        </div>

        <div className="task-progress-track">
          <div className="task-progress-bar" style={{ width }} />
        </div>
      </CardContent>
    </Card>
  )
}
