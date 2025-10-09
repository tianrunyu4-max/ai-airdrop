-- ============================================
-- 群聊分类和多群功能迁移
-- ============================================

-- 1. 创建群聊分类表
CREATE TABLE IF NOT EXISTS chat_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_active ON chat_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON chat_categories(sort_order);

-- 2. 修改chat_groups表，添加分类和机器人配置
DO $$ 
BEGIN
  -- 添加category_id字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_groups' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE chat_groups ADD COLUMN category_id UUID REFERENCES chat_categories(id);
  END IF;

  -- 添加description字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_groups' AND column_name = 'description'
  ) THEN
    ALTER TABLE chat_groups ADD COLUMN description TEXT;
  END IF;

  -- 添加icon字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_groups' AND column_name = 'icon'
  ) THEN
    ALTER TABLE chat_groups ADD COLUMN icon VARCHAR(50);
  END IF;

  -- 添加sort_order字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_groups' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE chat_groups ADD COLUMN sort_order INT DEFAULT 0;
  END IF;

  -- 添加is_active字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_groups' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE chat_groups ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;

  -- 添加bot_enabled字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_groups' AND column_name = 'bot_enabled'
  ) THEN
    ALTER TABLE chat_groups ADD COLUMN bot_enabled BOOLEAN DEFAULT FALSE;
  END IF;

  -- 添加bot_config字段（JSON配置）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_groups' AND column_name = 'bot_config'
  ) THEN
    ALTER TABLE chat_groups ADD COLUMN bot_config JSONB;
  END IF;
END $$;

-- 3. 更新max_members为10万
UPDATE chat_groups SET max_members = 100000 WHERE max_members < 100000;
ALTER TABLE chat_groups ALTER COLUMN max_members SET DEFAULT 100000;

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_groups_category ON chat_groups(category_id);
CREATE INDEX IF NOT EXISTS idx_groups_active ON chat_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_groups_sort ON chat_groups(sort_order);

-- 5. 插入默认分类
INSERT INTO chat_categories (name, description, icon, sort_order) VALUES
('综合交流', '综合话题讨论区', '💬', 1),
('空投推荐', 'AI推荐的优质空投', '🎁', 2),
('交易策略', '交易技巧和策略分享', '📈', 3),
('项目分析', '区块链项目深度分析', '🔍', 4),
('新手指南', '新手入门和答疑', '📚', 5)
ON CONFLICT DO NOTHING;

-- 6. 更新现有群组到默认分类
UPDATE chat_groups 
SET category_id = (SELECT id FROM chat_categories WHERE name = '综合交流' LIMIT 1)
WHERE category_id IS NULL;

-- 7. 创建一些示例群组
DO $$
DECLARE
  cat_general UUID;
  cat_airdrop UUID;
  cat_trading UUID;
BEGIN
  -- 获取分类ID
  SELECT id INTO cat_general FROM chat_categories WHERE name = '综合交流' LIMIT 1;
  SELECT id INTO cat_airdrop FROM chat_categories WHERE name = '空投推荐' LIMIT 1;
  SELECT id INTO cat_trading FROM chat_categories WHERE name = '交易策略' LIMIT 1;

  -- 插入示例群组
  INSERT INTO chat_groups (name, description, category_id, type, member_count, max_members, icon, sort_order, bot_enabled, bot_config)
  VALUES 
    ('AI科技', '主群聊 - 人人可见', cat_general, 'default_hall', 0, 100000, '🤖', 1, TRUE, 
     '{"bot_name": "AI助手", "push_interval": 3600, "welcome_message": "欢迎来到AI科技！"}'::jsonb),
    
    ('币安空投专区', '币安交易所空投信息', cat_airdrop, 'custom', 0, 100000, '🟡', 2, TRUE,
     '{"bot_name": "币安空投机器人", "push_interval": 1800, "exchange_filter": "binance"}'::jsonb),
    
    ('OKX空投专区', 'OKX交易所空投信息', cat_airdrop, 'custom', 0, 100000, '⚫', 3, TRUE,
     '{"bot_name": "OKX空投机器人", "push_interval": 1800, "exchange_filter": "okx"}'::jsonb),
    
    ('高分空投推荐', 'AI评分8分以上的优质空投', cat_airdrop, 'custom', 0, 100000, '⭐', 4, TRUE,
     '{"bot_name": "高分推荐机器人", "push_interval": 3600, "min_score": 8.0}'::jsonb),
    
    ('合约交易策略', '合约交易技巧分享', cat_trading, 'custom', 0, 100000, '📊', 5, FALSE, NULL)
  ON CONFLICT DO NOTHING;
END $$;

-- 8. RLS策略
ALTER TABLE chat_categories ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看分类
CREATE POLICY categories_select_all ON chat_categories
  FOR SELECT USING (is_active = TRUE);

-- 管理员可以管理分类
CREATE POLICY categories_admin_all ON chat_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.is_admin = TRUE
    )
  );

-- 更新chat_groups的RLS策略
DROP POLICY IF EXISTS groups_select_all ON chat_groups;
CREATE POLICY groups_select_all ON chat_groups
  FOR SELECT USING (is_active = TRUE);

-- 完成
SELECT 'Chat categories migration completed successfully!' AS status;
