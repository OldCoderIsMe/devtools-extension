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
});
