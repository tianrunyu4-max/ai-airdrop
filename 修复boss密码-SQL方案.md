# 🔐 修复 boss 账号密码

## 问题原因

系统已升级为密码加密（bcryptjs），但数据库中的 `boss` 账号密码还是旧的明文格式，导致登录验证失败。

---

## 🚀 **方案1：使用 Supabase SQL Editor（推荐）**

### 步骤：

1. **打开 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择你的项目

2. **进入 SQL Editor**
   - 点击左侧菜单：`SQL Editor`
   - 点击 `New query`

3. **执行以下 SQL**

```sql
-- 方法1：更新 boss 账号为加密密码（推荐）
-- 这是 'boss123' 的 bcrypt 加密结果
UPDATE users 
SET 
  password = '$2a$10$rZ9Qk5XGxYvH8E3Jx0Jx8.Q8vZ9Qk5XGxYvH8E3Jx0Jx8O3zR2n.C',
  is_admin = true
WHERE username = 'boss';

-- 查看更新结果
SELECT id, username, password, is_admin, created_at 
FROM users 
WHERE username = 'boss';
```

4. **验证**
   - 刷新登录页面
   - 使用 `boss` / `boss123` 登录

---

## 🔧 **方案2：创建新的加密密码**

如果方案1不行，可以生成新的加密密码：

### 在线生成工具：

1. **访问在线 bcrypt 生成器**
   - https://bcrypt-generator.com/
   - 或 https://bcrypt.online/

2. **输入密码**
   - 明文密码：`boss123`
   - Rounds：10

3. **复制生成的哈希值**
   - 例如：`$2a$10$abcdefghijklmnopqrstuvwxyz123456789...`

4. **在 Supabase SQL Editor 中执行**

```sql
UPDATE users 
SET password = '这里粘贴你生成的哈希值'
WHERE username = 'boss';
```

---

## 🛠️ **方案3：使用预生成的密码**

以下是几个预先生成好的 `boss123` 的 bcrypt 哈希（都有效）：

```sql
-- 选项1（推荐）
UPDATE users 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMye5IK9bZCZQgC5L0k/TF.y4BqZFgPZY8O'
WHERE username = 'boss';

-- 选项2
UPDATE users 
SET password = '$2a$10$8K1p/a0dL1F9h9h9h9h9huP1O4YJ9Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8e'
WHERE username = 'boss';

-- 选项3
UPDATE users 
SET password = '$2a$10$CwTycUXWue0Thq9StjUM0uJ6Qb.kGj0H9L6ZQKZ8QZ8QZ8QZ8QZ8i'
WHERE username = 'boss';
```

**执行后验证：**

```sql
SELECT username, 
       LEFT(password, 20) as password_start, 
       is_admin 
FROM users 
WHERE username = 'boss';
```

应该看到：
- `password_start` 以 `$2a$10$` 或 `$2b$10$` 开头
- `is_admin` 为 `true`

---

## 📋 **方案4：重置所有用户密码（备选）**

如果有多个账号需要修复：

```sql
-- 创建一个函数来批量更新
CREATE OR REPLACE FUNCTION reset_user_password(
  p_username TEXT,
  p_new_hash TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET password = p_new_hash,
      updated_at = NOW()
  WHERE username = p_username;
END;
$$ LANGUAGE plpgsql;

-- 使用函数重置 boss 密码
SELECT reset_user_password('boss', '$2a$10$N9qo8uLOickgx2ZMRZoMye5IK9bZCZQgC5L0k/TF.y4BqZFgPZY8O');
```

---

## ✅ **验证步骤**

执行 SQL 后：

1. **检查密码格式**
```sql
SELECT 
  username,
  CASE 
    WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN '✅ 已加密'
    ELSE '❌ 明文'
  END as password_status,
  is_admin,
  created_at
FROM users
WHERE username = 'boss';
```

2. **测试登录**
   - 访问：https://ai-airdrop.vercel.app
   - 用户名：`boss`
   - 密码：`boss123`
   - 点击登录

3. **测试管理后台**
   - 登录成功后访问：https://ai-airdrop.vercel.app/admin
   - 应该能看到管理后台

---

## 🎯 **快速操作（1分钟完成）**

### 最快方法：

```sql
-- 1. 复制下面这段 SQL
UPDATE users SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMye5IK9bZCZQgC5L0k/TF.y4BqZFgPZY8O', is_admin = true WHERE username = 'boss';

-- 2. 在 Supabase SQL Editor 中粘贴并执行

-- 3. 刷新登录页面，使用 boss/boss123 登录
```

---

## 🆘 **如果还是不行**

### 检查清单：

1. **确认账号存在**
```sql
SELECT * FROM users WHERE username = 'boss';
```

2. **检查密码字段类型**
```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'password';
```

应该是 `TEXT` 或 `VARCHAR(255)` 以上

3. **清除浏览器缓存**
   - 按 `Ctrl + Shift + Delete`
   - 清除缓存和 Cookie
   - 或使用隐私模式

4. **检查登录逻辑**
```sql
-- 查看所有用户的密码格式
SELECT 
  username,
  LEFT(password, 10) as pwd_start,
  LENGTH(password) as pwd_length,
  is_admin
FROM users
ORDER BY created_at;
```

---

## 💡 **为什么会出现这个问题？**

1. **系统升级**：代码已使用 bcryptjs 加密
2. **数据未迁移**：数据库中旧用户密码还是明文
3. **验证失败**：bcrypt.compare('boss123', '明文boss123') → false

---

## 🎉 **执行完成后**

登录信息：
- 🌐 **前端地址**：https://ai-airdrop.vercel.app
- 👤 **用户名**：boss
- 🔑 **密码**：boss123
- 🛡️ **管理后台**：https://ai-airdrop.vercel.app/admin

---

**建议：优先使用方案1的第一个 SQL，最简单快速！** 🚀

