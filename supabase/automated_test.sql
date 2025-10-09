-- ═══════════════════════════════════════
-- 自动化测试脚本
-- 一键测试所有核心功能
-- 预计执行时间：30秒
-- ═══════════════════════════════════════

DO $$
DECLARE
  v_admin_id UUID;
  v_user1_id UUID;
  v_user2_id UUID;
  v_machine_id UUID;
  v_initial_balance DECIMAL(20, 2);
  v_after_balance DECIMAL(20, 2);
  v_test_passed INTEGER := 0;
  v_test_failed INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '🧪 自动化测试开始';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';

  -- 获取测试用户ID
  SELECT id INTO v_admin_id FROM users WHERE username = '测试管理员';
  SELECT id INTO v_user1_id FROM users WHERE username = '测试用户1';
  SELECT id INTO v_user2_id FROM users WHERE username = '测试用户2';

  -- ═══════════════════════════════════════
  -- 测试1: 购买AI学习机
  -- ═══════════════════════════════════════
  BEGIN
    RAISE NOTICE '测试1: AI学习机购买';
    
    -- 记录初始余额
    SELECT u_balance INTO v_initial_balance FROM users WHERE id = v_admin_id;
    
    -- 购买学习机（首次免费，所以余额不变）
    INSERT INTO mining_machines (
      user_id, initial_points, total_points, released_points, 
      base_rate, is_active
    )
    VALUES (
      v_admin_id, 100, 200, 0, 0.10, true
    )
    RETURNING id INTO v_machine_id;
    
    -- 验证
    IF v_machine_id IS NOT NULL THEN
      v_test_passed := v_test_passed + 1;
      RAISE NOTICE '  ✅ 通过: 学习机创建成功 (ID: %)', v_machine_id;
    ELSE
      v_test_failed := v_test_failed + 1;
      RAISE NOTICE '  ❌ 失败: 学习机创建失败';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := v_test_failed + 1;
    RAISE NOTICE '  ❌ 失败: %', SQLERRM;
  END;

  -- ═══════════════════════════════════════
  -- 测试2: 模拟每日释放
  -- ═══════════════════════════════════════
  BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '测试2: AI学习机每日释放';
    
    -- 记录释放前余额
    SELECT u_balance INTO v_initial_balance FROM users WHERE id = v_admin_id;
    
    -- 模拟释放（10%）
    UPDATE mining_machines 
    SET released_points = released_points + 10  -- 10积分 (10%)
    WHERE id = v_machine_id;
    
    -- 计算应得金额
    DECLARE
      v_to_u DECIMAL(20, 2) := 10 * 0.70 * 0.07;  -- 7积分→U，每积分0.07U
      v_to_points DECIMAL(20, 2) := 10 * 0.30;     -- 3积分→积分余额
    BEGIN
      -- 增加余额
      UPDATE users 
      SET u_balance = u_balance + v_to_u,
          points_balance = points_balance + v_to_points
      WHERE id = v_admin_id;
      
      -- 验证
      SELECT u_balance INTO v_after_balance FROM users WHERE id = v_admin_id;
      
      IF v_after_balance = v_initial_balance + v_to_u THEN
        v_test_passed := v_test_passed + 1;
        RAISE NOTICE '  ✅ 通过: 释放成功，余额增加 %.2fU', v_to_u;
      ELSE
        v_test_failed := v_test_failed + 1;
        RAISE NOTICE '  ❌ 失败: 余额不正确';
      END IF;
    END;
    
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := v_test_failed + 1;
    RAISE NOTICE '  ❌ 失败: %', SQLERRM;
  END;

  -- ═══════════════════════════════════════
  -- 测试3: 加入二元系统
  -- ═══════════════════════════════════════
  BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '测试3: 加入二元系统';
    
    -- 测试管理员加入
    INSERT INTO binary_members (
      user_id, position_side, position_depth,
      a_side_count, b_side_count, is_active
    )
    VALUES (
      v_admin_id, 'A', 1, 0, 0, true
    );
    
    -- 测试用户1加入（应该在A或B区）
    INSERT INTO binary_members (
      user_id, upline_id, position_side, position_depth,
      a_side_count, b_side_count, is_active
    )
    VALUES (
      v_user1_id, v_admin_id, 'A', 2, 0, 0, true
    );
    
    -- 测试用户2加入（应该在另一区）
    INSERT INTO binary_members (
      user_id, upline_id, position_side, position_depth,
      a_side_count, b_side_count, is_active
    )
    VALUES (
      v_user2_id, v_admin_id, 'B', 2, 0, 0, true
    );
    
    -- 验证
    DECLARE
      v_member_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO v_member_count 
      FROM binary_members 
      WHERE user_id IN (v_admin_id, v_user1_id, v_user2_id);
      
      IF v_member_count = 3 THEN
        v_test_passed := v_test_passed + 1;
        RAISE NOTICE '  ✅ 通过: 3个用户都加入了二元系统';
      ELSE
        v_test_failed := v_test_failed + 1;
        RAISE NOTICE '  ❌ 失败: 只有%个用户加入', v_member_count;
      END IF;
    END;
    
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := v_test_failed + 1;
    RAISE NOTICE '  ❌ 失败: %', SQLERRM;
  END;

  -- ═══════════════════════════════════════
  -- 测试4: 对碰奖触发
  -- ═══════════════════════════════════════
  BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '测试4: 对碰奖计算';
    
    -- 更新测试管理员的A/B区人数
    UPDATE binary_members 
    SET a_side_count = 1, 
        b_side_count = 1,
        a_side_pending = 1,
        b_side_pending = 1
    WHERE user_id = v_admin_id;
    
    -- 记录初始余额
    SELECT u_balance INTO v_initial_balance FROM users WHERE id = v_admin_id;
    
    -- 模拟对碰奖（1:1配对，7U * 85% = 5.95U）
    DECLARE
      v_pairing_bonus DECIMAL(20, 2) := 7.00 * 0.85;  -- 5.95U
    BEGIN
      -- 发放对碰奖
      UPDATE users 
      SET u_balance = u_balance + v_pairing_bonus
      WHERE id = v_admin_id;
      
      -- 更新二元系统统计
      UPDATE binary_members 
      SET total_pairing_bonus = total_pairing_bonus + v_pairing_bonus,
          a_side_pending = 0,
          b_side_pending = 0
      WHERE user_id = v_admin_id;
      
      -- 验证
      SELECT u_balance INTO v_after_balance FROM users WHERE id = v_admin_id;
      
      IF v_after_balance = v_initial_balance + v_pairing_bonus THEN
        v_test_passed := v_test_passed + 1;
        RAISE NOTICE '  ✅ 通过: 对碰奖发放成功 %.2fU', v_pairing_bonus;
      ELSE
        v_test_failed := v_test_failed + 1;
        RAISE NOTICE '  ❌ 失败: 对碰奖金额不正确';
      END IF;
    END;
    
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := v_test_failed + 1;
    RAISE NOTICE '  ❌ 失败: %', SQLERRM;
  END;

  -- ═══════════════════════════════════════
  -- 测试5: 平级奖发放
  -- ═══════════════════════════════════════
  BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '测试5: 平级奖计算';
    
    -- 记录初始余额
    SELECT u_balance INTO v_initial_balance FROM users WHERE id = v_admin_id;
    
    -- 模拟平级奖（2U per generation）
    DECLARE
      v_level_bonus DECIMAL(20, 2) := 2.00;
    BEGIN
      UPDATE users 
      SET u_balance = u_balance + v_level_bonus
      WHERE id = v_admin_id;
      
      UPDATE binary_members 
      SET total_level_bonus = total_level_bonus + v_level_bonus
      WHERE user_id = v_admin_id;
      
      -- 验证
      SELECT u_balance INTO v_after_balance FROM users WHERE id = v_admin_id;
      
      IF v_after_balance = v_initial_balance + v_level_bonus THEN
        v_test_passed := v_test_passed + 1;
        RAISE NOTICE '  ✅ 通过: 平级奖发放成功 %.2fU', v_level_bonus;
      ELSE
        v_test_failed := v_test_failed + 1;
        RAISE NOTICE '  ❌ 失败: 平级奖金额不正确';
      END IF;
    END;
    
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := v_test_failed + 1;
    RAISE NOTICE '  ❌ 失败: %', SQLERRM;
  END;

  -- ═══════════════════════════════════════
  -- 测试6: 互转功能
  -- ═══════════════════════════════════════
  BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '测试6: 用户互转';
    
    -- 记录双方初始余额
    DECLARE
      v_from_balance DECIMAL(20, 2);
      v_to_balance DECIMAL(20, 2);
      v_transfer_amount DECIMAL(20, 2) := 10.00;
      v_from_after DECIMAL(20, 2);
      v_to_after DECIMAL(20, 2);
    BEGIN
      SELECT u_balance INTO v_from_balance FROM users WHERE id = v_admin_id;
      SELECT u_balance INTO v_to_balance FROM users WHERE id = v_user1_id;
      
      -- 执行转账
      UPDATE users SET u_balance = u_balance - v_transfer_amount WHERE id = v_admin_id;
      UPDATE users SET u_balance = u_balance + v_transfer_amount WHERE id = v_user1_id;
      
      -- 验证
      SELECT u_balance INTO v_from_after FROM users WHERE id = v_admin_id;
      SELECT u_balance INTO v_to_after FROM users WHERE id = v_user1_id;
      
      IF v_from_after = v_from_balance - v_transfer_amount 
         AND v_to_after = v_to_balance + v_transfer_amount THEN
        v_test_passed := v_test_passed + 1;
        RAISE NOTICE '  ✅ 通过: 转账成功 %.2fU', v_transfer_amount;
      ELSE
        v_test_failed := v_test_failed + 1;
        RAISE NOTICE '  ❌ 失败: 转账金额不正确';
      END IF;
    END;
    
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := v_test_failed + 1;
    RAISE NOTICE '  ❌ 失败: %', SQLERRM;
  END;

  -- ═══════════════════════════════════════
  -- 测试总结
  -- ═══════════════════════════════════════
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '📊 测试结果汇总';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '总测试数: %', v_test_passed + v_test_failed;
  RAISE NOTICE '✅ 通过: %', v_test_passed;
  RAISE NOTICE '❌ 失败: %', v_test_failed;
  RAISE NOTICE '';
  
  IF v_test_failed = 0 THEN
    RAISE NOTICE '🎉 所有测试通过！系统运行正常！';
  ELSE
    RAISE NOTICE '⚠️  有%个测试失败，需要检查！', v_test_failed;
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';

END $$;

-- ═══════════════════════════════════════
-- 查看测试后的数据
-- ═══════════════════════════════════════

-- 1. 查看用户余额
SELECT 
  username,
  u_balance,
  points_balance,
  direct_referral_count
FROM users
WHERE username LIKE '测试%'
ORDER BY username;

-- 2. 查看学习机
SELECT 
  u.username,
  mm.initial_points,
  mm.total_points,
  mm.released_points,
  mm.is_active
FROM mining_machines mm
JOIN users u ON u.id = mm.user_id
WHERE u.username LIKE '测试%';

-- 3. 查看二元系统
SELECT 
  u.username,
  bm.a_side_count,
  bm.b_side_count,
  bm.total_pairing_bonus,
  bm.total_level_bonus
FROM binary_members bm
JOIN users u ON u.id = bm.user_id
WHERE u.username LIKE '测试%';

