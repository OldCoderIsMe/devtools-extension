<template>
    <div v-if="isMarkdownEditorWindow" class="markdown-editor-shell">
      <MarkdownTool
        :initial-file="pendingMarkdownFile"
        @file-loaded="pendingMarkdownFile = null"
      />
    </div>
    <div v-else :class="['app', { 'light-theme': isLightTheme, 'fullscreen': isFullscreen, 'electron': isElectron, 'chrome-extension': isChromeExtension }]" ref="appRef">
      <!-- Electron 环境：顶部可拖动区域 -->
      <div v-if="isElectron" class="electron-titlebar"></div>

      <!-- 剪贴板智能识别建议条（仅 Chrome 扩展） -->
      <ClipboardSuggestion
        v-if="showClipboardBar"
        :detection="clipboardDetection"
        @go="handleClipboardGo"
        @enable="enableClipboardDetection"
        @dismiss="dismissClipboardBar"
      />
      
      <div class="app-content">
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-title">
              <div class="brand-icon">
                <img 
                  :src="isLightTheme ? '/icons/brand-icon-light.png' : '/icons/brand-icon.png'" 
                  alt="DevTools" 
                  class="brand-icon-img" 
                  @error="handleIconError" 
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="brand-icon-svg">
                  <path d="M22.61 19.39L19.39 22.61C19.04 22.96 18.55 23.12 18.04 23.04C17.54 22.96 17.11 22.65 16.85 22.2L15.5 19.5L12.5 20.85C12.05 21.11 11.54 21.19 11.04 21.11C10.54 21.03 10.05 20.79 9.7 20.44L3.56 14.3C3.21 13.95 2.97 13.46 2.89 12.96C2.81 12.46 2.89 11.95 3.15 11.5L4.5 8.5L1.8 7.15C1.35 6.89 1.04 6.46 0.96 5.96C0.88 5.45 1.04 4.96 1.39 4.61L4.61 1.39C4.96 1.04 5.45 0.88 5.96 0.96C6.46 1.04 6.89 1.35 7.15 1.8L8.5 4.5L11.5 3.15C11.95 2.89 12.46 2.81 12.96 2.89C13.46 2.97 13.95 3.21 14.3 3.56L20.44 9.7C20.79 10.05 21.03 10.54 21.11 11.04C21.19 11.54 21.11 12.05 20.85 12.5L19.5 15.5L22.2 16.85C22.65 17.11 22.96 17.54 23.04 18.04C23.12 18.55 22.96 19.04 22.61 19.39Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 10L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span class="brand-text">DevTools</span>
            </div>
            <div class="sidebar-controls">
              <div class="theme-toggle" @click="toggleTheme" :title="isLightTheme ? '切换到暗黑模式' : '切换到浅色模式'">
                <span>{{ isLightTheme ? '🌙' : '☀️' }}</span>
              </div>
              <div class="fullscreen-toggle" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">
                <span v-if="!isFullscreen">⛶</span>
                <span v-else>🗗</span>
              </div>
              <div class="developer-toggle" @click="showDeveloperInfo = true" title="开发者信息">
                <span>👤</span>
              </div>
              <div
                v-if="isChromeExtension"
                class="quick-search-toggle"
                @click="openQuickSearch"
                :title="quickSearchShortcutLabel"
              >
                <span>🔍</span>
              </div>
              <div
                v-if="isChromeExtension"
                class="clipboard-toggle"
                :class="{ active: clipboardConsent === 'enabled' }"
                @click="toggleClipboardDetection"
                :title="clipboardConsent === 'enabled' ? '关闭剪贴板智能识别' : '开启剪贴板智能识别'"
              >
                <span>📋</span>
              </div>
              <div v-if="isElectron" class="settings-toggle" @click="showSettings = true" title="设置">
                <span>⚙️</span>
              </div>
            </div>
          </div>
          <ul class="tool-list">
            <li
              v-for="tool in tools"
              :key="tool.id"
              :class="['tool-item', { active: tool.id === activeToolId }]"
              @click="selectTool(tool.id)"
            >
              <span class="tool-emoji">{{ tool.emoji }}</span>
              <span class="tool-name">{{ tool.name }}</span>
            </li>
          </ul>
        </aside>
    
        <main class="main">
          <component
            v-if="!showDeveloperInfo && !showSettings"
            :is="activeToolComponent"
            :initial-file="activeToolId === 'markdown' ? pendingMarkdownFile : undefined"
            @file-loaded="pendingMarkdownFile = null"
          />
          <!-- 开发者信息页面 -->
          <div v-else-if="showDeveloperInfo" class="developer-info-page">
            <div class="developer-info-card">
              <h2 class="developer-info-title">👤 开发者信息</h2>
              <div class="developer-info-content">
                <div class="developer-info-section">
                  <div class="developer-info-label">Developer:</div>
                  <div class="developer-info-value">宛平南路600号热心病友</div>
                </div>
              </div>
              <button class="btn" @click="showDeveloperInfo = false" style="margin-top: 20px;">关闭</button>
            </div>
          </div>
          <!-- 设置页面 -->
          <div v-else-if="showSettings" class="settings-page">
            <SettingsPanel @close="showSettings = false" />
          </div>
        </main>
      </div>
      
      <!-- 隐私保护提示（移到最底部） -->
      <div class="privacy-banner">
        <span class="privacy-icon">🔒</span>
        <span class="privacy-text">所有计算在本地完成，不上传数据，保护您的隐私安全</span>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted, markRaw, nextTick, defineAsyncComponent } from 'vue';
  import UrlTool from './tools/UrlTool.vue';
  import Md5Tool from './tools/Md5Tool.vue';
  import TimestampTool from './tools/TimestampTool.vue';
  import JsonTool from './tools/JsonTool.vue';
  import TextTool from './tools/TextTool.vue';
  import UuidTool from './tools/UuidTool.vue';
  import RegexTool from './tools/RegexTool.vue';
  import QrcodeTool from './tools/QrcodeTool.vue';
  import DiffTool from './tools/DiffTool.vue';
  import UnicodeTool from './tools/UnicodeTool.vue';
  import FileMoveTool from './tools/FileMoveTool.vue';
  import SignatureTool from './tools/SignatureTool.vue';
  import YearCountdownTool from './tools/YearCountdownTool.vue';
  import MarkdownTool from './tools/MarkdownTool.vue';
  import ColorTool from './tools/ColorTool.vue';
  import JwtTool from './tools/JwtTool.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import ClipboardSuggestion from './components/ClipboardSuggestion.vue';
