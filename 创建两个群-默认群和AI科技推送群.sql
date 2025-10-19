-- 创建两个群：默认群（AI 自动赚钱系统）和 AI科技推送群

-- 1. 更新现有群为"AI 自动赚钱系统"（用户聊天）
UPDATE chat_groups 
SET 
  description = 'AI 自动赚钱系统',
  type = 'default',
  icon = '💰'
WHERE id = '1704a647-4eff-4a65-abe5-05b4d9bd5497';

-- 2. 创建"AI科技"机器人推送群
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
);

-- 3. 查看结果
SELECT id, type, icon, description, member_count, is_active
FROM chat_groups
ORDER BY created_at;

