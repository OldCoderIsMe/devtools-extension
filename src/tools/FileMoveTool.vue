<template>
  <div class="tool-card">
    <h2 class="tool-title">文件移动工具</h2>
    <p class="tool-desc">清空目标目录并复制源目录的所有文件到目标目录</p>

    <div class="warning-banner">
      <span class="warning-icon">⚠️</span>
      <span class="warning-text">此操作会删除目标目录中的所有文件，请谨慎使用</span>
    </div>

    <label class="field-label">选择配对</label>
    <select v-model="selectedAlias" class="input" @change="loadPairInfo">
      <option value="">-- 请选择配对 --</option>
      <option v-for="pair in pairs" :key="pair.alias" :value="pair.alias">
        {{ pair.alias }} - {{ pair.description || '无描述' }}
      </option>
    </select>

    <div v-if="selectedPair" class="pair-info-section">
      <div class="path-display">
        <div class="path-row">
          <span class="path-label">源目录:</span>
          <span class="path-value">{{ selectedPair.sourcePath }}</span>
        </div>
        <div class="path-row">
          <span class="path-label">目标目录:</span>
          <span class="path-value">{{ selectedPair.targetPath }}</span>
        </div>
      </div>

      <div class="files-preview">
        <div class="files-column">
          <h4 class="files-title">源目录文件</h4>
          <div class="files-list" v-if="sourceFiles.length > 0">
            <div v-for="(file, index) in sourceFiles" :key="index" class="file-item">
              {{ file }}
            </div>
          </div>
          <div v-else class="files-empty">暂无文件</div>
        </div>

        <div class="files-column">
          <h4 class="files-title">目标目录文件（将被清空）</h4>
          <div class="files-list" v-if="targetFiles.length > 0">
            <div v-for="(file, index) in targetFiles" :key="index" class="file-item warning">
              {{ file }}
            </div>
          </div>
          <div v-else class="files-empty">目录为空</div>
        </div>
      </div>

      <div class="action-section">
        <button 
          class="btn" 
          @click="executeMove" 
          :disabled="executing || !selectedAlias"
        >
          {{ executing ? '执行中...' : '确定执行' }}
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
const selectedAlias = ref('');
const selectedPair = ref<FileMovePair | null>(null);
const sourceFiles = ref<string[]>([]);
const targetFiles = ref<string[]>([]);
const executing = ref(false);
const logs = ref<LogEntry[]>([]);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const logsContainer = ref<HTMLElement | null>(null);

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
    if (pairs.value.length === 0) {
      message.value = '暂无配置的路径配对，请在设置中配置';
      messageType.value = 'error';
    }
  } catch (error) {
    console.error('加载配对列表失败:', error);
    addLog('加载配对列表失败', 'error');
  }
}

// 加载配对信息
async function loadPairInfo() {
  if (!selectedAlias.value) {
    selectedPair.value = null;
    sourceFiles.value = [];
    targetFiles.value = [];
    return;
  }

  const pair = pairs.value.find(p => p.alias === selectedAlias.value);
  if (!pair) {
    selectedPair.value = null;
    return;
  }

  selectedPair.value = pair;
  await refreshFiles();
}

// 刷新文件列表
async function refreshFiles() {
  if (!selectedPair.value) return;

  const electron = (window as any).electron;
  if (!electron?.fileMove) return;

  try {
    addLog('正在加载文件列表...', 'info');
    
    // 加载源目录文件
    try {
      const sourceFilesList = await listDirectoryFiles(selectedPair.value.sourcePath);
      sourceFiles.value = sourceFilesList;
      addLog(`源目录: ${sourceFilesList.length} 个文件/目录`, 'info');
    } catch (error: any) {
      sourceFiles.value = [];
      addLog(`加载源目录失败: ${error.message}`, 'error');
    }
    
    // 加载目标目录文件
    try {
      const targetFilesList = await listDirectoryFiles(selectedPair.value.targetPath);
      targetFiles.value = targetFilesList;
      addLog(`目标目录: ${targetFilesList.length} 个文件/目录`, 'info');
    } catch (error: any) {
      targetFiles.value = [];
      addLog(`加载目标目录失败: ${error.message}`, 'error');
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
  if (!selectedAlias.value || executing.value) return;

  if (!confirm(`确定要执行文件移动操作吗？\n\n这将清空目标目录 "${selectedPair.value?.targetPath}" 中的所有文件，然后复制源目录 "${selectedPair.value?.sourcePath}" 的所有文件到目标目录。`)) {
    return;
  }

  const electron = (window as any).electron;
  if (!electron?.fileMove) {
    addLog('Electron 环境不可用', 'error');
    return;
  }

  executing.value = true;
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addLog(`开始执行文件移动: ${selectedAlias.value}`, 'info');
  addLog(`源目录: ${selectedPair.value?.sourcePath}`, 'info');
  addLog(`目标目录: ${selectedPair.value?.targetPath}`, 'info');
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

  try {
    const startTime = Date.now();
    addLog('步骤 1/2: 正在清空目标目录...', 'info');
    
    const result = await electron.fileMove.execute(selectedAlias.value, false);
    const duration = Date.now() - startTime;

    if (result.success) {
      addLog('步骤 2/2: 正在复制文件...', 'info');
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
      addLog('✓ 操作成功完成！', 'success');
      if (result.stats) {
        addLog(`✓ 复制文件数: ${result.stats.filesCopied || 0}`, 'success');
        addLog(`✓ 总耗时: ${result.stats.duration || duration}ms`, 'success');
      }
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
      message.value = '文件移动操作成功完成';
      messageType.value = 'success';
      
      // 刷新文件列表
      addLog('正在刷新文件列表...', 'info');
      await refreshFiles();
      addLog('文件列表已更新', 'success');
    } else {
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
      addLog(`✗ 操作失败: ${result.error}`, 'error');
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
      message.value = result.error || '操作失败';
      messageType.value = 'error';
    }
  } catch (error: any) {
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
    addLog(`✗ 执行失败: ${error.message}`, 'error');
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
    message.value = error.message || '执行失败';
    messageType.value = 'error';
  } finally {
    executing.value = false;
  }
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

