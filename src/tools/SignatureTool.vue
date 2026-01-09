<template>
  <div class="tool-card">
    <h2 class="tool-title">签名处理</h2>
    <p class="tool-desc">支持多种签名类型（字典升序），可保存模板以便复用</p>

    <!-- 签名类型选择 -->
    <label class="field-label">签名类型</label>
    <select v-model="signatureType" class="input" @change="onSignatureTypeChange">
      <option v-for="config in signatureTypeConfigs" :key="config.value" :value="config.value">
        {{ config.label }}
      </option>
    </select>

    <!-- 模板选择 -->
    <div v-if="templates.length > 0" class="template-section">
      <label class="field-label">选择模板</label>
      <div class="template-selector">
        <select v-model="selectedTemplateId" class="input" @change="loadTemplate">
          <option value="">-- 不使用模板 --</option>
          <option v-for="template in templates" :key="template.id" :value="template.id">
            {{ template.name }}
          </option>
        </select>
        <button class="btn secondary" @click="deleteTemplate" :disabled="!selectedTemplateId">
          删除模板
        </button>
      </div>
    </div>

    <!-- 签名表单（通用结构，支持所有签名类型） -->
    <template v-if="currentSignatureConfig">
      <!-- 密钥输入（根据类型显示不同的输入框） -->
      <label class="field-label">{{ currentSignatureConfig.keyLabel }}</label>
      <input
        v-if="currentSignatureConfig.keyInputType === 'text'"
        v-model="signatureKey"
        class="input"
        type="text"
        :placeholder="currentSignatureConfig.keyPlaceholder"
        style="margin-bottom: 8px;"
      />
      <textarea
        v-else
        v-model="signatureKey"
        class="textarea"
        rows="4"
        :placeholder="currentSignatureConfig.keyPlaceholder"
        style="margin-bottom: 8px;"
      ></textarea>

      <label class="field-label">数据格式</label>
      <select v-model="dataFormat" class="input" style="margin-bottom: 8px;">
        <option value="json">JSON</option>
        <option value="properties">Properties</option>
      </select>

      <label class="field-label">数据内容</label>
      <textarea
        v-model="dataContent"
        class="textarea"
        rows="8"
        :placeholder="dataContentPlaceholder"
      ></textarea>

      <div class="btn-row">
        <button class="btn" @click="generateSignature" :disabled="!canGenerate">
          生成签名
        </button>
        <button class="btn secondary" @click="clearAll">清空</button>
      </div>

      <label class="field-label">签名结果</label>
      <div style="display: flex; gap: 4px; align-items: center;">
        <input
          v-if="signatureType === 'md5'"
          class="input"
          :value="signatureResult"
          readonly
          style="flex: 1;"
        />
        <textarea
          v-else
          class="textarea"
          :value="signatureResult"
          readonly
          rows="3"
          style="flex: 1;"
        ></textarea>
        <button class="btn secondary" @click="copySignature" :disabled="!signatureResult">
          复制
        </button>
      </div>

      <div class="btn-row" style="margin-top: 12px;">
        <button class="btn secondary" @click="showSaveTemplateDialog = true" :disabled="!canSaveTemplate">
          保存为模板
        </button>
        <span v-if="message" :class="['hint', messageType]">{{ message }}</span>
      </div>
    </template>

    <!-- 保存模板对话框 -->
    <div v-if="showSaveTemplateDialog" class="modal-overlay" @click.self="showSaveTemplateDialog = false">
      <div class="modal-content">
        <h3 class="modal-title">保存模板</h3>
        <label class="field-label">模板名称</label>
        <input
          v-model="templateName"
          class="input"
          type="text"
          placeholder="输入模板名称"
          @keyup.enter="saveTemplate"
        />
        <div class="modal-actions">
          <button class="btn secondary" @click="showSaveTemplateDialog = false">取消</button>
          <button class="btn" @click="saveTemplate" :disabled="!templateName.trim()">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { md5 } from '@/core/hash';

// 签名类型定义（便于后续扩展）
type SignatureType = 'md5' | 'rsa' | string; // 使用 string 类型以便后续扩展

interface SignatureTemplate {
  id: string;
  name: string;
  type: SignatureType;
  key?: string; // 密钥或私钥（根据签名类型不同）
  dataFormat: 'json' | 'properties';
}

