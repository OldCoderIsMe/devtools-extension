# DevTools Suite

一个功能丰富的开发工具集合，支持三种使用方式：Chrome 浏览器扩展、纯浏览器网页应用、macOS 桌面应用。所有计算都在本地完成，不会上传任何数据，保护您的隐私安全。

## 📦 三种使用方式

### 🌐 Chrome 浏览器扩展
作为 Chrome 扩展使用，集成到浏览器中，方便随时调用。

### 🌍 纯浏览器网页应用
部署为静态网站，直接在浏览器中访问使用，无需安装扩展。

**快速部署指南**：查看 [BROWSER_DEPLOY.md](./docs/BROWSER_DEPLOY.md)

### 🖥️ macOS 桌面应用（Electron）
使用 Electron 框架打包为原生 macOS 应用，独立运行，无需浏览器。

**快速开始 macOS 应用**：查看 [ELECTRON_QUICKSTART.md](./docs/ELECTRON_QUICKSTART.md)

## 功能列表

### 🔗 URL 编码 / 解码
- URL 编码和解码
- 支持批量处理

### 🔐 加密/哈希工具
- **Hash 算法**：MD5、SHA1、SHA256、SHA512
- **Base64**：编码/解码
- **AES 加密**：AES128/AES256 加密/解密
- **HMAC**：HMAC-MD5、HMAC-SHA1、HMAC-SHA256、HMAC-SHA512
- 支持大小写切换（Hash 和 HMAC）

### ⏰ 时间戳转换
- 时间戳（秒/毫秒）→ 本地时间
- 日期时间 → 时间戳（毫秒）

### 📄 JSON 格式化工具
- JSON 格式化（美化）
- JSON 压缩
- JSON 验证
- JSON 转义/反转义

### 📝 文本处理工具
- 文本去重（按行）
- 文本排序（按行，支持升序/降序）
- 大小写转换（大写/小写/首字母大写/驼峰命名）
- 文本统计（字符数、单词数、行数、段落数）

### 🆔 UUID/随机字符串生成器
- UUID v4 生成
- 随机字符串生成（可配置字符集和长度）
- 随机密码生成（可配置字符类型）
- 支持批量生成

### 🔍 正则表达式测试工具
- 正则匹配测试
- 支持全局、忽略大小写、多行等标志
- 替换预览功能
- 显示匹配结果和分组

### 📱 二维码生成器
- 文本/URL 转二维码
- 可配置尺寸（200-500px）
- 支持下载二维码图片

### 🔄 文本差异对比工具
- 按行对比
- 按字符对比
- 高亮显示新增/删除/未改变的内容
- 显示统计信息

## 技术栈

### Chrome 扩展
- **框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **加密库**：crypto-js
- **二维码**：qrcode

### macOS 桌面应用
- **框架**：Electron（行业最流行的桌面应用框架）
- **前端**：Vue 3 + TypeScript（复用扩展代码）
- **打包工具**：electron-builder
- **构建工具**：Vite

## 安装步骤

### 1. 安装依赖

```bash
cd devtools-extension
npm install
```

**注意**：如果之前已经安装过依赖，但遇到构建问题，请先删除 `node_modules` 和 `package-lock.json`，然后重新安装：

```bash
rm -rf node_modules package-lock.json
npm install
```

### 2. 构建项目

```bash
npm run build
```

构建完成后，会在项目根目录生成 `dist` 文件夹。

### 3. 选择使用方式

#### 方式 A：Chrome 浏览器扩展

**加载到 Chrome 浏览器**

##### 方法一：开发者模式加载（推荐）

1. **打开 Chrome 扩展管理页面**
   - 在 Chrome 浏览器地址栏输入：`chrome://extensions/`
   - 或者点击右上角三个点菜单 → 更多工具 → 扩展程序

2. **启用开发者模式**
   - 在扩展管理页面右上角，打开"开发者模式"开关

3. **加载扩展**
   - 点击"加载已解压的扩展程序"按钮
   - 选择项目中的 `dist` 文件夹（**注意：不是整个项目文件夹，而是 dist 文件夹**）
   - 点击"选择文件夹"

4. **完成**
   - 扩展加载成功后，会在扩展列表中显示
   - 点击扩展图标即可使用

