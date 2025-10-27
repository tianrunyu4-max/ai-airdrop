-- ========================================
-- boss账号完整数据修复脚本（修正版）
-- ========================================

-- 第一步：查看当前状态
SELECT 
  'referral_relationships表' as 数据源,
  COUNT(*) as 直推人数
FROM referral_relationships
WHERE referrer_id = (SELECT id FROM users WHERE username = 'boss')
  AND is_active = TRUE

UNION ALL

SELECT 
  'users.inviter_id字段' as 数据源,
  COUNT(*) as 直推人数
FROM users
WHERE inviter_id = (SELECT id FROM users WHERE username = 'boss')
  AND is_agent = TRUE;

-- 第二步：修复直推关系（将旧数据迁移到新表）
INSERT INTO referral_relationships (referrer_id, referee_id, is_active, created_at)
SELECT 
  inviter_id as referrer_id,
  id as referee_id,
  TRUE as is_active,
  created_at
FROM users
WHERE inviter_id = (SELECT id FROM users WHERE username = 'boss')
  AND is_agent = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM referral_relationships 
    WHERE referrer_id = users.inviter_id 
    AND referee_id = users.id
  );

-- 第三步：验证修复结果
SELECT 
  u.username as 直推用户名,
  u.is_agent as 是否AI代理,
  u.network_side as 网体位置,
  rr.created_at as 推荐时间
FROM referral_relationships rr
LEFT JOIN users u ON u.id = rr.referee_id
WHERE rr.referrer_id = (SELECT id FROM users WHERE username = 'boss')
  AND rr.is_active = TRUE
ORDER BY rr.created_at DESC;

-- 第四步：检查boss的Binary系统状态（修正版 - 移除不存在的字段）
SELECT 
  bm.user_id,
  bm.upline_id,
  u.network_side as 网体位置,  -- 从users表获取
  bm.a_side_count as A侧人数,
  bm.b_side_count as B侧人数,
  bm.total_pairing_bonus as 对碰奖,
  bm.is_active as 是否激活
FROM binary_members bm
LEFT JOIN users u ON u.id = bm.user_id
WHERE bm.user_id = (SELECT id FROM users WHERE username = 'boss');

-- 第五步：计算应该显示的释放率
SELECT 
  COUNT(*) as 直推人数,
  CASE 
    WHEN COUNT(*) = 0 THEN 1.0
    ELSE LEAST(COUNT(*) * 3.0, 15.0)
  END as 释放率百分比
FROM referral_relationships
WHERE referrer_id = (SELECT id FROM users WHERE username = 'boss')
  AND is_active = TRUE;


