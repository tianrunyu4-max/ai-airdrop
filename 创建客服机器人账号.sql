-- ==========================================
-- 🤖 创建智能客服机器人账号（修复版）
-- ==========================================
-- 直接复制粘贴到 Supabase SQL Editor 执行
-- ==========================================

-- 方案：先删除旧的（如果存在），再创建新的
DELETE FROM auth.users WHERE email = 'customer-service-bot@system.local';

-- 🔐 创建客服机器人用户
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
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'customer-service-bot@system.local',
  crypt('bot-no-login', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"AI智能客服","is_bot":true}',
  false,
  '',
  '',
  '',
  ''
)
RETURNING id, email, raw_user_meta_data->>'username' as username;

-- 📝 执行成功后，复制返回的 UUID（id 列）告诉我
