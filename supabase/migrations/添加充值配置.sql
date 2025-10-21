-- ==========================================
-- 添加充值地址配置
-- ==========================================

-- 在 system_config 表中添加充值配置
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

-- 创建充值记录表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recharge_user ON recharge_records(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_status ON recharge_records(status);
CREATE INDEX IF NOT EXISTS idx_recharge_created ON recharge_records(created_at DESC);

-- 启用 RLS
ALTER TABLE recharge_records ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看自己的充值记录
CREATE POLICY "用户查看自己的充值记录" ON recharge_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 策略：用户可以创建充值记录
CREATE POLICY "用户创建充值记录" ON recharge_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略：管理员查看所有充值记录
CREATE POLICY "管理员查看所有充值记录" ON recharge_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS 策略：管理员确认充值
CREATE POLICY "管理员确认充值" ON recharge_records
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 查看配置
SELECT * FROM system_config WHERE key = 'recharge_config';

