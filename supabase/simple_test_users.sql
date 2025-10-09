-- ═══════════════════════════════════════
-- 超简化测试用户创建脚本
-- 只创建用户，不涉及其他复杂表
-- ═══════════════════════════════════════

-- 1. 创建测试用户 test_admin
INSERT INTO users (username, is_agent, u_balance, points_balance, invite_code, direct_referral_count)
VALUES ('test_admin', true, 100, 0, 'ADMIN001', 2)
ON CONFLICT (username) DO UPDATE 
SET u_balance = 100, points_balance = 0, direct_referral_count = 2;

-- 2. 创建测试用户 test_user1
INSERT INTO users (username, is_agent, u_balance, points_balance, invite_code, direct_referral_count, parent_id)
VALUES ('test_user1', true, 100, 0, 'USER0001', 0, (SELECT id FROM users WHERE username = 'test_admin'))
ON CONFLICT (username) DO UPDATE 
SET u_balance = 100, points_balance = 0, parent_id = (SELECT id FROM users WHERE username = 'test_admin');

-- 3. 创建测试用户 test_user2
INSERT INTO users (username, is_agent, u_balance, points_balance, invite_code, direct_referral_count, parent_id)
VALUES ('test_user2', true, 100, 0, 'USER0002', 0, (SELECT id FROM users WHERE username = 'test_admin'))
ON CONFLICT (username) DO UPDATE 
SET u_balance = 100, points_balance = 0, parent_id = (SELECT id FROM users WHERE username = 'test_admin');

-- 4. 查看创建结果
SELECT 
  username,
  invite_code,
  u_balance,
  points_balance,
  direct_referral_count,
  is_agent
FROM users
WHERE username LIKE 'test_%'
ORDER BY username;

-- ═══════════════════════════════════════
-- ✅ 完成！
-- 
-- 测试用户已创建：
--   • test_admin (余额: 100U, 邀请码: ADMIN001)
--   • test_user1 (余额: 100U, 邀请码: USER0001)  
--   • test_user2 (余额: 100U, 邀请码: USER0002)
--
-- 下一步：
-- 访问 http://localhost:3000
-- 通过注册页面为这些用户设置密码
-- 或者直接在 Supabase Auth 中添加认证
-- ═══════════════════════════════════════

