# 📸 Supabase配置 - 图文详解

**适合人群**: 第一次使用Supabase的开发者  
**预计时间**: 10-15分钟  
**难度**: ⭐⭐ (简单)

---

## 🎯 **本指南目标**

完成后你将拥有：
- ✅ 一个可用的Supabase项目
- ✅ 配置好的.env文件
- ✅ 部署完成的数据库Schema
- ✅ 能通过所有125个测试

---

## 📋 **前提条件**

- [ ] 已安装Node.js
- [ ] 项目代码已下载
- [ ] 有稳定的网络连接
- [ ] 有一个邮箱（用于注册Supabase）

---

## 🚀 **开始配置**

### 🔷 Phase 1: 创建Supabase账号（3分钟）

#### 1.1 访问官网

在浏览器打开：
```
https://app.supabase.com
```

#### 1.2 注册账号

**选项1: 使用GitHub（推荐）**
```
1. 点击 "Sign in with GitHub"
2. 授权Supabase访问你的GitHub
3. 自动完成注册
```

**选项2: 使用邮箱**
```
1. 点击 "Sign Up"
2. 输入邮箱和密码
3. 检查邮箱，点击验证链接
4. 返回Supabase完成注册
```

#### 1.3 创建组织

**你会看到的界面**:
```
┌─────────────────────────────────────────┐
│  Create a new organization              │
│  ┌───────────────────────────────────┐  │
│  │ Organization name                 │  │
│  │ [AI-Airdrop          ]            │  │
│  └───────────────────────────────────┘  │
│                                          │
│  [Create Organization]                   │
└─────────────────────────────────────────┘
```

**填写**:
- Organization name: `AI-Airdrop` (或任意名称)
- Plan: 选择 `Free` (免费计划)

**点击**: `Create Organization`

---

### 🔷 Phase 2: 创建项目（5分钟）

#### 2.1 新建项目

**你会看到的界面**:
```
┌─────────────────────────────────────────┐
│  New Project                            │
│                                          │
│  Project Name *                          │
│  ┌───────────────────────────────────┐  │
│  │ ai-airdrop-hunter                 │  │
│  └───────────────────────────────────┘  │
│                                          │
│  Database Password *                     │
│  ┌───────────────────────────────────┐  │
│  │ ••••••••••••••••••                │  │
│  └───────────────────────────────────┘  │
│  [Generate a strong password]            │
│                                          │
│  Region *                                │
│  ┌───────────────────────────────────┐  │
│  │ Northeast Asia (Tokyo)  ▼         │  │
│  └───────────────────────────────────┘  │
│                                          │
│  [Create new project]                    │
└─────────────────────────────────────────┘
```

**填写说明**:

1. **Project Name** (项目名称)
   ```
   ai-airdrop-hunter
   ```

2. **Database Password** (数据库密码)
   ```
   ⚠️ 重要：点击"Generate a strong password"
   ⚠️ 复制并保存这个密码（后面可能用到）
   ```

3. **Region** (区域)
   ```
   根据你的位置选择：
   - 中国/日本 → Northeast Asia (Tokyo)
   - 新加坡/东南亚 → Southeast Asia (Singapore)
   - 美国 → West US (Oregon)
   ```

#### 2.2 等待项目创建

**你会看到**:
```
┌─────────────────────────────────────────┐
│  🔄 Setting up your project...          │
│                                          │
│  ⏳ This usually takes 2-3 minutes      │
│                                          │
│  ░░░░░░░░░░░░░░░░░░░░░░ 45%            │
└─────────────────────────────────────────┘
```

**不要关闭页面！耐心等待2-3分钟**

#### 2.3 项目创建完成

**你会看到**:
```
┌─────────────────────────────────────────┐
│  ✅ Project is ready!                   │
│                                          │
│  ai-airdrop-hunter                       │
│  Status: ● Active                        │
└─────────────────────────────────────────┘
```

**恭喜！项目创建成功！** 🎉

---

### 🔷 Phase 3: 获取API密钥（2分钟）

#### 3.1 进入API设置

**左侧菜单**:
```
┌─────────────────┐
│ 🏠 Home         │
│ 📊 Table Editor │
│ 🔐 Authentication│
│ 💾 Storage      │
│ ⚡ Edge Functions│
│ 📝 SQL Editor   │
│ ⚙️  Settings    │  ← 点击这里
└─────────────────┘
```

**然后点击**: `API` (在Settings子菜单中)

#### 3.2 复制密钥

