const { app, BrowserWindow, Menu, shell, screen, globalShortcut, ipcMain, Tray, nativeImage } = require('electron');
const path = require('path');
const settings = require('./settings');

// 检测开发模式
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === '1' || 
              !app.isPackaged;

let mainWindow;
let quickSearchWindow = null;
let tray = null;
let isQuitting = false; // 标记是否正在退出应用

function createWindow() {
  // Electron 客户端：获取主显示器的尺寸，撑满窗口
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  // 创建浏览器窗口
  // 优先使用新的 DevTools 图标
  let iconPath = path.join(__dirname, 'DevTools.icns');
  let iconExists = require('fs').existsSync(iconPath);
  
  // 如果没有找到，使用 Dock 图标
  if (!iconExists) {
    iconPath = path.join(__dirname, 'DevToolsDock.icns');
    iconExists = require('fs').existsSync(iconPath);
  }
  
  // 如果还没有，使用默认图标
  if (!iconExists) {
    iconPath = path.join(__dirname, '../icons/icon.icns');
    iconExists = require('fs').existsSync(iconPath);
  }
  
  const windowOptions = {
    width: width,
    height: height,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: '#1a1a2e', // 使用与应用主题一致的颜色
    titleBarStyle: 'hiddenInset', // macOS 风格标题栏
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    show: false, // 先不显示，等加载完成后再显示
  };
  
  // 在开发模式下设置图标（生产模式下由应用包提供）
  if (isDev && iconExists) {
    windowOptions.icon = iconPath;
  }
  
  mainWindow = new BrowserWindow(windowOptions);

  // 加载应用
  if (isDev) {
    // 开发环境：加载 Vite 开发服务器
    // 从环境变量读取端口，默认为 5173
    const port = process.env.VITE_PORT || process.env.PORT || 5173;
    const devServerUrl = `http://localhost:${port}`;
    
    console.log(`[Electron] 开发模式：尝试加载 ${devServerUrl}`);
    
    // 加载开发服务器
    mainWindow.loadURL(devServerUrl).catch((err) => {
      console.error(`[Electron] 无法连接到开发服务器 ${devServerUrl}:`, err);
      console.log('[Electron] 请确保 Vite 开发服务器正在运行');
      // 如果失败，尝试常见的备用端口
      const fallbackPorts = [5174, 5175, 3000];
      let triedPorts = [port];
      
      const tryNextPort = (index) => {
        if (index < fallbackPorts.length) {
          const nextPort = fallbackPorts[index];
          if (!triedPorts.includes(nextPort)) {
            triedPorts.push(nextPort);
            console.log(`[Electron] 尝试端口 ${nextPort}...`);
            mainWindow.loadURL(`http://localhost:${nextPort}`).catch(() => {
              tryNextPort(index + 1);
            });
          }
        } else {
          console.error('[Electron] 所有端口尝试失败，请检查 Vite 开发服务器是否正在运行');
        }
      };
      
      tryNextPort(0);
    });
    
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境：加载构建后的文件
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log(`[Electron] 生产模式：尝试加载 ${indexPath}`);
    
    // 检查文件是否存在
    const fs = require('fs');
    if (!fs.existsSync(indexPath)) {
      console.error(`[Electron] 错误：文件不存在 ${indexPath}`);
      console.error('[Electron] 请先运行 npm run electron:build 构建应用');
      return;
    }
    
    // 使用 loadFile，它会自动处理 file:// 协议和相对路径
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('[Electron] 加载文件失败:', err);
    });
  }
  
  // 监听页面加载事件
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (errorCode !== -3) { // -3 是 ERR_ABORTED，通常是正常的导航取消
      console.error('[Electron] 页面加载失败:', errorCode, errorDescription);
      console.error('[Electron] URL:', validatedURL);
    }
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] 页面加载完成');
  });
  
  mainWindow.webContents.on('dom-ready', () => {
    console.log('[Electron] DOM 准备就绪');
  });
  
  // 监听控制台消息（用于调试）
  mainWindow.webContents.on('console-message', (event, level, message) => {
    if (level >= 2) { // 只显示 warning 和 error
      console.log(`[Renderer ${level === 2 ? 'WARN' : 'ERROR'}]:`, message);
    }
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    console.log('[Electron] 窗口准备显示');
    mainWindow.show();
    // Electron 客户端：最大化窗口，撑满整个屏幕
    mainWindow.maximize();
    
    // 聚焦窗口
    if (isDev) {
      mainWindow.focus();
    }
  });
  

  // 当窗口关闭时（macOS 上不真正关闭，而是隐藏）
  mainWindow.on('close', (event) => {
    // 如果正在退出应用，允许关闭
    if (isQuitting) {
      mainWindow = null;
      return;
    }
    
    if (process.platform === 'darwin') {
      // macOS: 隐藏窗口而不是关闭（除非是退出）
      event.preventDefault();
      mainWindow.hide();
    } else {
      // 其他平台: 真正关闭
      mainWindow = null;
    }
  });

  // 窗口被销毁时
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// 创建快速搜索弹窗
function createQuickSearchWindow() {
  // 如果窗口已存在，直接显示并聚焦
  if (quickSearchWindow) {
    quickSearchWindow.show();
    quickSearchWindow.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  // 创建一个居中的小窗口
  const windowWidth = 600;
  const windowHeight = 400;
  const x = Math.floor((width - windowWidth) / 2);
  const y = Math.floor((height - windowHeight) / 2);

  quickSearchWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    frame: false, // 无边框窗口
    transparent: true, // 透明背景，用于圆角效果
    backgroundColor: '#00000000', // 透明
    resizable: false,
    alwaysOnTop: true, // 始终置顶
    skipTaskbar: true, // 不在任务栏显示
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    show: false,
  });

  // 加载快速搜索页面
  if (isDev) {
    const port = process.env.VITE_PORT || process.env.PORT || 5173;
    quickSearchWindow.loadURL(`http://localhost:${port}/quick-search.html`);
  } else {
    const quickSearchPath = path.join(__dirname, '../dist/quick-search.html');
    quickSearchWindow.loadFile(quickSearchPath);
  }

  // 窗口准备好后显示
  quickSearchWindow.once('ready-to-show', () => {
    quickSearchWindow.show();
    quickSearchWindow.focus();
  });

  // 窗口关闭时清理引用
  quickSearchWindow.on('closed', () => {
    quickSearchWindow = null;
  });

  // 失去焦点时隐藏窗口（类似 Spotlight）
  quickSearchWindow.on('blur', () => {
    if (quickSearchWindow && !quickSearchWindow.isDestroyed()) {
      // 延迟隐藏，避免与主窗口显示冲突
      setTimeout(() => {
        if (quickSearchWindow && !quickSearchWindow.isDestroyed()) {
          quickSearchWindow.hide();
        }
      }, 100);
    }
  });
}

