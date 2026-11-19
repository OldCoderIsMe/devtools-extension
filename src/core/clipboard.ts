/**
 * 剪贴板内容智能识别。
 *
 * 所有判断都在本地完成，不发起任何网络请求，也不持久化剪贴板内容。
 */
export type ClipboardKind = 'json' | 'jwt' | 'url' | 'timestamp' | 'uuid' | 'base64';

export interface ClipboardDetection {
  kind: ClipboardKind;
  /** 展示给用户的类型名，例如 JSON */
  label: string;
  /** 建议卡片文案，例如 检测到 JSON 内容 */
  description: string;
  /** 跳转的目标工具 id（与 App.vue 中 ToolMeta.id 一致） */
  toolId: string;
  /** 工具内执行的动作 */
  action: string;
  /** 原始内容，跳转时预填 */
  value: string;
}

/** 超过该长度的内容不做识别，避免误判和性能问题 */
const MAX_DETECT_LENGTH = 200_000;

/** Unix 时间戳合理区间：2001-09-09 ~ 2100-01-01 */
const MIN_TIMESTAMP_SECONDS = 1_000_000_000;
const MAX_TIMESTAMP_SECONDS = 4_102_444_800;

export function decodeBase64Url(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function isJwt(text: string): boolean {
  const segments = text.split('.');
  if (segments.length !== 3) return false;
  if (!segments.every((segment) => segment.length > 0 && /^[A-Za-z0-9_-]+$/.test(segment))) {
    return false;
  }
  try {
    const header = JSON.parse(decodeBase64Url(segments[0]));
    return !!header && typeof header === 'object' && ('alg' in header || 'typ' in header);
  } catch {
    return false;
  }
}

function isHttpUrl(text: string): boolean {
  if (!/^https?:\/\/\S+$/i.test(text)) return false;
  try {
    const url = new URL(text);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname;
  } catch {
    return false;
  }
}

function isUuid(text: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
}

function isTimestamp(text: string): boolean {
  if (!/^\d{10}$|^\d{13}$/.test(text)) return false;
  const seconds = text.length === 10 ? Number(text) : Math.floor(Number(text) / 1000);
  return seconds >= MIN_TIMESTAMP_SECONDS && seconds <= MAX_TIMESTAMP_SECONDS;
}

function isJson(text: string): boolean {
  if (!/^[[{]/.test(text)) return false;
  try {
    const parsed = JSON.parse(text);
    return parsed !== null && typeof parsed === 'object';
  } catch {
    return false;
  }
}

function isBase64(text: string): boolean {
  if (text.length < 8 || text.length % 4 !== 0) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(text)) return false;
  try {
    const binary = atob(text);
    if (binary.length === 0) return false;
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    // 必须是合法的 UTF-8，且大部分字符可打印，避免把随机哈希当成 Base64
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (!decoded.trim()) return false;
    const printable = decoded.replace(/[\t\n\r]/g, '');
    const printableCount = Array.from(printable).filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f && code !== 0xfffd;
    }).length;
    return printable.length > 0 && printableCount / printable.length >= 0.9;
  } catch {
    return false;
  }
}

/**
 * 识别剪贴板文本类型。未命中时返回 null，调用方应当静默处理。
 */
export function detectClipboard(raw: string | null | undefined): ClipboardDetection | null {
  if (typeof raw !== 'string') return null;

  const text = raw.trim();
  if (!text || text.length > MAX_DETECT_LENGTH) return null;

  if (isJwt(text)) {
    return {
      kind: 'jwt',
      label: 'JWT',
      description: '检测到 JWT，去解析',
      toolId: 'jwt',
      action: 'parse',
      value: text,
    };
  }

  if (isHttpUrl(text)) {
    return {
      kind: 'url',
      label: 'URL',
      description: '检测到 URL，去解码',
      toolId: 'url',
      action: 'decode',
      value: text,
    };
  }

  if (isUuid(text)) {
    return {
      kind: 'uuid',
      label: 'UUID',
      description: '检测到 UUID，去生成工具查看',
      toolId: 'uuid',
      action: 'inspect',
      value: text,
    };
  }

  if (isTimestamp(text)) {
    return {
      kind: 'timestamp',
      label: '时间戳',
      description: '检测到 Unix 时间戳，去解析',
      toolId: 'time',
      action: 'timestamp',
      value: text,
    };
  }

  if (isJson(text)) {
    return {
      kind: 'json',
      label: 'JSON',
      description: '检测到 JSON 内容，去格式化',
      toolId: 'json',
      action: 'format',
      value: text,
    };
  }

  if (isBase64(text)) {
    return {
      kind: 'base64',
      label: 'Base64',
      description: '检测到 Base64 内容，去解码',
      toolId: 'md5',
      action: 'base64-decode',
      value: text,
    };
  }

  return null;
}
