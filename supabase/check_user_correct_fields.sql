-- 使用正确的字段名查询用户数据
SELECT 
  id, 
  username, 
  u_balance, 
  u_points, 
  u_transferable_points,
  created_at
FROM users 
WHERE invite_code = 'EHPHR0AI';

