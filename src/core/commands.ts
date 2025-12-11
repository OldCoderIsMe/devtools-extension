export interface CommandInfo {
  name: string;
  aliases: string[];
  description: string;
  example: string;
}

export const AVAILABLE_COMMANDS: CommandInfo[] = [
  {
    name: 'md5',
    aliases: [],
    description: '计算 MD5 哈希值',
    example: 'md5 hello',
  },
  {
    name: 'sha1',
    aliases: [],
    description: '计算 SHA1 哈希值',
    example: 'sha1 hello',
  },
  {
    name: 'sha256',
    aliases: [],
    description: '计算 SHA256 哈希值',
    example: 'sha256 hello',
  },
  {
    name: 'sha512',
    aliases: [],
    description: '计算 SHA512 哈希值',
    example: 'sha512 hello',
  },
  {
    name: 'base64',
    aliases: ['b64'],
    description: 'Base64 编码',
    example: 'base64 hello',
  },
  {
    name: 'base64d',
    aliases: ['b64d'],
    description: 'Base64 解码',
    example: 'base64d aGVsbG8=',
  },
  {
    name: 'urlencode',
    aliases: ['url', 'ue'],
    description: 'URL 编码',
    example: 'urlencode hello world',
  },
  {
    name: 'urldecode',
    aliases: ['ud'],
    description: 'URL 解码',
    example: 'urldecode hello%20world',
  },
  {
    name: 'timestamp',
    aliases: ['ts'],
    description: '时间戳转日期',
    example: 'timestamp 1609459200',
  },
  {
    name: 'date',
    aliases: [],
    description: '日期转时间戳',
    example: 'date 2021-01-01 00:00:00',
  },
];

// 获取所有命令和别名的搜索关键词
export function getAllCommandKeywords(): string[] {
  const keywords: string[] = [];
  AVAILABLE_COMMANDS.forEach((cmd) => {
    keywords.push(cmd.name);
    keywords.push(...cmd.aliases);
  });
  return keywords;
}

// 模糊匹配命令
export function fuzzyMatchCommands(query: string): CommandInfo[] {
  if (!query.trim()) {
    return AVAILABLE_COMMANDS;
  }

  const lowerQuery = query.toLowerCase();
  const results: Array<{ command: CommandInfo; score: number }> = [];

  AVAILABLE_COMMANDS.forEach((cmd) => {
    let score = 0;

    // 完全匹配命令名（最高优先级）
    if (cmd.name.toLowerCase() === lowerQuery) {
      score = 1000;
    }
    // 命令名开头匹配
    else if (cmd.name.toLowerCase().startsWith(lowerQuery)) {
      score = 500;
    }
    // 命令名包含查询
    else if (cmd.name.toLowerCase().includes(lowerQuery)) {
      score = 200;
    }
    // 别名匹配
    else {
      const aliasMatch = cmd.aliases.find((alias) => {
        const lowerAlias = alias.toLowerCase();
        if (lowerAlias === lowerQuery) return true;
        if (lowerAlias.startsWith(lowerQuery)) return true;
        return lowerAlias.includes(lowerQuery);
      });

      if (aliasMatch) {
        if (aliasMatch.toLowerCase() === lowerQuery) {
          score = 400;
        } else if (aliasMatch.toLowerCase().startsWith(lowerQuery)) {
          score = 300;
        } else {
          score = 150;
        }
      }
    }

    // 描述匹配（较低优先级）
    if (score === 0 && cmd.description.toLowerCase().includes(lowerQuery)) {
      score = 50;
    }

    if (score > 0) {
      results.push({ command: cmd, score });
    }
  });

  // 按分数排序，分数高的在前
  results.sort((a, b) => b.score - a.score);

  return results.map((r) => r.command);
}
