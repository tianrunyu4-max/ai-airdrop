-- ============================================
-- 添加触发器：自动创建用户记录
-- ============================================
-- 运行此脚本修复注册问题

-- 创建或替换函数：处理新用户注册
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_invite_code VARCHAR(8);
  inviter_user_id UUID;
BEGIN
  -- 生成唯一的8位邀请码
  LOOP
    new_invite_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE invite_code = new_invite_code);
  END LOOP;

  -- 获取inviter_id（如果有）
  inviter_user_id := (NEW.raw_user_meta_data->>'inviter_id')::UUID;

  -- 插入用户记录
  INSERT INTO public.users (
    id,
    username,
    invite_code,
    inviter_id,
    is_agent,
    agent_paid_at,
    is_admin,
    u_balance,
    points_balance,
    created_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    new_invite_code,
    inviter_user_id,
    FALSE,  -- 默认未付费
    NULL,
    inviter_user_id IS NULL,  -- 第一个用户是admin
    0,
    0,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();






































