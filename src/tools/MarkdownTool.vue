<template>
  <div class="tool-card markdown-tool">
    <div class="markdown-toolbar">
      <div>
        <h2 class="tool-title">Markdown 工作台</h2>
        <p class="markdown-subtitle">
          支持 Markdown、Mermaid 图表和常见代码块的编辑与实时预览
        </p>
      </div>
      <div class="markdown-file-state" :title="currentFilePath || '尚未打开文件'">
        <span class="file-state-dot" :class="{ dirty: isDirty }"></span>
        <span>{{ currentFileName || '未命名 Markdown' }}{{ isDirty ? ' · 未保存' : '' }}</span>
      </div>
    </div>

    <div class="markdown-actions">
      <button class="btn secondary" @click="createNewDocument" title="新建 Markdown 文档">＋ 新建</button>
      <button class="btn secondary" @click="openMarkdownFile" title="打开 Markdown 文件">📂 打开</button>
      <button class="btn secondary" @click="saveMarkdownFile" :disabled="!markdownContent.trim()" title="保存 Markdown 文件">💾 保存</button>
      <button class="btn secondary" @click="saveMarkdownAs" :disabled="!markdownContent.trim()" title="另存为 Markdown 文件">另存为</button>
      <button class="btn secondary" @click="insertMermaidExample" title="插入 Mermaid 图表示例">📈 图表示例</button>
      <input ref="fileInputRef" class="visually-hidden" type="file" accept=".md,.markdown,.mdown,.mkdn,.mkd,text/markdown,text/plain" @change="handleBrowserFile" />
    </div>

    <div class="markdown-container" :data-view-mode="viewMode">
      <section class="markdown-editor-section">
        <div class="section-header">
          <div>
            <span class="section-title">编辑</span>
            <span class="section-meta">{{ markdownContent.length }} 字符</span>
          </div>
          <div class="section-actions">
            <button class="btn-icon" @click="copyContent" title="复制 Markdown">📋</button>
            <button class="btn-icon" @click="clearContent" title="清空">🗑️</button>
          </div>
        </div>
        <textarea
          ref="editorRef"
          v-model="markdownContent"
          class="markdown-editor"
          placeholder="在此输入 Markdown 内容...\n\n使用 ```mermaid 代码块即可编辑并预览流程图、时序图、类图、状态图、ER 图、甘特图、饼图、时间线、思维导图等。"
          spellcheck="false"
          @input="markDirty"
          @keydown="handleEditorKeydown"
        ></textarea>
      </section>

      <section class="markdown-preview-section">
        <div class="section-header">
          <div>
            <span class="section-title">预览</span>
            <span class="section-meta">Markdown + Mermaid</span>
          </div>
          <div class="section-actions">
            <button class="btn-icon" @click="copyHtml" title="复制 HTML">⧉</button>
          </div>
        </div>
        <div ref="previewRef" class="markdown-preview" v-html="previewHtml"></div>
      </section>
    </div>

    <div class="markdown-footer">
      <div class="view-mode-buttons" aria-label="预览布局">
        <button class="btn secondary" :class="{ active: viewMode === 'edit' }" @click="viewMode = 'edit'">📝 编辑</button>
        <button class="btn secondary" :class="{ active: viewMode === 'split' }" @click="viewMode = 'split'">📊 分屏</button>
        <button class="btn secondary" :class="{ active: viewMode === 'preview' }" @click="viewMode = 'preview'">👁️ 预览</button>
      </div>
      <span class="markdown-hint">支持 flowchart、sequence、class、state、ER、gantt、pie、timeline、mindmap、gitGraph 等 Mermaid 图表</span>
    </div>

    <div v-if="showClearConfirmDialog" class="modal-overlay" @click.self="showClearConfirmDialog = false">
      <div class="modal-content">
        <h3 class="modal-title">确认清空</h3>
        <p class="modal-message">确定要清空当前 Markdown 内容吗？</p>
        <div class="modal-actions">
          <button class="btn secondary" @click="showClearConfirmDialog = false">取消</button>
          <button class="btn" @click="doClearContent">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { Marked } from 'marked';

type ViewMode = 'edit' | 'split' | 'preview';

const props = defineProps<{ initialFile?: MarkdownFilePayload | null }>();
const emit = defineEmits<{ (event: 'file-loaded'): void }>();

