-- ==========================================
-- 修复默认群名称
-- ==========================================

-- 1. 查看当前所有群
SELECT id, type, description, group_number, member_count, is_active
FROM chat_groups
ORDER BY created_at;

-- 2. 将第一个默认群改名为"AI 自动赚钱系统"（不带数字）
UPDATE chat_groups
SET 
  description = 'AI 自动赚钱系统',
  group_number = 1
WHERE type = 'default'
  AND (group_number = 1 OR group_number IS NULL)
  AND is_active = true;

-- 或者如果上面没找到，直接用ID更新（请替换为您的实际群ID）
-- UPDATE chat_groups
-- SET description = 'AI 自动赚钱系统', group_number = 1
-- WHERE id = 'your-group-id-here';

-- 3. 验证结果
SELECT id, type, description, group_number, member_count, is_active
FROM chat_groups
WHERE type = 'default'
ORDER BY group_number;

