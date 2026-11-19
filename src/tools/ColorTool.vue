<template>
  <div class="tool-card">
    <h2 class="tool-title">颜色工具</h2>

    <div class="color-preview-row">
      <div class="color-swatch" :style="{ background: hex }"></div>
      <div class="color-preview-meta">
        <label class="field-label" style="margin-top: 0;">当前颜色</label>
        <input
          v-model="hexInput"
          class="input color-hex-input"
          type="text"
          placeholder="#3b82f6"
          spellcheck="false"
          @keydown.enter="applyHexInput"
          @blur="applyHexInput"
        />
        <div class="btn-row" style="margin: 8px 0 0;">
          <button class="btn" :disabled="!eyeDropperSupported" @click="pickFromScreen">从屏幕取色</button>
          <button class="btn secondary" @click="openInTab">在标签页中取色</button>
        </div>
      </div>
    </div>

    <div v-if="message" class="hint color-message">{{ message }}</div>

    <div class="color-channels">
      <div class="color-channel-group">
        <label class="field-label">RGB</label>
        <div v-for="channel in RGB_CHANNELS" :key="channel.key" class="color-channel-row">
          <span class="color-channel-label">{{ channel.label }}</span>
          <input
            class="color-range"
            type="range"
            min="0"
            max="255"
            :value="rgb[channel.key]"
            @input="setRgbChannel(channel.key, $event)"
          />
          <input
            class="input color-number"
            type="number"
            min="0"
            max="255"
            :value="rgb[channel.key]"
            @input="setRgbChannel(channel.key, $event)"
          />
        </div>
      </div>

      <div class="color-channel-group">
        <label class="field-label">HSL</label>
        <div v-for="channel in HSL_CHANNELS" :key="channel.key" class="color-channel-row">
          <span class="color-channel-label">{{ channel.label }}</span>
          <input
            class="color-range"
            type="range"
            :min="0"
            :max="channel.max"
            :value="hsl[channel.key]"
            @input="setHslChannel(channel.key, $event)"
          />
          <input
            class="input color-number"
            type="number"
            :min="0"
            :max="channel.max"
            :value="hsl[channel.key]"
            @input="setHslChannel(channel.key, $event)"
          />
        </div>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn secondary" @click="copyValue('hex')">复制 HEX</button>
      <button class="btn secondary" @click="copyValue('rgb')">复制 RGB</button>
      <button class="btn secondary" @click="copyValue('hsl')">复制 HSL</button>
      <span v-if="copyMessage" class="hint">{{ copyMessage }}</span>
    </div>

    <hr class="divider" />

    <div class="color-contrast">
      <label class="field-label" style="margin-top: 0;">WCAG 对比度检测</label>
      <div class="contrast-pickers">
        <label class="contrast-picker">
          <span>前景色</span>
          <input type="color" :value="foregroundHex" @input="onForegroundInput" />
          <code>{{ foregroundHex }}</code>
        </label>
        <label class="contrast-picker">
          <span>背景色</span>
          <input type="color" :value="backgroundHex" @input="onBackgroundInput" />
          <code>{{ backgroundHex }}</code>
        </label>
        <button class="btn secondary contrast-swap" @click="swapContrast">交换</button>
      </div>

      <div class="contrast-preview" :style="{ color: foregroundHex, background: backgroundHex }">
        DevTools Suite 本地计算示例文字
      </div>

      <div class="contrast-result">
        <span>对比度 <strong>{{ wcag.ratio }}:1</strong></span>
        <span :class="['contrast-badge', wcag.aa ? 'pass' : 'fail']">AA {{ wcag.aa ? '通过' : '未通过' }}</span>
        <span :class="['contrast-badge', wcag.aaa ? 'pass' : 'fail']">AAA {{ wcag.aaa ? '通过' : '未通过' }}</span>
        <span :class="['contrast-badge', wcag.aaLarge ? 'pass' : 'fail']">大字号 AA {{ wcag.aaLarge ? '通过' : '未通过' }}</span>
      </div>
    </div>

    <div v-if="history.length > 0" class="color-history">
      <label class="field-label">最近取色</label>
      <div class="color-history-list">
        <button
          v-for="item in history"
          :key="item"
          class="color-history-item"
          :style="{ background: item }"
          :title="item"
          @click="applyColor(item)"
        ></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  formatColor,
  hslToRgb,
  parseColor,
  rgbToHex,
  rgbToHsl,
  evaluateWcag,
  type RgbColor,
} from '@/core/color';
import { usePrefill } from '@/core/prefill';

