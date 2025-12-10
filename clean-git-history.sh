#!/bin/bash

# Git 历史清理脚本
# 此脚本将创建一个全新的 Git 历史，移除所有历史提交中的敏感信息

set -e

echo "⚠️  警告：此操作将删除所有 Git 历史！"
echo "📋 当前状态："
git status --short

echo ""
echo "🔍 检查远程仓库..."
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -n "$REMOTE_URL" ]; then
    echo "   远程仓库: $REMOTE_URL"
else
    echo "   未配置远程仓库"
fi

echo ""
read -p "是否继续？这将删除所有 Git 历史并创建新的初始提交 (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 操作已取消"
    exit 1
fi

echo ""
echo "📦 保存当前更改..."
# 暂存所有更改
git add -A

echo ""
echo "🗑️  删除 Git 历史..."
# 删除 .git 文件夹
rm -rf .git

echo ""
echo "🔄 重新初始化 Git 仓库..."
# 重新初始化
git init
git branch -M main

echo ""
echo "📝 创建初始提交..."
# 添加所有文件
git add -A
git commit -m "Initial commit: DevTools Suite

- Chrome browser extension
- Pure browser web application
- macOS desktop application (Electron)
- All calculations done locally, no data uploaded"

if [ -n "$REMOTE_URL" ]; then
    echo ""
    echo "🔗 配置远程仓库..."
    git remote add origin "$REMOTE_URL"
    echo "   远程仓库已配置: $REMOTE_URL"
    echo ""
    echo "⚠️  下一步操作："
    echo "   1. 检查更改: git log"
    echo "   2. 强制推送到远程（覆盖历史）:"
    echo "      git push -f origin main"
    echo ""
    echo "   ⚠️  警告：强制推送会覆盖远程仓库的历史！"
else
    echo ""
    echo "✅ Git 历史已清理完成！"
    echo "   如需连接到远程仓库，请运行："
    echo "   git remote add origin <your-repo-url>"
fi

echo ""
echo "✅ 完成！"
