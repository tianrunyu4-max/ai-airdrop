# ⚡ **Supabase快速配置（5分钟）**

## 🚀 **第1步：创建Supabase项目**

1. **访问：** https://supabase.com/
2. **注册/登录：** 用GitHub账号最方便
3. **点击：** "New project"
4. **填写信息：**
   ```
   Project name: ai-airdrop
   Database Password: [生成一个强密码并保存]
   Region: Northeast Asia (Tokyo) - 日本东京（最近）
   Pricing Plan: Free（免费）
   ```
5. **点击：** "Create new project"
6. **等待2-3分钟**（初始化数据库）

---

## 🔑 **第2步：获取API密钥**

项目创建完成后：

1. **点击左侧：** "Settings" (设置图标)
2. **点击：** "API"
3. **复制两个值：**
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJxxx...（很长的一串）
   ```

---

## 📊 **第3步：导入数据库结构**

1. **点击左侧：** "SQL Editor"
2. **点击：** "New query"
3. **复制粘贴你的数据库脚本：**
   - 打开：`C:\Users\sss\Desktop\AI智能空投\supabase\schema.sql`
   - 复制全部内容
   - 粘贴到Supabase SQL编辑器
4. **点击：** "Run"（或按F5）
5. **等待执行完成**

---

## 🔐 **第4步：配置认证**

1. **点击左侧：** "Authentication" → "URL Configuration"
2. **在 "Site URL" 填入：**
   ```
   https://ai-airdrop-test.netlify.app
   （替换成你的Netlify网址）
   ```
3. **在 "Redirect URLs" 添加：**
   ```
   https://ai-airdrop-test.netlify.app/*
   https://ai-airdrop-test.netlify.app/auth/callback
   ```
4. **保存**

---

## 🌐 **第5步：配置到Netlify**

### **方法1：通过CLI（推荐）**

```powershell
# 设置Supabase URL
netlify env:set VITE_SUPABASE_URL "https://xxxxx.supabase.co"

# 设置Supabase密钥
netlify env:set VITE_SUPABASE_ANON_KEY "eyJxxx...你的密钥"

# 重新构建并部署
npm run build
netlify deploy --prod
```

### **方法2：通过网站后台**

1. 访问：https://app.netlify.com/
2. 选择你的站点
3. "Site settings" → "Environment variables"
4. 点击 "Add a variable"
5. 添加两个变量：
   ```
   Key: VITE_SUPABASE_URL
   Value: https://xxxxx.supabase.co
   
   Key: VITE_SUPABASE_ANON_KEY
   Value: eyJxxx...你的密钥
   ```
6. 保存后，在 "Deploys" 页面点击 "Trigger deploy"

---

## ✅ **第6步：测试**

打开你的Netlify网址：
```
https://ai-airdrop-test.netlify.app
```

**测试注册：**
1. 点击"注册"
2. 输入用户名和密码
3. 注册成功 → 数据库已连接！ 🎉

---

## 🔍 **验证数据**

**在Supabase后台查看数据：**

1. 点击左侧："Table Editor"
2. 选择表：`users`
3. 应该能看到刚才注册的用户

---

## 🎯 **完成！**

**你的系统现在完全在线了：**
- ✅ 前端：Netlify托管
- ✅ 后端：Supabase数据库
- ✅ 全球CDN加速
- ✅ 自动HTTPS
- ✅ 完全免费（在免费额度内）

**分享给团队测试吧！** 🚀

---

## 📱 **Supabase免费额度：**

```
✅ 无限API请求
✅ 500MB数据库存储
✅ 5GB文件存储
✅ 50,000月活跃用户
✅ 2GB数据传输

（对于测试完全够用！）
```

---

## 🔧 **后续维护：**

### **查看数据库使用情况：**
- Supabase后台 → "Settings" → "Billing & Usage"

### **备份数据库：**
```sql
-- 在Supabase SQL编辑器执行
pg_dump dbname > backup.sql
```

### **更新数据库结构：**
1. 修改本地的SQL文件
2. 在Supabase SQL编辑器执行
3. 或使用Migration文件逐步更新

---

**就是这么简单！** 🎉
























