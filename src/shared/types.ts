export type PreviewStatus = 'matched' | 'unmatched' | 'error'
export type PreviewAction = 'move' | 'skip'
export type ConflictResolution = 'none' | 'auto-rename'
export type PreviewTab = 'matched' | 'unmatched' | 'error'
export type AppView = 'home' | 'rules' | 'guide'

export interface RuleConfig {
  id: string
  name: string
  keywords: string[]
  outputFolderName: string
  enabled: boolean
  priority: number
}

export interface AppSettings {
  lastSourceRoot: string
  lastOutputRoot: string
  theme: 'github-light'
  locale: 'zh-CN'
  windowLayout: {
    activeView: AppView
    activeTab: PreviewTab
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
}

export interface FieldSuggestion {
  value: string
  count: number
  sampleFileName: string
}

export interface FieldSuggestionRequest {
  sourceRoot: string
  outputRoot?: string
  rules?: RuleConfig[]
  maxResults?: number
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
  targetPath?: string
  finalTargetFileName?: string
  conflictResolution?: ConflictResolution
  action: PreviewAction
  status: PreviewStatus
  message?: string
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
  skipped: number
}

export interface RunLog {
  runId: string
  startedAt: string
  finishedAt: string
  sourceRoot: string
  outputRoot: string
  summary: RunSummary
  items: PreviewItem[]
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

export interface DesktopApi {
  bootstrap: () => Promise<BootstrapPayload>
  pickFolder: () => Promise<string | null>
  inspectPath: (targetPath: string) => Promise<PathInspection>
  saveState: (state: StoredState) => Promise<StoredState>
  suggestFields: (request: FieldSuggestionRequest) => Promise<FieldSuggestionResult>
  generatePreview: (request: PreviewRequest) => Promise<PreviewResult>
  executeRun: (request: PreviewRequest) => Promise<RunLog>
}
