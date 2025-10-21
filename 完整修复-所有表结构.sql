-- ==========================================
-- 🚀 完整修复：所有表结构一致性
-- ==========================================
-- 执行位置：Supabase SQL Editor
-- 预计时间：2分钟
-- ==========================================

-- ==========================================
-- 第一部分：充值和提现
-- ==========================================

-- 1. 充值记录表
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

CREATE INDEX IF NOT EXISTS idx_recharge_user ON recharge_records(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_status ON recharge_records(status);

ALTER TABLE recharge_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用户查看自己的充值记录" ON recharge_records;
DROP POLICY IF EXISTS "用户创建充值记录" ON recharge_records;
DROP POLICY IF EXISTS "管理员查看所有充值记录" ON recharge_records;
DROP POLICY IF EXISTS "管理员确认充值" ON recharge_records;

CREATE POLICY "用户查看自己的充值记录" ON recharge_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户创建充值记录" ON recharge_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "管理员查看所有充值记录" ON recharge_records FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "管理员确认充值" ON recharge_records FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- ==========================================
-- 第二部分：消息系统
-- ==========================================

-- 2. 确保messages表有正确的字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_bot') THEN
    ALTER TABLE messages ADD COLUMN is_bot BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'airdrop_data') THEN
    ALTER TABLE messages ADD COLUMN airdrop_data JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'money_data') THEN
    ALTER TABLE messages ADD COLUMN money_data JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'ad_data') THEN
    ALTER TABLE messages ADD COLUMN ad_data JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'image_url') THEN
    ALTER TABLE messages ADD COLUMN image_url TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_is_bot ON messages(is_bot);
CREATE INDEX IF NOT EXISTS idx_messages_group_created ON messages(chat_group_id, created_at DESC);

-- 3. 创建有效消息视图
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
  (m.is_bot = false AND m.created_at > NOW() - INTERVAL '5 minutes')
  OR
  (m.is_bot = true AND cg.type = 'default' AND m.created_at > NOW() - INTERVAL '10 minutes')
  OR
  (m.is_bot = true AND cg.type = 'ai_push' AND m.created_at > NOW() - INTERVAL '24 hours');

-- 4. 清理函数
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages WHERE is_bot = false AND created_at < NOW() - INTERVAL '5 minutes';
  DELETE FROM messages WHERE is_bot = true AND chat_group_id IN (SELECT id FROM chat_groups WHERE type = 'default') AND created_at < NOW() - INTERVAL '10 minutes';
  DELETE FROM messages WHERE is_bot = true AND chat_group_id IN (SELECT id FROM chat_groups WHERE type = 'ai_push') AND created_at < NOW() - INTERVAL '24 hours';
  RAISE NOTICE '✅ 消息清理完成';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 第三部分：空投表
-- ==========================================

-- 5. 空投表（确保有status字段）
CREATE TABLE IF NOT EXISTS airdrops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  platform VARCHAR(100),
  project_name VARCHAR(100),
  type VARCHAR(50) DEFAULT 'web3',
  category VARCHAR(50),
  ai_score NUMERIC(3,1) DEFAULT 5.0,
  reward_min NUMERIC(10,2),
  reward_max NUMERIC(10,2),
  reward_description TEXT,
  difficulty VARCHAR(20),
  steps TEXT[],
  url TEXT,
  source_url TEXT,
  status VARCHAR(20) DEFAULT 'active',  -- 重要：确保有这个字段
  is_verified BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  push_count INTEGER DEFAULT 0,
  last_pushed_at TIMESTAMP WITH TIME ZONE,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 如果status字段不存在，添加它
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airdrops' AND column_name = 'status') THEN
    ALTER TABLE airdrops ADD COLUMN status VARCHAR(20) DEFAULT 'active';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_airdrops_status ON airdrops(status);
CREATE INDEX IF NOT EXISTS idx_airdrops_type ON airdrops(type);
CREATE INDEX IF NOT EXISTS idx_airdrops_score ON airdrops(ai_score DESC);

