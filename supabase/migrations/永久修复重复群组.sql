-- ==========================================
-- 永久修复重复群组 - 添加唯一约束
-- ==========================================

-- 1. 删除所有群组
DELETE FROM chat_groups;

-- 2. 添加唯一性约束（防止重复创建）
ALTER TABLE chat_groups 
DROP CONSTRAINT IF EXISTS unique_group_type;

ALTER TABLE chat_groups 
ADD CONSTRAINT unique_group_type UNIQUE (type);

-- 3. 重新创建2个群组（确保唯一）
INSERT INTO chat_groups (type, icon, description, member_count, max_members, is_active, sort_order, bot_enabled)
VALUES 
  ('default', '💰', 'AI 空投计划', 10, 50000, true, 1, false),
  ('ai_push', '🚀', 'AI Web3 空投', 5, 50000, true, 2, true)
ON CONFLICT (type) DO NOTHING;

-- 4. 验证结果
SELECT id, type, description, member_count, sort_order, is_active 
FROM chat_groups 
ORDER BY sort_order;

