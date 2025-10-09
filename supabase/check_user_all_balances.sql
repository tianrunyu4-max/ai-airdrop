-- 查询用户的完整余额和积分数据
SELECT 
  id, 
  username,
  invite_code,
  u_balance,
  points_balance,
  transfer_points,
  mining_points,
  created_at
FROM users 
WHERE invite_code = 'EHPHR0AI';

