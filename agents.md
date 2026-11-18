# 协作约定

本文件面向项目贡献者、代码代理和评审者，帮助在修改前快速确认范围、命令和安全边界。项目同时支持 Chrome 扩展、浏览器 Web 应用和 macOS Electron 应用。本次协作约定只涉及文档与工程协作，不要求修改页面、交互、可访问性、响应式样式或业务行为。

## 项目结构

- `src/`：Web 应用与扩展共用的 Vue/TypeScript 源码。
- `public/`：Web/扩展构建所需的静态资源。
- `scripts/`：开发、构建和打包辅助脚本。
- `docs/`：项目文档。
- `electron/`：Electron 主进程及桌面应用相关文件。
- `build/`、`icons/`、`images/`：构建资源、图标和图片资源。
- `dist/`、`release/`：构建或打包生成物，不是常规源码改动。

## 常用命令

在仓库根目录执行：

```bash
# 启动 Vite 开发服务
npm run dev

# 构建 Web 应用并复制扩展 manifest
npm run build

# 执行 TypeScript/Vue 类型检查
npm run type-check

# 按需验证 Electron 开发、构建或目录打包形态
npm run electron:dev
npm run electron:build
npm run electron:pack
```

以上命令均来自当前 `package.json`。需要扩展打包时可使用 `npm run package`；只有在确有对应验证需求时才执行耗时的桌面打包命令。

## 修改边界

- 修改前先执行 `git status --short`，阅读相关文件并确认任务范围。
- 保持改动聚焦；未经授权不要调整依赖、`package.json` 脚本、构建配置、UI/业务行为或权限。
- 不要把 `dist/`、`release/`、安装包等生成物作为常规源码改动提交。
- 不要提交本地敏感配置，也不要在文档、日志或提交信息中粘贴密钥、令牌或其他凭据。
- 修改后检查 `git diff`、`git diff --check` 和 `git status --short`，确认没有无关文件变化。

## 隐私与权限

- 项目工具的计算默认在本地完成；涉及外部模型或资源时，需遵循现有实现和任务授权，不要擅自扩大数据流转范围。
- Chrome 扩展 manifest 当前只声明 `storage` 权限，用于本地数据存储。新增或扩大权限必须有明确需求，不得由文档或重构顺带引入。
- 摄像头功能必须在用户明确授权后使用。浏览器端应运行在 HTTPS 或 `localhost` 等安全上下文中；macOS/Electron 端还需遵循系统摄像头授权状态。不要绕过拒绝授权或将摄像头数据上传。

## 验证与交付

根据实际改动至少执行相关检查：文档改动应检查 Markdown 结构、命令与 `package.json` 的一致性及路径；源码、类型或构建相关改动再选择 `npm run type-check`、`npm run build` 或适用的 Electron 命令。所有结果和无法执行的检查都必须如实记录，不得伪造测试或构建结论。

若仓库脚本、目录或权限发生变化，应同步更新本约定。除非任务明确授权，不创建或合并分支/PR，也不发布版本。
