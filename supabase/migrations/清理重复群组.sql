-- ==========================================
-- 清理重复群组 - 只保留一个AI空投计划
-- ==========================================

-- 1. 删除所有群组
DELETE FROM chat_groups;

-- 2. 重新创建2个群组（确保唯一）
INSERT INTO chat_groups (type, icon, description, member_count, max_members, is_active, sort_order, bot_enabled)
VALUES 
  ('default', '💰', 'AI 空投计划', 10, 50000, true, 1, false),
  ('ai_push', '🚀', 'AI Web3 空投', 5, 50000, true, 2, true)
ON CONFLICT DO NOTHING;

-- 3. 验证结果
SELECT id, type, description, member_count, sort_order, is_active 
FROM chat_groups 
ORDER BY sort_order;

