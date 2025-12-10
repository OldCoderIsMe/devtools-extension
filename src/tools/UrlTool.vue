<template>
    <div class="tool-card">
      <h2 class="tool-title">URL 编码 / 解码</h2>
  
      <label class="field-label">输入</label>
      <textarea
        v-model="input"
        class="textarea"
        placeholder="在这里输入要编码或解码的内容"
        rows="4"
      ></textarea>
  
      <div class="btn-row">
        <button class="btn" @click="handleEncode">编码</button>
        <button class="btn" @click="handleDecode">解码</button>
        <button class="btn secondary" @click="handleClear">清空</button>
      </div>
  
      <label class="field-label">输出</label>
      <textarea class="textarea" :value="output" readonly rows="4"></textarea>
  
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
  import { urlEncode, urlDecode } from '@/core/url';
  
  const input = ref('');
  const output = ref('');
  const message = ref('');
  
  function handleEncode() {
    message.value = '';
    try {
      output.value = urlEncode(input.value);
    } catch (e: any) {
      message.value = e.message ?? '编码失败';
    }
  }
  
  function handleDecode() {
    message.value = '';
    try {
      output.value = urlDecode(input.value);
    } catch (e: any) {
      message.value = e.message ?? '解码失败';
    }
  }
  
  function handleClear() {
    input.value = '';
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