const markdownContent = ref('');
const currentFilePath = ref('');
const currentFileName = ref('');
const isDirty = ref(false);
const viewMode = ref<ViewMode>('split');
const showClearConfirmDialog = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const editorRef = ref<HTMLTextAreaElement | null>(null);
const previewRef = ref<HTMLElement | null>(null);
const mermaidSources = new Map<string, string>();
let mermaidId = 0;
let renderGeneration = 0;
let mermaidApi: typeof import('mermaid').default | null = null;
let stopInitialFileWatch: (() => void) | undefined;

async function getMermaid(): Promise<typeof import('mermaid').default> {
  if (!mermaidApi) {
    mermaidApi = (await import('mermaid')).default;
    mermaidApi.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' });
  }
  return mermaidApi;
}

const markdownParser = new Marked({
  breaks: true,
  gfm: true,
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = (lang || '').trim().toLowerCase();
      if (language === 'mermaid' || language === 'mmd') {
        const id = `mermaid-source-${++mermaidId}`;
        mermaidSources.set(id, text);
        return `<div class="mermaid-block" data-mermaid-id="${id}"><div class="mermaid-loading">正在渲染图表…</div></div>`;
      }
      return false as unknown as string;
    },
  },
});

const previewHtml = computed(() => {
  mermaidSources.clear();
  if (!markdownContent.value.trim()) {
    return '<p class="empty-preview">预览将显示在这里…</p>';
  }
  try {
    return markdownParser.parse(markdownContent.value) as string;
  } catch (error: any) {
    return `<p class="error-preview">解析错误：${escapeHtml(error?.message || String(error))}</p>`;
  }
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[char] || char);
}

function generateDefaultFileName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `markdown-${timestamp}.md`;
}

function setDocument(content: string, filePath = '', fileName = ''): void {
  markdownContent.value = content;
  currentFilePath.value = filePath;
  currentFileName.value = fileName || (filePath ? filePath.split(/[\\/]/).pop() || '' : '');
  isDirty.value = false;
  void nextTick(renderMermaidDiagrams);
}

function markDirty(): void {
  isDirty.value = true;
}

function createNewDocument(): void {
  if (isDirty.value && !window.confirm('当前文档有未保存修改，确定新建吗？')) return;
  setDocument('');
}

async function openMarkdownFile(): Promise<void> {
  if (window.electron?.markdown) {
    const result = await window.electron.markdown.openFile();
    if (result?.canceled) return;
    if (result?.success && result.file) {
      setDocument(result.file.content, result.file.path, result.file.name);
    } else if (result?.error) {
      window.alert(`打开失败：${result.error}`);
    }
    return;
  }
  fileInputRef.value?.click();
}

async function handleBrowserFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    setDocument(await file.text(), '', file.name);
  } catch (error: any) {
    window.alert(`打开失败：${error?.message || error}`);
  }
}

async function saveMarkdownFile(): Promise<void> {
  if (!markdownContent.value.trim()) return;
  if (window.electron?.markdown && currentFilePath.value) {
    const result = await window.electron.markdown.saveFile(currentFilePath.value, markdownContent.value);
    if (result.success) {
      isDirty.value = false;
      currentFilePath.value = result.path || currentFilePath.value;
      window.alert('Markdown 文件已保存');
    } else {
      window.alert(`保存失败：${result.error || '未知错误'}`);
    }
    return;
  }
  await saveMarkdownAs();
}

