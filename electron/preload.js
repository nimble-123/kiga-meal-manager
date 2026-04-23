const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
    has: (key) => ipcRenderer.invoke('store:has', key),
    keys: () => ipcRenderer.invoke('store:keys'),
    getPath: () => ipcRenderer.invoke('store:path'),
  },
  saveCSV: (data) => ipcRenderer.invoke('save-csv', data),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFile: (data) => ipcRenderer.invoke('open-file', data),
  openEmail: (data) => ipcRenderer.invoke('open-email', data),
  sendEmailWithCSV: (data) => ipcRenderer.invoke('send-email-with-csv', data),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  saveFileToPath: (data) => ipcRenderer.invoke('save-file-to-path', data),
  listFiles: (data) => ipcRenderer.invoke('list-files', data),
  deleteFile: (data) => ipcRenderer.invoke('delete-file', data),
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    onAvailable: (cb) => { const handler = (_, info) => cb(info); ipcRenderer.on('updater:available', handler); return () => ipcRenderer.removeListener('updater:available', handler); },
    onNotAvailable: (cb) => { const handler = () => cb(); ipcRenderer.on('updater:not-available', handler); return () => ipcRenderer.removeListener('updater:not-available', handler); },
    onProgress: (cb) => { const handler = (_, p) => cb(p); ipcRenderer.on('updater:progress', handler); return () => ipcRenderer.removeListener('updater:progress', handler); },
    onDownloaded: (cb) => { const handler = (_, info) => cb(info); ipcRenderer.on('updater:downloaded', handler); return () => ipcRenderer.removeListener('updater:downloaded', handler); },
    onError: (cb) => { const handler = (_, msg) => cb(msg); ipcRenderer.on('updater:error', handler); return () => ipcRenderer.removeListener('updater:error', handler); },
  },
});
