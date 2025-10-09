-- ═══════════════════════════════════════
-- 更新现有测试数据（不删除，只更新）
-- 适用于数据已存在的情况
-- ═══════════════════════════════════════

-- 策略：既然测试用户已经存在，就直接更新它们的数据

-- 1. 更新测试管理员
UPDATE users 
SET 
  u_balance = 100,
  points_balance = 0,
  direct_referral_count = 2,
  is_agent = true
WHERE username = '测试管理员' OR invite_code = 'ADMIN001';

-- 2. 更新测试用户1
UPDATE users 
SET 
  u_balance = 100,
  points_balance = 0,
  direct_referral_count = 0,
  is_agent = true,
  parent_id = (SELECT id FROM users WHERE invite_code = 'ADMIN001' LIMIT 1)
WHERE username = '测试用户1' OR invite_code = 'USER0001';

-- 3. 更新测试用户2
UPDATE users 
SET 
  u_balance = 100,
  points_balance = 0,
  direct_referral_count = 0,
  is_agent = true,
  parent_id = (SELECT id FROM users WHERE invite_code = 'ADMIN001' LIMIT 1)
WHERE username = '测试用户2' OR invite_code = 'USER0002';

-- 4. 清理这些用户的测试数据
DELETE FROM mining_machines 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE invite_code IN ('ADMIN001', 'USER0001', 'USER0002')
);

DELETE FROM binary_members 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE invite_code IN ('ADMIN001', 'USER0001', 'USER0002')
);

DELETE FROM transactions 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE invite_code IN ('ADMIN001', 'USER0001', 'USER0002')
);

-- 5. 查看结果
SELECT 
  username AS "用户名",
  invite_code AS "邀请码",
  u_balance AS "U余额",
  points_balance AS "积分余额",
  direct_referral_count AS "直推人数",
  CASE WHEN is_agent THEN '是' ELSE '否' END AS "是否代理",
  (SELECT username FROM users p WHERE p.id = users.parent_id) AS "上级"
FROM users
WHERE invite_code IN ('ADMIN001', 'USER0001', 'USER0002')
ORDER BY invite_code;

-- ═══════════════════════════════════════
-- ✅ 完成！
-- 
-- 测试数据已更新：
--   • 余额重置为100U
--   • 积分余额重置为0
--   • 邀请关系已设置
--   • 旧的测试记录已清理
-- 
-- 下一步：
-- 执行自动化测试
-- supabase/automated_test.sql
-- ═══════════════════════════════════════

