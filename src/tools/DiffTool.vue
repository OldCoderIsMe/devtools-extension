<template>
  <div class="tool-card">
    <h2 class="tool-title">文本差异对比工具</h2>

    <label class="field-label">对比模式</label>
    <select v-model="diffMode" class="input" style="margin-bottom: 8px;">
      <option value="line">按行对比</option>
      <option value="char">按字符对比</option>
    </select>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <div>
        <label class="field-label">文本 1</label>
        <textarea
          v-model="text1"
          class="textarea"
          rows="8"
          placeholder="输入第一个文本"
        ></textarea>
      </div>
      <div>
        <label class="field-label">文本 2</label>
        <textarea
          v-model="text2"
          class="textarea"
          rows="8"
          placeholder="输入第二个文本"
        ></textarea>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn" @click="handleCompare">对比</button>
      <button class="btn secondary" @click="handleClear">清空</button>
    </div>

    <div v-if="diffResult.length > 0" style="margin-top: 12px;">
      <label class="field-label">对比结果</label>
      <div
        class="diff-result-container"
        style="
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid var(--diff-result-border);
          border-radius: 12px;
          padding: 12px;
          background: var(--diff-result-bg);
          backdrop-filter: blur(10px);
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.6;
        "
      >
        <div v-for="(item, index) in diffResult" :key="index">
          <span
            v-if="diffMode === 'line'"
            :style="{
              display: 'block',
              padding: '6px 10px',
              marginBottom: '4px',
              borderRadius: '8px',
              backgroundColor:
                item.type === 'added'
                  ? 'var(--diff-added-bg)'
                  : item.type === 'removed'
                  ? 'var(--diff-removed-bg)'
                  : 'transparent',
              color:
                item.type === 'added'
                  ? 'var(--diff-added-text)'
                  : item.type === 'removed'
                  ? 'var(--diff-removed-text)'
                  : 'var(--text-secondary)',
            }"
          >
            <span :style="{ color: 'var(--text-quaternary)', marginRight: '8px', fontWeight: '600' }">
              {{ item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' ' }}
            </span>
            {{ item.content }}
          </span>
          <span
            v-else
            :style="{
              backgroundColor:
                item.type === 'added'
                  ? 'var(--diff-added-bg)'
                  : item.type === 'removed'
                  ? 'var(--diff-removed-bg)'
                  : 'transparent',
              color:
                item.type === 'added'
                  ? 'var(--diff-added-text)'
                  : item.type === 'removed'
                  ? 'var(--diff-removed-text)'
                  : 'var(--text-secondary)',
            }"
          >
            {{ item.char === ' ' ? '·' : item.char === '\n' ? '↵\n' : item.char }}
          </span>
        </div>
      </div>
      <div style="margin-top: 12px; font-size: 12px; color: var(--text-tertiary);">
        <div>统计：</div>
        <div>新增：{{ stats.added }} | 删除：{{ stats.removed }} | 未变：{{ stats.unchanged }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { computeDiff, computeCharDiff, type DiffLine } from '@/core/diff';

const diffMode = ref<'line' | 'char'>('line');
const text1 = ref('');
const text2 = ref('');
const diffResult = ref<DiffLine[] | Array<{ char: string; type: 'added' | 'removed' | 'unchanged' }>>([]);

const stats = computed(() => {
  const added = diffResult.value.filter((item) => item.type === 'added').length;
  const removed = diffResult.value.filter((item) => item.type === 'removed').length;
  const unchanged = diffResult.value.filter((item) => item.type === 'unchanged').length;
  return { added, removed, unchanged };
});

function handleCompare() {
  if (diffMode.value === 'line') {
    diffResult.value = computeDiff(text1.value, text2.value);
  } else {
    diffResult.value = computeCharDiff(text1.value, text2.value);
  }
}

function handleClear() {
  text1.value = '';
  text2.value = '';
  diffResult.value = [];
}
</script>

