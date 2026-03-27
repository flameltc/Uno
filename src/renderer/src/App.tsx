import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  FileWarning,
  FolderOpen,
  PencilLine,
  Play,
  Plus,
  RefreshCcw,
  Trash2,
  XCircle
} from 'lucide-react'

import type {
  AppSettings,
  AppView,
  BootstrapPayload,
  FieldSuggestionResult,
  PreviewItem,
  PreviewResult,
  PreviewTab,
  RuleConfig,
  RunLog,
  StoredState
} from '@shared/types'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Textarea } from '@renderer/components/ui/textarea'
import { cn } from '@renderer/lib/utils'

type DisplayPreview = {
  generatedAt: string
  items: PreviewItem[]
  summary: PreviewResult['summary'] | RunLog['summary']
}

type NoticeTone = 'success' | 'warning' | 'danger' | 'neutral'

interface NoticeState {
  tone: NoticeTone
  message: string
}

interface RuleDraft {
  id?: string
  name: string
  keywordsText: string
  outputFolderName: string
  enabled: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  lastSourceRoot: '',
  lastOutputRoot: '',
  theme: 'github-light',
  locale: 'zh-CN',
  windowLayout: {
    activeView: 'home',
    activeTab: 'matched'
  }
}

const DEFAULT_STATE: StoredState = {
  settings: DEFAULT_SETTINGS,
  rules: []
}

function emptyRuleDraft(): RuleDraft {
  return {
    name: '',
    keywordsText: '',
    outputFolderName: '',
    enabled: true
  }
}

function normalizeRules(rules: RuleConfig[]) {
  return [...rules]
    .sort((left, right) => left.priority - right.priority)
    .map((rule, index) => ({
      ...rule,
      priority: index + 1
    }))
}

