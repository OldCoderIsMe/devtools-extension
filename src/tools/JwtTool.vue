<template>
  <div class="tool-card">
    <h2 class="tool-title">JWT 解析</h2>

    <label class="field-label">JWT 字符串</label>
    <textarea
      v-model="input"
      class="textarea"
      rows="4"
      placeholder="粘贴 JWT，例如：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx.yyyyy"
      spellcheck="false"
    ></textarea>

    <div class="btn-row">
      <button class="btn" @click="parse">解析</button>
      <button class="btn secondary" @click="handleClear">清空</button>
    </div>

    <div v-if="error" class="hint error jwt-error">{{ error }}</div>

    <template v-if="headerText">
      <label class="field-label">Header</label>
      <pre class="jwt-block">{{ headerText }}</pre>

      <label class="field-label">Payload</label>
      <pre class="jwt-block">{{ payloadText }}</pre>

      <div class="btn-row">
        <button class="btn secondary" @click="copyText(payloadText)">复制 Payload</button>
        <span v-if="message" class="hint">{{ message }}</span>
      </div>

      <div v-if="expInfo" class="result-line jwt-exp" :class="{ expired: expExpired }">
        {{ expInfo }}
      </div>

      <div class="jwt-signature">
        ⚠️ 仅解析内容，不校验签名。不要在不可信环境中粘贴生产环境令牌。
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { decodeBase64Url } from '@/core/clipboard';
import { usePrefill } from '@/core/prefill';

const input = ref('');
const headerText = ref('');
const payloadText = ref('');
const error = ref('');
const message = ref('');
const exp = ref<number | null>(null);

const expExpired = computed(() => exp.value !== null && exp.value * 1000 < Date.now());

const expInfo = computed(() => {
  if (exp.value === null) return '';
  const date = new Date(exp.value * 1000);
  const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
    2,
    '0',
  )}:${String(date.getSeconds()).padStart(2, '0')}`;
  if (expExpired.value) {
    return `已过期（exp: ${exp.value}，${formatted}）`;
  }
  const remaining = Math.floor(exp.value - Date.now() / 1000);
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const parts = [days > 0 ? `${days} 天` : '', hours > 0 ? `${hours} 小时` : '', `${minutes} 分钟`].filter(
    Boolean,
  );
  return `有效期至 ${formatted}（剩余 ${parts.join(' ')}）`;
});

function parse(): void {
  error.value = '';
  headerText.value = '';
  payloadText.value = '';
  message.value = '';
  exp.value = null;

  const token = input.value.trim();
  if (!token) {
    error.value = '请输入 JWT 字符串';
    return;
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    error.value = 'JWT 必须由 header.payload.signature 三段组成';
    return;
  }

  try {
    const header = JSON.parse(decodeBase64Url(segments[0]));
    const payload = JSON.parse(decodeBase64Url(segments[1]));
    headerText.value = JSON.stringify(header, null, 2);
    payloadText.value = JSON.stringify(payload, null, 2);
    if (typeof payload.exp === 'number') {
      exp.value = payload.exp;
    }
  } catch {
    error.value = '无法解析 JWT，请检查内容是否为合法的 Base64URL 编码';
  }
}

function handleClear(): void {
  input.value = '';
  headerText.value = '';
  payloadText.value = '';
  error.value = '';
  message.value = '';
  exp.value = null;
}

async function copyText(text: string): Promise<void> {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.value = '已复制到剪贴板';
    setTimeout(() => {
      message.value = '';
    }, 1500);
  } catch {
    message.value = '复制失败，请手动复制';
  }
}

usePrefill((payload) => {
  if (!payload.value) return;
  input.value = payload.value;
  parse();
  if (payload.truncated) {
    error.value = '选中文本过长，已截断为前 200000 个字符';
  }
});
</script>

<style scoped>
.jwt-block {
  margin: 6px 0 0;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-color-input);
  background: var(--bg-input);
  color: var(--text-primary);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 180px;
  overflow: auto;
}

.jwt-error {
  display: block;
  margin-top: 8px;
}

.jwt-exp {
  margin-top: 8px;
}

.jwt-exp.expired {
  color: #f87171;
}

.jwt-signature {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(234, 179, 8, 0.3);
  background: rgba(234, 179, 8, 0.08);
  color: rgba(234, 179, 8, 0.9);
  font-size: 11px;
  line-height: 1.6;
}
</style>