// 注册的快捷键列表（用于注销）
let registeredShortcuts = [];

// 注册全局快捷键
function registerGlobalShortcuts() {
  // 先注销所有已注册的快捷键
  registeredShortcuts.forEach(shortcut => {
    globalShortcut.unregister(shortcut);
  });
  registeredShortcuts = [];

  // 从设置中读取快捷键
  const shortcut1 = settings.getShortcut('quickSearch');
  const shortcut2 = settings.getShortcut('quickSearchAlt');

  // 注册主快捷键
  if (shortcut1) {
    const ret1 = globalShortcut.register(shortcut1, () => {
      createQuickSearchWindow();
    });
    if (ret1) {
      registeredShortcuts.push(shortcut1);
      console.log(`[Electron] 全局快捷键已注册: ${shortcut1}`);
    } else {
      console.log(`[Electron] 全局快捷键注册失败: ${shortcut1} (可能已被占用)`);
    }
  }

  // 注册备用快捷键
  if (shortcut2 && shortcut2 !== shortcut1) {
    const ret2 = globalShortcut.register(shortcut2, () => {
      createQuickSearchWindow();
    });
    if (ret2) {
      registeredShortcuts.push(shortcut2);
      console.log(`[Electron] 备用全局快捷键已注册: ${shortcut2}`);
    } else {
      console.log(`[Electron] 备用全局快捷键注册失败: ${shortcut2} (可能已被占用)`);
    }
  }
}

// 注册 IPC 处理器
function registerIpcHandlers() {
  // 关闭快速搜索窗口
  ipcMain.handle('quick-search:close', () => {
    if (quickSearchWindow && !quickSearchWindow.isDestroyed()) {
      quickSearchWindow.hide();
    }
  });

  // 获取窗口是否可见
  ipcMain.handle('quick-search:isVisible', () => {
    return quickSearchWindow && !quickSearchWindow.isDestroyed() && quickSearchWindow.isVisible();
  });

  // 获取快捷键设置
  ipcMain.handle('settings:getShortcuts', () => {
    const settingsData = settings.loadSettings();
    return settingsData.shortcuts || settings.DEFAULT_SETTINGS.shortcuts;
  });

  // 更新快捷键设置
  ipcMain.handle('settings:updateShortcut', async (event, key, value) => {
    const success = settings.updateShortcut(key, value);
    if (success) {
      // 重新注册快捷键
      registerGlobalShortcuts();
    }
    return success;
  });

  // 重置快捷键为默认值
  ipcMain.handle('settings:resetShortcuts', () => {
    const defaultSettings = settings.DEFAULT_SETTINGS;
    settings.saveSettings(defaultSettings);
    registerGlobalShortcuts();
    return defaultSettings.shortcuts;
  });
}

