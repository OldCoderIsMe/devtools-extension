/**
 * Electron Builder afterPack 钩子
 * 在打包完成后执行，用于清理 DMG 挂载点
 */

const { execSync } = require('child_process');
const fs = require('fs');

module.exports = async function(context) {
  const productName = 'DevTools Suite';

  console.log('[AfterPack] 开始清理 DMG 挂载点...');

  // 清理所有包含产品名的挂载点
  try {
    const volumes = execSync('ls -1 /Volumes 2>/dev/null || true', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    volumes.split('\n').forEach((vol) => {
      const trimmed = vol.trim();
      if (trimmed && (trimmed.includes(productName) || trimmed.includes('DevTools'))) {
        const volumePath = `/Volumes/${trimmed}`;
        if (fs.existsSync(volumePath)) {
          try {
            console.log(`[AfterPack] 清理挂载点: "${trimmed}"`);
            execSync(`hdiutil detach "${volumePath}" -force 2>/dev/null || true`, {
              stdio: 'ignore',
            });
          } catch (error) {
            // 忽略错误
          }
        }
      }
    });
  } catch (error) {
    // 忽略错误
  }

  console.log('[AfterPack] 完成');
};

