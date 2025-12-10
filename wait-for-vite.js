#!/usr/bin/env node

const http = require('http');

// 尝试的端口列表
const ports = [5173, 5174, 5175, 5176, 5177];

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForVite() {
  console.log('等待 Vite 开发服务器启动...');
  
  let attempts = 0;
  const maxAttempts = 60; // 最多等待 60 秒
  
  while (attempts < maxAttempts) {
    for (const port of ports) {
      const isAvailable = await checkPort(port);
      if (isAvailable) {
        console.log(`✓ Vite 开发服务器运行在端口 ${port}`);
        process.env.VITE_PORT = port.toString();
        return port;
      }
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.error('✗ 无法找到 Vite 开发服务器');
  process.exit(1);
}

waitForVite().then(() => {
  // 启动 Electron
  const { spawn } = require('child_process');
  const electron = spawn('electron', ['.'], {
    stdio: 'inherit',
    env: { ...process.env, VITE_PORT: process.env.VITE_PORT }
  });
  
  electron.on('close', (code) => {
    process.exit(code);
  });
});
