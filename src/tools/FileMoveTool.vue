<template>
  <div class="tool-card">
    <h2 class="tool-title">文件移动工具</h2>
    <p class="tool-desc">清空目标目录并复制源目录的所有文件到目标目录</p>

    <div class="warning-banner">
      <span class="warning-icon">⚠️</span>
      <span class="warning-text">此操作会删除目标目录中的所有文件，请谨慎使用</span>
    </div>

    <div class="pairs-header">
      <label class="field-label">选择配对（可多选）</label>
      <button class="btn secondary btn-small" @click="showAddPairForm = true" :disabled="showAddPairForm">
        + 新增配对
      </button>
    </div>

    <!-- 新增配对表单 -->
    <div v-if="showAddPairForm" class="add-pair-form">
      <h3 class="form-title">新增配对</h3>
      <div class="form-item">
        <label class="form-label">别名 *</label>
        <input
          v-model="newPair.alias"
          class="form-input"
          type="text"
          placeholder="例如: a2b"
        />
        <p class="form-hint">用于标识此配对配置</p>
      </div>

      <div class="form-item">
        <label class="form-label">源目录 *</label>
        <div class="path-input-wrapper">
          <input
            v-model="newPair.sourcePath"
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
            v-model="newPair.targetPath"
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
          v-model="newPair.description"
          class="form-input"
          type="text"
          placeholder="例如: 备份项目文件"
        />
      </div>

      <div class="form-actions">
        <button class="btn secondary" @click="cancelAddPair">取消</button>
        <button class="btn" @click="saveNewPair" :disabled="!canSaveNewPair">
          保存
        </button>
      </div>
    </div>

    <div class="pairs-multiselect">
      <div v-for="pair in pairs" :key="pair.alias" class="pair-checkbox-item">
        <label class="checkbox-label">
          <input
            type="checkbox"
            :value="pair.alias"
            v-model="selectedAliases"
            @change="onSelectionChange"
          />
          <span class="checkbox-text">
            <strong>{{ pair.alias }}</strong>
            <span v-if="pair.description" class="pair-desc"> - {{ pair.description }}</span>
          </span>
        </label>
      </div>
      <div v-if="pairs.length === 0 && !showAddPairForm" class="empty-pairs">
        暂无配置的路径配对，点击上方"新增配对"按钮开始配置
      </div>
    </div>

    <div v-if="selectedPairs.length > 0" class="pairs-info-section">
      <div v-for="pair in selectedPairs" :key="pair.alias" class="pair-info-card">
        <h3 class="pair-card-title">{{ pair.alias }} <span v-if="pair.description" class="pair-card-desc">- {{ pair.description }}</span></h3>
        
        <div class="path-display">
          <div class="path-row">
            <span class="path-label">源目录:</span>
            <span class="path-value">{{ pair.sourcePath }}</span>
          </div>
          <div class="path-row">
            <span class="path-label">目标目录:</span>
            <span class="path-value">{{ pair.targetPath }}</span>
          </div>
        </div>

        <div class="files-preview">
          <div class="files-column">
            <h4 class="files-title">源目录文件</h4>
            <div class="files-list" v-if="sourceFiles[pair.alias] && sourceFiles[pair.alias].length > 0">
              <div v-for="(file, index) in sourceFiles[pair.alias]" :key="index" class="file-item">
                {{ file }}
              </div>
            </div>
            <div v-else class="files-empty">暂无文件</div>
          </div>

          <div class="files-column">
            <h4 class="files-title">目标目录文件（将被清空）</h4>
            <div class="files-list" v-if="targetFiles[pair.alias] && targetFiles[pair.alias].length > 0">
              <div v-for="(file, index) in targetFiles[pair.alias]" :key="index" class="file-item warning">
                {{ file }}
              </div>
            </div>
            <div v-else class="files-empty">目录为空</div>
          </div>
        </div>
      </div>

      <div class="action-section">
        <button 
          class="btn" 
          @click="executeMove" 
          :disabled="executing || selectedAliases.length === 0"
        >
          {{ executing ? '执行中...' : `确定执行 (${selectedAliases.length}个配置)` }}
        </button>
        <button 
          class="btn secondary" 
          @click="refreshFiles" 
          :disabled="executing"
        >
          刷新文件列表
        </button>
      </div>
    </div>

    <div v-if="logs.length > 0" class="logs-section">
      <div class="logs-header">
        <h4 class="logs-title">操作日志</h4>
        <button class="btn-icon-small" @click="clearLogs" title="清空日志">🗑️</button>
      </div>
      <div class="logs-container" ref="logsContainer">
        <div v-for="(log, index) in logs" :key="index" :class="['log-item', log.type]">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';