import { detectClipboard, type ClipboardDetection } from './core/clipboard';
import {
  CLIPBOARD_SETTING_KEY,
  consumePendingPrefill,
  emitPrefill,
  isPrefillFresh,
  type PrefillPayload,
} from './core/prefill';
  interface ToolMeta {
    id: string;
    name: string;
    emoji: string;
    component: any;
  }
  
  // 由 Electron 打开的 Markdown 文件使用独立编辑器窗口，避免落回工具首页。
  const isMarkdownEditorWindow = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mode') === 'markdown-editor';

  // 检测是否在 Electron 环境中
  const isElectron = typeof window !== 'undefined' && 
    (window as any).electron !== undefined;

  // 检测是否在 Chrome 扩展的 DevTools 面板环境中
  const isExtensionDevTools = typeof chrome !== 'undefined' && 
    (chrome as any).devtools !== undefined;
  
  // 检测是否在 Chrome 插件 popup 环境中
  const isChromeExtension = typeof chrome !== 'undefined' && 
    chrome.runtime && chrome.runtime.id && !isExtensionDevTools;

  // 快速搜索：扩展里由 background 打开独立弹窗，快捷键与 macOS 客户端保持一致
  const isMacPlatform = /Mac|iPhone|iPad|iPod/.test(
    navigator.platform || navigator.userAgent,
  );
  const quickSearchShortcutLabel = computed(() =>
    isMacPlatform ? '快速搜索（⌘ + Shift + K）' : '快速搜索（Ctrl + Shift + K）',
  );

  function openQuickSearch() {
    try {
      (chrome as any)?.runtime?.sendMessage?.(
        { type: 'open-quick-search' },
        () => void (chrome as any)?.runtime?.lastError,
      );
    } catch {
      // 扩展 API 不可用时静默降级
    }
  }
  
  // 基础工具列表
  const baseTools: ToolMeta[] = [
    { id: 'url', name: 'URL 编码 / 解码', emoji: '🔗', component: markRaw(UrlTool) },
    { id: 'md5', name: '加密/哈希工具', emoji: '🔐', component: markRaw(Md5Tool) },
    { id: 'time', name: '时间戳转换', emoji: '⏰', component: markRaw(TimestampTool) },
    { id: 'json', name: 'JSON 格式化', emoji: '📄', component: markRaw(JsonTool) },
    { id: 'text', name: '文本处理', emoji: '📝', component: markRaw(TextTool) },
    { id: 'unicode', name: 'Unicode 转换', emoji: '🔤', component: markRaw(UnicodeTool) },
    { id: 'uuid', name: '密码/字符串/UUID生成', emoji: '🆔', component: markRaw(UuidTool) },
    { id: 'regex', name: '正则表达式', emoji: '🔍', component: markRaw(RegexTool) },
    { id: 'qrcode', name: '二维码生成', emoji: '📱', component: markRaw(QrcodeTool) },
    { id: 'diff', name: '文本差异对比', emoji: '🔄', component: markRaw(DiffTool) },
    { id: 'yearcountdown', name: '年度倒计时', emoji: '📅', component: markRaw(YearCountdownTool) },
    { id: 'markdown', name: 'Markdown 处理', emoji: '📝', component: markRaw(MarkdownTool) },
    { id: 'color', name: '颜色工具', emoji: '🎨', component: markRaw(ColorTool) },
    { id: 'jwt', name: 'JWT 解析', emoji: '🔑', component: markRaw(JwtTool) },
    // 浏览器 Web 版支持（扩展环境默认不开放：权限/CSP/用户预期复杂）
    ...(!isChromeExtension
      ? ([{
          id: 'solarsystem',
          name: 'Solar System',
          emoji: '🪐',
          component: markRaw(defineAsyncComponent(() => import('./tools/SolarSystemTool.vue'))),
        }] as ToolMeta[])
      : []),
  ];

  // Electron 环境下的额外工具
  const electronTools: ToolMeta[] = isElectron ? [
    { id: 'filemove', name: '文件移动', emoji: '📁', component: markRaw(FileMoveTool) },
    { id: 'signature', name: '签名处理', emoji: '✍️', component: markRaw(SignatureTool) },
  ] : [];

  const tools = ref<ToolMeta[]>([...baseTools, ...electronTools]);
  
  const activeToolId = ref<string>(tools.value[0].id);
  const pendingMarkdownFile = ref<MarkdownFilePayload | null>(null);
  
  // 全屏管理
  const isFullscreen = ref(false);
  const appRef = ref<HTMLElement | null>(null);
  
  // 开发者信息显示状态
  const showDeveloperInfo = ref(false);
  
  // 设置面板显示状态
  const showSettings = ref(false);

  // 剪贴板智能识别：unknown 表示还没有做出选择
  const clipboardConsent = ref<'unknown' | 'enabled' | 'disabled'>('unknown');
  const clipboardDetection = ref<ClipboardDetection | null>(null);
  const clipboardBarDismissed = ref(false);

  const showClipboardBar = computed(
    () =>
      isChromeExtension &&
      !clipboardBarDismissed.value &&
      (clipboardDetection.value !== null || clipboardConsent.value === 'unknown'),
  );

  function readLocalSetting(key: string): Promise<unknown> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return Promise.resolve(undefined);
    }
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([key], (result) => resolve(result?.[key]));
      } catch {
        resolve(undefined);
      }
    });
  }

  function writeLocalSetting(key: string, value: unknown): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      } catch {
        resolve();
      }
    });
  }

  async function detectCurrentClipboard(): Promise<void> {
    try {
      if (!navigator.clipboard?.readText) return;
      const text = await navigator.clipboard.readText();
      const detected = detectClipboard(text);
      if (detected) {
        clipboardDetection.value = detected;
      }
    } catch {
      // 未授权、浏览器不支持或用户拒绝时静默降级，不弹出错误
    }
  }

  async function initClipboardDetection(): Promise<void> {
    if (!isChromeExtension) return;
    const saved = await readLocalSetting(CLIPBOARD_SETTING_KEY);
    if (saved === 'enabled') {
      clipboardConsent.value = 'enabled';
      await detectCurrentClipboard();
    } else if (saved === 'disabled') {
      clipboardConsent.value = 'disabled';
    } else {
      clipboardConsent.value = 'unknown';
    }
  }

  function enableClipboardDetection(): void {
    clipboardConsent.value = 'enabled';
    clipboardBarDismissed.value = false;
    void writeLocalSetting(CLIPBOARD_SETTING_KEY, 'enabled');
    void detectCurrentClipboard();
  }

  function dismissClipboardBar(): void {
    clipboardBarDismissed.value = true;
    if (clipboardConsent.value === 'unknown') {
      clipboardConsent.value = 'disabled';
      void writeLocalSetting(CLIPBOARD_SETTING_KEY, 'disabled');
    }
  }

  /** 侧边栏开关：随时开启 / 关闭剪贴板智能识别 */
  function toggleClipboardDetection(): void {
    if (clipboardConsent.value === 'enabled') {
      clipboardConsent.value = 'disabled';
      clipboardDetection.value = null;
      clipboardBarDismissed.value = false;
      void writeLocalSetting(CLIPBOARD_SETTING_KEY, 'disabled');
      return;
    }
    clipboardBarDismissed.value = false;
    enableClipboardDetection();
  }

  function handleClipboardGo(): void {
    const detection = clipboardDetection.value;
    if (!detection) return;

    clipboardDetection.value = null;
    clipboardBarDismissed.value = true;
    if (tools.value.some((tool) => tool.id === detection.toolId)) {
      activeToolId.value = detection.toolId;
      showDeveloperInfo.value = false;
      showSettings.value = false;
    }
    nextTick(() => {
      emitPrefill({
        toolId: detection.toolId,
        value: detection.value,
        action: detection.action,
        source: 'clipboard',
        createdAt: Date.now(),
      });
    });
  }

  /**
   * 消费右键菜单 / 剪贴板入口留下的一次性预填数据。
   * 必须在子组件挂载完成后再派发，确保工具已经订阅。
   */
  async function applyExternalPrefill(): Promise<void> {
    if (!isChromeExtension) return;

    const params = new URLSearchParams(window.location.search);
    const urlTool = params.get('tool');

    let payload: PrefillPayload | null = null;
    try {
      payload = await consumePendingPrefill();
    } catch {
      payload = null;
    }
    if (payload && !isPrefillFresh(payload)) {
      payload = null;
    }

    const targetTool = payload?.toolId ?? urlTool;
    if (targetTool && tools.value.some((tool) => tool.id === targetTool)) {
      activeToolId.value = targetTool;
      showDeveloperInfo.value = false;
      showSettings.value = false;
      await nextTick();
      if (payload) {
        emitPrefill(payload);
      }
    }

    if (urlTool) {
      // 清理查询串，刷新页面时不会重复带入
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch {
        /* 忽略不可用环境 */
      }
    }
  }
  
  // 选择工具
  function selectTool(toolId: string) {
    activeToolId.value = toolId;
    // 点击工具项时，自动关闭开发者信息页面和设置面板
    showDeveloperInfo.value = false;
    showSettings.value = false;
  }
  
  function toggleFullscreen() {
    if (!appRef.value) return;
    
    // 在扩展环境中，Fullscreen API 不可用，直接使用 CSS 全屏模式
    if (isExtensionDevTools) {
      isFullscreen.value = !isFullscreen.value;
      return;
    }
    
    if (!isFullscreen.value) {
      // 进入全屏（仅在非扩展环境中尝试使用 Fullscreen API）
      try {
        if (appRef.value.requestFullscreen) {
          appRef.value.requestFullscreen().catch(() => {
            // 如果全屏 API 失败，使用 CSS 全屏模式
            isFullscreen.value = true;
          });
        } else if ((appRef.value as any).webkitRequestFullscreen) {
          (appRef.value as any).webkitRequestFullscreen();
        } else if ((appRef.value as any).mozRequestFullScreen) {
          (appRef.value as any).mozRequestFullScreen();
        } else if ((appRef.value as any).msRequestFullscreen) {
          (appRef.value as any).msRequestFullscreen();
        } else {
          // 如果全屏 API 不可用，使用 CSS 全屏模式
          isFullscreen.value = true;
        }
      } catch (error) {
        // 如果全屏 API 不可用，使用 CSS 全屏模式
        isFullscreen.value = true;
      }
    } else {
      // 退出全屏
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {
            isFullscreen.value = false;
          });
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        } else {
          isFullscreen.value = false;
        }
      } catch (error) {
        isFullscreen.value = false;
      }
    }
  }
  
  function handleFullscreenChange() {
    // 在扩展环境中，不监听 Fullscreen API 事件
    if (isExtensionDevTools) {
      return;
    }
    
    isFullscreen.value = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }
  
  // 主题管理
  const isLightTheme = ref(false);
  const THEME_STORAGE_KEY = 'devtools-suite-theme';
  
  function toggleTheme() {
    isLightTheme.value = !isLightTheme.value;
    saveTheme();
  }
  
  function loadTheme() {
    // 优先使用 Chrome Storage API（扩展环境）
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([THEME_STORAGE_KEY], (result) => {
        if (result[THEME_STORAGE_KEY] !== undefined) {
          isLightTheme.value = result[THEME_STORAGE_KEY];
        }
      });
    } else {
      // 如果不在扩展环境中，使用 localStorage
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved !== null) {
        isLightTheme.value = saved === 'true';
      }
    }
  }
  
  function saveTheme() {
    // 优先使用 Chrome Storage API（扩展环境）
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [THEME_STORAGE_KEY]: isLightTheme.value });
    } else {
      // 如果不在扩展环境中，使用 localStorage
      localStorage.setItem(THEME_STORAGE_KEY, String(isLightTheme.value));
    }
  }
  
  function handleMarkdownFileOpen(file: MarkdownFilePayload): void {
    pendingMarkdownFile.value = file;
    activeToolId.value = 'markdown';
    showDeveloperInfo.value = false;
    showSettings.value = false;
  }

  let removeMarkdownFileListener: (() => void) | undefined;

  onMounted(() => {
    loadTheme();

    if (isElectron) {
      removeMarkdownFileListener = window.electron?.markdown?.onFileOpen(handleMarkdownFileOpen);
    }

    // 消费右键菜单 / 剪贴板入口带入的数据
    void initClipboardDetection();
    void applyExternalPrefill();
    
    // 在 Electron 环境中，给 body 添加 class 以便应用样式
    if (isElectron) {
      document.body.classList.add('electron-env');
    }
    
    // 在 Chrome 插件环境中，给 body 添加 class 以便应用样式
    if (isChromeExtension) {
      document.body.classList.add('chrome-extension-env');
      document.documentElement.classList.add('chrome-extension-env');
      
      // Chrome popup 窗口：设置固定尺寸，确保窗口正确显示
      const applyChromeStyles = () => {
        const app = document.querySelector('.app') as HTMLElement;
        const html = document.documentElement;
        const body = document.body;
        const appContainer = document.getElementById('app');
        
        // 设置 HTML 和 Body 的固定尺寸
        html.style.minWidth = '720px';
        html.style.minHeight = '480px';
        html.style.width = '720px';
        html.style.height = '480px';
        html.style.overflow = 'hidden';
        
        body.style.minWidth = '720px';
        body.style.minHeight = '480px';
        body.style.width = '720px';
        body.style.height = '480px';
        body.style.overflow = 'hidden';
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        
        if (appContainer) {
          appContainer.style.minWidth = '720px';
          appContainer.style.minHeight = '480px';
          appContainer.style.width = '720px';
          appContainer.style.height = '480px';
          appContainer.style.display = 'flex';
          appContainer.style.flexDirection = 'column';
        }
        
        if (app) {
          app.style.width = '720px';
          app.style.height = '480px';
          app.style.minWidth = '720px';
          app.style.minHeight = '480px';
          app.style.maxWidth = '720px';
          app.style.maxHeight = '480px';
          app.style.flexShrink = '0';
        }
        
        // 确保 app-content 也有正确的高度
        const appContent = document.querySelector('.app-content') as HTMLElement;
        if (appContent) {
          appContent.style.flex = '1 1 auto';
          appContent.style.minHeight = '400px';
        }
        
        // 确保 main 区域有正确的高度
        const main = document.querySelector('.main') as HTMLElement;
        if (main) {
          main.style.minHeight = '350px';
        }
      };
      
      // 立即应用
      applyChromeStyles();
      
      // 延迟多次应用，确保样式生效
      setTimeout(applyChromeStyles, 0);
      setTimeout(applyChromeStyles, 50);
      setTimeout(applyChromeStyles, 100);
      setTimeout(applyChromeStyles, 200);
    }
    
    // 仅在非扩展环境中监听全屏状态变化（扩展环境不支持 Fullscreen API）
    if (!isExtensionDevTools) {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    }
  });
  
  onUnmounted(() => {
    removeMarkdownFileListener?.();
    removeMarkdownFileListener = undefined;

    // 清理全屏事件监听（仅在非扩展环境中）
    if (!isExtensionDevTools) {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    }
  });
  
  const activeToolComponent = computed(() => {
    const found = tools.value.find((t: ToolMeta) => t.id === activeToolId.value);
    return found?.component ?? tools.value[0].component;
  });
  
  // 处理图标加载错误，如果图标文件不存在，显示 SVG 后备
  function handleIconError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
      const svg = img.nextElementSibling as SVGElement;
      if (svg) {
        svg.style.display = 'block';
      }
    }
  }
  </script>