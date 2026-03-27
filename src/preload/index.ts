import { contextBridge, ipcRenderer } from 'electron'

import type { DesktopApi, PreviewRequest, StoredState } from '@shared/types'

const api: DesktopApi = {
  bootstrap: () => ipcRenderer.invoke('app:bootstrap'),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  inspectPath: (targetPath) => ipcRenderer.invoke('path:inspect', targetPath),
  saveState: (state: StoredState) => ipcRenderer.invoke('state:save', state),
  generatePreview: (request: PreviewRequest) => ipcRenderer.invoke('preview:generate', request),
  executeRun: (request: PreviewRequest) => ipcRenderer.invoke('run:execute', request)
}

contextBridge.exposeInMainWorld('api', api)
