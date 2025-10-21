# 🚀 Supabase快速配置指南

**目标**: 在10分钟内完成Supabase配置，让所有测试在真实数据库中运行

---

## 📋 **准备工作**

### 需要准备的东西
- [ ] 一个邮箱账号
- [ ] 稳定的网络连接
- [ ] 浏览器

---

## 🎯 **配置步骤**

### Step 1: 创建Supabase账号（2分钟）

1. **访问Supabase官网**
   ```
   https://app.supabase.com
   ```

2. **注册账号**
   - 点击右上角 "Sign Up"
   - 使用GitHub或邮箱注册
   - 验证邮箱

3. **创建组织**
   - 输入组织名称（如：AI-Airdrop）
   - 选择免费计划 (Free Plan)
   - 点击 "Create Organization"

---

### Step 2: 创建项目（3分钟）

1. **新建项目**
   - 点击 "New Project"
   - 输入项目信息：
     ```
     名称: ai-airdrop-hunter
     数据库密码: [设置一个强密码，记住它！]
     区域: 选择最近的区域（如 Singapore 或 Tokyo）
     ```

2. **等待项目创建**
   - 需要等待2-3分钟
   - 状态变为 "Active" 即可

---

### Step 3: 获取API密钥（1分钟）

1. **进入项目设置**
   - 点击左侧菜单 "Settings" (齿轮图标)
   - 选择 "API"

2. **复制密钥**
   - 找到 "Project URL" - 复制保存
   - 找到 "anon public" key - 复制保存
   
   **示例**:
   ```
   Project URL: https://abcdefghijk.supabase.co
   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

### Step 4: 配置环境变量（2分钟）

1. **创建.env文件**
   ```bash
   # 在项目根目录运行
   # Windows PowerShell:
   New-Item .env
   
   # Mac/Linux:
   touch .env
   ```

2. **编辑.env文件**
   
   打开 `.env` 文件，粘贴以下内容（替换为你的实际值）：
   
   ```env
   # Supabase配置
   VITE_SUPABASE_URL=https://你的项目ID.supabase.co
   VITE_SUPABASE_ANON_KEY=你的anon密钥
   ```

   **完整示例**:
   ```env
   # 替换成你自己的值！
   VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODI2MzQ3NjIsImV4cCI6MTk5ODIxMDc2Mn0.example_key_here
   ```

3. **验证配置**
   ```bash
   # 检查.env文件是否存在
   ls .env
   
   # 查看内容（确保已填写）
   cat .env
   ```

---

### Step 5: 部署数据库Schema（2分钟）

1. **进入SQL编辑器**
   - 在Supabase项目中
   - 点击左侧 "SQL Editor"
   - 点击 "New Query"

2. **复制Schema**
   
   打开项目中的 `supabase/schema.sql` 文件，全选复制

3. **执行SQL**
   - 粘贴到SQL编辑器
   - 点击右下角 "Run" 按钮
   - 等待执行完成（~30秒）

4. **验证表创建**
   - 点击左侧 "Table Editor"
   - 应该能看到以下表：
     ```
     ✓ users
     ✓ network_nodes
     ✓ mining_machines
     ✓ transactions
     ✓ referral_rewards
     ✓ admin_operations
     ```

---

## ✅ **验证配置**

### 方法1: 运行测试（推荐）

```bash
# 运行Supabase集成测试
npm test -- supabase.integration.test.ts --run
```

**预期结果**:
```
✓ 应该能连接到Supabase
✓ 应该能创建用户
✓ 应该能查询数据
```

---

### 方法2: 启动开发服务器

```bash
# 重启开发服务器
npm run dev
```

**验证点**:
1. 控制台不应该显示 "⚠️ 开发模式"
2. 访问 http://localhost:3000
3. 尝试注册新用户
4. 检查Supabase Table Editor中是否有新用户

---

## 🔧 **常见问题**

### 问题1: "无法连接到Supabase"

**解决方案**:
```bash
# 1. 检查.env文件是否存在
ls .env

