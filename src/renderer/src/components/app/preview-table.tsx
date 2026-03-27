import { AlertTriangle, ArrowRightLeft, CheckCircle2, FolderTree, Undo2 } from 'lucide-react'

import { Badge } from '@renderer/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { formatDateTime, getExecutionLabel, getPreviewItemsByTab } from '@renderer/lib/app-helpers'
import type { DisplayPreview } from '@renderer/lib/app-helpers'
import type { PreviewItem, PreviewTab } from '@shared/types'

function getStatusBadge(item: PreviewItem) {
  if (item.status === 'error') {
    return <Badge variant="danger">错误</Badge>
  }

  if (item.status === 'unmatched') {
    return <Badge variant="warning">未命中</Badge>
  }

  if (item.executionState === 'undone') {
    return <Badge variant="accent">已撤销</Badge>
  }

  if (item.conflictResolution === 'auto-rename') {
    return <Badge variant="accent">自动改名</Badge>
  }

  return <Badge variant="success">将整理</Badge>
}

function EmptyState({ tab }: { tab: PreviewTab }) {
  const label = tab === 'matched' ? '暂无将整理的文件' : tab === 'unmatched' ? '暂无未命中文件' : '暂无错误'
  const Icon = tab === 'matched' ? FolderTree : tab === 'unmatched' ? AlertTriangle : CheckCircle2

  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-default bg-canvas-default px-6 py-8 text-center">
      <Icon className="h-8 w-8 text-fg-subtle" />
      <div>
        <p className="text-sm font-semibold text-fg-default">{label}</p>
        <p className="mt-1 text-sm text-fg-muted">生成预览后，这里会显示当前分拣计划。</p>
      </div>
    </div>
  )
}

export function PreviewTable({
  activeTab,
  preview,
  onTabChange
}: {
  activeTab: PreviewTab
  preview: DisplayPreview | null
  onTabChange: (tab: PreviewTab) => void
}) {
  const items = preview ? getPreviewItemsByTab(preview.items, activeTab) : []

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 border-b border-border-muted bg-[linear-gradient(180deg,#ffffff_0%,#f6faff_100%)] md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-base">预览与结果</CardTitle>
          <p className="mt-1 text-sm text-fg-muted">
            {preview ? `最后更新于 ${formatDateTime(preview.generatedAt)}` : '预览后可在这里确认移动路径、重命名和错误。'}
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as PreviewTab)}>
          <TabsList>
            <TabsTrigger value="matched">将整理</TabsTrigger>
            <TabsTrigger value="unmatched">未命中</TabsTrigger>
            <TabsTrigger value="error">错误</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-0">
        {!preview || items.length === 0 ? (
          <div className="p-4">
            <EmptyState tab={activeTab} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-canvas-default text-xs uppercase tracking-[0.14em] text-fg-subtle">
                <tr>
                  <th className="px-4 py-3">文件</th>
                  <th className="px-4 py-3">来源路径</th>
                  <th className="px-4 py-3">规则</th>
                  <th className="px-4 py-3">目标</th>
                  <th className="px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.sourcePath}:${item.targetPath ?? 'unmatched'}`} className="border-t border-border-muted align-top transition-colors hover:bg-[#f7fbff]">
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-fg-default">{item.fileName}</p>
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(item)}
                          {item.executionState && item.executionState !== 'pending' ? (
                            <Badge variant="neutral">{getExecutionLabel(item.executionState)}</Badge>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-code text-fg-subtle">{item.sourcePath}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-fg-default">{item.matchedRuleName ?? '未命中'}</p>
                        {item.matchedKeywords?.length ? (
                          <p className="text-xs text-fg-muted">命中字段：{item.matchedKeywords.join('、')}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.targetPath ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-fg-default">
                            {item.executionState === 'undone' ? <Undo2 className="h-4 w-4 text-accent" /> : <ArrowRightLeft className="h-4 w-4 text-accent" />}
                            <span>{item.finalTargetFileName}</span>
                          </div>
                          <p className="text-code text-fg-subtle">{item.executionState === 'undone' ? item.restoredSourcePath ?? item.targetPath : item.targetPath}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-fg-muted">保持原地</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-fg-default">{item.message ?? '无说明'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
