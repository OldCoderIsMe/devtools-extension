<template>
  <div class="settings-panel">
    <div class="settings-header">
      <h2 class="settings-title">⚙️ 设置</h2>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    
    <div class="settings-content">
      <div class="settings-section">
        <h3 class="section-title">快捷键设置</h3>
        <p class="section-desc">自定义快速搜索弹窗的快捷键</p>
        
        <div class="shortcut-item">
          <label class="shortcut-label">主快捷键</label>
          <div class="shortcut-input-wrapper">
            <input
              ref="shortcut1Input"
              v-model="shortcuts.quickSearch"
              class="shortcut-input"
              type="text"
              readonly
              @click="startCaptureShortcut('quickSearch')"
              :class="{ capturing: capturingKey === 'quickSearch' }"
              placeholder="点击设置快捷键"
            />
            <button
              v-if="capturingKey !== 'quickSearch'"
              class="btn-edit"
              @click="startCaptureShortcut('quickSearch')"
            >
              编辑
            </button>
            <button
              v-else
              class="btn-cancel"
              @click="cancelCapture"
            >
              取消
            </button>
          </div>
          <p class="shortcut-hint">按任意组合键设置，例如: Command+K</p>
        </div>

        <div class="shortcut-item">
          <label class="shortcut-label">备用快捷键</label>
          <div class="shortcut-input-wrapper">
            <input
              ref="shortcut2Input"
              v-model="shortcuts.quickSearchAlt"
              class="shortcut-input"
              type="text"
              readonly
              @click="startCaptureShortcut('quickSearchAlt')"
              :class="{ capturing: capturingKey === 'quickSearchAlt' }"
              placeholder="点击设置快捷键"
            />
            <button
              v-if="capturingKey !== 'quickSearchAlt'"
              class="btn-edit"
              @click="startCaptureShortcut('quickSearchAlt')"
            >
              编辑
            </button>
            <button
              v-else
              class="btn-cancel"
              @click="cancelCapture"
            >
              取消
            </button>
          </div>
          <p class="shortcut-hint">可选，用于备用触发方式</p>
        </div>

        <div class="shortcut-actions">
          <button class="btn secondary" @click="resetShortcuts">重置为默认值</button>
          <button class="btn" @click="saveShortcuts" :disabled="saving">
            {{ saving ? '保存中...' : '保存设置' }}
          </button>
        </div>

        <div v-if="message" :class="['message', messageType]">
          {{ message }}
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">快捷键格式说明</h3>
        <div class="format-help">
          <p><strong>修饰键：</strong></p>
          <ul>
            <li>macOS: <code>Command</code>, <code>Control</code>, <code>Option</code>, <code>Shift</code></li>
            <li>Windows/Linux: <code>Control</code>, <code>Alt</code>, <code>Shift</code></li>
          </ul>
          <p><strong>示例：</strong></p>
          <ul>
            <li><code>Command+K</code> (macOS)</li>
            <li><code>Control+K</code> (Windows/Linux)</li>
            <li><code>Command+Shift+K</code></li>
            <li><code>Control+Alt+S</code></li>
          </ul>
          <p class="warning">⚠️ 注意：如果快捷键已被系统或其他应用占用，注册可能会失败</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['close']);

const shortcuts = ref({
  quickSearch: '',
  quickSearchAlt: '',
});

const capturingKey = ref<string | null>(null);
const saving = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const shortcut1Input = ref<HTMLInputElement | null>(null);
const shortcut2Input = ref<HTMLInputElement | null>(null);

let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

// 格式化快捷键字符串
function formatShortcut(e: KeyboardEvent): string {
  const parts: string[] = [];
  const platform = (window as any).electron?.platform || 'darwin';
  
  // 处理修饰键
  if (e.metaKey && platform === 'darwin') {
    parts.push('Command');
  }
  if (e.ctrlKey) {
    // macOS 上，如果按了 Command，通常不显示 Control
    if (platform !== 'darwin' || !e.metaKey) {
      parts.push('Control');
    }
  }
  if (e.altKey) {
    parts.push(platform === 'darwin' ? 'Option' : 'Alt');
  }
  if (e.shiftKey) {
    parts.push('Shift');
  }
  
  // 获取主键（排除修饰键）
  const key = e.key;
  if (key && key !== 'Meta' && key !== 'Control' && key !== 'Alt' && key !== 'Shift') {
    // 处理特殊键名
    let keyName = key;
    if (key === ' ') {
      keyName = 'Space';
    } else if (key === 'ArrowUp') {
      keyName = 'Up';
    } else if (key === 'ArrowDown') {
      keyName = 'Down';
    } else if (key === 'ArrowLeft') {
      keyName = 'Left';
    } else if (key === 'ArrowRight') {
      keyName = 'Right';
    } else if (key.length === 1) {
      keyName = key.toUpperCase();
    } else {
      // 将首字母大写，其余小写
      keyName = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
    }
    
    parts.push(keyName);
  }
  
  // 确保至少有一个修饰键和一个主键
  if (parts.length < 2) {
    return '';
  }
  
  return parts.join('+');
}