**⚠️ 常见问题：如果遇到"清单文件缺失或不可读取"错误**

如果加载扩展时提示"清单文件缺失或不可读取"，请按以下步骤操作：

1. **确保已安装最新依赖**
   ```bash
   npm install
   ```

2. **重新构建项目**
   ```bash
   npm run build
   ```

3. **检查 dist 文件夹**
   - 确认 `dist` 文件夹中存在 `manifest.json` 文件
   - 如果不存在，说明构建配置有问题，请检查 `vite.config.ts` 配置

4. **重新加载扩展**
   - 在 Chrome 扩展管理页面，删除之前加载失败的扩展
   - 重新点击"加载已解压的扩展程序"，选择 `dist` 文件夹

##### 方法二：打包为 .crx 文件（可选）

如果需要打包成 `.crx` 文件：

1. 在扩展管理页面，点击"打包扩展程序"
2. 选择 `dist` 文件夹作为扩展根目录
3. 点击"打包扩展程序"
4. 生成的 `.crx` 文件可以分发给其他用户

#### 方式 B：纯浏览器网页应用

将 `dist` 文件夹部署为静态网站，用户可以直接在浏览器中访问使用。

**快速部署**：
```bash
# 构建完成后，预览（可选）
npm run preview

# 然后将 dist 文件夹部署到任何静态托管服务
# 详细部署指南请查看：docs/BROWSER_DEPLOY.md
```

支持的部署平台：
- GitHub Pages
- Netlify
- Vercel
- 自建服务器（Nginx）
- 其他静态托管服务

**详细部署步骤**：查看 [BROWSER_DEPLOY.md](./docs/BROWSER_DEPLOY.md)

## 开发说明

### 开发模式

```bash
npm run dev
```

开发模式下，Vite 会启动开发服务器。但 Chrome 扩展需要加载构建后的文件，所以开发时建议：

1. 运行 `npm run dev` 启动开发服务器（用于热重载）
2. 运行 `npm run build` 构建到 `dist` 目录
3. 在 Chrome 中重新加载扩展（点击扩展卡片上的刷新按钮）

### 项目结构

```
devtools-extension/
├── src/
│   ├── core/           # 核心功能函数
│   │   ├── url.ts      # URL 编码/解码
│   │   ├── hash.ts     # 加密/哈希算法
│   │   ├── time.ts     # 时间戳处理
│   │   ├── json.ts     # JSON 处理
│   │   ├── text.ts     # 文本处理
│   │   └── diff.ts     # 差异对比
│   ├── tools/          # 工具组件
│   │   ├── UrlTool.vue
│   │   ├── Md5Tool.vue
│   │   ├── TimestampTool.vue
│   │   ├── JsonTool.vue
│   │   ├── TextTool.vue
│   │   ├── UuidTool.vue
│   │   ├── RegexTool.vue
│   │   ├── QrcodeTool.vue
│   │   └── DiffTool.vue
│   ├── App.vue         # 主应用组件
│   ├── main.ts         # 入口文件
│   └── styles.css      # 全局样式
├── dist/               # 构建输出目录（构建后生成）
├── index.html          # HTML 入口
├── manifest.json       # Chrome 扩展清单文件
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript 配置
└── vite.config.ts      # Vite 配置
```

### 重新加载扩展

开发过程中，每次修改代码后：

1. 运行 `npm run build` 重新构建
2. 在 Chrome 扩展管理页面（`chrome://extensions/`）
3. 找到 "DevTools Suite" 扩展
4. 点击刷新图标 🔄 重新加载扩展

### 调试

- 右键点击扩展图标 → "检查弹出内容"，可以打开开发者工具进行调试
- 在扩展管理页面，点击"检查视图"也可以打开开发者工具

## 注意事项

1. **隐私安全**：所有计算都在本地浏览器中完成，不会上传任何数据到服务器
2. **数据存储**：扩展使用 Chrome Storage API，数据仅存储在本地
3. **权限说明**：扩展只需要 `storage` 权限，用于本地数据存储

## 版本历史

### v0.1.0
- 初始版本
- 包含 9 个常用开发工具
- 支持 URL 编码、加密哈希、时间戳转换、JSON 格式化、文本处理、UUID 生成、正则测试、二维码生成、文本对比等功能

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

