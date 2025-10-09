# 🕐 定时任务配置指南

**目标**: 实现AI学习机每日释放和分红自动结算  
**技术**: Supabase Edge Functions + Cron

---

## ✅ **已创建的文件**

```
supabase/functions/
├── daily-release/
│   └── index.ts           (AI学习机每日释放)
└── dividend-settlement/
    └── index.ts           (分红自动结算)
```

---

## 🚀 **部署步骤**

### **方法1: 使用 Supabase CLI（推荐）** ⏰ 10分钟

#### **Step 1: 安装 Supabase CLI**

```bash
# 使用 npm 安装
npm install -g supabase

# 或使用 scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### **Step 2: 登录 Supabase**

```bash
supabase login
```

#### **Step 3: 关联项目**

```bash
# 在项目目录下执行
cd C:\Users\sss\Desktop\AI智能空投

# 关联到您的Supabase项目
supabase link --project-ref your-project-ref
# 项目ref可以在 Supabase Dashboard → Settings → General 中找到
```

#### **Step 4: 部署 Edge Functions**

```bash
# 部署每日释放函数
supabase functions deploy daily-release

# 部署分红结算函数
supabase functions deploy dividend-settlement
```

#### **Step 5: 配置环境变量**

```bash
# 为函数设置环境变量
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### **Step 6: 配置 Cron**

在 Supabase Dashboard:
1. 进入 **Database** → **Cron Jobs**
2. 或者手动执行 SQL:

```sql
-- 安装 pg_cron 扩展（如果还没安装）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 每天00:00执行AI学习机释放
SELECT cron.schedule(
  'daily-release',
  '0 0 * * *',
  $$
    SELECT
      net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/daily-release',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
        body := '{}'::jsonb
      ) AS request_id;
  $$
);

-- 每周一、三、五、日 00:00执行分红结算
SELECT cron.schedule(
  'dividend-settlement',
  '0 0 * * 1,3,5,0',
  $$
    SELECT
      net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/dividend-settlement',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
        body := '{}'::jsonb
      ) AS request_id;
  $$
);
```

---

### **方法2: 手动部署（简单方式）** ⏰ 5分钟

如果不想安装CLI，可以使用 Supabase Dashboard:

1. **打开 Supabase Dashboard**
   - 访问: https://supabase.com/dashboard
   - 选择您的项目

2. **创建 Edge Function**
   - 点击左侧菜单 **Edge Functions**
   - 点击 **New Function**
   - 名称: `daily-release`
   - 复制 `supabase/functions/daily-release/index.ts` 的内容
   - 点击 **Deploy**

3. **重复步骤2创建第二个函数**
   - 名称: `dividend-settlement`
   - 复制 `supabase/functions/dividend-settlement/index.ts` 的内容
   - 点击 **Deploy**

4. **配置 Cron**
   - 进入 **Database** → **SQL Editor**
   - 执行上面的 SQL 脚本

---

## 🧪 **测试定时任务**

### **手动触发测试**

#### **测试每日释放**

```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/daily-release' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

或者在浏览器控制台:

```javascript
const response = await fetch('https://your-project.supabase.co/functions/v1/daily-release', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  }
})
const result = await response.json()
console.log('每日释放结果:', result)
```

#### **测试分红结算**

```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/dividend-settlement' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type': application/json'
```

或者在浏览器控制台:

```javascript
const response = await fetch('https://your-project.supabase.co/functions/v1/dividend-settlement', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  }
})
const result = await response.json()
console.log('分红结算结果:', result)
```

---

### **在管理后台添加手动触发按钮（可选）**

更新 `src/views/admin/SystemView.vue`，添加手动触发按钮：

```vue
<button 
  class="btn btn-success" 
  @click="triggerDailyRelease"
>
  🕐 手动触发每日释放
</button>

<button 
  class="btn btn-primary" 
  @click="triggerDividendSettlement"
>
  💎 手动触发分红结算
</button>
```

```typescript
const triggerDailyRelease = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-release`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
    const result = await response.json()
    alert(`每日释放完成: ${result.message}`)
  } catch (error) {
    alert('触发失败: ' + error.message)
  }
}

const triggerDividendSettlement = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dividend-settlement`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
    const result = await response.json()
    alert(`分红结算完成: ${result.message}`)
  } catch (error) {
    alert('触发失败: ' + error.message)
  }
}
```

---

## 📊 **查看执行日志**

### **在 Supabase Dashboard**

1. 进入 **Edge Functions**
2. 选择对应的函数
3. 点击 **Logs** 标签
4. 查看执行历史和错误信息

### **查看 Cron 执行历史**

```sql
-- 查看所有Cron任务
SELECT * FROM cron.job;

-- 查看执行历史
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

---

## ⚠️ **注意事项**

### **时区问题**
- Supabase Cron 使用 UTC 时区
- 如果需要北京时间00:00执行，需要设置为 UTC 16:00
- 修改 Cron 表达式: `0 16 * * *` (北京时间00:00)

### **并发控制**
- Edge Functions 有并发限制
- 如果用户量大，考虑分批处理

### **错误处理**
- 单个用户失败不影响其他用户
- 所有错误都会记录到日志

### **成本**
- Edge Functions 免费额度: 500,000 次调用/月
- 超出后按量计费
- 每日释放1次/天，分红4次/周，远低于限制

---

## ✅ **验证清单**

部署完成后，检查：

```
☐ Edge Functions 已部署成功
☐ 环境变量已设置
☐ Cron 任务已创建
☐ 手动测试成功
☐ 查看日志无错误
☐ 测试数据正确变化
```

---

## 🎉 **完成！**

定时任务已配置完成：
- ✅ AI学习机每日自动释放
- ✅ 分红每周自动结算
- ✅ 系统全自动运行

**下一步**: 
1. 完整集成测试
2. 准备部署上线

---

## 🆘 **常见问题**

**Q1: Edge Function 执行失败**
```
检查：
1. 环境变量是否正确
2. 数据库函数是否已创建
3. 查看详细错误日志
```

**Q2: Cron 没有自动执行**
```
检查：
1. Cron 任务是否创建成功
2. 时区是否正确
3. 查看 cron.job_run_details
```

**Q3: 部分用户处理失败**
```
正常现象：
- 单个失败不影响其他
- 查看日志找原因
- 可以手动补发
```

---

**准备好测试了吗？** 🚀

