import fs from 'node:fs/promises'
import { dialog, ipcMain } from 'electron'

import { normalizeRules } from '@shared/rules'
import type {
  FieldSuggestionRequest,
  PreviewRequest,
  StoredState,
  TaskKind,
  TaskProgressEvent,
  UndoRunRequest
} from '@shared/types'
import { appendRunLog, findRunLog, loadHistory, loadStoredState, replaceRunLog, saveStoredState } from './store'
import {
  executePreviewRequest,
  generatePreviewFromDisk,
  suggestFrequentFieldsFromDisk,
  TaskCancelledError,
  undoRunLog
} from './organizer-service'

interface RegisteredTask {
  cancelled: boolean
  kind: TaskKind
}

const registeredTasks = new Map<string, RegisteredTask>()

function createTaskControl(
  sender: Electron.WebContents,
  kind: TaskKind,
  requestedTaskId?: string
) {
  const taskId = requestedTaskId ?? crypto.randomUUID()
  const taskState: RegisteredTask = {
    cancelled: false,
    kind
  }

  registeredTasks.set(taskId, taskState)

  return {
    taskId,
    kind,
    isCancelled: () => taskState.cancelled,
    onProgress: async (event: TaskProgressEvent) => {
      sender.send('task:progress', event)
    }
  }
}

function finishTask(taskId: string) {
  registeredTasks.delete(taskId)
}

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

  ipcMain.handle('rules:import', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (result.canceled || !result.filePaths[0]) {
      return null
    }

    const raw = await fs.readFile(result.filePaths[0], 'utf8')
    const parsed = JSON.parse(raw) as { rules?: StoredState['rules'] } | StoredState['rules']
    const rules = Array.isArray(parsed) ? parsed : parsed.rules
    return normalizeRules(Array.isArray(rules) ? rules : [])
  })

  ipcMain.handle('rules:export', async (_event, rules: StoredState['rules']) => {
    const result = await dialog.showSaveDialog({
      defaultPath: 'uno-rules.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (result.canceled || !result.filePath) {
      return null
    }

    await fs.writeFile(result.filePath, JSON.stringify({ rules: normalizeRules(rules) }, null, 2), 'utf8')
    return result.filePath
  })

  ipcMain.handle('task:cancel', async (_event, taskId: string) => {
    const task = registeredTasks.get(taskId)
    if (!task) {
      return false
    }

    task.cancelled = true
    return true
  })

  ipcMain.handle('fields:suggest', async (event, request: FieldSuggestionRequest) => {
    const task = createTaskControl(event.sender, 'suggest', request.taskId)

    try {
      return await suggestFrequentFieldsFromDisk(request, task)
    } catch (error) {
      if (error instanceof TaskCancelledError) {
        event.sender.send('task:progress', {
          taskId: task.taskId,
          kind: 'suggest',
          phase: 'cancelled',
          state: 'cancelled',
          message: '字段分析已取消。',
          processed: 0
        })
      }
      throw error
    } finally {
      finishTask(task.taskId!)
    }
  })

  ipcMain.handle('preview:generate', async (event, request: PreviewRequest) => {
    const task = createTaskControl(event.sender, 'preview', request.taskId)

    try {
      return await generatePreviewFromDisk(request, task)
    } catch (error) {
      if (error instanceof TaskCancelledError) {
        event.sender.send('task:progress', {
          taskId: task.taskId,
          kind: 'preview',
          phase: 'cancelled',
          state: 'cancelled',
          message: '预览已取消。',
          processed: 0
        })
      }
      throw error
    } finally {
      finishTask(task.taskId!)
    }
  })

  ipcMain.handle('run:execute', async (event, request: PreviewRequest) => {
    const task = createTaskControl(event.sender, 'run', request.taskId)

    try {
      const runLog = await executePreviewRequest(request, task)
      await appendRunLog(runLog)
      return runLog
    } catch (error) {
      if (error instanceof TaskCancelledError) {
        event.sender.send('task:progress', {
          taskId: task.taskId,
          kind: 'run',
          phase: 'cancelled',
          state: 'cancelled',
          message: '整理任务已取消。',
          processed: 0
        })
      }
      throw error
    } finally {
      finishTask(task.taskId!)
    }
  })

  ipcMain.handle('run:undo', async (event, request: UndoRunRequest) => {
    const runLog = await findRunLog(request.runId)
    if (!runLog) {
      throw new Error('未找到可撤销的整理记录。')
    }

    const task = createTaskControl(event.sender, 'undo', request.taskId)

    try {
      const updatedRunLog = await undoRunLog(runLog, undefined, task)
      await replaceRunLog(updatedRunLog)
      return updatedRunLog
    } catch (error) {
      if (error instanceof TaskCancelledError) {
        event.sender.send('task:progress', {
          taskId: task.taskId,
          kind: 'undo',
          phase: 'cancelled',
          state: 'cancelled',
          message: '撤销任务已取消。',
          processed: 0
        })
      }
      throw error
    } finally {
      finishTask(task.taskId!)
    }
  })
}
