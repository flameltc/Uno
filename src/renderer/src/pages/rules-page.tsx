import { GripVertical, Search } from 'lucide-react'

import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { AppIcon } from '@renderer/components/ui/app-icon'
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

  function renderTokenList(values: string[], emptyLabel: string) {
    if (values.length === 0) {
      return <span className="rule-token rule-token-muted">{emptyLabel}</span>
    }

    return values.map((value, index) => (
      <span key={`${value}-${index}`} className="rule-token">
        {value}
      </span>
    ))
  }

  function getRuleSummary(rule: RuleConfig) {
    const segments = [`优先级 #${rule.priority + 1}`, `包含 ${rule.keywords.length} 个关键词`]

    if (rule.excludeKeywords.length > 0) {
      segments.push(`排除 ${rule.excludeKeywords.length} 项`)
    }

    if (rule.extensions.length > 0) {
      segments.push(`限定 ${rule.extensions.length} 个扩展名`)
    } else {
      segments.push('不限扩展名')
    }

    return segments.join(' 路 ')
  }

  return (
    <div className="space-y-6">
      <section className="hero-panel px-7 py-7 md:px-8 md:py-8">
        <div className="hero-orb hero-orb-primary" />
        <div className="hero-orb hero-orb-secondary" />

        <div className="relative z-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
          <div className="max-w-[860px]">
            <p className="panel-kicker">Rules Console</p>
            <h1 className="mt-4 text-[clamp(2.3rem,4vw,4rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-fg-default">
              规则管理 / 优先级控制台
            </h1>
            <p className="mt-4 text-base leading-8 text-fg-muted">
              这里负责长期维护动作：搜索、筛选、分组、拖动排序、批量启停、导入导出和重复规则检查。
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="glass-tile px-4 py-4">
              <p className="panel-kicker">Visible</p>
              <p className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-fg-default">{visibleRuleCount}</p>
              <p className="mt-2 text-sm text-fg-muted">当前可见规则</p>
            </div>
            <div className="glass-tile px-4 py-4">
              <p className="panel-kicker">Selected</p>
              <p className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-fg-default">{selectedRuleIds.size}</p>
              <p className="mt-2 text-sm text-fg-muted">批量操作目标</p>
            </div>
            <div className="glass-tile px-4 py-4">
              <p className="panel-kicker">Duplicates</p>
              <p className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-fg-default">{duplicateRuleIds.size}</p>
              <p className="mt-2 text-sm text-fg-muted">待处理重复规则</p>
            </div>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="space-y-5">
          <div className="space-y-3">
            <div>
              <p className="panel-kicker">Command Bar</p>
              <CardTitle className="mt-2 text-lg">规则命令栏</CardTitle>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <AppIcon icon={Search} size="sm" />
                </div>
                <Input
                  className="pl-11"
                  placeholder="搜索规则名、关键词、排除词、扩展名或输出目录"
                  value={rulesSearch}
                  onChange={(event) => onRulesSearchChange(event.target.value)}
                />
              </div>

              <div className="glass-tile flex flex-wrap items-center gap-2 p-2 xl:flex-nowrap">
                <select
                  className="toolbar-select min-w-[170px]"
                  value={ruleFilter}
                  onChange={(event) => onRuleFilterChange(event.target.value as RuleFilterMode)}
                >
                  <option value="all">全部规则</option>
                  <option value="enabled">只看已启用</option>
                  <option value="disabled">只看已停用</option>
                  <option value="duplicates">只看重复规则</option>
                </select>
                <select
                  className="toolbar-select min-w-[170px]"
                  value={ruleGroup}
                  onChange={(event) => onRuleGroupChange(event.target.value as RuleGroupMode)}
                >
                  <option value="none">平铺查看</option>
                  <option value="output">按输出目录分组</option>
                  <option value="status">按启用状态分组</option>
                </select>
                <Button className="toolbar-button min-w-[160px]" variant="outline" onClick={onImportRules}>
                  导入规则
                </Button>
                <Button className="toolbar-button min-w-[160px]" variant="outline" onClick={onExportRules}>
                  导出规则
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="default" onClick={onCreateRule}>
              新建规则
            </Button>
            <Button variant="secondary" onClick={onSelectAllVisible}>
              一键全选
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

        <CardContent className="space-y-5">
          {!dragEnabled ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 px-4 py-3 text-sm text-fg-muted">
              当前处于分组视图。切换到“平铺查看”后，即可通过拖动改变优先级顺序。
            </div>
          ) : null}

          {visibleRuleCount === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-fg-muted">
              当前筛选条件下没有规则。
            </div>
          ) : (
            ruleGroups.map((group) => (
              <section key={group.label} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-fg-subtle">{group.label}</h2>
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
                        <div className="rule-card-main">
                          <div className="rule-card-content">
                            <input
                              type="checkbox"
                              className="rule-selection-input"
                              checked={selected}
                              onChange={() => onToggleRuleSelection(rule.id)}
                            />

                            <div className="space-y-4">
                              <div className="rule-card-title-row">
                                {dragEnabled ? <AppIcon icon={GripVertical} size="sm" /> : null}
                                <p className="rule-card-title">{rule.name}</p>
                                <Badge variant={rule.enabled ? 'success' : 'neutral'}>
                                  {rule.enabled ? '已启用' : '已停用'}
                                </Badge>
                                <Badge variant="accent">
                                  {rule.matchMode === 'all' ? '全部命中' : '任一命中'}
                                </Badge>
                                {isDuplicate ? <Badge variant="warning">重复规则</Badge> : null}
                              </div>
                              <p className="rule-card-summary">{getRuleSummary(rule)}</p>

                              <div className="rule-card-meta-grid">
                                <div className="rule-meta-block">
                                  <p className="rule-meta-label">输出目录</p>
                                  <p className="mt-2 text-code text-fg-default">{rule.outputFolderName}</p>
                                </div>
                                <div className="rule-meta-block">
                                  <p className="rule-meta-label">包含关键词</p>
                                  <div className="rule-token-list">{renderTokenList(rule.keywords, '暂无关键词')}</div>
                                </div>
                                <div className="rule-meta-block">
                                  <p className="rule-meta-label">排除词 / 扩展名</p>
                                  <div className="rule-token-list">
                                    {renderTokenList(rule.excludeKeywords, '无排除词')}
                                    {renderTokenList(rule.extensions, '不限扩展名')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="rule-actions">
                            <Button variant="outline" size="sm" onClick={() => onToggleRuleEnabled(rule.id)}>
                              {rule.enabled ? '停用' : '启用'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onEditRule(rule)}>
                              编辑
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => onDeleteRule(rule)}>
                              删除
                            </Button>
                          </div>
                        </div>

                        {isDragTarget ? (
                          <div className="mt-4 rounded-[20px] border border-dashed border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
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
              className={`rounded-[24px] border border-dashed px-4 py-4 text-sm ${
                dropTargetId === '__end__'
                  ? 'border-accent/30 bg-accent/10 text-accent'
                  : 'border-white/10 bg-black/20 text-fg-muted'
              }`}
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