// 签名类型配置（便于后续扩展）
// 添加新签名类型时，只需在此数组中添加配置，并在 generateSignature 函数中添加对应的处理逻辑
interface SignatureTypeConfig {
  value: SignatureType;
  label: string;
  needsKey: boolean;
  keyLabel: string;
  keyPlaceholder: string;
  keyInputType: 'text' | 'textarea';
}

const signatureTypeConfigs: SignatureTypeConfig[] = [
  {
    value: 'md5',
    label: 'MD5签名(字典升序)',
    needsKey: true,
    keyLabel: '密钥',
    keyPlaceholder: '输入密钥',
    keyInputType: 'text',
  },
  {
    value: 'rsa',
    label: 'RSA签名(字典升序)',
    needsKey: true,
    keyLabel: '私钥',
    keyPlaceholder: '输入 RSA 私钥（PEM 格式）',
    keyInputType: 'textarea',
  },
  // 后续添加新签名类型示例：
  // {
  //   value: 'sha256',
  //   label: 'SHA256签名(字典升序)',
  //   needsKey: true,
  //   keyLabel: '密钥',
  //   keyPlaceholder: '输入密钥',
  //   keyInputType: 'text',
  // },
];

const signatureType = ref<SignatureType>('md5');
const templates = ref<SignatureTemplate[]>([]);
const selectedTemplateId = ref('');

// 通用状态
const signatureKey = ref(''); // 统一的密钥/私钥字段
const signatureResult = ref(''); // 统一的签名结果字段
const dataFormat = ref<'json' | 'properties'>('json');
const dataContent = ref('');
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const showSaveTemplateDialog = ref(false);
const templateName = ref('');

const isElectron = ref(false);

// 获取当前签名类型配置
const currentSignatureConfig = computed(() => {
  return signatureTypeConfigs.find(config => config.value === signatureType.value);
});

// 数据内容占位符
const dataContentPlaceholder = computed(() => {
  if (dataFormat.value === 'json') {
    return '输入 JSON 格式数据，例如: {"name":"test","age":18}';
  } else {
    return '输入 Properties 格式数据，例如: name=test\nage=18';
  }
});

// 检查是否可以生成签名
const canGenerate = computed(() => {
  if (!currentSignatureConfig.value) return false;
  if (currentSignatureConfig.value.needsKey && !signatureKey.value.trim()) return false;
  if (!dataContent.value.trim()) return false;
  return true;
});

// 检查是否可以保存模板
const canSaveTemplate = computed(() => {
  return canGenerate.value;
});

// 签名类型改变
function onSignatureTypeChange() {
  clearAll();
  selectedTemplateId.value = '';
}

// 加载模板
function loadTemplate() {
  if (!selectedTemplateId.value) {
    clearAll();
    return;
  }

  const template = templates.value.find(t => t.id === selectedTemplateId.value);
  if (!template) return;

  signatureType.value = template.type;
  dataFormat.value = template.dataFormat;
  signatureKey.value = template.key || '';
  dataContent.value = '';
}

// 解析数据为键值对
function parseData(): Record<string, string> {
  const content = dataContent.value.trim();
  if (!content) return {};

  if (dataFormat.value === 'json') {
    try {
      const obj = JSON.parse(content);
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = String(value);
      }
      return result;
    } catch (e) {
      throw new Error('JSON 格式错误，请检查输入');
    }
  } else {
    // Properties 格式
    const lines = content.split('\n');
    const result: Record<string, string> = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        if (key) {
          result[key] = value;
        }
      }
    }
    return result;
  }
}

