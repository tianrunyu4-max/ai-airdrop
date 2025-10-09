-- ============================================
-- 创建分红池表 - V3.0
-- 
-- 功能：存储分红池的所有入账记录
-- 规则：对碰奖的15%进入分红池
-- 
-- 使用方法：
-- 1. 登录 Supabase Dashboard
-- 2. 进入 SQL Editor → New Query
-- 3. 复制粘贴此脚本
-- 4. 点击 Run 执行
-- ============================================

-- ============================================
-- 1. 创建 dividend_pool 表
-- ============================================
CREATE TABLE IF NOT EXISTS dividend_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 金额和来源
  amount DECIMAL(20, 2) NOT NULL CHECK (amount > 0),
  source VARCHAR(50) NOT NULL,  -- 来源：pairing_bonus, system_fee 等
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 添加索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_dividend_pool_created ON dividend_pool(created_at);
CREATE INDEX IF NOT EXISTS idx_dividend_pool_source ON dividend_pool(source);

-- ============================================
-- 3. 启用 RLS（Row Level Security）
-- ============================================
ALTER TABLE dividend_pool ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有记录
CREATE POLICY "管理员可以查看分红池"
  ON dividend_pool FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- 系统可以插入记录（通过 service_role）
CREATE POLICY "系统可以添加到分红池"
  ON dividend_pool FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 4. 验证表结构
-- ============================================
DO $$
BEGIN
  -- 检查表是否创建成功
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'dividend_pool'
  ) THEN
    RAISE NOTICE '✅ dividend_pool 表创建成功！';
  ELSE
    RAISE EXCEPTION '❌ dividend_pool 表创建失败！';
  END IF;
  
  -- 显示表结构
  RAISE NOTICE '📊 表结构:';
  RAISE NOTICE '  - id: UUID (主键)';
  RAISE NOTICE '  - amount: DECIMAL(20,2) (金额)';
  RAISE NOTICE '  - source: VARCHAR(50) (来源)';
  RAISE NOTICE '  - created_at: TIMESTAMPTZ (创建时间)';
END $$;

-- ============================================
-- 5. 测试数据（可选）
-- ============================================
-- 取消下面的注释来插入测试数据
/*
INSERT INTO dividend_pool (amount, source) VALUES
  (100.00, 'pairing_bonus'),
  (50.50, 'system_fee'),
  (25.75, 'pairing_bonus');

SELECT * FROM dividend_pool;
*/

-- ============================================
-- 完成！
-- ============================================

