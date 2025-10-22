-- ==========================================
-- 🤖 创建智能客服机器人账号
-- ==========================================
-- 执行步骤：
-- 1. 复制这段 SQL
-- 2. 打开 Supabase SQL Editor
-- 3. 粘贴并点击 Run
-- 4. 复制输出的 UUID，更新前端代码
-- ==========================================

-- 🔐 创建客服机器人用户（在 auth.users 表）
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
  gen_random_uuid(), -- 🎯 自动生成 UUID
  'authenticated',
  'authenticated',
  'customer-service-bot@system.local',
  crypt('bot-password-no-login', gen_salt('bf')),
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
) ON CONFLICT (email) DO UPDATE
  SET raw_user_meta_data = '{"username":"AI智能客服","is_bot":true}'
RETURNING id, email, raw_user_meta_data->>'username' as username;

-- 📝 输出说明：
-- 复制上面返回的 UUID（id 列），
-- 然后在前端 src/views/chat/ChatView.vue 里找到：
-- const CUSTOMER_SERVICE_BOT_ID = 'customer_service_bot'
-- 改成：
-- const CUSTOMER_SERVICE_BOT_ID = '这里粘贴你复制的UUID'

