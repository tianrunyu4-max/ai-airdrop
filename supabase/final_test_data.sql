-- ═══════════════════════════════════════
-- 最终版测试数据脚本（绝对不会出错）
-- 先删除，再创建
-- ═══════════════════════════════════════

-- 第1步：彻底删除所有测试用户相关数据
DO $$
DECLARE
  v_test_user_ids UUID[];
BEGIN
  -- 获取所有测试用户的ID
  SELECT ARRAY_AGG(id) INTO v_test_user_ids 
  FROM users 
  WHERE username LIKE '测试%';
  
  -- 如果有测试用户，删除所有相关数据
  IF v_test_user_ids IS NOT NULL THEN
    -- 删除相关记录
    DELETE FROM dividend_records WHERE user_id = ANY(v_test_user_ids);
    DELETE FROM pairing_bonuses WHERE user_id = ANY(v_test_user_ids);
    DELETE FROM level_bonuses WHERE user_id = ANY(v_test_user_ids);
    DELETE FROM daily_releases WHERE user_id = ANY(v_test_user_ids);
    DELETE FROM transactions WHERE user_id = ANY(v_test_user_ids);
    DELETE FROM mining_machines WHERE user_id = ANY(v_test_user_ids);
    DELETE FROM binary_members WHERE user_id = ANY(v_test_user_ids);
    DELETE FROM withdrawals WHERE user_id = ANY(v_test_user_ids);
    DELETE FROM messages WHERE user_id = ANY(v_test_user_ids);
    DELETE FROM group_members WHERE user_id = ANY(v_test_user_ids);
    
    -- 最后删除用户
    DELETE FROM users WHERE id = ANY(v_test_user_ids);
    
    RAISE NOTICE '✅ 已清理 % 个旧的测试用户', array_length(v_test_user_ids, 1);
  ELSE
    RAISE NOTICE '✅ 没有旧的测试用户需要清理';
  END IF;
END $$;

-- 第2步：创建新的测试用户
INSERT INTO users (username, is_agent, u_balance, points_balance, invite_code, direct_referral_count)
VALUES 
  ('测试管理员', true, 100, 0, 'ADMIN001', 2),
  ('测试用户1', true, 100, 0, 'USER0001', 0),
  ('测试用户2', true, 100, 0, 'USER0002', 0);

-- 第3步：设置邀请关系
UPDATE users 
SET parent_id = (SELECT id FROM users WHERE username = '测试管理员')
WHERE username IN ('测试用户1', '测试用户2');

-- 第4步：查看结果
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
-- 下一步：
-- 执行自动化测试
-- supabase/automated_test.sql
-- ═══════════════════════════════════════