async function saveMarkdownAs(): Promise<void> {
  const defaultName = currentFileName.value || generateDefaultFileName();
  if (window.electron?.markdown) {
    const result = await window.electron.markdown.saveAs(markdownContent.value, defaultName);
    if (result?.canceled) return;
    if (result?.success) {
      currentFilePath.value = result.path || '';
      currentFileName.value = result.name || defaultName;
      isDirty.value = false;
      window.alert('Markdown 文件已保存');
    } else {
      window.alert(`保存失败：${result?.error || '未知错误'}`);
    }
    return;
  }

  const fileName = window.prompt('文件名', defaultName) || defaultName;
  const safeName = fileName.replace(/[<>:"/\\|?*]/g, '_').replace(/\.(md|markdown)$/i, '') || 'untitled';
  const blob = new Blob([markdownContent.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}.md`;
  link.click();
  URL.revokeObjectURL(url);
  currentFileName.value = `${safeName}.md`;
  isDirty.value = false;
}

async function copyContent(): Promise<void> {
  try {
    await navigator.clipboard.writeText(markdownContent.value);
    window.alert('Markdown 已复制');
  } catch {
    window.alert('复制失败，请手动复制');
  }
}

async function copyHtml(): Promise<void> {
  try {
    await navigator.clipboard.writeText(previewHtml.value);
    window.alert('HTML 已复制');
  } catch {
    window.alert('复制失败，请手动复制');
  }
}

function clearContent(): void {
  showClearConfirmDialog.value = true;
}

function doClearContent(): void {
  markdownContent.value = '';
  isDirty.value = true;
  showClearConfirmDialog.value = false;
}

function insertMermaidExample(): void {
  const example = `\n\n\`\`\`mermaid\nflowchart LR\n  A[开始] --> B{是否完成?}\n  B -->|是| C[发布]\n  B -->|否| D[继续编辑]\n  D --> B\n\`\`\`\n`;
  const editor = editorRef.value;
  if (!editor) {
    markdownContent.value += example;
  } else {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    markdownContent.value = `${markdownContent.value.slice(0, start)}${example}${markdownContent.value.slice(end)}`;
    void nextTick(() => {
      editor.focus();
      const cursor = start + example.length;
      editor.setSelectionRange(cursor, cursor);
    });
  }
  markDirty();
}

function handleEditorKeydown(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    void saveMarkdownFile();
  }
}

async function renderMermaidDiagrams(): Promise<void> {
  const generation = ++renderGeneration;
  await nextTick();
  if (!previewRef.value || generation !== renderGeneration) return;
  const blocks = Array.from(previewRef.value.querySelectorAll<HTMLElement>('.mermaid-block'));
  if (blocks.length === 0) return;
  const mermaid = await getMermaid();

  for (const block of blocks) {
    if (generation !== renderGeneration) return;
    const sourceId = block.dataset.mermaidId;
    const source = sourceId ? mermaidSources.get(sourceId) : undefined;
    if (!source) continue;
    try {
      const result = await mermaid.render(`mermaid-diagram-${++mermaidId}`, source);
      if (generation === renderGeneration) block.innerHTML = result.svg;
    } catch (error: any) {
      block.innerHTML = `<div class="mermaid-error"><strong>Mermaid 图表解析失败</strong><pre>${escapeHtml(error?.message || String(error))}</pre></div>`;
    }
  }
}

watch(previewHtml, () => {
  void renderMermaidDiagrams();
});

watch(() => props.initialFile, (file) => {
  if (!file) return;
  setDocument(file.content, file.path, file.name);
  emit('file-loaded');
}, { immediate: true });

onMounted(() => {
  stopInitialFileWatch = undefined;
  void renderMermaidDiagrams();
});

onUnmounted(() => {
  stopInitialFileWatch?.();
});
</script>

<style scoped>
.markdown-tool {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.markdown-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 10px;
}

.markdown-subtitle {
  margin: -8px 0 0;
  color: var(--text-tertiary);
  font-size: 12px;
}

.markdown-file-state {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 42%;
  padding: 7px 10px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  color: var(--text-secondary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-state-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #36b37e;
}

.file-state-dot.dirty {
  background: #f59e0b;
}

.markdown-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.markdown-container {
  display: flex;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 420px;
}

.markdown-editor-section,
.markdown-preview-section {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
}

.markdown-container[data-view-mode='edit'] .markdown-preview-section,
.markdown-container[data-view-mode='preview'] .markdown-editor-section {
  display: none;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.section-header > div:first-child {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.section-title {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.section-meta {
  color: var(--text-tertiary);
  font-size: 11px;
}

.section-actions {
  display: flex;
  gap: 6px;
}

.btn-icon {
  padding: 4px 7px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-tool-item);
  color: var(--text-secondary);
  cursor: pointer;
}

.btn-icon:hover {
  background: var(--bg-tool-item-hover);
  color: var(--text-primary);
}

.markdown-editor,
.markdown-preview {
  flex: 1 1 auto;
  min-height: 0;
  box-sizing: border-box;
  padding: 14px;
  border: 1px solid var(--border-color-input);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  line-height: 1.75;
}

.markdown-editor {
  width: 100%;
  resize: none;
  outline: none;
  font-family: 'SFMono-Regular', Monaco, Menlo, Consolas, monospace;
  font-size: 13px;
}

.markdown-editor:focus {
  border-color: var(--border-color-focus);
  box-shadow: var(--shadow-input-focus);
}

.markdown-preview {
  overflow: auto;
  word-wrap: break-word;
  font-size: 14px;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin: 1.25em 0 .65em;
  color: var(--text-primary);
  line-height: 1.3;
}

.markdown-preview :deep(h1) { font-size: 1.85em; }
.markdown-preview :deep(h2) { font-size: 1.5em; }
.markdown-preview :deep(h3) { font-size: 1.25em; }
.markdown-preview :deep(p) { margin: .75em 0; color: var(--text-secondary); }
.markdown-preview :deep(ul),
.markdown-preview :deep(ol) { padding-left: 24px; color: var(--text-secondary); }
.markdown-preview :deep(li) { margin: 4px 0; }
.markdown-preview :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 14px;
  border-left: 4px solid var(--border-color-focus);
  background: var(--bg-tool-item);
  color: var(--text-tertiary);
}
.markdown-preview :deep(code) {
  padding: 2px 5px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-tool-item);
  font-family: 'SFMono-Regular', Monaco, Menlo, Consolas, monospace;
  font-size: .9em;
}
.markdown-preview :deep(pre) {
  margin: 12px 0;
  padding: 12px;
  overflow-x: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-tool-item);
}
.markdown-preview :deep(pre code) { padding: 0; border: 0; background: transparent; }
.markdown-preview :deep(a) { color: #3b82f6; }
.markdown-preview :deep(img) { max-width: 100%; border-radius: 6px; }
.markdown-preview :deep(table) { width: 100%; border-collapse: collapse; }
.markdown-preview :deep(th),
.markdown-preview :deep(td) { padding: 7px 10px; border: 1px solid var(--border-color); text-align: left; }
.markdown-preview :deep(th) { background: var(--bg-tool-item); }

.markdown-preview :deep(.mermaid-block) {
  display: flex;
  justify-content: center;
  min-width: 0;
  margin: 16px 0;
  padding: 12px;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-tool-item);
}

.markdown-preview :deep(.mermaid-block svg) {
  max-width: 100%;
  height: auto;
}

.markdown-preview :deep(.mermaid-loading) {
  padding: 20px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.markdown-preview :deep(.mermaid-error) {
  width: 100%;
  color: #ef4444;
  font-size: 12px;
}

.markdown-preview :deep(.mermaid-error pre) {
  margin: 8px 0 0;
  white-space: pre-wrap;
}

.empty-preview {
  padding: 48px 12px;
  color: var(--text-placeholder);
  text-align: center;
}

.error-preview {
  padding: 12px;
  border-radius: 6px;
  background: rgba(239, 68, 68, .1);
  color: #ef4444;
}

.markdown-footer {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
}

.view-mode-buttons {
  display: flex;
  gap: 8px;
  flex: 0 0 auto;
}

.view-mode-buttons .btn.active {
  background: var(--bg-tool-item-active);
  color: var(--text-primary);
  box-shadow: var(--shadow-tool-active);
}

.markdown-hint {
  color: var(--text-tertiary);
  font-size: 11px;
  line-height: 1.4;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, .5);
}

.modal-content {
  min-width: 360px;
  max-width: 90%;
  padding: 24px;
  border-radius: 12px;
  background: var(--bg-card);
  box-shadow: 0 4px 20px rgba(0, 0, 0, .3);
}

.modal-title { margin: 0 0 16px; color: var(--text-primary); font-size: 18px; }
.modal-message { margin: 0; color: var(--text-secondary); }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }

@media (max-width: 768px) {
  .markdown-toolbar { display: block; }
  .markdown-file-state { max-width: 100%; margin-top: 8px; }
  .markdown-container { flex-direction: column; min-height: 620px; }
  .markdown-editor-section,
  .markdown-preview-section { min-height: 300px; }
  .markdown-footer { display: block; }
  .view-mode-buttons { margin-bottom: 8px; }
}
</style>
