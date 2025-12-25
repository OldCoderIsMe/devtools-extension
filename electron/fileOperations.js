const fs = require('fs').promises;
const path = require('path');

// 路径验证：防止路径遍历攻击
function validatePath(filePath) {
  // 解析为绝对路径
  const resolvedPath = path.resolve(filePath);
  
  // 检查是否包含危险字符
  if (resolvedPath.includes('..')) {
    throw new Error('路径包含非法字符');
  }
  
  return resolvedPath;
}

// 安全地清空目录（只删除文件，保留目录结构）
async function clearDirectory(dirPath) {
  const validatedPath = validatePath(dirPath);
  
  // 检查目录是否存在
  try {
    const stat = await fs.stat(validatedPath);
    if (!stat.isDirectory()) {
      throw new Error(`路径不是目录: ${validatedPath}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`目录不存在: ${validatedPath}`);
    }
    throw error;
  }

  // 递归删除目录中的所有文件和子目录（但保留根目录）
  async function deleteFilesInDir(currentPath, isRoot = false) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        // 递归处理子目录
        await deleteFilesInDir(fullPath, false);
        // 删除子目录（但不删除根目录）
        if (!isRoot) {
          try {
            await fs.rmdir(fullPath);
          } catch (error) {
            // 忽略删除失败（可能目录不为空或其他原因）
            console.warn(`删除目录失败: ${fullPath}`, error.message);
          }
        }
      } else {
        // 删除文件
        try {
          await fs.unlink(fullPath);
        } catch (error) {
          console.warn(`删除文件失败: ${fullPath}`, error.message);
          throw error;
        }
      }
    }
  }

  await deleteFilesInDir(validatedPath, true);
}

// 安全地复制目录（递归复制所有文件和子目录）
async function copyDirectory(sourcePath, targetPath) {
  const validatedSource = validatePath(sourcePath);
  const validatedTarget = validatePath(targetPath);

  // 检查源目录是否存在
  try {
    const stat = await fs.stat(validatedSource);
    if (!stat.isDirectory()) {
      throw new Error(`源路径不是目录: ${validatedSource}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`源目录不存在: ${validatedSource}`);
    }
    throw error;
  }

  // 确保目标目录存在
  await fs.mkdir(validatedTarget, { recursive: true });

  // 递归复制文件
  async function copyRecursive(source, target) {
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourceEntry = path.join(source, entry.name);
      const targetEntry = path.join(target, entry.name);
      
      if (entry.isDirectory()) {
        // 创建目标子目录
        await fs.mkdir(targetEntry, { recursive: true });
        // 递归复制子目录
        await copyRecursive(sourceEntry, targetEntry);
      } else {
        // 复制文件
        await fs.copyFile(sourceEntry, targetEntry);
      }
    }
  }

  await copyRecursive(validatedSource, validatedTarget);
}

// 执行文件移动操作（清空目标目录 + 复制源文件）
async function executeFileMove(sourcePath, targetPath) {
  const startTime = Date.now();
  const stats = {
    filesCopied: 0,
    directoriesCreated: 0,
    errors: [],
  };

  try {
    // 1. 清空目标目录
    await clearDirectory(targetPath);
    
    // 2. 复制源文件到目标目录
    // 统计文件数量
    async function countFiles(dir) {
      let count = 0;
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          count += await countFiles(fullPath);
        } else {
          count++;
        }
      }
      return count;
    }

    const fileCount = await countFiles(sourcePath);
    
    // 执行复制
    await copyDirectory(sourcePath, targetPath);
    
    stats.filesCopied = fileCount;
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      message: `操作成功完成`,
      stats: {
        ...stats,
        duration: `${duration}ms`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || '文件操作失败',
      stats,
    };
  }
}

module.exports = {
  clearDirectory,
  copyDirectory,
  executeFileMove,
  validatePath,
};

