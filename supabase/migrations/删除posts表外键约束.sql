-- ==========================================
-- 删除 posts 表的外键约束
-- ==========================================

-- 1. 删除 user_id 的外键约束
ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

-- 2. 验证约束已删除
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'posts'::regclass;

-- 应该不再显示 posts_user_id_fkey

