-- 将"人工智能科技"群更新为"AI科技"主群
UPDATE chat_groups 
SET 
  description = 'AI科技',
  type = 'main',
  icon = '🤖'
WHERE id = '1704a647-4eff-4a65-abe5-05b4d9bd5497';

-- 查看结果
SELECT id, type, icon, description, member_count, is_active
FROM chat_groups;

