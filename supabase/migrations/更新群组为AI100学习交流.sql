-- ==========================================
-- 🔥 更新群组：AI 100 学习交流 - 支持100万人
-- ==========================================

-- 1. 更新群组名称和人数上限
UPDATE chat_groups
SET 
  description = 'AI 100 学习交流',
  max_members = 1000000,  -- 100万人上限
  member_count = GREATEST(member_count, 100)  -- 初始显示至少100人
WHERE type = 'default';

-- 2. 如果没有默认群组，则创建一个
INSERT INTO chat_groups (type, icon, description, member_count, max_members, is_active, sort_order, bot_enabled)
VALUES ('default', '💰', 'AI 100 学习交流', 100, 1000000, true, 1, true)
ON CONFLICT (type) DO UPDATE
SET 
  description = 'AI 100 学习交流',
  max_members = 1000000,
  member_count = GREATEST(chat_groups.member_count, 100);

-- 3. 验证更新结果
SELECT 
  id,
  type,
  description,
  member_count,
  max_members,
  is_active,
  sort_order
FROM chat_groups
WHERE type = 'default'
ORDER BY sort_order;

-- ==========================================
-- ✅ 更新完成！
-- 群组名称：AI 100 学习交流
-- 最大人数：1,000,000（100万）
-- ==========================================

