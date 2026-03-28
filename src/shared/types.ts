export type PreviewStatus = 'matched' | 'unmatched' | 'error'
export type PreviewAction = 'move' | 'skip'
export type ConflictResolution = 'none' | 'auto-rename'
export type PreviewTab = 'matched' | 'unmatched' | 'error'
export type AppView = 'home' | 'rules' | 'guide'
export type RuleMatchMode = 'any' | 'all'
export type RuleFilterMode = 'all' | 'enabled' | 'disabled' | 'duplicates'
export type RuleGroupMode = 'none' | 'output' | 'status'
export type SuggestionSource = 'token' | 'phrase' | 'substring'
export type TaskKind = 'preview' | 'run' | 'undo' | 'suggest'
export type TaskPhase =
  | 'queued'
  | 'scanning-source'
  | 'scanning-output'
  | 'planning'
  | 'executing'
  | 'undoing'
  | 'completed'
  | 'cancelled'
  | 'failed'
export type TaskState = 'running' | 'completed' | 'cancelled' | 'failed'
export type ExecutionState =
  | 'pending'
  | 'moved'
  | 'copied'
  | 'skipped'
  | 'error'
  | 'undone'
  | 'undo-error'

export interface RuleConfig {
  id: string
  name: string
  keywords: string[]
  excludeKeywords: string[]
  extensions: string[]
  outputFolderName: string
  enabled: boolean
  priority: number
  matchMode: RuleMatchMode
}

export interface AppSettings {
  lastSourceRoot: string
  lastOutputRoot: string
  scanSubdirectories: boolean
  theme: 'uno-dark' | 'github-light'
  locale: 'zh-CN'
  windowLayout: {
    activeView: AppView
    activeTab: PreviewTab
    rulesSearch: string
    ruleFilter: RuleFilterMode
    ruleGroup: RuleGroupMode
  }
}

export interface StoredState {
  settings: AppSettings
  rules: RuleConfig[]
}

export interface PreviewRequest {
  sourceRoot: string
  outputRoot: string
  rules: RuleConfig[]
  recursive?: boolean
  taskId?: string
}

export interface FieldSuggestion {
  value: string
  count: number
  sampleFileName: string
  confidence: number
  source: SuggestionSource
}

export interface FieldSuggestionRequest {
  sourceRoot: string
  outputRoot?: string
  rules?: RuleConfig[]
  maxResults?: number
  recursive?: boolean
  taskId?: string
}

export interface FieldSuggestionResult {
  scannedFileCount: number
  suggestions: FieldSuggestion[]
}

export interface PreviewItem {
  sourcePath: string
  fileName: string
  matchedRuleId?: string
  matchedRuleName?: string
  matchedKeywords?: string[]
  targetPath?: string
  finalTargetFileName?: string
  conflictResolution?: ConflictResolution
  action: PreviewAction
  status: PreviewStatus
  message?: string
  executionState?: ExecutionState
  restoredSourcePath?: string
}

export interface PreviewSummary {
  total: number
  matched: number
  unmatched: number
  errors: number
  renamed: number
}

export interface PreviewResult {
  generatedAt: string
  items: PreviewItem[]
  summary: PreviewSummary
}

export interface RunSummary extends PreviewSummary {
  moved: number
  copied: number
  skipped: number
  undone: number
  undoErrors: number
}

export interface RunLog {
  runId: string
  startedAt: string
  finishedAt: string
  sourceRoot: string
  outputRoot: string
  summary: RunSummary
  items: PreviewItem[]
  isUndoAvailable: boolean
  undoneAt?: string
}

export interface UndoRunRequest {
  runId: string
  taskId?: string
}

export interface BootstrapPayload {
  state: StoredState
  history: RunLog[]
}

export interface PathInspection {
  exists: boolean
  isDirectory: boolean
  path: string
}

export interface TaskProgressEvent {
  taskId: string
  kind: TaskKind
  phase: TaskPhase
  state: TaskState
  message: string
  processed: number
  total?: number
  percent?: number
  currentPath?: string
}

export interface DesktopApi {
  bootstrap: () => Promise<BootstrapPayload>
  pickFolder: () => Promise<string | null>
  inspectPath: (targetPath: string) => Promise<PathInspection>
  saveState: (state: StoredState) => Promise<StoredState>
  importRules: () => Promise<RuleConfig[] | null>
  exportRules: (rules: RuleConfig[]) => Promise<string | null>
  suggestFields: (request: FieldSuggestionRequest) => Promise<FieldSuggestionResult>
  generatePreview: (request: PreviewRequest) => Promise<PreviewResult>
  executeRun: (request: PreviewRequest) => Promise<RunLog>
  undoRun: (request: UndoRunRequest) => Promise<RunLog>
  cancelTask: (taskId: string) => Promise<boolean>
  onTaskProgress: (listener: (event: TaskProgressEvent) => void) => () => void
}
