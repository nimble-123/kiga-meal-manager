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
});
