-- ====================================
-- 将admin用户升级为超级管理员
-- ====================================

-- 设置admin为超级管理员
UPDATE users
SET 
  qualified_for_is_admin = true,      -- 开启管理员权限 ⭐
  u_balance = u_balance + 900,        -- 额外赠送900U（总共1000U）
  transfer_points = transfer_points + 1000  -- 赠送1000互转积分
WHERE username = 'admin';

-- ====================================
-- 验证设置是否成功
-- ====================================
SELECT 
  username,
  invite_code,
  is_agent,
  qualified_for_is_admin as is_admin,
  u_balance,
  transfer_points,
  direct_refer,
  created_at
FROM users
WHERE username = 'admin';

-- ====================================
-- 查看所有管理员
-- ====================================
SELECT 
  username,
  invite_code,
  qualified_for_is_admin as is_admin,
  is_agent,
  u_balance,
  direct_refer
FROM users
WHERE qualified_for_is_admin = true
ORDER BY created_at;



































