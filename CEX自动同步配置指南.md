# CEX空投自动同步配置指南

## 🎯 目标

- ✅ 交易所空投（CEX）和去中心化空投（Web3）各占 **50%**
- ✅ 每 **24小时** 自动同步交易所空投一次

---

## 📊 已完成的修改

### ✅ 修改1：推送比例改为 50-50

**文件：** `src/views/chat/ChatView.vue`

```typescript
// 原来：90% Web3, 10% CEX
const type = randomNum < 0.9 ? 'web3' : 'cex'

// 现在：50% Web3, 50% CEX
const type = randomNum < 0.5 ? 'web3' : 'cex'
```

---

## 🚀 配置24小时自动同步

### 方式A：使用Supabase定时任务（推荐）

#### **步骤1：启用pg_cron扩展**

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧 **Database**
4. 点击 **Extensions**
5. 搜索 `pg_cron`
6. 点击启用（Enable）

---

#### **步骤2：获取你的Anon Key**

1. 在Supabase Dashboard
2. 点击左侧 **Settings** → **API**
3. 找到 **Project API keys**
4. 复制 `anon` `public` key（一串很长的字符）

---

#### **步骤3：设置环境变量**

在Supabase SQL编辑器中执行：

```sql
-- 替换为你的实际值
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://vtezesyfhvbkgpdkuyeo.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'YOUR_ANON_KEY_这里粘贴你复制的key';
```

---

#### **步骤4：创建定时任务**

在Supabase SQL编辑器中执行：

```sql
-- 创建触发函数
CREATE OR REPLACE FUNCTION trigger_cex_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

-- 创建定时任务：每天凌晨2点执行
SELECT cron.schedule(
  'sync-cex-airdrops-daily',
  '0 2 * * *',
  $$SELECT trigger_cex_sync();$$
);
```

---

#### **步骤5：验证定时任务**

```sql
-- 查看已创建的定时任务
SELECT 
  jobid,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'sync-cex-airdrops-daily';
```

应该看到一条记录，`active = true`。

---

#### **步骤6：测试手动触发**

```sql
-- 立即执行一次（测试用）
SELECT trigger_cex_sync();
```

然后在管理后台刷新空投列表，看是否有新的CEX空投。

---

### 方式B：简化版（不使用定时任务）

如果觉得配置复杂，可以：

#### **方式B1：管理员每天手动点击**

1. 每天登录管理后台
2. 点击"同步CEX空投"按钮
3. 查看同步结果

#### **方式B2：前端定时器（不推荐）**

在管理后台页面添加自动定时器（但用户关闭页面就停止了）。

---

## 🔧 自定义定时时间

### 修改执行时间

如果想改成每天早上8点和晚上8点各执行一次：

```sql
-- 1. 先删除旧任务
SELECT cron.unschedule('sync-cex-airdrops-daily');

-- 2. 创建新任务
SELECT cron.schedule(
  'sync-cex-airdrops-twice-daily',
  '0 8,20 * * *',  -- 每天8点和20点
  $$SELECT trigger_cex_sync();$$
);
```

### Cron表达式参考

```
格式：分 时 日 月 周

示例：
'0 2 * * *'     - 每天凌晨2点
'0 */6 * * *'   - 每6小时
'0 8,20 * * *'  - 每天早8点和晚8点
'0 0 * * 0'     - 每周日凌晨0点
'*/30 * * * *'  - 每30分钟
```

---

## 📊 监控和日志

### 查看定时任务历史

```sql
-- 查看最近执行记录
SELECT 
  runid,
  jobid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-cex-airdrops-daily')
ORDER BY start_time DESC
LIMIT 10;
```

### 查看Edge Function日志

在Supabase Dashboard：
1. 点击左侧 **Edge Functions**
2. 选择 `sync-cex-airdrops`
3. 点击 **Logs** 标签
4. 查看执行记录和错误信息

---

## 🎯 完整部署检查清单

### ✅ 前端修改
- [x] 推送比例改为 50% CEX + 50% Web3

### ✅ 数据库配置
- [ ] 执行 `升级airdrops表结构.sql`
- [ ] 插入初始数据（可选）
- [ ] 启用 `pg_cron` 扩展
- [ ] 设置环境变量（Supabase URL + Anon Key）
- [ ] 创建定时任务函数
- [ ] 创建定时任务

### ✅ Edge Function
- [ ] 部署 `sync-cex-airdrops` Edge Function

### ✅ 验证测试
- [ ] 手动触发同步测试
- [ ] 查看定时任务是否创建成功
- [ ] 等待24小时后检查自动执行

---

## 🐛 故障排查

### 问题1：定时任务没有执行

**检查：**
```sql
-- 1. 查看任务是否激活
SELECT * FROM cron.job WHERE jobname = 'sync-cex-airdrops-daily';

-- 2. 查看执行历史
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;

-- 3. 检查环境变量
SHOW app.settings.supabase_url;
SHOW app.settings.supabase_anon_key;
```

### 问题2：Edge Function调用失败

**可能原因：**
- Edge Function未部署
- Anon Key错误
- URL配置错误
- 网络问题

**解决：**
手动测试Edge Function：
```bash
curl -X POST \
  https://vtezesyfhvbkgpdkuyeo.supabase.co/functions/v1/sync-cex-airdrops \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### 问题3：同步数据不正确

**检查：**
1. Edge Function日志
2. 交易所API是否可访问
3. 数据库RLS策略

---

## 📝 管理命令速查

```sql
-- 查看所有定时任务
SELECT * FROM cron.job;

-- 删除定时任务
SELECT cron.unschedule('sync-cex-airdrops-daily');

-- 立即执行一次
SELECT trigger_cex_sync();

-- 查看最近执行记录
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- 禁用定时任务
UPDATE cron.job SET active = false WHERE jobname = 'sync-cex-airdrops-daily';

-- 启用定时任务
UPDATE cron.job SET active = true WHERE jobname = 'sync-cex-airdrops-daily';
```

---

## 🎉 配置完成后的效果

### **推送逻辑：**
```
聊天机器人每2分钟推送一次空投：
├── 50% 概率推送 Web3 空投（去中心化）
│   └── LayerZero、Scroll、zkSync 等
└── 50% 概率推送 CEX 空投（交易所）
    └── Binance、OKX、Bybit 等
```

### **数据更新：**
```
交易所空投数据：
├── 自动更新：每天凌晨2点自动同步
├── 手动更新：管理员随时点击"同步CEX空投"
└── 数据来源：Binance/OKX/Bybit 官方API
```

---

## 🚀 快速开始

### 最简单的配置（3步）

```sql
-- 第1步：启用扩展
-- 在Supabase Dashboard → Database → Extensions 启用 pg_cron

-- 第2步：设置环境变量（替换你的key）
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://vtezesyfhvbkgpdkuyeo.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'YOUR_ANON_KEY';

-- 第3步：执行完整的定时任务SQL
-- 复制并执行 supabase/migrations/设置CEX自动同步定时任务.sql 的全部内容
```

---

**配置完成！** 🎊

现在你的空投系统：
- ✅ CEX 和 Web3 各占 50%
- ✅ 每24小时自动更新交易所空投
- ✅ 管理员可随时手动同步

