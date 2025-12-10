export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

export function computeDiff(text1: string, text2: string): DiffLine[] {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  
  const result: DiffLine[] = [];
  const maxLen = Math.max(lines1.length, lines2.length);
  
  for (let i = 0; i < maxLen; i++) {
    const line1 = lines1[i];
    const line2 = lines2[i];
    
    if (line1 === undefined && line2 !== undefined) {
      // 新增的行
      result.push({ type: 'added', content: line2, lineNumber: i + 1 });
    } else if (line1 !== undefined && line2 === undefined) {
      // 删除的行
      result.push({ type: 'removed', content: line1, lineNumber: i + 1 });
    } else if (line1 === line2) {
      // 未改变的行
      result.push({ type: 'unchanged', content: line1, lineNumber: i + 1 });
    } else {
      // 修改的行：先显示删除，再显示新增
      result.push({ type: 'removed', content: line1, lineNumber: i + 1 });
      result.push({ type: 'added', content: line2, lineNumber: i + 1 });
    }
  }
  
  return result;
}

// 简单的字符级差异（用于短文本）
export function computeCharDiff(text1: string, text2: string): Array<{ char: string; type: 'added' | 'removed' | 'unchanged' }> {
  const result: Array<{ char: string; type: 'added' | 'removed' | 'unchanged' }> = [];
  const len1 = text1.length;
  const len2 = text2.length;
  const maxLen = Math.max(len1, len2);
  
  for (let i = 0; i < maxLen; i++) {
    const char1 = text1[i];
    const char2 = text2[i];
    
    if (char1 === undefined && char2 !== undefined) {
      result.push({ char: char2, type: 'added' });
    } else if (char1 !== undefined && char2 === undefined) {
      result.push({ char: char1, type: 'removed' });
    } else if (char1 === char2) {
      result.push({ char: char1, type: 'unchanged' });
    } else {
      result.push({ char: char1, type: 'removed' });
      result.push({ char: char2, type: 'added' });
    }
  }
  
  return result;
}