// 创建菜单栏图标（Tray）
function createTray() {
  // 优先使用黑色菜单栏图标
  let iconPath = path.join(__dirname, '../icons/black_menu.png');
  let iconExists = require('fs').existsSync(iconPath);
  
  // 如果没有黑色菜单图标，使用菜单栏专用图标
  if (!iconExists) {
    iconPath = path.join(__dirname, '../icons/menu-icon.png');
    iconExists = require('fs').existsSync(iconPath);
  }
  
  // 如果还没有，使用应用图标
  if (!iconExists) {
    iconPath = path.join(__dirname, '../icons/icon.icns');
    iconExists = require('fs').existsSync(iconPath);
  }
  
  if (!iconExists) {
    console.log('[Electron] 未找到图标文件，跳过创建 Tray');
    return;
  }

  // 创建原生图片
  let image = nativeImage.createFromPath(iconPath);
  
  // 如果是 PNG 格式，调整尺寸适合菜单栏（macOS 菜单栏图标通常是 22x22 或 18x18）
  if (iconPath.endsWith('.png')) {
    // macOS 菜单栏图标推荐尺寸
    const sizes = [22, 18, 16];
    for (const size of sizes) {
      const resized = image.resize({ width: size, height: size });
      if (!resized.isEmpty()) {
        image = resized;
        break;
      }
    }
  }
  
  // 设置不同尺寸的图标（macOS 菜单栏需要不同尺寸）
  if (image.isEmpty()) {
    console.log('[Electron] 无法加载图标，跳过创建 Tray');
    return;
  }

  // 创建 Tray
  tray = new Tray(image);
  
  // 设置工具提示
  tray.setToolTip('DevTools Suite');
  
  // 创建上下文菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isDestroyed()) {
            createWindow();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        } else {
          createWindow();
        }
      },
    },
    {
      label: '快速搜索',
      click: () => {
        createQuickSearchWindow();
      },
    },
    { type: 'separator' },
    {
      label: '关于',
      click: () => {
        shell.openExternal('https://github.com/OldCoderIsMe/devtools-extension');
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  
  tray.setContextMenu(contextMenu);
  
  // 点击图标显示/隐藏主窗口
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isDestroyed()) {
        createWindow();
      } else {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    } else {
      createWindow();
    }
  });
  
  console.log('[Electron] 菜单栏图标已创建');
}

// 创建应用菜单（macOS）
function createMenu() {
  const template = [
    {
      label: app.getName(),
      submenu: [
        { role: 'about', label: '关于 ' + app.getName() },
        { type: 'separator' },
        { role: 'services', label: '服务' },
        { type: 'separator' },
        { role: 'hide', label: '隐藏 ' + app.getName() },
        { role: 'hideOthers', label: '隐藏其他' },
        { role: 'unhide', label: '显示全部' },
        { type: 'separator' },
        { 
          role: 'quit', 
          label: '退出 ' + app.getName(),
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '切换开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'close', label: '关闭' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            shell.openExternal('https://github.com/OldCoderIsMe/devtools-extension');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();
  createMenu();
  createTray(); // 创建菜单栏图标
  registerIpcHandlers();
  
  // 注册全局快捷键（从设置中读取）
  registerGlobalShortcuts();

  app.on('activate', () => {
    // 在 macOS 上，当单击 dock 图标时，显示主窗口
    if (mainWindow) {
      if (mainWindow.isDestroyed()) {
        createWindow();
      } else {
        // 如果主窗口存在但被隐藏，显示它
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        }
        mainWindow.focus();
      }
    } else {
      // 如果没有主窗口，创建一个
      createWindow();
    }
  });
});

// 应用退出时注销所有全局快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// 当所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  // macOS 上，即使所有窗口关闭，应用也继续运行（因为有菜单栏图标）
  // 其他平台上，关闭所有窗口时退出应用
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 安全：防止新窗口创建
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
