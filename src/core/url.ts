export function urlEncode(input: string): string {
    try {
      return encodeURIComponent(input);
    } catch (e) {
      throw new Error('URL 编码失败，请检查输入内容');
    }
  }
  
  export function urlDecode(input: string): string {
    try {
      return decodeURIComponent(input);
    } catch (e) {
      throw new Error('URL 解码失败，请检查输入内容是否已经被编码');
    }
  }