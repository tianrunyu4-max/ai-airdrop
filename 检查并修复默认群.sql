-- 步骤1：查看所有群组
SELECT id, name, type, icon, is_active, created_at 
FROM chat_groups 
ORDER BY created_at;

-- 步骤2：找出"默认大厅 1"并删除（如果存在）
-- DELETE FROM chat_groups WHERE name = '默认大厅 1';

-- 步骤3：确保"AI科技"群存在且类型正确
-- 如果不存在，创建它
INSERT INTO chat_groups (name, icon, type, description, member_count, max_members, is_active)
VALUES ('AI科技', '🤖', 'default_hall', '核心群聊 - 等待AI智能推荐空投 币安交易所全投资讯', 60, 50000, true)
ON CONFLICT (name) DO UPDATE 
SET 
  type = 'default_hall',
  is_active = true,
  icon = '🤖',
  description = '核心群聊 - 等待AI智能推荐空投 币安交易所全投资讯';

-- 步骤4：查看最终结果
SELECT id, name, type, icon, description, is_active 
FROM chat_groups 
ORDER BY created_at;

