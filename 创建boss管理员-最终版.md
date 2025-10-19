# 🔐 创建 boss 管理员账号

## 📋 **账号信息**

- **用户名**：`boss`
- **密码**：`bossab123`
- **权限**：管理员（is_admin = true）
- **邀请码**：BOSS0001

---

## 🚀 **在 Supabase SQL Editor 中执行**

### 步骤1：复制以下 SQL

```sql
INSERT INTO users (
  username, 
  password, 
  is_admin, 
  u_balance, 
  points_balance, 
  mining_points, 
  invite_code,
  created_at
)
VALUES (
  'boss',
  '$2b$10$sr.qSxTLBzZUgAo9WeQFZua3ZlGRgV.PaYbqnBXphOADPBiUm8Xl.',
  true,
  0,
  0,
  0,
  'BOSS0001',
  NOW()
);
```

### 步骤2：查看创建结果

```sql
SELECT 
  id,
  username, 
  LEFT(password, 30) as password_preview,
  is_admin, 
  invite_code, 
  created_at 
FROM users 
WHERE username = 'boss';
```

---

## ✅ **执行后应该看到**

查询结果：
- `username`: boss
- `password_preview`: $2b$10$sr.qSxTLBzZUgAo9WeQFZu...
- `is_admin`: true
- `invite_code`: BOSS0001

---

## 🎯 **登录信息**

创建成功后，您可以使用以下信息登录：

- **前端地址**：https://ai-airdrop.vercel.app
- **用户名**：`boss`
- **密码**：`bossab123`
- **管理后台**：https://ai-airdrop.vercel.app/admin

---

## 🔍 **如果遇到"用户名已存在"错误**

说明 boss 账号已经存在，那么执行更新 SQL：

```sql
UPDATE users 
SET 
  password = '$2b$10$sr.qSxTLBzZUgAo9WeQFZua3ZlGRgV.PaYbqnBXphOADPBiUm8Xl.',
  is_admin = true
WHERE username = 'boss';

SELECT username, LEFT(password, 30) as pwd, is_admin 
FROM users 
WHERE username = 'boss';
```

---

**请现在去 Supabase SQL Editor 执行上面的 SQL！** 🚀