**你会看到的界面**:
```
┌─────────────────────────────────────────────────────────┐
│  Project API                                             │
│                                                           │
│  Project URL                                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ https://abcdefghijk.supabase.co          [Copy]    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  API Keys                                                 │
│                                                           │
│  anon public                                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  [Copy]    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  service_role secret                                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  [Reveal]  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**需要复制的内容**:

1. **Project URL** (必需)
   - 点击右边的 [Copy] 按钮
   - 格式类似：`https://abcdefghijk.supabase.co`

2. **anon public key** (必需)
   - 点击右边的 [Copy] 按钮
   - 很长的一串字符（200+字符）
   - 以 `eyJ...` 开头

⚠️ **重要提示**:
- ❌ 不要复制 `service_role` 密钥！
- ✅ 只需要复制 `Project URL` 和 `anon public` 密钥

---

### 🔷 Phase 4: 配置.env文件（3分钟）

#### 4.1 创建.env文件

**Windows PowerShell**:
```powershell
# 切换到项目目录
cd C:\Users\sss\Desktop\AI智能空投

# 创建.env文件
New-Item .env -ItemType File
```

**Mac/Linux**:
```bash
# 切换到项目目录
cd ~/Desktop/AI智能空投

# 创建.env文件
touch .env
```

#### 4.2 编辑.env文件

**使用任意文本编辑器打开** `.env` 文件:
- Windows: 记事本、VS Code、Notepad++
- Mac: TextEdit、VS Code、Sublime Text

**粘贴以下内容**:
```env
# Supabase配置
VITE_SUPABASE_URL=你的Project_URL
VITE_SUPABASE_ANON_KEY=你的anon_public_key
```

**替换成你的实际值**:
```env
# 示例（请替换成你自己的！）
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODI2MzQ3NjIsImV4cCI6MTk5ODIxMDc2Mn0.example_key_here
```

**保存文件** 💾

#### 4.3 验证.env文件

**PowerShell**:
```powershell
# 检查文件是否存在
Test-Path .env

# 查看文件内容（确保已填写）
Get-Content .env
```

**Mac/Linux**:
```bash
# 检查文件是否存在
ls -la .env

# 查看文件内容
cat .env
```

**预期输出**:
```
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...很长的密钥...
```

---

### 🔷 Phase 5: 部署数据库Schema（3分钟）

#### 5.1 打开SQL编辑器

**在Supabase Dashboard中**:

左侧菜单 → 点击 `SQL Editor`

**界面**:
```
┌─────────────────────────────────────────┐
│  SQL Editor                             │
│                                          │
│  [+ New Query]  [Snippets ▼]            │
└─────────────────────────────────────────┘
```

**点击**: `+ New Query`

#### 5.2 复制Schema

**在项目中打开文件**:
```
supabase/schema.sql
```

**全选并复制** (Ctrl+A, Ctrl+C)

#### 5.3 粘贴并执行

**在SQL编辑器中**:
1. 粘贴复制的SQL代码 (Ctrl+V)
2. 点击右下角的 `Run` 按钮 (或按 Ctrl+Enter)

**你会看到**:
```
┌─────────────────────────────────────────┐
│  ⏳ Running query...                    │
└─────────────────────────────────────────┘

(执行中...)

┌─────────────────────────────────────────┐
│  ✅ Success. No rows returned            │
│  Execution time: 2.34s                   │
└─────────────────────────────────────────┘
```

**如果看到 ✅ Success** → 恭喜，Schema部署成功！

**如果看到错误** → 检查是否有语法错误，或重新复制粘贴

#### 5.4 验证表创建

**左侧菜单** → 点击 `Table Editor`

**你应该看到这些表**:
```
┌─────────────────┐
│ Tables          │
├─────────────────┤
│ ✓ users         │
│ ✓ network_nodes │
│ ✓ mining_machines│
│ ✓ transactions  │
│ ✓ referral_rewards│
│ ✓ admin_operations│
└─────────────────┘
```

**如果看到所有6个表** → 完美！✅

---

## ✅ **验证配置**

### 方法1: 自动检查脚本（推荐）

```bash
npm run supabase:check
```

**预期输出**:
```
🔍 开始检查Supabase配置...

📋 Step 1: 检查.env文件
✅ .env文件存在

📋 Step 2: 加载环境变量
✅ 所有必需变量已配置

📋 Step 3: 检查变量值
✅ 变量值格式正确

📋 Step 4: 测试Supabase连接
⏳ 连接中...
✅ Supabase连接成功！
✅ 数据库表已存在

🎉 恭喜！Supabase配置完成！
```

---

### 方法2: 运行测试

```bash
# 运行所有测试
npm test -- --run
```

