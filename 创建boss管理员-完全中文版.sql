-- 创建 boss 管理员账号（完全中文版本）
-- 用户名：boss
-- 密码：bossab123（已加密）

INSERT INTO 用户 (
  用户名, 
  邀请码, 
  角色,
  邀请人_ID,
  职位推存,
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
  LEFT(加密密码, 30) as 密码预览
FROM 用户
WHERE 用户名 = 'boss';

