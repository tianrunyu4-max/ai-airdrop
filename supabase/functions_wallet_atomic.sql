-- ============================================
-- 钱包原子操作函数（安全加固）
-- 防止并发问题，确保数据一致性
-- ============================================

-- 1. 增加用户余额（原子操作）
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
  -- 参数验证
  IF p_amount <= 0 THEN
    RAISE EXCEPTION '金额必须大于0';
  END IF;

  -- 原子更新并返回新余额
  UPDATE users
  SET 
    u_balance = u_balance + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING u_balance INTO v_new_balance;

  -- 检查用户是否存在
  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在';
  END IF;

  RETURN v_new_balance;
END;
$$;

-- 2. 扣除用户余额（原子操作，自动检查余额）
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
  -- 参数验证
  IF p_amount <= 0 THEN
    RAISE EXCEPTION '金额必须大于0';
  END IF;

  -- 获取当前余额并锁定行
  SELECT u_balance INTO v_current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- 检查用户是否存在
  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在';
  END IF;

  -- 检查余额是否充足
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION '余额不足: 当前% 需要%', v_current_balance, p_amount;
  END IF;

  -- 原子扣除并返回新余额
  UPDATE users
  SET 
    u_balance = u_balance - p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING u_balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

-- 3. 转账（原子事务）
CREATE OR REPLACE FUNCTION transfer_balance(
  p_from_user UUID,
  p_to_user UUID,
  p_amount DECIMAL(20, 2),
  p_description TEXT DEFAULT '转账'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from_balance DECIMAL(20, 2);
  v_to_balance DECIMAL(20, 2);
BEGIN
  -- 参数验证
  IF p_amount <= 0 THEN
    RAISE EXCEPTION '金额必须大于0';
  END IF;

  IF p_from_user = p_to_user THEN
    RAISE EXCEPTION '不能给自己转账';
  END IF;

  -- 锁定发送方账户并检查余额
  SELECT u_balance INTO v_from_balance
  FROM users
  WHERE id = p_from_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '发送方不存在';
  END IF;

  IF v_from_balance < p_amount THEN
    RAISE EXCEPTION '余额不足';
  END IF;

  -- 锁定接收方账户
  SELECT u_balance INTO v_to_balance
  FROM users
  WHERE id = p_to_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '接收方不存在';
  END IF;

  -- 执行转账
  UPDATE users SET u_balance = u_balance - p_amount WHERE id = p_from_user;
  UPDATE users SET u_balance = u_balance + p_amount WHERE id = p_to_user;

  RETURN TRUE;
END;
$$;

-- 4. 增加用户积分（原子操作）
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
  IF p_amount <= 0 THEN
    RAISE EXCEPTION '金额必须大于0';
  END IF;

  UPDATE users
  SET 
    points_balance = points_balance + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING points_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在';
  END IF;

  RETURN v_new_balance;
END;
$$;

-- 5. 扣除用户积分（原子操作）
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
  IF p_amount <= 0 THEN
    RAISE EXCEPTION '金额必须大于0';
  END IF;

  SELECT points_balance INTO v_current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在';
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION '积分不足: 当前% 需要%', v_current_balance, p_amount;
  END IF;

  UPDATE users
  SET 
    points_balance = points_balance - p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING points_balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

-- 6. 批量更新余额（用于分红）
CREATE OR REPLACE FUNCTION batch_add_balance(
  p_user_amounts JSONB
)
RETURNS TABLE(user_id UUID, new_balance DECIMAL(20, 2), success BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item JSONB;
  v_user_id UUID;
  v_amount DECIMAL(20, 2);
  v_new_balance DECIMAL(20, 2);
BEGIN
  -- 遍历用户和金额
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_user_amounts)
  LOOP
    BEGIN
      v_user_id := (v_item->>'user_id')::UUID;
      v_amount := (v_item->>'amount')::DECIMAL(20, 2);

      -- 更新余额
      UPDATE users
      SET u_balance = u_balance + v_amount
      WHERE id = v_user_id
      RETURNING u_balance INTO v_new_balance;

      -- 返回结果
      RETURN QUERY SELECT v_user_id, v_new_balance, TRUE;

    EXCEPTION WHEN OTHERS THEN
      -- 单个失败不影响其他
      RETURN QUERY SELECT v_user_id, 0::DECIMAL(20, 2), FALSE;
    END;
  END LOOP;
END;
$$;

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(u_balance) WHERE u_balance > 0;
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points_balance) WHERE points_balance > 0;

-- 添加注释
COMMENT ON FUNCTION add_user_balance IS '原子操作：增加用户U余额';
COMMENT ON FUNCTION deduct_user_balance IS '原子操作：扣除用户U余额（自动检查余额）';
COMMENT ON FUNCTION transfer_balance IS '原子事务：用户间转账';
COMMENT ON FUNCTION add_user_points IS '原子操作：增加用户积分';
COMMENT ON FUNCTION deduct_user_points IS '原子操作：扣除用户积分（自动检查余额）';
COMMENT ON FUNCTION batch_add_balance IS '批量操作：给多个用户增加余额（用于分红）';

