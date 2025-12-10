# 快速发布指南

## 一键打包

运行以下命令即可完成构建和打包：

```bash
npm run package
```

这会自动：
1. ✅ 构建项目（`npm run build`）
2. ✅ 生成图标（从 brand-icon.png 生成 16x16, 48x48, 128x128）
3. ✅ 创建 ZIP 包（`devtools-suite-v0.1.0.zip`）

## 发布步骤

### 1. ✅ 准备截图（已完成）

已准备 5 张截图：
- 首页-深色.png
- 首页-浅色.png
- md5.png
- json格式化.png
- 时间戳转换.png

### 2. 注册开发者账号

1. 访问：https://chrome.google.com/webstore/devconsole
2. 使用 Google 账号登录
3. 支付 $5 注册费（一次性，永久有效）

### 3. 上传扩展并提交

**详细步骤请参考：[SUBMIT_GUIDE.md](./SUBMIT_GUIDE.md)**

快速步骤：
1. 在开发者控制台点击"新建项目"
2. 上传 `devtools-suite-v0.1.0.zip` 文件
3. 填写商店信息（参考 [PUBLISH.md](./PUBLISH.md) 中的模板）
4. 上传截图（5 张）
5. 提交审核

### 4. 等待审核

- 审核时间：通常 1-3 个工作日
- 审核通过后，扩展会自动发布

## 当前状态

✅ **已完成**：
- 图标文件准备完成
- 项目构建成功
- ZIP 包已创建（2.62 MB）
- 商店描述模板已准备
- 隐私政策模板已准备

📋 **待完成**：
- ✅ 准备截图（已完成 5 张）
- 注册开发者账号并支付费用
- 功能测试验证
- 上传到 Chrome Web Store

## 文件位置

- **ZIP 包**：`devtools-suite-v0.1.0.zip`（项目根目录）
- **构建输出**：`dist/` 文件夹
- **图标文件**：`icons/` 文件夹
- **发布文档**：`docs/PUBLISH.md`
- **截图指南**：`docs/SCREENSHOTS.md`

## 常用命令

```bash
# 开发模式
npm run dev

# 构建项目
npm run build

# 构建并打包
npm run package

# 类型检查
npm run type-check
```

