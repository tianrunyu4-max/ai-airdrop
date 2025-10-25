-- ==========================================
-- 设置CEX空投自动同步定时任务
-- 每24小时自动执行一次
-- ==========================================

-- 1. 启用pg_cron扩展（如果未启用）
-- 注意：需要在Supabase Dashboard → Database → Extensions 中手动启用

-- 2. 创建触发器函数：自动调用Edge Function
CREATE OR REPLACE FUNCTION trigger_cex_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 调用Edge Function同步CEX空投
  PERFORM
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-cex-airdrops',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := '{}'::jsonb
    );
END;
$$;

-- 3. 创建定时任务：每天凌晨2点执行
SELECT cron.schedule(
  'sync-cex-airdrops-daily',          -- 任务名称
  '0 2 * * *',                        -- Cron表达式：每天凌晨2点
  $$
  SELECT trigger_cex_sync();
  $$
);

-- 4. 查看已创建的定时任务
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'sync-cex-airdrops-daily';

-- ==========================================
-- 如果需要修改执行时间，先删除旧任务：
-- SELECT cron.unschedule('sync-cex-airdrops-daily');
-- 然后重新执行上面的 cron.schedule
-- ==========================================

-- 常用Cron表达式：
-- '0 2 * * *'   - 每天凌晨2点
-- '0 */6 * * *' - 每6小时
-- '0 0 * * 0'   - 每周日凌晨0点
-- '0 8,20 * * *' - 每天早8点和晚8点

-- ==========================================
-- 注意事项：
-- 1. 需要先在Supabase Dashboard启用pg_cron扩展
-- 2. 需要先部署Edge Function: sync-cex-airdrops
-- 3. 需要设置环境变量（在第5步）
-- ==========================================

-- 5. 设置必要的环境变量（仅执行一次）
-- 替换下面的值为你的实际值
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://vtezesyfhvbkgpdkuyeo.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'YOUR_ANON_KEY_HERE';

-- 查看配置
SHOW app.settings.supabase_url;
SHOW app.settings.supabase_anon_key;

