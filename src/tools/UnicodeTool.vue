<template>
  <div class="tool-card">
    <h2 class="tool-title">Unicode 转换工具</h2>

    <label class="field-label">转换方向</label>
    <select v-model="direction" class="input" style="margin-bottom: 8px;">
      <option value="to-chinese">Unicode → 中文</option>
      <option value="to-unicode">中文 → Unicode</option>
    </select>

    <div v-if="direction === 'to-unicode'" style="margin-bottom: 12px;">
      <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
        <input type="radio" v-model="unicodeFormat" value="slash" style="cursor: pointer; accent-color: #3b82f6;" />
        <span>\uXXXX 格式</span>
      </label>
      <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer; margin-top: 4px;">
        <input type="radio" v-model="unicodeFormat" value="plus" style="cursor: pointer; accent-color: #3b82f6;" />
        <span>U+XXXX 格式</span>
      </label>
    </div>

    <label class="field-label">输入</label>
    <textarea
      v-model="input"
      class="textarea"
      rows="6"
      :placeholder="direction === 'to-chinese' ? '输入 Unicode 编码，如：\\u4e2d\\u6587 或 U+4E2D U+6587' : '输入中文字符'"
      @input="handleAutoConvert"
    ></textarea>

    <div class="btn-row">
      <button class="btn" @click="handleConvert">转换</button>
      <button class="btn secondary" @click="handleClear">清空</button>
      <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer; margin-left: auto;">
        <input type="checkbox" v-model="autoConvert" style="cursor: pointer; accent-color: #3b82f6;" />
        <span>实时转换</span>
      </label>
    </div>

    <div v-if="output || error">
      <label class="field-label">输出</label>
      <textarea
        class="textarea"
        :class="{ 'error-border': error }"
        :value="error || output"
        readonly
        rows="6"
      ></textarea>

      <div class="btn-row">
        <button class="btn secondary" @click="copyOutput" :disabled="!output">
          复制结果
        </button>
        <span v-if="message" class="hint">{{ message }}</span>
        <span v-if="error" class="hint error">{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  unicodeToChinese,
  chineseToUnicode,
  batchUnicodeToChinese,
  batchChineseToUnicode,
} from '@/core/unicode';

const direction = ref<'to-chinese' | 'to-unicode'>('to-chinese');
const unicodeFormat = ref<'slash' | 'plus'>('slash');
const input = ref('');
const output = ref('');
const error = ref('');
const message = ref('');
const autoConvert = ref(false);

function handleConvert() {
  error.value = '';
  output.value = '';
  message.value = '';

  if (!input.value.trim()) {
    error.value = '请输入内容';
    return;
  }

  try {
    if (direction.value === 'to-chinese') {
      output.value = batchUnicodeToChinese(input.value);
    } else {
      output.value = batchChineseToUnicode(input.value, unicodeFormat.value);
    }
  } catch (e: any) {
    error.value = e.message ?? '转换失败';
  }
}

function handleAutoConvert() {
  if (autoConvert.value) {
    handleConvert();
  }
}

function handleClear() {
  input.value = '';
  output.value = '';
  error.value = '';
  message.value = '';
}

async function copyOutput() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    message.value = '已复制到剪贴板';
    setTimeout(() => {
      message.value = '';
    }, 2000);
  } catch {
    message.value = '复制失败，请手动复制';
  }
}

// 监听方向变化，清空输出
watch(direction, () => {
  output.value = '';
  error.value = '';
  message.value = '';
});

// 监听格式变化，重新转换
watch(unicodeFormat, () => {
  if (autoConvert.value && input.value.trim()) {
    handleConvert();
  }
});
</script>

<style scoped>
.error-border {
  border-color: var(--diff-removed-text) !important;
}
</style>

