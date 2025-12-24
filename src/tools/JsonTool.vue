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
    <div v-if="showExpanded" class="json-expanded-modal" @click.self="showExpanded = false">
      <div class="json-expanded-content">
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
import { ref, onMounted, onUnmounted } from 'vue';
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

// ESC 键关闭模态框
function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && showExpanded.value) {
    showExpanded.value = false;
  }
}

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

