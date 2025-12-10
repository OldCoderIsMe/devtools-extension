// 时间戳（秒/毫秒） -> 本地时间字符串
export function timestampToLocalString(input: string): string {
    if (!input) {
      throw new Error('请输入时间戳');
    }
  
    let ts = Number(input.trim());
    if (Number.isNaN(ts)) {
      throw new Error('时间戳格式错误');
    }
  
    // 10 位当作秒处理
    if (input.trim().length === 10) {
      ts = ts * 1000;
    }
  
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) {
      throw new Error('无法解析时间戳');
    }
  
    return formatDate(d);
  }
  
  // 日期字符串 -> 时间戳（毫秒）
  export function dateStringToTimestamp(input: string): number {
    if (!input) {
      throw new Error('请输入日期时间');
    }
  
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) {
      throw new Error('日期格式错误，请使用例如 2025-12-08 12:30:00');
    }
  
    return d.getTime();
  }
  
  function pad(num: number): string {
    return num < 10 ? `0${num}` : String(num);
  }
  
  export function formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const s = pad(d.getSeconds());
  
    return `${y}-${m}-${day} ${h}:${mi}:${s}`;
  }