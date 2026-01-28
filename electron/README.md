# Electron macOS 客户端

使用 Electron 框架将 DevTools Suite 打包为 macOS 原生应用。

## 技术栈

- **Electron** - 跨平台桌面应用框架（行业最流行）
- **Vue 3** - 前端框架（复用现有代码）
- **Vite** - 构建工具
- **electron-builder** - 应用打包工具

## 安装依赖

```bash
npm install
```

## 开发模式

启动开发服务器和 Electron 应用：

```bash
npm run electron:dev
```

这将：
1. 启动 Vite 开发服务器（http://localhost:5173）
2. 等待服务器就绪后启动 Electron 应用
3. 自动打开开发者工具

## 构建应用

### 构建 macOS 应用

```bash
npm run electron:build:mac
```

这将生成：
- `release/DevTools Suite-0.1.4.dmg` - macOS 安装包（x64）
- `release/DevTools Suite-0.1.4-arm64.dmg` - macOS 安装包（arm64）
- `release/DevTools Suite-0.1.4-mac.zip` - macOS 压缩包（x64）
- `release/DevTools Suite-0.1.4-arm64-mac.zip` - macOS 压缩包（arm64）

说明：
- 脚本会按架构顺序构建（避免 DMG 并发挂载冲突）
- 默认禁用自动发布（`--publish never`）

### 仅打包（不生成安装包）

```bash
npm run electron:pack
```

## 应用图标

macOS 应用需要 `.icns` 格式的图标文件。请将图标文件放在：

```
icons/icon.icns
```

### 生成 .icns 文件

可以使用以下工具生成 `.icns` 文件：

1. **在线工具**：
   - [CloudConvert](https://cloudconvert.com/png-to-icns)
   - [IconUtil](https://iconutil.com/)

2. **命令行工具**（macOS）：
   ```bash
   # 创建 iconset 目录
   mkdir icon.iconset
   
   # 添加不同尺寸的 PNG 图片
   # 然后使用 iconutil 转换
   iconutil -c icns icon.iconset -o icon.icns
   ```

3. **使用 sips 和 iconutil**：
   ```bash
   # 从单个 PNG 创建 iconset
   sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
   sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
   sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
   sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
   sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
   sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
   sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
   sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
   sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
   sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
   
   # 转换为 icns
   iconutil -c icns icon.iconset
   ```

## 应用配置

应用配置在 `package.json` 的 `build` 字段中：

- **appId**: `com.devtools.suite` - 应用唯一标识符
- **productName**: `DevTools Suite` - 应用显示名称
- **mac.category**: `public.app-category.developer-tools` - macOS 应用分类

## 代码签名（可选）

如果要发布到 App Store 或进行代码签名，需要：

1. 配置 Apple Developer 证书
2. 在 `electron-builder` 配置中添加签名信息
3. 使用 `electron-builder --mac --publish never` 进行签名

## 文件结构

```
electron/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本（安全隔离）
├── entitlements.mac.plist  # macOS 权限配置
└── README.md            # 本文档
```

## 特性

- ✅ 原生 macOS 外观和体验
- ✅ 支持 macOS 暗色模式
- ✅ 原生菜单栏
- ✅ 窗口管理（最小化、最大化、关闭）
- ✅ 安全隔离（contextIsolation）
- ✅ 自动更新支持（可配置）
- ✅ 摄像头交互（Solar System）：在 Electron 客户端中可通过 `getUserMedia` 调用摄像头并进行手势交互（需要系统授权）

## 故障排除

### 应用无法启动

1. 确保已安装所有依赖：`npm install`
2. 检查 Node.js 版本（推荐 18+）
3. 查看控制台错误信息

### 图标不显示

1. 确保 `icons/icon.icns` 文件存在
2. 检查图标文件格式是否正确
3. 重新构建应用

### 开发模式无法连接

1. 确保 Vite 开发服务器运行在 `http://localhost:5173`
2. 检查防火墙设置
3. 尝试重启开发服务器

## 参考资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [electron-builder 文档](https://www.electron.build/)
- [macOS 应用开发指南](https://developer.apple.com/macos/)
