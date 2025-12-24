# DevTools Suite v1.0.3 需求文档

## 📋 版本概述

v1.0.3 版本将引入工具分类系统，将现有工具分为"本地工具"和"AI工具"两大类，并新增多个实用工具，包括 Unicode 转换、代码在线执行和 AI 画图功能。

## 🎯 核心目标

1. **工具分类系统**：将工具按类型分类，提升用户体验
2. **Unicode 转换工具**：支持 Unicode 和中文互转
3. **代码执行工具**：支持在线执行 PHP、JavaScript、Python 代码
4. **AI 画图工具**：集成开源 AI 画图功能

## ✨ 新功能需求

### 1. 工具分类系统

#### 1.1 分类结构
- **本地工具**（Local Tools）：所有计算在本地完成，无需网络
  - 现有所有工具归入此类
  - URL 编码/解码
  - 加密/哈希工具
  - 时间戳转换
  - JSON 格式化
  - 文本处理
  - UUID/随机字符串
  - 正则表达式
  - 二维码生成
  - 文本差异对比
  - **新增：Unicode 转换工具**

- **AI 工具**（AI Tools）：需要 AI 能力支持的工具
  - **新增：AI 画图工具**（集成 next-ai-draw-io）

#### 1.2 UI 改进
- 侧边栏增加分类标签/分组
- 支持按分类筛选工具
- 保持现有工具列表的展示方式，增加分类标识

### 2. Unicode 转换工具（本地工具）

#### 2.1 功能需求
- **Unicode 转中文**：将 Unicode 编码（如 `\u4e2d\u6587`）转换为中文字符
- **中文转 Unicode**：将中文字符转换为 Unicode 编码
- **支持格式**：
  - `\uXXXX` 格式（4位十六进制）
  - `U+XXXX` 格式
  - 批量转换（多行文本）
- **实时转换**：输入时自动转换并显示结果
- **复制功能**：一键复制转换结果

#### 2.2 技术实现
- 使用 JavaScript 原生 `String.fromCharCode()` 和 `charCodeAt()` API
- 支持 UTF-16 编码转换
- 错误处理：无效 Unicode 编码提示

### 3. 代码执行工具（本地工具）

#### 3.1 功能需求
- **支持语言**：
  - JavaScript（使用浏览器原生执行环境）
  - Python（使用 Pyodide 或类似方案）
  - PHP（使用 PHP.wasm 或类似方案）

#### 3.2 功能特性
- **代码编辑器**：支持语法高亮
- **执行按钮**：点击执行代码
- **输出显示**：显示执行结果、错误信息
- **控制台输出**：支持 `console.log` 等输出
- **执行时间**：显示代码执行耗时
- **代码示例**：提供常用代码模板
- **安全限制**：
  - 沙箱环境执行
  - 限制执行时间（防止死循环）
  - 限制资源使用

#### 3.3 技术实现方案

**JavaScript**
- 使用 `eval()` 或 `Function()` 构造函数（需严格沙箱化）
- 或使用 Web Worker 隔离执行环境

