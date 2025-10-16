#!/bin/bash

# ============================================
# 空投自动爬取快速设置脚本
# ============================================

echo "🚀 开始设置空投自动爬取系统..."
echo ""

# 1. 检查 Supabase CLI
echo "📦 检查 Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI 未安装"
    echo "请先安装: npm install -g supabase"
    echo "或访问: https://supabase.com/docs/guides/cli"
    exit 1
fi
echo "✅ Supabase CLI 已安装"
echo ""

# 2. 检查登录状态
echo "🔐 检查登录状态..."
if ! supabase projects list &> /dev/null; then
    echo "❌ 未登录 Supabase"
    echo "正在打开登录页面..."
    supabase login
else
    echo "✅ 已登录 Supabase"
fi
echo ""

# 3. 提示输入项目ID
echo "📝 请输入您的 Supabase 项目引用ID:"
read -p "Project Reference ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "❌ 项目ID不能为空"
    exit 1
fi

echo ""
echo "🔗 正在关联项目..."
supabase link --project-ref $PROJECT_ID

if [ $? -ne 0 ]; then
    echo "❌ 项目关联失败"
    exit 1
fi
echo "✅ 项目关联成功"
echo ""

# 4. 部署 Edge Function
echo "🚀 正在部署 Edge Function..."
supabase functions deploy auto-crawl-airdrops

if [ $? -ne 0 ]; then
    echo "❌ Edge Function 部署失败"
    exit 1
fi
echo "✅ Edge Function 部署成功"
echo ""

# 5. 提示设置 Cron Job
echo "⏰ 接下来需要设置 Cron Job..."
echo ""
echo "请访问 Supabase Dashboard:"
echo "👉 https://app.supabase.com/project/$PROJECT_ID/database/cron-jobs"
echo ""
echo "然后执行以下 SQL（替换占位符）:"
echo ""
echo "---------------------------------------"
cat << 'EOF'
-- 启用扩展
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- 删除旧Job
SELECT cron.unschedule('auto-crawl-airdrops-2h');

-- 创建Cron Job（每2小时）
SELECT cron.schedule(
  'auto-crawl-airdrops-2h',
  '0 */2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/auto-crawl-airdrops',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := jsonb_build_object(
        'source', 'cron',
        'timestamp', now()
      )
    ) AS request_id;
  $$
);
EOF
echo "---------------------------------------"
echo ""
echo "⚠️ 记得替换："
echo "  - YOUR_PROJECT_ID → $PROJECT_ID"
echo "  - YOUR_SERVICE_ROLE_KEY → 你的 Service Role Key"
echo ""
echo "Service Role Key 获取位置："
echo "👉 https://app.supabase.com/project/$PROJECT_ID/settings/api"
echo ""

# 6. 完成提示
echo "✅ 部署完成！"
echo ""
echo "📋 后续步骤："
echo "1. 在 Supabase Dashboard 中执行上面的 SQL"
echo "2. 测试功能：访问管理后台 → 空投管理 → 点击'自动爬取'"
echo "3. 查看日志：Supabase Dashboard → Functions → auto-crawl-airdrops → Logs"
echo ""
echo "📖 详细文档："
echo "👉 查看 SUPABASE_AUTO_CRAWL_SETUP.md"
echo ""

