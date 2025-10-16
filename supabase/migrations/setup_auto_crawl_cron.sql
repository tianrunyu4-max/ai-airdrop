-- ============================================
-- 空投自动爬取 Cron Job 配置
-- 功能：每2小时自动爬取币安和欧易的空投资讯
-- ============================================

-- 1. 启用pg_cron扩展（如果还没启用）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 启用http扩展（用于调用Edge Function）
CREATE EXTENSION IF NOT EXISTS http;

-- 3. 删除旧的Cron Job（如果存在）
SELECT cron.unschedule('auto-crawl-airdrops-2h');

-- 4. 创建新的Cron Job（每2小时执行一次）
-- 执行时间：0:00, 2:00, 4:00, 6:00, 8:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00
SELECT cron.schedule(
  'auto-crawl-airdrops-2h', -- Job名称
  '0 */2 * * *',             -- Cron表达式：每2小时的0分执行
  $$
  SELECT
    net.http_post(
      url := 'https://YOURPROJECT.supabase.co/functions/v1/auto-crawl-airdrops', -- 替换为你的项目URL
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY' -- 替换为你的Service Role Key
      ),
      body := jsonb_build_object(
        'source', 'cron',
        'timestamp', now()
      )
    ) AS request_id;
  $$
);

-- 5. 查看Cron Job状态
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'auto-crawl-airdrops-2h';

-- 6. 查看Cron Job执行历史
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid 
  FROM cron.job 
  WHERE jobname = 'auto-crawl-airdrops-2h'
)
ORDER BY start_time DESC
LIMIT 10;

-- ============================================
-- 使用说明
-- ============================================

/*
### 配置步骤：

1. **在Supabase Dashboard中执行此SQL**：
   - 进入：Database → SQL Editor
   - 粘贴本文件内容
   - 替换 `YOURPROJECT` 为你的项目引用ID
   - 替换 `YOUR_SERVICE_ROLE_KEY` 为你的Service Role Key
   - 点击 Run

2. **验证Cron Job**：
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'auto-crawl-airdrops-2h';
   ```

3. **查看执行日志**：
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-crawl-airdrops-2h')
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

4. **手动测试一次**（立即执行）：
   ```sql
   SELECT cron.schedule(
     'test-crawl-once',
     '* * * * *', -- 每分钟执行一次
     $$
     SELECT net.http_post(
       url := 'https://YOURPROJECT.supabase.co/functions/v1/auto-crawl-airdrops',
       headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_KEY"}'::jsonb
     );
     $$
   );
   
   -- 等待1-2分钟后删除测试任务
   SELECT cron.unschedule('test-crawl-once');
   ```

5. **暂停Cron Job**：
   ```sql
   SELECT cron.unschedule('auto-crawl-airdrops-2h');
   ```

6. **重新启动Cron Job**：
   重新执行本文件的第4步SQL

### Cron表达式说明：

格式：`分 时 日 月 周`

- `0 */2 * * *` - 每2小时的0分执行（0:00, 2:00, 4:00...）
- `0 * * * *`   - 每小时的0分执行
- `0 0 * * *`   - 每天午夜0点执行
- `*/30 * * * *` - 每30分钟执行

### 故障排查：

1. **Cron Job不执行**：
   - 检查Edge Function是否已部署
   - 检查URL和Key是否正确
   - 查看执行日志是否有错误

2. **推送不到群组**：
   - 确认核心群存在（type = 'default_hall'）
   - 检查messages表的RLS策略
   - 查看Edge Function日志

3. **爬取失败**：
   - RSS源可能需要代理
   - 检查rss2json API是否可用
   - 网络连接问题
*/

