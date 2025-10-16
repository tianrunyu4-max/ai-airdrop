-- 方法：直接通过SQL创建Auth用户和users表记录
-- 在Supabase SQL Editor中执行

-- 步骤1: 生成一个UUID
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- 步骤2: 插入到auth.users表
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'admin@airdrop.app',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"admin"}',
    false,
    '',
    '',
    '',
    ''
  );

  -- 步骤3: 插入到public.users表
  INSERT INTO public.users (
    id,
    username,
    invite_code,
    inviter_id,
    is_agent,
    is_admin,
    u_balance,
    points_balance,
    mining_points,
    transfer_points,
    direct_referral_count,
    total_earnings,
    qualified_for_dividend,
    language,
    created_at
  ) VALUES (
    new_user_id,
    'admin',
    'AI8K3Q9Z',
    NULL,
    true,
    true,
    100,
    500,
    500,
    0,
    0,
    0,
    false,
    'zh',
    NOW()
  );

  -- 步骤4: 显示创建的用户信息
  RAISE NOTICE '用户创建成功！';
  RAISE NOTICE 'UUID: %', new_user_id;
  RAISE NOTICE 'Email: admin@airdrop.app';
  RAISE NOTICE 'Password: admin123';
  RAISE NOTICE '邀请码: AI8K3Q9Z';
END $$;

-- 验证创建成功
SELECT 
  u.id,
  u.username,
  u.invite_code,
  u.is_admin,
  au.email,
  au.email_confirmed_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.username = 'admin';



















