# 截图准备指南

## 截图要求

Chrome Web Store 需要至少 **1 张截图**，建议准备 **3-5 张**。

### 尺寸要求
- **推荐尺寸**：1280x800 像素
- **最小尺寸**：640x400 像素
- **格式**：PNG 或 JPG
- **最大数量**：5 张

## 建议的截图内容

### 1. 主界面截图（必需）
展示扩展的主界面，包括：
- 侧边栏工具列表
- 主要功能区域
- 品牌图标和标题

**建议内容**：
- 展示 URL 编码/解码工具或加密工具的主界面
- 显示暗黑主题和浅色主题切换功能

### 2. 功能展示截图
展示不同的工具功能：

**截图 2：加密/哈希工具**
- 展示多种算法选择（MD5, SHA, AES, HMAC 等）
- 显示大小写切换功能
- 展示加密/解密操作

**截图 3：JSON 格式化工具**
- 展示 JSON 格式化、压缩、验证功能
- 显示格式化的 JSON 代码

**截图 4：文本处理工具**
- 展示文本去重、排序、大小写转换等功能
- 显示文本统计信息

**截图 5：其他工具集合**
- 展示 UUID 生成、正则表达式测试、二维码生成等
- 显示多个工具的使用场景

## 如何截图

### 方法一：使用浏览器开发者工具

1. **打开扩展**：
   - 在 Chrome 中加载扩展
   - 点击扩展图标打开弹窗

2. **调整窗口大小**：
   - 扩展默认尺寸：720x480
   - 可以使用浏览器缩放或截图工具调整

3. **截图**：
   - Mac: `Cmd + Shift + 4` 选择区域
   - Windows: `Win + Shift + S` 截图工具
   - 或使用浏览器扩展截图工具

### 方法二：使用截图工具

推荐工具：
- **Mac**: CleanShot X, Snagit
- **Windows**: Snagit, ShareX
- **跨平台**: Lightshot, Greenshot

### 方法三：使用在线工具

1. 使用 Chrome 扩展（如 Awesome Screenshot）
2. 使用在线截图工具调整尺寸

## 截图优化建议

1. **突出核心功能**：
   - 确保主要功能清晰可见
   - 使用高对比度的主题（暗黑或浅色）

2. **展示多样性**：
   - 展示不同的工具
   - 展示不同的操作场景

3. **保持一致性**：
   - 使用相同的主题（暗黑或浅色）
   - 保持相同的窗口尺寸

4. **添加标注（可选）**：
   - 可以添加文字说明关键功能
   - 使用箭头指向重要特性

## 文件命名和存放位置

### 存放位置

建议创建 `store-assets/` 文件夹存放截图：

```
devtools-extension/
└── store-assets/
    ├── screenshot-1-main-interface.png
    ├── screenshot-2-crypto-tools.png
    ├── screenshot-3-json-formatter.png
    ├── screenshot-4-text-tools.png
    └── screenshot-5-all-tools.png
```

**注意**：`store-assets/` 文件夹已在 `.gitignore` 中，不会被提交到 Git。

### 文件命名建议

保存截图时使用清晰的命名：
```
screenshot-1-main-interface.png
screenshot-2-crypto-tools.png
screenshot-3-json-formatter.png
screenshot-4-text-tools.png
screenshot-5-all-tools.png
```

或者使用简单的命名：
```
screenshot1.png
screenshot2.png
screenshot3.png
```

## 检查清单

- [ ] 至少 1 张截图（必需）
- [ ] 推荐 3-5 张截图
- [ ] 尺寸：1280x800 或 640x400
- [ ] 格式：PNG 或 JPG
- [ ] 文件大小合理（每张 < 5MB）
- [ ] 截图清晰，功能可见
- [ ] 展示主要功能和特性

## 上传到 Chrome Web Store

在 Chrome Web Store 开发者控制台：
1. 进入"商店信息"部分
2. 找到"截图"部分
3. 点击"上传截图"
4. 选择准备好的截图文件
5. 可以调整顺序（第一张会作为主图）

