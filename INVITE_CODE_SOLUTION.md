# 邀请码系统 - 完整解决方案

## 🎯 问题诊断结果

经过完整测试，发现：

✅ **已解决的问题：**
1. RLS策略已正确配置 - 匿名用户可以读取邀请码
2. 前端代码逻辑正确 - 支持GENESIS创世用户和8位邀请码
3. 数据库schema正确 - users表结构完整

❌ **当前阻塞问题：**
- Supabase Auth无法通过API创建用户（返回"Database error creating new user"）
- 这是Supabase项目配置问题，需要在Dashboard中手动配置

---

## 🔧 立即解决方案（3步完成）

### 步骤1: 检查Supabase Auth配置

1. 打开 Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/vtezesyfhvbkgpdkuyeo/auth/providers
   ```

2. 确认以下设置:
   - **Email Provider**: 必须启用 ✅
   - **Enable email confirmations**: 关闭 ❌（开发阶段）
   - **Enable email signups**: 启用 ✅

3. 打开 Settings:
   ```
   https://supabase.com/dashboard/project/vtezesyfhvbkgpdkuyeo/settings/auth
   ```

4. 确认:
   - **Enable email signups**: ON
   - **Enable manual linking**: ON（可选）

### 步骤2: 手动创建第一个用户

**方式A: 通过Dashboard UI（推荐）**

1. 打开 Authentication → Users:
   ```
   https://supabase.com/dashboard/project/vtezesyfhvbkgpdkuyeo/auth/users
   ```

2. 点击 **"Add user"** → **"Create new user"**

3. 填写:
   - Email: `admin@example.com`
   - Password: `admin123`
   - Auto Confirm User: **勾选** ✅

4. 点击 **"Create user"**

5. 创建成功后，**复制用户的UUID**（类似 `a1b2c3d4-...`）

**方式B: 通过SQL（如果UI创建失败）**

1. 打开 SQL Editor:
   ```
   https://supabase.com/dashboard/project/vtezesyfhvbkgpdkuyeo/sql/new
   ```

2. 执行以下SQL（生成一个Auth用户）:
   ```sql
   -- 注意：这需要直接操作auth.users表，可能需要特殊权限
   -- 如果失败，请使用方式A
   
   INSERT INTO auth.users (
     instance_id,
     id,
     aud,
     role,
     email,
     encrypted_password,
     email_confirmed_at,
     created_at,
     updated_at,
     confirmation_token,
     email_change,
     email_change_token_new,
     recovery_token
   ) VALUES (
     '00000000-0000-0000-0000-000000000000',
     gen_random_uuid(),
     'authenticated',
     'authenticated',
     'admin@example.com',
     crypt('admin123', gen_salt('bf')),
     NOW(),
     NOW(),
     NOW(),
     '',
     '',
     '',
     ''
   )
   RETURNING id;
   ```

3. 复制返回的UUID

### 步骤3: 插入users表记录

1. 在 SQL Editor 中执行（替换 `<粘贴UUID>` 为上一步复制的UUID）:

```sql
INSERT INTO users (
  id, 
  username, 
  invite_code, 
  inviter_id, 
  is_agent, 
  is_admin, 
  u_balance, 
  points_balance
)
VALUES (
  '<粘贴UUID>',  -- 替换为实际的UUID
  'admin',
  'AI8K3Q9Z',    -- 第一个用户的邀请码
  NULL,
  true,
  true,
  100,
  500
);
```

2. 执行成功后，验证:

```sql
SELECT id, username, invite_code, is_admin 
FROM users 
WHERE username = 'admin';
```

---

## ✅ 测试登录

### 前端登录

1. 启动开发服务器:
   ```bash
   npm run dev
   ```

2. 打开浏览器:
   ```
   http://localhost:3000/login
   ```

3. 登录:
   - **用户名**: `admin`
   - **密码**: `admin123`

### 测试注册（第二个用户）

1. 访问注册页面:
   ```
   http://localhost:3000/register
   ```

2. 填写:
   - 用户名: `user001`
   - 密码: `123456`
   - 邀请码: `AI8K3Q9Z`

3. 注册成功后会显示新用户的邀请码

---

## 🔍 如果仍然失败

### 检查RLS策略

在SQL Editor中执行:

```sql
-- 查看当前策略
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
```

应该看到以下策略:
- `Allow anonymous to read invite codes` (SELECT, anon)
- `Allow users to insert their own record` (INSERT, authenticated)
- `Allow users to read their own record` (SELECT, authenticated)
- `Allow users to update their own record` (UPDATE, authenticated)

### 如果策略缺失，执行:

```sql
-- 删除旧策略
DROP POLICY IF EXISTS "Allow users to insert their own record" ON users;
DROP POLICY IF EXISTS "Allow users to read their own record" ON users;
DROP POLICY IF EXISTS "Allow users to update their own record" ON users;
DROP POLICY IF EXISTS "users_select_for_invite_anon" ON users;
DROP POLICY IF EXISTS "Allow anonymous to read invite codes" ON users;
DROP POLICY IF EXISTS "Allow anonymous to count users" ON users;

-- 创建新策略
CREATE POLICY "Allow anonymous to read invite codes"
ON users FOR SELECT TO anon
USING (invite_code IS NOT NULL);

CREATE POLICY "Allow users to insert their own record"
ON users FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to read their own record"
ON users FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own record"
ON users FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

---

## 📝 总结

**根本原因**: Supabase项目的Auth配置不允许通过API创建用户

**解决方案**: 
1. 在Dashboard中手动创建第一个Auth用户
2. 在SQL中插入对应的users表记录
3. 后续用户可以通过前端正常注册

**邀请码系统状态**: ✅ 代码逻辑正确，RLS策略正确，只需手动创建第一个用户即可启动

---

## 🎉 完成后

第一个用户创建成功后：
- 用户名: `admin`
- 密码: `admin123`
- 邀请码: `AI8K3Q9Z`

其他用户可以使用 `AI8K3Q9Z` 邀请码正常注册，系统会自动生成新的邀请码。
































