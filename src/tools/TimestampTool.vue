<template>
    <div class="tool-card">
      <h2 class="tool-title">时间戳转换</h2>
  
      <div class="section">
        <label class="field-label">时间戳 → 本地时间</label>
        <input
          v-model="timestampInput"
          class="input"
          placeholder="例如：1702022400 或 1702022400000"
        />
        <div class="btn-row">
          <button class="btn" @click="handleTsToDate">转换</button>
          <span v-if="tsError" class="hint error">{{ tsError }}</span>
        </div>
        <div v-if="tsOutput" class="result-line">
          本地时间：<strong>{{ tsOutput }}</strong>
        </div>
      </div>
  
      <hr class="divider" />
  
      <div class="section">
        <label class="field-label">日期时间 → 时间戳（毫秒）</label>
        <input
          v-model="dateInput"
          class="input"
          placeholder="例如：2025-12-08 12:30:00"
        />
        <div class="btn-row">
          <button class="btn" @click="handleDateToTs">转换</button>
          <span v-if="dateError" class="hint error">{{ dateError }}</span>
        </div>
        <div v-if="dateOutput" class="result-line">
          时间戳（毫秒）：<strong>{{ dateOutput }}</strong>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import {
    timestampToLocalString,
    dateStringToTimestamp,
  } from '@/core/time';
  
  const timestampInput = ref('');
  const tsOutput = ref('');
  const tsError = ref('');
  
  const dateInput = ref('');
  const dateOutput = ref<number | ''>('');
  const dateError = ref('');
  
  function handleTsToDate() {
    tsError.value = '';
    tsOutput.value = '';
    try {
      tsOutput.value = timestampToLocalString(timestampInput.value);
    } catch (e: any) {
      tsError.value = e.message ?? '转换失败';
    }
  }
  
  function handleDateToTs() {
    dateError.value = '';
    dateOutput.value = '';
    try {
      dateOutput.value = dateStringToTimestamp(dateInput.value);
    } catch (e: any) {
      dateError.value = e.message ?? '转换失败';
    }
  }
  </script>