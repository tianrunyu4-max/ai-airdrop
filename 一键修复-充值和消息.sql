-- ==========================================
-- 🚀 一键修复：充值审核 + 消息清理
-- ==========================================
-- 执行位置：Supabase SQL Editor
-- 预计时间：1分钟
-- ==========================================

-- ==========================================
-- 第一部分：充值功能
-- ==========================================

-- 1️⃣ 创建充值记录表（如果不存在）
CREATE TABLE IF NOT EXISTS recharge_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(20) DEFAULT 'USDT',
  network VARCHAR(20) DEFAULT 'TRC20',
  txid VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  proof_image TEXT,
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES users(id)
);

-- 2️⃣ 创建索引
CREATE INDEX IF NOT EXISTS idx_recharge_user ON recharge_records(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_status ON recharge_records(status);
CREATE INDEX IF NOT EXISTS idx_recharge_created ON recharge_records(created_at DESC);

-- 3️⃣ 启用 RLS
ALTER TABLE recharge_records ENABLE ROW LEVEL SECURITY;

-- 4️⃣ 删除旧策略（如果存在）
DROP POLICY IF EXISTS "用户查看自己的充值记录" ON recharge_records;
DROP POLICY IF EXISTS "用户创建充值记录" ON recharge_records;
DROP POLICY IF EXISTS "管理员查看所有充值记录" ON recharge_records;
DROP POLICY IF EXISTS "管理员确认充值" ON recharge_records;

-- 5️⃣ 创建新的RLS策略
-- 用户只能查看自己的充值记录
CREATE POLICY "用户查看自己的充值记录" ON recharge_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建充值记录
CREATE POLICY "用户创建充值记录" ON recharge_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 管理员查看所有充值记录
CREATE POLICY "管理员查看所有充值记录" ON recharge_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 管理员确认/拒绝充值
CREATE POLICY "管理员确认充值" ON recharge_records
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 6️⃣ 添加充值配置到 system_config
INSERT INTO system_config (key, value, description) 
VALUES (
  'recharge_config',
  '{
    "usdt_trc20": "TXxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "usdt_erc20": "0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "enable_recharge": true,
    "min_amount": 10,
    "notice": "充值后请联系客服确认到账"
  }'::jsonb,
  '充值配置：USDT地址、最小充值金额等'
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, 
    updated_at = NOW();

-- ==========================================
-- 第二部分：消息清理功能
-- ==========================================

-- 1️⃣ 确保 messages 表有 is_bot 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'is_bot'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_bot BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2️⃣ 创建索引
CREATE INDEX IF NOT EXISTS idx_messages_is_bot ON messages(is_bot);
CREATE INDEX IF NOT EXISTS idx_messages_group_created ON messages(chat_group_id, created_at DESC);

-- 3️⃣ 创建有效消息视图
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

-- 4️⃣ 创建消息清理函数
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
  -- 删除超过5分钟的用户消息
  DELETE FROM messages
  WHERE is_bot = false
    AND created_at < NOW() - INTERVAL '5 minutes';
  
  -- 删除超过10分钟的机器人消息（自动赚钱群）
  DELETE FROM messages
  WHERE is_bot = true
    AND chat_group_id IN (
      SELECT id FROM chat_groups WHERE type = 'default'
    )
    AND created_at < NOW() - INTERVAL '10 minutes';
  
  -- 删除超过24小时的机器人消息（AI科技空投群）
  DELETE FROM messages
  WHERE is_bot = true
    AND chat_group_id IN (
      SELECT id FROM chat_groups WHERE type = 'ai_push'
    )
    AND created_at < NOW() - INTERVAL '24 hours';
  
  RAISE NOTICE '✅ 消息清理完成';
END;
$$ LANGUAGE plpgsql;

-- 5️⃣ 立即执行一次清理
SELECT cleanup_expired_messages();

-- ==========================================
-- 第三部分：验证
-- ==========================================

-- ✅ 验证充值表
SELECT 
  'recharge_records' as table_name,
  COUNT(*) as record_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count
FROM recharge_records;

-- ✅ 验证充值配置
SELECT 
  key,
  description,
  value->>'enable_recharge' as enabled,
  value->>'min_amount' as min_amount
FROM system_config 
WHERE key = 'recharge_config';

-- ✅ 验证消息清理
SELECT 
  cg.description as group_name,
  COUNT(*) FILTER (WHERE m.is_bot = false) as user_messages,
  COUNT(*) FILTER (WHERE m.is_bot = true) as bot_messages,
  COUNT(*) as total_messages,
  MAX(m.created_at) as latest_message
FROM messages m
LEFT JOIN chat_groups cg ON m.chat_group_id = cg.id
GROUP BY cg.description
ORDER BY latest_message DESC;

-- ✅ 验证有效消息视图
SELECT 
  group_name,
  is_bot,
  COUNT(*) as count
FROM valid_messages
GROUP BY group_name, is_bot;

-- ==========================================
-- ✅ 修复完成！
-- ==========================================

/*
执行结果说明：

1. 充值功能：
   ✅ recharge_records 表已创建
   ✅ RLS 策略已配置
   ✅ 系统配置已添加
   
2. 消息清理：
   ✅ valid_messages 视图已创建
   ✅ cleanup_expired_messages() 函数已创建
   ✅ 过期消息已清理
   
3. 下一步：
   - 前端会自动使用这些表和视图
   - 管理员可以在后台看到充值审核页面
   - 聊天消息会自动按时间过滤
*/

