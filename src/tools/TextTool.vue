<template>
  <div class="tool-card">
    <h2 class="tool-title">文本处理工具</h2>

    <label class="field-label">操作类型</label>
    <select v-model="operation" class="input" style="margin-bottom: 8px;">
      <option value="dedupe">去重（按行）</option>
      <option value="sort">排序（按行）</option>
      <option value="uppercase">转大写</option>
      <option value="lowercase">转小写</option>
      <option value="titlecase">首字母大写</option>
      <option value="camelcase">驼峰命名</option>
      <option value="removeSpecialChars">剔除特殊字符</option>
      <option value="stats">文本统计</option>
    </select>

    <div v-if="operation === 'sort'" style="margin-bottom: 12px;">
      <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
        <input type="checkbox" v-model="sortDescending" style="cursor: pointer; accent-color: #3b82f6;" />
        降序排列
      </label>
    </div>

    <div v-if="operation === 'removeSpecialChars'" style="margin-bottom: 12px;">
      <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; display: block;">
        选择要剔除的特殊字符类型：
      </label>
      <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
          <input type="checkbox" v-model="specialCharTypes" value="emoji" style="cursor: pointer; accent-color: #3b82f6;" />
          Emoji 表情符号
        </label>
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
          <input type="checkbox" v-model="specialCharTypes" value="invisible" style="cursor: pointer; accent-color: #3b82f6;" />
          不可见字符
        </label>
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
          <input type="checkbox" v-model="specialCharTypes" value="control" style="cursor: pointer; accent-color: #3b82f6;" />
          控制字符
        </label>
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
          <input type="checkbox" v-model="specialCharTypes" value="zeroWidth" style="cursor: pointer; accent-color: #3b82f6;" />
          零宽字符
        </label>
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
          <input type="checkbox" v-model="specialCharTypes" value="punctuation" style="cursor: pointer; accent-color: #3b82f6;" />
          标点符号
        </label>
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
          <input type="checkbox" v-model="specialCharTypes" value="symbols" style="cursor: pointer; accent-color: #3b82f6;" />
          特殊符号
        </label>
      </div>
      
      <div style="margin-top: 12px;">
        <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; display: block;">
          手动设置要剔除的字符（可多选）：
        </label>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <input
              v-model="customCharsInput"
              class="input"
              type="text"
              placeholder="输入要剔除的字符，例如: @#$%"
              style="flex: 1; font-size: 13px; padding: 8px 12px;"
              @keyup.enter="addCustomChars"
            />
            <button class="btn secondary" @click="addCustomChars" style="padding: 8px 16px; font-size: 13px;">
              添加
            </button>
          </div>
          <div v-if="customChars.length > 0" class="custom-chars-list">
            <div v-for="(char, index) in customChars" :key="index" class="custom-char-item">
              <span class="char-display">{{ char === ' ' ? '(空格)' : char === '\n' ? '(换行)' : char === '\t' ? '(制表符)' : char }}</span>
              <button class="btn-icon-remove" @click="removeCustomChar(index)" title="删除">×</button>
            </div>
          </div>
          <p style="font-size: 11px; color: var(--text-quaternary); margin: 0;">
            提示：可以输入多个字符，每个字符都会被单独剔除
          </p>
        </div>
      </div>
    </div>

    <label class="field-label">输入</label>
    <textarea
      v-model="input"
      class="textarea"
      rows="6"
      placeholder="输入要处理的文本"
    ></textarea>

    <div class="btn-row">
      <button class="btn" @click="handleProcess">处理</button>
      <button class="btn secondary" @click="handleClear">清空</button>
    </div>

    <div v-if="operation === 'stats' && stats">
      <label class="field-label">统计结果</label>
      <div class="result-line">字符数（含空格）：<strong>{{ stats.characters }}</strong></div>
      <div class="result-line">字符数（不含空格）：<strong>{{ stats.charactersNoSpaces }}</strong></div>
      <div class="result-line">单词数：<strong>{{ stats.words }}</strong></div>
      <div class="result-line">行数：<strong>{{ stats.lines }}</strong></div>
      <div class="result-line">段落数：<strong>{{ stats.paragraphs }}</strong></div>
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
        <span v-if="message" class="hint">{{ message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  removeDuplicates,
  sortLines,
  toUpperCase,
  toLowerCase,
  toTitleCase,
  toCamelCase,
  getTextStats,
  removeSpecialChars,
  type TextStats,
  type SpecialCharType,
} from '@/core/text';

type Operation =
  | 'dedupe'
  | 'sort'
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'camelcase'
  | 'removeSpecialChars'
  | 'stats';

const operation = ref<Operation>('dedupe');
const input = ref('');
const output = ref('');
const message = ref('');
const sortDescending = ref(false);
const stats = ref<TextStats | null>(null);
const specialCharTypes = ref<SpecialCharType[]>(['emoji', 'invisible']);
const customChars = ref<string[]>([]);
const customCharsInput = ref('');

function handleProcess() {
  message.value = '';
  output.value = '';
  stats.value = null;

  if (!input.value.trim() && operation.value !== 'stats') {
    message.value = '请输入内容';
    return;
  }

  try {
    switch (operation.value) {
      case 'dedupe':
        output.value = removeDuplicates(input.value);
        break;
      case 'sort':
        output.value = sortLines(input.value, sortDescending.value);
        break;
      case 'uppercase':
        output.value = toUpperCase(input.value);
        break;
      case 'lowercase':
        output.value = toLowerCase(input.value);
        break;
      case 'titlecase':
        output.value = toTitleCase(input.value);
        break;
      case 'camelcase':
        output.value = toCamelCase(input.value);
        break;
      case 'removeSpecialChars':
        if (specialCharTypes.value.length === 0 && customChars.value.length === 0) {
          message.value = '请至少选择一种要剔除的特殊字符类型或手动添加字符';
          return;
        }
        let result = input.value;
        
        // 先处理预设类型
        if (specialCharTypes.value.length > 0) {
          result = removeSpecialChars(result, specialCharTypes.value);
        }
        
        // 再处理手动添加的字符
        if (customChars.value.length > 0) {
          // 转义特殊字符用于正则表达式
          const escapedChars = customChars.value.map(char => {
            // 转义正则表达式特殊字符
            return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          });
          const regex = new RegExp(`[${escapedChars.join('')}]`, 'g');
          result = result.replace(regex, '');
        }
        
        output.value = result;
        break;
      case 'stats':
        stats.value = getTextStats(input.value);
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
  stats.value = null;
  customChars.value = [];
  customCharsInput.value = '';
}

function addCustomChars() {
  const input = customCharsInput.value.trim();
  if (!input) {
    message.value = '请输入要剔除的字符';
    return;
  }
  
  // 将输入的每个字符添加到列表中（去重）
  const newChars = input.split('').filter(char => !customChars.value.includes(char));
  if (newChars.length === 0) {
    message.value = '这些字符已经添加过了';
    return;
  }
  
  customChars.value.push(...newChars);
  customCharsInput.value = '';
  message.value = `已添加 ${newChars.length} 个字符`;
  setTimeout(() => {
    message.value = '';
  }, 2000);
}

function removeCustomChar(index: number) {
  customChars.value.splice(index, 1);
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
</script>

<style scoped>
.custom-chars-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  background: var(--bg-input);
  border: 1px solid var(--border-color-input);
  border-radius: 6px;
  min-height: 40px;
}

.custom-char-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 12px;
}

.char-display {
  color: var(--text-secondary);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.btn-icon-remove {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: all 0.2s;
}

.btn-icon-remove:hover {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}
</style>
