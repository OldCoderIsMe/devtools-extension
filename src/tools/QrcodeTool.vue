<template>
  <div class="tool-card">
    <h2 class="tool-title">二维码生成器</h2>

    <label class="field-label">输入内容</label>
    <textarea
      v-model="input"
      class="textarea"
      rows="4"
      placeholder="输入要生成二维码的文本或 URL"
    ></textarea>

    <label class="field-label">二维码尺寸</label>
    <select v-model.number="size" class="input" style="margin-bottom: 8px;">
      <option :value="200">200x200</option>
      <option :value="300">300x300</option>
      <option :value="400">400x400</option>
      <option :value="500">500x500</option>
    </select>

    <div class="btn-row">
      <button class="btn" @click="handleGenerate" :disabled="!input.trim()">
        生成二维码
      </button>
      <button class="btn secondary" @click="handleClear">清空</button>
    </div>

    <div v-if="qrCodeDataUrl" style="margin-top: 12px;">
      <label class="field-label">二维码</label>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <img :src="qrCodeDataUrl" alt="QR Code" style="border: 1px solid var(--border-color-input); border-radius: 12px; background: var(--bg-input); padding: 8px;" />
        <div class="btn-row">
          <button class="btn secondary" @click="handleDownload">下载图片</button>
          <span v-if="message" class="hint">{{ message }}</span>
        </div>
      </div>
    </div>

    <div v-if="error" class="hint error" style="margin-top: 8px;">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import QRCode from 'qrcode';

const input = ref('');
const size = ref(300);
const qrCodeDataUrl = ref('');
const message = ref('');
const error = ref('');

async function handleGenerate() {
  error.value = '';
  message.value = '';
  qrCodeDataUrl.value = '';

  if (!input.value.trim()) {
    error.value = '请输入内容';
    return;
  }

  try {
    const dataUrl = await QRCode.toDataURL(input.value, {
      width: size.value,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    qrCodeDataUrl.value = dataUrl;
  } catch (e: any) {
    error.value = '生成失败：' + (e.message || '未知错误');
  }
}

function handleDownload() {
  if (!qrCodeDataUrl.value) return;

  try {
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = qrCodeDataUrl.value;
    link.click();
    message.value = '下载成功';
  } catch (e: any) {
    message.value = '下载失败：' + (e.message || '未知错误');
  }
}

function handleClear() {
  input.value = '';
  qrCodeDataUrl.value = '';
  message.value = '';
  error.value = '';
}
</script>

