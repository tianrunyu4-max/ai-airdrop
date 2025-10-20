-- ====================================
-- 设置管理员账号（使用正确的字段名）
-- ====================================

-- 方案1：将"行政"设置为管理员
UPDATE users
SET 
  qualified_for_is_admin = true,  -- 管理员标记
  is_agent = true,                -- AI代理资格
  u_balance = u_balance + 1000    -- 赠送1000U余额（可选）
WHERE username = '行政';

-- 方案2：将"520"设置为管理员
UPDATE users
SET 
  qualified_for_is_admin = true,
  is_agent = true,
  u_balance = u_balance + 1000
WHERE username = '520';

-- ====================================
-- 验证设置是否成功
-- ====================================
SELECT 
  id,
  username,
  invite_code,
  is_agent,
  qualified_for_is_admin as is_admin,
  u_balance,
  transfer_points,
  created_at
FROM users
WHERE qualified_for_is_admin = true
ORDER BY created_at DESC;

-- ====================================
-- 密码重置说明
-- ====================================
-- 注意：密码存储在 auth.users 表中，不在 public.users 中
-- 如需重置密码，请执行以下操作：

-- 1. 在Supabase Dashboard找到对应的auth.users记录
-- 2. 或使用以下SQL查看auth用户：
SELECT id, email, raw_user_meta_data->>'username' as username
FROM auth.users
WHERE raw_user_meta_data->>'username' IN ('行政', '520');

-- 3. 通过Supabase Dashboard的"Reset password"功能重置密码
-- 或使用Supabase提供的密码重置API

-- ====================================
-- 查看所有AI代理
-- ====================================
SELECT 
  username,
  invite_code,
  is_agent,
  qualified_for_is_admin as is_admin,
  u_balance,
  direct_refer as direct_referrals
FROM users
WHERE is_agent = true
ORDER BY created_at;
































