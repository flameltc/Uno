import { Badge } from '@renderer/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import type { DisplayPreview } from '@renderer/lib/app-helpers'
import { formatDateTime, getExecutionLabel, getPreviewItemsByTab } from '@renderer/lib/app-helpers'
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
  const label =
    tab === 'matched' ? '暂无将整理的文件' : tab === 'unmatched' ? '暂无未命中文件' : '暂无错误'

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-white/10 bg-black/20 px-6 py-8 text-center">
      <p className="text-sm font-semibold text-fg-default">{label}</p>
      <p className="text-sm text-fg-muted">生成预览后，这里会显示当前文件整理计划。</p>
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
    <Card className="preview-panel">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="panel-kicker">Preview</p>
          <CardTitle className="mt-2 text-lg">文件移动预览</CardTitle>
          <p className="mt-2 text-sm text-fg-muted">
            {preview
              ? `最后更新于 ${formatDateTime(preview.generatedAt)}`
              : '生成预览后，可以在这里确认目标路径、重命名结果和错误信息。'}
          </p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          {preview ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">命中 {preview.summary.matched}</Badge>
              <Badge variant="warning">未命中 {preview.summary.unmatched}</Badge>
              <Badge variant="danger">错误 {preview.summary.errors}</Badge>
              {preview.summary.renamed > 0 ? <Badge variant="accent">改名 {preview.summary.renamed}</Badge> : null}
            </div>
          ) : null}
          <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as PreviewTab)}>
            <TabsList className="w-full justify-start md:w-auto">
              <TabsTrigger value="matched">将整理</TabsTrigger>
              <TabsTrigger value="unmatched">未命中</TabsTrigger>
              <TabsTrigger value="error">错误</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!preview || items.length === 0 ? (
          <div className="p-5">
            <EmptyState tab={activeTab} />
          </div>
        ) : (
          <div className="preview-table-wrap">
            <table className="preview-table">
              <thead className="preview-head">
                <tr>
                  <th className="preview-head-cell">文件名</th>
                  <th className="preview-head-cell">命中规则</th>
                  <th className="preview-head-cell">原路径</th>
                  <th className="preview-head-cell">目标路径</th>
                  <th className="preview-head-cell">状态说明</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.sourcePath}:${item.targetPath ?? 'unmatched'}`} className="preview-row">
                    <td className="preview-cell">
                      <div className="space-y-2">
                        <p className="preview-file">{item.fileName}</p>
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(item)}
                          {item.executionState && item.executionState !== 'pending' ? (
                            <Badge variant="neutral">{getExecutionLabel(item.executionState)}</Badge>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="preview-cell">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-fg-default">{item.matchedRuleName ?? '未命中'}</p>
                        {item.matchedKeywords?.length ? (
                          <p className="preview-subtle">命中字段：{item.matchedKeywords.join('、')}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="preview-cell">
                      <span className="preview-path" title={item.sourcePath}>
                        {item.sourcePath}
                      </span>
                    </td>
                    <td className="preview-cell">
                      {item.targetPath ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-fg-default">{item.finalTargetFileName}</p>
                          <span
                            className="preview-path"
                            title={
                              item.executionState === 'undone'
                                ? item.restoredSourcePath ?? item.targetPath
                                : item.targetPath
                            }
                          >
                            {item.executionState === 'undone'
                              ? item.restoredSourcePath ?? item.targetPath
                              : item.targetPath}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-fg-muted">保留原地</span>
                      )}
                    </td>
                    <td className="preview-cell">
                      <p className="text-sm leading-6 text-fg-muted">{item.message ?? '无额外说明'}</p>
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
