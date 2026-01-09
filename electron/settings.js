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
  fileMovePairs: [], // 文件移动路径配对配置
  signatureTemplates: [], // 签名模板配置
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

// 获取文件移动配对配置
function getFileMovePairs() {
  const settings = loadSettings();
  return settings.fileMovePairs || [];
}

// 添加文件移动配对
function addFileMovePair(pair) {
  const settings = loadSettings();
  if (!settings.fileMovePairs) {
    settings.fileMovePairs = [];
  }
  // 检查别名是否已存在
  const exists = settings.fileMovePairs.find(p => p.alias === pair.alias);
  if (exists) {
    throw new Error(`别名 "${pair.alias}" 已存在`);
  }
  settings.fileMovePairs.push(pair);
  return saveSettings(settings);
}

// 更新文件移动配对
function updateFileMovePair(alias, pair) {
  const settings = loadSettings();
  if (!settings.fileMovePairs) {
    settings.fileMovePairs = [];
  }
  const index = settings.fileMovePairs.findIndex(p => p.alias === alias);
  if (index === -1) {
    throw new Error(`别名 "${alias}" 不存在`);
  }
  settings.fileMovePairs[index] = { ...settings.fileMovePairs[index], ...pair };
  return saveSettings(settings);
}

// 删除文件移动配对
function deleteFileMovePair(alias) {
  const settings = loadSettings();
  if (!settings.fileMovePairs) {
    settings.fileMovePairs = [];
  }
  const index = settings.fileMovePairs.findIndex(p => p.alias === alias);
  if (index === -1) {
    throw new Error(`别名 "${alias}" 不存在`);
  }
  settings.fileMovePairs.splice(index, 1);
  return saveSettings(settings);
}

// 获取签名模板列表
function getSignatureTemplates() {
  const settings = loadSettings();
  return settings.signatureTemplates || [];
}

// 添加签名模板
function addSignatureTemplate(template) {
  const settings = loadSettings();
  if (!settings.signatureTemplates) {
    settings.signatureTemplates = [];
  }
  // 检查名称是否已存在
  const exists = settings.signatureTemplates.find(t => t.name === template.name);
  if (exists) {
    throw new Error(`模板名称 "${template.name}" 已存在`);
  }
  settings.signatureTemplates.push(template);
  return saveSettings(settings);
}

// 更新签名模板
function updateSignatureTemplate(id, template) {
  const settings = loadSettings();
  if (!settings.signatureTemplates) {
    settings.signatureTemplates = [];
  }
  const index = settings.signatureTemplates.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error(`模板 ID "${id}" 不存在`);
  }
  settings.signatureTemplates[index] = { ...settings.signatureTemplates[index], ...template };
  return saveSettings(settings);
}

// 删除签名模板
function deleteSignatureTemplate(id) {
  const settings = loadSettings();
  if (!settings.signatureTemplates) {
    settings.signatureTemplates = [];
  }
  const index = settings.signatureTemplates.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error(`模板 ID "${id}" 不存在`);
  }
  settings.signatureTemplates.splice(index, 1);
  return saveSettings(settings);
}

module.exports = {
  loadSettings,
  saveSettings,
  updateShortcut,
  getShortcut,
  getFileMovePairs,
  addFileMovePair,
  updateFileMovePair,
  deleteFileMovePair,
  getSignatureTemplates,
  addSignatureTemplate,
  updateSignatureTemplate,
  deleteSignatureTemplate,
  DEFAULT_SETTINGS,
};