interface FileMovePair {
  alias: string;
  sourcePath: string;
  targetPath: string;
  description?: string;
}

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const isElectron = ref(false);
const pairs = ref<FileMovePair[]>([]);
const selectedAliases = ref<string[]>([]);
const selectedPairs = ref<FileMovePair[]>([]);
const sourceFiles = ref<Record<string, string[]>>({});
const targetFiles = ref<Record<string, string[]>>({});
const executing = ref(false);
const logs = ref<LogEntry[]>([]);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const logsContainer = ref<HTMLElement | null>(null);

// 新增配对相关
const showAddPairForm = ref(false);
const newPair = ref({
  alias: '',
  sourcePath: '',
  targetPath: '',
  description: '',
});

const canSaveNewPair = computed(() => {
  return newPair.value.alias.trim() &&
         newPair.value.sourcePath.trim() &&
         newPair.value.targetPath.trim();
});

// 检查是否为 Electron 环境
onMounted(() => {
  isElectron.value = !!(window as any).electron?.fileMove;
  if (isElectron.value) {
    loadPairs();
  } else {
    message.value = '文件移动功能仅在 Electron 客户端中可用';
    messageType.value = 'error';
  }
});

// 加载配对列表
async function loadPairs() {
  const electron = (window as any).electron;
  if (!electron?.fileMove) return;

  try {
    pairs.value = await electron.fileMove.getPairs();
  } catch (error) {
    console.error('加载配对列表失败:', error);
    addLog('加载配对列表失败', 'error');
  }
}

// 选择改变
function onSelectionChange() {
  selectedPairs.value = pairs.value.filter(p => selectedAliases.value.includes(p.alias));
  refreshFiles();
}

// 刷新文件列表
async function refreshFiles() {
  if (selectedPairs.value.length === 0) {
    sourceFiles.value = {};
    targetFiles.value = {};
    return;
  }

  const electron = (window as any).electron;
  if (!electron?.fileMove) return;

  try {
    addLog('正在加载文件列表...', 'info');
    
    for (const pair of selectedPairs.value) {
      // 加载源目录文件
      try {
        const sourceFilesList = await listDirectoryFiles(pair.sourcePath);
        sourceFiles.value[pair.alias] = sourceFilesList;
        addLog(`[${pair.alias}] 源目录: ${sourceFilesList.length} 个文件/目录`, 'info');
      } catch (error: any) {
        sourceFiles.value[pair.alias] = [];
        addLog(`[${pair.alias}] 加载源目录失败: ${error.message}`, 'error');
      }
      
      // 加载目标目录文件
      try {
        const targetFilesList = await listDirectoryFiles(pair.targetPath);
        targetFiles.value[pair.alias] = targetFilesList;
        addLog(`[${pair.alias}] 目标目录: ${targetFilesList.length} 个文件/目录`, 'info');
      } catch (error: any) {
        targetFiles.value[pair.alias] = [];
        addLog(`[${pair.alias}] 加载目标目录失败: ${error.message}`, 'error');
      }
    }
  } catch (error: any) {
    console.error('加载文件列表失败:', error);
    addLog(`加载文件列表失败: ${error.message}`, 'error');
  }
}

// 列出目录下的文件（通过 IPC）
async function listDirectoryFiles(dirPath: string): Promise<string[]> {
  const electron = (window as any).electron;
  if (!electron?.fileMove) return [];

  try {
    const result = await electron.fileMove.listFiles(dirPath);
    if (result.success) {
      return result.files || [];
    } else {
      throw new Error(result.error || '列出文件失败');
    }
  } catch (error: any) {
    console.error('列出文件失败:', error);
    throw error;
  }
}

