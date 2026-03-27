import type {
  ExecutionState,
  PreviewItem,
  PreviewResult,
  PreviewTab,
  RuleConfig,
  RuleFilterMode,
  RuleGroupMode,
  RunLog,
  TaskProgressEvent
} from '@shared/types'
import { buildRuleDuplicateKey } from '@shared/rules'

export type DisplayPreview = {
  generatedAt: string
  items: PreviewItem[]
  summary: PreviewResult['summary'] | RunLog['summary']
}

export type NoticeTone = 'success' | 'warning' | 'danger' | 'neutral'

export interface NoticeState {
  tone: NoticeTone
  message: string
}

export interface ConfirmState {
  title: string
  description: string
  confirmLabel: string
  confirmTone: 'default' | 'danger'
  onConfirm: () => Promise<void>
}

export interface RuleDraft {
  id?: string
  name: string
  keywordsText: string
  excludeKeywordsText: string
  extensionsText: string
  outputFolderName: string
  enabled: boolean
  matchMode: RuleConfig['matchMode']
}

export function emptyRuleDraft(): RuleDraft {
  return {
    name: '',
    keywordsText: '',
    excludeKeywordsText: '',
    extensionsText: '',
    outputFolderName: '',
    enabled: true,
    matchMode: 'any'
  }
}

export function normalizeSuggestionValue(value: string) {
  return value.trim().toLocaleLowerCase()
}

export function buildRuleValueLookup(rules: RuleConfig[]) {
  const values = new Set<string>()

  for (const rule of rules) {
    for (const candidate of [
      rule.name,
      rule.outputFolderName,
      ...rule.keywords,
      ...rule.excludeKeywords,
      ...rule.extensions
    ]) {
      const normalizedCandidate = normalizeSuggestionValue(candidate)
      if (normalizedCandidate) {
        values.add(normalizedCandidate)
      }
    }
  }

  return values
}

export function formatDateTime(timestamp: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(timestamp))
}

export function getNoticeClasses(tone: NoticeTone) {
  switch (tone) {
    case 'success':
      return 'border-[#9be9a8] bg-success-subtle text-success'
    case 'warning':
      return 'border-[#d4a72c] bg-warning-subtle text-warning'
    case 'danger':
      return 'border-[#ff8182] bg-danger-subtle text-danger'
    default:
      return 'border-border-default bg-canvas-card text-fg-muted'
  }
}

export function getExecutionLabel(executionState: ExecutionState | undefined) {
  switch (executionState) {
    case 'moved':
      return '已移动'
    case 'copied':
      return '跨盘整理'
    case 'error':
      return '执行失败'
    case 'undone':
      return '已撤销'
    case 'undo-error':
      return '撤销失败'
    case 'skipped':
      return '未处理'
    default:
      return '待执行'
  }
}

export function getPreviewItemsByTab(items: PreviewItem[], tab: PreviewTab) {
  if (tab === 'matched') {
    return items.filter((item) => item.status === 'matched')
  }

  if (tab === 'unmatched') {
    return items.filter((item) => item.status === 'unmatched')
  }

  return items.filter((item) => item.status === 'error')
}

export function buildDuplicateRuleIdSet(rules: RuleConfig[]) {
  const groupedIds = new Map<string, string[]>()

  for (const rule of rules) {
    const key = buildRuleDuplicateKey(rule)
    const existing = groupedIds.get(key)
    if (existing) {
      existing.push(rule.id)
    } else {
      groupedIds.set(key, [rule.id])
    }
  }

  return new Set(
    [...groupedIds.values()].filter((ids) => ids.length > 1).flatMap((ids) => ids)
  )
}

export function filterRules(
  rules: RuleConfig[],
  searchValue: string,
  filterMode: RuleFilterMode,
  duplicateIds: Set<string>
) {
  const normalizedSearch = searchValue.trim().toLocaleLowerCase()

  return rules.filter((rule) => {
    if (filterMode === 'enabled' && !rule.enabled) {
      return false
    }

    if (filterMode === 'disabled' && rule.enabled) {
      return false
    }

    if (filterMode === 'duplicates' && !duplicateIds.has(rule.id)) {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    return [
      rule.name,
      rule.outputFolderName,
      ...rule.keywords,
      ...rule.excludeKeywords,
      ...rule.extensions
    ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch))
  })
}

export function groupRules(rules: RuleConfig[], mode: RuleGroupMode) {
  if (mode === 'none') {
    return [{ label: '全部规则', rules }]
  }

  const groups = new Map<string, RuleConfig[]>()
  for (const rule of rules) {
    const label = mode === 'output' ? rule.outputFolderName : rule.enabled ? '已启用' : '已停用'
    const existing = groups.get(label)
    if (existing) {
      existing.push(rule)
    } else {
      groups.set(label, [rule])
    }
  }

  return [...groups.entries()]
    .map(([label, groupedRules]) => ({
      label,
      rules: groupedRules
    }))
    .sort((left, right) => left.label.localeCompare(right.label, 'zh-CN'))
}

export function describeTaskProgress(task: TaskProgressEvent | null) {
  if (!task) {
    return null
  }

  if (task.total && task.total > 0) {
    return `${task.message} ${task.processed}/${task.total}`
  }

  return task.message
}
