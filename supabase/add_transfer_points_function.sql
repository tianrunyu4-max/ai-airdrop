-- ============================================
-- 添加互转积分的数据库函数
-- 用于AI学习机每日释放的30%互转积分
-- ============================================

-- 创建或替换函数：增加用户互转积分
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
  -- 参数验证
  IF p_amount <= 0 THEN
    RAISE EXCEPTION '金额必须大于0';
  END IF;

  -- 原子更新 transfer_points 字段并返回新余额
  UPDATE users
  SET 
    transfer_points = COALESCE(transfer_points, 0) + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING transfer_points INTO v_new_balance;

  -- 检查用户是否存在
  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在';
  END IF;

  RETURN v_new_balance;
END;
$$;

-- 添加注释
COMMENT ON FUNCTION add_transfer_points IS '原子操作：增加用户互转积分（AI学习机释放的30%）';

-- 验证函数创建成功
SELECT '✅ add_transfer_points 函数创建成功！' AS status;

