<template>
  <div class="tool-card">
    <h2 class="tool-title">正则表达式测试工具</h2>

    <label class="field-label">正则表达式</label>
    <input
      v-model="pattern"
      class="input"
      placeholder="例如：/^[a-z]+$/i"
      style="margin-bottom: 8px;"
    />

    <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
      <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
        <input type="checkbox" v-model="flags.g" style="cursor: pointer; accent-color: #3b82f6;" />
        全局 (g)
      </label>
      <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
        <input type="checkbox" v-model="flags.i" style="cursor: pointer; accent-color: #3b82f6;" />
        忽略大小写 (i)
      </label>
      <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
        <input type="checkbox" v-model="flags.m" style="cursor: pointer; accent-color: #3b82f6;" />
        多行 (m)
      </label>
      <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); cursor: pointer;">
        <input type="checkbox" v-model="flags.s" style="cursor: pointer; accent-color: #3b82f6;" />
        点号匹配换行 (s)
      </label>
    </div>

    <label class="field-label">测试文本</label>
    <textarea
      v-model="testText"
      class="textarea"
      rows="4"
      placeholder="输入要测试的文本"
    ></textarea>

    <div class="btn-row">
      <button class="btn" @click="handleTest">测试</button>
      <button class="btn secondary" @click="handleClear">清空</button>
    </div>

    <div v-if="replaceMode" style="margin-top: 8px;">
      <label class="field-label">替换文本</label>
      <input
        v-model="replaceText"
        class="input"
        placeholder="替换为..."
        style="margin-bottom: 8px;"
      />
      <button class="btn" @click="handleReplace">执行替换</button>
    </div>

    <div v-else style="margin-top: 8px;">
      <button class="btn secondary" @click="replaceMode = true">切换到替换模式</button>
    </div>

    <div v-if="matches.length > 0 || replaceResult !== null">
      <label class="field-label">结果</label>
      <div v-if="replaceResult !== null" class="result-line">
        <strong>替换结果：</strong>
        <div style="margin-top: 8px; padding: 12px; background: var(--replace-result-bg); backdrop-filter: blur(10px); border-radius: 12px; white-space: pre-wrap; border: 1px solid var(--replace-result-border); color: var(--text-secondary);">{{ replaceResult }}</div>
      </div>
      <div v-else>
        <div class="result-line">
          <strong>匹配数量：</strong>{{ matches.length }}
        </div>
        <div v-for="(match, index) in matches" :key="index" class="result-line" style="margin-top: 8px;">
          <div style="padding: 6px 12px; background: var(--match-bg); border-radius: 10px; display: inline-block; border: 1px solid var(--match-border); color: var(--match-text);">
            匹配 {{ index + 1 }}: "{{ match.text }}"
          </div>
          <div v-if="match.groups && match.groups.length > 0" style="margin-left: 16px; margin-top: 4px; font-size: 11px; color: var(--text-quaternary);">
            分组: {{ match.groups.join(', ') }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="hint error" style="margin-top: 8px;">
      {{ error }}
    </div>

    <div v-if="pattern && testText && !error && matches.length === 0 && replaceResult === null" class="hint" style="margin-top: 8px;">
      未找到匹配
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const pattern = ref('');
const testText = ref('');
const replaceText = ref('');
const flags = ref({
  g: false,
  i: false,
  m: false,
  s: false,
});
const replaceMode = ref(false);
const matches = ref<Array<{ text: string; groups: string[] }>>([]);
const replaceResult = ref<string | null>(null);
const error = ref('');

function getFlagsString(): string {
  let result = '';
  if (flags.value.g) result += 'g';
  if (flags.value.i) result += 'i';
  if (flags.value.m) result += 'm';
  if (flags.value.s) result += 's';
  return result;
}

function handleTest() {
  error.value = '';
  matches.value = [];
  replaceResult.value = null;

  if (!pattern.value.trim()) {
    error.value = '请输入正则表达式';
    return;
  }

  if (!testText.value.trim()) {
    error.value = '请输入测试文本';
    return;
  }

  try {
    let regexPattern = pattern.value.trim();
    // 移除首尾的斜杠（如果用户输入了 /pattern/flags 格式）
    if (regexPattern.startsWith('/')) {
      const lastSlash = regexPattern.lastIndexOf('/');
      if (lastSlash > 0) {
        regexPattern = regexPattern.substring(1, lastSlash);
      } else {
        regexPattern = regexPattern.substring(1);
      }
    }

    const flagsStr = getFlagsString();
    const regex = new RegExp(regexPattern, flagsStr);

    if (flags.value.g) {
      // 全局匹配
      const globalMatches = Array.from(testText.value.matchAll(new RegExp(regexPattern, flagsStr + 'g')));
      matches.value = globalMatches.map((match) => ({
        text: match[0],
        groups: match.slice(1).filter(g => g !== undefined),
      }));
    } else {
      // 单次匹配
      const match = testText.value.match(regex);
      if (match) {
        matches.value = [{
          text: match[0],
          groups: match.slice(1).filter(g => g !== undefined),
        }];
      }
    }
  } catch (e: any) {
    error.value = '正则表达式错误：' + (e.message || '无效的正则表达式');
  }
}

function handleReplace() {
  error.value = '';
  replaceResult.value = null;
  matches.value = [];

  if (!pattern.value.trim()) {
    error.value = '请输入正则表达式';
    return;
  }

  if (!testText.value.trim()) {
    error.value = '请输入测试文本';
    return;
  }

  try {
    let regexPattern = pattern.value.trim();
    if (regexPattern.startsWith('/')) {
      const lastSlash = regexPattern.lastIndexOf('/');
      if (lastSlash > 0) {
        regexPattern = regexPattern.substring(1, lastSlash);
      } else {
        regexPattern = regexPattern.substring(1);
      }
    }

    const flagsStr = getFlagsString();
    const regex = new RegExp(regexPattern, flagsStr);
    replaceResult.value = testText.value.replace(regex, replaceText.value);
  } catch (e: any) {
    error.value = '替换失败：' + (e.message || '无效的正则表达式');
  }
}

function handleClear() {
  pattern.value = '';
  testText.value = '';
  replaceText.value = '';
  matches.value = [];
  replaceResult.value = null;
  error.value = '';
  replaceMode.value = false;
}
</script>

