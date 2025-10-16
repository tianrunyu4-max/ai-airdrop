-- ============================================
-- 双区对碰奖励系统 - 数据库迁移脚本
-- 
-- 功能：
-- 1. 为users表添加双区系统字段
-- 2. 创建对碰奖记录表
-- 3. 创建平级奖记录表
-- 4. 创建分红记录表
-- 5. 更新referral_chain表结构
-- 
-- 使用方法：
-- 1. 登录 Supabase Dashboard
-- 2. 进入 SQL Editor
-- 3. 复制粘贴此脚本
-- 4. 点击 Run 执行
-- ============================================

-- ============================================
-- 1. 更新users表 - 添加双区系统字段
-- ============================================

-- 添加双区系统核心字段
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS network_side VARCHAR(1) CHECK (network_side IN ('A', 'B'));

-- 添加业绩统计字段
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS a_side_sales INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS b_side_sales INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS a_side_settled INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS b_side_settled INT DEFAULT 0;

-- 添加收益统计字段
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS total_pairing_bonus DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_level_bonus DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_dividend DECIMAL(10,2) DEFAULT 0;

-- 添加状态字段
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reinvestment_count INT DEFAULT 0;

-- 添加新索引
CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_network_side ON users(network_side);
CREATE INDEX IF NOT EXISTS idx_users_qualified_dividend ON users(qualified_for_dividend) WHERE qualified_for_dividend = TRUE;

-- ============================================
-- 2. 更新referral_chain表 - 简化为3代
-- ============================================

-- 删除不需要的第4、5代字段（如果存在）
ALTER TABLE referral_chain DROP COLUMN IF EXISTS level_4_upline;
ALTER TABLE referral_chain DROP COLUMN IF EXISTS level_5_upline;

-- ============================================
-- 3. 创建对碰奖记录表
-- ============================================

CREATE TABLE IF NOT EXISTS pairing_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pairs_count INT NOT NULL,                  -- 对碰组数
  bonus_amount DECIMAL(10,2) NOT NULL,       -- 奖金金额（组数×7U×85%）
  a_side_before INT NOT NULL,                -- 结算前A区单数
  b_side_before INT NOT NULL,                -- 结算前B区单数
  a_side_after INT NOT NULL,                 -- 结算后A区单数
  b_side_after INT NOT NULL,                 -- 结算后B区单数
  settlement_date DATE NOT NULL,             -- 结算日期
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_pairing_user ON pairing_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_pairing_date ON pairing_bonuses(settlement_date DESC);

-- 注释
COMMENT ON TABLE pairing_bonuses IS '对碰奖记录表';
COMMENT ON COLUMN pairing_bonuses.pairs_count IS '对碰组数（取A/B区小区业绩）';
COMMENT ON COLUMN pairing_bonuses.bonus_amount IS '实际到账金额（会员收益85%）';

-- ============================================
-- 4. 创建平级奖记录表
-- ============================================

CREATE TABLE IF NOT EXISTS level_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,      -- 获得奖励的上级
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 触发奖励的下级
  level INT NOT NULL CHECK (level BETWEEN 1 AND 3),         -- 第几代（1-3）
  bonus_amount DECIMAL(10,2) NOT NULL,                      -- 奖金金额（固定2U）
  pairing_bonus_id UUID REFERENCES pairing_bonuses(id),     -- 关联的对碰奖记录
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_level_bonus_user ON level_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_level_bonus_from ON level_bonuses(from_user_id);
CREATE INDEX IF NOT EXISTS idx_level_bonus_date ON level_bonuses(created_at DESC);

-- 注释
COMMENT ON TABLE level_bonuses IS '平级奖记录表';
COMMENT ON COLUMN level_bonuses.level IS '第几代上级（1=第1代，2=第2代，3=第3代）';
COMMENT ON COLUMN level_bonuses.bonus_amount IS '固定2U/人';

-- ============================================
-- 5. 创建分红记录表
-- ============================================

CREATE TABLE IF NOT EXISTS dividend_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dividend_amount DECIMAL(10,2) NOT NULL,    -- 分红金额
  total_pool DECIMAL(10,2) NOT NULL,         -- 总分红池
  qualified_members INT NOT NULL,            -- 符合条件会员数
  settlement_date DATE NOT NULL,             -- 结算日期
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_dividend_user ON dividend_records(user_id);
CREATE INDEX IF NOT EXISTS idx_dividend_date ON dividend_records(settlement_date DESC);

-- 注释
COMMENT ON TABLE dividend_records IS '分红记录表';
COMMENT ON COLUMN dividend_records.total_pool IS '分红池总额（对碰奖15%部分）';
COMMENT ON COLUMN dividend_records.qualified_members IS '直推≥10人的会员数';

-- ============================================
-- 6. 更新transactions表 - 添加新字段
-- ============================================

-- 添加fee和balance_after字段（如果不存在）
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS fee DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_after DECIMAL(10,2);

-- ============================================
-- 7. 创建辅助函数
-- ============================================

-- 增量更新函数（用于增加数值字段）
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

-- 验证users表新字段
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'users' 
    AND column_name IN ('parent_id', 'network_side', 'a_side_sales', 'b_side_sales', 
                        'a_side_settled', 'b_side_settled', 'total_pairing_bonus', 
                        'total_level_bonus', 'total_dividend', 'is_unlocked', 'reinvestment_count');
  
  RAISE NOTICE '✅ users表新增字段数: %', column_count;
  
  IF column_count = 11 THEN
    RAISE NOTICE '✅ users表迁移成功！';
  ELSE
    RAISE WARNING '⚠️ users表字段数不完整，预期11个，实际%个', column_count;
  END IF;
END $$;

-- 验证新表创建
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_name IN ('pairing_bonuses', 'level_bonuses', 'dividend_records');
  
  RAISE NOTICE '✅ 新增表数量: %', table_count;
  
  IF table_count = 3 THEN
    RAISE NOTICE '✅ 新表创建成功！';
  ELSE
    RAISE WARNING '⚠️ 新表数量不完整，预期3个，实际%个', table_count;
  END IF;
END $$;

-- ============================================
-- 迁移完成
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  🎉 双区对碰系统 - 数据库迁移完成！         ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ users表: 新增11个字段';
  RAISE NOTICE '✅ pairing_bonuses表: 对碰奖记录';
  RAISE NOTICE '✅ level_bonuses表: 平级奖记录';
  RAISE NOTICE '✅ dividend_records表: 分红记录';
  RAISE NOTICE '✅ 辅助函数: 3个';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 下一步: 在应用中调用NetworkService API';
END $$;






















