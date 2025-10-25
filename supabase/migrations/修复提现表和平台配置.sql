-- ==========================================
-- 修复提现表和平台配置
-- ==========================================

-- 1. 修复withdrawals表 - 添加created_at字段
ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 为已有记录补充created_at（如果为空）
UPDATE public.withdrawals
SET created_at = NOW()
WHERE created_at IS NULL;

-- 2. 添加其他可能缺失的字段
ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id);

-- 3. 创建索引（提高查询性能）
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at 
ON public.withdrawals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_created 
ON public.withdrawals(user_id, created_at DESC);

-- 4. 配置平台联系方式
INSERT INTO system_config (key, value, description)
VALUES (
  'platform_contacts',
  jsonb_build_object(
    'wechat', '待设置',
    'telegram', '待设置',
    'email', 'support@ai-airdrop.top',
    'customer_service_hours', '24/7在线',
    'response_time', '5分钟内响应'
  ),
  '平台联系方式配置'
)
ON CONFLICT (key) DO UPDATE
SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- 5. 确保system_config表有updated_at字段
ALTER TABLE public.system_config 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 6. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为withdrawals表添加触发器
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON public.withdrawals;
CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON public.withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为system_config表添加触发器
DROP TRIGGER IF EXISTS update_system_config_updated_at ON public.system_config;
CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON public.system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 验证修复结果
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'withdrawals'
  AND column_name IN ('created_at', 'updated_at', 'processed_at', 'processed_by')
ORDER BY column_name;

-- 验证平台配置
SELECT key, value, description
FROM system_config
WHERE key = 'platform_contacts';

-- ==========================================
-- 执行完成后应该看到：
-- created_at    | timestamp with time zone | NO
-- processed_at  | timestamp with time zone | YES
-- processed_by  | uuid                     | YES
-- updated_at    | timestamp with time zone | NO
-- ==========================================

