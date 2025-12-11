const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const SETTINGS_FILE_NAME = 'settings.json';

// 获取设置文件路径
function getSettingsPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, SETTINGS_FILE_NAME);
}

// 默认设置
const DEFAULT_SETTINGS = {
  shortcuts: {
    quickSearch: process.platform === 'darwin' ? 'Command+K' : 'Control+K',
    quickSearchAlt: process.platform === 'darwin' ? 'Command+Space' : 'Control+Space',
  },
};

// 读取设置
function loadSettings() {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(data);
      // 合并默认设置，确保新字段存在
      return { ...DEFAULT_SETTINGS, ...settings };
    }
  } catch (error) {
    console.error('[Settings] 读取设置失败:', error);
  }
  return DEFAULT_SETTINGS;
}

// 保存设置
function saveSettings(settings) {
  try {
    const settingsPath = getSettingsPath();
    // 确保目录存在
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[Settings] 保存设置失败:', error);
    return false;
  }
}

// 更新快捷键设置
function updateShortcut(key, value) {
  const settings = loadSettings();
  if (!settings.shortcuts) {
    settings.shortcuts = {};
  }
  settings.shortcuts[key] = value;
  return saveSettings(settings);
}

// 获取快捷键设置
function getShortcut(key) {
  const settings = loadSettings();
  return settings.shortcuts?.[key] || DEFAULT_SETTINGS.shortcuts[key];
}

module.exports = {
  loadSettings,
  saveSettings,
  updateShortcut,
  getShortcut,
  DEFAULT_SETTINGS,
};
