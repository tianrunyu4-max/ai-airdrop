# 🚀 **Supabase完整配置指南（15分钟）**

---

## 📋 **第1步：创建Supabase项目（5分钟）**

### **1.1 访问Supabase**

打开浏览器：https://supabase.com/

### **1.2 注册/登录**

**推荐：用GitHub账号登录（最快）**

- 点击 "Start your project"
- 选择 "Continue with GitHub"
- 授权Supabase访问

**或者：用邮箱注册**

- 输入邮箱和密码
- 验证邮箱
- 登录

### **1.3 创建新项目**

登录后，点击 "New project" 按钮

**填写项目信息：**

```
Organization: 选择你的组织（或创建新的）
Project name: ai-airdrop（或你想要的名字）
Database Password: [自动生成一个强密码]
              👆 重要：请保存这个密码！
Region: Northeast Asia (Tokyo) - 日本东京（离中国最近）
Pricing Plan: Free（免费版）
```

**点击 "Create new project"**

⏰ **等待2-3分钟**（系统正在初始化数据库）

---

## 🔑 **第2步：获取API密钥（1分钟）**

### **2.1 找到项目设置**

项目创建完成后：

1. 点击左侧菜单的 **⚙️ Settings** 图标
2. 点击 **API** 选项

### **2.2 复制两个关键信息**

在API页面，你会看到：

```
┌─────────────────────────────────────────────┐
│  Configuration                              │
├─────────────────────────────────────────────┤
│  Project URL                                │
│  https://xxxxxxxxxxxxx.supabase.co          │
│  [Copy] 按钮                                │
├─────────────────────────────────────────────┤
│  Project API keys                           │
│                                             │
│  anon public                                │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...   │
│  [Copy] 按钮                                │
└─────────────────────────────────────────────┘
```

**请复制这两个值：**

1. **Project URL** - 类似：`https://xxxxx.supabase.co`
2. **anon public key** - 很长的一串，以 `eyJ` 开头

**💾 保存到记事本备用！**

---

## 📊 **第3步：导入数据库结构（5分钟）**

### **3.1 打开SQL编辑器**

1. 点击左侧菜单的 **🔨 SQL Editor** 图标
2. 点击 **"+ New query"** 按钮

### **3.2 导入schema.sql**

**复制schema.sql内容：**

1. 打开你电脑上的文件：`C:\Users\sss\Desktop\AI智能空投\supabase\schema.sql`
2. 复制全部内容（Ctrl+A，Ctrl+C）
3. 粘贴到Supabase的SQL编辑器中

**执行SQL：**

- 点击 **"Run"** 按钮（或按 F5）
- 等待执行完成（约10-20秒）
- 看到 "Success. No rows returned" 表示成功！

### **3.3 导入其他迁移文件（可选，建议执行）**

**按顺序执行以下SQL文件：**

1. `supabase/migration_create_binary_members.sql`
2. `supabase/migration_extend_8_levels.sql`
3. `supabase/migration_create_dividend_pool.sql`

**每个文件：**
- 在SQL编辑器中点击 "New query"
- 复制文件内容
- 粘贴并执行（Run）

---

## 🔐 **第4步：配置认证（2分钟）**

### **4.1 打开认证设置**

1. 点击左侧菜单的 **🔐 Authentication** 图标
2. 点击 **URL Configuration**

### **4.2 配置网站URL**

**在 "Site URL" 填入：**

```
https://eth10.netlify.app
```

**在 "Redirect URLs" 添加：**

```
https://eth10.netlify.app/*
https://eth10.netlify.app/auth/callback
http://localhost:3002/*
http://localhost:3003/*
```

（每行一个URL，点击 "Add URL" 添加）

**点击 "Save" 保存**

---

## 🌐 **第5步：配置到Netlify（3分钟）**

### **5.1 访问Netlify环境变量设置**

打开：https://app.netlify.com/sites/eth10/settings/env

（或者：登录Netlify → 选择eth10站点 → Site settings → Environment variables）

### **5.2 添加环境变量**

**点击 "Add a variable" 按钮**

**添加第1个变量：**

```
Key: VITE_SUPABASE_URL
Value: [粘贴你的Supabase URL]
       例如：https://xxxxx.supabase.co
```

**点击 "Create variable"**

**再次点击 "Add a variable"，添加第2个：**

```
Key: VITE_SUPABASE_ANON_KEY
Value: [粘贴你的Supabase anon key]
       例如：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**点击 "Create variable"**

---

## 🔄 **第6步：重新部署（2分钟）**

### **6.1 在PowerShell中执行**

回到你的PowerShell窗口，执行：

```powershell
# 重新构建
npm run build

# 重新部署
netlify deploy --prod --dir=dist
```

### **6.2 等待部署完成**

看到以下信息表示成功：

```
✔ Deploy is live!

🚀 Deploy complete
Production deploy is live: https://eth10.netlify.app
```

---

## ✅ **第7步：测试验证（2分钟）**

### **7.1 打开网站**

访问：https://eth10.netlify.app

### **7.2 测试注册**

1. 点击 "注册"
2. 输入用户名：`test001`
3. 输入密码：`123456`
4. 点击 "注册"

**如果注册成功 → ✅ 数据库连接成功！**

### **7.3 验证数据**

**回到Supabase后台：**

1. 点击左侧 **📊 Table Editor**
2. 选择 `users` 表
3. 应该能看到刚才注册的用户！

---

## 🎉 **配置完成！**

### **✅ 现在你的系统完全可用：**

- ✅ 用户注册登录
- ✅ 数据库存储
- ✅ 群聊实时消息
- ✅ Binary对碰计算
- ✅ AI学习机数据
- ✅ 积分和余额管理
- ✅ 所有后端功能

---

## 📱 **分享给团队测试**

**现在可以放心分享了：**

```
🚀 AI智能空投系统正式上线！

测试网址：https://eth10.netlify.app

【功能齐全】
✅ 注册登录
✅ 群聊功能
✅ AI学习机
✅ Binary对碰系统
✅ 积分管理
✅ 所有功能已启用

快来测试吧！
```

---

## 🔧 **常见问题：**

### **Q1: 注册时显示"网络错误"？**

**检查：**
1. Netlify环境变量是否正确配置
2. Supabase URL是否包含 `https://`
3. 是否已重新部署

**解决：**
```powershell
netlify deploy --prod --dir=dist
```

---

### **Q2: 数据无法保存？**

**检查：**
1. Supabase是否已执行schema.sql
2. 表结构是否正确创建

**验证：**
- 在Supabase Table Editor查看是否有所有表

---

### **Q3: 群聊消息不实时？**

**检查：**
1. Supabase Realtime是否启用
2. 在Supabase Database → Replication → 启用 `messages` 表的Realtime

---

## 📊 **Supabase免费额度：**

```
✅ 500MB 数据库存储
✅ 5GB 文件存储
✅ 2GB 数据传输/月
✅ 50,000 月活跃用户
✅ 无限API请求

（测试和小规模运营完全够用！）
```

---

## 🎯 **下一步：**

1. ✅ **创建测试用户** - 注册几个账号测试
2. ✅ **测试Binary系统** - 成为AI代理，邀请下级
3. ✅ **测试学习机** - 激活学习机，查看释放
4. ✅ **邀请团队** - 分享网址给20人测试
5. ✅ **收集反馈** - 记录问题和改进建议

---

## 🚀 **完成！系统已全面启用！**

**如有任何问题，随时查看：**
- Supabase文档：https://supabase.com/docs
- Netlify文档：https://docs.netlify.com/

**祝测试顺利！** 🎉






