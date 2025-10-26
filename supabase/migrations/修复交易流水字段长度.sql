-- ==========================================
-- 🔧 修复交易流水表字段长度问题
-- ==========================================
-- 问题：description字段只有10个字符，导致流水记录失败
-- 解决：扩展到500个字符
-- ==========================================

-- 1. 检查并修改transactions表的description字段长度
DO $$ 
BEGIN
  -- 检查表是否存在
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'transactions'
  ) THEN
    -- 扩展description字段到500字符
    ALTER TABLE transactions 
    ALTER COLUMN description TYPE VARCHAR(500);
    
    RAISE NOTICE '✅ transactions表description字段已扩展到500字符';
  ELSE
    -- 如果表不存在，创建表
    CREATE TABLE transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      type VARCHAR(50) NOT NULL,
      amount DECIMAL(20, 2) NOT NULL,
      balance_after DECIMAL(20, 2),
      description VARCHAR(500),
      related_user_id UUID,
      currency VARCHAR(20) DEFAULT 'U',
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- 创建索引
    CREATE INDEX idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
    CREATE INDEX idx_transactions_type ON transactions(type);
    
    RAISE NOTICE '✅ 创建transactions表成功';
  END IF;
END $$;

-- 2. 确保user_transactions表（如果存在）也有足够的字段长度
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_transactions'
  ) THEN
    ALTER TABLE user_transactions 
    ALTER COLUMN description TYPE VARCHAR(500);
    
    RAISE NOTICE '✅ user_transactions表description字段已扩展到500字符';
  END IF;
END $$;

-- 3. 创建或替换RLS策略
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的交易记录
DROP POLICY IF EXISTS "用户查看自己的交易" ON transactions;
CREATE POLICY "用户查看自己的交易" ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的交易记录
DROP POLICY IF EXISTS "用户创建交易记录" ON transactions;
CREATE POLICY "用户创建交易记录" ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 管理员可以查看所有交易
DROP POLICY IF EXISTS "管理员查看所有交易" ON transactions;
CREATE POLICY "管理员查看所有交易" ON transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- 4. 添加注释
COMMENT ON TABLE transactions IS '用户交易流水记录表';
COMMENT ON COLUMN transactions.description IS '交易描述（最长500字符）';
COMMENT ON COLUMN transactions.currency IS '货币类型：U=U余额，POINTS=总积分，TRANSFER_POINTS=互转积分';

