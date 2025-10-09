-- ===================================================================
-- 函数：扣除互转积分（原子操作，防止并发问题）
-- ===================================================================

CREATE OR REPLACE FUNCTION deduct_transfer_points(
  p_user_id UUID,
  p_amount DECIMAL(20, 2)
)
RETURNS DECIMAL(20, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance DECIMAL(20, 2);
  v_current_balance DECIMAL(20, 2);
BEGIN
  -- 1. 验证金额必须大于0
  IF p_amount <= 0 THEN
    RAISE EXCEPTION '金额必须大于0';
  END IF;

  -- 2. 使用行锁获取当前余额
  SELECT transfer_points INTO v_current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在';
  END IF;

  -- 3. 验证余额充足
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION '互转积分余额不足（当前: %，需要: %）', v_current_balance, p_amount;
  END IF;

  -- 4. 扣除积分
  UPDATE users
  SET 
    transfer_points = COALESCE(transfer_points, 0) - p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING transfer_points INTO v_new_balance;

  -- 5. 返回新余额
  RETURN v_new_balance;
END;
$$;

-- 设置函数注释
COMMENT ON FUNCTION deduct_transfer_points IS '扣除用户互转积分（原子操作，带余额验证和行锁）';

-- 提示
DO $$
BEGIN
  RAISE NOTICE '✅ 扣除互转积分函数创建成功';
END $$;

