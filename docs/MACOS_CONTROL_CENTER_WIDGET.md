# macOS Control Center Widget 实现方案评估

## 概述

本文档评估了将年度倒计时功能添加到 macOS Control Center 的可行性和实现方案。

## 技术限制

### 1. Electron 应用的限制

**关键发现：Electron 应用无法直接创建系统级的 Control Center Widget**

- Electron 应用是跨平台的 Web 技术栈（Chromium + Node.js）
- macOS Control Center Widget 需要使用 Apple 的原生框架：**SwiftUI + WidgetKit**
- Electron 没有官方 API 来注册系统级的 Control Widget 或嵌入到系统界面中
- 系统级 Widget 需要作为 `.appex` 扩展嵌入到原生 macOS 应用中

### 2. macOS Control Center Widget 要求

根据 Apple 官方文档（macOS Tahoe 及以后版本）：

- **必须使用 SwiftUI + WidgetKit** 构建
- 需要创建 Widget Extension（`.appex`）
- 必须嵌入到原生 macOS 应用中
- 需要适当的 entitlements 和 Info.plist 配置
- 支持 `ControlWidget` 或 `ControlWidgetToggle` 类型

## 可行方案

### 方案 1：在 Electron 应用中模拟 Control Center 风格（推荐）

**优点：**
- ✅ 完全可行，无需原生开发
- ✅ 保持跨平台兼容性
- ✅ 可以创建独立的浮动窗口
- ✅ 可以添加到菜单栏（Tray）
- ✅ 样式可以完全模仿 Control Center 的外观

**实现方式：**
1. 创建独立的 Electron 窗口，样式类似 Control Center
2. 可以设置为始终置顶、无边框、透明背景
3. 添加到系统菜单栏（Tray）作为快速访问入口
4. 支持快捷键快速显示/隐藏

**代码示例：**
```javascript
// 在 electron/main.js 中创建 Control Center 风格的窗口
function createCountdownWidget() {
  const widgetWindow = new BrowserWindow({
    width: 320,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  
  // 加载年度倒计时页面
  widgetWindow.loadURL('http://localhost:5173/#/widget/year-countdown');
}
```

### 方案 2：创建原生 SwiftUI Widget Extension（需要混合架构）

**优点：**
- ✅ 真正的系统级集成
- ✅ 可以添加到 Control Center
- ✅ 系统级别的自动更新和刷新

**缺点：**
- ❌ 需要原生 macOS 开发（Swift/SwiftUI）
- ❌ 需要维护两套代码（Electron + Swift）
- ❌ 数据同步需要 IPC 或共享存储
- ❌ 增加构建复杂度

**实现步骤：**
1. 创建独立的 SwiftUI macOS 应用
2. 添加 Widget Extension target
3. 实现 `ControlWidget` 或 `ControlWidgetToggle`
4. 通过 App Groups 或 IPC 与 Electron 应用通信（如果需要）

**代码示例（SwiftUI）：**
```swift
import WidgetKit
import SwiftUI

struct YearCountdownControl: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: "YearCountdown") {
            ControlWidgetButton(action: {}) {
                VStack {
                    Text("2026")
                        .font(.headline)
                    Text("4%")
                        .font(.title2)
                    Text("350일 남음")
                        .font(.caption)
                }
            }
        }
    }
}
```

### 方案 3：使用第三方库模拟 Control Center UI（仅 UI 风格）

**优点：**
- ✅ 可以创建类似 Control Center 的 UI 组件
- ✅ 纯前端实现，无需原生代码

**缺点：**
- ❌ 仍然是应用内 UI，不是系统级 Widget
- ❌ 无法添加到真正的 Control Center

**实现方式：**
- 使用 CSS 和 HTML 创建类似 Control Center 的圆角卡片样式
- 可以创建独立的 Electron 窗口来展示

## 推荐方案

### 短期方案（立即可行）

**采用方案 1：在 Electron 应用中创建 Control Center 风格的独立窗口**

实现步骤：
1. ✅ 已创建年度倒计时工具组件（`YearCountdownTool.vue`）
2. 创建独立的 Electron 窗口用于显示年度倒计时
3. 添加到菜单栏（Tray）作为快速访问入口
4. 支持快捷键显示/隐藏
5. 窗口样式完全模仿 Control Center 的外观

**优点：**
- 快速实现，无需学习 Swift/SwiftUI
- 保持代码库统一（纯 JavaScript/TypeScript）
- 跨平台兼容
- 用户体验接近原生 Control Center Widget

### 长期方案（如果需要真正的系统集成）

**采用方案 2：创建原生 SwiftUI Widget Extension**

如果未来需要真正的系统级集成，可以考虑：
1. 创建一个轻量级的 SwiftUI macOS 应用
2. 实现 Widget Extension
3. 与 Electron 应用通过 IPC 或文件系统共享数据
4. 或者完全独立运行（不依赖 Electron 应用）

## 实现建议

### 立即实现（方案 1）

1. **创建独立窗口**
   - 在 `electron/main.js` 中添加创建年度倒计时窗口的函数
   - 窗口尺寸：320x400（类似 Control Center Widget）
   - 无边框、透明背景、圆角设计

2. **添加到菜单栏**
   - 在 Tray 菜单中添加"年度倒计时"选项
   - 点击后显示/隐藏窗口

3. **快捷键支持**
   - 添加全局快捷键（如 `Cmd+Shift+Y`）
   - 快速显示/隐藏年度倒计时窗口

4. **样式优化**
   - 使用与图片中类似的深色主题
   - 圆角矩形设计
   - 点阵进度可视化
   - 响应式布局

### 未来考虑（方案 2）

如果用户强烈需要真正的系统级 Control Center Widget：
1. 评估原生开发成本
2. 考虑创建独立的 SwiftUI 应用
3. 或者作为 Electron 应用的配套应用发布

## 总结

- **当前最佳方案**：在 Electron 应用中创建 Control Center 风格的独立窗口
- **技术限制**：Electron 无法直接创建系统级 Control Center Widget
- **用户体验**：独立窗口方案可以提供接近原生的体验
- **实现难度**：方案 1 简单，方案 2 需要原生开发经验

## 参考资料

- [Apple WidgetKit Documentation](https://developer.apple.com/documentation/widgetkit)
- [macOS Control Widgets (WWDC 2024)](https://developer.apple.com/videos/play/wwdc2024/10157/)
- [Electron BrowserWindow API](https://www.electronjs.org/docs/latest/api/browser-window)
