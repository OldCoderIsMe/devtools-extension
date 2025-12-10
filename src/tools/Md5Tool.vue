<template>
    <div class="tool-card">
      <h2 class="tool-title">加密/哈希工具</h2>
  
      <label class="field-label">算法选择</label>
      <select v-model="selectedAlgorithm" class="input" style="margin-bottom: 8px;">
        <option value="md5">MD5</option>
        <option value="sha1">SHA1</option>
        <option value="sha256">SHA256</option>
        <option value="sha512">SHA512</option>
        <option value="base64-encode">Base64 编码</option>
        <option value="base64-decode">Base64 解码</option>
        <option value="aes128-encrypt">AES128 加密</option>
        <option value="aes128-decrypt">AES128 解密</option>
        <option value="aes256-encrypt">AES256 加密</option>
        <option value="aes256-decrypt">AES256 解密</option>
        <option value="hmac-md5">HMAC-MD5</option>
        <option value="hmac-sha1">HMAC-SHA1</option>
        <option value="hmac-sha256">HMAC-SHA256</option>
        <option value="hmac-sha512">HMAC-SHA512</option>
      </select>

      <label v-if="needsKey" class="field-label">密钥</label>
      <input
        v-if="needsKey"
        v-model="key"
        class="input"
        type="password"
        :placeholder="keyPlaceholder"
        style="margin-bottom: 8px;"
      />

      <label class="field-label">输入</label>
      <textarea
        v-model="input"
        class="textarea"
        rows="4"
        :placeholder="inputPlaceholder"
      ></textarea>
  
      <div class="btn-row">
        <button class="btn" @click="handleCompute">{{ actionButtonText }}</button>
        <button class="btn secondary" @click="handleClear">清空</button>
      </div>
  
      <label class="field-label">输出</label>
      <div style="display: flex; gap: 4px; align-items: center;">
        <input class="input" :value="displayOutput" readonly style="flex: 1;" />
        <button 
          v-if="showCaseToggle"
          class="btn secondary" 
          @click="toggleCase" 
          :disabled="!rawOutput"
          style="padding: 6px 8px; font-size: 11px; white-space: nowrap;"
        >
          {{ isUpperCase ? '小写' : '大写' }}
        </button>
      </div>

      <div class="btn-row">
        <button class="btn secondary" @click="copyOutput" :disabled="!displayOutput">
          复制结果
        </button>
        <span v-if="message" class="hint">{{ message }}</span>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import {
    md5,
    sha1,
    sha256,
    sha512,
    base64Encode,
    base64Decode,
    aesEncrypt,
    aesDecrypt,
    hmacMd5,
    hmacSha1,
    hmacSha256,
    hmacSha512,
  } from '@/core/hash';
  
  type Algorithm =
    | 'md5'
    | 'sha1'
    | 'sha256'
    | 'sha512'
    | 'base64-encode'
    | 'base64-decode'
    | 'aes128-encrypt'
    | 'aes128-decrypt'
    | 'aes256-encrypt'
    | 'aes256-decrypt'
    | 'hmac-md5'
    | 'hmac-sha1'
    | 'hmac-sha256'
    | 'hmac-sha512';
  
  const selectedAlgorithm = ref<Algorithm>('md5');
  const input = ref('');
  const key = ref('');
  const rawOutput = ref('');
  const isUpperCase = ref(false);
  const message = ref('');
  
  const needsKey = computed(() => {
    return (
      selectedAlgorithm.value.startsWith('aes') ||
      selectedAlgorithm.value.startsWith('hmac')
    );
  });
  
  const showCaseToggle = computed(() => {
    return (
      selectedAlgorithm.value === 'md5' ||
      selectedAlgorithm.value === 'sha1' ||
      selectedAlgorithm.value === 'sha256' ||
      selectedAlgorithm.value === 'sha512' ||
      selectedAlgorithm.value.startsWith('hmac')
    );
  });
  
  const inputPlaceholder = computed(() => {
    if (selectedAlgorithm.value.startsWith('base64-decode')) {
      return '输入 Base64 编码的字符串';
    }
    if (selectedAlgorithm.value.includes('decrypt')) {
      return '输入要解密的密文';
    }
    if (selectedAlgorithm.value.includes('encrypt')) {
      return '输入要加密的明文';
    }
    return '输入要计算的字符串';
  });
  
  const keyPlaceholder = computed(() => {
    if (selectedAlgorithm.value.startsWith('aes')) {
      return '输入 AES 密钥';
    }
    if (selectedAlgorithm.value.startsWith('hmac')) {
      return '输入 HMAC 密钥';
    }
    return '输入密钥';
  });
  
  const actionButtonText = computed(() => {
    if (selectedAlgorithm.value.includes('encrypt')) {
      return '加密';
    }
    if (selectedAlgorithm.value.includes('decode') || selectedAlgorithm.value.includes('decrypt')) {
      return '解密';
    }
    return '计算';
  });
  
  const displayOutput = computed(() => {
    if (!rawOutput.value) return '';
    if (showCaseToggle.value) {
      return isUpperCase.value
        ? rawOutput.value.toUpperCase()
        : rawOutput.value.toLowerCase();
    }
    return rawOutput.value;
  });
  
  function handleCompute() {
    message.value = '';
    rawOutput.value = '';
    isUpperCase.value = false;
    
    try {
      switch (selectedAlgorithm.value) {
        case 'md5':
          rawOutput.value = md5(input.value);
          break;
        case 'sha1':
          rawOutput.value = sha1(input.value);
          break;
        case 'sha256':
          rawOutput.value = sha256(input.value);
          break;
        case 'sha512':
          rawOutput.value = sha512(input.value);
          break;
        case 'base64-encode':
          rawOutput.value = base64Encode(input.value);
          break;
        case 'base64-decode':
          rawOutput.value = base64Decode(input.value);
          break;
        case 'aes128-encrypt':
          rawOutput.value = aesEncrypt(input.value, key.value, 128);
          break;
        case 'aes128-decrypt':
          rawOutput.value = aesDecrypt(input.value, key.value, 128);
          break;
        case 'aes256-encrypt':
          rawOutput.value = aesEncrypt(input.value, key.value, 256);
          break;
        case 'aes256-decrypt':
          rawOutput.value = aesDecrypt(input.value, key.value, 256);
          break;
        case 'hmac-md5':
          rawOutput.value = hmacMd5(input.value, key.value);
          break;
        case 'hmac-sha1':
          rawOutput.value = hmacSha1(input.value, key.value);
          break;
        case 'hmac-sha256':
          rawOutput.value = hmacSha256(input.value, key.value);
          break;
        case 'hmac-sha512':
          rawOutput.value = hmacSha512(input.value, key.value);
          break;
        default:
          message.value = '未知算法';
      }
    } catch (e: any) {
      message.value = e.message ?? '操作失败';
    }
  }
  
  function toggleCase() {
    if (!rawOutput.value) return;
    isUpperCase.value = !isUpperCase.value;
  }
  
  function handleClear() {
    input.value = '';
    key.value = '';
    rawOutput.value = '';
    isUpperCase.value = false;
    message.value = '';
  }
  
  async function copyOutput() {
    if (!displayOutput.value) return;
    try {
      await navigator.clipboard.writeText(displayOutput.value);
      message.value = '已复制到剪贴板';
    } catch {
      message.value = '复制失败，请手动复制';
    }
  }
  </script>