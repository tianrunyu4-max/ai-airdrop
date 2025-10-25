-- ==========================================
-- 暂时关闭 posts 表的 RLS（先让功能跑起来）
-- ==========================================

-- 1. 删除所有策略
DROP POLICY IF EXISTS "认证用户可发布" ON posts;
DROP POLICY IF EXISTS "认证用户可查看" ON posts;
DROP POLICY IF EXISTS "作者可删除" ON posts;
DROP POLICY IF EXISTS "付费代理可发布" ON posts;
DROP POLICY IF EXISTS "所有人可查看发布" ON posts;
DROP POLICY IF EXISTS "作者和管理员可删除" ON posts;
DROP POLICY IF EXISTS "创建者可删除发布" ON posts;
DROP POLICY IF EXISTS "创建者可更新发布" ON posts;
DROP POLICY IF EXISTS "所有代码查看发布" ON posts;

-- 2. 暂时关闭 RLS（让功能先正常工作）
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- 3. 验证 RLS 状态
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'posts';

-- 应该显示 rowsecurity = false

