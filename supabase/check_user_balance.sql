-- 查询用户的余额和积分详情
-- 复制下面的SQL到Supabase执行

SELECT 
  id, 
  username, 
  balance, 
  points, 
  transferable_points,
  created_at
FROM users 
WHERE invite_code = 'EHPHR0AI';

