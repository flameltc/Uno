import fs from 'node:fs/promises'
import path from 'node:path'
import { app } from 'electron'

import type { AppSettings, RunLog, StoredState } from '@shared/types'
import { normalizeRules } from '@shared/rules'

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

function getStoragePaths() {
  const userDataPath = app.getPath('userData')
  return {
    userDataPath,
    statePath: path.join(userDataPath, 'state.json'),
    historyPath: path.join(userDataPath, 'history.json')
  }
}

async function ensureUserDataDir() {
  const { userDataPath } = getStoragePaths()
  await fs.mkdir(userDataPath, { recursive: true })
}

async function readJsonFile<T>(filePath: string, fallbackValue: T) {
  try {
    const rawValue = await fs.readFile(filePath, 'utf8')
    return JSON.parse(rawValue) as T
  } catch {
    return fallbackValue
  }
}

async function writeJsonFile(filePath: string, payload: unknown) {
  await ensureUserDataDir()
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8')
}

function normalizeState(candidate: Partial<StoredState> | null | undefined): StoredState {
  if (!candidate) {
    return DEFAULT_STATE
  }

  return {
    settings: {
      ...DEFAULT_SETTINGS,
      ...candidate.settings,
      windowLayout: {
        ...DEFAULT_SETTINGS.windowLayout,
        ...candidate.settings?.windowLayout
      }
    },
    rules: normalizeRules(Array.isArray(candidate.rules) ? candidate.rules : [])
  }
}

export async function loadStoredState() {
  const { statePath } = getStoragePaths()
  const state = await readJsonFile<StoredState | null>(statePath, null)
  return normalizeState(state)
}

export async function saveStoredState(state: StoredState) {
  const normalizedState = normalizeState(state)
  const { statePath } = getStoragePaths()
  await writeJsonFile(statePath, normalizedState)
  return normalizedState
}

export async function loadHistory() {
  const { historyPath } = getStoragePaths()
  const history = await readJsonFile<RunLog[]>(historyPath, [])
  return Array.isArray(history) ? history : []
}

export async function saveHistory(history: RunLog[]) {
  const { historyPath } = getStoragePaths()
  await writeJsonFile(historyPath, history.slice(0, 30))
  return history.slice(0, 30)
}

export async function appendRunLog(log: RunLog) {
  const currentHistory = await loadHistory()
  return saveHistory([log, ...currentHistory])
}

export async function replaceRunLog(updatedLog: RunLog) {
  const currentHistory = await loadHistory()
  const nextHistory = currentHistory.map((entry) => (entry.runId === updatedLog.runId ? updatedLog : entry))
  return saveHistory(nextHistory)
}

export async function findRunLog(runId: string) {
  const history = await loadHistory()
  return history.find((entry) => entry.runId === runId) ?? null
}
