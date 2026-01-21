const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, 'manifest.json');
const sourceIconsDir = path.join(__dirname, 'icons');
const destDir = path.join(__dirname, 'dist');
const destFile = path.join(destDir, 'manifest.json');
const destIconsDir = path.join(destDir, 'icons');

// 确保 dist 目录存在
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 读取 manifest.json
let manifestContent = {};
if (fs.existsSync(sourceFile)) {
  manifestContent = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
} else {
  console.error('✗ manifest.json not found!');
  process.exit(1);
}

// 确保 dist/icons 目录存在
if (!fs.existsSync(destIconsDir)) {
  fs.mkdirSync(destIconsDir, { recursive: true });
}

// 图标尺寸配置
const iconSizes = {
  'icon16.png': 16,
  'icon48.png': 48,
  'icon128.png': 128,
  'favicon.png': 32, // 添加 favicon（32x32 是标准尺寸）
};

// 检查 brand-icon.png 是否存在
const brandIconPath = path.join(sourceIconsDir, 'brand-icon.png');
const brandIconLightPath = path.join(sourceIconsDir, 'brand-icon-light.png');

let hasSharp = false;
let sharp;
try {
  sharp = require('sharp');
  hasSharp = true;
} catch (e) {
  console.warn('⚠ sharp not found, will copy brand-icon.png as all sizes');
}

// 生成不同尺寸的图标
async function generateIcons() {
  if (!fs.existsSync(brandIconPath)) {
    console.warn('⚠ brand-icon.png not found, skipping icon generation');
    return false;
  }

  if (hasSharp) {
    // 使用 sharp 生成不同尺寸
    try {
      for (const [filename, size] of Object.entries(iconSizes)) {
        const destPath = path.join(destIconsDir, filename);
        await sharp(brandIconPath)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(destPath);
      }
      console.log('✓ Generated icon16.png, icon48.png, icon128.png, favicon.png from brand-icon.png');
      return true;
    } catch (error) {
      console.error('✗ Error generating icons:', error.message);
      return false;
    }
  } else {
    // 如果没有 sharp，直接复制 brand-icon.png 作为所有尺寸（Chrome 会自动缩放）
    console.warn('⚠ sharp not installed, copying brand-icon.png for all sizes');
    console.warn('⚠ Note: Install sharp for better icon quality: npm install --save-dev sharp');
    for (const filename of Object.keys(iconSizes)) {
      const destPath = path.join(destIconsDir, filename);
      fs.copyFileSync(brandIconPath, destPath);
    }
    console.log('✓ Copied brand-icon.png as icon16.png, icon48.png, icon128.png, favicon.png');
    return true;
  }
}

// 检查是否已有特定尺寸的图标文件
const requiredIcons = Object.keys(iconSizes);
const existingIcons = {};

if (fs.existsSync(sourceIconsDir)) {
  const files = fs.readdirSync(sourceIconsDir);
  requiredIcons.forEach(iconName => {
    if (files.includes(iconName)) {
      existingIcons[iconName] = true;
    }
  });
}

// 主处理函数
async function processIcons() {
  // 如果所有必需的图标都存在，直接复制；否则从 brand-icon.png 生成
  if (Object.keys(existingIcons).length === requiredIcons.length) {
    console.log('✓ All required icons found, copying existing icons');
    requiredIcons.forEach(iconName => {
      const sourcePath = path.join(sourceIconsDir, iconName);
      const destPath = path.join(destIconsDir, iconName);
      fs.copyFileSync(sourcePath, destPath);
    });
  } else {
    // 从 brand-icon.png 生成
    const success = await generateIcons();
    if (!success) {
      console.warn('⚠ Icon generation failed, removing icon configuration from manifest');
      delete manifestContent.icons;
      if (manifestContent.action && manifestContent.action.default_icon) {
        delete manifestContent.action.default_icon;
      }
    }
  }

  // 复制所有其他图标文件（brand-icon.png, brand-icon-light.png 等）
  if (fs.existsSync(sourceIconsDir)) {
    const files = fs.readdirSync(sourceIconsDir);
    let copiedCount = 0;
    files.forEach(file => {
      // 跳过已经处理的特定尺寸图标
      if (requiredIcons.includes(file)) {
        return;
      }
      const sourcePath = path.join(sourceIconsDir, file);
      const destPath = path.join(destIconsDir, file);
      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, destPath);
        copiedCount++;
      }
    });
    if (copiedCount > 0) {
      console.log(`✓ Copied ${copiedCount} additional icon file(s) to dist/icons/`);
    }
  }

  // 更新 manifest.json，添加图标配置
  if (fs.existsSync(path.join(destIconsDir, 'icon16.png'))) {
    manifestContent.icons = {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png'
    };
    if (manifestContent.action) {
      manifestContent.action.default_icon = {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png'
      };
    }
    console.log('✓ Added icon configuration to manifest.json');
  }

  // 复制 favicon 到根目录（浏览器默认查找 favicon.ico 或 favicon.png）
  // 使用 brand-icon.png 生成 32x32 的 favicon
  const faviconDest = path.join(destDir, 'favicon.png');
  const brandIconPath = path.join(sourceIconsDir, 'brand-icon.png');
  
  if (fs.existsSync(brandIconPath) && hasSharp) {
    try {
      // 使用 sharp 生成 32x32 的 favicon
      await sharp(brandIconPath)
        .resize(32, 32, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(faviconDest);
      console.log('✓ Generated favicon.png (32x32) from brand-icon.png to dist root');
    } catch (error) {
      console.warn('⚠ Error generating favicon, falling back to icon16.png:', error.message);
      // 回退到使用 icon16.png
      if (fs.existsSync(path.join(destIconsDir, 'icon16.png'))) {
        fs.copyFileSync(path.join(destIconsDir, 'icon16.png'), faviconDest);
        console.log('✓ Copied favicon.png from icon16.png to dist root');
      }
    }
  } else if (fs.existsSync(path.join(destIconsDir, 'icon16.png'))) {
    // 如果没有 sharp 或 brand-icon.png，使用 icon16.png
    fs.copyFileSync(path.join(destIconsDir, 'icon16.png'), faviconDest);
    console.log('✓ Copied favicon.png from icon16.png to dist root');
  }

  // 写入更新后的 manifest.json
  fs.writeFileSync(destFile, JSON.stringify(manifestContent, null, 2));
  console.log('✓ manifest.json copied to dist/');
}

// 执行主处理函数
processIcons().catch(error => {
  console.error('✗ Error processing icons:', error);
  process.exit(1);
});

