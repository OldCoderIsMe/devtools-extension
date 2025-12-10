<template>
  <div class="tool-card">
    <h2 class="tool-title">UUID / 随机字符串生成器</h2>

    <label class="field-label">生成类型</label>
    <select v-model="generatorType" class="input" style="margin-bottom: 8px;">
      <option value="uuid">UUID v4</option>
      <option value="random">随机字符串</option>
      <option value="password">随机密码</option>
    </select>

    <div v-if="generatorType === 'random' || generatorType === 'password'">
      <label class="field-label">长度</label>
      <input
        v-model.number="length"
        type="number"
        min="1"
        max="1000"
        class="input"
        style="margin-bottom: 8px;"
      />

      <div v-if="generatorType === 'random'">
        <label class="field-label">字符集</label>
        <select v-model="charset" class="input" style="margin-bottom: 8px;">
          <option value="alphanumeric">字母数字 (a-z, A-Z, 0-9)</option>
          <option value="lowercase">小写字母 (a-z)</option>
          <option value="uppercase">大写字母 (A-Z)</option>
          <option value="letters">所有字母 (a-z, A-Z)</option>
          <option value="numbers">数字 (0-9)</option>
          <option value="hex">十六进制 (0-9, a-f)</option>
        </select>
      </div>

      <div v-if="generatorType === 'password'">
        <label class="field-label">密码选项</label>
        <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
            <input type="checkbox" v-model="includeLowercase" style="cursor: pointer; accent-color: #3b82f6;" />
            包含小写字母
          </label>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
            <input type="checkbox" v-model="includeUppercase" style="cursor: pointer; accent-color: #3b82f6;" />
            包含大写字母
          </label>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
            <input type="checkbox" v-model="includeNumbers" style="cursor: pointer; accent-color: #3b82f6;" />
            包含数字
          </label>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
            <input type="checkbox" v-model="includeSymbols" style="cursor: pointer; accent-color: #3b82f6;" />
            包含特殊字符 (!@#$%^&*)
          </label>
        </div>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn" @click="handleGenerate">生成</button>
      <button class="btn" @click="handleGenerateBatch">批量生成 (10个)</button>
      <button class="btn secondary" @click="handleClear">清空</button>
    </div>

    <label class="field-label">结果</label>
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
</template>

<script setup lang="ts">
import { ref } from 'vue';

type GeneratorType = 'uuid' | 'random' | 'password';
type Charset = 'alphanumeric' | 'lowercase' | 'uppercase' | 'letters' | 'numbers' | 'hex';

const generatorType = ref<GeneratorType>('uuid');
const length = ref(16);
const charset = ref<Charset>('alphanumeric');
const includeLowercase = ref(true);
const includeUppercase = ref(true);
const includeNumbers = ref(true);
const includeSymbols = ref(false);
const output = ref('');
const message = ref('');

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCharsetString(): string {
  switch (charset.value) {
    case 'alphanumeric':
      return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    case 'lowercase':
      return 'abcdefghijklmnopqrstuvwxyz';
    case 'uppercase':
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    case 'letters':
      return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    case 'numbers':
      return '0123456789';
    case 'hex':
      return '0123456789abcdef';
    default:
      return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  }
}

function generateRandomString(len: number, charSet: string): string {
  let result = '';
  for (let i = 0; i < len; i++) {
    result += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }
  return result;
}

function generatePassword(len: number): string {
  let charSet = '';
  if (includeLowercase.value) charSet += 'abcdefghijklmnopqrstuvwxyz';
  if (includeUppercase.value) charSet += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeNumbers.value) charSet += '0123456789';
  if (includeSymbols.value) charSet += '!@#$%^&*';

  if (!charSet) {
    throw new Error('至少选择一种字符类型');
  }

  return generateRandomString(len, charSet);
}

function handleGenerate() {
  message.value = '';
  try {
    switch (generatorType.value) {
      case 'uuid':
        output.value = generateUuid();
        break;
      case 'random':
        if (length.value < 1 || length.value > 1000) {
          message.value = '长度必须在 1-1000 之间';
          return;
        }
        output.value = generateRandomString(length.value, getCharsetString());
        break;
      case 'password':
        if (length.value < 1 || length.value > 1000) {
          message.value = '长度必须在 1-1000 之间';
          return;
        }
        output.value = generatePassword(length.value);
        break;
    }
  } catch (e: any) {
    message.value = e.message ?? '生成失败';
  }
}

function handleGenerateBatch() {
  message.value = '';
  try {
    const results: string[] = [];
    for (let i = 0; i < 10; i++) {
      switch (generatorType.value) {
        case 'uuid':
          results.push(generateUuid());
          break;
        case 'random':
          if (length.value < 1 || length.value > 1000) {
            message.value = '长度必须在 1-1000 之间';
            return;
          }
          results.push(generateRandomString(length.value, getCharsetString()));
          break;
        case 'password':
          if (length.value < 1 || length.value > 1000) {
            message.value = '长度必须在 1-1000 之间';
            return;
          }
          results.push(generatePassword(length.value));
          break;
      }
    }
    output.value = results.join('\n');
  } catch (e: any) {
    message.value = e.message ?? '生成失败';
  }
}

function handleClear() {
  output.value = '';
  message.value = '';
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

