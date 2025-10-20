-- ============================================
-- 双区对碰奖励系统 - 数据库迁移脚本 v2
-- 
-- 修复：使用DO块来安全添加字段，兼容所有PostgreSQL版本
-- ============================================

-- ============================================
-- 1. 安全添加users表字段
-- ============================================

-- 添加parent_id字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='parent_id') THEN
    ALTER TABLE users ADD COLUMN parent_id UUID REFERENCES users(id);
  END IF;
END $$;

-- 添加network_side字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='network_side') THEN
    ALTER TABLE users ADD COLUMN network_side VARCHAR(1) CHECK (network_side IN ('A', 'B'));
  END IF;
END $$;

-- 添加a_side_sales字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='a_side_sales') THEN
    ALTER TABLE users ADD COLUMN a_side_sales INT DEFAULT 0;
  END IF;
END $$;

-- 添加b_side_sales字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='b_side_sales') THEN
    ALTER TABLE users ADD COLUMN b_side_sales INT DEFAULT 0;
  END IF;
END $$;

-- 添加a_side_settled字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='a_side_settled') THEN
    ALTER TABLE users ADD COLUMN a_side_settled INT DEFAULT 0;
  END IF;
END $$;

-- 添加b_side_settled字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='b_side_settled') THEN
    ALTER TABLE users ADD COLUMN b_side_settled INT DEFAULT 0;
  END IF;
END $$;

-- 添加total_pairing_bonus字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='total_pairing_bonus') THEN
    ALTER TABLE users ADD COLUMN total_pairing_bonus DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- 添加total_level_bonus字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='total_level_bonus') THEN
    ALTER TABLE users ADD COLUMN total_level_bonus DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- 添加total_dividend字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='total_dividend') THEN
    ALTER TABLE users ADD COLUMN total_dividend DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- 添加is_unlocked字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='is_unlocked') THEN
    ALTER TABLE users ADD COLUMN is_unlocked BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 添加reinvestment_count字段
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='reinvestment_count') THEN
    ALTER TABLE users ADD COLUMN reinvestment_count INT DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 2. 添加索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_network_side ON users(network_side);
CREATE INDEX IF NOT EXISTS idx_users_qualified_dividend ON users(qualified_for_dividend) WHERE qualified_for_dividend = TRUE;

-- ============================================
-- 3. 创建对碰奖记录表
-- ============================================

CREATE TABLE IF NOT EXISTS pairing_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pairs_count INT NOT NULL,
  bonus_amount DECIMAL(10,2) NOT NULL,
  a_side_before INT NOT NULL,
  b_side_before INT NOT NULL,
  a_side_after INT NOT NULL,
  b_side_after INT NOT NULL,
  settlement_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pairing_user ON pairing_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_pairing_date ON pairing_bonuses(settlement_date DESC);

COMMENT ON TABLE pairing_bonuses IS '对碰奖记录表';

-- ============================================
-- 4. 创建平级奖记录表
-- ============================================

CREATE TABLE IF NOT EXISTS level_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INT NOT NULL CHECK (level BETWEEN 1 AND 3),
  bonus_amount DECIMAL(10,2) NOT NULL,
  pairing_bonus_id UUID REFERENCES pairing_bonuses(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_level_bonus_user ON level_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_level_bonus_from ON level_bonuses(from_user_id);
CREATE INDEX IF NOT EXISTS idx_level_bonus_date ON level_bonuses(created_at DESC);

COMMENT ON TABLE level_bonuses IS '平级奖记录表';

-- ============================================
-- 5. 创建分红记录表
-- ============================================

CREATE TABLE IF NOT EXISTS dividend_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dividend_amount DECIMAL(10,2) NOT NULL,
  total_pool DECIMAL(10,2) NOT NULL,
  qualified_members INT NOT NULL,
  settlement_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dividend_user ON dividend_records(user_id);
CREATE INDEX IF NOT EXISTS idx_dividend_date ON dividend_records(settlement_date DESC);

COMMENT ON TABLE dividend_records IS '分红记录表';

-- ============================================
-- 6. 更新transactions表 - 添加新字段
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='fee') THEN
    ALTER TABLE transactions ADD COLUMN fee DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='balance_after') THEN
    ALTER TABLE transactions ADD COLUMN balance_after DECIMAL(10,2);
  END IF;
END $$;

-- ============================================
-- 7. 创建辅助函数
-- ============================================

-- 增量更新函数
CREATE OR REPLACE FUNCTION increment(current_value DECIMAL, amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE(current_value, 0) + amount;
END;
$$ LANGUAGE plpgsql;

-- 更新区域销售数函数
CREATE OR REPLACE FUNCTION increment_side_sales(
  user_id UUID,
  side VARCHAR(1),
  amount INT
)
RETURNS void AS $$
BEGIN
  IF side = 'a' THEN
    UPDATE users SET a_side_sales = a_side_sales + amount WHERE id = user_id;
  ELSIF side = 'b' THEN
    UPDATE users SET b_side_sales = b_side_sales + amount WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 更新直推数函数
CREATE OR REPLACE FUNCTION increment_referral_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET direct_referral_count = direct_referral_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. 验证迁移
-- ============================================

DO $$
DECLARE
  column_count INTEGER;
  table_count INTEGER;
BEGIN
  -- 验证users表新字段
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'users' 
    AND column_name IN ('parent_id', 'network_side', 'a_side_sales', 'b_side_sales', 
                        'a_side_settled', 'b_side_settled', 'total_pairing_bonus', 
                        'total_level_bonus', 'total_dividend', 'is_unlocked', 'reinvestment_count');
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ users表新增字段数: %', column_count;
  
  IF column_count = 11 THEN
    RAISE NOTICE '✅ users表迁移成功！';
  ELSE
    RAISE WARNING '⚠️ users表字段数不完整，预期11个，实际%个', column_count;
  END IF;
  
  -- 验证新表创建
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_name IN ('pairing_bonuses', 'level_bonuses', 'dividend_records');
  
  RAISE NOTICE '✅ 新增表数量: %', table_count;
  
  IF table_count = 3 THEN
    RAISE NOTICE '✅ 新表创建成功！';
  ELSE
    RAISE WARNING '⚠️ 新表数量不完整，预期3个，实际%个', table_count;
  END IF;
  
  -- 最终总结
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '  🎉 双区对碰系统 - 数据库迁移完成！';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ users表: 新增11个字段';
  RAISE NOTICE '✅ pairing_bonuses表: 对碰奖记录';
  RAISE NOTICE '✅ level_bonuses表: 平级奖记录';
  RAISE NOTICE '✅ dividend_records表: 分红记录';
  RAISE NOTICE '✅ 辅助函数: 3个';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 下一步: 在应用中调用NetworkService API';
  RAISE NOTICE '';
END $$;
































