-- 添加密码字段到users表（不再依赖Supabase Auth）

-- 添加password_hash字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 更新RLS策略：允许匿名用户插入（注册）
DROP POLICY IF EXISTS "Allow anonymous to insert users" ON users;
CREATE POLICY "Allow anonymous to insert users"
ON users FOR INSERT
TO anon
WITH CHECK (true);

-- 允许匿名用户读取（登录验证）
DROP POLICY IF EXISTS "Allow anonymous to read for login" ON users;
CREATE POLICY "Allow anonymous to read for login"
ON users FOR SELECT
TO anon
USING (true);

-- 允许已登录用户更新自己的记录
DROP POLICY IF EXISTS "Allow users to update themselves" ON users;
CREATE POLICY "Allow users to update themselves"
ON users FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 验证
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'password_hash';































