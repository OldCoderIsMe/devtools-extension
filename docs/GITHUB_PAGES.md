# GitHub Pages 部署指南

本指南将帮助你将 DevTools Suite 部署到 GitHub Pages。

## 📋 前置条件

1. ✅ GitHub 仓库已设置为公开（Public）
2. ✅ 代码已推送到 GitHub
3. ✅ 已安装 Node.js 和 npm

## 🚀 快速部署步骤

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

## ⚙️ 配置说明

### 修改部署路径

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

### 项目在子目录的情况

如果项目在仓库的子目录中（如 `king-of-tools/devtools-extension`），工作流已经配置好了 `working-directory`，无需修改。

## 🔍 常见问题

### 1. 页面显示 404

**原因**：`base` 路径配置不正确

**解决方法**：
- 检查 `.github/workflows/deploy.yml` 中的 `BASE_PATH` 是否与仓库名称匹配
- 确保 `vite.config.ts` 正确读取了 `BASE_PATH` 环境变量

### 2. 资源文件加载失败（CSS/JS 404）

**原因**：构建时的 `base` 路径与实际部署路径不匹配

**解决方法**：
- 重新检查并修改 `BASE_PATH` 环境变量
- 重新构建和部署

### 3. GitHub Actions 部署失败

**可能原因**：
- 仓库未启用 GitHub Pages
- 权限不足（需要仓库的 Admin 权限）
- 工作流文件语法错误

**解决方法**：
1. 检查仓库 Settings → Pages 是否已启用
2. 检查 Actions 标签页中的错误信息
3. 确保工作流文件语法正确

### 4. 如何部署到自定义域名

1. 在仓库根目录创建 `CNAME` 文件，内容为你的域名：
   ```
   example.com
   ```

2. 修改 `.github/workflows/deploy.yml` 中的 `BASE_PATH` 为 `/`：
   ```yaml
   BASE_PATH: /
   ```

3. 在你的域名 DNS 设置中添加 CNAME 记录，指向 `你的用户名.github.io`

## 📝 更新部署

每次更新代码后：

1. **使用 GitHub Actions（自动）**：
   ```bash
   git add .
   git commit -m "更新内容"
   git push
   ```
   GitHub Actions 会自动构建和部署

2. **手动部署**：
   ```bash
   npm run build
   # 然后将 dist 文件夹的内容推送到 gh-pages 分支
   ```

## 🔗 相关链接

- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html#github-pages)

## ✅ 部署检查清单

部署前请确认：

- [ ] 仓库已设置为公开（Public）
- [ ] GitHub Pages 已启用（Settings → Pages）
- [ ] `.github/workflows/deploy.yml` 文件存在
- [ ] `BASE_PATH` 配置正确（与仓库名称匹配）
- [ ] 代码已推送到 GitHub
- [ ] GitHub Actions 工作流运行成功

部署完成后，你的网站将在几分钟内可用！
