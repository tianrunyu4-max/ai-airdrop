# ============================================
# 空投自动爬取快速设置脚本 (PowerShell)
# ============================================

Write-Host "🚀 开始设置空投自动爬取系统..." -ForegroundColor Green
Write-Host ""

# 1. 检查 Supabase CLI
Write-Host "📦 检查 Supabase CLI..." -ForegroundColor Yellow
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI 未安装" -ForegroundColor Red
    Write-Host "请先安装: npm install -g supabase" -ForegroundColor Yellow
    Write-Host "或访问: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 2. 检查登录状态
Write-Host "🔐 检查登录状态..." -ForegroundColor Yellow
$loginCheck = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 未登录 Supabase" -ForegroundColor Red
    Write-Host "正在打开登录页面..." -ForegroundColor Yellow
    supabase login
} else {
    Write-Host "✅ 已登录 Supabase" -ForegroundColor Green
}
Write-Host ""

# 3. 提示输入项目ID
Write-Host "📝 请输入您的 Supabase 项目引用ID:" -ForegroundColor Yellow
$PROJECT_ID = Read-Host "Project Reference ID"

if ([string]::IsNullOrWhiteSpace($PROJECT_ID)) {
    Write-Host "❌ 项目ID不能为空" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔗 正在关联项目..." -ForegroundColor Yellow
supabase link --project-ref $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 项目关联失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 项目关联成功" -ForegroundColor Green
Write-Host ""

# 4. 部署 Edge Function
Write-Host "🚀 正在部署 Edge Function..." -ForegroundColor Yellow
supabase functions deploy auto-crawl-airdrops

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Edge Function 部署失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Edge Function 部署成功" -ForegroundColor Green
Write-Host ""

# 5. 提示设置 Cron Job
Write-Host "⏰ 接下来需要设置 Cron Job..." -ForegroundColor Cyan
Write-Host ""
Write-Host "请访问 Supabase Dashboard:" -ForegroundColor Yellow
Write-Host "👉 https://app.supabase.com/project/$PROJECT_ID/database/cron-jobs" -ForegroundColor Green
Write-Host ""
Write-Host "然后执行以下 SQL（替换占位符）:" -ForegroundColor Yellow
Write-Host ""
Write-Host "---------------------------------------" -ForegroundColor Gray

$cronSql = @"
-- 启用扩展
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- 删除旧Job
SELECT cron.unschedule('auto-crawl-airdrops-2h');

-- 创建Cron Job（每2小时）
SELECT cron.schedule(
  'auto-crawl-airdrops-2h',
  '0 */2 * * *',
  `$`$
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
  `$`$
);
"@

Write-Host $cronSql -ForegroundColor White
Write-Host "---------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️ 记得替换：" -ForegroundColor Red
Write-Host "  - YOUR_PROJECT_ID → $PROJECT_ID" -ForegroundColor Yellow
Write-Host "  - YOUR_SERVICE_ROLE_KEY → 你的 Service Role Key" -ForegroundColor Yellow
Write-Host ""
Write-Host "Service Role Key 获取位置：" -ForegroundColor Yellow
Write-Host "👉 https://app.supabase.com/project/$PROJECT_ID/settings/api" -ForegroundColor Green
Write-Host ""

# 6. 完成提示
Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 后续步骤：" -ForegroundColor Cyan
Write-Host "1. 在 Supabase Dashboard 中执行上面的 SQL" -ForegroundColor White
Write-Host "2. 测试功能：访问管理后台 → 空投管理 → 点击'自动爬取'" -ForegroundColor White
Write-Host "3. 查看日志：Supabase Dashboard → Functions → auto-crawl-airdrops → Logs" -ForegroundColor White
Write-Host ""
Write-Host "📖 详细文档：" -ForegroundColor Cyan
Write-Host "👉 查看 SUPABASE_AUTO_CRAWL_SETUP.md" -ForegroundColor Green
Write-Host ""

# 询问是否打开浏览器
$openBrowser = Read-Host "是否现在打开 Supabase Dashboard? (Y/N)"
if ($openBrowser -eq 'Y' -or $openBrowser -eq 'y') {
    Start-Process "https://app.supabase.com/project/$PROJECT_ID/database/cron-jobs"
}

