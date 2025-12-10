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

