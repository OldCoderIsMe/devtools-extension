# macOS 顶部菜单栏显示条件

在 Electron 应用中，要让 macOS 桌面顶部显示菜单栏，需要满足以下条件：

## 必要条件

### 1. 窗口必须有框架（Frame）

```javascript
const windowOptions = {
  frame: true,  // 必须为 true
  // ...
};
```

**说明：**
- `frame: true` - 显示窗口框架和标题栏，菜单栏会显示在顶部
- `frame: false` - 无边框窗口，菜单栏不会显示（除非手动实现）

### 2. 必须设置应用菜单

```javascript
const { Menu } = require('electron');

function createMenu() {
  const template = [
    {
      label: app.getName(),
      submenu: [
        // 菜单项...
      ],
    },
    // 更多菜单...
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);  // 必须调用这个方法
}
```

**说明：**
- 必须调用 `Menu.setApplicationMenu(menu)` 才能显示菜单栏
- 如果不设置，菜单栏区域会显示为空白或系统默认菜单

### 3. 必须在应用启动时创建菜单

```javascript
app.whenReady().then(() => {
  createWindow();
  createMenu();  // 必须在应用就绪后创建菜单
  // ...
});
```

## 可选配置

### titleBarStyle（不影响菜单栏显示）

`titleBarStyle` 只影响标题栏的样式，**不影响菜单栏的显示**：

```javascript
const windowOptions = {
  frame: true,
  titleBarStyle: 'hiddenInset',  // 可选值：
  // - 'default' - 标准标题栏
  // - 'hidden' - 隐藏标题栏，但保留窗口控制按钮
  // - 'hiddenInset' - 隐藏标题栏，窗口控制按钮内嵌
  // - 'customButtonsOnHover' - 悬停时显示窗口控制按钮
};
```

**注意：** 即使使用 `hidden` 或 `hiddenInset`，只要 `frame: true` 且设置了 `Menu.setApplicationMenu()`，菜单栏仍然会显示在顶部。

## 当前配置检查

### ✅ 当前应用已满足所有条件

1. **窗口框架：**
   ```javascript
   frame: true  // ✅ 已设置
   ```

2. **应用菜单：**
   ```javascript
   Menu.setApplicationMenu(menu);  // ✅ 已调用
   ```

3. **菜单创建时机：**
   ```javascript
   app.whenReady().then(() => {
     createMenu();  // ✅ 在应用就绪后创建
   });
   ```

## 菜单栏不显示的常见原因

1. **frame 设置为 false**
   - 解决：设置为 `true`

2. **没有调用 Menu.setApplicationMenu()**
   - 解决：确保调用了 `Menu.setApplicationMenu(menu)`

3. **菜单在窗口创建之前创建**
   - 解决：在 `app.whenReady()` 中创建菜单

4. **应用未正确启动**
   - 解决：检查应用启动流程

5. **macOS 系统设置**
   - 某些 macOS 版本或设置可能影响菜单栏显示
   - 检查系统偏好设置 > 通用 > 自动隐藏和显示菜单栏

## 测试菜单栏是否正常

1. 启动应用
2. 检查桌面顶部是否显示应用名称（如 "DevTools Suite"）
3. 点击应用名称，应该显示下拉菜单
4. 检查是否有其他菜单项（编辑、视图、窗口、帮助等）

## 示例：最小化配置

```javascript
const { app, BrowserWindow, Menu } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: true,  // 必须为 true
  });
}

function createMenu() {
  const template = [
    {
      label: app.getName(),
      submenu: [
        { role: 'quit' },
      ],
    },
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);  // 必须调用
}

app.whenReady().then(() => {
  createWindow();
  createMenu();  // 必须在应用就绪后创建
});
```

## 总结

要让 macOS 顶部菜单栏显示，**必须同时满足**：
1. ✅ `frame: true`
2. ✅ 调用 `Menu.setApplicationMenu(menu)`
3. ✅ 在 `app.whenReady()` 中创建菜单

当前应用配置正确，菜单栏应该正常显示。