// 执行文件移动
async function executeMove() {
  if (selectedAliases.value.length === 0 || executing.value) return;

  const pairsList = selectedPairs.value.map(p => `${p.alias} (${p.sourcePath} -> ${p.targetPath})`).join('\n');
  if (!confirm(`确定要执行文件移动操作吗？\n\n将执行以下 ${selectedAliases.value.length} 个配置：\n${pairsList}\n\n每个配置都会清空目标目录中的所有文件，然后复制源目录的所有文件到目标目录。`)) {
    return;
  }

  const electron = (window as any).electron;
  if (!electron?.fileMove) {
    addLog('Electron 环境不可用', 'error');
    return;
  }

  executing.value = true;
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addLog(`开始批量执行文件移动: ${selectedAliases.value.length} 个配置`, 'info');
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < selectedAliases.value.length; i++) {
    const alias = selectedAliases.value[i];
    const pair = selectedPairs.value.find(p => p.alias === alias);
    if (!pair) continue;

    addLog(`\n[${i + 1}/${selectedAliases.value.length}] 执行配置: ${alias}`, 'info');
    addLog(`源目录: ${pair.sourcePath}`, 'info');
    addLog(`目标目录: ${pair.targetPath}`, 'info');

    try {
      const startTime = Date.now();
      addLog('步骤 1/2: 正在清空目标目录...', 'info');
      
      const result = await electron.fileMove.execute(alias, false);
      const duration = Date.now() - startTime;

      if (result.success) {
        addLog('步骤 2/2: 正在复制文件...', 'info');
        addLog(`✓ [${alias}] 操作成功完成！`, 'success');
        if (result.stats) {
          addLog(`✓ 复制文件数: ${result.stats.filesCopied || 0}`, 'success');
          addLog(`✓ 耗时: ${result.stats.duration || duration}ms`, 'success');
        }
        successCount++;
      } else {
        addLog(`✗ [${alias}] 操作失败: ${result.error}`, 'error');
        failCount++;
      }
    } catch (error: any) {
      addLog(`✗ [${alias}] 执行失败: ${error.message}`, 'error');
      failCount++;
    }
  }

  addLog('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addLog(`批量执行完成: 成功 ${successCount} 个，失败 ${failCount} 个`, successCount === selectedAliases.value.length ? 'success' : 'warning');
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

  if (successCount === selectedAliases.value.length) {
    message.value = `所有配置执行成功 (${successCount}个)`;
    messageType.value = 'success';
  } else if (failCount === selectedAliases.value.length) {
    message.value = `所有配置执行失败 (${failCount}个)`;
    messageType.value = 'error';
  } else {
    message.value = `部分成功: ${successCount}个成功, ${failCount}个失败`;
    messageType.value = 'error';
  }
  
  // 刷新文件列表
  addLog('正在刷新文件列表...', 'info');
  await refreshFiles();
  addLog('文件列表已更新', 'success');

  executing.value = false;
}

// 添加日志
function addLog(message: string, type: LogEntry['type'] = 'info') {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  logs.value.push({
    time,
    message,
    type,
  });

  // 自动滚动到底部
  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  });
}

// 清空日志
function clearLogs() {
  logs.value = [];
}

// 监听消息自动清除
watch(message, () => {
  if (message.value) {
    setTimeout(() => {
      message.value = '';
    }, 5000);
  }
});

// 新增配对相关函数
async function selectSourcePath() {
  const electron = (window as any).electron;
  if (!electron?.fileMove) {
    showMessage('Electron 环境不可用', 'error');
    return;
  }

  try {
    const result = await electron.fileMove.selectDirectory('选择源目录');
    if (!result.canceled && result.path) {
      newPair.value.sourcePath = result.path;
    }
  } catch (error: any) {
    console.error('选择目录失败:', error);
    showMessage('选择目录失败', 'error');
  }
}

async function selectTargetPath() {
  const electron = (window as any).electron;
  if (!electron?.fileMove) {
    showMessage('Electron 环境不可用', 'error');
    return;
  }

  try {
    const result = await electron.fileMove.selectDirectory('选择目标目录');
    if (!result.canceled && result.path) {
      newPair.value.targetPath = result.path;
    }
  } catch (error: any) {
    console.error('选择目录失败:', error);
    showMessage('选择目录失败', 'error');
  }
}

async function saveNewPair() {
  const electron = (window as any).electron;
  if (!electron?.fileMove) {
    showMessage('Electron 环境不可用', 'error');
    return;
  }

  if (!canSaveNewPair.value) {
    showMessage('请填写所有必填项', 'error');
    return;
  }

  try {
    const pair = {
      alias: newPair.value.alias.trim(),
      sourcePath: newPair.value.sourcePath.trim(),
      targetPath: newPair.value.targetPath.trim(),
      description: newPair.value.description.trim() || undefined,
    };

    const result = await electron.fileMove.addPair(pair);
    if (result.success) {
      showMessage('配对已添加', 'success');
      await loadPairs();
      cancelAddPair();
    } else {
      showMessage(result.error || '添加失败', 'error');
    }
  } catch (error: any) {
    console.error('保存配对失败:', error);
    showMessage(error.message || '保存失败', 'error');
  }
}

