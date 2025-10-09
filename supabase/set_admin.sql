-- 设置用户为管理员
-- 使用方法: 将 'YOUR_INVITE_CODE' 替换为您的实际邀请码

-- 方法1: 通过邀请码设置
UPDATE users 
SET 
  is_admin = true,
  is_agent = true
WHERE invite_code = 'YOUR_INVITE_CODE';

-- 方法2: 通过用户名设置
-- UPDATE users 
-- SET 
--   is_admin = true,
--   is_agent = true
-- WHERE username = 'YOUR_USERNAME';

-- 验证设置成功
SELECT 
  id,
  username, 
  invite_code, 
  is_admin, 
  is_agent,
  created_at
FROM users 
WHERE invite_code = 'YOUR_INVITE_CODE';

-- 如果不知道邀请码，可以先查询所有用户
-- SELECT username, invite_code, is_admin FROM users ORDER BY created_at DESC LIMIT 10;

