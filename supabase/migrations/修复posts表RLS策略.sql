-- ==========================================
-- 修复 posts 表的 RLS 策略
-- ==========================================

-- 1. 删除旧策略
DROP POLICY IF EXISTS "付费代理可发布" ON posts;
DROP POLICY IF EXISTS "所有人可查看发布" ON posts;
DROP POLICY IF EXISTS "作者和管理员可删除" ON posts;

-- 2. 创建新策略（修复权限问题）
-- 付费代理可以插入
CREATE POLICY "付费代理可发布" ON posts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_agent = true
  )
);

-- 所有人可以查看
CREATE POLICY "所有人可查看发布" ON posts
FOR SELECT
TO authenticated
USING (true);

-- 作者本人或管理员可以删除
CREATE POLICY "作者和管理员可删除" ON posts
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);

-- 3. 确保 RLS 已启用
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 4. 验证策略
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'posts';

