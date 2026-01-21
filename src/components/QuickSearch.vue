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
        <!-- 命令提示列表 -->
        <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-list">
          <div
            v-for="(suggestion, index) in suggestions"
            :key="index"
            class="suggestion-item"
            :class="{ active: selectedIndex === index }"
            @click="selectSuggestion(suggestion)"
            @mouseenter="selectedIndex = index"
          >
            <div class="suggestion-command">
              <span class="command-name">{{ suggestion.name }}</span>
              <span v-if="suggestion.aliases.length > 0" class="command-aliases">
                ({{ suggestion.aliases.join(', ') }})
              </span>
            </div>
            <div class="suggestion-desc">{{ suggestion.description }}</div>
            <div class="suggestion-example">{{ suggestion.example }}</div>
          </div>
        </div>
        
        <!-- 空状态提示 -->
        <div v-else-if="!input.trim()" class="quick-search-hint">
          <div class="hint-title">快速命令</div>
          <div class="hint-list">
            <div 
              v-for="cmd in allCommands" 
              :key="cmd.name"
              class="hint-item"
              @click="selectCommand(cmd)"
            >
              <div class="hint-command-col">
                <span class="hint-command">{{ cmd.name }}</span>
                <span v-if="cmd.aliases.length > 0" class="hint-aliases">
                  {{ cmd.aliases.join(', ') }}
                </span>
              </div>
              <span class="hint-desc">{{ cmd.description }}</span>
            </div>
          </div>
        </div>
        
        <!-- 命令执行结果 -->
        <div v-else-if="result && !showSuggestions" class="quick-search-result">
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { parseAndExecuteCommand } from '@/core/commandParser';
import { fuzzyMatchCommands, AVAILABLE_COMMANDS, type CommandInfo } from '@/core/commands';

const input = ref('');
const result = ref<{ success: boolean; output?: string; error?: string } | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const selectedIndex = ref(0);
const suggestions = ref<CommandInfo[]>([]);
const allCommands = ref<CommandInfo[]>(AVAILABLE_COMMANDS);

// 判断是否显示建议列表
const showSuggestions = computed(() => {
  const trimmed = input.value.trim();
  if (!trimmed) return false;
  
  // 如果输入包含空格，说明已经有参数了，不显示建议
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) return false;
  
  return true;
});

// 监听输入变化，更新建议列表
watch(input, () => {
  const trimmed = input.value.trim();
  if (showSuggestions.value) {
    suggestions.value = fuzzyMatchCommands(trimmed);
    selectedIndex.value = 0;
  } else {
    suggestions.value = [];
    // 如果有输入且不是显示建议状态，执行命令
    if (trimmed) {
      parseAndExecuteCommand(trimmed).then(res => {
        result.value = res;
      }).catch(err => {
        result.value = { success: false, error: err.message || '执行命令失败' };
      });
    } else {
      result.value = null;
    }
  }
});

function handleInput() {
  // 输入变化由 watch 处理
}

function selectSuggestion(suggestion: CommandInfo) {
  input.value = suggestion.name + ' ';
  inputRef.value?.focus();
  // 移动光标到末尾
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.setSelectionRange(inputRef.value.value.length, inputRef.value.value.length);
    }
  });
}

function selectCommand(cmd: CommandInfo) {
  input.value = cmd.name + ' ';
  inputRef.value?.focus();
  // 移动光标到末尾
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.setSelectionRange(inputRef.value.value.length, inputRef.value.value.length);
    }
  });
}

function handleKeyDown(e: KeyboardEvent) {
  // ESC 关闭窗口
  if (e.key === 'Escape') {
    if (showSuggestions.value && suggestions.value.length > 0) {
      // 如果正在显示建议，先关闭建议
      suggestions.value = [];
      return;
    }
    closeWindow();
    return;
  }
  
  // 上下箭头选择建议
  if (showSuggestions.value && suggestions.value.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
      return;
    }
    // Enter 选择建议
    if (e.key === 'Enter' && selectedIndex.value >= 0 && selectedIndex.value < suggestions.value.length) {
      e.preventDefault();
      selectSuggestion(suggestions.value[selectedIndex.value]);
      return;
    }
  }
  
  // Tab 选择第一个建议
  if (e.key === 'Tab' && showSuggestions.value && suggestions.value.length > 0) {
    e.preventDefault();
    selectSuggestion(suggestions.value[0]);
    return;
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
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  padding: 20px;
  box-sizing: border-box;
}

.quick-search-window {
  width: 100%;
  max-width: 600px;
  background: rgba(26, 26, 46, 0.85);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  -webkit-app-region: drag;
  cursor: move;
}

.quick-search-header {
  padding: 20px;
  padding-top: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  flex-shrink: 0;
  z-index: 10;
}

.quick-search-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  color: #ffffff;
  outline: none;
  transition: all 0.2s;
  position: relative;
  z-index: 1;
  -webkit-app-region: no-drag;
  cursor: text;
}

.quick-search-input:focus {
  border-color: rgba(100, 150, 255, 0.6);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 2px rgba(100, 150, 255, 0.2);
}

.quick-search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.quick-search-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  max-height: calc(100vh - 180px);
}

/* 自定义滚动条样式 */
.quick-search-content::-webkit-scrollbar {
  width: 8px;
}

.quick-search-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin: 4px 0;
}

.quick-search-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-search-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
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
  align-items: flex-start;
  gap: 32px;
  padding: 10px 8px;
  border-radius: 6px;
  transition: background 0.2s;
  cursor: pointer;
  -webkit-app-region: no-drag;
}

.hint-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.hint-command-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
  flex-shrink: 0;
}

.hint-command {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 13px;
  color: #64b5f6;
  font-weight: 600;
  line-height: 1.4;
}

.hint-aliases {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  line-height: 1.4;
}

.hint-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  flex: 1;
  min-width: 0;
  line-height: 1.4;
  padding-top: 2px;
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
  -webkit-app-region: no-drag;
}

.copy-btn:hover {
  background: rgba(100, 150, 255, 0.3);
  border-color: rgba(100, 150, 255, 0.5);
}

.quick-search-footer {
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  flex-shrink: 0;
}

.footer-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* 建议列表样式 */
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  -webkit-app-region: no-drag;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: rgba(100, 150, 255, 0.15);
  border-color: rgba(100, 150, 255, 0.3);
}

.suggestion-command {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.command-name {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #64b5f6;
}

.command-aliases {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.suggestion-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
}

.suggestion-example {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}
</style>
