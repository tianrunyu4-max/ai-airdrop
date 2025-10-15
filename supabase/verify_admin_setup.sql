-- ====================================
-- 验证并修复管理员设置
-- ====================================

-- 1. 查看admin用户完整信息
SELECT 
  id,
  username,
  invite_code,
  is_agent,
  is_admin,
  u_balance,
  transfer_points,
  created_at
FROM users
WHERE username = 'admin';

-- 2. 如果is_admin不是true，再次设置
UPDATE users
SET 
  is_admin = true,
  is_agent = true,
  u_balance = GREATEST(u_balance, 1000),
  transfer_points = GREATEST(transfer_points, 1000)
WHERE username = 'admin';

-- 3. 验证auth.users中的数据
SELECT 
  id,
  email,
  raw_user_meta_data->>'username' as username,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'username' = 'admin';

-- 4. 查看所有管理员
SELECT 
  username,
  is_admin,
  is_agent,
  u_balance
FROM users
WHERE is_admin = true
ORDER BY created_at;

















