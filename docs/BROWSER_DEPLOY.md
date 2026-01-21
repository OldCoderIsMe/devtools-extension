# 浏览器部署指南

将 DevTools Suite 部署为纯浏览器网页应用，无需安装扩展，直接在浏览器中访问使用。

## 📋 目录

1. [快速部署](#快速部署)
2. [部署到 GitHub Pages](#部署到-github-pages)
3. [部署到其他平台](#部署到其他平台)
4. [配置说明](#配置说明)
5. [常见问题](#常见问题)

## 🚀 快速部署

### 使用 npm 脚本（推荐）

项目已配置好构建脚本，直接运行：

```bash
# 1. 安装依赖
npm install

# 2. 构建纯浏览器版本
npm run build

# 3. 预览（可选）
npm run preview
```

构建完成后，`dist` 文件夹中的文件就是可以部署的静态文件。

### 手动构建

如果需要自定义部署路径（如部署到子目录）：

```bash
# 1. 设置环境变量（可选）
# 如果部署到子目录，例如：https://example.com/devtools/
# 需要修改 vite.config.ts 中的 base 配置

# 2. 构建
npm run build
```

## 📦 部署到 GitHub Pages

### 方法一：使用 GitHub Actions（推荐，自动部署）

项目已配置好 GitHub Actions 工作流，会自动部署到 GitHub Pages。

#### 1. 启用 GitHub Pages

1. 进入你的 GitHub 仓库
2. 点击 **Settings**（设置）
3. 在左侧菜单中找到 **Pages**
4. 在 **Source**（源）部分：
   - 选择 **GitHub Actions** 作为部署源
5. 保存设置

#### 2. 推送代码触发部署

```bash
# 确保代码已提交
git add .
git commit -m "配置 GitHub Pages 部署"
git push origin main  # 或 master，取决于你的默认分支
```

#### 3. 查看部署状态

1. 进入仓库的 **Actions** 标签页
2. 查看工作流运行状态
3. 部署成功后，访问：`https://你的用户名.github.io/仓库名称/`

### 方法二：手动部署

如果需要手动部署：

#### 1. 构建项目

```bash
cd devtools-extension

# 安装依赖（如果还没安装）
npm install

# 构建项目
# 如果部署到子目录（如 /仓库名称/），设置 BASE_PATH
BASE_PATH=/你的仓库名称/ npm run build

# 如果部署到根目录，使用：
# BASE_PATH=/ npm run build
```

#### 2. 配置 GitHub Pages

1. 进入仓库的 **Settings** → **Pages**
2. 在 **Source** 部分：
   - 选择 **Deploy from a branch**（从分支部署）
   - 选择分支：`main` 或 `master`
   - 选择文件夹：`/devtools-extension/dist`（如果项目在子目录）
   - 或选择 `/ (root)`（如果项目在根目录）
3. 点击 **Save**（保存）

#### 3. 访问网站

部署完成后（可能需要几分钟），访问：
- `https://你的用户名.github.io/仓库名称/`

### 配置说明

#### 修改部署路径

如果你的仓库名称不是 `devtools-extension`，需要修改 `.github/workflows/deploy.yml` 文件：

```yaml
env:
  # 修改为你的仓库名称
  BASE_PATH: /你的仓库名称/
```

或者如果部署到根域名（使用自定义域名），设置为：

```yaml
env:
  BASE_PATH: /
```

#### 项目在子目录的情况

如果项目在仓库的子目录中（如 `king-of-tools/devtools-extension`），工作流已经配置好了 `working-directory`，无需修改。

### GitHub Pages 常见问题

#### 1. 页面显示 404

**原因**：`base` 路径配置不正确

**解决方法**：
- 检查 `.github/workflows/deploy.yml` 中的 `BASE_PATH` 是否与仓库名称匹配
- 确保 `vite.config.ts` 正确读取了 `BASE_PATH` 环境变量

#### 2. 资源文件加载失败（CSS/JS 404）

**原因**：构建时的 `base` 路径与实际部署路径不匹配

**解决方法**：
- 重新检查并修改 `BASE_PATH` 环境变量
- 重新构建和部署

#### 3. GitHub Actions 部署失败

**可能原因**：
- 仓库未启用 GitHub Pages
- 权限不足（需要仓库的 Admin 权限）
- 工作流文件语法错误

**解决方法**：
1. 检查仓库 Settings → Pages 是否已启用
2. 检查 Actions 标签页中的错误信息
3. 确保工作流文件语法正确

#### 4. 如何部署到自定义域名

1. 在仓库根目录创建 `CNAME` 文件，内容为你的域名：
   ```
   example.com
   ```

2. 修改 `.github/workflows/deploy.yml` 中的 `BASE_PATH` 为 `/`：
   ```yaml
   BASE_PATH: /
   ```

3. 在你的域名 DNS 设置中添加 CNAME 记录，指向 `你的用户名.github.io`

## 🌐 部署到其他平台

### 平台对比

| 平台 | 免费计划 | 付费计划 | 推荐场景 |
|------|---------|---------|---------|
| **GitHub Pages** | ✅ 公开仓库免费 | 💰 私有仓库需 Pro ($4/月) | 开源项目 |
| **Netlify** | ✅ 100GB 带宽/月 | 💰 Pro ($19/月) | 需要 CI/CD |
| **Vercel** | ✅ 100GB 带宽/月 | 💰 Pro ($20/月) | 需要 CI/CD |
| **Cloudflare Pages** | ✅ 无限带宽 | 💰 无付费计划 | 高流量项目 |
| **自建服务器** | - | 💰 服务器费用 | 完全控制 |

**推荐**：
- **开源项目**：GitHub Pages（完全免费）
- **私有项目**：Netlify 或 Vercel（免费额度通常足够）
- **高流量**：Cloudflare Pages（无限带宽）

### Netlify

#### 通过 Netlify Dashboard

1. 登录 [Netlify](https://www.netlify.com/)
2. 点击 "New site from Git"
3. 连接 GitHub 仓库
4. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`

#### 通过 Netlify CLI

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 构建项目
npm run build

# 部署
netlify deploy --prod --dir=dist
```

### Vercel

#### 通过 Vercel Dashboard

1. 登录 [Vercel](https://vercel.com/)
2. 点击 "New Project"
3. 导入 GitHub 仓库
4. 构建设置：
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 构建项目
npm run build

# 部署
vercel --prod
```

### 自建服务器（Nginx）

1. **构建项目**：
   ```bash
   npm run build
   ```

2. **上传文件**：
   将 `dist` 文件夹中的所有文件上传到服务器

3. **配置 Nginx**：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **重启 Nginx**：
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 其他静态托管服务

项目构建后的 `dist` 文件夹可以部署到任何静态文件托管服务：

- **Cloudflare Pages**
- **Firebase Hosting**
- **AWS S3 + CloudFront**
- **Azure Static Web Apps**
- **Surge.sh**
- **等等**

## 🔧 配置说明

### 修改部署路径

如果部署到子目录（如 `https://example.com/devtools/`），需要修改 `vite.config.ts`：

```typescript
export default defineConfig({
  // ... 其他配置
  base: '/devtools/',  // 修改为你的子目录路径
  // ...
});
```

然后重新构建：
```bash
npm run build
```

### 环境变量

项目支持通过环境变量控制构建行为：

- `ELECTRON=1`：构建 Electron 版本（使用相对路径）
- `BASE_PATH=/path/`：设置部署基础路径（浏览器版本）
- 默认：构建浏览器版本（使用绝对路径）

## 📝 部署检查清单

部署前请确认：

- [ ] 已运行 `npm run build` 构建项目
- [ ] `dist` 文件夹包含所有必要文件：
  - [ ] `index.html`
  - [ ] `assets/` 文件夹（包含 JS 和 CSS）
  - [ ] `icons/` 文件夹（如果存在）
- [ ] 如果部署到子目录，已修改 `base` 配置
- [ ] 已测试本地预览（`npm run preview`）

## 🌐 访问和使用

部署完成后，用户可以通过浏览器直接访问：

- 所有功能都在本地浏览器中运行
- 不需要安装任何扩展或应用
- 支持所有现代浏览器（Chrome、Firefox、Safari、Edge 等）
- 响应式设计，支持桌面和移动设备

## ⚠️ 注意事项

1. **浏览器兼容性**：
   - 需要支持 ES6+ 的现代浏览器
   - 推荐使用最新版本的 Chrome、Firefox、Safari 或 Edge

2. **功能限制**：
   - 纯浏览器版本无法使用 Chrome Storage API（扩展专用）
   - 数据存储会使用浏览器的 localStorage
   - 其他功能与扩展版本完全相同

3. **性能**：
   - 首次加载可能需要下载所有资源文件
   - 建议启用 CDN 或压缩优化

4. **HTTPS**：
   - 某些功能（如 Service Worker）需要 HTTPS
   - 建议使用 HTTPS 部署

## 🔄 更新部署

更新内容后：

1. 修改代码
2. 运行 `npm run build` 重新构建
3. 重新部署 `dist` 文件夹

如果使用 CI/CD（如 GitHub Actions），可以配置自动部署。

## 📚 相关文档

- [README.md](../README.md) - 项目主文档
- [ELECTRON_QUICKSTART.md](./ELECTRON_QUICKSTART.md) - Electron 桌面应用部署
- [CHROME_EXTENSION_DEPLOY.md](./CHROME_EXTENSION_DEPLOY.md) - Chrome 扩展部署
