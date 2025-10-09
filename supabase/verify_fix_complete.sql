-- 验证修复是否完全成功
SELECT 
  username,
  u_balance,
  transfer_points,
  points_balance,
  mining_points,
  created_at
FROM users 
WHERE invite_code = 'EHPHR0AI';

-- 查看释放历史记录
SELECT 
  type,
  amount,
  description,
  created_at
FROM transactions
WHERE user_id = (SELECT id FROM users WHERE invite_code = 'EHPHR0AI')
  AND type = 'mining_release'
ORDER BY created_at DESC
LIMIT 10;

