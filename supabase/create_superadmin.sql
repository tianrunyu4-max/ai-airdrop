-- ====================================
-- 创建超级管理员账户
-- ====================================

-- 方案A：重置admin密码为 admin123
UPDATE auth.users
SET 
  encrypted_password = crypt('admin123', gen_salt('bf')),
  email_confirmed_at = NOW(),
  confirmation_token = NULL
WHERE raw_user_meta_data->>'username' = 'admin';

-- 验证密码重置
SELECT 
  id,
  raw_user_meta_data->>'username' as username,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'username' = 'admin';

-- ====================================
-- 方案B：如果上面不行，直接修改public.users表
-- 为admin用户设置一个简单的标识
-- ====================================

UPDATE users
SET 
  is_admin = true,
  is_agent = true,
  u_balance = 10000,  -- 赠送10000U测试余额
  transfer_points = 10000  -- 赠送10000积分
WHERE username = 'admin';

-- 验证public.users设置
SELECT 
  id,
  username,
  invite_code,
  is_admin,
  is_agent,
  u_balance,
  transfer_points
FROM users
WHERE username = 'admin';

-- ====================================
-- 登录信息
-- ====================================
-- 用户名: admin
-- 新密码: admin123
-- ====================================





















