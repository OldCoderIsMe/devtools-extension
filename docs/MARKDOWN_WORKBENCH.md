# Markdown 工作台与 macOS Quick Look

DevTools Suite 的 Markdown 工具现在同时提供：

- Markdown 编辑、分屏预览、纯预览三种布局；
- 打开、保存和另存为 `.md` / `.markdown` / `.mdown` 文件；
- Mermaid 代码块实时渲染，覆盖 flowchart、sequence、class、state、ER、gantt、pie、timeline、mindmap、gitGraph 等常见图表；
- 浏览器、Chrome 扩展和 Electron 客户端共用同一套 Markdown 能力；
- macOS 打包应用注册 Markdown 文件关联，Finder 中可以通过“打开方式”选择 DevTools Suite；
- macOS 打包应用内置 Quick Look 生成器，Finder 选中 Markdown 文件后按空格可以预览基础 Markdown 内容。

## macOS 文件打开

开发版可以通过应用内的“打开”按钮选择文件。打包后的 macOS 应用会注册 `.md`、`.markdown` 和 `.mdown` 文件类型：

1. 在 Finder 中右键 Markdown 文件。
2. 选择“打开方式 → DevTools Suite”。
3. 需要设为默认应用时，打开“显示简介”，在“打开方式”中选择 DevTools Suite，再点击“全部更改”。

从 Finder 双击 Markdown 文件，或把文件拖到 Dock 中的 DevTools Suite 图标，应用会自动切换到 Markdown 工作台并加载文件。

## Quick Look

Quick Look 生成器在 macOS 打包阶段由 `electron/after-pack.js` 编译并放入应用包的 `Contents/Library/QuickLook`。首次安装或更新应用后，如果 Finder 没有立即刷新预览，可以重新启动 Finder 或执行：

```bash
qlmanage -r cache
```

Quick Look 预览侧重快速查看，支持标题、段落、列表、引用、代码块和基础行内格式。需要编辑或查看 Mermaid SVG 时，使用应用内的 Markdown 工作台。


> 说明：Quick Look 扩展属于 macOS 系统插件，正式分发时建议使用 Apple Developer ID 签名和公证。未签名或仅 ad-hoc 签名的本地构建可能不会被系统注册为 Quick Look 提供者；此时仍可通过 DevTools Suite 的独立 Markdown 编辑器打开、编辑和预览文件。
