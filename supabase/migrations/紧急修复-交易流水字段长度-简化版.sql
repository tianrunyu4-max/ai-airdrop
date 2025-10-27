-- ==========================================
-- 🚨 紧急修复：交易流水字段长度问题
-- ==========================================
-- 错误：value too long for type character varying(10)
-- 原因：description字段只有10个字符
-- 解决：扩展所有可能太短的字段
-- ==========================================

-- 1. 修复transactions表的字段长度
ALTER TABLE IF EXISTS transactions 
  ALTER COLUMN description TYPE VARCHAR(500),
  ALTER COLUMN type TYPE VARCHAR(100),
  ALTER COLUMN currency TYPE VARCHAR(50);

-- 2. 修复user_transactions表（如果存在）
ALTER TABLE IF EXISTS user_transactions 
  ALTER COLUMN description TYPE VARCHAR(500),
  ALTER COLUMN type TYPE VARCHAR(100);

-- 3. 检查是否需要创建transactions表
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  balance_after DECIMAL(20, 2),
  description VARCHAR(500),
  related_user_id UUID,
  currency VARCHAR(50) DEFAULT 'U',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- 5. 启用RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 6. 创建RLS策略
DROP POLICY IF EXISTS "用户查看自己的交易" ON transactions;
CREATE POLICY "用户查看自己的交易" ON transactions
  FOR SELECT
  USING (user_id::text = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "系统创建交易记录" ON transactions;
CREATE POLICY "系统创建交易记录" ON transactions
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "管理员查看所有交易" ON transactions;
CREATE POLICY "管理员查看所有交易" ON transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = (SELECT auth.uid()::text)
      AND users.is_admin = TRUE
    )
  );

-- 完成
SELECT '✅ 交易流水表字段长度已修复' AS status;

