<template>
  <div class="tool-card">
    <h2 class="tool-title">JSON 格式化工具</h2>

    <label class="field-label">操作类型</label>
    <select v-model="operation" class="input" style="margin-bottom: 8px;">
      <option value="format">格式化</option>
      <option value="compress">压缩</option>
      <option value="validate">验证</option>
      <option value="escape">转义</option>
      <option value="unescape">反转义</option>
    </select>

    <label class="field-label">输入</label>
    <textarea
      v-model="input"
      class="textarea"
      rows="6"
      placeholder="输入 JSON 字符串"
    ></textarea>

    <div class="btn-row">
      <button class="btn" @click="handleProcess">处理</button>
      <button class="btn secondary" @click="handleClear">清空</button>
    </div>

    <div v-if="operation === 'validate'">
      <div v-if="validationResult" class="result-line">
        <span :class="['hint', validationResult.valid ? '' : 'error']">
          {{ validationResult.valid ? '✓ JSON 格式正确' : '✗ ' + validationResult.error }}
        </span>
      </div>
    </div>

    <div v-else>
      <label class="field-label">输出</label>
      <textarea
        class="textarea"
        :value="output"
        readonly
        rows="6"
      ></textarea>

      <div class="btn-row">
        <button class="btn secondary" @click="copyOutput" :disabled="!output">
          复制结果
        </button>
        <button 
          v-if="output" 
          class="btn secondary" 
          @click="showExpanded = true"
          title="放大显示"
        >
          放大显示
        </button>
        <span v-if="message" class="hint">{{ message }}</span>
      </div>
    </div>

    <!-- 放大显示模态框 -->
    <div v-if="showExpanded" class="json-expanded-modal" @click="handleModalClick">
      <div class="json-expanded-content" @click.stop :style="{ width: modalContentWidth }">
        <div class="json-expanded-header">
          <h3>JSON 格式化结果</h3>
          <div class="json-expanded-actions">
            <button class="btn secondary" @click="copyOutputInModal">复制</button>
            <button class="btn secondary" @click="showExpanded = false">关闭</button>
          </div>
        </div>
        <div class="json-expanded-body">
          <pre class="json-expanded-text">{{ output }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import {
  formatJson,
  compressJson,
  validateJson,
  escapeJson,
  unescapeJson,
} from '@/core/json';

type Operation = 'format' | 'compress' | 'validate' | 'escape' | 'unescape';

const operation = ref<Operation>('format');
const input = ref('');
const output = ref('');
const message = ref('');
const validationResult = ref<{ valid: boolean; error?: string } | null>(null);
const showExpanded = ref(false);
const modalContentWidth = ref<string>('90%');

// ESC 键关闭模态框
function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && showExpanded.value) {
    showExpanded.value = false;
  }
}

// 点击模态框外部区域关闭
function handleModalClick(event: MouseEvent) {
  // 如果点击的是模态框背景（不是内容区域），则关闭
  if (event.target === event.currentTarget) {
    showExpanded.value = false;
  }
}

// 计算主编辑区域的宽度
function calculateMainWidth() {
  const mainElement = document.querySelector('.main');
  if (mainElement) {
    const rect = mainElement.getBoundingClientRect();
    // 减去主区域的 padding (左右各 16px)
    const width = rect.width - 32;
    modalContentWidth.value = `${width}px`;
  } else {
    modalContentWidth.value = '90%';
  }
}

// 监听窗口大小变化
function handleResize() {
  if (showExpanded.value) {
    calculateMainWidth();
  }
}

// 当显示弹出框时，计算宽度
watch(showExpanded, (newVal: boolean) => {
  if (newVal) {
    // 使用 setTimeout 确保 DOM 已更新
    setTimeout(() => {
      calculateMainWidth();
    }, 0);
    window.addEventListener('resize', handleResize);
  } else {
    window.removeEventListener('resize', handleResize);
  }
});

onMounted(() => {
  window.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscapeKey);
});

function handleProcess() {
  message.value = '';
  output.value = '';
  validationResult.value = null;

  if (!input.value.trim()) {
    message.value = '请输入内容';
    return;
  }

  try {
    switch (operation.value) {
      case 'format':
        output.value = formatJson(input.value);
        break;
      case 'compress':
        output.value = compressJson(input.value);
        break;
      case 'validate':
        validationResult.value = validateJson(input.value);
        break;
      case 'escape':
        output.value = escapeJson(input.value);
        break;
      case 'unescape':
        output.value = unescapeJson(input.value);
        break;
    }
  } catch (e: any) {
    message.value = e.message ?? '处理失败';
  }
}

function handleClear() {
  input.value = '';
  output.value = '';
  message.value = '';
  validationResult.value = null;
}

async function copyOutput() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    message.value = '已复制到剪贴板';
  } catch {
    message.value = '复制失败，请手动复制';
  }
}

async function copyOutputInModal() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    message.value = '已复制到剪贴板';
    // 短暂延迟后关闭提示
    setTimeout(() => {
      message.value = '';
    }, 2000);
  } catch {
    message.value = '复制失败，请手动复制';
  }
}
</script>

