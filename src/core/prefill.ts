import { onMounted, onUnmounted } from 'vue';

/**
 * 外部入口（右键菜单 / 剪贴板识别）与工具之间的一次性数据交接。
 *
 * 右键菜单由 background service worker 触发，popup 可能尚未创建，
 * 因此数据先写入 chrome.storage.local，popup 打开后消费一次并立即删除。
 */
export type PrefillSource = 'context-menu' | 'clipboard';

export interface PrefillPayload {
  /** 目标工具 id，与 App.vue 中 ToolMeta.id 一致 */
  toolId: string;
  /** 要带入工具的内容 */
  value: string;
  /** 工具内的具体动作，例如 URL 工具的 decode / encode */
  action?: string;
  source: PrefillSource;
  createdAt: number;
  /** 选中文本超长被截断时为 true */
  truncated?: boolean;
  /** 截断前的原始长度 */
  originalLength?: number;
}

/** chrome.storage.local 中的暂存 key，background 与 popup 共用 */
export const PREFILL_STORAGE_KEY = 'devtools-pending-prefill';

/** 剪贴板智能识别的开关，取值 'enabled' | 'disabled' */
export const CLIPBOARD_SETTING_KEY = 'devtools-clipboard-detect';

/** 超过 60 秒的暂存数据视为过期，避免重新打开时带入旧内容 */
export const PREFILL_TTL_MS = 60 * 1000;

/** 右键菜单可带入的最大字符数 */
export const PREFILL_MAX_LENGTH = 200_000;

type PrefillListener = (payload: PrefillPayload) => void;

const listeners = new Set<PrefillListener>();

/** 订阅预填事件，返回取消订阅函数 */
export function onPrefill(listener: PrefillListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 向当前挂载的工具派发一次预填 */
export function emitPrefill(payload: PrefillPayload): void {
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (error) {
      console.error('[prefill] 处理预填数据失败', error);
    }
  });
}

function getLocalStorageArea(): any {
  const chromeApi = typeof chrome !== 'undefined' ? (chrome as any) : undefined;
  return chromeApi?.storage?.local;
}

function storageSet(key: string, value: unknown): Promise<void> {
  const area = getLocalStorageArea();
  if (area) {
    return new Promise((resolve, reject) => {
      try {
        area.set({ [key]: value }, () => {
          const error = (typeof chrome !== 'undefined' ? (chrome as any)?.runtime?.lastError : undefined);
          if (error) {
            reject(new Error(error.message || '写入本地存储失败'));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return Promise.resolve();
  } catch {
    return Promise.reject(new Error('当前环境不支持存储'));
  }
}

function storageGet(key: string): Promise<unknown> {
  const area = getLocalStorageArea();
  if (area) {
    return new Promise((resolve) => {
      try {
        area.get([key], (result: Record<string, unknown>) => {
          resolve(result ? result[key] : undefined);
        });
      } catch {
        resolve(undefined);
      }
    });
  }

  try {
    const raw = sessionStorage.getItem(key);
    return Promise.resolve(raw ? JSON.parse(raw) : undefined);
  } catch {
    return Promise.resolve(undefined);
  }
}

function storageRemove(key: string): Promise<void> {
  const area = getLocalStorageArea();
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
    sessionStorage.removeItem(key);
  } catch {
    /* 忽略不可用环境 */
  }
  return Promise.resolve();
}

/** 写入待消费的预填数据（popup 打开后读取） */
export function writePendingPrefill(payload: PrefillPayload): Promise<void> {
  return storageSet(PREFILL_STORAGE_KEY, payload);
}

/** 读取并清除待消费的预填数据 */
export async function consumePendingPrefill(): Promise<PrefillPayload | null> {
  const payload = (await storageGet(PREFILL_STORAGE_KEY)) as PrefillPayload | undefined;
  await storageRemove(PREFILL_STORAGE_KEY);
  if (!payload || typeof payload.toolId !== 'string') {
    return null;
  }
  return payload;
}

/** 数据是否仍在有效期内 */
export function isPrefillFresh(payload: PrefillPayload | null): payload is PrefillPayload {
  return !!payload && typeof payload.createdAt === 'number' && Date.now() - payload.createdAt <= PREFILL_TTL_MS;
}

/** 工具内使用的组合式函数：组件挂载时订阅预填，卸载时自动取消 */
export function usePrefill(handler: PrefillListener): void {
  let dispose: (() => void) | null = null;

  onMounted(() => {
    dispose = onPrefill(handler);
  });

  onUnmounted(() => {
    dispose?.();
    dispose = null;
  });
}
