-- ========================================
-- 数据诊断与修复脚本 - boss账号专用
-- ========================================

-- 第一步：诊断 boss 账号数据
-- ========================================

-- 1. 查看boss的基本信息
SELECT 
  id,
  username,
  is_agent,
  u_balance,
  transfer_points,
  created_at
FROM users 
WHERE username = 'boss';

-- 2. 查看boss的直推关系（referral_relationships表）
SELECT 
  rr.id,
  rr.referrer_id,
  rr.referee_id,
  rr.is_active,
  rr.created_at,
  u.username as referee_username,
  u.is_agent as referee_is_agent
FROM referral_relationships rr
LEFT JOIN users u ON u.id = rr.referee_id
WHERE rr.referrer_id = (SELECT id FROM users WHERE username = 'boss');

-- 3. 查看boss的旧推荐关系（users.inviter_id字段）
SELECT 
  id,
  username,
  is_agent,
  inviter_id,
  created_at
FROM users
WHERE inviter_id = (SELECT id FROM users WHERE username = 'boss');

-- 4. 查看boss的Binary系统信息
SELECT 
  user_id,
  upline_id,
  network_side,
  a_side_count,
  b_side_count,
  total_pairing_bonus,
  is_active
FROM binary_members
WHERE user_id = (SELECT id FROM users WHERE username = 'boss');

-- 5. 查看boss的学习卡（如果有learning_cards表）
-- SELECT 
--   id,
--   user_id,
--   total_points,
--   released_points,
--   status,
--   last_checkin_date,
--   base_rate,
--   boost_rate,
--   created_at
-- FROM learning_cards
-- WHERE user_id = (SELECT id FROM users WHERE username = 'boss');


-- ========================================
-- 第二步：修复数据（根据诊断结果执行）
-- ========================================

-- 修复1：如果 referral_relationships 为空，但 inviter_id 有数据
-- 则将 inviter_id 关系迁移到 referral_relationships
INSERT INTO referral_relationships (referrer_id, referee_id, is_active, created_at)
SELECT 
  inviter_id as referrer_id,
  id as referee_id,
  TRUE as is_active,
  created_at
FROM users
WHERE inviter_id = (SELECT id FROM users WHERE username = 'boss')
  AND is_agent = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM referral_relationships 
    WHERE referrer_id = users.inviter_id 
    AND referee_id = users.id
  );

-- 修复2：确保boss的直推下级在referral_relationships中都是活跃状态
UPDATE referral_relationships
SET is_active = TRUE
WHERE referrer_id = (SELECT id FROM users WHERE username = 'boss')
  AND referee_id IN (
    SELECT id FROM users 
    WHERE inviter_id = (SELECT id FROM users WHERE username = 'boss')
    AND is_agent = TRUE
  );


-- ========================================
-- 第三步：验证修复结果
-- ========================================

-- 验证1：查看boss现在有多少直推
SELECT 
  COUNT(*) as total_referrals,
  COUNT(CASE WHEN u.is_agent = TRUE THEN 1 END) as agent_referrals
FROM referral_relationships rr
LEFT JOIN users u ON u.id = rr.referee_id
WHERE rr.referrer_id = (SELECT id FROM users WHERE username = 'boss')
  AND rr.is_active = TRUE;

-- 验证2：列出所有直推下级
SELECT 
  u.username,
  u.is_agent,
  u.created_at as user_created_at,
  rr.created_at as relationship_created_at
FROM referral_relationships rr
LEFT JOIN users u ON u.id = rr.referee_id
WHERE rr.referrer_id = (SELECT id FROM users WHERE username = 'boss')
  AND rr.is_active = TRUE
ORDER BY rr.created_at DESC;

-- 验证3：检查boss的直推释放率（应该根据直推人数计算）
SELECT 
  (SELECT COUNT(*) FROM referral_relationships 
   WHERE referrer_id = (SELECT id FROM users WHERE username = 'boss')
   AND is_active = TRUE) as direct_referrals,
  (0.01 + LEAST((SELECT COUNT(*) FROM referral_relationships 
                 WHERE referrer_id = (SELECT id FROM users WHERE username = 'boss')
                 AND is_active = TRUE) * 0.03, 0.14)) as release_rate,
  ((0.01 + LEAST((SELECT COUNT(*) FROM referral_relationships 
                  WHERE referrer_id = (SELECT id FROM users WHERE username = 'boss')
                  AND is_active = TRUE) * 0.03, 0.14)) * 100) as release_rate_percentage;

