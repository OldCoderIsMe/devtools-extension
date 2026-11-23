# Markdown 工作台与 macOS Quick Look

DevTools Suite 的 Markdown 能力由浏览器、Chrome 扩展和 Electron 客户端共用，包含：

- Markdown 编辑、分屏预览、纯预览三种布局；
- 打开、保存和另存为 `.md`、`.markdown`、`.mdown`、`.mkdn`、`.mkd` 文件；
- Mermaid 代码块实时渲染，覆盖 `flowchart`、`sequence`、`class`、`state`、`ER`、`gantt`、`pie`、`timeline`、`mindmap`、`gitGraph` 等常见图表；
- 浏览器端支持选择本地文件并下载 Markdown；
- macOS 客户端支持从 Finder、Dock 或命令行直接打开 Markdown，并进入独立 Markdown 编辑器，不会先跳转到首页；
- macOS 打包应用声明 Markdown 文件关联，可在 Finder 中设置为默认打开方式；
- macOS 打包应用内置 Quick Look 预览扩展，用于 Finder 中按空格快速查看 Markdown。

## macOS 文件打开

Markdown 编辑器支持以下扩展名：

```text
.md、.markdown、.mdown、.mkdn、.mkd
```

### 设置默认打开方式

1. 在 Finder 中选中一个 Markdown 文件。
2. 右键选择“显示简介”。
3. 在“打开方式”中选择 **DevTools Suite**。
4. 点击“全部更改…”，确认将同类文件都交给 DevTools Suite 打开。

安装包会自动注册 `.md`、`.markdown` 和 `.mdown`。`.mkdn`、`.mkd` 也可以在编辑器中打开；如果它们没有出现在 Finder 的“打开方式”列表中，可以点击“其他…”，手动选择 DevTools Suite：

```text
/Applications/DevTools Suite.app
```

如果应用刚安装完，建议先右键应用并选择“打开”，完成首次安全确认后再设置文件关联。

从 Finder 双击 Markdown 文件、从 Dock 拖入文件，或执行以下命令时，Electron 客户端会直接打开独立 Markdown 编辑器：

```bash
open -a "DevTools Suite" "/path/to/report.md"
```

## Quick Look

Quick Look 扩展由 `electron/after-pack.js` 在 macOS 打包阶段编译，并放入：

```text
DevTools Suite.app/Contents/PlugIns/MarkdownQuickLook.appex
```

选中 Markdown 文件后按空格即可尝试预览。预览侧重快速查看，支持标题、段落、列表、引用、代码块和基础行内格式。需要编辑文件或查看 Mermaid SVG 时，请使用应用内 Markdown 工作台。

首次安装或更新应用后，如果 Finder 没有立即刷新预览，可以执行：

```bash
qlmanage -r
qlmanage -r cache
killall Finder
```

### 本地构建的限制

当前公开的本地安装包使用 ad-hoc 签名，未使用 Apple Developer ID 签名和 notarization。因此：

- macOS 可能不会稳定注册内置 Quick Look 扩展；
- Finder 按空格时，可能继续使用系统中已有的其他 Markdown Quick Look 提供者；
- 这不会影响 DevTools Suite 内的 Markdown 编辑和 Mermaid 预览；
- 正式分发需要对应用和 `.appex` 使用 Developer ID 签名并完成 Apple notarization。

## “Apple 无法验证 report.md”

如果弹窗提示 Apple 无法验证某个 `.md` 文件，通常是文件携带了 macOS 的下载隔离标记。确认文件来源可信后，可以只移除该文件的标记：

```bash
xattr -d com.apple.quarantine "/path/to/report.md"
```

如果同一可信文件夹中的文件都是自己生成或下载的，也可以处理整个文件夹：

```bash
xattr -dr com.apple.quarantine "/path/to/markdown-folder"
```

不要对来源不明的文件使用上述命令，也不要为了绕过提示而全局关闭 Gatekeeper。
