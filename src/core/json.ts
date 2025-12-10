export function formatJson(input: string): string {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, 2);
  } catch (e: any) {
    throw new Error('JSON 格式错误：' + (e.message || '无效的 JSON'));
  }
}

export function compressJson(input: string): string {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch (e: any) {
    throw new Error('JSON 格式错误：' + (e.message || '无效的 JSON'));
  }
}

export function validateJson(input: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e: any) {
    return { valid: false, error: e.message || '无效的 JSON' };
  }
}

export function escapeJson(input: string): string {
  try {
    return JSON.stringify(input);
  } catch (e: any) {
    throw new Error('转义失败：' + (e.message || '未知错误'));
  }
}

export function unescapeJson(input: string): string {
  try {
    return JSON.parse(input);
  } catch (e: any) {
    throw new Error('反转义失败：' + (e.message || '无效的 JSON 字符串'));
  }
}

