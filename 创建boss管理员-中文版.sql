-- 创建 boss 管理员账号（中文列名版本）
-- 用户名：boss
-- 密码：bossab123（已加密）

INSERT INTO users (
  用户名, 
  邀请码, 
  角色,
  邀请人_ID,
  推荐职位,
  has_network,
  加密密码,
  直接推荐数量,
  总收入
)
VALUES (
  'boss',
  'BOSS0001',
  '管理员',
  NULL,
  1,
  false,
  '$2b$10$sr.qSxTLBzZUgAo9WeQFZua3ZlGRgV.PaYbqnBXphOADPBiUm8Xl.',
  0,
  0
);

-- 查看创建结果
SELECT 
  用户名, 
  邀请码,
  角色,
  LEFT(加密密码, 30) as 密码预览,
  变成于
FROM users 
WHERE 用户名 = 'boss';