function parseKeywords(keywordsText: string) {
  return keywordsText
    .split(/[\n,，]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function normalizeSuggestionValue(value: string) {
  return value.trim().toLocaleLowerCase()
}

function buildRuleValueLookup(rules: RuleConfig[]) {
  const values = new Set<string>()

  for (const rule of rules) {
    for (const candidate of [rule.name, rule.outputFolderName, ...rule.keywords]) {
      const normalizedCandidate = normalizeSuggestionValue(candidate)
      if (normalizedCandidate) {
        values.add(normalizedCandidate)
      }
    }
  }

  return values
}

function formatDateTime(timestamp: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(timestamp))
}

function getNoticeClasses(tone: NoticeTone) {
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

function getItemStatusBadge(item: PreviewItem) {
  if (item.status === 'error') {
    return <Badge variant="danger">错误</Badge>
  }

  if (item.status === 'unmatched') {
    return <Badge variant="warning">未命中</Badge>
  }

  if (item.conflictResolution === 'auto-rename') {
    return <Badge variant="accent">自动改名</Badge>
  }

  return <Badge variant="success">将移动</Badge>
}

function RuleEditorDialog({
  draft,
  onChange,
  onOpenChange,
  onSave,
  open
}: {
  draft: RuleDraft
  onChange: (draft: RuleDraft) => void
  onOpenChange: (open: boolean) => void
  onSave: () => void
  open: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{draft.id ? '编辑规则' : '新增规则'}</DialogTitle>
          <DialogDescription>
            规则按优先级从上到下匹配，文件名包含任一关键词时即命中。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="rule-name">规则名称</Label>
            <Input
              id="rule-name"
              placeholder="例如：合同、发票、简历"
              value={draft.name}
              onChange={(event) => onChange({ ...draft, name: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rule-keywords">关键词</Label>
            <Textarea
              id="rule-keywords"
              placeholder="支持逗号、中文逗号或换行，例如：合同, agreement"
              value={draft.keywordsText}
              onChange={(event) => onChange({ ...draft, keywordsText: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rule-folder">输出子文件夹</Label>
            <Input
              id="rule-folder"
              placeholder="例如：合同"
              value={draft.outputFolderName}
              onChange={(event) => onChange({ ...draft, outputFolderName: event.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border-default bg-canvas-default px-3 py-2">
            <div>
              <p className="text-sm font-medium text-fg-default">启用规则</p>
              <p className="text-sm text-fg-muted">关闭后不会参与预览和整理。</p>
            </div>
            <Switch
              checked={draft.enabled}
              onCheckedChange={(checked) => onChange({ ...draft, enabled: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="default" onClick={onSave}>
            保存规则
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DropPathField({
  description,
  label,
  onClear,
  onDropPath,
  onPick,
  value
}: {
  description: string
  label: string
  onClear: () => void
  onDropPath: (targetPath: string) => void
  onPick: () => void
  value: string
}) {
  const [dragActive, setDragActive] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <p className="text-xs text-fg-muted">{description}</p>
      </div>
      <div
        className={cn(
          'rounded-md border border-dashed border-border-default bg-canvas-card p-2 transition-colors',
          dragActive && 'border-accent bg-accent-muted'
        )}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          if (event.currentTarget === event.target) {
            setDragActive(false)
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          const droppedItem = Array.from(event.dataTransfer.files).find(Boolean) as File & { path?: string }
          if (droppedItem?.path) {
            onDropPath(droppedItem.path)
          }
        }}
      >
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            readOnly
            value={value}
            placeholder="拖拽文件夹到这里，或点击右侧选择"
            className="flex-1 bg-canvas-card text-code"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={onPick}>
              <FolderOpen className="h-4 w-4" />
              选择
            </Button>
            <Button variant="ghost" onClick={onClear} disabled={!value}>
              清空
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [storedState, setStoredState] = useState<StoredState>(DEFAULT_STATE)
  const [history, setHistory] = useState<RunLog[]>([])
  const [preview, setPreview] = useState<DisplayPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewing, setPreviewing] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [ruleDraft, setRuleDraft] = useState<RuleDraft>(emptyRuleDraft())
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const [fieldSuggestions, setFieldSuggestions] = useState<FieldSuggestionResult | null>(null)
  const [suggestingFields, setSuggestingFields] = useState(false)
  const [selectedSuggestionValues, setSelectedSuggestionValues] = useState<string[]>([])
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([])
  const [draggedRuleId, setDraggedRuleId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const payload = (await window.api.bootstrap()) as BootstrapPayload
        if (!active) {
          return
        }

        setStoredState(payload.state)
        setHistory(payload.history)
      } catch (error) {
        if (active) {
          setNotice({
            tone: 'danger',
            message: error instanceof Error ? error.message : '初始化应用状态失败。'
          })
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const rules = normalizeRules(storedState.rules)
  const activeTab = storedState.settings.windowLayout.activeTab
  const activeView = storedState.settings.windowLayout.activeView
  const previewItems = preview?.items.filter((item) => item.status === activeTab) ?? []
  const movedCount =
    preview && 'moved' in preview.summary ? preview.summary.moved : preview?.summary.matched ?? 0
  const suggestionItems = fieldSuggestions?.suggestions ?? []
  const existingRuleValues = buildRuleValueLookup(rules)
  const selectableSuggestionValues = suggestionItems
    .map((suggestion) => normalizeSuggestionValue(suggestion.value))
    .filter((value) => value && !existingRuleValues.has(value))
  const selectedCreatableCount = selectedSuggestionValues.filter((value) => !existingRuleValues.has(value)).length
  const selectedRuleCount = selectedRuleIds.length

  async function persistState(nextState: StoredState) {
    const normalizedState = {
      ...nextState,
      rules: normalizeRules(nextState.rules)
    }
    setStoredState(normalizedState)
    await window.api.saveState(normalizedState)
  }

  async function updateSettings(patch: Partial<AppSettings>) {
    await persistState({
      ...storedState,
      settings: {
        ...storedState.settings,
        ...patch,
        windowLayout: {
          ...storedState.settings.windowLayout,
          ...patch.windowLayout
        }
      }
    })
  }

  async function replaceRules(nextRules: RuleConfig[], nextNotice?: NoticeState) {
    setPreview(null)
    if (nextNotice) {
      setNotice(nextNotice)
    }

    await persistState({
      ...storedState,
      rules: nextRules
    })
  }

  useEffect(() => {
    const sourceRoot = storedState.settings.lastSourceRoot
    if (!sourceRoot) {
      setFieldSuggestions(null)
      setSelectedSuggestionValues([])
      setSuggestingFields(false)
      return
    }

    let active = true

    const loadFieldSuggestions = async () => {
      setSuggestingFields(true)

      try {
        const result = await window.api.suggestFields({
          sourceRoot,
          outputRoot: storedState.settings.lastOutputRoot || undefined,
          rules: storedState.rules,
          maxResults: 12
        })

        if (!active) {
          return
        }

        setFieldSuggestions(result)
      } catch (error) {
        if (!active) {
          return
        }

        setFieldSuggestions(null)
        setSelectedSuggestionValues([])
        setNotice({
          tone: 'danger',
          message: error instanceof Error ? error.message : '统计高频字段失败。'
        })
      } finally {
        if (active) {
          setSuggestingFields(false)
        }
      }
    }

    void loadFieldSuggestions()

    return () => {
      active = false
    }
  }, [
    storedState.rules,
    storedState.settings.lastOutputRoot,
    storedState.settings.lastSourceRoot
  ])

  useEffect(() => {
    const availableValues = new Set(
      suggestionItems
        .map((suggestion) => normalizeSuggestionValue(suggestion.value))
        .filter((value) => value && !existingRuleValues.has(value))
    )

    setSelectedSuggestionValues((current) => current.filter((value) => availableValues.has(value)))
  }, [suggestionItems, storedState.rules])

  useEffect(() => {
    const knownRuleIds = new Set(rules.map((rule) => rule.id))
    setSelectedRuleIds((current) => current.filter((ruleId) => knownRuleIds.has(ruleId)))
  }, [storedState.rules])

  async function setActiveView(nextView: AppView) {
    await updateSettings({
      windowLayout: {
        activeView: nextView,
        activeTab
      }
    })
  }

  async function setActiveTab(nextTab: PreviewTab) {
    await updateSettings({
      windowLayout: {
        activeView,
        activeTab: nextTab
      }
    })
  }

  async function handlePickFolder(kind: 'source' | 'output') {
    const selectedPath = await window.api.pickFolder()
    if (!selectedPath) {
      return
    }

    setPreview(null)
    if (kind === 'source') {
      await updateSettings({ lastSourceRoot: selectedPath })
      return
    }

    await updateSettings({ lastOutputRoot: selectedPath })
  }

  async function handleDroppedPath(kind: 'source' | 'output', targetPath: string) {
    const inspection = await window.api.inspectPath(targetPath)
    if (!inspection.exists || !inspection.isDirectory) {
      setNotice({
        tone: 'warning',
        message: '拖入的对象不是有效目录，请重新选择文件夹。'
      })
      return
    }

    setPreview(null)
    if (kind === 'source') {
      await updateSettings({ lastSourceRoot: inspection.path })
      return
    }

    await updateSettings({ lastOutputRoot: inspection.path })
  }

  function openCreateRuleDialog() {
    setRuleDraft(emptyRuleDraft())
    setDialogOpen(true)
  }

  function openEditRuleDialog(rule: RuleConfig) {
    setRuleDraft({
      id: rule.id,
      name: rule.name,
      keywordsText: rule.keywords.join(', '),
      outputFolderName: rule.outputFolderName,
      enabled: rule.enabled
    })
    setDialogOpen(true)
  }

  async function handleSaveRule() {
    const keywords = parseKeywords(ruleDraft.keywordsText)
    if (!ruleDraft.name.trim() || !ruleDraft.outputFolderName.trim() || keywords.length === 0) {
      setNotice({
        tone: 'warning',
        message: '规则名称、关键词和输出子文件夹不能为空。'
      })
      return
    }

    const nextRules = [...rules]
    if (ruleDraft.id) {
      const index = nextRules.findIndex((rule) => rule.id === ruleDraft.id)
      if (index < 0) {
        return
      }

      const currentRule = nextRules[index]
      if (!currentRule) {
        return
      }

      nextRules[index] = {
        ...currentRule,
        name: ruleDraft.name.trim(),
        keywords,
        outputFolderName: ruleDraft.outputFolderName.trim(),
        enabled: ruleDraft.enabled
      }
    } else {
      nextRules.push({
        id: crypto.randomUUID(),
        name: ruleDraft.name.trim(),
        keywords,
        outputFolderName: ruleDraft.outputFolderName.trim(),
        enabled: ruleDraft.enabled,
        priority: nextRules.length + 1
      })
    }

    setDialogOpen(false)
    await replaceRules(nextRules, {
      tone: 'success',
      message: ruleDraft.id ? '规则已更新。' : '规则已新增。'
    })
  }

  async function toggleRule(ruleId: string, enabled: boolean) {
    await replaceRules(
      rules.map((rule) => (rule.id === ruleId ? { ...rule, enabled } : rule))
    )
  }

  async function deleteRule(ruleId: string) {
    await replaceRules(
      rules.filter((rule) => rule.id !== ruleId),
      {
        tone: 'success',
        message: '规则已删除。'
      }
    )
  }

  function toggleRuleSelection(ruleId: string, checked: boolean) {
    setSelectedRuleIds((current) => {
      if (checked) {
        return current.includes(ruleId) ? current : [...current, ruleId]
      }

      return current.filter((id) => id !== ruleId)
    })
  }

  function selectAllRules() {
    setSelectedRuleIds(rules.map((rule) => rule.id))
  }

  function clearRuleSelection() {
    setSelectedRuleIds([])
  }

  async function setSelectedRulesEnabled(enabled: boolean) {
    if (selectedRuleIds.length === 0) {
      return
    }

    await replaceRules(
      rules.map((rule) => (selectedRuleIds.includes(rule.id) ? { ...rule, enabled } : rule)),
      {
        tone: 'success',
        message: enabled ? '已启用选中规则。' : '已停用选中规则。'
      }
    )
  }

  async function deleteSelectedRules() {
    if (selectedRuleIds.length === 0) {
      return
    }

    await replaceRules(
      rules.filter((rule) => !selectedRuleIds.includes(rule.id)),
      {
        tone: 'success',
        message: `已删除 ${selectedRuleIds.length} 条规则。`
      }
    )
    setSelectedRuleIds([])
  }

  async function reorderRules(dragRuleId: string, targetRuleId: string) {
    if (!dragRuleId || dragRuleId === targetRuleId) {
      return
    }

    const fromIndex = rules.findIndex((rule) => rule.id === dragRuleId)
    const targetIndex = rules.findIndex((rule) => rule.id === targetRuleId)
    if (fromIndex < 0 || targetIndex < 0) {
      return
    }

    const nextRules = [...rules]
    const [draggedRule] = nextRules.splice(fromIndex, 1)
    if (!draggedRule) {
      return
    }

    const insertIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex
    nextRules.splice(insertIndex, 0, draggedRule)
    await replaceRules(nextRules, {
      tone: 'success',
      message: '规则顺序已更新。'
    })
  }

  async function moveRuleToEnd(ruleId: string) {
    const fromIndex = rules.findIndex((rule) => rule.id === ruleId)
    if (fromIndex < 0 || fromIndex === rules.length - 1) {
      return
    }

    const nextRules = [...rules]
    const [draggedRule] = nextRules.splice(fromIndex, 1)
    if (!draggedRule) {
      return
    }

    nextRules.push(draggedRule)
    await replaceRules(nextRules, {
      tone: 'success',
      message: '规则顺序已更新。'
    })
  }

  function toggleSuggestionSelection(value: string, checked: boolean) {
    const normalizedValue = normalizeSuggestionValue(value)
    if (!normalizedValue) {
      return
    }

    setSelectedSuggestionValues((current) => {
      if (checked) {
        return current.includes(normalizedValue) ? current : [...current, normalizedValue]
      }

      return current.filter((entry) => entry !== normalizedValue)
    })
  }

  async function addRulesFromSuggestions(values: string[]) {
    const nextRules = [...rules]
    const knownValues = buildRuleValueLookup(nextRules)
    const createdValues: string[] = []
    const skippedValues: string[] = []

    for (const rawValue of values) {
      const trimmedValue = rawValue.trim()
      const normalizedValue = normalizeSuggestionValue(trimmedValue)

      if (!normalizedValue || knownValues.has(normalizedValue)) {
        if (trimmedValue) {
          skippedValues.push(trimmedValue)
        }
        continue
      }

      nextRules.push({
        id: crypto.randomUUID(),
        name: trimmedValue,
        keywords: [trimmedValue],
        outputFolderName: trimmedValue,
        enabled: true,
        priority: nextRules.length + 1
      })
      knownValues.add(normalizedValue)
      createdValues.push(trimmedValue)
    }

    if (createdValues.length === 0) {
      setNotice({
        tone: 'warning',
        message: '所选字段已经存在于当前规则中。'
      })
      return
    }

    setSelectedSuggestionValues((current) =>
      current.filter((value) => !createdValues.some((createdValue) => normalizeSuggestionValue(createdValue) === value))
    )
    await replaceRules(nextRules, {
      tone: skippedValues.length > 0 ? 'warning' : 'success',
      message:
        skippedValues.length > 0
          ? `已根据 ${createdValues.length} 个字段生成规则，${skippedValues.length} 个重复字段已跳过。`
          : `已根据 ${createdValues.length} 个字段生成规则。`
    })
  }

  function validateRunInputs() {
    if (!storedState.settings.lastSourceRoot || !storedState.settings.lastOutputRoot) {
      setNotice({
        tone: 'warning',
        message: '请先选择源目录和输出根目录。'
      })
      return false
    }

    if (rules.length === 0) {
      setNotice({
        tone: 'warning',
        message: '请至少添加一条规则后再预览整理。'
      })
      return false
    }

    return true
  }

  async function runPreview() {
    if (!validateRunInputs()) {
      return
    }

    setPreviewing(true)
    try {
      const result = await window.api.generatePreview({
        sourceRoot: storedState.settings.lastSourceRoot,
        outputRoot: storedState.settings.lastOutputRoot,
        rules
      })

      setPreview(result)
      const nextTab =
        result.summary.matched > 0
          ? 'matched'
          : result.summary.unmatched > 0
            ? 'unmatched'
            : 'error'

      await setActiveTab(nextTab)
      setNotice({
        tone: result.summary.matched > 0 ? 'success' : 'warning',
        message:
          result.summary.matched > 0
            ? `预览完成，共有 ${result.summary.matched} 个文件将被整理。`
            : '预览完成，但当前没有命中任何规则的文件。'
      })
    } catch (error) {
      setNotice({
        tone: 'danger',
        message: error instanceof Error ? error.message : '预览整理失败。'
      })
    } finally {
      setPreviewing(false)
    }
  }

  async function executeRun() {
    if (!preview) {
      setNotice({
        tone: 'warning',
        message: '请先完成一次预览，再执行整理。'
      })
      return
    }

    setExecuting(true)
    try {
      const runLog = await window.api.executeRun({
        sourceRoot: storedState.settings.lastSourceRoot,
        outputRoot: storedState.settings.lastOutputRoot,
        rules
      })

      setHistory((current) => [runLog, ...current].slice(0, 20))
      setPreview({
        generatedAt: runLog.finishedAt,
        items: runLog.items,
        summary: runLog.summary
      })
      const nextTab = runLog.summary.errors > 0 ? 'error' : runLog.summary.moved > 0 ? 'matched' : 'unmatched'
      await setActiveTab(nextTab)
      setNotice({
        tone: runLog.summary.errors > 0 ? 'warning' : 'success',
        message:
          runLog.summary.errors > 0
            ? `整理完成，但有 ${runLog.summary.errors} 个文件失败。`
            : `整理完成，已成功处理 ${runLog.summary.moved} 个文件。`
      })
    } catch (error) {
      setNotice({
        tone: 'danger',
        message: error instanceof Error ? error.message : '执行整理失败。'
      })
    } finally {
      setExecuting(false)
    }
  }

  function renderFieldSuggestionsCard() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>字段建议</CardTitle>
          <CardDescription>
            {storedState.settings.lastSourceRoot
              ? fieldSuggestions
                ? `基于 ${fieldSuggestions.scannedFileCount} 个文件统计高频字段，可直接生成规则。`
                : '选择源目录后自动统计文件名里出现次数较多的字段。'
              : '先选择源目录，再根据高频字段快速生成规则。'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSuggestionValues([...new Set(selectableSuggestionValues)])}
              disabled={suggestingFields || selectableSuggestionValues.length === 0}
            >
              全选可用
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() =>
                void addRulesFromSuggestions(
                  suggestionItems
                    .filter((suggestion) =>
                      selectedSuggestionValues.includes(normalizeSuggestionValue(suggestion.value))
                    )
                    .map((suggestion) => suggestion.value)
                )
              }
              disabled={suggestingFields || selectedCreatableCount === 0}
            >
              生成选中规则
            </Button>
          </div>

          {!storedState.settings.lastSourceRoot ? (
            <div className="rounded-md border border-dashed border-border-default bg-canvas-default px-4 py-6 text-sm text-fg-muted">
              选择源目录后，系统会按文件名分隔字段做频次统计，并过滤纯数字这类噪声字段。
            </div>
          ) : suggestingFields ? (
            <div className="rounded-md border border-border-default bg-canvas-default px-4 py-6 text-sm text-fg-muted">
              正在统计高频字段...
            </div>
          ) : suggestionItems.length === 0 ? (
            <div className="rounded-md border border-dashed border-border-default bg-canvas-default px-4 py-6 text-sm text-fg-muted">
              当前没有统计出重复字段。可以换一个源目录，或先检查文件名里是否有统一的分隔字段。
            </div>
          ) : (
            suggestionItems.map((suggestion) => {
              const normalizedValue = normalizeSuggestionValue(suggestion.value)
              const exists = existingRuleValues.has(normalizedValue)

              return (
                <div key={suggestion.value} className="rounded-md border border-border-default bg-canvas-card p-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-border-default text-accent accent-[#0969da]"
                      checked={selectedSuggestionValues.includes(normalizedValue)}
                      disabled={exists}
                      onChange={(event) => toggleSuggestionSelection(suggestion.value, event.target.checked)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-fg-default">{suggestion.value}</p>
                        <Badge variant="neutral">{suggestion.count} 次</Badge>
                        {exists ? <Badge variant="success">已存在</Badge> : null}
                      </div>
                      <p className="mt-2 text-xs leading-5 text-fg-muted">
                        示例文件：<span className="text-code">{suggestion.sampleFileName}</span>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={exists}
                      onClick={() => void addRulesFromSuggestions([suggestion.value])}
                    >
                      生成规则
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    )
  }

  function renderPreviewCard() {
    return (
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>预览结果</CardTitle>
            <CardDescription>
              {preview
                ? `最近生成时间：${formatDateTime(preview.generatedAt)}`
                : '还没有预览结果。点击上方“预览整理”开始。'}
            </CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={(value) => void setActiveTab(value as PreviewTab)}>
            <TabsList>
              <TabsTrigger value="matched">将移动 {preview?.summary.matched ?? 0}</TabsTrigger>
              <TabsTrigger value="unmatched">未命中 {preview?.summary.unmatched ?? 0}</TabsTrigger>
              <TabsTrigger value="error">错误 {preview?.summary.errors ?? 0}</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {!preview ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-fg-muted">
              <FileWarning className="h-10 w-10 text-fg-subtle" />
              <div>
                <p className="text-base font-medium text-fg-default">还没有预览结果</p>
                <p className="mt-1 text-sm">先生成预览，系统会列出命中文件、未命中文件和失败原因。</p>
              </div>
            </div>
          ) : previewItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-fg-muted">
              {activeTab === 'matched' ? (
                <CheckCircle2 className="h-10 w-10 text-success" />
              ) : activeTab === 'unmatched' ? (
                <FileWarning className="h-10 w-10 text-warning" />
              ) : (
                <XCircle className="h-10 w-10 text-danger" />
              )}
              <div>
                <p className="text-base font-medium text-fg-default">当前标签下没有记录</p>
                <p className="mt-1 text-sm">可以切换到其他标签查看本次预览的不同结果。</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-t border-border-muted text-left text-sm">
                <thead className="bg-canvas-default text-fg-muted">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">文件名</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">来源路径</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">命中规则</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">目标目录</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">最终文件名</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {previewItems.map((item) => (
                    <tr
                      key={`${item.sourcePath}-${item.targetPath ?? item.status}`}
                      className="border-t border-border-muted align-top hover:bg-canvas-default"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-fg-default">{item.fileName}</p>
                        {item.message ? (
                          <p className="mt-1 max-w-xs text-xs leading-5 text-fg-muted">{item.message}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-code text-fg-muted">{item.sourcePath}</td>
                      <td className="px-4 py-3 text-fg-default">{item.matchedRuleName ?? '未命中'}</td>
                      <td className="px-4 py-3 text-code text-fg-muted">
                        {item.targetPath ? item.targetPath.replace(item.finalTargetFileName ?? '', '') : '保持原地'}
                      </td>
                      <td className="px-4 py-3 text-code text-fg-default">{item.finalTargetFileName ?? '-'}</td>
                      <td className="px-4 py-3">{getItemStatusBadge(item)}</td>
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

  function renderHistoryCard() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近任务日志</CardTitle>
          <CardDescription>记录最近 20 次整理结果，便于回查失败原因。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length === 0 ? (
            <div className="rounded-md border border-dashed border-border-default bg-canvas-default px-4 py-6 text-sm text-fg-muted">
              还没有执行记录。完成一次整理后，日志会显示在这里。
            </div>
          ) : (
            history.slice(0, 6).map((entry) => (
              <div
                key={entry.runId}
                className="rounded-md border border-border-default bg-canvas-default px-4 py-3"
              >
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-fg-default">{formatDateTime(entry.finishedAt)}</p>
                    <p className="mt-1 text-code text-fg-subtle">{entry.sourceRoot}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success">已移动 {entry.summary.moved}</Badge>
                    <Badge variant="warning">未命中 {entry.summary.unmatched}</Badge>
                    <Badge variant={entry.summary.errors > 0 ? 'danger' : 'neutral'}>
                      错误 {entry.summary.errors}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    )
  }

  function renderHomePage() {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-fg-muted">扫描总数</p>
              <p className="mt-2 text-3xl font-semibold text-fg-default">{preview?.summary.total ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-fg-muted">将移动 / 已移动</p>
              <p className="mt-2 text-3xl font-semibold text-success">{movedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-fg-muted">未命中</p>
              <p className="mt-2 text-3xl font-semibold text-warning">{preview?.summary.unmatched ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-fg-muted">错误 / 跳过</p>
              <p className="mt-2 text-3xl font-semibold text-danger">{preview?.summary.errors ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">{renderPreviewCard()}</div>
          <div className="space-y-5">
            {renderFieldSuggestionsCard()}
            {renderHistoryCard()}
          </div>
        </div>
      </div>
    )
  }

  function renderRulesPage() {
    return (
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>规则管理</CardTitle>
            <CardDescription>拖动卡片即可改变优先级。已选择 {selectedRuleCount} 条规则。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="default" onClick={openCreateRuleDialog}>
              <Plus className="h-4 w-4" />
              新增规则
            </Button>
            <Button variant="outline" onClick={selectAllRules} disabled={rules.length === 0}>
              全选
            </Button>
            <Button variant="outline" onClick={clearRuleSelection} disabled={selectedRuleCount === 0}>
              清空选择
            </Button>
            <Button variant="outline" onClick={() => void setSelectedRulesEnabled(true)} disabled={selectedRuleCount === 0}>
              批量启用
            </Button>
            <Button variant="outline" onClick={() => void setSelectedRulesEnabled(false)} disabled={selectedRuleCount === 0}>
              批量停用
            </Button>
            <Button variant="danger" onClick={() => void deleteSelectedRules()} disabled={selectedRuleCount === 0}>
              批量删除
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>规则列表</CardTitle>
            <CardDescription>优先级越靠前，命中时越先被采用。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rules.length === 0 ? (
              <div className="rounded-md border border-dashed border-border-default bg-canvas-default px-4 py-8 text-sm text-fg-muted">
                还没有规则。点击上方“新增规则”开始配置。
              </div>
            ) : (
              <>
                {rules.map((rule) => {
                  const selected = selectedRuleIds.includes(rule.id)

                  return (
                    <div
                      key={rule.id}
                      draggable
                      onDragStart={(event) => {
                        setDraggedRuleId(rule.id)
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', rule.id)
                      }}
                      onDragEnd={() => setDraggedRuleId(null)}
                      onDragOver={(event) => {
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'move'
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        if (draggedRuleId) {
                          void reorderRules(draggedRuleId, rule.id)
                        }
                        setDraggedRuleId(null)
                      }}
                      className={cn(
                        'rounded-md border border-border-default bg-canvas-card p-4 transition-colors',
                        selected && 'border-accent bg-accent-muted/40',
                        draggedRuleId === rule.id && 'opacity-60'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-border-default accent-[#0969da]"
                          checked={selected}
                          onChange={(event) => toggleRuleSelection(rule.id, event.target.checked)}
                        />
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md border border-border-default bg-canvas-default text-xs text-fg-muted">
                          ::
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={rule.enabled ? 'success' : 'neutral'}>{`P${rule.priority}`}</Badge>
                            <p className="text-sm font-semibold text-fg-default">{rule.name}</p>
                          </div>
                          <p className="mt-2 text-sm text-fg-muted">{rule.keywords.join(' / ')}</p>
                          <p className="mt-2 text-code text-fg-subtle">{rule.outputFolderName}</p>
                          <p className="mt-3 text-xs text-fg-muted">拖动卡片可调整顺序。</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) => void toggleRule(rule.id, checked)}
                          />
                          <Button variant="ghost" size="sm" onClick={() => openEditRuleDialog(rule)}>
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => void deleteRule(rule.id)}>
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div
                  className="rounded-md border border-dashed border-border-default bg-canvas-default px-4 py-3 text-center text-sm text-fg-muted"
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    if (draggedRuleId) {
                      void moveRuleToEnd(draggedRuleId)
                    }
                    setDraggedRuleId(null)
                  }}
                >
                  将卡片拖到这里可放到列表末尾
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  function renderGuidePage() {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>流程说明</CardTitle>
            <CardDescription>首页只保留主要操作，规则和说明已拆分独立页面。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-fg-muted">
            <div className="rounded-md border border-border-default bg-canvas-default px-3 py-3">
              1. 在首页选择源目录和输出根目录。
            </div>
            <div className="rounded-md border border-border-default bg-canvas-default px-3 py-3">
              2. 先用“字段建议”快速生成基础规则，或去“规则管理”页面继续细调。
            </div>
            <div className="rounded-md border border-border-default bg-canvas-default px-3 py-3">
              3. 回到首页生成预览，确认命中、未命中和错误项。
            </div>
            <div className="rounded-md border border-border-default bg-canvas-default px-3 py-3">
              4. 确认无误后再执行整理，结果会写入最近任务日志。
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>规则说明</CardTitle>
            <CardDescription>当前版本的行为固定，便于稳定使用。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-fg-muted">
            <div className="rounded-md border border-border-default bg-canvas-default px-3 py-3">
              规则匹配采用“大小写忽略 + 文件名包含 + 任一关键词命中”。
            </div>
            <div className="rounded-md border border-border-default bg-canvas-default px-3 py-3">
              多条规则同时命中时，按规则列表顺序取第一条，因此拖动排序会直接影响结果。
            </div>
            <div className="rounded-md border border-border-default bg-canvas-default px-3 py-3">
              目标目录已有同名文件时，会自动改名为 <span className="font-mono">name (1)</span> 这类格式。
            </div>
            <div className="rounded-md border border-border-default bg-canvas-default px-3 py-3">
              未命中文件不会移动，会在预览和最终结果里单独列出。
            </div>
            <div className="rounded-md border border-border-default bg-canvas-default px-3 py-3">
              当源目录和输出根目录相同时，程序会自动跳过已作为输出使用的子文件夹，避免重复整理。
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pageMeta: Record<AppView, { title: string; description: string }> = {
    home: {
      title: '文件名分类整理',
      description: '首页保留主要功能：选目录、查看字段建议、预览整理和执行整理。'
    },
    rules: {
      title: '规则管理',
      description: '规则列表已独立成页，支持拖动排序、全选和批量操作。'
    },
    guide: {
      title: '说明',
      description: '流程说明和规则说明已独立成页，避免首页堆叠过多信息。'
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-canvas-default">
        <div className="surface-panel flex items-center gap-3 px-6 py-4 text-sm text-fg-muted">
          <RefreshCcw className="h-4 w-4 animate-spin" />
          正在加载应用状态...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-canvas-default px-5 py-5 text-fg-default">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-5">
        <header className="surface-panel overflow-hidden">
          <div className="border-b border-border-muted px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-md border border-border-default bg-canvas-default px-2 py-1 text-sm font-semibold text-fg-muted">
                    NameSort
                  </div>
                  <Badge variant="neutral">GitHub Light</Badge>
                  <Badge variant="accent">Windows</Badge>
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg-default">
                  {pageMeta[activeView].title}
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-fg-muted">
                  {pageMeta[activeView].description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeView === 'home' ? 'secondary' : 'ghost'}
                  onClick={() => void setActiveView('home')}
                >
                  首页
                </Button>
                <Button
                  variant={activeView === 'rules' ? 'secondary' : 'ghost'}
                  onClick={() => void setActiveView('rules')}
                >
                  规则管理
                </Button>
                <Button
                  variant={activeView === 'guide' ? 'secondary' : 'ghost'}
                  onClick={() => void setActiveView('guide')}
                >
                  说明
                </Button>
              </div>
            </div>
          </div>

          {activeView === 'home' ? (
            <>
              <div className="grid gap-4 px-5 py-4 lg:grid-cols-2">
                <DropPathField
                  label="源目录"
                  description="递归扫描全部子目录"
                  value={storedState.settings.lastSourceRoot}
                  onPick={() => void handlePickFolder('source')}
                  onClear={() => {
                    setPreview(null)
                    void updateSettings({ lastSourceRoot: '' })
                  }}
                  onDropPath={(targetPath) => void handleDroppedPath('source', targetPath)}
                />
                <DropPathField
                  label="输出根目录"
                  description="自动创建分类子文件夹"
                  value={storedState.settings.lastOutputRoot}
                  onPick={() => void handlePickFolder('output')}
                  onClear={() => {
                    setPreview(null)
                    void updateSettings({ lastOutputRoot: '' })
                  }}
                  onDropPath={(targetPath) => void handleDroppedPath('output', targetPath)}
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-border-muted px-5 py-4">
                <Button variant="default" onClick={runPreview} disabled={previewing || executing}>
                  <RefreshCcw className={cn('h-4 w-4', previewing && 'animate-spin')} />
                  预览整理
                </Button>
                <Button
                  variant="secondary"
                  onClick={executeRun}
                  disabled={!preview || previewing || executing}
                >
                  <Play className="h-4 w-4" />
                  开始整理
                </Button>
              </div>
            </>
          ) : null}
        </header>

        {notice ? (
          <div className={cn('rounded-md border px-4 py-3 text-sm', getNoticeClasses(notice.tone))}>
            {notice.message}
          </div>
        ) : null}

        {activeView === 'home' ? renderHomePage() : null}
        {activeView === 'rules' ? renderRulesPage() : null}
        {activeView === 'guide' ? renderGuidePage() : null}
      </div>

      <RuleEditorDialog
        open={dialogOpen}
        draft={ruleDraft}
        onChange={setRuleDraft}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setRuleDraft(emptyRuleDraft())
          }
        }}
        onSave={() => void handleSaveRule()}
      />
    </div>
  )
}
