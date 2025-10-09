-- ═══════════════════════════════════════
-- 快速测试数据准备脚本（修复版）
-- 用途：快速创建测试用户和测试数据
-- ═══════════════════════════════════════

-- 1. 创建3个测试用户（使用正确的字段名）
DO $$
DECLARE
  v_admin_id UUID;
  v_user1_id UUID;
  v_user2_id UUID;
BEGIN
  -- 创建 test_admin (创世用户)
  INSERT INTO users (username, is_agent, u_balance, points_balance, invite_code, direct_referral_count)
  VALUES ('test_admin', true, 100, 0, 'ADMIN001', 0)
  ON CONFLICT (username) DO UPDATE 
  SET u_balance = 100, points_balance = 0
  RETURNING id INTO v_admin_id;

  RAISE NOTICE '✅ test_admin 创建成功，ID: %', v_admin_id;

  -- 创建 test_user1 (test_admin的下线)
  INSERT INTO users (username, is_agent, u_balance, points_balance, invite_code, parent_id, direct_referral_count)
  VALUES ('test_user1', true, 100, 0, 'USER0001', v_admin_id, 0)
  ON CONFLICT (username) DO UPDATE 
  SET u_balance = 100, points_balance = 0, parent_id = v_admin_id
  RETURNING id INTO v_user1_id;

  RAISE NOTICE '✅ test_user1 创建成功，ID: %', v_user1_id;

  -- 创建 test_user2 (test_admin的下线)
  INSERT INTO users (username, is_agent, u_balance, points_balance, invite_code, parent_id, direct_referral_count)
  VALUES ('test_user2', true, 100, 0, 'USER0002', v_admin_id, 0)
  ON CONFLICT (username) DO UPDATE 
  SET u_balance = 100, points_balance = 0, parent_id = v_admin_id
  RETURNING id INTO v_user2_id;

  RAISE NOTICE '✅ test_user2 创建成功，ID: %', v_user2_id;

  -- 更新 test_admin 的直推人数
  UPDATE users 
  SET direct_referral_count = 2 
  WHERE id = v_admin_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════';
  RAISE NOTICE '✅ 测试用户创建成功！';
  RAISE NOTICE '════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '登录信息：';
  RAISE NOTICE '  • test_admin (余额: 100U, 邀请码: ADMIN001)';
  RAISE NOTICE '  • test_user1 (余额: 100U, 邀请码: USER0001)';
  RAISE NOTICE '  • test_user2 (余额: 100U, 邀请码: USER0002)';
  RAISE NOTICE '';
  RAISE NOTICE '注意：密码需要在前端注册时设置';
  RAISE NOTICE '或者在 Supabase Auth 中手动添加';
  RAISE NOTICE '';
END $$;

-- 2. 初始化分红池
INSERT INTO dividend_pool (id, balance, total_distributed)
VALUES ('00000000-0000-0000-0000-000000000000', 100, 0)
ON CONFLICT (id) DO UPDATE 
SET balance = 100;

-- 3. 查看创建的测试用户
SELECT 
  username,
  invite_code,
  u_balance,
  points_balance,
  direct_referral_count,
  is_agent,
  (SELECT username FROM users p WHERE p.id = users.parent_id) as parent
FROM users
WHERE username LIKE 'test_%'
ORDER BY username;

-- ═══════════════════════════════════════
-- 测试辅助查询（复制使用）
-- ═══════════════════════════════════════

-- 查看所有用户余额
-- SELECT username, u_balance, points_balance, direct_referral_count FROM users ORDER BY created_at DESC LIMIT 10;

-- 查看二元系统统计
-- SELECT u.username, bm.a_side_count, bm.b_side_count, bm.total_pairing_bonus, bm.total_level_bonus 
-- FROM binary_members bm JOIN users u ON u.id = bm.user_id;

-- 查看分红池
-- SELECT * FROM dividend_pool;

-- 查看学习机
-- SELECT u.username, mm.initial_points, mm.released_points, mm.is_active 
-- FROM mining_machines mm JOIN users u ON u.id = mm.user_id;

-- 给指定用户添加余额
-- UPDATE users SET u_balance = u_balance + 100 WHERE username = 'test_admin';

-- 重置测试数据
-- DELETE FROM mining_machines WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
-- DELETE FROM binary_members WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
-- DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
-- UPDATE users SET u_balance = 100, points_balance = 0 WHERE username LIKE 'test_%';