**Python**
- 使用 [Pyodide](https://pyodide.org/)（Python 的 WebAssembly 实现）
- 支持标准库和常用第三方库

**PHP**
- 使用 [PHP.wasm](https://php-wasm.net/)（PHP 的 WebAssembly 实现）
- 或使用在线 API（不推荐，涉及隐私）

#### 3.4 安全考虑
- ⚠️ **重要**：代码执行功能存在安全风险
- 建议添加使用警告提示
- 限制网络访问、文件系统访问
- 考虑添加代码审查机制或白名单

### 4. AI 画图工具（AI 工具）

#### 4.1 功能需求
- **集成开源项目**：[next-ai-draw-io](https://github.com/DayuanJiang/next-ai-draw-io)
- **核心功能**：
  - 通过自然语言描述生成流程图、架构图等
  - 支持 AI 修改和优化图表
  - 支持导出 draw.io 格式文件
  - 支持图片上传并转换为图表

#### 4.2 集成方案
- **方案一（推荐）**：iframe 嵌入
  - 将 next-ai-draw-io 部署为独立服务
  - 在工具页面中通过 iframe 嵌入
  - 优点：隔离性好，维护简单
  - 缺点：需要额外部署服务

- **方案二**：组件集成
  - 将 next-ai-draw-io 的核心组件提取并集成
  - 优点：体验更好，无缝集成
  - 缺点：集成复杂度高，需要处理依赖

- **方案三**：链接跳转
  - 提供链接跳转到在线服务
  - 优点：实现简单
  - 缺点：体验割裂

#### 4.3 推荐实现
- **第一阶段**：使用 iframe 嵌入方式
- 提供配置选项，允许用户配置 AI 服务提供商和 API Key
- API Key 存储在本地，不上传到服务器

#### 4.4 配置要求
- 支持配置 AI 服务提供商（OpenAI、Anthropic、Google 等）
- 支持配置 API Key（本地存储）
- 提供使用说明和示例

## 📝 其他建议工具

### 本地工具建议

1. **颜色转换工具**
   - RGB ↔ HEX ↔ HSL ↔ HSV
   - 颜色选择器
   - 颜色调色板生成

2. **进制转换工具**
   - 二进制、八进制、十进制、十六进制互转
   - 支持大数转换

3. **IP 地址工具**
   - IP 地址查询（地理位置、ISP）
   - 子网掩码计算
   - CIDR 计算

4. **SQL 格式化工具**
   - SQL 代码格式化
   - SQL 压缩
   - SQL 语法高亮

5. **Markdown 预览工具**
   - Markdown 实时预览
   - Markdown 转 HTML
   - HTML 转 Markdown

6. **JWT 解析工具**
   - JWT Token 解析
   - Header、Payload 解码
   - 签名验证（需要密钥）

7. **XML 格式化工具**
   - XML 格式化
   - XML 验证
   - XML 压缩

8. **YAML 格式化工具**
   - YAML 格式化
   - YAML 验证
   - YAML ↔ JSON 转换

9. **CSV 处理工具**
   - CSV 转 JSON
   - JSON 转 CSV
   - CSV 格式化

10. **图片处理工具**
    - 图片压缩
    - 图片格式转换
    - 图片尺寸调整
    - Base64 图片编码/解码

### AI 工具建议

1. **AI 代码解释器**
   - 代码注释生成
   - 代码重构建议
   - 代码错误诊断

2. **AI 文本处理**
   - 文本摘要
   - 文本翻译
   - 文本润色

3. **AI 代码生成**
   - 根据描述生成代码
   - 代码补全
   - 代码转换（语言间转换）

## 🎨 UI/UX 改进

### 工具分类展示
- 侧边栏增加分类标签
- 支持折叠/展开分类
- 工具图标增加分类标识（可选）

### 新增工具入口
- Unicode 转换工具：放在"文本处理"附近
- 代码执行工具：独立工具，支持多语言切换
- AI 画图工具：放在 AI 工具分类下

## 🔧 技术实现要点

### 1. 工具分类系统
- 修改 `App.vue` 中的工具列表结构
- 增加分类字段：`category: 'local' | 'ai'`
- 侧边栏支持分类展示

### 2. Unicode 转换
- 创建 `UnicodeTool.vue` 组件
- 实现双向转换逻辑
- 支持批量处理

### 3. 代码执行
- 创建 `CodeRunnerTool.vue` 组件
- 集成代码编辑器（如 Monaco Editor 或 CodeMirror）
- 实现各语言的执行环境
- 添加安全沙箱

### 4. AI 画图
- 创建 `AIDrawTool.vue` 组件
- 集成 next-ai-draw-io（iframe 方式）
- 添加配置面板

## 📦 依赖新增

### 必需依赖
- `pyodide` - Python 执行环境（如果实现 Python 执行）
- `monaco-editor` 或 `codemirror` - 代码编辑器（如果实现代码执行工具）

### 可选依赖
- `php-wasm` - PHP 执行环境（如果实现 PHP 执行）

## ⚠️ 注意事项

1. **代码执行安全**：代码执行功能存在安全风险，需要严格沙箱化
2. **AI 工具隐私**：AI 工具需要 API Key，确保本地存储，不上传服务器
3. **性能考虑**：代码执行和 AI 工具可能消耗较多资源，需要优化
4. **浏览器兼容性**：WebAssembly 功能需要现代浏览器支持

## 📅 开发计划

### Phase 1: 工具分类系统
- [ ] 实现工具分类数据结构
- [ ] 更新侧边栏 UI，支持分类展示
- [ ] 更新工具列表，添加分类标识

### Phase 2: Unicode 转换工具
- [ ] 创建 UnicodeTool 组件
- [ ] 实现 Unicode ↔ 中文转换逻辑
- [ ] 添加批量处理功能
- [ ] 测试各种 Unicode 格式

### Phase 3: 代码执行工具
- [ ] 创建 CodeRunnerTool 组件
- [ ] 集成代码编辑器
- [ ] 实现 JavaScript 执行环境
- [ ] 集成 Pyodide（Python）
- [ ] 集成 PHP.wasm（PHP，可选）
- [ ] 添加安全沙箱
- [ ] 添加执行时间限制

### Phase 4: AI 画图工具
- [ ] 研究 next-ai-draw-io 集成方案
- [ ] 创建 AIDrawTool 组件
- [ ] 实现 iframe 嵌入或组件集成
- [ ] 添加配置面板（API Key 配置）
- [ ] 添加使用说明

### Phase 5: 测试与优化
- [ ] 功能测试
- [ ] 性能优化
- [ ] 安全审查
- [ ] 文档更新

## 📚 文档更新

### README.md 更新
- 添加工具分类说明
- 添加新工具功能介绍
- 添加 AI 工具使用说明
- 更新功能列表表格

### 其他文档
- 更新 ELECTRON_QUICKSTART.md（如需要）
- 创建 AI 工具使用指南（如需要）

## 🔗 参考资源

- [next-ai-draw-io GitHub](https://github.com/DayuanJiang/next-ai-draw-io)
- [Pyodide 文档](https://pyodide.org/)
- [PHP.wasm 文档](https://php-wasm.net/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [CodeMirror](https://codemirror.net/)

## ✅ 验收标准

1. ✅ 工具分类系统正常工作，可以按分类查看工具
2. ✅ Unicode 转换工具支持双向转换，支持批量处理
3. ✅ 代码执行工具至少支持 JavaScript，执行结果正确显示
4. ✅ AI 画图工具可以正常使用，支持配置 API Key
5. ✅ 所有新功能在 Chrome 扩展、网页版、Electron 版本中都能正常工作
6. ✅ 文档已更新，包含新功能说明

---

**文档版本**：v1.0.3  
**创建日期**：2025-01-XX  
**最后更新**：2025-01-XX

