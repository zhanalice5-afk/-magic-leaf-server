#!/bin/bash

# ============================================
# Magic Leaf 后端独立部署脚本
# ============================================

echo "🚀 开始部署 Magic Leaf 后端..."

# 检查环境变量
if [ -z "$COZE_API_KEY" ]; then
    echo "❌ 错误：请设置 COZE_API_KEY 环境变量"
    echo "   export COZE_API_KEY=pat_your_api_key_here"
    exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ 错误：请设置 SUPABASE_URL 环境变量"
    echo "   export SUPABASE_URL=https://xxx.supabase.co"
    exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ 错误：请设置 SUPABASE_ANON_KEY 环境变量"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建项目
echo "🔨 构建项目..."
pnpm build

# 启动服务
echo "🚀 启动服务..."
PORT=${PORT:-5000}
NODE_ENV=production pnpm start

echo "✅ 部署完成！服务运行在 http://localhost:$PORT"
