<template>
  <div class="tool-card">
    <h2 class="tool-title">Markdown 处理</h2>

    <div class="markdown-container" :data-view-mode="viewMode">
      <!-- 编辑区域 -->
      <div class="markdown-editor-section" v-show="viewMode === 'edit' || viewMode === 'split'">
        <div class="section-header">
          <span class="section-title">编辑</span>
          <div class="section-actions">
            <button class="btn-icon" @click="clearContent" title="清空">🗑️</button>
            <button class="btn-icon" @click="copyContent" title="复制">📋</button>
          </div>
        </div>
        <textarea
          v-model="markdownContent"
          class="markdown-editor"
          placeholder="在此输入 Markdown 内容..."
          @input="updatePreview"
        ></textarea>
      </div>

      <!-- 预览区域 -->
      <div class="markdown-preview-section" v-show="viewMode === 'preview' || viewMode === 'split'">
        <div class="section-header">
          <span class="section-title">预览</span>
          <div class="section-actions">
            <button class="btn-icon" @click="copyHtml" title="复制 HTML">📋</button>
          </div>
        </div>
        <div 
          class="markdown-preview"
          v-html="previewHtml"
        ></div>
      </div>
    </div>

    <!-- 视图模式切换按钮（移动端友好） -->
    <div class="view-mode-toggle">
      <div class="view-mode-buttons">
        <button 
          class="btn secondary"
          :class="{ active: viewMode === 'edit' }"
          @click="viewMode = 'edit'"
        >
          📝 编辑
        </button>
        <button 
          class="btn secondary"
          :class="{ active: viewMode === 'split' }"
          @click="viewMode = 'split'"
        >
          📊 分屏
        </button>
        <button 
          class="btn secondary"
          :class="{ active: viewMode === 'preview' }"
          @click="viewMode = 'preview'"
        >
          👁️ 预览
        </button>
      </div>
      <button 
        class="btn secondary download-btn-inline"
        @click="downloadMarkdown"
        :disabled="!markdownContent.trim()"
        title="下载为 Markdown 文件"
      >
        💾 下载
      </button>
    </div>

    <!-- 文件名输入对话框 -->
    <div v-if="showFileNameDialog" class="modal-overlay" @click.self="showFileNameDialog = false">
      <div class="modal-content">
        <h3 class="modal-title">输入文件名</h3>
        <label class="field-label">文件名（不含扩展名）</label>
        <input
          ref="fileNameInputRef"
          v-model="fileNameInput"
          class="input"
          type="text"
          placeholder="输入文件名"
          @keyup.enter="confirmDownload"
          @keyup.esc="showFileNameDialog = false"
          autofocus
        />
        <div class="modal-actions">
          <button class="btn secondary" @click="showFileNameDialog = false">取消</button>
          <button class="btn" @click="confirmDownload" :disabled="!fileNameInput.trim()">确定</button>
        </div>
      </div>
    </div>

    <!-- 确认清空对话框 -->
    <div v-if="showClearConfirmDialog" class="modal-overlay" @click.self="showClearConfirmDialog = false">
      <div class="modal-content">
        <h3 class="modal-title">确认清空</h3>
        <p class="modal-message">确定要清空所有内容吗？</p>
        <div class="modal-actions">
          <button class="btn secondary" @click="showClearConfirmDialog = false">取消</button>
          <button class="btn" @click="doClearContent">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { marked } from 'marked';

const markdownContent = ref('');
const viewMode = ref<'edit' | 'split' | 'preview'>('split');
const showFileNameDialog = ref(false);
const fileNameInput = ref('');
const fileNameInputRef = ref<HTMLInputElement | null>(null);
const showClearConfirmDialog = ref(false);

// 生成默认文件名
const generateDefaultFileName = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `markdown-${timestamp}`;
};

// 配置 marked 选项（marked 4.x 使用 MarkedOptions）
marked.setOptions({
  breaks: true, // 支持 GitHub 风格的换行
  gfm: true, // 启用 GitHub 风格的 Markdown
});

// 预览 HTML
const previewHtml = computed(() => {
  if (!markdownContent.value.trim()) {
    return '<p class="empty-preview">预览将显示在这里...</p>';
  }
  try {
    return marked.parse(markdownContent.value) as string;
  } catch (error: any) {
    return `<p class="error-preview">解析错误: ${error?.message || error}</p>`;
  }
});

// 更新预览（实时）
const updatePreview = () => {
  // 预览是响应式的，会自动更新
};

// 清空内容
const clearContent = () => {
  showClearConfirmDialog.value = true;
};

// 执行清空内容
const doClearContent = () => {
  markdownContent.value = '';
  showClearConfirmDialog.value = false;
};

// 复制 Markdown 内容
const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(markdownContent.value);
    alert('已复制到剪贴板');
  } catch (error) {
    alert('复制失败，请手动复制');
  }
};

// 复制 HTML 内容
const copyHtml = async () => {
  try {
    await navigator.clipboard.writeText(previewHtml.value);
    alert('HTML 已复制到剪贴板');
  } catch (error) {
    alert('复制失败，请手动复制');
  }
};

