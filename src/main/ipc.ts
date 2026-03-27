import fs from 'node:fs/promises'
import { dialog, ipcMain } from 'electron'

import type { FieldSuggestionRequest, PreviewRequest, StoredState } from '@shared/types'
import { appendRunLog, loadHistory, loadStoredState, saveStoredState } from './store'
import {
  executePreviewRequest,
  generatePreviewFromDisk,
  suggestFrequentFieldsFromDisk
} from './organizer-service'

export function registerIpcHandlers() {
  ipcMain.handle('app:bootstrap', async () => {
    const [state, history] = await Promise.all([loadStoredState(), loadHistory()])
    return { state, history }
  })

  ipcMain.handle('dialog:pickFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    return result.canceled ? null : result.filePaths[0] ?? null
  })

  ipcMain.handle('path:inspect', async (_event, targetPath: string) => {
    try {
      const stats = await fs.stat(targetPath)
      return {
        exists: true,
        isDirectory: stats.isDirectory(),
        path: targetPath
      }
    } catch {
      return {
        exists: false,
        isDirectory: false,
        path: targetPath
      }
    }
  })

  ipcMain.handle('state:save', async (_event, state: StoredState) => {
    return saveStoredState(state)
  })

  ipcMain.handle('fields:suggest', async (_event, request: FieldSuggestionRequest) => {
    return suggestFrequentFieldsFromDisk(request)
  })

  ipcMain.handle('preview:generate', async (_event, request: PreviewRequest) => {
    return generatePreviewFromDisk(request)
  })

  ipcMain.handle('run:execute', async (_event, request: PreviewRequest) => {
    const runLog = await executePreviewRequest(request)
    await appendRunLog(runLog)
    return runLog
  })
}
