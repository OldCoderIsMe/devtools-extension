#!/usr/bin/env node

/**
 * 清理 DMG 挂载点脚本
 * 在构建 DMG 之前运行，确保没有残留的挂载点
 */

const { execSync } = require('child_process');
const fs = require('fs');

const productName = 'DevTools Suite';
const version = require('./package.json').version;
const volumeName = `${productName} ${version}`;

console.log(`[清理] 开始清理 DMG 挂载点...`);

// 清理当前版本的挂载点
function detachVolume(name) {
  try {
    const volumePath = `/Volumes/${name}`;
    if (fs.existsSync(volumePath)) {
      console.log(`[清理] 发现挂载点: "${name}"`);
      execSync(`hdiutil detach "${volumePath}" -force 2>/dev/null || true`, {
        stdio: 'inherit',
      });
      console.log(`[清理] 已卸载: "${name}"`);
    }
  } catch (error) {
    // 忽略错误，继续执行
  }
}

// 清理所有可能的挂载点
detachVolume(volumeName);

// 清理可能存在的旧版本挂载点
const oldVersions = ['0.1.0', '0.1.1', '0.1.2'];
oldVersions.forEach((oldVersion) => {
  detachVolume(`${productName} ${oldVersion}`);
});

// 额外清理：查找所有包含产品名的挂载点
try {
  const volumes = execSync('ls /Volumes', { encoding: 'utf8' });
  volumes.split('\n').forEach((vol) => {
    const trimmed = vol.trim();
    if (trimmed && trimmed.includes(productName)) {
      detachVolume(trimmed);
    }
  });
} catch (error) {
  // 忽略错误
}

// 强制清理：尝试卸载所有可能的挂载点
try {
  // 使用 hdiutil 查找所有相关镜像
  const hdiutilInfo = execSync('hdiutil info 2>/dev/null || true', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  // 查找所有挂载的卷
  const volumes = execSync('ls -1 /Volumes 2>/dev/null || true', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  volumes.split('\n').forEach((vol) => {
    const trimmed = vol.trim();
    if (trimmed && (trimmed.includes(productName) || trimmed.includes('DevTools'))) {
      console.log(`[清理] 尝试卸载挂载点: "${trimmed}"`);
      try {
        execSync(`hdiutil detach "/Volumes/${trimmed}" -force 2>/dev/null || true`, {
          stdio: 'ignore',
        });
      } catch (error) {
        // 忽略错误
      }
    }
  });
} catch (error) {
  // 忽略错误
}

// 等待一下，确保卸载完成
// 使用同步方式等待，确保清理完成
try {
  execSync('sleep 2', { stdio: 'ignore' });
} catch (error) {
  // 如果 sleep 命令不可用（Windows），忽略
}

// 最后再检查一次，确保没有残留的挂载点
try {
  const finalCheck = execSync('ls /Volumes 2>/dev/null | grep -i "devtools" || true', {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  if (finalCheck.trim()) {
    console.log(`[清理] 警告: 仍有挂载点存在，尝试强制清理...`);
    finalCheck.trim().split('\n').forEach((vol) => {
      const trimmed = vol.trim();
      if (trimmed) {
        try {
          execSync(`hdiutil detach "/Volumes/${trimmed}" -force 2>/dev/null || true`, {
            stdio: 'ignore',
          });
        } catch (error) {
          // 忽略错误
        }
      }
    });
    // 再等待一下
    try {
      execSync('sleep 1', { stdio: 'ignore' });
    } catch (error) {
      // 忽略
    }
  }
} catch (error) {
  // 忽略错误
}

console.log(`[清理] 完成`);
