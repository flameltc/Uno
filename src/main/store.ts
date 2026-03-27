import fs from 'node:fs/promises'
import path from 'node:path'
import { app } from 'electron'

import type { AppSettings, RunLog, StoredState } from '@shared/types'

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
    rules: Array.isArray(candidate.rules)
      ? [...candidate.rules]
          .sort((left, right) => left.priority - right.priority)
          .map((rule, index) => ({
            ...rule,
            priority: index + 1
          }))
      : []
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

export async function appendRunLog(log: RunLog) {
  const { historyPath } = getStoragePaths()
  const currentHistory = await loadHistory()
  const nextHistory = [log, ...currentHistory].slice(0, 20)
  await writeJsonFile(historyPath, nextHistory)
  return nextHistory
}
