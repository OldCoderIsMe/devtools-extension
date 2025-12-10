# Electron macOS 客户端快速开始

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

这将安装所有依赖，包括：
- Electron
- electron-builder
- 其他开发工具

### 2. 开发模式

启动开发服务器和 Electron 应用：

```bash
npm run electron:dev
```

这将：
- ✅ 启动 Vite 开发服务器
- ✅ 自动打开 Electron 窗口
- ✅ 启用热重载
- ✅ 打开开发者工具

### 3. 构建 macOS 应用

构建 macOS 安装包：

```bash
npm run electron:build:mac
```

构建完成后，在 `release` 目录中找到：
- `DevTools Suite-0.1.0.dmg` - macOS 安装包
- `DevTools Suite-0.1.0-mac.zip` - 压缩包

## 📦 应用图标

在构建之前，请确保已创建应用图标：

1. 准备一个 1024x1024 的 PNG 图标
2. 转换为 `.icns` 格式（参考 `electron/ICON_GUIDE.md`）
3. 保存为 `icons/icon.icns`

如果没有图标，应用将使用默认 Electron 图标。

## 🛠️ 可用命令

| 命令 | 说明 |
|------|------|
| `npm run electron:dev` | 启动开发模式 |
| `npm run electron:build` | 构建所有平台 |
| `npm run electron:build:mac` | 仅构建 macOS |
| `npm run electron:pack` | 打包应用（不生成安装包） |

## 📁 项目结构

```
devtools-extension/
├── electron/              # Electron 配置
│   ├── main.js           # 主进程
│   ├── preload.js        # 预加载脚本
│   ├── entitlements.mac.plist  # macOS 权限
│   └── README.md         # 详细文档
├── src/                  # Vue 应用源码
├── dist/                 # 构建输出
└── release/              # 打包输出（构建后生成）
```

## ✨ 特性

- ✅ 原生 macOS 外观
- ✅ 支持暗色模式
- ✅ 原生菜单栏
- ✅ 窗口管理
- ✅ 安全隔离
- ✅ 热重载开发

## 🔧 故障排除

### 端口被占用

如果 5173 端口被占用，修改 `vite.config.ts` 中的端口配置。

### 图标不显示

1. 确保 `icons/icon.icns` 存在
2. 重新构建应用

### 构建失败

1. 确保已安装所有依赖：`npm install`
2. 检查 Node.js 版本（推荐 18+）
3. 查看错误日志

## 📚 更多信息

- 详细文档：`electron/README.md`
- 图标指南：`electron/ICON_GUIDE.md`
- [Electron 官方文档](https://www.electronjs.org/docs)
