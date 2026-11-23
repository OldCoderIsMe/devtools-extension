/**
 * Electron Builder afterPack 钩子
 * 在打包完成后执行，用于清理 DMG 挂载点
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = async function(context) {
  const productName = 'DevTools Suite';

  if (process.platform === 'darwin' && context.electronPlatformName === 'darwin') {
    try {
      const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
      const extensionRoot = path.join(appPath, 'Contents', 'PlugIns', 'MarkdownQuickLook.appex');
      const contentsDir = path.join(extensionRoot, 'Contents');
      const macOSDir = path.join(contentsDir, 'MacOS');
      fs.mkdirSync(macOSDir, { recursive: true });
      fs.copyFileSync(path.join(__dirname, 'quicklook', 'Info.plist'), path.join(contentsDir, 'Info.plist'));
      const extensionBinary = path.join(macOSDir, 'MarkdownQuickLook');
      const targetArch = context.arch === 1 || String(context.arch).toLowerCase().includes('x64') ? 'x86_64' : 'arm64';
      // Quick Look 的现代 .appex 必须是带 NSExtensionMain 入口的可执行文件。
      // 使用 -bundle 会生成 MH_BUNDLE，macOS 不会把它注册为预览扩展。
      execSync(`clang -arch ${targetArch} -fobjc-arc -fmodules -fapplication-extension -framework Cocoa -framework QuickLookUI -framework WebKit -mmacosx-version-min=11.0 -Wl,-e,_NSExtensionMain -o "${extensionBinary}" "${path.join(__dirname, 'quicklook', 'MarkdownQuickLookExtension.m')}"`, { stdio: 'inherit' });
      fs.chmodSync(extensionBinary, 0o755);

      // afterPack 可能发生在 electron-builder 的初始签名之后。Quick Look
      // 扩展是在这里新增的，因此需要重新生成应用的 ad-hoc 签名，
      // 否则 macOS 会认为应用签名已损坏，并可能将其移入废纸篓。
      const identity = context.packager.platformSpecificBuildOptions?.identity;
      if (!identity) {
        execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
        execSync(`codesign --verify --deep --strict "${appPath}"`, { stdio: 'inherit' });
        console.log('[AfterPack] 已重新生成并校验 ad-hoc 应用签名');
      }

      console.log('[AfterPack] 已内置 macOS Markdown Quick Look 预览扩展');
    } catch (error) {
      console.warn('[AfterPack] Quick Look 生成器编译失败，将跳过该可选能力:', error?.message || error);
    }
  }

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

