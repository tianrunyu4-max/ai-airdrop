-- 修复群组配置：确保两个群组类型正确

-- 1. 查看当前群组配置
SELECT id, type, description, icon, is_active, created_at 
FROM chat_groups 
ORDER BY created_at;

-- 2. 更新"AI 自动赚钱系统"为默认群（用户聊天群）
UPDATE chat_groups 
SET 
  type = 'default',
  icon = '💰',
  description = 'AI 自动赚钱系统'
WHERE description = 'AI 自动赚钱系统' OR description LIKE '%自动赚钱%';

-- 3. 确保"AI科技"群存在且类型为ai_push（空投推送群）
INSERT INTO chat_groups (
  type,
  icon,
  description,
  member_count,
  max_members,
  is_active
)
VALUES (
  'ai_push',
  '🤖',
  'AI科技',
  60,
  50000,
  true
)
ON CONFLICT (description) DO UPDATE 
SET 
  type = 'ai_push',
  icon = '🤖',
  is_active = true;

-- 4. 查看修复后的结果
SELECT id, type, description, icon, is_active, created_at 
FROM chat_groups 
ORDER BY created_at;