# 2. 检查.env内容是否正确
cat .env

# 3. 重启开发服务器
# Ctrl+C 停止
npm run dev
```

---

### 问题2: "Invalid API key"

**原因**: API密钥可能复制不完整

**解决方案**:
1. 重新访问 Supabase Dashboard
2. Settings → API
3. 完整复制 anon key（很长，确保复制完整）
4. 重新粘贴到 .env 文件

---

### 问题3: "找不到表"

**原因**: Schema未正确部署

**解决方案**:
1. 访问 Supabase → SQL Editor
2. 重新复制 `supabase/schema.sql`
3. 执行SQL
4. 检查是否有错误消息

---

### 问题4: "RLS (Row Level Security) 错误"

**原因**: 表权限未配置

**解决方案**:
```sql
-- 在SQL编辑器执行
-- 临时禁用RLS（仅用于开发）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE mining_machines DISABLE ROW LEVEL SECURITY;
```

---

## 🎯 **配置完成检查清单**

完成后，请确认以下所有项目：

- [ ] ✅ Supabase项目已创建并处于Active状态
- [ ] ✅ `.env` 文件已创建并配置正确
- [ ] ✅ 数据库Schema已成功部署
- [ ] ✅ 能在Table Editor中看到所有表
- [ ] ✅ 开发服务器启动无警告
- [ ] ✅ 集成测试通过

---

## 📊 **配置后的变化**

### Before（配置前）

```
⚠️ 开发模式：使用模拟数据，无需真实 Supabase 配置
✓ 123/125 测试通过
× 1个测试失败（并发控制）
↓ 1个测试跳过（Supabase集成）
```

### After（配置后）

```
✓ 连接到真实Supabase数据库
✓ 125/125 测试通过 (100%)
✓ 并发控制测试通过
✓ Supabase集成测试通过
```

---

## 🚀 **下一步**

配置完成后，你可以：

### 1. 运行完整测试
```bash
npm test -- --run
```

### 2. 创建测试数据
```bash
# 运行数据初始化脚本
npm run seed
```

### 3. 体验完整功能
```bash
# 启动开发服务器
npm run dev

# 访问
http://localhost:3000
```

### 4. 查看数据库
- 访问 Supabase Dashboard
- Table Editor 查看实时数据
- 尝试注册、登录、购买矿机等操作

---

## 📚 **相关文档**

- [Supabase官方文档](https://supabase.com/docs)
- [项目Schema说明](../supabase/schema.sql)
- [API文档](./API_DOCUMENTATION.md)
- [测试报告](./FINAL_TEST_REPORT.md)

---

## 💡 **小贴士**

### 免费计划限制

Supabase免费计划提供：
- ✅ 500MB 数据库存储
- ✅ 1GB 文件存储
- ✅ 50,000 每月活跃用户
- ✅ 2GB 带宽
- ✅ 50,000 每月Auth用户

**对于开发和测试完全够用！** 👍

### 保护你的密钥

⚠️ **重要安全提示**:
1. ❌ 不要将 `.env` 文件提交到Git
2. ❌ 不要在公开场合分享密钥
3. ✅ 使用 `.gitignore` 排除 `.env`
4. ✅ 团队成员各自配置自己的 `.env`

---

## 🎉 **恭喜！**

如果你完成了所有步骤，你现在已经有：

- ✅ 一个完整的Supabase后端
- ✅ 真实的PostgreSQL数据库
- ✅ 实时的数据同步
- ✅ 完整的认证系统
- ✅ 可用于生产的基础设施

**准备好开发了！** 🚀

---

**配置时间**: 约10分钟  
**难度**: ⭐⭐ (简单)  
**需要**: 浏览器 + 邮箱

**有问题？** 查看[常见问题](#-常见问题)部分或联系技术支持。



































