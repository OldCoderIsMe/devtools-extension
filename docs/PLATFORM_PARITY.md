# 三端能力对照（Web / Chrome 扩展 / macOS）

三端共用 `src/` 下的同一套 Vue/TypeScript 代码，基础工具默认三端一致；差异只来自平台能力（浏览器 API、文件系统、窗口模型）。本文件记录当前的差异与迁移判断，新增平台能力时同步更新。

## 对照表

| 能力 | Web | Chrome 扩展 | macOS | 说明 |
|------|-----|-------------|-------|------|
| 基础工具（URL、哈希、时间戳、JSON、文本、Unicode、UUID、正则、二维码、Diff、Markdown、颜色、JWT、年度倒计时） | ✅ | ✅ | ✅ | 共用 `src/tools`，无平台分支 |
| 选中文本右键直连 | ❌ | ✅ | ❌ | 依赖 `contextMenus`，是扩展独有入口 |
| 剪贴板智能识别 | ❌ | ✅ | ❌ | 依赖 `clipboardRead`，Web 端无稳定授权入口 |
| 快速搜索弹窗 | ❌ | ✅（v0.1.5 起） | ✅ | 三端共用 `QuickSearch.vue`；扩展通过 `commands` 快捷键唤起 |
| 文件移动 | ❌ | ❌ | ✅ | 需要 Node `fs` 与本地目录选择，浏览器无法实现 |
| 签名处理（模板 / RSA 签名） | ❌ | ❌ | ✅ | 依赖本地私钥与文件保存，迁移到浏览器会扩大密钥暴露面 |
| Solar System | ✅ | ❌ | ✅ | 摄像头 + Three.js 全屏体验，扩展 popup 失焦即关闭，暂不开放 |
| 年度倒计时独立小组件 | ❌ | ❌ | ✅ | 可选：扩展可用 `windows.create` 建独立小窗，但价值与成本待评估 |

## 结论

- **已经同步**：基础工具全量共用；v0.1.5 起把 macOS 的快速搜索/快捷指令能力带进 Chrome 扩展（`Ctrl+Shift+K`，macOS 为 `⌘+Shift+K`）。
- **适合新增**：快速搜索弹窗（已实现）、年度倒计时独立小组件（待评估）。
- **不适合新增**：文件移动、签名处理（需要文件系统/本地私钥）；Solar System 受 popup 生命周期与摄像头权限限制，如要做应另开「在标签页中打开」的完整页面入口，而不是塞进 popup。

## 扩展快捷键

- `commands.open-quick-search`：`Ctrl+Shift+K`（macOS `Command+Shift+K`）
- 用户可在 `chrome://extensions/shortcuts` 重新分配；`commands` 不是权限项，不扩大扩展权限。
