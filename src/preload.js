const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onBlockedExecution: (callback) => ipcRenderer.on('blocked-execution', callback)
});