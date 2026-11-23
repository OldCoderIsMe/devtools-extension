# macOS 安装说明

## 安装步骤

### 方法一：从 DMG 安装（推荐）

1. 根据 Mac 芯片选择安装包：
   - Apple Silicon（M 系列）：`DevTools Suite-0.1.5-arm64.dmg`
   - Intel：`DevTools Suite-0.1.5.dmg`
2. 双击 DMG 文件。
3. 将 **DevTools Suite** 拖拽到 `Applications` 文件夹。
4. 打开 `Applications` 文件夹，右键 DevTools Suite，选择“打开”。
5. 如果 macOS 再次提示无法验证开发者，在确认安装包来源可信后点击“打开”。

### 方法二：从 ZIP 安装

1. 根据 Mac 芯片下载对应 ZIP：
   - Apple Silicon：`DevTools Suite-0.1.5-arm64-mac.zip`
   - Intel：`DevTools Suite-0.1.5-mac.zip`
2. 解压文件。
3. 将解压后的应用拖拽到 `Applications` 文件夹。
4. 按照上面的首次打开步骤完成安全确认。

## 关于 macOS 安全提示

当前本地安装包使用 ad-hoc 签名，尚未使用 Apple Developer ID 签名和 notarization。因此首次打开应用时，macOS 可能提示“无法验证开发者”。这是安装包签名状态导致的，不代表 DevTools Suite 的 Markdown 内容或 Mermaid 图表存在问题。

建议使用以下方式处理：

1. 在 Finder 中右键 DevTools Suite.app，选择“打开”。
2. 或打开“系统设置 → 隐私与安全性”，在底部选择“仍要打开”。
3. 只对确认来源可信的安装包执行上述操作。

不建议使用 `sudo spctl --master-disable` 全局关闭 Gatekeeper。

## Markdown 文件安全提示

如果提示内容类似：

```text
Apple 无法验证“report.md”是否包含可能危害 Mac 安全或泄露隐私的恶意软件
```

说明这个 Markdown 文件本身带有下载隔离标记，常见于浏览器、邮件、网盘或 ZIP 解压。确认文件来源可信后，可以只移除该文件的标记：

```bash
xattr -d com.apple.quarantine "/path/to/report.md"
```

处理前不要对来源不明的文件执行此命令。完整的 Markdown 文件关联、独立编辑器和 Quick Look 说明见 [MARKDOWN_WORKBENCH.md](./MARKDOWN_WORKBENCH.md)。

## 首次运行

1. 打开应用后，如果提示需要权限，请在“隐私与安全性”中授予相应权限。
2. 使用 **Solar System** 时，需要明确允许摄像头权限。
3. 普通启动会进入 DevTools Suite 首页；从 Finder 双击 Markdown 文件会直接进入独立 Markdown 编辑器。
4. 可以在“显示简介 → 打开方式”中将 DevTools Suite 设置为 `.md` 等 Markdown 文件的默认打开方式。

## 快捷键

- `Cmd+K` 或 `Cmd+Space`：打开快速搜索
- 快捷键可在应用设置中自定义

## 故障排除

### Markdown 双击后没有进入编辑器

确认 DevTools Suite 位于 `/Applications`，然后在 Markdown 文件的“显示简介 → 打开方式”中重新选择 DevTools Suite，并点击“全部更改…”。必要时先右键应用选择“打开”一次。

### Finder 按空格没有使用 DevTools Suite 预览

本地 ad-hoc 构建的 Quick Look 扩展可能不会被 macOS 稳定注册。可以先刷新缓存：

```bash
qlmanage -r
qlmanage -r cache
killall Finder
```

如果仍然无效，可以继续使用 DevTools Suite 的独立 Markdown 编辑器。正式接管 Quick Look 需要 Apple Developer ID 签名和 notarization。

### 应用无法启动

1. 检查 macOS 版本（需要 macOS 11 或更高版本）。
2. 确认应用已放入 `Applications` 文件夹。
3. 在 Finder 中右键应用并选择“打开”。
4. 查看“系统设置 → 隐私与安全性”中的拦截记录。

### 快捷键不工作

1. 打开应用设置。
2. 检查快捷键配置。
3. 确保快捷键未被其他应用占用。
