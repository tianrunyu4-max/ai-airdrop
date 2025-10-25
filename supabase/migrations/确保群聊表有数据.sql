-- ==========================================
-- 确保群聊表有数据 - 快速修复
-- ==========================================

-- 1. 检查并创建默认群组（如果不存在）
INSERT INTO chat_groups (type, icon, description, member_count, max_members, is_active, sort_order, bot_enabled)
VALUES ('default', '💰', 'AI 空投计划', 10, 50000, true, 1, true)
ON CONFLICT DO NOTHING;

-- 2. 确保RLS策略允许查看
DROP POLICY IF EXISTS "所有人可查看群组" ON chat_groups;
CREATE POLICY "所有人可查看群组" ON chat_groups
FOR SELECT 
USING (true);

-- 3. 确保RLS已启用
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;

-- 4. 查看当前群组（验证）
SELECT id, type, description, is_active, sort_order 
FROM chat_groups 
WHERE type = 'default' 
ORDER BY sort_order 
LIMIT 1;