// 切换视图模式（已通过按钮直接设置，此函数保留用于兼容）
const toggleViewMode = () => {
  if (viewMode.value === 'split') {
    viewMode.value = 'preview';
  } else {
    viewMode.value = 'split';
  }
};

// 下载为 Markdown 文件
const downloadMarkdown = () => {
  if (!markdownContent.value.trim()) {
    alert('内容为空，无法下载');
    return;
  }

  // 显示文件名输入对话框
  const defaultFileName = generateDefaultFileName();
  fileNameInput.value = defaultFileName;
  showFileNameDialog.value = true;
  
  // 聚焦输入框
  nextTick(() => {
    fileNameInputRef.value?.focus();
    fileNameInputRef.value?.select();
  });
};

// 确认下载
const confirmDownload = () => {
  if (!fileNameInput.value.trim()) {
    return;
  }
  
  try {
    // 获取文件名，如果为空则使用默认文件名
    let fileName = fileNameInput.value.trim();
    
    // 移除文件名中可能存在的 .md 扩展名
    fileName = fileName.replace(/\.md$/i, '');
    
    // 验证文件名（移除非法字符）
    fileName = fileName.replace(/[<>:"/\\|?*]/g, '_');
    
    // 如果文件名仍然为空，使用默认文件名
    if (!fileName) {
      fileName = generateDefaultFileName();
    }
    
    // 创建 Blob 对象
    const blob = new Blob([markdownContent.value], { type: 'text/markdown;charset=utf-8' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.md`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // 关闭对话框
    showFileNameDialog.value = false;
  } catch (error: any) {
    alert(`下载失败: ${error?.message || error}`);
  }
};
</script>

<style scoped>
.markdown-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 200px);
  min-height: 500px;
  margin-bottom: 16px;
}

.markdown-editor-section,
.markdown-preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.section-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 16px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover:not(:disabled) {
  background: var(--bg-tool-item-hover);
  color: var(--text-primary);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.markdown-editor {
  flex: 1;
  width: 100%;
  padding: 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-color-input);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  transition: all 0.2s;
}

.markdown-editor:focus {
  border-color: var(--border-color-focus);
  box-shadow: var(--shadow-input-focus);
  background: var(--bg-input-focus);
}

.markdown-preview {
  flex: 1;
  padding: 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-color-input);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.8;
  overflow-y: auto;
  word-wrap: break-word;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
}

.markdown-preview :deep(h1) {
  font-size: 2em;
}

.markdown-preview :deep(h2) {
  font-size: 1.5em;
}

.markdown-preview :deep(h3) {
  font-size: 1.25em;
}

.markdown-preview :deep(p) {
  margin: 12px 0;
  color: var(--text-secondary);
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.markdown-preview :deep(li) {
  margin: 6px 0;
  color: var(--text-secondary);
}

.markdown-preview :deep(blockquote) {
  margin: 12px 0;
  padding: 12px 16px;
  border-left: 4px solid var(--border-color-focus);
  background: var(--bg-input);
  border-radius: 4px;
  color: var(--text-tertiary);
}

.markdown-preview :deep(code) {
  background: var(--bg-input);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 0.9em;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.markdown-preview :deep(pre) {
  background: var(--bg-input);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid var(--border-color);
  margin: 12px 0;
}

.markdown-preview :deep(pre code) {
  background: transparent;
  padding: 0;
  border: none;
  color: var(--text-primary);
}

.markdown-preview :deep(a) {
  color: #3b82f6;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s;
}

.markdown-preview :deep(a:hover) {
  border-bottom-color: #3b82f6;
}

.markdown-preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 12px 0;
}

.markdown-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  text-align: left;
}

.markdown-preview :deep(th) {
  background: var(--bg-input);
  font-weight: 600;
}

.markdown-preview :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 24px 0;
}

.empty-preview {
  color: var(--text-placeholder);
  text-align: center;
  padding: 40px;
  font-style: italic;
}

.error-preview {
  color: #ef4444;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.view-mode-toggle {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.view-mode-buttons {
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.view-mode-buttons .btn {
  flex: 1;
  max-width: 120px;
}

.download-btn-inline {
  flex-shrink: 0;
  padding: 8px 16px;
  white-space: nowrap;
}

.download-btn-inline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.view-mode-toggle .btn.active {
  background: var(--bg-tool-item-active);
  color: var(--text-primary);
  box-shadow: var(--shadow-tool-active);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .markdown-container {
    flex-direction: column;
    height: auto;
    min-height: auto;
  }

  .markdown-editor-section,
  .markdown-preview-section {
    min-height: 300px;
  }

  .view-mode-toggle {
    flex-direction: column;
    gap: 12px;
  }

  .view-mode-buttons {
    width: 100%;
  }

  .view-mode-buttons .btn {
    max-width: 100%;
  }

  .download-btn-inline {
    width: 100%;
  }
}

/* 视图模式切换 - 使用 v-show 控制，这里保留作为备用 */

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.modal-message {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
