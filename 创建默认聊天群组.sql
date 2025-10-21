-- ==========================================
-- 创建默认聊天群组
-- ==========================================
-- 确保用户登录后直接进入"自动赚钱群"

-- 1. 删除旧的默认群组（如果存在）
DELETE FROM chat_groups WHERE type = 'default';

-- 2. 创建"自动赚钱群"作为默认群组
INSERT INTO chat_groups (
  name,
  description,
  type,
  icon,
  member_count,
  max_members,
  is_active,
  sort_order,
  bot_enabled,
  bot_config
) VALUES (
  'AI 自动赚钱系统',
  'AI 自动赚钱系统',
  'default',                    -- 重要：type='default' 表示默认群
  '💰',
  60,
  50000,
  true,
  1,                            -- 排序第一
  true,
  '{
    "bot_name": "AI智能客服",
    "bot_type": "customer_service",
    "welcome_message": "👋 欢迎来到AI自动赚钱系统！\n\n有任何问题随时提问，我会自动回答您！"
  }'::jsonb
);

-- 3. 创建"AI科技空投群"（可选）
INSERT INTO chat_groups (
  name,
  description,
  type,
  icon,
  member_count,
  max_members,
  is_active,
  sort_order,
  bot_enabled,
  bot_config
) VALUES (
  'AI 科技空投',
  'AI 科技空投',
  'ai_push',                    -- type='ai_push' 表示空投群
  '🚀',
  128,
  100000,
  true,
  2,                            -- 排序第二
  true,
  '{
    "bot_name": "AI空投机器人",
    "bot_type": "airdrop_push",
    "push_interval": 7200
  }'::jsonb
);

-- 4. 验证
SELECT 
  id,
  description as "群名",
  type as "类型",
  icon,
  member_count as "成员数",
  sort_order as "排序",
  is_active as "是否启用"
FROM chat_groups
ORDER BY sort_order;

-- ==========================================
-- ✅ 执行完成！
-- ==========================================

/*
现在的群组配置：

1. AI 自动赚钱系统（type='default'，排序1）
   - 用户登录后默认进入这个群
   - 智能客服自动回答问题
   
2. AI 科技空投（type='ai_push'，排序2）
   - 空投机器人定时推送
   - 用户不可聊天
*/