// 生成签名（统一的入口，根据类型分发）
async function generateSignature() {
  message.value = '';
  signatureResult.value = '';

  try {
    // 解析数据
    const data = parseData();

    // 按字段名排序（字典升序）
    const sortedKeys = Object.keys(data).sort();

    // 拼接字符串：key1=value1&key2=value2&...
    const parts: string[] = [];
    for (const key of sortedKeys) {
      parts.push(`${key}=${data[key]}`);
    }

    let signString = parts.join('&');

    // 根据签名类型生成签名
    if (signatureType.value === 'md5') {
      // MD5签名：拼接key=密钥
      signString = `${signString}&key=${signatureKey.value}`;
      signatureResult.value = md5(signString);
      message.value = '签名生成成功';
      messageType.value = 'success';
    } else if (signatureType.value === 'rsa') {
      // RSA签名（需要在Electron环境中）
      if (isElectron.value && (window as any).electron?.signature) {
        try {
          const signature = await (window as any).electron.signature.rsaSign(signString, signatureKey.value);
          signatureResult.value = signature;
          message.value = '签名生成成功';
          messageType.value = 'success';
        } catch (error: any) {
          message.value = error.message || 'RSA签名失败';
          messageType.value = 'error';
        }
      } else {
        message.value = 'RSA签名功能仅在 Electron 客户端中可用';
        messageType.value = 'error';
      }
    } else {
      // 扩展新签名类型的地方
      // 示例：添加 SHA256 签名
      // else if (signatureType.value === 'sha256') {
      //   signString = `${signString}&key=${signatureKey.value}`;
      //   signatureResult.value = sha256(signString); // 需要导入 sha256 函数
      //   message.value = '签名生成成功';
      //   messageType.value = 'success';
      // }
      message.value = `暂不支持 ${signatureType.value} 签名类型`;
      messageType.value = 'error';
    }
  } catch (e: any) {
    message.value = e.message || '签名生成失败';
    messageType.value = 'error';
  }
}

// 清空所有
function clearAll() {
  signatureKey.value = '';
  dataContent.value = '';
  signatureResult.value = '';
  message.value = '';
  dataFormat.value = 'json';
}

// 复制签名
async function copySignature() {
  if (!signatureResult.value) return;
  try {
    await navigator.clipboard.writeText(signatureResult.value);
    message.value = '已复制到剪贴板';
    messageType.value = 'success';
  } catch {
    message.value = '复制失败，请手动复制';
    messageType.value = 'error';
  }
}

// 保存模板
async function saveTemplate() {
  if (!templateName.value.trim()) {
    message.value = '请输入模板名称';
    messageType.value = 'error';
    return;
  }

  if (!isElectron.value || !(window as any).electron?.signature) {
    message.value = '保存模板功能仅在 Electron 客户端中可用';
    messageType.value = 'error';
    showSaveTemplateDialog.value = false;
    return;
  }

  try {
    const template: SignatureTemplate = {
      id: Date.now().toString(),
      name: templateName.value.trim(),
      type: signatureType.value,
      dataFormat: dataFormat.value,
      key: signatureKey.value,
    };

    const result = await (window as any).electron.signature.saveTemplate(template);
    if (result.success) {
      message.value = '模板保存成功';
      messageType.value = 'success';
      await loadTemplates();
      showSaveTemplateDialog.value = false;
      templateName.value = '';
    } else {
      message.value = result.error || '保存失败';
      messageType.value = 'error';
    }
  } catch (error: any) {
    message.value = error.message || '保存失败';
    messageType.value = 'error';
  }
}

// 删除模板
async function deleteTemplate() {
  if (!selectedTemplateId.value) return;

  if (!confirm(`确定要删除模板 "${templates.value.find(t => t.id === selectedTemplateId.value)?.name}" 吗？`)) {
    return;
  }

  if (!isElectron.value || !(window as any).electron?.signature) {
    message.value = '删除模板功能仅在 Electron 客户端中可用';
    messageType.value = 'error';
    return;
  }

  try {
    const result = await (window as any).electron.signature.deleteTemplate(selectedTemplateId.value);
    if (result.success) {
      message.value = '模板删除成功';
      messageType.value = 'success';
      selectedTemplateId.value = '';
      await loadTemplates();
      clearAll();
    } else {
      message.value = result.error || '删除失败';
      messageType.value = 'error';
    }
  } catch (error: any) {
    message.value = error.message || '删除失败';
    messageType.value = 'error';
  }
}

// 加载模板列表
async function loadTemplates() {
  if (!isElectron.value || !(window as any).electron?.signature) {
    return;
  }

  try {
    templates.value = await (window as any).electron.signature.getTemplates();
  } catch (error) {
    console.error('加载模板列表失败:', error);
  }
}

onMounted(() => {
  isElectron.value = !!(window as any).electron?.signature;
  if (isElectron.value) {
    loadTemplates();
  }
});
</script>

<style scoped>
.tool-desc {
  margin: 8px 0 16px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.template-section {
  margin-top: 16px;
}

.template-selector {
  display: flex;
  gap: 8px;
  align-items: center;
}

.template-selector .input {
  flex: 1;
}

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

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.hint {
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
}

.hint.success {
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.hint.error {
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}
</style>
