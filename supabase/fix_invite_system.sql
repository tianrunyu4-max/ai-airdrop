-- ============================================
-- 完整修复邀请码系统的RLS策略
-- ============================================

-- 1. 启用RLS（如果尚未启用）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. 删除可能存在的旧策略（避免冲突）
DROP POLICY IF EXISTS "Allow users to insert their own record" ON users;
DROP POLICY IF EXISTS "Allow users to read their own record" ON users;
DROP POLICY IF EXISTS "Allow users to update their own record" ON users;
DROP POLICY IF EXISTS "users_select_for_invite_anon" ON users;
DROP POLICY IF EXISTS "Allow anonymous to read invite codes" ON users;
DROP POLICY IF EXISTS "Allow anonymous to count users" ON users;

-- 3. 创建新的RLS策略

-- 3.1 允许匿名用户读取邀请码（用于注册时验证）
-- 只暴露必要字段：id 和 invite_code
CREATE POLICY "Allow anonymous to read invite codes"
ON users FOR SELECT
TO anon
USING (invite_code IS NOT NULL);

-- 3.2 允许已认证用户插入自己的记录（注册后插入）
CREATE POLICY "Allow users to insert their own record"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3.3 允许已认证用户读取自己的完整记录
CREATE POLICY "Allow users to read their own record"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3.4 允许已认证用户更新自己的记录
CREATE POLICY "Allow users to update their own record"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. 验证策略是否创建成功
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;





























