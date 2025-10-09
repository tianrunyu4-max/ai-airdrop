-- ═══════════════════════════════════════
-- 安全重建测试数据（处理重复问题）
-- ═══════════════════════════════════════

-- 方案：使用 ON CONFLICT 更新现有数据

-- 1. 创建/更新测试管理员
INSERT INTO users (username, is_agent, u_balance, points_balance, invite_code, direct_referral_count)
VALUES ('测试管理员', true, 100, 0, 'ADMIN001', 2)
ON CONFLICT (username) DO UPDATE 
SET 
  u_balance = 100,
  points_balance = 0,
  direct_referral_count = 2,
  invite_code = 'ADMIN001',
  is_agent = true;

-- 2. 创建/更新测试用户1
INSERT INTO users (username, is_agent, u_balance, points_balance, invite_code, direct_referral_count)
VALUES ('测试用户1', true, 100, 0, 'USER0001', 0)
ON CONFLICT (username) DO UPDATE 
SET 
  u_balance = 100,
  points_balance = 0,
  direct_referral_count = 0,
  invite_code = 'USER0001',
  is_agent = true;

-- 3. 创建/更新测试用户2
INSERT INTO users (username, is_agent, u_balance, points_balance, invite_code, direct_referral_count)
VALUES ('测试用户2', true, 100, 0, 'USER0002', 0)
ON CONFLICT (username) DO UPDATE 
SET 
  u_balance = 100,
  points_balance = 0,
  direct_referral_count = 0,
  invite_code = 'USER0002',
  is_agent = true;

-- 4. 设置邀请关系（安全方式）
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE username = '测试管理员';
  
  UPDATE users 
  SET parent_id = v_admin_id
  WHERE username IN ('测试用户1', '测试用户2');
END $$;

-- 5. 清理这些用户的旧测试数据
DELETE FROM mining_machines WHERE user_id IN (SELECT id FROM users WHERE username LIKE '测试%');
DELETE FROM binary_members WHERE user_id IN (SELECT id FROM users WHERE username LIKE '测试%');
DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE username LIKE '测试%');
DELETE FROM daily_releases WHERE user_id IN (SELECT id FROM users WHERE username LIKE '测试%');

-- 6. 查看最终结果
SELECT 
  username AS "用户名",
  invite_code AS "邀请码",
  u_balance AS "U余额",
  points_balance AS "积分余额",
  direct_referral_count AS "直推人数",
  CASE WHEN is_agent THEN '是' ELSE '否' END AS "是否代理",
  (SELECT username FROM users p WHERE p.id = users.parent_id) AS "上级"
FROM users
WHERE username LIKE '测试%'
ORDER BY username;

-- ═══════════════════════════════════════
-- ✅ 完成！
-- 
-- 测试数据已就绪：
--   • 测试管理员 (ADMIN001, 100U, 2直推)
--   • 测试用户1 (USER0001, 100U, 上级: 测试管理员)
--   • 测试用户2 (USER0002, 100U, 上级: 测试管理员)
-- 
-- 所有旧的测试数据已清理
-- 余额已重置为100U
-- 
-- 下一步：
-- 执行自动化测试脚本
-- supabase/automated_test.sql
-- ═══════════════════════════════════════

