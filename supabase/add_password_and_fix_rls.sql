-- 最终解决方案：添加password_hash字段，完全开放RLS

-- 1. 添加密码字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. 删除所有旧的RLS策略
DROP POLICY IF EXISTS "Allow anonymous to insert users" ON users;
DROP POLICY IF EXISTS "Allow anonymous to read for login" ON users;
DROP POLICY IF EXISTS "Allow users to update themselves" ON users;
DROP POLICY IF EXISTS "Allow anonymous to read invite codes" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own record" ON users;
DROP POLICY IF EXISTS "Allow users to read their own record" ON users;
DROP POLICY IF EXISTS "Allow users to update their own record" ON users;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow insert for anon users" ON users;
DROP POLICY IF EXISTS "Allow select for anon users" ON users;
DROP POLICY IF EXISTS "用户选择自己的" ON users;
DROP POLICY IF EXISTS "users_select_for_invite_anon" ON users;
DROP POLICY IF EXISTS "为许已验证用户的所有操作" ON users;
DROP POLICY IF EXISTS "为许匿名用户插入" ON users;
DROP POLICY IF EXISTS "为许匿名用户选择" ON users;

-- 3. 创建最宽松的策略（开发阶段）
CREATE POLICY "Allow all for anon"
ON users FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated"
ON users FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. 验证
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'password_hash';

SELECT policyname FROM pg_policies WHERE tablename = 'users';






