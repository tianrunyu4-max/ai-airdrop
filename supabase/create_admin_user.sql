-- 第一步：先在 Authentication → Users 中手动创建用户
-- Email: admin@airdrop.app
-- Password: admin123
-- Auto Confirm: 勾选

-- 第二步：创建后复制UUID，然后执行下面的SQL（替换UUID）

-- 删除旧的admin记录（如果存在）
DELETE FROM users WHERE username = 'admin';

-- 插入新的admin记录（请将下面的UUID替换为你刚才复制的真实UUID）
INSERT INTO users (
  id,
  username,
  invite_code,
  inviter_id,
  is_agent,
  is_admin,
  u_balance,
  points_balance,
  mining_points,
  transfer_points,
  direct_referral_count,
  total_earnings,
  qualified_for_dividend,
  language,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',  -- ⚠️ 替换为真实UUID
  'admin',
  'AI8K3Q9Z',
  NULL,
  true,
  true,
  100,
  500,
  500,
  0,
  0,
  0,
  false,
  'zh',
  NOW()
);

-- 验证插入成功
SELECT id, username, invite_code, is_admin FROM users WHERE username = 'admin';


































