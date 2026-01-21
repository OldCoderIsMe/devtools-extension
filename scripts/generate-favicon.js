const fs = require('fs');
const path = require('path');

const brandIconPath = path.join(__dirname, 'icons', 'brand-icon.png');
const publicDir = path.join(__dirname, 'public');
const faviconDest = path.join(publicDir, 'favicon.png');
const iconsDestDir = path.join(publicDir, 'icons');

// 确保 public 目录存在
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(iconsDestDir)) {
  fs.mkdirSync(iconsDestDir, { recursive: true });
}

let hasSharp = false;
let sharp;
try {
  sharp = require('sharp');
  hasSharp = true;
} catch (e) {
  console.warn('⚠ sharp not found, favicon generation skipped');
  process.exit(0);
}

async function generateFavicon() {
  if (!fs.existsSync(brandIconPath)) {
    console.warn('⚠ brand-icon.png not found');
    return;
  }

  try {
    // 生成 favicon.png (32x32)
    await sharp(brandIconPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(faviconDest);
    console.log('✓ Generated favicon.png (32x32) to public/');

    // 生成不同尺寸的图标到 public/icons/
    const iconSizes = {
      'icon16.png': 16,
      'icon48.png': 48,
      'icon128.png': 128,
      'favicon.png': 32,
    };

    for (const [filename, size] of Object.entries(iconSizes)) {
      const destPath = path.join(iconsDestDir, filename);
      await sharp(brandIconPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(destPath);
    }
    console.log('✓ Generated icons to public/icons/');
  } catch (error) {
    console.error('✗ Error generating favicon:', error.message);
    process.exit(1);
  }
}

generateFavicon();
