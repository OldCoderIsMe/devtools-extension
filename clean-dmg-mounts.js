#!/usr/bin/env node

/**
 * 清理 DMG 挂载点脚本
 * 在构建 DMG 之前运行，确保没有残留的挂载点
 */

const { execSync } = require('child_process');

const productName = 'DevTools Suite';
const version = require('./package.json').version;
const volumeName = `${productName} ${version}`;

console.log(`[清理] 尝试卸载挂载点: "${volumeName}"`);

try {
  // 尝试卸载挂载点
  execSync(`hdiutil detach "/Volumes/${volumeName}" 2>/dev/null || true`, {
    stdio: 'inherit',
  });
  console.log(`[清理] 挂载点已清理`);
} catch (error) {
  // 忽略错误，继续执行
  console.log(`[清理] 没有找到挂载点或已清理`);
}

// 也尝试清理可能存在的旧版本挂载点
const oldVersions = ['0.1.0', '0.1.1'];
oldVersions.forEach((oldVersion) => {
  try {
    execSync(`hdiutil detach "/Volumes/${productName} ${oldVersion}" 2>/dev/null || true`, {
      stdio: 'ignore',
    });
  } catch (error) {
    // 忽略错误
  }
});

console.log(`[清理] 完成`);
