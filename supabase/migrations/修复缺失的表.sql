-- ==========================================
-- 修复缺失的数据库表
-- ==========================================

-- 1. 创建签到记录表（如果不存在）
CREATE TABLE IF NOT EXISTS public.checkin_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  machine_id UUID,
  checkin_date DATE NOT NULL,
  points_released DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- 2. 创建充值记录表（如果不存在）
CREATE TABLE IF NOT EXISTS public.recharge_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USDT',
  network VARCHAR(20) NOT NULL,
  txid TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  proof_image TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id)
);

-- 3. 启用RLS
ALTER TABLE public.checkin_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharge_records ENABLE ROW LEVEL SECURITY;

-- 4. 创建RLS策略 - checkin_records
DROP POLICY IF EXISTS "用户可查看自己的签到记录" ON public.checkin_records;
CREATE POLICY "用户可查看自己的签到记录" ON public.checkin_records
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可创建自己的签到记录" ON public.checkin_records;
CREATE POLICY "用户可创建自己的签到记录" ON public.checkin_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. 创建RLS策略 - recharge_records
DROP POLICY IF EXISTS "用户可查看自己的充值记录" ON public.recharge_records;
CREATE POLICY "用户可查看自己的充值记录" ON public.recharge_records
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可创建充值记录" ON public.recharge_records;
CREATE POLICY "用户可创建充值记录" ON public.recharge_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "管理员可查看所有充值记录" ON public.recharge_records;
CREATE POLICY "管理员可查看所有充值记录" ON public.recharge_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

DROP POLICY IF EXISTS "管理员可更新充值记录" ON public.recharge_records;
CREATE POLICY "管理员可更新充值记录" ON public.recharge_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- 6. 创建索引（提高查询性能）
CREATE INDEX IF NOT EXISTS idx_checkin_records_user_id ON public.checkin_records(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_date ON public.checkin_records(checkin_date);
CREATE INDEX IF NOT EXISTS idx_recharge_records_user_id ON public.recharge_records(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_records_status ON public.recharge_records(status);
CREATE INDEX IF NOT EXISTS idx_recharge_records_created_at ON public.recharge_records(created_at DESC);

-- 7. 验证表已创建
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('checkin_records', 'recharge_records')
ORDER BY table_name;

-- ==========================================
-- 执行完成后应该看到：
-- checkin_records     | BASE TABLE
-- recharge_records    | BASE TABLE
-- ==========================================