const RGB_CHANNELS = [
  { key: 'r', label: 'R' },
  { key: 'g', label: 'G' },
  { key: 'b', label: 'B' },
] as const;

const HSL_CHANNELS = [
  { key: 'h', label: 'H', max: 360 },
  { key: 's', label: 'S', max: 100 },
  { key: 'l', label: 'L', max: 100 },
] as const;

const COLOR_HISTORY_KEY = 'devtools-color-history';
const COLOR_PENDING_KEY = 'devtools-color-pending';
const COLOR_LAST_KEY = 'devtools-color-last';
const COLOR_HISTORY_LIMIT = 12;

const rgb = ref<RgbColor>({ r: 59, g: 130, b: 246 });
const hexInput = ref('#3b82f6');
const message = ref('');
const copyMessage = ref('');

const foregroundHex = ref('#ffffff');
const backgroundHex = ref('#1a1a2e');

const history = ref<string[]>([]);

const hex = computed(() => rgbToHex(rgb.value));
const hsl = computed(() => rgbToHsl(rgb.value));
const wcag = computed(() => {
  const foreground = parseColor(foregroundHex.value) ?? { r: 255, g: 255, b: 255 };
  const background = parseColor(backgroundHex.value) ?? { r: 0, g: 0, b: 0 };
  return evaluateWcag(foreground, background);
});

const eyeDropperSupported = computed(
  () => typeof window !== 'undefined' && typeof (window as any).EyeDropper === 'function',
);

function getStorageArea(): any {
  const chromeApi = typeof chrome !== 'undefined' ? (chrome as any) : undefined;
  return chromeApi?.storage?.local;
}

function storageGet(key: string): Promise<unknown> {
  const area = getStorageArea();
  if (area) {
    return new Promise((resolve) => {
      try {
        area.get([key], (result: Record<string, unknown>) => resolve(result?.[key]));
      } catch {
        resolve(undefined);
      }
    });
  }
  try {
    const raw = localStorage.getItem(key);
    return Promise.resolve(raw ? JSON.parse(raw) : undefined);
  } catch {
    return Promise.resolve(undefined);
  }
}

function storageSet(key: string, value: unknown): Promise<void> {
  const area = getStorageArea();
  if (area) {
    return new Promise((resolve) => {
      try {
        area.set({ [key]: value }, () => resolve());
      } catch {
        resolve();
      }
    });
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 忽略不可用环境 */
  }
  return Promise.resolve();
}

function storageRemove(key: string): Promise<void> {
  const area = getStorageArea();
  if (area) {
    return new Promise((resolve) => {
      try {
        area.remove(key, () => resolve());
      } catch {
        resolve();
      }
    });
  }
  try {
    localStorage.removeItem(key);
  } catch {
    /* 忽略不可用环境 */
  }
  return Promise.resolve();
}

function applyColor(value: string): boolean {
  const parsed = parseColor(value);
  if (!parsed) {
    message.value = '无法识别的颜色格式，请使用 #3b82f6 / rgb(59, 130, 246) / hsl(217, 91%, 60%)';
    return false;
  }
  message.value = '';
  rgb.value = parsed;
  hexInput.value = rgbToHex(parsed);
  return true;
}

function applyHexInput(): void {
  applyColor(hexInput.value);
}

function setRgbChannel(channel: 'r' | 'g' | 'b', event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isNaN(value)) return;
  rgb.value = { ...rgb.value, [channel]: Math.min(255, Math.max(0, Math.round(value))) };
  hexInput.value = rgbToHex(rgb.value);
  message.value = '';
}

function setHslChannel(channel: 'h' | 's' | 'l', event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isNaN(value)) return;
  const next = { ...hsl.value, [channel]: Math.round(value) };
  rgb.value = hslToRgb(next);
  hexInput.value = rgbToHex(rgb.value);
  message.value = '';
}

async function copyValue(format: 'hex' | 'rgb' | 'hsl'): Promise<void> {
  const value = formatColor(rgb.value, format);
  try {
    await navigator.clipboard.writeText(value);
    copyMessage.value = `已复制 ${value}`;
    setTimeout(() => {
      copyMessage.value = '';
    }, 1500);
  } catch {
    copyMessage.value = '复制失败，请手动复制';
  }
}

