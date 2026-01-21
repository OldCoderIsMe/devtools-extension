// 文本去重（按行）
export function removeDuplicates(input: string): string {
  const lines = input.split('\n');
  const seen = new Set<string>();
  const result: string[] = [];
  
  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      result.push(line);
    }
  }
  
  return result.join('\n');
}

// 文本排序（按行）
export function sortLines(input: string, descending: boolean = false): string {
  const lines = input.split('\n').filter(line => line.trim() !== '');
  lines.sort((a, b) => {
    const comparison = a.localeCompare(b, 'zh-CN');
    return descending ? -comparison : comparison;
  });
  return lines.join('\n');
}

// 大小写转换
export function toUpperCase(input: string): string {
  return input.toUpperCase();
}

export function toLowerCase(input: string): string {
  return input.toLowerCase();
}

export function toTitleCase(input: string): string {
  return input.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function toCamelCase(input: string): string {
  return input
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

// 文本统计
export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
}

export function getTextStats(input: string): TextStats {
  const characters = input.length;
  const charactersNoSpaces = input.replace(/\s/g, '').length;
  const words = input.trim() === '' ? 0 : input.trim().split(/\s+/).length;
  const lines = input === '' ? 0 : input.split('\n').length;
  const paragraphs = input.trim() === '' ? 0 : input.split(/\n\s*\n/).filter(p => p.trim()).length;
  
  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    paragraphs,
  };
}

// 特殊字符类型
export type SpecialCharType = 'emoji' | 'invisible' | 'control' | 'zeroWidth' | 'punctuation' | 'symbols';

// 剔除特殊字符
export function removeSpecialChars(
  input: string,
  types: SpecialCharType[] = ['emoji', 'invisible']
): string {
  let result = input;

  // Emoji 字符（Unicode Emoji 范围）
  if (types.includes('emoji')) {
    // 匹配 Emoji 相关的 Unicode 范围
    // 使用更全面的 Emoji 正则表达式
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2190}-\u{21FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}-\u{2BFF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]|[\u{20E3}]/gu;
    result = result.replace(emojiRegex, '');
  }

  // 不可见字符（包括控制字符和零宽字符）
  if (types.includes('invisible')) {
    // 零宽字符
    result = result.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');
    // 其他不可见字符
    result = result.replace(/[\u2060-\u206F\u180E]/g, '');
  }

  // 控制字符（ASCII 控制字符）
  if (types.includes('control')) {
    // 保留换行符和制表符，移除其他控制字符
    result = result.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  }

  // 零宽字符（单独选项）
  if (types.includes('zeroWidth')) {
    result = result.replace(/[\u200B-\u200D\uFEFF\u2060-\u206F\u180E]/g, '');
  }

  // 标点符号
  if (types.includes('punctuation')) {
    // 保留基本标点，移除特殊标点符号
    result = result.replace(/[！？。，、；：""''（）【】《》〈〉「」『』〔〕…—～·]/g, '');
    // 移除其他 Unicode 标点符号
    result = result.replace(/[\u2000-\u206F\u2E00-\u2E7F]/g, '');
  }

  // 符号（数学符号、货币符号等）
  if (types.includes('symbols')) {
    // 数学符号
    result = result.replace(/[\u2200-\u22FF]/g, '');
    // 货币符号（保留常见货币符号，移除其他）
    result = result.replace(/[\u20A0-\u20CF]/g, '');
    // 其他符号
    result = result.replace(/[\u2600-\u26FF\u2700-\u27BF]/g, '');
  }

  return result;
}

