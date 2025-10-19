-- 创建 boss 管理员账号
-- 用户名：boss
-- 密码：bossab123（已加密）

-- 步骤1：生成加密密码（这是 bossab123 的 bcrypt 哈希）
-- 注意：您需要先生成 bossab123 的加密密码

-- 临时方案：先用明文插入，然后我们用脚本加密
INSERT INTO users (
  username, 
  password, 
  is_admin, 
  u_balance, 
  points_balance, 
  mining_points, 
  invite_code,
  created_at
)
VALUES (
  'boss',
  'bossab123',  -- 临时明文，稍后加密
  true,
  0,
  0,
  0,
  'BOSS0001',
  NOW()
);

-- 查看创建结果
SELECT id, username, password, is_admin, invite_code, created_at 
FROM users 
WHERE username = 'boss';