function cancelAddPair() {
  showAddPairForm.value = false;
  newPair.value = {
    alias: '',
    sourcePath: '',
    targetPath: '',
    description: '',
  };
}

function showMessage(text: string, type: 'success' | 'error' = 'success') {
  message.value = text;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 3000);
}
</script>

<style scoped>
.tool-desc {
  margin: 8px 0 16px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  margin-bottom: 16px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.warning-icon {
  font-size: 16px;
}

.warning-text {
  flex: 1;
}

.pairs-multiselect {
  background: var(--bg-input);
  border: 1px solid var(--border-color-input);
  border-radius: 8px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.pair-checkbox-item {
  margin-bottom: 8px;
}

.pair-checkbox-item:last-child {
  margin-bottom: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.checkbox-text {
  flex: 1;
}

.checkbox-text strong {
  color: var(--text-primary);
  font-weight: 600;
}

.pair-desc {
  color: var(--text-tertiary);
  font-weight: normal;
}

.pairs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.btn-small {
  padding: 6px 12px;
  font-size: 13px;
}

.add-pair-form {
  background: var(--bg-input);
  border: 1px solid var(--border-color-input);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.form-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
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

.empty-pairs {
  text-align: center;
  padding: 20px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.pairs-info-section {
  margin-top: 16px;
}

.pair-info-card {
  background: var(--bg-input);
  border: 1px solid var(--border-color-input);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.pair-info-card:last-child {
  margin-bottom: 0;
}

.pair-card-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.pair-card-desc {
  font-weight: normal;
  color: var(--text-tertiary);
  font-size: 14px;
}

.pair-info-section {
  margin-top: 16px;
}

.path-display {
  background: var(--bg-input);
  border: 1px solid var(--border-color-input);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.path-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.path-row:last-child {
  margin-bottom: 0;
}

.path-label {
  color: var(--text-tertiary);
  min-width: 80px;
  font-weight: 500;
}

.path-value {
  color: var(--text-secondary);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  word-break: break-all;
}

.files-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.files-column {
  background: var(--bg-input);
  border: 1px solid var(--border-color-input);
  border-radius: 8px;
  padding: 12px;
  max-height: 300px;
  display: flex;
  flex-direction: column;
}

.files-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.files-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scroll-behavior: smooth;
}

.files-list::-webkit-scrollbar {
  width: 6px;
}

.files-list::-webkit-scrollbar-track {
  background: var(--bg-scrollbar-track);
  border-radius: 3px;
}

.files-list::-webkit-scrollbar-thumb {
  background: var(--bg-scrollbar-thumb);
  border-radius: 3px;
}

.files-list::-webkit-scrollbar-thumb:hover {
  background: var(--bg-scrollbar-thumb-hover);
}

.file-item {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--bg-card);
  word-break: break-all;
}

.file-item.warning {
  color: #ff9800;
  background: rgba(255, 152, 0, 0.1);
}

.files-empty {
  font-size: 12px;
  color: var(--text-quaternary);
  text-align: center;
  padding: 20px;
}

.action-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.logs-section {
  margin-top: 16px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.logs-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-icon-small {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  opacity: 0.7;
  transition: all 0.2s;
}

.btn-icon-small:hover {
  opacity: 1;
  background: var(--bg-input);
}

.logs-container {
  background: var(--bg-input);
  border: 1px solid var(--border-color-input);
  border-radius: 8px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  scroll-behavior: smooth;
}

.logs-container::-webkit-scrollbar {
  width: 8px;
}

.logs-container::-webkit-scrollbar-track {
  background: var(--bg-scrollbar-track);
  border-radius: 4px;
}

.logs-container::-webkit-scrollbar-thumb {
  background: var(--bg-scrollbar-thumb);
  border-radius: 4px;
}

.logs-container::-webkit-scrollbar-thumb:hover {
  background: var(--bg-scrollbar-thumb-hover);
}

.log-item {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  padding: 4px 0;
  line-height: 1.5;
}

.log-item:last-child {
  margin-bottom: 0;
}

.log-time {
  color: var(--text-quaternary);
  min-width: 80px;
  flex-shrink: 0;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.log-item.info .log-message {
  color: var(--text-secondary);
}

.log-item.success .log-message {
  color: #4caf50;
}

.log-item.error .log-message {
  color: #f44336;
}

.log-item.warning .log-message {
  color: #ff9800;
}

.message {
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 16px;
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
</style>

