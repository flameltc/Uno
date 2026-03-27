import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, LayoutPanelLeft, Orbit, ScrollText } from 'lucide-react'

import { ConfirmDialog } from '@renderer/components/app/confirm-dialog'
import { NoticeBanner } from '@renderer/components/app/notice-banner'
import { RuleEditorDialog } from '@renderer/components/app/rule-editor-dialog'
import { Button } from '@renderer/components/ui/button'
import { createRuleFromSuggestion, normalizeRule, normalizeRules, parseRuleExtensions, parseRuleKeywords } from '@shared/rules'
import type {
  AppSettings,
  BootstrapPayload,
  FieldSuggestionResult,
  RuleConfig,
  RuleFilterMode,
  RuleGroupMode,
  RunLog,
  StoredState,
  TaskProgressEvent
} from '@shared/types'
import { GuidePage } from './pages/guide-page'
import { HomePage } from './pages/home-page'
import { RulesPage } from './pages/rules-page'
import {
  buildDuplicateRuleIdSet,
  buildRuleValueLookup,
  emptyRuleDraft,
  filterRules,
  formatDateTime,
  groupRules,
  type ConfirmState,
  type DisplayPreview,
  type NoticeState,
  type RuleDraft
} from './lib/app-helpers'

const DEFAULT_SETTINGS: AppSettings = {
  lastSourceRoot: '',
  lastOutputRoot: '',
  theme: 'github-light',
  locale: 'zh-CN',
  windowLayout: {
    activeView: 'home',
    activeTab: 'matched',
    rulesSearch: '',
    ruleFilter: 'all',
    ruleGroup: 'none'
  }
}

const DEFAULT_STATE: StoredState = {
  settings: DEFAULT_SETTINGS,
  rules: []
}

function toDisplayPreview(runLog: RunLog): DisplayPreview {
  return {
    generatedAt: runLog.finishedAt,
    items: runLog.items,
    summary: runLog.summary
  }
}

function buildDraftFromRule(rule: RuleConfig): RuleDraft {
  return {
    id: rule.id,
    name: rule.name,
    keywordsText: rule.keywords.join(', '),
    excludeKeywordsText: rule.excludeKeywords.join(', '),
    extensionsText: rule.extensions.join(', '),
    outputFolderName: rule.outputFolderName,
    enabled: rule.enabled,
    matchMode: rule.matchMode
  }
}

function isCancelledError(error: unknown) {
  return error instanceof Error && error.message.includes('任务已取消')
}

