# 🚀 Supabase 空投自动爬取配置指南

## 📋 前置准备

### 1. 获取 Supabase 项目信息

登录 [Supabase Dashboard](https://app.supabase.com/)，进入您的项目：

#### 需要的信息：
- **项目引用ID**（Project Reference ID）
- **项目URL**（Project URL）
- **Anon Key**（公开密钥）
- **Service Role Key**（服务角色密钥，⚠️ 保密）

#### 获取位置：
1. 进入项目主页
2. 点击左侧 **Settings** → **API**
3. 复制以下信息：
   ```
   Project URL: https://xyzabc123.supabase.co
   Project Reference ID: xyzabc123
   anon public: eyJhbGc...（公开密钥）
   service_role: eyJhbGc...（服务密钥，保密！）
   ```

---

## 🔧 第一步：配置环境变量

### 创建 `.env.local` 文件

在项目根目录创建 `.env.local` 文件：

```bash
# Supabase 配置
VITE_SUPABASE_URL=https://xyzabc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...你的anon key...
```

⚠️ **注意**：
- 替换为你的实际配置
- `.env.local` 不会被提交到 Git
- 修改后需要重启开发服务器

---

## 📦 第二步：部署 Edge Function

### 方法1：使用 Supabase CLI（推荐）

#### 1. 安装 Supabase CLI

**Windows (PowerShell)**:
```powershell
# 使用 Scoop
scoop install supabase

# 或使用 npm
npm install -g supabase
```

**Mac/Linux**:
```bash
# 使用 Homebrew
brew install supabase/tap/supabase

# 或使用 npm
npm install -g supabase
```

#### 2. 登录 Supabase
```bash
supabase login
```
会打开浏览器，授权登录。

#### 3. 关联项目
```bash
# 在项目根目录执行
supabase link --project-ref xyzabc123
```
替换 `xyzabc123` 为你的项目引用ID。

#### 4. 部署 Edge Function
```bash
supabase functions deploy auto-crawl-airdrops
```

#### 5. 验证部署
```bash
supabase functions list
```
应该能看到 `auto-crawl-airdrops` 函数。

### 方法2：通过 Supabase Dashboard（手动上传）

1. 进入 **Functions** → **Create a new function**
2. 函数名：`auto-crawl-airdrops`
3. 将 `supabase/functions/auto-crawl-airdrops/index.ts` 的内容粘贴进去
4. 点击 **Deploy**

---

## ⏰ 第三步：设置 Cron Job（自动推送）

### 1. 打开 SQL Editor

进入 Supabase Dashboard → **Database** → **SQL Editor**

### 2. 执行 Cron Job 配置

复制以下 SQL，**替换占位符**后执行：

```sql
-- ============================================
-- 空投自动爬取 Cron Job 配置（每2小时）
-- ============================================

-- 1. 启用必要扩展
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- 2. 删除旧的Cron Job（如果存在）
SELECT cron.unschedule('auto-crawl-airdrops-2h');

-- 3. 创建新的Cron Job
SELECT cron.schedule(
  'auto-crawl-airdrops-2h',
  '0 */2 * * *', -- 每2小时执行一次（0:00, 2:00, 4:00...）
  $$
  SELECT
    net.http_post(
      url := 'https://xyzabc123.supabase.co/functions/v1/auto-crawl-airdrops',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGc...你的service_role密钥...'
      ),
      body := jsonb_build_object(
        'source', 'cron',
        'timestamp', now()
      )
    ) AS request_id;
  $$
);

-- 4. 验证Cron Job
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname = 'auto-crawl-airdrops-2h';
```

### 3. 替换占位符

⚠️ **必须替换**：
1. `xyzabc123.supabase.co` → 你的项目URL
2. `eyJhbGc...你的service_role密钥...` → 你的 Service Role Key

### 4. 点击 **Run** 执行

应该看到 "Success. No rows returned"

---

## 🧪 第四步：测试功能

### 1. 手动测试一次（立即执行）

在 SQL Editor 中执行：

```sql
-- 立即执行一次爬取
SELECT
  net.http_post(
    url := 'https://xyzabc123.supabase.co/functions/v1/auto-crawl-airdrops',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGc...你的service_role密钥...'
    ),
    body := jsonb_build_object(
      'source', 'manual_test',
      'timestamp', now()
    )
  ) AS request_id;
```

### 2. 查看执行结果

#### 方法1：查看 Edge Function 日志
```
Supabase Dashboard → Functions → auto-crawl-airdrops → Logs
```

#### 方法2：查看 Cron Job 执行历史
```sql
SELECT 
  jobid,
  runid,
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
```

### 3. 检查空投数据

```sql
-- 查看最新爬取的空投
SELECT 
  title, 
  exchange, 
  ai_score, 
  created_at 
FROM airdrops 
ORDER BY created_at DESC 
LIMIT 5;
```

### 4. 检查核心群消息

```sql
-- 查看推送到核心群的消息
SELECT 
  m.content,
  m.created_at,
  g.name as group_name
FROM messages m
JOIN chat_groups g ON m.chat_group_id = g.id
WHERE m.is_bot = true
  AND g.type = 'default_hall'
ORDER BY m.created_at DESC
LIMIT 5;
```

---

## 📊 第五步：监控和维护

### 查看 Cron Job 状态

```sql
-- 查看所有Cron Jobs
SELECT * FROM cron.job;

-- 查看最近的执行记录
SELECT * 
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

### 暂停 Cron Job

```sql
SELECT cron.unschedule('auto-crawl-airdrops-2h');
```

### 重新启动 Cron Job

重新执行第三步的创建 Cron Job SQL

### 修改执行频率

编辑 Cron 表达式：

| 表达式 | 说明 | 执行频率 |
|--------|------|---------|
| `0 */2 * * *` | 每2小时 | 0:00, 2:00, 4:00... |
| `0 */1 * * *` | 每1小时 | 每小时整点 |
| `0 */4 * * *` | 每4小时 | 0:00, 4:00, 8:00... |
| `0 0 * * *` | 每天1次 | 每天午夜 |
| `*/30 * * * *` | 每30分钟 | 0:00, 0:30, 1:00... |

---

## 🔍 故障排查

### 问题1：Edge Function 部署失败

**可能原因**：
- Supabase CLI 未安装或未登录
- 项目未关联
- 权限不足

**解决方法**：
```bash
# 重新登录
supabase login

# 重新关联项目
supabase link --project-ref xyzabc123

# 查看详细错误
supabase functions deploy auto-crawl-airdrops --debug
```

### 问题2：Cron Job 不执行

**检查步骤**：
1. 确认 `pg_cron` 扩展已启用
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. 确认 Cron Job 已创建且激活
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'auto-crawl-airdrops-2h';
   ```

3. 查看错误日志
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE status = 'failed' 
   ORDER BY start_time DESC;
   ```

### 问题3：推送不到核心群

**检查步骤**：
1. 确认核心群存在
   ```sql
   SELECT * FROM chat_groups WHERE type = 'default_hall';
   ```

2. 如果没有，创建核心群
   ```sql
   INSERT INTO chat_groups (name, type, is_active, icon, description)
   VALUES ('AI科技大厅', 'default_hall', true, '🤖', '主群聊 - 人人可见');
   ```

3. 检查 RLS 策略
   ```sql
   -- 查看messages表的RLS策略
   SELECT * FROM pg_policies WHERE tablename = 'messages';
   ```

### 问题4：爬取不到数据

**可能原因**：
- RSS源无法访问（需要代理）
- rss2json API 限流
- 关键词过滤太严格

**解决方法**：
1. 手动测试RSS源
   ```
   https://api.rss2json.com/v1/api.json?rss_url=https://www.binance.com/en/support/announcement/rss
   ```

2. 调整关键词（修改 Edge Function）

3. 使用备用RSS解析服务

---

## 📝 常用命令速查

### Supabase CLI

```bash
# 登录
supabase login

# 关联项目
supabase link --project-ref <your-project-id>

# 部署函数
supabase functions deploy auto-crawl-airdrops

# 查看函数列表
supabase functions list

# 查看函数日志
supabase functions logs auto-crawl-airdrops

# 测试函数（本地）
supabase functions serve auto-crawl-airdrops
```

### SQL 常用查询

```sql
-- 查看最新空投
SELECT * FROM airdrops ORDER BY created_at DESC LIMIT 10;

-- 查看Cron Job状态
SELECT * FROM cron.job WHERE jobname = 'auto-crawl-airdrops-2h';

-- 查看最近执行
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- 手动触发一次
SELECT net.http_post(...);

-- 暂停Cron
SELECT cron.unschedule('auto-crawl-airdrops-2h');
```

---

## 🎯 完成检查清单

配置完成后，确认以下项目：

- [ ] ✅ `.env.local` 已创建并配置正确
- [ ] ✅ Edge Function 已部署成功
- [ ] ✅ Cron Job 已创建并激活
- [ ] ✅ 手动测试执行成功
- [ ] ✅ 核心群已创建（type = 'default_hall'）
- [ ] ✅ 爬取到新空投并推送到核心群
- [ ] ✅ 查看日志无错误

---

## 📞 需要帮助？

如果遇到问题：
1. 查看详细日志（Edge Function Logs）
2. 检查 Cron Job 执行历史
3. 验证数据库表结构
4. 查看 Supabase 文档：https://supabase.com/docs

**配置成功后，系统将每2小时自动爬取币安和欧易的空投资讯，并推送到核心群！** 🎉

