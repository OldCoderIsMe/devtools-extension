<template>
  <div class="clipboard-bar" role="status">
    <span class="clipboard-icon">📋</span>
    <template v-if="detection">
      <span class="clipboard-text">{{ detection.description }}</span>
      <button class="clipboard-action" type="button" @click="$emit('go')">去处理 →</button>
    </template>
    <template v-else>
      <span class="clipboard-text">开启剪贴板智能识别？内容仅在本地识别，不会上传或保存。</span>
      <button class="clipboard-action" type="button" @click="$emit('enable')">开启</button>
    </template>
    <button class="clipboard-close" type="button" title="关闭" aria-label="关闭" @click="$emit('dismiss')">
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ClipboardDetection } from '@/core/clipboard';

defineProps<{
  detection: ClipboardDetection | null;
}>();

defineEmits<{
  (event: 'go'): void;
  (event: 'enable'): void;
  (event: 'dismiss'): void;
}>();
</script>

<style scoped>
.clipboard-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.22) 0%, rgba(37, 99, 235, 0.28) 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.35);
  color: var(--text-secondary);
  font-size: 12px;
  flex-shrink: 0;
}

.clipboard-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.clipboard-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clipboard-action {
  flex-shrink: 0;
  border: 1px solid rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.25);
  color: #bfdbfe;
  border-radius: 999px;
  padding: 3px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.clipboard-action:hover {
  background: rgba(59, 130, 246, 0.4);
}

.clipboard-close {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--text-quaternary);
  font-size: 16px;
  line-height: 1;
  padding: 0 2px;
  cursor: pointer;
}

.clipboard-close:hover {
  color: var(--text-secondary);
}
</style>