export default function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [rules, setRules] = useState<RuleConfig[]>(DEFAULT_STATE.rules)
  const [history, setHistory] = useState<RunLog[]>([])
  const [preview, setPreview] = useState<DisplayPreview | null>(null)
  const [suggestionResult, setSuggestionResult] = useState<FieldSuggestionResult | null>(null)
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set())
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [ruleDraft, setRuleDraft] = useState<RuleDraft>(emptyRuleDraft())
  const [activeTask, setActiveTask] = useState<TaskProgressEvent | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)

  const sourceRoot = settings.lastSourceRoot
  const outputRoot = settings.lastOutputRoot

  const duplicateRuleIds = useMemo(() => buildDuplicateRuleIdSet(rules), [rules])
  const filteredRules = useMemo(
    () => filterRules(rules, settings.windowLayout.rulesSearch, settings.windowLayout.ruleFilter, duplicateRuleIds),
    [duplicateRuleIds, rules, settings.windowLayout.ruleFilter, settings.windowLayout.rulesSearch]
  )
  const groupedRules = useMemo(
    () => groupRules(filteredRules, settings.windowLayout.ruleGroup),
    [filteredRules, settings.windowLayout.ruleGroup]
  )
  const visibleRuleIds = useMemo(() => filteredRules.map((rule) => rule.id), [filteredRules])
  const canCancelTask = activeTask?.state === 'running' && Boolean(activeTaskId)

  async function persistState(nextRules: RuleConfig[], nextSettings: AppSettings) {
    const saved = await window.api.saveState({
      settings: nextSettings,
      rules: normalizeRules(nextRules)
    })

    setRules(saved.rules)
    setSettings(saved.settings)
    return saved
  }

  async function applySettings(partialSettings: Partial<AppSettings['windowLayout']> & Partial<AppSettings>) {
    const nextSettings: AppSettings = {
      ...settings,
      ...partialSettings,
      windowLayout: {
        ...settings.windowLayout,
        ...(partialSettings.windowLayout ?? partialSettings)
      }
    }

    await persistState(rules, nextSettings)
  }

  async function runWithTask<T>(kind: 'suggest' | 'preview' | 'run' | 'undo', runner: (taskId: string) => Promise<T>) {
    const taskId = crypto.randomUUID()
    setActiveTaskId(taskId)
    setActiveTask({
      taskId,
      kind,
      phase: 'queued',
      state: 'running',
      message: '正在准备任务…',
      processed: 0
    })

    try {
      return await runner(taskId)
    } finally {
      setActiveTaskId((currentTaskId) => (currentTaskId === taskId ? null : currentTaskId))
    }
  }

  async function refreshSuggestions(nextSourceRoot = sourceRoot, nextOutputRoot = outputRoot) {
    if (!nextSourceRoot) {
      setSuggestionResult(null)
      setSelectedSuggestions(new Set())
      return
    }

    try {
      const result = await runWithTask('suggest', (taskId) =>
        window.api.suggestFields({
          sourceRoot: nextSourceRoot,
          outputRoot: nextOutputRoot,
          rules,
          maxResults: 18,
          taskId
        })
      )
      setSuggestionResult(result)
      const allowedValues = new Set(result.suggestions.map((suggestion) => suggestion.value))
      setSelectedSuggestions((current) => new Set([...current].filter((value) => allowedValues.has(value))))
    } catch (error) {
      if (!isCancelledError(error)) {
        setNotice({
          tone: 'danger',
          message: error instanceof Error ? error.message : '字段分析失败。'
        })
      }
    }
  }

  useEffect(() => {
    const unsubscribe = window.api.onTaskProgress((event) => {
      setActiveTask(event)
      if (event.state !== 'running') {
        setActiveTaskId(null)
      }
    })

    void (async () => {
      const payload: BootstrapPayload = await window.api.bootstrap()
      setRules(payload.state.rules)
      setSettings(payload.state.settings)
      setHistory(payload.history)
      setIsBootstrapping(false)

      if (payload.state.settings.lastSourceRoot) {
        await refreshSuggestions(
          payload.state.settings.lastSourceRoot,
          payload.state.settings.lastOutputRoot
        )
      }
    })()

    return unsubscribe
  }, [])

  useEffect(() => {
    setSelectedRuleIds((current) => new Set([...current].filter((ruleId) => rules.some((rule) => rule.id === ruleId))))
  }, [rules])

  async function validateRoots() {
    if (!sourceRoot) {
      setNotice({ tone: 'warning', message: '请先选择源目录。' })
      return false
    }

    if (!outputRoot) {
      setNotice({ tone: 'warning', message: '请先选择输出根目录。' })
      return false
    }

    const [sourceInfo, outputInfo] = await Promise.all([
      window.api.inspectPath(sourceRoot),
      window.api.inspectPath(outputRoot)
    ])

    if (!sourceInfo.exists || !sourceInfo.isDirectory) {
      setNotice({ tone: 'danger', message: '源目录不存在，或不是有效文件夹。' })
      return false
    }

    if (outputInfo.exists && !outputInfo.isDirectory) {
      setNotice({ tone: 'danger', message: '输出根目录不是有效文件夹。' })
      return false
    }

    return true
  }

  async function handlePickSource() {
    const picked = await window.api.pickFolder()
    if (!picked) {
      return
    }

    const nextSettings: AppSettings = {
      ...settings,
      lastSourceRoot: picked
    }

    await persistState(rules, nextSettings)
    setPreview(null)
    setNotice({ tone: 'neutral', message: '源目录已更新，正在重新分析字段建议。' })
    await refreshSuggestions(picked, nextSettings.lastOutputRoot)
  }

  async function handlePickOutput() {
    const picked = await window.api.pickFolder()
    if (!picked) {
      return
    }

    const nextSettings: AppSettings = {
      ...settings,
      lastOutputRoot: picked
    }

    await persistState(rules, nextSettings)
    setPreview(null)
    setNotice({ tone: 'neutral', message: '输出根目录已更新。' })
    if (sourceRoot) {
      await refreshSuggestions(sourceRoot, picked)
    }
  }

  function openCreateRuleDialog() {
    setRuleDraft(emptyRuleDraft())
    setRuleDialogOpen(true)
  }

  function openEditRuleDialog(rule: RuleConfig) {
    setRuleDraft(buildDraftFromRule(rule))
    setRuleDialogOpen(true)
  }

  async function handleSaveRule() {
    const keywords = parseRuleKeywords(ruleDraft.keywordsText)
    const excludeKeywords = parseRuleKeywords(ruleDraft.excludeKeywordsText)
    const extensions = parseRuleExtensions(ruleDraft.extensionsText)

    if (!ruleDraft.name.trim()) {
      setNotice({ tone: 'warning', message: '请输入规则名称。' })
      return
    }

    if (!ruleDraft.outputFolderName.trim()) {
      setNotice({ tone: 'warning', message: '请输入输出子文件夹名称。' })
      return
    }

    if (keywords.length === 0) {
      setNotice({ tone: 'warning', message: '至少需要一个包含关键词。' })
      return
    }

    const nextRules = ruleDraft.id
      ? rules.map((rule) =>
          rule.id === ruleDraft.id
            ? normalizeRule(
                {
                  ...rule,
                  name: ruleDraft.name,
                  keywords,
                  excludeKeywords,
                  extensions,
                  outputFolderName: ruleDraft.outputFolderName,
                  enabled: ruleDraft.enabled,
                  matchMode: ruleDraft.matchMode
                },
                rule.priority
              )
            : rule
        )
      : [
          ...rules,
          normalizeRule(
            {
              id: crypto.randomUUID(),
              name: ruleDraft.name,
              keywords,
              excludeKeywords,
              extensions,
              outputFolderName: ruleDraft.outputFolderName,
              enabled: ruleDraft.enabled,
              matchMode: ruleDraft.matchMode
            },
            rules.length + 1
          )
        ]

    await persistState(nextRules, settings)
    setRuleDialogOpen(false)
    setRuleDraft(emptyRuleDraft())
    setNotice({ tone: 'success', message: ruleDraft.id ? '规则已更新。' : '规则已创建。' })
  }

  function requestConfirmation(nextState: ConfirmState) {
    setConfirmState({
      ...nextState,
      onConfirm: async () => {
        setConfirmState(null)
        await nextState.onConfirm()
      }
    })
  }

  async function handleDeleteRule(rule: RuleConfig) {
    requestConfirmation({
      title: '删除规则',
      description: `删除后，“${rule.name}” 将不再参与预览和整理。`,
      confirmLabel: '确认删除',
      confirmTone: 'danger',
      onConfirm: async () => {
        const nextRules = rules.filter((entry) => entry.id !== rule.id)
        await persistState(nextRules, settings)
        setNotice({ tone: 'success', message: `已删除规则“${rule.name}”。` })
      }
    })
  }

  async function handleToggleRuleEnabled(ruleId: string) {
    const nextRules = rules.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule))
    await persistState(nextRules, settings)
  }

  function handleToggleRuleSelection(ruleId: string) {
    setSelectedRuleIds((current) => {
      const next = new Set(current)
      if (next.has(ruleId)) {
        next.delete(ruleId)
      } else {
        next.add(ruleId)
      }
      return next
    })
  }

  async function handleBatchEnable() {
    const nextRules = rules.map((rule) =>
      selectedRuleIds.has(rule.id)
        ? {
            ...rule,
            enabled: true
          }
        : rule
    )
    await persistState(nextRules, settings)
    setNotice({ tone: 'success', message: '选中的规则已启用。' })
  }

  async function handleBatchDisable() {
    const nextRules = rules.map((rule) =>
      selectedRuleIds.has(rule.id)
        ? {
            ...rule,
            enabled: false
          }
        : rule
    )
    await persistState(nextRules, settings)
    setNotice({ tone: 'success', message: '选中的规则已停用。' })
  }

  function handleBatchDelete() {
    if (selectedRuleIds.size === 0) {
      return
    }

    requestConfirmation({
      title: '批量删除规则',
      description: `将删除 ${selectedRuleIds.size} 条规则。此操作不会删除任何文件，只会移除规则配置。`,
      confirmLabel: '确认删除',
      confirmTone: 'danger',
      onConfirm: async () => {
        const nextRules = rules.filter((rule) => !selectedRuleIds.has(rule.id))
        await persistState(nextRules, settings)
        setSelectedRuleIds(new Set())
        setNotice({ tone: 'success', message: '选中的规则已删除。' })
      }
    })
  }

  function handleSelectAllVisible() {
    setSelectedRuleIds(new Set(visibleRuleIds))
  }

  async function handleImportRules() {
    try {
      const importedRules = await window.api.importRules()
      if (!importedRules || importedRules.length === 0) {
        return
      }

      const nextRules = normalizeRules([...rules, ...importedRules.map((rule, index) => ({ ...rule, id: `${rule.id}-${index}-${crypto.randomUUID()}` }))])
      await persistState(nextRules, settings)
      setNotice({ tone: 'success', message: `已导入 ${importedRules.length} 条规则。` })
    } catch (error) {
      setNotice({ tone: 'danger', message: error instanceof Error ? error.message : '导入规则失败。' })
    }
  }

  async function handleExportRules() {
    try {
      const exportedPath = await window.api.exportRules(rules)
      if (!exportedPath) {
        return
      }

      setNotice({ tone: 'success', message: `规则已导出到 ${exportedPath}` })
    } catch (error) {
      setNotice({ tone: 'danger', message: error instanceof Error ? error.message : '导出规则失败。' })
    }
  }

  function handleToggleSuggestion(value: string) {
    setSelectedSuggestions((current) => {
      const next = new Set(current)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }

  async function handleCreateRulesFromSuggestions(openRulesPage: boolean) {
    if (!suggestionResult) {
      return
    }

    const existingValues = buildRuleValueLookup(rules)
    const selectedValues = suggestionResult.suggestions
      .filter((suggestion) => selectedSuggestions.has(suggestion.value))
      .map((suggestion) => suggestion.value)
      .filter((value) => !existingValues.has(value.toLocaleLowerCase()))

    if (selectedValues.length === 0) {
      setNotice({ tone: 'warning', message: '所选字段已存在于规则中，或当前没有选中任何建议。' })
      return
    }

    const nextRules = normalizeRules([
      ...rules,
      ...selectedValues.map((value, index) => createRuleFromSuggestion(value, rules.length + index + 1))
    ])
    const nextSettings: AppSettings = openRulesPage
      ? {
          ...settings,
          windowLayout: {
            ...settings.windowLayout,
            activeView: 'rules',
            rulesSearch: ''
          }
        }
      : settings

    await persistState(nextRules, nextSettings)
    setSelectedRuleIds(new Set(nextRules.slice(-selectedValues.length).map((rule) => rule.id)))
    setSelectedSuggestions(new Set())
    setNotice({ tone: 'success', message: `已根据建议生成 ${selectedValues.length} 条规则。` })
  }

  async function handleGeneratePreview() {
    if (!(await validateRoots())) {
      return
    }

    if (!rules.some((rule) => rule.enabled)) {
      setNotice({ tone: 'warning', message: '至少需要一条启用中的规则。' })
      return
    }

    try {
      const result = await runWithTask('preview', (taskId) =>
        window.api.generatePreview({
          sourceRoot,
          outputRoot,
          rules,
          taskId
        })
      )

      setPreview({
        generatedAt: result.generatedAt,
        items: result.items,
        summary: result.summary
      })
      await applySettings({
        windowLayout: {
          ...settings.windowLayout,
          activeTab: 'matched'
        }
      })
      setNotice({ tone: 'success', message: `预览已生成，共 ${result.summary.total} 个文件。` })
    } catch (error) {
      if (!isCancelledError(error)) {
        setNotice({ tone: 'danger', message: error instanceof Error ? error.message : '预览生成失败。' })
      }
    }
  }

  async function handleExecute() {
    if (!(await validateRoots())) {
      return
    }

    if (!preview) {
      await handleGeneratePreview()
      return
    }

    if (preview.summary.matched === 0) {
      setNotice({ tone: 'warning', message: '当前预览里没有将要整理的文件。' })
      return
    }

    requestConfirmation({
      title: '开始整理文件',
      description: '确认后将按当前预览执行整理。你可以在首页查看进度，也可以在完成后撤销最近一次整理。',
      confirmLabel: '确认开始整理',
      confirmTone: 'default',
      onConfirm: async () => {
        try {
          const runLog = await runWithTask('run', (taskId) =>
            window.api.executeRun({
              sourceRoot,
              outputRoot,
              rules,
              taskId
            })
          )

          setPreview(toDisplayPreview(runLog))
          setHistory((current) => [runLog, ...current.filter((entry) => entry.runId !== runLog.runId)])
          await refreshSuggestions()
          setNotice({
            tone: runLog.summary.errors > 0 ? 'warning' : 'success',
            message:
              runLog.summary.errors > 0
                ? `整理完成，成功 ${runLog.summary.moved} 个，失败 ${runLog.summary.errors} 个。`
                : `整理完成，成功处理 ${runLog.summary.moved} 个文件。`
          })
        } catch (error) {
          if (!isCancelledError(error)) {
            setNotice({ tone: 'danger', message: error instanceof Error ? error.message : '整理失败。' })
          }
        }
      }
    })
  }

  function handleUndo(runId: string) {
    requestConfirmation({
      title: '撤销上一次整理',
      description: '系统会尝试把最近整理回源路径。如果原路径已存在文件，会自动改名避免覆盖。',
      confirmLabel: '确认撤销',
      confirmTone: 'default',
      onConfirm: async () => {
        try {
          const updatedRunLog = await runWithTask('undo', (taskId) =>
            window.api.undoRun({
              runId,
              taskId
            })
          )

          setHistory((current) =>
            current.map((entry) => (entry.runId === updatedRunLog.runId ? updatedRunLog : entry))
          )
          setPreview(toDisplayPreview(updatedRunLog))
          await refreshSuggestions()
          setNotice({ tone: 'success', message: `撤销完成，恢复 ${updatedRunLog.summary.undone} 个文件。` })
        } catch (error) {
          if (!isCancelledError(error)) {
            setNotice({ tone: 'danger', message: error instanceof Error ? error.message : '撤销失败。' })
          }
        }
      }
    })
  }

  async function handleCancelTask() {
    if (!activeTaskId) {
      return
    }

    await window.api.cancelTask(activeTaskId)
    setNotice({ tone: 'warning', message: '已请求取消当前任务。' })
  }

  function reorderRules(draggedRuleId: string, targetRuleId: string | null) {
    const orderedRules = [...rules]
    const sourceIndex = orderedRules.findIndex((rule) => rule.id === draggedRuleId)
    if (sourceIndex === -1) {
      return rules
    }

    const [draggedRule] = orderedRules.splice(sourceIndex, 1)
    if (!draggedRule) {
      return rules
    }

    if (!targetRuleId) {
      orderedRules.push(draggedRule)
      return normalizeRules(orderedRules)
    }

    const targetIndex = orderedRules.findIndex((rule) => rule.id === targetRuleId)
    if (targetIndex === -1) {
      orderedRules.push(draggedRule)
      return normalizeRules(orderedRules)
    }

    orderedRules.splice(targetIndex, 0, draggedRule)
    return normalizeRules(orderedRules)
  }

  async function handleDropOn(targetRuleId: string | null) {
    if (!draggingRuleId) {
      return
    }

    const nextRules = reorderRules(draggingRuleId, targetRuleId)
    await persistState(nextRules, settings)
    setDraggingRuleId(null)
    setDropTargetId(null)
  }

  const navItems = [
    {
      key: 'home',
      label: '首页',
      icon: Orbit
    },
    {
      key: 'rules',
      label: '规则管理',
      icon: LayoutPanelLeft
    },
    {
      key: 'guide',
      label: '说明',
      icon: ScrollText
    }
  ] as const

  if (isBootstrapping) {
    return (
      <div className="app-shell">
        <div className="mx-auto flex min-h-screen w-full max-w-[1440px] items-center justify-center px-6 py-12">
          <div className="glass-tile rounded-[28px] px-8 py-10 text-center shadow-float">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Uno / 一格</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0f172a]">正在加载工作台…</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="mesh-grid" />
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-6 px-5 py-5 md:px-8 md:py-7">
        <header className="topbar rounded-[26px] px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="brand-mark">
                <span>U</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Uno</p>
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[#0f172a]">一格</h1>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = settings.windowLayout.activeView === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`nav-pill ${active ? 'nav-pill-active' : ''}`}
                    onClick={() =>
                      void applySettings({
                        windowLayout: {
                          ...settings.windowLayout,
                          activeView: item.key
                        }
                      })
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                )
              })}
            </nav>

            <div className="hidden items-center gap-2 text-sm text-fg-muted xl:flex">
              <span>{sourceRoot || '未选择源目录'}</span>
              <ArrowRight className="h-4 w-4" />
              <span>{outputRoot || '未选择输出根目录'}</span>
            </div>
          </div>
        </header>

        <NoticeBanner notice={notice} />

        {settings.windowLayout.activeView === 'home' ? (
          <HomePage
            sourceRoot={sourceRoot}
            outputRoot={outputRoot}
            preview={preview}
            previewTab={settings.windowLayout.activeTab}
            suggestionResult={suggestionResult}
            selectedSuggestions={selectedSuggestions}
            history={history}
            activeTask={activeTask}
            canCancelTask={canCancelTask}
            onPreviewTabChange={(tab) =>
              void applySettings({
                windowLayout: {
                  ...settings.windowLayout,
                  activeTab: tab
                }
              })
            }
            onPickSource={() => void handlePickSource()}
            onPickOutput={() => void handlePickOutput()}
            onRefreshSuggestions={() => void refreshSuggestions()}
            onCreateRulesFromSuggestions={(openRulesPage) => void handleCreateRulesFromSuggestions(openRulesPage)}
            onGeneratePreview={() => void handleGeneratePreview()}
            onExecute={() => void handleExecute()}
            onUndo={(runId) => handleUndo(runId)}
            onCancelTask={() => void handleCancelTask()}
            onOpenRules={() =>
              void applySettings({
                windowLayout: {
                  ...settings.windowLayout,
                  activeView: 'rules'
                }
              })
            }
            onOpenGuide={() =>
              void applySettings({
                windowLayout: {
                  ...settings.windowLayout,
                  activeView: 'guide'
                }
              })
            }
            onToggleSuggestion={handleToggleSuggestion}
          />
        ) : null}

        {settings.windowLayout.activeView === 'rules' ? (
          <RulesPage
            ruleGroups={groupedRules}
            duplicateRuleIds={duplicateRuleIds}
            rulesSearch={settings.windowLayout.rulesSearch}
            ruleFilter={settings.windowLayout.ruleFilter}
            ruleGroup={settings.windowLayout.ruleGroup}
            selectedRuleIds={selectedRuleIds}
            dragEnabled={settings.windowLayout.ruleGroup === 'none'}
            draggingRuleId={draggingRuleId}
            dropTargetId={dropTargetId}
            onRulesSearchChange={(value) =>
              void applySettings({
                windowLayout: {
                  ...settings.windowLayout,
                  rulesSearch: value
                }
              })
            }
            onRuleFilterChange={(value: RuleFilterMode) =>
              void applySettings({
                windowLayout: {
                  ...settings.windowLayout,
                  ruleFilter: value
                }
              })
            }
            onRuleGroupChange={(value: RuleGroupMode) =>
              void applySettings({
                windowLayout: {
                  ...settings.windowLayout,
                  ruleGroup: value
                }
              })
            }
            onCreateRule={openCreateRuleDialog}
            onImportRules={() => void handleImportRules()}
            onExportRules={() => void handleExportRules()}
            onSelectAllVisible={handleSelectAllVisible}
            onClearSelection={() => setSelectedRuleIds(new Set())}
            onBatchEnable={() => void handleBatchEnable()}
            onBatchDisable={() => void handleBatchDisable()}
            onBatchDelete={handleBatchDelete}
            onEditRule={openEditRuleDialog}
            onDeleteRule={(rule) => void handleDeleteRule(rule)}
            onToggleRuleEnabled={(ruleId) => void handleToggleRuleEnabled(ruleId)}
            onToggleRuleSelection={handleToggleRuleSelection}
            onDragStart={(ruleId) => {
              setDraggingRuleId(ruleId)
              setDropTargetId(ruleId)
            }}
            onDragEnter={(ruleId) => {
              if (draggingRuleId) {
                setDropTargetId(ruleId)
              }
            }}
            onDragEnd={() => {
              setDraggingRuleId(null)
              setDropTargetId(null)
            }}
            onDropOn={(targetRuleId) => void handleDropOn(targetRuleId)}
            onGoHome={() =>
              void applySettings({
                windowLayout: {
                  ...settings.windowLayout,
                  activeView: 'home'
                }
              })
            }
          />
        ) : null}

        {settings.windowLayout.activeView === 'guide' ? <GuidePage /> : null}

        <footer className="flex flex-col gap-2 rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-white/70 px-5 py-4 text-sm text-fg-muted backdrop-blur xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-fg-default">一格</span>
            <span>让文件整理像排产一样清晰。</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <span>规则数：{rules.length}</span>
            <span>最近更新：{history[0] ? formatDateTime(history[0].finishedAt) : '暂无'}</span>
          </div>
        </footer>
      </div>

      <RuleEditorDialog
        draft={ruleDraft}
        open={ruleDialogOpen}
        onChange={setRuleDraft}
        onOpenChange={setRuleDialogOpen}
        onSave={() => void handleSaveRule()}
      />
      <ConfirmDialog confirmState={confirmState} onOpenChange={(open) => !open && setConfirmState(null)} />
    </div>
  )
}
