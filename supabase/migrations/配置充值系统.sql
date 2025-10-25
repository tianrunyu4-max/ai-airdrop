-- ==========================================
-- 配置充值系统（TRC20 + BEP20）
-- ==========================================

-- 1. 插入或更新充值配置
INSERT INTO system_config (key, value, description)
VALUES (
  'recharge_config',
  jsonb_build_object(
    'usdt_trc20', 'TQTjfehUeHRWkw7QkcRKojWYdzYPebr9iS',  -- ✅ TRC20波场链地址
    'usdt_bep20', '0xc8288b98f7c2cc11bccbc033754effcc87c1909e',  -- ✅ BEP20币安智能链地址
    'enable_recharge', true,
    'min_amount', 30,  -- ✅ 最低充值30U
    'notice', '💡 充值说明：\n1. 认真核对充值地址\n2. 30U起步\n3. AI自动审核 稍等片刻'
  ),
  '充值系统配置（TRC20波场链 + BEP20币安智能链）'
)
ON CONFLICT (key) DO UPDATE
SET 
  value = jsonb_build_object(
    'usdt_trc20', 'TQTjfehUeHRWkw7QkcRKojWYdzYPebr9iS',  -- ✅ TRC20波场链地址
    'usdt_bep20', '0xc8288b98f7c2cc11bccbc033754effcc87c1909e',  -- ✅ BEP20币安智能链地址
    'enable_recharge', true,
    'min_amount', 30,  -- ✅ 最低充值30U
    'notice', '💡 充值说明：\n1. 认真核对充值地址\n2. 30U起步\n3. AI自动审核 稍等片刻'
  ),
  updated_at = NOW();

-- 2. 查看当前配置
SELECT 
  key,
  value,
  description,
  created_at,
  updated_at
FROM system_config
WHERE key = 'recharge_config';

-- ==========================================
-- 📝 使用说明
-- ==========================================
-- 
-- ✅ 修改充值地址：
-- 1. 复制上面的SQL
-- 2. 把 '请在这里填写你的TRC20地址' 替换为你的真实TRC20地址
-- 3. 把 '请在这里填写你的BEP20地址' 替换为你的真实BEP20地址
-- 4. 在 Supabase SQL Editor 中执行
-- 
-- 示例（请替换为你的真实地址）：
-- 'usdt_trc20', 'TXyz123...',
-- 'usdt_bep20', '0xabc456...',
-- 
-- ==========================================

