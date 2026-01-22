const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 项目根目录（scripts 目录的上一级）
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const packageName = 'devtools-suite';
const version = require(path.join(rootDir, 'package.json')).version;
const zipFileName = `${packageName}-v${version}.zip`;
const zipPath = path.join(rootDir, zipFileName);

// 检查 dist 目录是否存在
if (!fs.existsSync(distDir)) {
  console.error('✗ dist directory not found! Please run "npm run build" first.');
  process.exit(1);
}

// 检查必要文件
const requiredFiles = ['manifest.json', 'index.html', 'icons/icon128.png'];
const missingFiles = requiredFiles.filter(file => {
  const filePath = path.join(distDir, file);
  return !fs.existsSync(filePath);
});

if (missingFiles.length > 0) {
  console.error('✗ Missing required files:', missingFiles.join(', '));
  console.error('Please run "npm run build" first.');
  process.exit(1);
}

console.log('📦 Creating ZIP package...');

try {
  // 使用 zip 命令创建 ZIP 文件
  // 注意：ZIP 文件应该包含 dist 文件夹内的文件，而不是 dist 文件夹本身
  process.chdir(distDir);
  
  // 获取 dist 目录下的所有文件
  const files = fs.readdirSync('.');
  const fileList = files.join(' ');
  
  // 创建 ZIP（排除不必要的文件）
  const excludePatterns = [
    'README.md',
    '.gitkeep',
    '.DS_Store'
  ];
  const excludeArgs = excludePatterns.map(pattern => `-x "*/${pattern}"`).join(' ');
  const zipCommand = `zip -r "${zipPath}" . ${excludeArgs}`;
  
  execSync(zipCommand, { stdio: 'inherit' });
  
  // 检查 ZIP 文件大小
  const stats = fs.statSync(zipPath);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`\n✅ ZIP package created successfully!`);
  console.log(`📁 File: ${zipFileName}`);
  console.log(`📊 Size: ${sizeInMB} MB`);
  
  if (stats.size > 100 * 1024 * 1024) {
    console.warn('⚠️  Warning: ZIP file size exceeds 100MB limit!');
  } else {
    console.log('✓ ZIP file size is within 100MB limit');
  }
  
  console.log(`\n📤 Ready to upload to Chrome Web Store!`);
  console.log(`   Upload this file: ${zipPath}`);
  
} catch (error) {
  console.error('✗ Error creating ZIP:', error.message);
  console.error('\n💡 Alternative: Manually create ZIP file');
  console.error('   1. Open dist folder');
  console.error('   2. Select all files inside dist (not the dist folder itself)');
  console.error('   3. Right-click → Compress/Create Archive');
  console.error('   4. Name it:', zipFileName);
  process.exit(1);
}

