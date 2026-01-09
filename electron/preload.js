const { contextBridge, ipcRenderer } = require('electron');

// 暴露受保护的方法给渲染进程
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  // 快速搜索相关 IPC
  quickSearch: {
    close: () => ipcRenderer.invoke('quick-search:close'),
    isVisible: () => ipcRenderer.invoke('quick-search:isVisible'),
  },
  // 设置相关 IPC
  settings: {
    getShortcuts: () => ipcRenderer.invoke('settings:getShortcuts'),
    updateShortcut: (key, value) => ipcRenderer.invoke('settings:updateShortcut', key, value),
    resetShortcuts: () => ipcRenderer.invoke('settings:resetShortcuts'),
  },
  // 文件移动相关 IPC（仅 Electron 环境）
  fileMove: {
    getPairs: () => ipcRenderer.invoke('file-move:getPairs'),
    addPair: (pair) => ipcRenderer.invoke('file-move:addPair', pair),
    updatePair: (alias, pair) => ipcRenderer.invoke('file-move:updatePair', alias, pair),
    deletePair: (alias) => ipcRenderer.invoke('file-move:deletePair', alias),
    execute: (alias, force) => ipcRenderer.invoke('file-move:execute', alias, force),
    selectDirectory: (title) => ipcRenderer.invoke('file-move:selectDirectory', title),
    listFiles: (dirPath) => ipcRenderer.invoke('file-move:listFiles', dirPath),
  },
  // 签名相关 IPC（仅 Electron 环境）
  signature: {
    getTemplates: () => ipcRenderer.invoke('signature:getTemplates'),
    saveTemplate: (template) => ipcRenderer.invoke('signature:saveTemplate', template),
    deleteTemplate: (id) => ipcRenderer.invoke('signature:deleteTemplate', id),
    rsaSign: (data, privateKey) => ipcRenderer.invoke('signature:rsaSign', data, privateKey),
  },
});
