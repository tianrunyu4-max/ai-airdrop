-- 成为代理时自动生成邀请码的触发器

-- 创建生成邀请码的函数
CREATE OR REPLACE FUNCTION auto_generate_invite_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- 如果用户变成代理且没有邀请码
  IF NEW.is_agent = TRUE AND (OLD.is_agent = FALSE OR OLD.is_agent IS NULL) AND NEW.invite_code IS NULL THEN
    
    -- 生成唯一的邀请码
    LOOP
      -- 生成8位随机邀请码
      new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
      
      -- 检查是否已存在
      SELECT EXISTS(SELECT 1 FROM users WHERE invite_code = new_code) INTO code_exists;
      
      -- 如果不存在，跳出循环
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    -- 设置邀请码
    NEW.invite_code := new_code;
    
    -- 记录日志
    RAISE NOTICE '为用户 % 生成邀请码: %', NEW.username, new_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_auto_generate_invite_code ON users;
CREATE TRIGGER trigger_auto_generate_invite_code
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invite_code();

-- 成为代理的存储过程
CREATE OR REPLACE FUNCTION become_agent(
  p_user_id UUID,
  p_payment_amount DECIMAL
)
RETURNS JSON AS $$
DECLARE
  v_current_balance DECIMAL;
  v_agent_fee DECIMAL;
  v_invite_code TEXT;
  v_result JSON;
BEGIN
  -- 获取代理费用配置
  SELECT (value::text)::decimal INTO v_agent_fee 
  FROM system_config 
  WHERE key = 'agent_fee';
  
  -- 检查支付金额是否正确
  IF p_payment_amount < v_agent_fee THEN
    RETURN json_build_object(
      'success', false,
      'error', '支付金额不足'
    );
  END IF;
  
  -- 获取用户当前余额
  SELECT u_balance INTO v_current_balance 
  FROM users 
  WHERE id = p_user_id;
  
  -- 检查余额是否充足
  IF v_current_balance < v_agent_fee THEN
    RETURN json_build_object(
      'success', false,
      'error', '余额不足，当前余额: ' || v_current_balance || ' U'
    );
  END IF;
  
  -- 扣除余额
  UPDATE users 
  SET 
    u_balance = u_balance - v_agent_fee,
    is_agent = TRUE,
    agent_paid_at = NOW()
  WHERE id = p_user_id
  RETURNING invite_code INTO v_invite_code;
  
  -- 记录交易
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    currency,
    description,
    status
  ) VALUES (
    p_user_id,
    'agent_payment',
    -v_agent_fee,
    'U',
    '成为代理 - 支付代理费',
    'completed'
  );
  
  -- 返回结果
  RETURN json_build_object(
    'success', true,
    'invite_code', v_invite_code,
    'remaining_balance', v_current_balance - v_agent_fee
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION become_agent IS '用户成为代理，自动生成邀请码';
COMMENT ON FUNCTION auto_generate_invite_code IS '成为代理时自动生成唯一的8位邀请码';






