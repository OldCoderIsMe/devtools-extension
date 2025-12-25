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

// 列出文件移动配对（仅 Electron）
async function listFileMovePairs(): Promise<CommandResult> {
  try {
    const electron = (window as any).electron;
    if (!electron?.fileMove) {
      return { success: false, error: '文件移动功能不可用' };
    }
    
    const pairs = await electron.fileMove.getPairs();
    if (pairs.length === 0) {
      return { success: true, output: '暂无配置的文件移动配对。\n\n提示：在设置中配置路径配对后即可使用。' };
    }
    
    const list = pairs.map((p: any) => 
      `  ${p.alias}: ${p.sourcePath} → ${p.targetPath}${p.description ? ` (${p.description})` : ''}`
    ).join('\n');
    
    return { success: true, output: `已配置的配对:\n${list}` };
  } catch (e: any) {
    return { success: false, error: e.message || '获取配对列表失败' };
  }
}

// 执行文件移动（仅 Electron）
async function executeFileMove(alias: string): Promise<CommandResult> {
  try {
    const electron = (window as any).electron;
    if (!electron?.fileMove) {
      return { success: false, error: '文件移动功能不可用' };
    }
    
    // 执行文件移动操作
    const result = await electron.fileMove.execute(alias, false);
    
    if (result.success) {
      const stats = result.stats || {};
      const message = `操作成功完成！\n` +
        `复制文件数: ${stats.filesCopied || 0}\n` +
        `耗时: ${stats.duration || 'N/A'}`;
      return { success: true, output: message };
    } else {
      return { success: false, error: result.error || '文件移动失败' };
    }
  } catch (e: any) {
    return { success: false, error: e.message || '执行文件移动失败' };
  }
}

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
}

export async function parseAndExecuteCommand(input: string): Promise<CommandResult> {
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

      case 'move':
        // 文件移动操作（仅 Electron 环境，异步）
        if (typeof window === 'undefined' || !(window as any).electron?.fileMove) {
          return Promise.resolve({
            success: false,
            error: '文件移动功能仅在 Electron 客户端中可用',
          });
        }
        
        if (!args) {
          // 列出所有配置的配对
          return listFileMovePairs();
        }
        
        // 执行文件移动
        return executeFileMove(args.trim());

      default:
        return {
          success: false,
          error: `未知命令: ${command}。支持的命令: md5, sha1, sha256, sha512, base64, base64d, urlencode, urldecode, timestamp, date, unicode, uniencode, move`,
        };
    }
  } catch (e: any) {
    return {
      success: false,
      error: e.message || '执行命令时出错',
    };
  }
}
