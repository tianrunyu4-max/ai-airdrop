-- ==========================================
-- 🧹 清理错误数据 - 修复业务逻辑混乱
-- ==========================================
-- 问题：referral_relationships表中有非AI代理的记录
-- 原因：之前的逻辑错误，在注册时就建立了关系
-- 修复：删除所有非AI代理的直推关系记录
-- ==========================================

-- 1️⃣ 查看当前错误数据（先确认）
SELECT 
  r.id as 关系ID,
  r.created_at as 建立时间,
  referrer.username as 推荐人,
  referrer.is_agent as 推荐人是否代理,
  referee.username as 被推荐人,
  referee.is_agent as 被推荐人是否代理
FROM referral_relationships r
JOIN users referrer ON r.referrer_id = referrer.id
JOIN users referee ON r.referee_id = referee.id
WHERE referee.is_agent = false  -- 被推荐人不是AI代理
ORDER BY r.created_at DESC;

-- 2️⃣ 删除错误数据（执行前请先确认上面的查询结果）
DELETE FROM referral_relationships
WHERE referee_id IN (
  SELECT id FROM users WHERE is_agent = false
);

-- 3️⃣ 验证清理结果（应该只剩下AI代理的记录）
SELECT 
  r.id,
  referrer.username as 推荐人,
  referee.username as 被推荐人,
  referee.is_agent as 是否AI代理
FROM referral_relationships r
JOIN users referrer ON r.referrer_id = referrer.id
JOIN users referee ON r.referee_id = referee.id
WHERE r.is_active = true
ORDER BY r.created_at DESC;

-- ==========================================
-- ✅ 清理完成提示
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '清理完成！请检查验证结果';
END $$;

