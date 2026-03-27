import { Brain, FolderOpen, Orbit, Play, RefreshCcw, Sparkles, Wand2 } from 'lucide-react'

import { HistoryList } from '@renderer/components/app/history-list'
import { PreviewTable } from '@renderer/components/app/preview-table'
import { TaskProgressCard } from '@renderer/components/app/task-progress-card'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import type { DisplayPreview } from '@renderer/lib/app-helpers'
import { formatDateTime } from '@renderer/lib/app-helpers'
import type {
  FieldSuggestionResult,
  PreviewTab,
  RunLog,
  TaskProgressEvent
} from '@shared/types'

export function HomePage({
  sourceRoot,
  outputRoot,
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
  const summaryStats = [
    {
      label: '最近一次整理',
      value: latestHistory ? `${latestHistory.summary.moved}` : '0',
      helper: latestHistory ? formatDateTime(latestHistory.finishedAt) : '还没有历史记录'
    },
    {
      label: '字段建议',
      value: suggestionResult ? `${suggestionResult.suggestions.length}` : '0',
      helper: suggestionResult ? `扫描 ${suggestionResult.scannedFileCount} 个文件` : '选择源目录后自动分析'
    },
    {
      label: '待确认计划',
      value: preview ? `${preview.summary.total}` : '0',
      helper: preview ? `将整理 ${preview.summary.matched} 个文件` : '先生成预览计划'
    }
  ]

  return (
    <div className="space-y-6">
      <section className="hero-panel overflow-hidden rounded-[28px] border border-[rgba(9,105,218,0.16)] px-6 py-6 shadow-float md:px-8 md:py-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] md:block">
          <div className="hero-orb hero-orb-primary" />
          <div className="hero-orb hero-orb-secondary" />
        </div>
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(9,105,218,0.18)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Uno / 一格
            </div>
            <div className="max-w-[760px] space-y-3">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#0f172a] md:text-[2.9rem]">
                把杂乱文件名，变成一条清晰的分拣流水线。
              </h1>
              <p className="max-w-[620px] text-base leading-7 text-fg-muted md:text-lg">
                从源目录自动提取高频字段，生成规则，预览移动计划，再安全执行。整个首页只保留你真正需要的那条主路径。
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {summaryStats.map((stat) => (
                <div key={stat.label} className="glass-tile rounded-2xl px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#0f172a]">{stat.value}</p>
                  <p className="mt-2 text-sm text-fg-muted">{stat.helper}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel relative overflow-hidden rounded-[24px] border-[rgba(15,23,42,0.08)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0f6cfd_0%,#34bfff_100%)]" />
            <div className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-fg-subtle">Workbench</p>
                  <h2 className="mt-1 text-xl font-semibold text-[#0f172a]">整理流程面板</h2>
                </div>
                <Badge variant="accent">GitHub Light++</Badge>
              </div>

              <div className="space-y-3">
                <button type="button" className="path-picker" onClick={onPickSource}>
                  <div>
                    <p className="path-picker-label">源目录</p>
                    <p className="path-picker-value">{sourceRoot || '点击选择要扫描的文件夹'}</p>
                  </div>
                  <FolderOpen className="h-5 w-5 text-accent" />
                </button>
                <button type="button" className="path-picker" onClick={onPickOutput}>
                  <div>
                    <p className="path-picker-label">输出根目录</p>
                    <p className="path-picker-value">{outputRoot || '点击选择整理后的根目录'}</p>
                  </div>
                  <Orbit className="h-5 w-5 text-accent" />
                </button>
              </div>

              <div className="rounded-2xl border border-border-default bg-canvas-default px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-fg-default">下一步建议</p>
                    <p className="mt-1 text-sm text-fg-muted">
                      {!sourceRoot
                        ? '先选源目录，系统会自动分析高频字段。'
                        : !outputRoot
                          ? '再选输出根目录，确保预览结果可以落地。'
                          : !preview
                            ? '先生成预览计划，再决定是否执行整理。'
                            : '预览已经生成，确认无误后可以执行整理。'}
                    </p>
                  </div>
                  <Brain className="h-5 w-5 text-accent" />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="default" size="lg" onClick={onGeneratePreview}>
                  <Wand2 className="h-4 w-4" />
                  生成预览计划
                </Button>
                <Button variant="secondary" size="lg" onClick={onExecute}>
                  <Play className="h-4 w-4" />
                  确认后开始整理
                </Button>
                <Button variant="outline" size="lg" onClick={onOpenRules}>
                  去规则管理
                </Button>
                <Button variant="ghost" size="lg" onClick={onOpenGuide}>
                  查看说明
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TaskProgressCard task={activeTask} canCancel={canCancelTask} onCancel={onCancelTask} />

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border-muted bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">字段建议</CardTitle>
                <p className="mt-1 text-sm text-fg-muted">
                  选择源目录后自动提取高频字段，勾选后可直接生成规则。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={onRefreshSuggestions}>
                  <RefreshCcw className="h-4 w-4" />
                  重新分析
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={selectedSuggestions.size === 0}
                  onClick={() => onCreateRulesFromSuggestions(false)}
                >
                  生成规则
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={selectedSuggestions.size === 0}
                  onClick={() => onCreateRulesFromSuggestions(true)}
                >
                  生成并打开规则页
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {!suggestionResult || suggestionResult.suggestions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-default bg-canvas-default px-4 py-8 text-center text-sm text-fg-muted">
                选择源目录后会自动出现字段建议。
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                        <div>
                          <p className="text-base font-semibold text-[#0f172a]">{suggestion.value}</p>
                          <p className="mt-1 text-sm text-fg-muted">{suggestion.sampleFileName}</p>
                        </div>
                        <Badge variant={selected ? 'accent' : 'neutral'}>{suggestion.count}</Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-fg-subtle">
                        <span>{suggestion.source}</span>
                        <span>{Math.round(suggestion.confidence * 100)}% 置信度</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border-muted bg-[linear-gradient(180deg,#ffffff_0%,#fffdf5_100%)]">
            <CardTitle className="text-base">流程说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {[
              ['01', '选择目录', '指定要扫描的源目录和整理后的输出根目录。'],
              ['02', '确认建议', '勾选自动识别出的高频字段，快速生成规则。'],
              ['03', '预览计划', '在执行前确认目标目录、命中规则和重命名结果。'],
              ['04', '执行与撤销', '执行整理后可以查看历史，并撤销最近一次成功任务。']
            ].map(([step, title, description]) => (
              <div key={step} className="workflow-step">
                <div className="workflow-index">{step}</div>
                <div>
                  <p className="text-sm font-semibold text-fg-default">{title}</p>
                  <p className="mt-1 text-sm text-fg-muted">{description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <PreviewTable activeTab={previewTab} preview={preview} onTabChange={onPreviewTabChange} />

      <HistoryList history={history} onUndo={onUndo} />
    </div>
  )
}
