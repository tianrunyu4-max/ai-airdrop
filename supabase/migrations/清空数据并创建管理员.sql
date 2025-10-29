-- ======================================
-- 清空所有数据并创建管理员账号
-- ======================================
-- 执行时间：请在Supabase SQL编辑器中运行
-- 警告：此操作会删除所有用户数据，请谨慎操作！
-- ======================================

-- 1️⃣ 删除所有现有账号（清空用户表）
DELETE FROM users;

-- 2️⃣ 删除相关表数据（级联清理）
DELETE FROM referral_relationships;
DELETE FROM binary_members;
DELETE FROM mining_machines;
DELETE FROM user_transactions;
DELETE FROM withdrawal_addresses;
DELETE FROM recharge_records;
DELETE FROM withdrawal_records;
DELETE FROM restart_logs;
DELETE FROM user_restart_stats;
DELETE FROM messages; -- 清空聊天消息

-- 3️⃣ 创建管理员账号
-- 用户名：boss
-- 密码：bossab123（已加密）
-- 权限：管理员 + AI代理
INSERT INTO users (
  username,
  password_hash,
  invite_code,
  inviter_id,
  referral_position,
  u_balance,
  points_balance,
  mining_points,
  transfer_points,
  is_agent,
  agent_paid_at,
  is_admin,
  language,
  created_at
) VALUES (
  'boss',
  '$2a$10$YourHashedPasswordHere', -- 需要替换为实际加密后的密码
  'BOSS0001',
  NULL,
  1,
  100000, -- 初始余额：10万U
  100000, -- 初始积分：10万
  100000,
  0,
  true, -- AI代理
  NOW(),
  true, -- 管理员
  'zh',
  NOW()
);

-- 4️⃣ 验证（检查管理员账号是否创建成功）
SELECT 
  username,
  is_admin,
  is_agent,
  u_balance,
  points_balance,
  invite_code,
  created_at
FROM users 
WHERE username = 'boss';

-- ======================================
-- 📝 执行说明：
-- ======================================
-- 1. 由于密码需要bcrypt加密，请先访问：
--    https://www.ai-airdrop.top/admin/setup
--    
-- 2. 使用以下信息创建管理员：
--    用户名：boss
--    密码：bossab123
--    管理员密钥：admin2025
--
-- 3. 或者手动加密密码后，替换上面的 password_hash
--
-- ======================================
-- ⚠️ 注意事项：
-- ======================================
-- 1. 此脚本会删除所有数据，无法恢复！
-- 2. 请在执行前做好数据备份（如需要）
-- 3. 删除后，所有用户需要重新发言创建账号
-- 4. 管理员账号（boss）可直接登录
-- ======================================

