# DevTools Suite v0.1.2 - 客户端快捷指令版本 🚀

## 🎉 重大更新

本次更新为 macOS 桌面客户端带来了强大的快速搜索功能，类似 macOS Spotlight，让您能够通过快捷键快速调用各种开发工具，大幅提升工作效率！

## ✨ 新增功能

### 🎯 快速搜索弹窗（类似 macOS Spotlight）

- **全局快捷键支持**：默认 `Cmd+K` / `Cmd+Space`，可在设置中自定义
- **快速命令执行**：输入命令和参数即可立即显示结果，无需打开主窗口
- **智能命令提示**：输入时自动显示匹配的命令建议，支持模糊匹配
- **键盘导航**：支持上下箭头、Tab、Enter 选择命令，操作流畅
- **macOS 毛玻璃效果**：精美的视觉效果，完美融入 macOS 系统

**支持的命令**：
- `md5` / `sha1` / `sha256` / `sha512` - 哈希计算
- `base64` / `b64` - Base64 编码
- `base64d` / `b64d` - Base64 解码
- `urlencode` / `url` / `ue` - URL 编码
- `urldecode` / `ud` - URL 解码
- `timestamp` / `ts` - 时间戳转日期
- `date` - 日期转时间戳

### ⚙️ 快捷键自定义

- **设置界面**：新增设置面板，支持自定义快速搜索快捷键
- **设置持久化**：快捷键配置自动保存，重启后生效
- **一键重置**：支持恢复默认快捷键设置

### 📌 菜单栏图标（Tray Icon）

- **菜单栏常驻**：应用图标显示在 macOS 菜单栏右侧，随时可访问
- **快速访问**：点击图标显示/隐藏主窗口
- **右键菜单**：快速搜索、关于、退出等功能一键直达

## 🐛 问题修复

- ✅ 修复 macOS DMG 安装问题，支持拖拽到 Applications 文件夹
- ✅ 修复退出功能不生效的问题
- ✅ 修复使用快捷弹窗后无法通过 Dock 图标打开主窗口的问题
- ✅ 优化窗口关闭行为（macOS 上关闭窗口隐藏到菜单栏，而非退出应用）
- ✅ 修复快速搜索弹窗输入框和滚动条可见性问题
- ✅ 优化命令提示列表的间距和对齐方式

## 🎨 界面优化

- 🎨 更新应用图标（DevTools.icns），更现代化的设计
- 🎨 优化快速搜索弹窗 UI，提升视觉体验
- 🎨 改进命令提示显示效果，支持完整命令列表展示
- 🎨 添加命令缩写列，方便快速识别
- 🎨 实现 macOS 毛玻璃效果（backdrop-filter）

## 📝 文档更新

- 📚 添加安装说明文档（INSTALL.md）
- 📚 添加 macOS 菜单栏显示条件说明（MENUBAR.md）
- 📚 更新 README，添加 Chrome 应用商店链接
- 📚 添加应用截图展示

## 🌐 Chrome 应用商店

**Chrome 扩展已上架应用商店！** 🎊

👉 [立即安装](https://chromewebstore.google.com/detail/devtools-suite/fjebaljoclgdamiognofbdjplmbgkpil?authuser=0&hl=zh-CN)

支持一键安装，自动更新，集成到浏览器中，方便随时调用。

## 📦 下载方式

### macOS 桌面客户端
- 下载 DMG 文件，拖拽到 Applications 文件夹即可安装
- 支持 Intel 和 Apple Silicon（M1/M2/M3）芯片

### Chrome 浏览器扩展
- [Chrome 应用商店安装](https://chromewebstore.google.com/detail/devtools-suite/fjebaljoclgdamiognofbdjplmbgkpil?authuser=0&hl=zh-CN)（推荐）
- 或访问 [在线体验](https://oldcoderisme.github.io/devtools-extension/)

## 🔄 升级建议

如果您是 macOS 桌面客户端用户，强烈建议升级到此版本，体验全新的快速搜索功能！

## 🙏 致谢

感谢所有用户的反馈和支持！如有问题或建议，欢迎提交 Issue。

---

**完整更新日志**：查看 [README.md](README.md) 中的版本历史部分
