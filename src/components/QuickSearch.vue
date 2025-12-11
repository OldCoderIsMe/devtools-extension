<template>
  <div class="quick-search-container">
    <div class="quick-search-window">
      <div class="quick-search-header">
        <input
          ref="inputRef"
          v-model="input"
          class="quick-search-input"
          type="text"
          placeholder="输入命令，例如: md5 hello"
          @input="handleInput"
          @keydown="handleKeyDown"
          autofocus
        />
      </div>
      <div class="quick-search-content">
        <div v-if="!input.trim()" class="quick-search-hint">
          <div class="hint-title">快速命令</div>
          <div class="hint-list">
            <div class="hint-item">
              <span class="hint-command">md5</span>
              <span class="hint-desc">计算 MD5 哈希值</span>
            </div>
            <div class="hint-item">
              <span class="hint-command">sha256</span>
              <span class="hint-desc">计算 SHA256 哈希值</span>
            </div>
            <div class="hint-item">
              <span class="hint-command">base64</span>
              <span class="hint-desc">Base64 编码</span>
            </div>
            <div class="hint-item">
              <span class="hint-command">urlencode</span>
              <span class="hint-desc">URL 编码</span>
            </div>
            <div class="hint-item">
              <span class="hint-command">timestamp</span>
              <span class="hint-desc">时间戳转日期</span>
            </div>
          </div>
        </div>
        <div v-else-if="result" class="quick-search-result">
          <div v-if="result.success" class="result-success">
            <div class="result-label">结果:</div>
            <div class="result-output">{{ result.output }}</div>
            <button class="copy-btn" @click="copyResult" v-if="result.output">
              复制
            </button>
          </div>
          <div v-else class="result-error">
            <div class="result-label">错误:</div>
            <div class="result-error-text">{{ result.error }}</div>
          </div>
        </div>
      </div>
      <div class="quick-search-footer">
        <span class="footer-hint">按 ESC 关闭</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { parseAndExecuteCommand } from '@/core/commandParser';

const input = ref('');
const result = ref<{ success: boolean; output?: string; error?: string } | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

function handleInput() {
  const trimmed = input.value.trim();
  if (!trimmed) {
    result.value = null;
    return;
  }

  result.value = parseAndExecuteCommand(trimmed);
}

function handleKeyDown(e: KeyboardEvent) {
  // ESC 关闭窗口
  if (e.key === 'Escape') {
    closeWindow();
  }
  // Cmd/Ctrl + Enter 复制结果
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && result.value?.success && result.value.output) {
    copyResult();
  }
}

async function copyResult() {
  if (!result.value?.output) return;
  
  try {
    await navigator.clipboard.writeText(result.value.output);
    // 可以添加一个短暂的提示
    const btn = document.querySelector('.copy-btn') as HTMLButtonElement;
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = '已复制!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 1000);
    }
  } catch (e) {
    console.error('复制失败:', e);
  }
}

function closeWindow() {
  const electron = (window as any).electron;
  if (electron && electron.quickSearch) {
    electron.quickSearch.close();
  }
}

// 监听 ESC 键
const handleEsc = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeWindow();
  }
};

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus();
  });

  window.addEventListener('keydown', handleEsc);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleEsc);
});
</script>

<style scoped>
.quick-search-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  padding: 20px;
  box-sizing: border-box;
}

.quick-search-window {
  width: 100%;
  max-width: 600px;
  background: #1a1a2e;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.quick-search-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-search-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  color: #ffffff;
  outline: none;
  transition: all 0.2s;
}

.quick-search-input:focus {
  border-color: rgba(100, 150, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.quick-search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.quick-search-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  min-height: 200px;
}

.quick-search-hint {
  color: rgba(255, 255, 255, 0.7);
}

.hint-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.hint-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.hint-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.hint-command {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 13px;
  color: #64b5f6;
  font-weight: 600;
  min-width: 100px;
}

.hint-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.quick-search-result {
  color: rgba(255, 255, 255, 0.9);
}

.result-success,
.result-error {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.5px;
}

.result-output {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 6px;
  word-break: break-all;
  color: #4caf50;
  line-height: 1.6;
}

.result-error-text {
  font-size: 14px;
  color: #f44336;
  padding: 12px;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 6px;
  border-left: 3px solid #f44336;
}

.copy-btn {
  align-self: flex-start;
  background: rgba(100, 150, 255, 0.2);
  border: 1px solid rgba(100, 150, 255, 0.3);
  color: #64b5f6;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: rgba(100, 150, 255, 0.3);
  border-color: rgba(100, 150, 255, 0.5);
}

.quick-search-footer {
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.footer-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
