# 🔧 Supabase 快速配置指南

**目标**: 让系统连接到数据库，功能正常运行  
**预计时间**: 5-10分钟

---

## 📍 **当前状态**

```
❌ 没有 .env 文件
❌ 没有 Supabase 配置
❌ 数据库连接失败
❌ 功能无法使用
```

---

## 🎯 **两个选择**

### **选择A: 使用现有的 Supabase 项目** ⭐ 推荐

**如果您已经有 Supabase 项目**

1. 访问: https://supabase.com/dashboard
2. 登录您的账号
3. 选择您的项目
4. 获取配置信息（见下文）

### **选择B: 创建新的 Supabase 项目**

**如果您还没有 Supabase 项目**

1. 访问: https://supabase.com
2. 点击 "Start your project"
3. 注册/登录账号
4. 创建新项目
5. 获取配置信息（见下文）

---

## 📝 **获取 Supabase 配置信息**

### **步骤1: 进入项目设置**

```
1. 登录 Supabase Dashboard
2. 选择您的项目
3. 点击左侧菜单 "Settings" (⚙️)
4. 点击 "API"
```

### **步骤2: 复制配置信息**

您需要复制两个信息：

#### **1. Project URL**
```
位置: API Settings → Project URL
格式: https://xxxxxxxx.supabase.co
示例: https://abcdefgh12345678.supabase.co

这是您的数据库地址
```

#### **2. anon public key**
```
位置: API Settings → Project API keys → anon public
格式: 一串很长的字符串（以 "eyJ" 开头）
示例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

这是您的API密钥（公开的，安全的）
```

---

## ✍️ **配置 .env 文件**

### **步骤1: 创建 .env 文件**

在项目根目录创建一个名为 `.env` 的文件：

```
路径: C:\Users\sss\Desktop\AI智能空投\.env
```

**如何创建:**

**方法1: 使用记事本**
```
1. 打开记事本
2. 输入配置内容（见下文）
3. 点击 "文件" → "另存为"
4. 文件名输入: .env
5. 保存类型选择: 所有文件
6. 保存位置: C:\Users\sss\Desktop\AI智能空投\
```

**方法2: 使用命令行**
```powershell
cd C:\Users\sss\Desktop\AI智能空投
notepad .env
```

### **步骤2: 填写配置内容**

在 `.env` 文件中输入以下内容：

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon-key

# 示例（请替换为您的真实值）:
# VITE_SUPABASE_URL=https://abcdefgh12345678.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoMTIzNDU2NzgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjoxOTQ1NTc2MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ 重要提示:**
- 替换 `你的项目ID` 为您的实际 Supabase 项目 URL
- 替换 `你的anon-key` 为您的实际 anon public key
- 不要有多余的空格
- 不要有引号

---

## 🗄️ **执行数据库迁移**

配置好 `.env` 后，需要创建数据库表结构：

### **步骤1: 打开 Supabase SQL Editor**

```
1. 访问您的 Supabase Dashboard
2. 点击左侧 "SQL Editor"
3. 点击 "New query"
```

### **步骤2: 执行迁移脚本**

**按顺序执行以下脚本：**

#### **1. 主表结构**
```sql
文件: supabase/schema.sql
内容: 完整的数据库表结构
```

#### **2. 二元系统表**
```sql
文件: supabase/migration_create_binary_members.sql
内容: 创建 binary_members 表
```

#### **3. 8代推荐链**
```sql
文件: supabase/migration_extend_8_levels.sql
内容: 扩展 referral_chain 到8层
```

#### **4. 分红系统表**
```sql
文件: supabase/migration_create_dividend_pool.sql
内容: 创建 dividend_pool 和 dividend_records 表
```

#### **5. 安全函数**
```sql
文件: supabase/functions_wallet_atomic.sql
内容: 创建原子操作函数
```

#### **6. 测试数据**
```sql
文件: supabase/update_existing_test_data.sql
内容: 创建测试用户和数据
```

**执行方式:**
```
1. 在 Supabase SQL Editor 中
2. 打开本地文件，复制内容
3. 粘贴到 SQL Editor
4. 点击 "Run" 执行
5. 看到成功消息后，继续下一个脚本
```

---

## 🔄 **重启开发服务器**

配置完成后，必须重启：

### **步骤1: 停止当前服务器**

在 PowerShell 窗口中：
```
按 Ctrl + C 停止服务器
```

### **步骤2: 重新启动**

```powershell
npm run dev
```

### **步骤3: 刷新浏览器**

```
按 F5 刷新页面
或 Ctrl + Shift + R (强制刷新)
```

---

## ✅ **验证配置成功**

### **检查1: Console 无错误**

```
打开浏览器 Console (F12)
应该看到:
- ✅ 没有红色错误
- ✅ 没有 ERR_NAME_NOT_RESOLVED
```

### **检查2: 数据正常显示**

```
访问管理后台:
http://localhost:3000/admin/system

应该看到:
- ✅ 统计数据加载成功
- ✅ "手动触发释放"按钮可点击
- ✅ 分红系统数据显示
```

### **检查3: 功能可用**

```
1. 点击"手动触发每日释放"
2. 弹出确认框
3. 输入 RELEASE
4. 执行成功
```

---

## 🚨 **常见问题**

### **问题1: 找不到 Supabase 项目**

**解决:**
```
创建新项目:
1. 访问 https://supabase.com
2. 点击 "New project"
3. 填写项目名称
4. 选择区域（推荐：Southeast Asia (Singapore)）
5. 设置数据库密码（请记住！）
6. 点击 "Create new project"
7. 等待3-5分钟项目创建完成
```

### **问题2: .env 文件不生效**

**原因:** 开发服务器没有重启

**解决:**
```
1. 停止服务器 (Ctrl + C)
2. 重新启动 (npm run dev)
3. 强制刷新浏览器 (Ctrl + Shift + R)
```

### **问题3: 数据库迁移失败**

**可能原因:**
- 脚本执行顺序不对
- 某些表已存在

**解决:**
```
1. 在 Supabase Dashboard 中
2. 点击 "Database" → "Tables"
3. 检查哪些表已创建
4. 跳过已创建的表的脚本
5. 只执行缺失的表的脚本
```

### **问题4: 权限错误**

**错误信息:** "permission denied" 或 "access denied"

**解决:**
```
在 Supabase SQL Editor 中执行:

-- 临时禁用 RLS (仅用于测试)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE mining_machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE binary_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE dividend_pool DISABLE ROW LEVEL SECURITY;
ALTER TABLE dividend_records DISABLE ROW LEVEL SECURITY;

注意: 生产环境请启用 RLS！
```

---

## 📊 **配置检查清单**

```
配置步骤检查:
□ 已有 Supabase 项目（或创建新项目）
□ 已获取 Project URL
□ 已获取 anon public key
□ 已创建 .env 文件
□ 已填写正确的配置信息
□ 已执行数据库迁移脚本
□ 已重启开发服务器
□ 已刷新浏览器
□ Console 无红色错误
□ 功能可以正常使用
```

---

## 🎉 **配置完成后**

您将能够：
- ✅ 用户注册/登录
- ✅ 购买AI学习机
- ✅ 手动触发每日释放
- ✅ 查看收益记录
- ✅ 二元对碰系统
- ✅ 分红系统
- ✅ 所有核心功能

---

## 💡 **快速帮助**

**如果您需要帮助:**

1. 告诉我您在哪一步卡住了
2. 截图错误信息
3. 告诉我您看到了什么

**我会立即帮您解决！** 😊