// 开始捕获快捷键
function startCaptureShortcut(key: 'quickSearch' | 'quickSearchAlt') {
  capturingKey.value = key;
  message.value = '';
  
  // 添加全局键盘监听
  keydownHandler = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shortcut = formatShortcut(e);
    if (shortcut && shortcut.split('+').length > 1) {
      shortcuts.value[key] = shortcut;
      capturingKey.value = null;
      removeKeydownHandler();
    }
  };
  
  window.addEventListener('keydown', keydownHandler, true);
}

// 取消捕获
function cancelCapture() {
  capturingKey.value = null;
  removeKeydownHandler();
}

// 移除键盘监听
function removeKeydownHandler() {
  if (keydownHandler) {
    window.removeEventListener('keydown', keydownHandler, true);
    keydownHandler = null;
  }
}

// 加载快捷键设置
async function loadShortcuts() {
  const electron = (window as any).electron;
  if (electron && electron.settings) {
    try {
      const savedShortcuts = await electron.settings.getShortcuts();
      shortcuts.value = savedShortcuts;
    } catch (error) {
      console.error('加载快捷键设置失败:', error);
      showMessage('加载设置失败', 'error');
    }
  }
}

// 保存快捷键设置
async function saveShortcuts() {
  const electron = (window as any).electron;
  if (!electron || !electron.settings) {
    showMessage('Electron 环境不可用', 'error');
    return;
  }

  saving.value = true;
  message.value = '';

  try {
    // 保存主快捷键
    await electron.settings.updateShortcut('quickSearch', shortcuts.value.quickSearch);
    
    // 保存备用快捷键
    if (shortcuts.value.quickSearchAlt) {
      await electron.settings.updateShortcut('quickSearchAlt', shortcuts.value.quickSearchAlt);
    }
    
    showMessage('设置已保存', 'success');
  } catch (error) {
    console.error('保存快捷键设置失败:', error);
    showMessage('保存失败，请检查快捷键格式', 'error');
  } finally {
    saving.value = false;
  }
}

// 重置为默认值
async function resetShortcuts() {
  const electron = (window as any).electron;
  if (!electron || !electron.settings) {
    showMessage('Electron 环境不可用', 'error');
    return;
  }

  try {
    const defaultShortcuts = await electron.settings.resetShortcuts();
    shortcuts.value = defaultShortcuts;
    showMessage('已重置为默认值', 'success');
  } catch (error) {
    console.error('重置快捷键失败:', error);
    showMessage('重置失败', 'error');
  }
}

// 显示消息
function showMessage(text: string, type: 'success' | 'error' = 'success') {
  message.value = text;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 3000);
}

onMounted(() => {
  loadShortcuts();
});

onUnmounted(() => {
  removeKeydownHandler();
});
</script>

<style scoped>
.settings-panel {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-card);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.settings-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  line-height: 1;
}

.close-btn:hover {
  background: var(--bg-input);
  color: var(--text-primary);
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-desc {
  margin: 0;
  font-size: 14px;
  color: var(--text-tertiary);
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.shortcut-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.shortcut-input {
  flex: 1;
  background: var(--bg-input);
  border: 1px solid var(--border-color-input);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.shortcut-input:hover {
  border-color: var(--border-color-focus);
  background: var(--bg-input-focus);
}

.shortcut-input.capturing {
  border-color: #64b5f6;
  background: rgba(100, 181, 246, 0.1);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(100, 181, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(100, 181, 246, 0);
  }
}

.btn-edit,
.btn-cancel {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--border-color);
}

.btn-edit {
  background: var(--bg-btn-secondary);
  color: var(--text-secondary);
}

.btn-edit:hover {
  background: var(--bg-btn-secondary-hover);
}

.btn-cancel {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border-color: rgba(244, 67, 54, 0.3);
}

.btn-cancel:hover {
  background: rgba(244, 67, 54, 0.3);
}

.shortcut-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-quaternary);
}

.shortcut-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-btn);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-btn-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.secondary {
  background: var(--bg-btn-secondary);
  color: var(--text-secondary);
  box-shadow: none;
}

.btn.secondary:hover {
  background: var(--bg-btn-secondary-hover);
}

.message {
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 8px;
}

.message.success {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.message.error {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.format-help {
  background: var(--bg-input);
  border-radius: 8px;
  padding: 16px;
  font-size: 13px;
  color: var(--text-tertiary);
  line-height: 1.6;
}

.format-help p {
  margin: 8px 0;
}

.format-help ul {
  margin: 8px 0;
  padding-left: 24px;
}

.format-help li {
  margin: 4px 0;
}

.format-help code {
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  color: #64b5f6;
}

.format-help .warning {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  color: #ff9800;
}
</style>
