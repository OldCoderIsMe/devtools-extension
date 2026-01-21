// Unicode 转中文
export function unicodeToChinese(input: string): string {
  try {
    // 处理 \uXXXX 格式
    let result = input.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    // 处理 U+XXXX 格式
    result = result.replace(/U\+([0-9a-fA-F]{4,6})/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    return result;
  } catch (e) {
    throw new Error('Unicode 解码失败：格式不正确');
  }
}

// 中文转 Unicode
export function chineseToUnicode(input: string, format: 'slash' | 'plus' = 'slash'): string {
  let result = '';
  
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const code = char.charCodeAt(0);
    
    if (code > 127) {
      // 非 ASCII 字符转换为 Unicode
      const hex = code.toString(16).toUpperCase().padStart(4, '0');
      if (format === 'slash') {
        result += `\\u${hex}`;
      } else {
        result += `U+${hex}`;
      }
    } else {
      // ASCII 字符保持原样
      result += char;
    }
  }
  
  return result;
}

// 批量转换（按行处理）
export function batchUnicodeToChinese(input: string): string {
  const lines = input.split('\n');
  return lines.map(line => unicodeToChinese(line)).join('\n');
}

export function batchChineseToUnicode(input: string, format: 'slash' | 'plus' = 'slash'): string {
  const lines = input.split('\n');
  return lines.map(line => chineseToUnicode(line, format)).join('\n');
}

