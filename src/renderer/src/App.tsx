import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
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
  BootstrapPayload,
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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{draft.id ? '编辑规则' : '新增规则'}</DialogTitle>
          <DialogDescription>
            每条规则按优先级依次匹配。文件名包含任一关键词时即命中。
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
              <p className="text-sm text-fg-muted">关闭后不会参与预览和执行。</p>
            </div>
            <Switch
              checked={draft.enabled}
              onCheckedChange={(checked) => onChange({ ...draft, enabled: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            variant="default"
            onClick={onSave}
          >
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
            <Button
              variant="outline"
              onClick={onPick}
            >
              <FolderOpen className="h-4 w-4" />
              选择
            </Button>
            <Button
              variant="ghost"
              onClick={onClear}
              disabled={!value}
            >
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
  const previewItems = preview?.items.filter((item) => item.status === activeTab) ?? []
  const movedCount =
    preview && 'moved' in preview.summary ? preview.summary.moved : preview?.summary.matched ?? 0

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
      if (index >= 0) {
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
    setPreview(null)
    setNotice({
      tone: 'success',
      message: ruleDraft.id ? '规则已更新。' : '规则已新增。'
    })
    await persistState({
      ...storedState,
      rules: nextRules
    })
  }

  async function toggleRule(ruleId: string, enabled: boolean) {
    setPreview(null)
    await persistState({
      ...storedState,
      rules: rules.map((rule) => (rule.id === ruleId ? { ...rule, enabled } : rule))
    })
  }

  async function deleteRule(ruleId: string) {
    setPreview(null)
    await persistState({
      ...storedState,
      rules: rules.filter((rule) => rule.id !== ruleId)
    })
  }

  async function moveRule(ruleId: string, direction: -1 | 1) {
    const currentIndex = rules.findIndex((rule) => rule.id === ruleId)
    const nextIndex = currentIndex + direction
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= rules.length) {
      return
    }

    const nextRules = [...rules]
    const [rule] = nextRules.splice(currentIndex, 1)
    if (!rule) {
      return
    }
    nextRules.splice(nextIndex, 0, rule)
    setPreview(null)
    await persistState({
      ...storedState,
      rules: nextRules
    })
  }

  async function setActiveTab(nextTab: PreviewTab) {
    await updateSettings({
      windowLayout: {
        activeTab: nextTab
      }
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

    if (storedState.settings.lastSourceRoot === storedState.settings.lastOutputRoot) {
      setNotice({
        tone: 'warning',
        message: '源目录和输出根目录不能是同一个文件夹。'
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
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="rounded-md border border-border-default bg-canvas-default px-2 py-1 text-sm font-semibold text-fg-muted">
                    NameSort
                  </div>
                  <Badge variant="neutral">GitHub Light</Badge>
                  <Badge variant="accent">Windows</Badge>
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg-default">
                  文件名分类整理
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-fg-muted">
                  用关键词规则预览并整理本地文件，流程固定为配置规则、生成预览、确认执行，未命中文件保留原地。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  onClick={runPreview}
                  disabled={previewing || executing}
                >
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
            </div>
          </div>
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
        </header>

        {notice ? (
          <div className={cn('rounded-md border px-4 py-3 text-sm', getNoticeClasses(notice.tone))}>
            {notice.message}
          </div>
        ) : null}

        <div className="grid gap-5 2xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>规则列表</CardTitle>
                  <CardDescription>顺序越靠前，优先级越高。</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={openCreateRuleDialog}
                >
                  <Plus className="h-4 w-4" />
                  新增
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {rules.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border-default bg-canvas-default px-4 py-6 text-sm text-fg-muted">
                    还没有规则。点击右上角“新增”开始配置分类规则。
                  </div>
                ) : (
                  rules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className="rounded-md border border-border-default bg-canvas-card p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant={rule.enabled ? 'success' : 'neutral'}>{`P${rule.priority}`}</Badge>
                            <p className="truncate text-sm font-semibold text-fg-default">{rule.name}</p>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-fg-muted">
                            {rule.keywords.join(' / ')}
                          </p>
                          <p className="mt-2 text-code text-fg-subtle">{rule.outputFolderName}</p>
                        </div>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => void toggleRule(rule.id, checked)}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void moveRule(rule.id, -1)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void moveRule(rule.id, 1)}
                            disabled={index === rules.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditRuleDialog(rule)}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void deleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>本次流程</CardTitle>
                <CardDescription>保持“先预览再执行”的安全节奏。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-fg-muted">
                <div className="rounded-md border border-border-default bg-canvas-default px-3 py-2">
                  1. 选择源目录与输出根目录
                </div>
                <div className="rounded-md border border-border-default bg-canvas-default px-3 py-2">
                  2. 配置并排序规则
                </div>
                <div className="rounded-md border border-border-default bg-canvas-default px-3 py-2">
                  3. 预览命中、未命中与错误
                </div>
                <div className="rounded-md border border-border-default bg-canvas-default px-3 py-2">
                  4. 确认后执行整理
                </div>
              </CardContent>
            </Card>
          </aside>

          <main className="space-y-5">
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
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => void setActiveTab(value as PreviewTab)}
                >
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
                      <p className="mt-1 text-sm">
                        配置规则后先生成预览，系统会列出命中文件、未命中文件和失败原因。
                      </p>
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
                      <p className="mt-1 text-sm">
                        你可以切换到其他标签查看本次预览的不同结果。
                      </p>
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

            <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
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

              <Card>
                <CardHeader>
                  <CardTitle>规则说明</CardTitle>
                  <CardDescription>这版行为固定，便于稳定使用。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-fg-muted">
                  <div className="rounded-md border border-border-default bg-canvas-default px-3 py-2">
                    规则匹配采用“大小写忽略 + 文件名包含 + 任一关键词命中”。
                  </div>
                  <div className="rounded-md border border-border-default bg-canvas-default px-3 py-2">
                    多条规则同时命中时，按规则列表顺序取第一条。
                  </div>
                  <div className="rounded-md border border-border-default bg-canvas-default px-3 py-2">
                    目标目录有同名文件时，自动重命名为 <span className="font-mono">name (1)</span> 这类格式。
                  </div>
                  <div className="rounded-md border border-border-default bg-canvas-default px-3 py-2">
                    未命中文件不会移动，会在预览和结果中单独列出。
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
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
