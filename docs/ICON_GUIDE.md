# macOS 应用图标指南

## 图标要求

macOS 应用需要 `.icns` 格式的图标文件，包含多个尺寸的图标。

## 图标尺寸

`.icns` 文件应包含以下尺寸：

- 16x16 (@1x 和 @2x)
- 32x32 (@1x 和 @2x)
- 128x128 (@1x 和 @2x)
- 256x256 (@1x 和 @2x)
- 512x512 (@1x 和 @2x)
- 1024x1024 (@2x)

## 创建图标文件

### 方法 1：使用在线工具

1. 准备一个 1024x1024 的 PNG 图标
2. 访问 [CloudConvert](https://cloudconvert.com/png-to-icns)
3. 上传 PNG 文件并转换为 ICNS
4. 下载并保存为 `icons/icon.icns`

### 方法 2：使用 macOS 命令行工具

```bash
# 创建 iconset 目录
mkdir -p icon.iconset

# 使用 sips 创建不同尺寸的图标
sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

# 转换为 icns
iconutil -c icns icon.iconset -o icon.icns

# 移动到正确位置
mv icon.icns icons/icon.icns

# 清理临时文件
rm -rf icon.iconset
```

### 方法 3：使用 Image2icon（GUI 工具）

1. 下载 [Image2icon](https://www.img2icnsapp.com/)
2. 打开应用并导入 PNG 图标
3. 导出为 ICNS 格式
4. 保存到 `icons/icon.icns`

## 图标设计建议

- 使用简洁、清晰的设计
- 确保在小尺寸下仍然清晰可辨
- 遵循 macOS 设计规范
- 使用透明背景（PNG）
- 避免使用细线或小文字

## 验证图标

构建应用后，可以在以下位置查看图标：

1. **Finder**: 应用包中的图标
2. **Dock**: 运行时的 Dock 图标
3. **Launchpad**: Launchpad 中的图标
4. **关于本机**: 应用信息中的图标

## 故障排除

如果图标不显示：

1. 检查文件路径：`icons/icon.icns`
2. 验证文件格式：使用 `file icons/icon.icns` 检查
3. 重新构建应用：`npm run electron:build:mac`
4. 清除缓存：删除 `release` 目录后重新构建
