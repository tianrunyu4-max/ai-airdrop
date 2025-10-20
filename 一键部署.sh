#!/bin/bash

# AI智能空投系统 - 一键部署脚本

echo "🚀 开始部署 AI智能空投系统..."

# 检查是否安装了 netlify-cli
if ! command -v netlify &> /dev/null
then
    echo "📦 安装 Netlify CLI..."
    npm install -g netlify-cli
fi

# 登录 Netlify（如果未登录）
echo "🔐 检查 Netlify 登录状态..."
netlify status || netlify login

# 构建项目
echo "🔨 构建项目..."
npm run build

# 部署到生产环境
echo "🚀 部署到 Netlify..."
netlify deploy --prod

echo "✅ 部署完成！"
echo "📱 请查看上方输出的域名地址"