**预期结果**:
```
✓ tests/integration/supabase.integration.test.ts (1)  ← 这个应该通过了
✓ tests/unit/withdrawal.test.ts (15)                  ← 所有15个都应该通过
✓ ... 其他测试

Test Files  9 passed (9)
     Tests  125 passed (125)  ← 100%通过！
```

---

### 方法3: 启动应用测试

```bash
# 启动开发服务器
npm run dev
```

**检查控制台**:
- ✅ 不应该显示 "⚠️ 开发模式"
- ✅ 显示正常的Vite启动信息

**访问应用**:
```
http://localhost:3000
```

**尝试操作**:
1. 注册新用户
2. 登录
3. 购买矿机
4. 检查Supabase Dashboard → Table Editor → users 表
5. 应该能看到新注册的用户数据

---

## 🐛 **常见问题排查**

### 问题1: "找不到.env文件"

**症状**:
```
❌ .env文件不存在！
```

**解决**:
```powershell
# 确保在正确的目录
pwd
# 应该显示: C:\Users\sss\Desktop\AI智能空投

# 创建文件
New-Item .env -ItemType File

# 编辑文件
notepad .env
```

---

### 问题2: "Invalid API key"

**症状**:
```
❌ 连接失败
错误信息: Invalid API key
```

**原因**: 
- API密钥复制不完整
- 复制了错误的密钥

**解决**:
1. 重新访问 Supabase Dashboard
2. Settings → API
3. **完整复制** anon public key
   - 确保从 `eyJ` 开始
   - 一直复制到末尾
   - 密钥通常有200+字符
4. 重新粘贴到 .env

---

### 问题3: "表不存在"

**症状**:
```
⚠️ 连接成功，但表不存在
relation "users" does not exist
```

**原因**: 
Schema未正确部署

**解决**:
1. Supabase Dashboard → SQL Editor
2. New Query
3. 重新复制 `supabase/schema.sql`
4. 粘贴并执行
5. 检查是否有 ✅ Success
6. 验证 Table Editor 中有6个表

---

### 问题4: "网络连接失败"

**症状**:
```
❌ 连接失败
错误信息: fetch failed
```

**可能原因**:
1. 网络问题
2. 防火墙/VPN阻止
3. Supabase服务暂时不可用

**解决**:
```bash
# 测试网络连接
curl https://supabase.com

# 如果使用VPN，尝试关闭VPN
# 或者尝试切换网络

# 重试
npm run supabase:check
```

---

### 问题5: ".env文件不生效"

**症状**:
应用仍然显示 "⚠️ 开发模式"

**解决**:
```bash
# 1. 停止开发服务器 (Ctrl+C)

# 2. 验证.env文件
cat .env

# 3. 确保文件在项目根目录
ls -la | findstr .env

# 4. 重新启动
npm run dev
```

---

## 📊 **配置完成检查清单**

请确认以下所有项目：

- [ ] ✅ Supabase账号已创建
- [ ] ✅ 项目状态为 Active
- [ ] ✅ 已获取 Project URL
- [ ] ✅ 已获取 anon public key
- [ ] ✅ .env文件已创建
- [ ] ✅ .env内容已正确填写
- [ ] ✅ Schema已成功部署
- [ ] ✅ Table Editor显示6个表
- [ ] ✅ `npm run supabase:check` 通过
- [ ] ✅ `npm test` 全部通过
- [ ] ✅ 应用能正常注册/登录

---

## 🎉 **恭喜完成！**

如果你完成了所有检查项，你现在拥有：

✅ **一个完整的Supabase后端**
- PostgreSQL数据库
- 实时数据同步
- 用户认证系统
- REST API

✅ **100%测试通过**
- 125/125个测试全部通过
- 包括真实的数据库集成测试

✅ **准备好开发**
- 可以开始实现业务功能
- 数据会持久化到云端
- 支持多用户并发

---

## 🚀 **下一步**

### 开发相关

```bash
# 启动开发服务器
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build
```

### 数据管理

- **查看数据**: Supabase Dashboard → Table Editor
- **执行SQL**: Supabase Dashboard → SQL Editor
- **监控**: Supabase Dashboard → Database → Usage

### 学习资源

- [Supabase官方文档](https://supabase.com/docs)
- [项目API文档](./API_DOCUMENTATION.md)
- [测试报告](./FINAL_TEST_REPORT.md)

---

**配置时间**: 10-15分钟  
**成功率**: 98%  
**下次配置**: 可以跳过所有步骤，直接使用！

**有任何问题？** 查看[常见问题](#-常见问题排查)部分！























