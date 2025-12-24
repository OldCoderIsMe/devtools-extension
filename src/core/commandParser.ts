import {
  md5,
  sha1,
  sha256,
  sha512,
  base64Encode,
  base64Decode,
} from './hash';
import { urlEncode, urlDecode } from './url';
import { timestampToLocalString, dateStringToTimestamp } from './time';
import { unicodeToChinese, chineseToUnicode } from './unicode';

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
}

export function parseAndExecuteCommand(input: string): CommandResult {
  if (!input || !input.trim()) {
    return { success: false, error: '请输入命令' };
  }

  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  try {
    switch (command) {
      case 'md5':
        if (!args) {
          return { success: false, error: '请输入要计算 MD5 的字符串' };
        }
        return { success: true, output: md5(args) };

      case 'sha1':
        if (!args) {
          return { success: false, error: '请输入要计算 SHA1 的字符串' };
        }
        return { success: true, output: sha1(args) };

      case 'sha256':
        if (!args) {
          return { success: false, error: '请输入要计算 SHA256 的字符串' };
        }
        return { success: true, output: sha256(args) };

      case 'sha512':
        if (!args) {
          return { success: false, error: '请输入要计算 SHA512 的字符串' };
        }
        return { success: true, output: sha512(args) };

      case 'base64':
      case 'b64':
        if (!args) {
          return { success: false, error: '请输入要编码的字符串' };
        }
        return { success: true, output: base64Encode(args) };

      case 'base64d':
      case 'b64d':
        if (!args) {
          return { success: false, error: '请输入要解码的 Base64 字符串' };
        }
        return { success: true, output: base64Decode(args) };

      case 'urlencode':
      case 'url':
      case 'ue':
        if (!args) {
          return { success: false, error: '请输入要编码的 URL' };
        }
        return { success: true, output: urlEncode(args) };

      case 'urldecode':
      case 'ud':
        if (!args) {
          return { success: false, error: '请输入要解码的 URL' };
        }
        return { success: true, output: urlDecode(args) };

      case 'timestamp':
      case 'ts':
        if (!args) {
          return { success: false, error: '请输入时间戳' };
        }
        return { success: true, output: timestampToLocalString(args) };

      case 'date':
        if (!args) {
          return { success: false, error: '请输入日期时间字符串' };
        }
        const timestamp = dateStringToTimestamp(args);
        return { success: true, output: timestamp.toString() };

      case 'unicode':
      case 'uni':
      case 'u2c':
        if (!args) {
          return { success: false, error: '请输入 Unicode 编码，例如: \\u4e2d\\u6587' };
        }
        try {
          return { success: true, output: unicodeToChinese(args) };
        } catch (e: any) {
          return { success: false, error: e.message || 'Unicode 解码失败' };
        }

      case 'uniencode':
      case 'c2u':
      case 'uni2':
        if (!args) {
          return { success: false, error: '请输入中文字符' };
        }
        try {
          return { success: true, output: chineseToUnicode(args, 'slash') };
        } catch (e: any) {
          return { success: false, error: e.message || 'Unicode 编码失败' };
        }

      default:
        return {
          success: false,
          error: `未知命令: ${command}。支持的命令: md5, sha1, sha256, sha512, base64, base64d, urlencode, urldecode, timestamp, date, unicode, uniencode`,
        };
    }
  } catch (e: any) {
    return {
      success: false,
      error: e.message || '执行命令时出错',
    };
  }
}
