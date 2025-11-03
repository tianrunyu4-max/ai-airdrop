-- ==========================================
-- 🔥 自动清理过期消息 - 稳定方案
-- ==========================================
-- 
-- 功能：
-- 1. 用户消息：5分钟后自动删除
-- 2. 机器人消息（AI科技创薪群）：10分钟后自动删除
-- 3. 机器人消息（币安 欧易 空投群）：24小时后自动删除
--

-- 步骤1：创建清理函数
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
  -- 🔥 删除超过5分钟的用户消息
  DELETE FROM messages
  WHERE is_bot = false
    AND created_at < NOW() - INTERVAL '5 minutes';
  
  -- 🔥 删除超过10分钟的机器人消息（AI科技创薪群）
  DELETE FROM messages
  WHERE is_bot = true
    AND chat_group_id IN (
      SELECT id FROM chat_groups WHERE type = 'default'
    )
    AND created_at < NOW() - INTERVAL '10 minutes';
  
  -- 🔥 删除超过24小时的机器人消息（AI科技空投群）
  DELETE FROM messages
  WHERE is_bot = true
    AND chat_group_id IN (
      SELECT id FROM chat_groups WHERE type = 'ai_push'
    )
    AND created_at < NOW() - INTERVAL '24 hours';
  
  RAISE NOTICE '✅ 消息清理完成';
END;
$$ LANGUAGE plpgsql;

-- 步骤2：创建定时任务（使用 pg_cron 扩展）
-- 注意：需要在 Supabase Dashboard -> Database -> Extensions 中启用 pg_cron

-- 每1分钟执行一次清理
SELECT cron.schedule(
  'cleanup-expired-messages',  -- 任务名称
  '* * * * *',                  -- 每分钟执行
  $$ SELECT cleanup_expired_messages(); $$
);

-- 查看定时任务
SELECT * FROM cron.job;

-- ==========================================
-- 🔧 如果 pg_cron 不可用，使用手动触发方案
-- ==========================================

-- 方案A：手动执行清理（用于测试）
-- SELECT cleanup_expired_messages();

-- 方案B：创建视图，只显示有效消息
CREATE OR REPLACE VIEW valid_messages AS
SELECT m.*
FROM messages m
LEFT JOIN chat_groups cg ON m.chat_group_id = cg.id
WHERE 
  -- 用户消息：5分钟内
  (m.is_bot = false AND m.created_at > NOW() - INTERVAL '5 minutes')
  OR
  -- AI科技创薪群机器人消息：10分钟内
  (m.is_bot = true AND cg.type = 'default' AND m.created_at > NOW() - INTERVAL '10 minutes')
  OR
  -- 币安 欧易 空投群机器人消息：24小时内
  (m.is_bot = true AND cg.type = 'ai_push' AND m.created_at > NOW() - INTERVAL '24 hours');

-- 使用视图查询（前端改为查询视图）
-- SELECT * FROM valid_messages WHERE chat_group_id = 'xxx' ORDER BY created_at DESC LIMIT 50;

-- ==========================================
-- 🗑️ 清理历史消息（一次性执行）
-- ==========================================

-- 删除所有超过5分钟的用户消息
DELETE FROM messages
WHERE is_bot = false
  AND created_at < NOW() - INTERVAL '5 minutes';

-- 删除所有超过10分钟的AI科技创薪群机器人消息
DELETE FROM messages
WHERE is_bot = true
  AND chat_group_id IN (SELECT id FROM chat_groups WHERE type = 'default')
  AND created_at < NOW() - INTERVAL '10 minutes';

-- 删除所有超过24小时的币安 欧易 空投群机器人消息
DELETE FROM messages
WHERE is_bot = true
  AND chat_group_id IN (SELECT id FROM chat_groups WHERE type = 'ai_push')
  AND created_at < NOW() - INTERVAL '24 hours';

-- ==========================================
-- ✅ 验证清理效果
-- ==========================================

-- 查看当前消息数量
SELECT 
  cg.description AS "群组",
  COUNT(*) FILTER (WHERE m.is_bot = false) AS "用户消息数",
  COUNT(*) FILTER (WHERE m.is_bot = true) AS "机器人消息数",
  COUNT(*) AS "总消息数"
FROM messages m
LEFT JOIN chat_groups cg ON m.chat_group_id = cg.id
GROUP BY cg.description;

-- 查看最老的消息
SELECT 
  cg.description AS "群组",
  m.is_bot AS "是机器人",
  m.content AS "内容",
  m.created_at AS "创建时间",
  NOW() - m.created_at AS "消息年龄"
FROM messages m
LEFT JOIN chat_groups cg ON m.chat_group_id = cg.id
ORDER BY m.created_at
LIMIT 10;

