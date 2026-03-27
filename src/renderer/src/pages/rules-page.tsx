import { Download, GripVertical, Import, Layers2, PencilLine, Plus, Search, Trash2 } from 'lucide-react'

import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import type { RuleConfig, RuleFilterMode, RuleGroupMode } from '@shared/types'

export function RulesPage({
  ruleGroups,
  duplicateRuleIds,
  rulesSearch,
  ruleFilter,
  ruleGroup,
  selectedRuleIds,
  dragEnabled,
  draggingRuleId,
  dropTargetId,
  onRulesSearchChange,
  onRuleFilterChange,
  onRuleGroupChange,
  onCreateRule,
  onImportRules,
  onExportRules,
  onSelectAllVisible,
  onClearSelection,
  onBatchEnable,
  onBatchDisable,
  onBatchDelete,
  onEditRule,
  onDeleteRule,
  onToggleRuleEnabled,
  onToggleRuleSelection,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDropOn,
  onGoHome
}: {
  ruleGroups: { label: string; rules: RuleConfig[] }[]
  duplicateRuleIds: Set<string>
  rulesSearch: string
  ruleFilter: RuleFilterMode
  ruleGroup: RuleGroupMode
  selectedRuleIds: Set<string>
  dragEnabled: boolean
  draggingRuleId: string | null
  dropTargetId: string | null
  onRulesSearchChange: (value: string) => void
  onRuleFilterChange: (value: RuleFilterMode) => void
  onRuleGroupChange: (value: RuleGroupMode) => void
  onCreateRule: () => void
  onImportRules: () => void
  onExportRules: () => void
  onSelectAllVisible: () => void
  onClearSelection: () => void
  onBatchEnable: () => void
  onBatchDisable: () => void
  onBatchDelete: () => void
  onEditRule: (rule: RuleConfig) => void
  onDeleteRule: (rule: RuleConfig) => void
  onToggleRuleEnabled: (ruleId: string) => void
  onToggleRuleSelection: (ruleId: string) => void
  onDragStart: (ruleId: string) => void
  onDragEnter: (ruleId: string) => void
  onDragEnd: () => void
  onDropOn: (targetRuleId: string | null) => void
  onGoHome: () => void
}) {
  const visibleRuleCount = ruleGroups.reduce((count, group) => count + group.rules.length, 0)

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_52%,#eef6ff_100%)] px-6 py-6 shadow-float">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(9,105,218,0.16)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Rules Console
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#0f172a]">把规则列表，做成真正可维护的控制台。</h1>
            <p className="max-w-[760px] text-base leading-7 text-fg-muted">
              这里负责所有长期维护动作：拖动排序、搜索、筛选、按目标目录分组、批量启停、导入导出和重复规则检查。
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="glass-tile rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">当前可见</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#0f172a]">{visibleRuleCount}</p>
            </div>
            <div className="glass-tile rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">已选中</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#0f172a]">{selectedRuleIds.size}</p>
            </div>
            <div className="glass-tile rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">重复规则</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#0f172a]">{duplicateRuleIds.size}</p>
            </div>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border-muted bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)]">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              <CardTitle className="text-base">规则工作台</CardTitle>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
                <Input
                  className="pl-9"
                  placeholder="搜索规则名、关键词、排除词、扩展名或输出目录"
                  value={rulesSearch}
                  onChange={(event) => onRulesSearchChange(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select className="rounded-xl border border-border-default bg-canvas-card px-3 text-sm text-fg-default" value={ruleFilter} onChange={(event) => onRuleFilterChange(event.target.value as RuleFilterMode)}>
                <option value="all">全部规则</option>
                <option value="enabled">只看已启用</option>
                <option value="disabled">只看已停用</option>
                <option value="duplicates">只看重复</option>
              </select>
              <select className="rounded-xl border border-border-default bg-canvas-card px-3 text-sm text-fg-default" value={ruleGroup} onChange={(event) => onRuleGroupChange(event.target.value as RuleGroupMode)}>
                <option value="none">平铺查看</option>
                <option value="output">按输出目录分组</option>
                <option value="status">按启用状态分组</option>
              </select>
              <Button variant="outline" onClick={onImportRules}>
                <Import className="h-4 w-4" />
                导入规则
              </Button>
              <Button variant="outline" onClick={onExportRules}>
                <Download className="h-4 w-4" />
                导出规则
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="default" onClick={onCreateRule}>
              <Plus className="h-4 w-4" />
              新建规则
            </Button>
            <Button variant="secondary" onClick={onSelectAllVisible}>
              一键全选可见规则
            </Button>
            <Button variant="outline" onClick={onClearSelection}>
              清空选择
            </Button>
            <Button variant="outline" disabled={selectedRuleIds.size === 0} onClick={onBatchEnable}>
              批量启用
            </Button>
            <Button variant="outline" disabled={selectedRuleIds.size === 0} onClick={onBatchDisable}>
              批量停用
            </Button>
            <Button variant="danger" disabled={selectedRuleIds.size === 0} onClick={onBatchDelete}>
              批量删除
            </Button>
            <Button variant="ghost" onClick={onGoHome}>
              返回首页
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-4">
          {!dragEnabled ? (
            <div className="rounded-2xl border border-dashed border-border-default bg-canvas-default px-4 py-3 text-sm text-fg-muted">
              当前处于分组视图。切换到“平铺查看”后即可拖动改变优先级顺序。
            </div>
          ) : null}

          {visibleRuleCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-default bg-canvas-default px-4 py-8 text-center text-sm text-fg-muted">
              当前筛选条件下没有规则。
            </div>
          ) : (
            ruleGroups.map((group) => (
              <section key={group.label} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-fg-subtle">{group.label}</h2>
                  <Badge variant="neutral">{group.rules.length}</Badge>
                </div>
                <div className="space-y-3">
                  {group.rules.map((rule) => {
                    const selected = selectedRuleIds.has(rule.id)
                    const isDuplicate = duplicateRuleIds.has(rule.id)
                    const isDragTarget = dropTargetId === rule.id
                    const isDragging = draggingRuleId === rule.id

                    return (
                      <div
                        key={rule.id}
                        draggable={dragEnabled}
                        onDragStart={() => onDragStart(rule.id)}
                        onDragEnter={() => onDragEnter(rule.id)}
                        onDragOver={(event) => {
                          if (dragEnabled) {
                            event.preventDefault()
                          }
                        }}
                        onDragEnd={onDragEnd}
                        onDrop={(event) => {
                          event.preventDefault()
                          onDropOn(rule.id)
                        }}
                        className={`rule-card ${selected ? 'rule-card-selected' : ''} ${isDragTarget ? 'rule-card-drop-target' : ''} ${isDragging ? 'opacity-60' : ''}`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex gap-3">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
                              checked={selected}
                              onChange={() => onToggleRuleSelection(rule.id)}
                            />
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                {dragEnabled ? <GripVertical className="h-4 w-4 text-fg-subtle" /> : <Layers2 className="h-4 w-4 text-fg-subtle" />}
                                <p className="text-base font-semibold text-[#0f172a]">{rule.name}</p>
                                <Badge variant={rule.enabled ? 'success' : 'neutral'}>
                                  {rule.enabled ? '已启用' : '已停用'}
                                </Badge>
                                <Badge variant="accent">{rule.matchMode === 'all' ? '全部命中' : '任一命中'}</Badge>
                                {isDuplicate ? <Badge variant="warning">重复规则</Badge> : null}
                              </div>

                              <div className="grid gap-3 text-sm text-fg-muted md:grid-cols-3">
                                <div>
                                  <p className="font-medium text-fg-default">输出目录</p>
                                  <p className="mt-1 text-code">{rule.outputFolderName}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-fg-default">包含关键词</p>
                                  <p className="mt-1">{rule.keywords.join('、')}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-fg-default">排除 / 扩展名</p>
                                  <p className="mt-1">
                                    {rule.excludeKeywords.length > 0 ? `排除：${rule.excludeKeywords.join('、')}` : '无排除词'}
                                    {rule.extensions.length > 0 ? ` · 扩展名：${rule.extensions.join('、')}` : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => onToggleRuleEnabled(rule.id)}>
                              {rule.enabled ? '停用' : '启用'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onEditRule(rule)}>
                              <PencilLine className="h-4 w-4" />
                              编辑
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => onDeleteRule(rule)}>
                              <Trash2 className="h-4 w-4" />
                              删除
                            </Button>
                          </div>
                        </div>
                        {isDragTarget ? (
                          <div className="mt-4 rounded-xl border border-dashed border-accent bg-accent-subtle px-3 py-2 text-sm text-accent">
                            释放后会插入到这条规则之前。
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </section>
            ))
          )}

          {dragEnabled && visibleRuleCount > 0 ? (
            <div
              className={`rounded-2xl border border-dashed px-4 py-4 text-sm ${dropTargetId === '__end__' ? 'border-accent bg-accent-subtle text-accent' : 'border-border-default bg-canvas-default text-fg-muted'}`}
              onDragOver={(event) => event.preventDefault()}
              onDragEnter={() => onDragEnter('__end__')}
              onDrop={(event) => {
                event.preventDefault()
                onDropOn(null)
              }}
            >
              释放到这里会移动到列表末尾。
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
