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

      <!-- 文件移动配对管理（仅 Electron 环境） -->
      <div v-if="isElectron" class="settings-section">
        <h3 class="section-title">📁 文件移动配对</h3>
        <p class="section-desc">配置路径配对，使用快捷指令快速执行文件移动操作</p>
        
        <div v-if="fileMovePairs.length === 0" class="empty-state">
          <p>暂无配置的路径配对</p>
          <p class="empty-hint">点击下方"添加配对"按钮开始配置</p>
        </div>

        <div v-else class="pairs-list">
          <div v-for="(pair, index) in fileMovePairs" :key="pair.alias" class="pair-item">
            <div class="pair-header">
              <div class="pair-info">
                <span class="pair-alias">{{ pair.alias }}</span>
                <span v-if="pair.description" class="pair-desc">{{ pair.description }}</span>
              </div>
              <div class="pair-actions">
                <button class="btn-icon" @click="editPair(index)" title="编辑">✏️</button>
                <button class="btn-icon" @click="deletePair(pair.alias)" title="删除">🗑️</button>
              </div>
            </div>
            <div class="pair-paths">
              <div class="path-item">
                <span class="path-label">源目录:</span>
                <span class="path-value">{{ pair.sourcePath }}</span>
              </div>
              <div class="path-item">
                <span class="path-label">目标目录:</span>
                <span class="path-value">{{ pair.targetPath }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 添加/编辑配对表单 -->
        <div v-if="showPairForm" class="pair-form">
          <div class="form-item">
            <label class="form-label">别名 *</label>
            <input
              v-model="editingPair.alias"
              class="form-input"
              type="text"
              placeholder="例如: a2b"
              :disabled="isEditing"
            />
            <p class="form-hint">用于快捷指令，例如: move a2b</p>
          </div>

          <div class="form-item">
            <label class="form-label">源目录 *</label>
            <div class="path-input-wrapper">
              <input
                v-model="editingPair.sourcePath"
                class="form-input"
                type="text"
                placeholder="选择源目录"
                readonly
              />
              <button class="btn secondary" @click="selectSourcePath">选择目录</button>
            </div>
            <p class="form-hint">要复制的源文件目录</p>
          </div>

          <div class="form-item">
            <label class="form-label">目标目录 *</label>
            <div class="path-input-wrapper">
              <input
                v-model="editingPair.targetPath"
                class="form-input"
                type="text"
                placeholder="选择目标目录"
                readonly
              />
              <button class="btn secondary" @click="selectTargetPath">选择目录</button>
            </div>
            <p class="form-hint">清空后复制文件的目标目录</p>
          </div>

          <div class="form-item">
            <label class="form-label">描述（可选）</label>
            <input
              v-model="editingPair.description"
              class="form-input"
              type="text"
              placeholder="例如: 备份项目文件"
            />
          </div>

          <div class="form-actions">
            <button class="btn secondary" @click="cancelEditPair">取消</button>
            <button class="btn" @click="savePair" :disabled="!canSavePair">
              {{ isEditing ? '更新' : '添加' }}
            </button>
          </div>
        </div>

        <div v-else class="pair-actions">
          <button class="btn" @click="addNewPair">+ 添加配对</button>
        </div>

        <div v-if="fileMoveMessage" :class="['message', fileMoveMessageType]">
          {{ fileMoveMessage }}
        </div>

        <div class="format-help" style="margin-top: 16px;">
          <p><strong>使用说明：</strong></p>
          <ul>
            <li>配置配对后，在快捷指令中输入 <code>move 别名</code> 即可执行</li>
            <li>操作会清空目标目录，然后复制源目录的所有文件到目标目录</li>
            <li>输入 <code>move</code> 可查看所有配置的配对</li>
          </ul>
          <p class="warning">⚠️ 警告：此操作会删除目标目录中的所有文件，请谨慎使用</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

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

// 文件移动配对相关
const isElectron = ref(false);
const fileMovePairs = ref<any[]>([]);
const showPairForm = ref(false);
const isEditing = ref(false);
const editingPair = ref({
  alias: '',
  sourcePath: '',
  targetPath: '',
  description: '',
});
const fileMoveMessage = ref('');
const fileMoveMessageType = ref<'success' | 'error'>('success');

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

// 文件移动配对相关函数
async function loadFileMovePairs() {
  const electron = (window as any).electron;
  if (electron && electron.fileMove) {
    try {
      fileMovePairs.value = await electron.fileMove.getPairs();
    } catch (error) {
      console.error('加载文件移动配对失败:', error);
    }
  }
}

function addNewPair() {
  editingPair.value = {
    alias: '',
    sourcePath: '',
    targetPath: '',
    description: '',
  };
  isEditing.value = false;
  showPairForm.value = true;
}

function editPair(index: number) {
  editingPair.value = { ...fileMovePairs.value[index] };
  isEditing.value = true;
  showPairForm.value = true;
}

function cancelEditPair() {
  showPairForm.value = false;
  isEditing.value = false;
  editingPair.value = {
    alias: '',
    sourcePath: '',
    targetPath: '',
    description: '',
  };
  fileMoveMessage.value = '';
}

async function selectSourcePath() {
  const electron = (window as any).electron;
  if (!electron?.fileMove) {
    showFileMoveMessage('Electron 环境不可用', 'error');
    return;
  }

  try {
    const result = await electron.fileMove.selectDirectory('选择源目录');
    if (!result.canceled && result.path) {
      editingPair.value.sourcePath = result.path;
    }
  } catch (error) {
    console.error('选择目录失败:', error);
    showFileMoveMessage('选择目录失败', 'error');
  }
}

async function selectTargetPath() {
  const electron = (window as any).electron;
  if (!electron?.fileMove) {
    showFileMoveMessage('Electron 环境不可用', 'error');
    return;
  }

  try {
    const result = await electron.fileMove.selectDirectory('选择目标目录');
    if (!result.canceled && result.path) {
      editingPair.value.targetPath = result.path;
    }
  } catch (error) {
    console.error('选择目录失败:', error);
    showFileMoveMessage('选择目录失败', 'error');
  }
}

const canSavePair = computed(() => {
  return editingPair.value.alias.trim() &&
         editingPair.value.sourcePath.trim() &&
         editingPair.value.targetPath.trim();
});

async function savePair() {
  const electron = (window as any).electron;
  if (!electron?.fileMove) {
    showFileMoveMessage('Electron 环境不可用', 'error');
    return;
  }

  if (!canSavePair.value) {
    showFileMoveMessage('请填写所有必填项', 'error');
    return;
  }

  try {
    const pair = {
      alias: editingPair.value.alias.trim(),
      sourcePath: editingPair.value.sourcePath.trim(),
      targetPath: editingPair.value.targetPath.trim(),
      description: editingPair.value.description.trim() || undefined,
    };

    if (isEditing.value) {
      const result = await electron.fileMove.updatePair(editingPair.value.alias, pair);
      if (result.success) {
        showFileMoveMessage('配对已更新', 'success');
        await loadFileMovePairs();
        cancelEditPair();
      } else {
        showFileMoveMessage(result.error || '更新失败', 'error');
      }
    } else {
      const result = await electron.fileMove.addPair(pair);
      if (result.success) {
        showFileMoveMessage('配对已添加', 'success');
        await loadFileMovePairs();
        cancelEditPair();
      } else {
        showFileMoveMessage(result.error || '添加失败', 'error');
      }
    }
  } catch (error: any) {
    console.error('保存配对失败:', error);
    showFileMoveMessage(error.message || '保存失败', 'error');
  }
}

async function deletePair(alias: string) {
  if (!confirm(`确定要删除配对 "${alias}" 吗？`)) {
    return;
  }

  const electron = (window as any).electron;
  if (!electron?.fileMove) {
    showFileMoveMessage('Electron 环境不可用', 'error');
    return;
  }

  try {
    const result = await electron.fileMove.deletePair(alias);
    if (result.success) {
      showFileMoveMessage('配对已删除', 'success');
      await loadFileMovePairs();
    } else {
      showFileMoveMessage(result.error || '删除失败', 'error');
    }
  } catch (error: any) {
    console.error('删除配对失败:', error);
    showFileMoveMessage(error.message || '删除失败', 'error');
  }
}

function showFileMoveMessage(text: string, type: 'success' | 'error' = 'success') {
  fileMoveMessage.value = text;
  fileMoveMessageType.value = type;
  setTimeout(() => {
    fileMoveMessage.value = '';
  }, 3000);
}

onMounted(() => {
  loadShortcuts();
  
  // 检查是否为 Electron 环境
  isElectron.value = !!(window as any).electron?.fileMove;
  if (isElectron.value) {
    loadFileMovePairs();
  }
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

/* 文件移动配对样式 */
.empty-state {
  text-align: center;
  padding: 32px;
  color: var(--text-tertiary);
}

.empty-hint {
  font-size: 12px;
  margin-top: 8px;
  color: var(--text-quaternary);
}

.pairs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pair-item {
  background: var(--bg-input);
  border: 1px solid var(--border-color-input);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.pair-item:hover {
  border-color: var(--border-color-focus);
  background: var(--bg-input-focus);
}

.pair-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pair-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pair-alias {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.pair-desc {
  font-size: 13px;
  color: var(--text-tertiary);
}

.pair-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0.7;
}

.btn-icon:hover {
  opacity: 1;
  background: var(--bg-input);
}

.pair-paths {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.path-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.path-label {
  color: var(--text-tertiary);
  min-width: 80px;
}

.path-value {
  color: var(--text-secondary);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  word-break: break-all;
}

.pair-form {
  background: var(--bg-input);
  border: 1px solid var(--border-color-input);
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input {
  background: var(--bg-card);
  border: 1px solid var(--border-color-input);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--border-color-focus);
  background: var(--bg-input-focus);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.path-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.path-input-wrapper .form-input {
  flex: 1;
}

.form-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-quaternary);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.pair-actions {
  margin-top: 16px;
}
</style>
