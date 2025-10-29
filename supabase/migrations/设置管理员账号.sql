-- ✅ 将现有账号设置为管理员
-- 使用方法：
-- 1. 先让用户在前端发言创建账号（如：ABC12345）
-- 2. 在Supabase SQL编辑器中运行此脚本
-- 3. 将 'ABC12345' 替换为实际的用户名

-- 示例：将用户 ABC12345 设置为管理员
UPDATE users 
SET 
  is_admin = true,
  is_agent = true,
  u_balance = 10000,
  points_balance = 10000,
  mining_points = 10000
WHERE username = 'ABC12345';

-- 查询验证（检查是否设置成功）
SELECT 
  username,
  is_admin,
  is_agent,
  u_balance,
  created_at
FROM users 
WHERE username = 'ABC12345';

-- 💡 说明：
-- is_admin: 管理员权限（可以访问后台）
-- is_agent: AI代理权限（可以赚钱）
-- u_balance: 初始余额（可选，默认10000U）

