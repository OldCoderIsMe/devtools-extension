#!/usr/bin/env node
/**
 * 移除图标中的黑色背景，转换为透明背景
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function removeBlackBackground(inputPath, outputPath, threshold = 30) {
  try {
    const image = sharp(inputPath);
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = new Uint8ClampedArray(data);
    const channels = info.channels;
    
    // 处理每个像素
    for (let i = 0; i < pixels.length; i += channels) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // 如果像素接近黑色，将 alpha 通道设为 0（透明）
      if (r < threshold && g < threshold && b < threshold) {
        pixels[i + 3] = 0; // 设置 alpha 为 0（完全透明）
      }
    }
    
    // 保存处理后的图片
    await sharp(pixels, {
      raw: {
        width: info.width,
        height: info.height,
        channels: channels
      }
    })
    .png()
    .toFile(outputPath);
    
    console.log(`✓ 处理完成: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`✗ 处理失败 ${inputPath}:`, error.message);
    return false;
  }
}

async function main() {
  const iconsetDir = path.join(__dirname, 'DevTools.iconset');
  
  if (!fs.existsSync(iconsetDir)) {
    console.error(`✗ 目录不存在: ${iconsetDir}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(iconsetDir).filter(f => f.endsWith('.png'));
  
  if (files.length === 0) {
    console.error('✗ 未找到 PNG 文件');
    process.exit(1);
  }
  
  console.log(`找到 ${files.length} 个图标文件，开始处理...\n`);
  
  let processed = 0;
  for (const filename of files) {
    const inputPath = path.join(iconsetDir, filename);
    await removeBlackBackground(inputPath, inputPath);
    processed++;
  }
  
  console.log(`\n✓ 共处理 ${processed} 个图标文件`);
  console.log('现在可以重新生成 icon.icns 文件');
}

main().catch(error => {
  console.error('错误:', error);
  process.exit(1);
});