async function pushHistory(value: string): Promise<void> {
  const normalized = value.toLowerCase();
  history.value = [normalized, ...history.value.filter((item) => item !== normalized)].slice(
    0,
    COLOR_HISTORY_LIMIT,
  );
  await storageSet(COLOR_HISTORY_KEY, history.value);
}

async function loadHistory(): Promise<void> {
  const saved = await storageGet(COLOR_HISTORY_KEY);
  if (Array.isArray(saved)) {
    history.value = saved.filter((item): item is string => typeof item === 'string').slice(0, COLOR_HISTORY_LIMIT);
  }
}

async function pickFromScreen(): Promise<void> {
  const EyeDropperCtor = (window as any).EyeDropper;
  if (typeof EyeDropperCtor !== 'function') {
    message.value = '当前环境不支持屏幕取色，请使用「在标签页中取色」';
    return;
  }

  // popup 会在取色时失焦关闭，先把标记写入存储，下次打开时恢复结果或给出提示
  await storageSet(COLOR_PENDING_KEY, Date.now());
  try {
    const result = await new EyeDropperCtor().open();
    const picked = String(result?.sRGBHex ?? '');
    if (picked) {
      applyColor(picked);
      await pushHistory(picked);
      await storageSet(COLOR_LAST_KEY, picked);
      await storageRemove(COLOR_PENDING_KEY);
      message.value = `已取色 ${picked}`;
    }
  } catch {
    await storageRemove(COLOR_PENDING_KEY);
    message.value = '已取消取色';
  }
}

function openInTab(): void {
  const chromeApi = typeof chrome !== 'undefined' ? (chrome as any) : undefined;
  if (!chromeApi?.tabs?.create || !chromeApi?.runtime?.getURL) {
    message.value = '当前环境不支持打开标签页，请直接在浏览器中使用取色器';
    return;
  }
  chromeApi.tabs.create({ url: chromeApi.runtime.getURL('index.html?tool=color') });
}

function onForegroundInput(event: Event): void {
  foregroundHex.value = (event.target as HTMLInputElement).value;
}

function onBackgroundInput(event: Event): void {
  backgroundHex.value = (event.target as HTMLInputElement).value;
}

function swapContrast(): void {
  const current = foregroundHex.value;
  foregroundHex.value = backgroundHex.value;
  backgroundHex.value = current;
}

usePrefill((payload) => {
  if (!payload.value) return;
  if (applyColor(payload.value)) {
    void pushHistory(rgbToHex(rgb.value));
    if (payload.truncated) {
      message.value = '选中文本过长，已截断为前 200000 个字符';
    }
  }
});

onMounted(async () => {
  await loadHistory();

  const pending = await storageGet(COLOR_PENDING_KEY);
  if (pending) {
    await storageRemove(COLOR_PENDING_KEY);
    const last = await storageGet(COLOR_LAST_KEY);
    if (typeof last === 'string' && applyColor(last)) {
      message.value = `已恢复上次取色 ${last}`;
    } else {
      message.value = '上次在 popup 中取色时窗口被浏览器关闭，建议使用「在标签页中取色」';
    }
  }
});
</script>

<style scoped>
.color-preview-row {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

.color-swatch {
  width: 96px;
  min-height: 96px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.color-preview-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.color-hex-input {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  text-transform: lowercase;
}

.color-message {
  display: block;
  margin-top: 8px;
}

.color-channels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 8px;
}

.color-channel-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.color-channel-label {
  width: 14px;
  font-size: 12px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.color-range {
  flex: 1;
  min-width: 0;
  accent-color: #3b82f6;
  cursor: pointer;
}

.color-number {
  width: 64px;
  padding: 4px 8px;
  flex-shrink: 0;
}

.contrast-pickers {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.contrast-picker {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.contrast-picker input[type='color'] {
  width: 32px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--border-color-input);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.contrast-picker code {
  font-size: 11px;
  color: var(--text-quaternary);
}

.contrast-swap {
  padding: 4px 10px;
  font-size: 12px;
}

.contrast-preview {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-color-input);
  font-size: 13px;
  font-weight: 500;
}

.contrast-result {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.contrast-result strong {
  color: var(--text-primary);
}

.contrast-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid transparent;
}

.contrast-badge.pass {
  color: #4ade80;
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
}

.contrast-badge.fail {
  color: #f87171;
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
}

.color-history {
  margin-top: 12px;
}

.color-history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-history-item {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--border-color-input);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.color-history-item:hover {
  transform: scale(1.1);
}
</style>
