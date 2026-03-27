import { contextBridge, ipcRenderer } from 'electron'

import type {
  DesktopApi,
  FieldSuggestionRequest,
  PreviewRequest,
  StoredState,
  TaskProgressEvent,
  UndoRunRequest
} from '@shared/types'

const api: DesktopApi = {
  bootstrap: () => ipcRenderer.invoke('app:bootstrap'),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  inspectPath: (targetPath) => ipcRenderer.invoke('path:inspect', targetPath),
  saveState: (state: StoredState) => ipcRenderer.invoke('state:save', state),
  importRules: () => ipcRenderer.invoke('rules:import'),
  exportRules: (rules) => ipcRenderer.invoke('rules:export', rules),
  suggestFields: (request: FieldSuggestionRequest) => ipcRenderer.invoke('fields:suggest', request),
  generatePreview: (request: PreviewRequest) => ipcRenderer.invoke('preview:generate', request),
  executeRun: (request: PreviewRequest) => ipcRenderer.invoke('run:execute', request),
  undoRun: (request: UndoRunRequest) => ipcRenderer.invoke('run:undo', request),
  cancelTask: (taskId) => ipcRenderer.invoke('task:cancel', taskId),
  onTaskProgress: (listener: (event: TaskProgressEvent) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: TaskProgressEvent) => {
      listener(payload)
    }

    ipcRenderer.on('task:progress', handler)
    return () => {
      ipcRenderer.off('task:progress', handler)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
