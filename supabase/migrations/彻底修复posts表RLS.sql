-- ==========================================
-- 彻底修复 posts 表的 RLS 策略（简化版）
-- ==========================================

-- 1. 删除所有旧策略
DROP POLICY IF EXISTS "付费代理可发布" ON posts;
DROP POLICY IF EXISTS "所有人可查看发布" ON posts;
DROP POLICY IF EXISTS "作者和管理员可删除" ON posts;
DROP POLICY IF EXISTS "创建者可删除发布" ON posts;
DROP POLICY IF EXISTS "创建者可更新发布" ON posts;
DROP POLICY IF EXISTS "所有代码查看发布" ON posts;

-- 2. 创建超简单策略（先让功能跑起来）
-- 所有认证用户可以插入
CREATE POLICY "认证用户可发布" ON posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 所有认证用户可以查看
CREATE POLICY "认证用户可查看" ON posts
FOR SELECT
TO authenticated
USING (true);

-- 作者本人可以删除
CREATE POLICY "作者可删除" ON posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. 确保 RLS 已启用
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 4. 验证
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'posts';

