# 发布到 Chrome Web Store 快速指南

## 快速步骤

1. **准备图标** → ✅ 已完成（brand-icon.png, brand-icon-light.png，自动生成所需尺寸）
2. **准备截图** → 📋 参考 [SCREENSHOTS.md](./SCREENSHOTS.md)（至少 1 张）
3. **更新 manifest.json** → ✅ 已完成（构建脚本自动配置）
4. **构建项目** → ✅ 已完成（运行 `npm run build`）
5. **打包 ZIP** → ✅ 已完成（运行 `npm run package`，文件：devtools-suite-v0.1.0.zip）
6. **注册开发者** → https://chrome.google.com/webstore/devconsole（需支付 $5）
7. **上传提交** → 在开发者控制台上传 ZIP 并填写商店信息（参考下方模板）

## 详细步骤

详细步骤请参考 [SUBMIT_GUIDE.md](./SUBMIT_GUIDE.md)。

## 图标和截图要求

### 图标
- **必需**：128x128 PNG（用于商店展示）
- **推荐**：16x16, 48x48 PNG（用于扩展界面）
- 位置：`icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`

### 截图
- **必需**：至少 1 张
- **推荐**：3-5 张
- 尺寸：1280x800 或 640x400
- 格式：PNG 或 JPG
- 位置：`store-assets/screenshot1.png` 等

## 打包命令

### 方法一：自动打包（推荐）

```bash
npm run package
```

这会自动完成：
1. 构建项目
2. 生成图标
3. 创建 ZIP 包（`devtools-suite-v0.1.0.zip`）

### 方法二：手动打包

```bash
# 1. 构建项目
npm run build

# 2. 进入 dist 目录
cd dist

# 3. 创建 ZIP（Mac/Linux）
zip -r ../devtools-suite-v0.1.0.zip . -x "*/README.md" -x "*/.gitkeep" -x "*/.DS_Store"

# Windows 用户可以使用图形界面压缩 dist 文件夹内的所有文件
```

**重要**：ZIP 文件应该包含 `dist` 文件夹**内部**的文件，解压后直接看到 `manifest.json`。

## 商店信息模板

### 简短描述（最多 132 字符）
```
常用开发小工具集合：URL编码、加密哈希、时间戳转换、JSON格式化、文本处理、UUID生成、正则测试、二维码生成、文本对比等。所有计算在本地完成，保护隐私安全。
```

### 详细描述（最多 16,000 字符）
```
DevTools Suite 是一个功能丰富的 Chrome 浏览器扩展，为开发者提供常用的工具集合。

主要功能：

🔗 URL 编码/解码
- URL 编码和解码
- 支持批量处理

🔐 加密/哈希工具
- Hash 算法：MD5、SHA1、SHA256、SHA512
- Base64 编码/解码
- AES 加密：AES128/AES256 加密/解密
- HMAC：HMAC-MD5、HMAC-SHA1、HMAC-SHA256、HMAC-SHA512
- 支持大小写切换

⏰ 时间戳转换
- 时间戳（秒/毫秒）→ 本地时间
- 日期时间 → 时间戳（毫秒）

📄 JSON 格式化工具
- JSON 格式化（美化）
- JSON 压缩
- JSON 验证
- JSON 转义/反转义

📝 文本处理工具
- 文本去重（按行）
- 文本排序（按行，支持升序/降序）
- 大小写转换（大写/小写/首字母大写/驼峰命名）
- 文本统计（字符数、单词数、行数、段落数）

🆔 UUID/随机字符串生成器
- UUID v4 生成
- 随机字符串生成（可配置字符集和长度）
- 随机密码生成（可配置字符类型）
- 支持批量生成

🔍 正则表达式测试工具
- 正则匹配测试
- 支持全局、忽略大小写、多行等标志
- 替换预览功能
- 显示匹配结果和分组

📱 二维码生成器
- 文本/URL 转二维码
- 可配置尺寸（200-500px）
- 支持下载二维码图片

🔄 文本差异对比工具
- 按行对比
- 按字符对比
- 高亮显示新增/删除/未改变的内容
- 显示统计信息

隐私安全：
- 所有计算都在本地浏览器中完成
- 不会上传任何数据到服务器
- 保护您的隐私安全

技术栈：
- Vue 3 + TypeScript
- 所有加密算法使用 crypto-js 库
- 二维码生成使用 qrcode 库
```

## 隐私政策模板

如果创建隐私政策页面，可以使用以下内容：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DevTools Suite - 隐私政策</title>
</head>
<body>
    <h1>DevTools Suite 隐私政策</h1>
    
    <h2>数据收集</h2>
    <p>DevTools Suite 不收集、存储或传输任何用户数据。</p>
    
    <h2>本地处理</h2>
    <p>所有计算和处理都在您的本地浏览器中完成，不会上传任何数据到服务器。</p>
    
    <h2>存储</h2>
    <p>扩展使用 Chrome Storage API 仅在本地存储用户设置，这些数据不会离开您的设备。</p>
    
    <h2>第三方服务</h2>
    <p>扩展不使用任何第三方服务或分析工具。</p>
    
    <h2>更新</h2>
    <p>本隐私政策可能会更新，更新后的版本将在本页面发布。</p>
    
    <p>最后更新：2025年1月</p>
</body>
</html>
```

## 检查清单

提交前请确认：

- [x] 图标文件已准备并放在 `icons/` 文件夹（✅ brand-icon.png, brand-icon-light.png）
- [x] manifest.json 中的图标路径正确（✅ 构建脚本自动配置，已生成 icon16.png, icon48.png, icon128.png）
- [x] 版本号已更新（✅ 当前：0.1.0）
- [x] 项目已构建成功（✅ 运行 `npm run build` 已验证）
- [x] dist 文件夹包含所有必要文件（✅ 已验证：manifest.json, index.html, assets/, icons/）
- [x] ZIP 包已创建（✅ 运行 `npm run package` 自动创建，文件：devtools-suite-v0.1.0.zip）
- [x] ZIP 包大小 < 100MB（✅ 当前大小：2.62 MB，远小于限制）
- [x] 截图已准备（✅ 已准备 5 张截图：首页-深色.png, 首页-浅色.png, md5.png, json格式化.png, 时间戳转换.png）
- [x] 商店描述已准备（✅ 文档中已有模板，见上方"商店信息模板"）
- [x] 隐私政策已准备（✅ 文档中已有模板，见上方"隐私政策模板"）
- [ ] 开发者账号已注册（需要支付 $5 注册费，访问 https://chrome.google.com/webstore/devconsole）
- [ ] 上传到 Chrome Web Store（📋 详细步骤见 [SUBMIT_GUIDE.md](./SUBMIT_GUIDE.md)）

## 常见问题

**Q: 图标是必需的吗？**
A: 128x128 图标是必需的，16x16 和 48x48 是推荐的。

**Q: 截图需要多少张？**
A: 至少 1 张，建议 3-5 张展示不同功能。

**Q: 隐私政策是必需的吗？**
A: 如果扩展不收集数据，可以在商店描述中说明，但建议创建隐私政策页面。

**Q: 审核需要多长时间？**
A: 通常 1-3 个工作日。

