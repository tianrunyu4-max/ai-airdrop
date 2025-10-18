-- 修复RLS策略 - 允许注册时插入用户记录

-- 1. 允许认证用户插入自己的记录
CREATE POLICY "Allow users to insert their own record"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. 允许认证用户读取自己的记录
CREATE POLICY "Allow users to read their own record"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. 允许认证用户更新自己的记录
CREATE POLICY "Allow users to update their own record"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);





























