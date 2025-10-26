-- ==========================================
-- 🔧 创建核心RPC函数 - 余额原子操作
-- ==========================================
-- 用途：为WalletManager提供原子操作，防止并发问题
-- 包含：
--   1. add_user_balance - 增加U余额
--   2. deduct_user_balance - 扣除U余额
--   3. add_user_points - 增加总积分
--   4. deduct_user_points - 扣除总积分
--   5. add_transfer_points - 增加互转积分
--   6. deduct_transfer_points - 扣除互转积分
-- ==========================================

-- 1️⃣ 增加U余额（原子操作）
CREATE OR REPLACE FUNCTION add_user_balance(
  p_user_id UUID,
  p_amount DECIMAL(20, 2)
)
RETURNS DECIMAL(20, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance DECIMAL(20, 2);
BEGIN
  -- 原子操作：读取 + 更新
  UPDATE users
  SET u_balance = u_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING u_balance INTO v_new_balance;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在: %', p_user_id;
  END IF;
  
  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION add_user_balance IS '原子操作：增加用户U余额';

-- 2️⃣ 扣除U余额（原子操作 + 余额检查）
CREATE OR REPLACE FUNCTION deduct_user_balance(
  p_user_id UUID,
  p_amount DECIMAL(20, 2)
)
RETURNS DECIMAL(20, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance DECIMAL(20, 2);
  v_new_balance DECIMAL(20, 2);
BEGIN
  -- 1. 检查当前余额
  SELECT u_balance INTO v_current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE; -- 行级锁，防止并发
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在: %', p_user_id;
  END IF;
  
  -- 2. 检查余额是否充足
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient balance: current=%, required=%', v_current_balance, p_amount;
  END IF;
  
  -- 3. 扣除余额
  UPDATE users
  SET u_balance = u_balance - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING u_balance INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION deduct_user_balance IS '原子操作：扣除用户U余额（自动检查余额充足）';

-- 3️⃣ 增加总积分（原子操作）
CREATE OR REPLACE FUNCTION add_user_points(
  p_user_id UUID,
  p_amount DECIMAL(20, 2)
)
RETURNS DECIMAL(20, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance DECIMAL(20, 2);
BEGIN
  UPDATE users
  SET points_balance = points_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING points_balance INTO v_new_balance;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在: %', p_user_id;
  END IF;
  
  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION add_user_points IS '原子操作：增加用户总积分';

-- 4️⃣ 扣除总积分（原子操作 + 余额检查）
CREATE OR REPLACE FUNCTION deduct_user_points(
  p_user_id UUID,
  p_amount DECIMAL(20, 2)
)
RETURNS DECIMAL(20, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance DECIMAL(20, 2);
  v_new_balance DECIMAL(20, 2);
BEGIN
  -- 1. 检查当前积分
  SELECT points_balance INTO v_current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在: %', p_user_id;
  END IF;
  
  -- 2. 检查积分是否充足
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient points: current=%, required=%', v_current_balance, p_amount;
  END IF;
  
  -- 3. 扣除积分
  UPDATE users
  SET points_balance = points_balance - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING points_balance INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION deduct_user_points IS '原子操作：扣除用户总积分（自动检查积分充足）';

-- 5️⃣ 增加互转积分（原子操作 - 同时增加总积分和互转积分）
CREATE OR REPLACE FUNCTION add_transfer_points(
  p_user_id UUID,
  p_amount DECIMAL(20, 2)
)
RETURNS DECIMAL(20, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance DECIMAL(20, 2);
BEGIN
  UPDATE users
  SET transfer_points = transfer_points + p_amount,
      points_balance = points_balance + p_amount,  -- 同时增加总积分
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING transfer_points INTO v_new_balance;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在: %', p_user_id;
  END IF;
  
  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION add_transfer_points IS '原子操作：增加用户互转积分（同时增加总积分）';

-- 6️⃣ 扣除互转积分（原子操作 - 同时扣除总积分和互转积分）
CREATE OR REPLACE FUNCTION deduct_transfer_points(
  p_user_id UUID,
  p_amount DECIMAL(20, 2)
)
RETURNS DECIMAL(20, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_transfer_points DECIMAL(20, 2);
  v_current_points_balance DECIMAL(20, 2);
  v_new_balance DECIMAL(20, 2);
BEGIN
  -- 1. 检查当前积分
  SELECT transfer_points, points_balance
  INTO v_current_transfer_points, v_current_points_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在: %', p_user_id;
  END IF;
  
  -- 2. 检查互转积分是否充足
  IF v_current_transfer_points < p_amount THEN
    RAISE EXCEPTION 'insufficient transfer points: current=%, required=%', v_current_transfer_points, p_amount;
  END IF;
  
  -- 3. 检查总积分是否充足
  IF v_current_points_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient points balance: current=%, required=%', v_current_points_balance, p_amount;
  END IF;
  
  -- 4. 扣除互转积分和总积分
  UPDATE users
  SET transfer_points = transfer_points - p_amount,
      points_balance = points_balance - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING transfer_points INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION deduct_transfer_points IS '原子操作：扣除用户互转积分（同时扣除总积分）';

-- ==========================================
-- ✅ 完成提示
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ 核心RPC函数创建完成！';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📦 已创建6个原子操作函数：';
  RAISE NOTICE '   1. add_user_balance(user_id, amount)';
  RAISE NOTICE '   2. deduct_user_balance(user_id, amount)';
  RAISE NOTICE '   3. add_user_points(user_id, amount)';
  RAISE NOTICE '   4. deduct_user_points(user_id, amount)';
  RAISE NOTICE '   5. add_transfer_points(user_id, amount)';
  RAISE NOTICE '   6. deduct_transfer_points(user_id, amount)';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🎯 用途：';
  RAISE NOTICE '   - 防止并发问题（数据库级别锁）';
  RAISE NOTICE '   - 自动余额检查（防止负数）';
  RAISE NOTICE '   - 支持见单奖触发器调用';
  RAISE NOTICE '============================================';
END $$;

