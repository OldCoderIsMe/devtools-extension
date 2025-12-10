# 图标文件说明

请将图标文件保存到此文件夹，需要以下尺寸：

## 必需的文件

- **icon16.png** - 16x16 像素（扩展小图标）
- **icon48.png** - 48x48 像素（扩展管理页面图标）
- **icon128.png** - 128x128 像素（Chrome Web Store 展示图标，**必需**）

## 如何生成不同尺寸的图标

### 方法一：使用在线工具（推荐）

1. 访问 https://www.favicon-generator.org/ 或 https://realfavicongenerator.net/
2. 上传您的原始图标（建议至少 512x512 或更大）
3. 下载生成的不同尺寸图标
4. 重命名为 `icon16.png`, `icon48.png`, `icon128.png` 并放入此文件夹

### 方法二：使用图像编辑软件

使用 Photoshop、GIMP、在线工具（如 https://www.iloveimg.com/resize-image）等：
1. 打开原始图标
2. 分别导出为 16x16, 48x48, 128x128 像素
3. 保存为 PNG 格式
4. 放入此文件夹

### 方法三：使用命令行工具（Mac/Linux）

如果您有 ImageMagick 或 sips（Mac 自带）：

```bash
# 使用 sips (Mac)
sips -z 16 16 original-icon.png --out icon16.png
sips -z 48 48 original-icon.png --out icon48.png
sips -z 128 128 original-icon.png --out icon128.png

# 使用 ImageMagick
convert original-icon.png -resize 16x16 icon16.png
convert original-icon.png -resize 48x48 icon48.png
convert original-icon.png -resize 128x128 icon128.png
```

## 图标要求

- **格式**：PNG（支持透明背景）
- **尺寸**：严格按照 16x16, 48x48, 128x128 像素
- **质量**：确保在小尺寸下也能清晰识别
- **背景**：建议使用透明背景或与扩展主题一致

## 注意事项

- 128x128 图标是 Chrome Web Store **必需**的
- 图标应该清晰、简洁，在小尺寸下也能识别
- 确保图标在不同背景下都能清晰显示

