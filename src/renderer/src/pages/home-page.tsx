import { FileSymlink, FolderOpen } from 'lucide-react'

import { HistoryList } from '@renderer/components/app/history-list'
import { PreviewTable } from '@renderer/components/app/preview-table'
import { TaskProgressCard } from '@renderer/components/app/task-progress-card'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { AppIcon } from '@renderer/components/ui/app-icon'
import { Switch } from '@renderer/components/ui/switch'
import type { DisplayPreview } from '@renderer/lib/app-helpers'
import { formatDateTime } from '@renderer/lib/app-helpers'
import type {
  FieldSuggestionResult,
  PreviewTab,
  RunLog,
  SuggestionSource,
  TaskProgressEvent
} from '@shared/types'

function getSuggestionSourceLabel(source: SuggestionSource) {
  if (source === 'phrase') {
    return '词组'
  }

  if (source === 'substring') {
    return '片段'
  }

  return '字段'
}

export function HomePage({
  sourceRoot,
  outputRoot,
  scanSubdirectories,
  preview,
  previewTab,
  suggestionResult,
  selectedSuggestions,
  history,
  activeTask,
  canCancelTask,
  onPreviewTabChange,
  onPickSource,
  onPickOutput,
  onToggleScanSubdirectories,
  onRefreshSuggestions,
  onCreateRulesFromSuggestions,
  onGeneratePreview,
  onExecute,
  onUndo,
  onCancelTask,
  onOpenRules,
  onOpenGuide,
  onToggleSuggestion
}: {
  sourceRoot: string
  outputRoot: string
  scanSubdirectories: boolean
  preview: DisplayPreview | null
  previewTab: PreviewTab
  suggestionResult: FieldSuggestionResult | null
  selectedSuggestions: Set<string>
  history: RunLog[]
  activeTask: TaskProgressEvent | null
  canCancelTask: boolean
  onPreviewTabChange: (tab: PreviewTab) => void
  onPickSource: () => void
  onPickOutput: () => void
  onToggleScanSubdirectories: (enabled: boolean) => void
  onRefreshSuggestions: () => void
  onCreateRulesFromSuggestions: (openRulesPage: boolean) => void
  onGeneratePreview: () => void
  onExecute: () => void
  onUndo: (runId: string) => void
  onCancelTask: () => void
  onOpenRules: () => void
  onOpenGuide: () => void
  onToggleSuggestion: (value: string) => void
}) {
  const latestHistory = history[0]
  const selectedCount = selectedSuggestions.size
  const summaryStats = [
    {
      label: '最近一次整理',
      value: latestHistory ? `${latestHistory.summary.moved}` : '0',
      helper: latestHistory ? formatDateTime(latestHistory.finishedAt) : '还没有历史记录'
    },
    {
      label: '字段建议',
      value: suggestionResult ? `${suggestionResult.suggestions.length}` : '0',
      helper: suggestionResult
        ? `扫描 ${suggestionResult.scannedFileCount} 个文件`
        : '选择源目录后自动分析'
    },
    {
      label: '待确认计划',
      value: preview ? `${preview.summary.total}` : '0',
      helper: preview ? `将整理 ${preview.summary.matched} 个文件` : '先生成预览计划'
    }
  ]

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
          <div className="surface-panel p-6">
            <div>
              <p className="panel-kicker">Source Directory</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-fg-default">源目录</h2>
              <p className="mt-2 text-sm text-fg-muted">选择需要扫描的根目录。</p>
            </div>
            <button type="button" className="path-picker mt-5" onClick={onPickSource}>
              <div>
                <p className="path-picker-label">当前路径</p>
                <p className="path-picker-value">{sourceRoot || '点击选择要扫描的文件夹...'}</p>
              </div>
              <AppIcon icon={FolderOpen} accent />
            </button>
            <div className="path-panel-footer">
              <div className="path-status-row">
                <Badge variant={sourceRoot ? 'accent' : 'neutral'}>
                  {sourceRoot ? '已选择源目录' : '等待选择'}
                </Badge>
                <Badge variant="neutral">{scanSubdirectories ? '递归扫描已开启' : '默认不递归'}</Badge>
              </div>
              <div className="flex items-start justify-between gap-4 rounded-[18px] border border-white/[0.08] bg-black/20 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg-default">递归扫描子目录</p>
                  <p className="mt-1 text-sm leading-6 text-fg-muted">
                    关闭时只扫描源目录当前层级。开启后才会继续进入所有子目录。
                  </p>
                </div>
                <Switch checked={scanSubdirectories} onCheckedChange={onToggleScanSubdirectories} />
              </div>
              <p className="path-panel-note">
                选择后会立刻分析高频字段，右侧工作台会直接给出可用的规则建议。
              </p>
            </div>
          </div>

          <div className="surface-panel p-6">
            <div>
              <p className="panel-kicker">Output Root</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-fg-default">输出根目录</h2>
              <p className="mt-2 text-sm text-fg-muted">决定命中规则后的目标落点。</p>
            </div>
            <button type="button" className="path-picker mt-5" onClick={onPickOutput}>
              <div>
                <p className="path-picker-label">当前路径</p>
                <p className="path-picker-value">{outputRoot || '点击选择整理后的目标根目录...'}</p>
              </div>
              <AppIcon icon={FileSymlink} accent />
            </button>
            <div className="path-panel-footer">
              <div className="path-status-row">
                <Badge variant={outputRoot ? 'accent' : 'neutral'}>
                  {outputRoot ? '已设置输出目录' : '可稍后再选'}
                </Badge>
                <Badge variant="neutral">支持同根目录整理</Badge>
              </div>
              <p className="path-panel-note">
                目标重名文件会自动改名，执行前仍然会先生成预览计划。
              </p>
            </div>
          </div>

          <div className="surface-panel p-6">
            <div>
              <p className="panel-kicker">Quick Status</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-fg-default">工作台概览</h2>
            </div>

            <div className="mt-5 grid gap-3">
              {summaryStats.map((stat) => (
                <div key={stat.label} className="hero-stat-card px-4 py-4">
                  <div className="hero-stat-bar" />
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-fg-subtle">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-[2.1rem] font-semibold leading-none tracking-[-0.06em] text-fg-default">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-fg-muted">{stat.helper}</p>
                </div>
              ))}
            </div>

            {latestHistory ? (
              <div className="glass-tile mt-5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-fg-default">最近任务可撤销</p>
                    <p className="mt-1 text-sm text-fg-muted">
                      {formatDateTime(latestHistory.finishedAt)} 路 成功整理 {latestHistory.summary.moved} 个文件
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!latestHistory.isUndoAvailable}
                    onClick={() => onUndo(latestHistory.runId)}
                  >
                    撤销
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <div className="hero-panel h-full px-7 py-7 md:px-8 md:py-8">
            <div className="hero-orb hero-orb-primary" />
            <div className="hero-orb hero-orb-secondary" />

            <div className="relative z-10 flex h-full flex-col gap-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="panel-kicker">Rule Builder</p>
                  <h1 className="mt-3 text-[clamp(1.7rem,3vw,2.5rem)] font-semibold tracking-[-0.05em] text-fg-default">
                    字段建议与规则生成
                  </h1>
                  <p className="mt-3 max-w-[720px] text-sm leading-7 text-fg-muted">
                    这里只保留真正会影响整理结果的动作：挑字段、生成规则、预览计划、开始整理。
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={onRefreshSuggestions}>
                    重新分析
                  </Button>
                  <Button variant="ghost" onClick={onOpenGuide}>
                    查看说明
                  </Button>
                </div>
              </div>

              {!suggestionResult || suggestionResult.suggestions.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 px-5 py-8 text-center text-sm text-fg-muted">
                  选择源目录后，这里会自动显示高频字段建议。
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {suggestionResult.suggestions.map((suggestion) => {
                    const selected = selectedSuggestions.has(suggestion.value)
                    return (
                      <button
                        key={suggestion.value}
                        type="button"
                        onClick={() => onToggleSuggestion(suggestion.value)}
                        className={`suggestion-card ${selected ? 'suggestion-card-selected' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-fg-default">{suggestion.value}</p>
                            <p className="mt-1 truncate text-sm text-fg-muted">{suggestion.sampleFileName}</p>
                          </div>
                          <Badge variant={selected ? 'accent' : 'neutral'}>{suggestion.count}</Badge>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-fg-subtle">
                          <span>{getSuggestionSourceLabel(suggestion.source)}</span>
                          <span>{Math.round(suggestion.confidence * 100)}% 置信度</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="glass-tile p-5">
                  <p className="panel-kicker">Suggestion Summary</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="accent">已选字段 {selectedCount}</Badge>
                    <Badge variant="neutral">建议总数 {suggestionResult?.suggestions.length ?? 0}</Badge>
                    <Badge variant="neutral">预览待整理 {preview?.summary.matched ?? 0}</Badge>
                  </div>
                </div>

                <div className="glass-tile p-5">
                  <p className="panel-kicker">Actions</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      disabled={selectedCount === 0}
                      onClick={() => onCreateRulesFromSuggestions(false)}
                    >
                      生成规则
                    </Button>
                    <Button
                      variant="outline"
                      disabled={selectedCount === 0}
                      onClick={() => onCreateRulesFromSuggestions(true)}
                    >
                      打开规则页精修
                    </Button>
                    <Button variant="outline" onClick={onOpenRules}>
                      规则管理
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button variant="default" onClick={onGeneratePreview}>
                      生成预览
                    </Button>
                    <Button variant="secondary" onClick={onExecute}>
                      开始整理
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TaskProgressCard task={activeTask} canCancel={canCancelTask} onCancel={onCancelTask} />

      <PreviewTable activeTab={previewTab} preview={preview} onTabChange={onPreviewTabChange} />

      <HistoryList history={history} onUndo={onUndo} />
    </div>
  )
}
