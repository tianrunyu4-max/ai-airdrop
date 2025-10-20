-- ==========================================
-- 🔥 创建有效消息视图 - 立即执行
-- ==========================================
-- 复制此SQL，在 Supabase Dashboard -> SQL Editor 中执行

-- 1. 创建视图：只返回有效期内的消息
CREATE OR REPLACE VIEW valid_messages AS
SELECT 
  m.id,
  m.chat_group_id,
  m.user_id,
  m.content,
  m.type,
  m.is_bot,
  m.created_at,
  m.airdrop_data,
  m.money_data,
  m.ad_data,
  m.image_url,
  cg.type as group_type,
  cg.description as group_name
FROM messages m
LEFT JOIN chat_groups cg ON m.chat_group_id = cg.id
WHERE 
  -- 用户消息：只显示5分钟内的
  (m.is_bot = false AND m.created_at > NOW() - INTERVAL '5 minutes')
  OR
  -- 自动赚钱群机器人消息：只显示10分钟内的
  (m.is_bot = true AND cg.type = 'default' AND m.created_at > NOW() - INTERVAL '10 minutes')
  OR
  -- AI科技群机器人消息：只显示24小时内的
  (m.is_bot = true AND cg.type = 'ai_push' AND m.created_at > NOW() - INTERVAL '24 hours');

-- 2. 设置RLS策略（允许所有人查看）
ALTER VIEW valid_messages SET (security_invoker = true);

-- 3. 测试视图
SELECT 
  group_name,
  is_bot,
  COUNT(*) as message_count
FROM valid_messages
GROUP BY group_name, is_bot;

-- 4. 查看最近的消息
SELECT 
  group_name,
  content,
  is_bot,
  created_at,
  NOW() - created_at as age
FROM valid_messages
ORDER BY created_at DESC
LIMIT 10;

-- ==========================================
-- ✅ 执行完成后，前端将自动使用此视图查询消息
-- ==========================================

