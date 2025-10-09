-- ═══════════════════════════════════════
-- 重新创建测试数据
-- 快速恢复测试环境
-- ═══════════════════════════════════════

-- 1. 清理旧数据（如果存在）
DELETE FROM binary_members WHERE user_id IN (SELECT id FROM users WHERE username LIKE '测试%');
DELETE FROM mining_machines WHERE user_id IN (SELECT id FROM users WHERE username LIKE '测试%');
DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE username LIKE '测试%');
DELETE FROM daily_releases WHERE user_id IN (SELECT id FROM users WHERE username LIKE '测试%');
DELETE FROM users WHERE username LIKE '测试%';

-- 2. 创建测试用户
INSERT INTO users (username, is_agent, u_balance, points_balance, invite_code, direct_referral_count)
VALUES 
  ('测试管理员', true, 100, 0, 'ADMIN001', 2),
  ('测试用户1', true, 100, 0, 'USER0001', 0),
  ('测试用户2', true, 100, 0, 'USER0002', 0);

-- 3. 设置邀请关系
UPDATE users 
SET parent_id = (SELECT id FROM users WHERE username = '测试管理员')
WHERE username IN ('测试用户1', '测试用户2');

-- 4. 查看创建结果
SELECT 
  username AS "用户名",
  invite_code AS "邀请码",
  u_balance AS "U余额",
  points_balance AS "积分余额",
  direct_referral_count AS "直推人数",
  CASE WHEN is_agent THEN '是' ELSE '否' END AS "是否代理"
FROM users
WHERE username LIKE '测试%'
ORDER BY username;

-- ═══════════════════════════════════════
-- ✅ 完成！测试数据已重新创建
-- 
-- 3个测试用户：
--   • 测试管理员 (ADMIN001, 100U, 2直推)
--   • 测试用户1 (USER0001, 100U)
--   • 测试用户2 (USER0002, 100U)
-- 
-- 下一步：
-- 执行自动化测试脚本
-- supabase/automated_test.sql
-- ═══════════════════════════════════════