ALTER TABLE airdrops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "所有人可查看活跃空投" ON airdrops;
DROP POLICY IF EXISTS "管理员可管理空投" ON airdrops;

CREATE POLICY "所有人可查看活跃空投" ON airdrops FOR SELECT USING (status = 'active');
CREATE POLICY "管理员可管理空投" ON airdrops FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- ==========================================
-- 第四部分：群组表
-- ==========================================

-- 6. 确保chat_groups表存在且有正确字段
CREATE TABLE IF NOT EXISTS chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'default',
  icon VARCHAR(10),
  member_count INTEGER DEFAULT 0,
  max_members INTEGER DEFAULT 100000,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  bot_enabled BOOLEAN DEFAULT false,
  bot_config JSONB,
  category_id UUID,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_groups_type ON chat_groups(type);
CREATE INDEX IF NOT EXISTS idx_chat_groups_active ON chat_groups(is_active);

ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "所有人可查看活跃群组" ON chat_groups;
CREATE POLICY "所有人可查看活跃群组" ON chat_groups FOR SELECT USING (is_active = true);

-- 7. 确保chat_categories表存在
CREATE TABLE IF NOT EXISTS chat_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_categories_active ON chat_categories(is_active);

ALTER TABLE chat_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "所有人可查看活跃分类" ON chat_categories;
CREATE POLICY "所有人可查看活跃分类" ON chat_categories FOR SELECT USING (is_active = true);

-- ==========================================
-- 第五部分：客服机器人
-- ==========================================

-- 8. 客服问答表
CREATE TABLE IF NOT EXISTS customer_service_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  category VARCHAR(50),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_qa_keywords ON customer_service_qa USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_cs_qa_active ON customer_service_qa(is_active);

ALTER TABLE customer_service_qa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "所有人可查看客服问答" ON customer_service_qa;
DROP POLICY IF EXISTS "管理员可编辑客服问答" ON customer_service_qa;

CREATE POLICY "所有人可查看客服问答" ON customer_service_qa FOR SELECT USING (is_active = true);
CREATE POLICY "管理员可编辑客服问答" ON customer_service_qa FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- 9. 智能匹配函数
CREATE OR REPLACE FUNCTION match_customer_question(user_message TEXT)
RETURNS TABLE(
  id UUID,
  question TEXT,
  answer TEXT,
  category VARCHAR(50),
  priority INTEGER,
  trigger_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qa.id,
    qa.question,
    qa.answer,
    qa.category,
    qa.priority,
    qa.trigger_count
  FROM customer_service_qa qa
  WHERE qa.is_active = true
    AND (
      EXISTS (
        SELECT 1 FROM unnest(qa.keywords) AS keyword
        WHERE user_message ILIKE '%' || keyword || '%'
      )
      OR user_message ILIKE '%' || qa.question || '%'
    )
  ORDER BY qa.priority DESC, qa.id
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      qa.id,
      qa.question,
      qa.answer,
      qa.category,
      qa.priority,
      qa.trigger_count
    FROM customer_service_qa qa
    WHERE qa.category = '默认'
      AND qa.is_active = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 第六部分：系统配置
-- ==========================================

-- 10. 确保system_config表存在
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 添加充值配置
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
SET value = EXCLUDED.value, updated_at = NOW();

-- ==========================================
-- 验证
-- ==========================================

-- 验证所有表
SELECT 
  'recharge_records' as table_name,
  COUNT(*) as count
FROM recharge_records
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'airdrops', COUNT(*) FROM airdrops
UNION ALL
SELECT 'chat_groups', COUNT(*) FROM chat_groups
UNION ALL
SELECT 'chat_categories', COUNT(*) FROM chat_categories
UNION ALL
SELECT 'customer_service_qa', COUNT(*) FROM customer_service_qa;

-- ==========================================
-- ✅ 执行完成！
-- ==========================================

