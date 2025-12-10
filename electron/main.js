const { app, BrowserWindow, Menu, shell, screen } = require('electron');
const path = require('path');

// 检测开发模式
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === '1' || 
              !app.isPackaged;

let mainWindow;

function createWindow() {
  // Electron 客户端：获取主显示器的尺寸，撑满窗口
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  // 创建浏览器窗口
  const iconPath = path.join(__dirname, '../icons/icon.icns');
  const iconExists = require('fs').existsSync(iconPath);
  
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
  

  // 当窗口关闭时
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
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
        { role: 'quit', label: '退出 ' + app.getName() },
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

  app.on('activate', () => {
    // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
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
