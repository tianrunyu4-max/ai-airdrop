-- ================================================================
-- 诊断 boss 用户ID问题
-- ================================================================

-- 1. 查询boss的完整信息
SELECT 
  '1️⃣ boss账号信息' as 检查项,
  id::text as ID,
  username as 用户名,
  is_agent::text as 是否代理,
  is_admin::text as 是否管理员,
  created_at::text as 创建时间
FROM users
WHERE username = 'boss';

-- 2. 查询referral_relationships中boss作为推荐人的所有记录
SELECT 
  '2️⃣ boss在referral_relationships表中作为推荐人的记录' as 检查项,
  rr.referrer_id::text as 推荐人ID,
  rr.referee_id::text as 被推荐人ID,
  u1.username as 推荐人,
  u2.username as 被推荐人,
  rr.is_active::text as 是否有效
FROM referral_relationships rr
LEFT JOIN users u1 ON u1.id = rr.referrer_id
LEFT JOIN users u2 ON u2.id = rr.referee_id
WHERE u1.username = 'boss';

-- 3. 测试查询：模拟前端查询
SELECT 
  '3️⃣ 模拟前端查询（使用boss的ID）' as 检查项,
  rr.referee_id::text as 被推荐人ID,
  rr.created_at::text as 创建时间
FROM referral_relationships rr
WHERE rr.referrer_id = (SELECT id FROM users WHERE username = 'boss')
  AND rr.is_active = true
ORDER BY rr.created_at DESC;

-- 4. 检查boss的ID是否在前端localStorage中
SELECT 
  '4️⃣ boss的UUID（复制到前端localStorage对比）' as 提示,
  id::text as boss的ID
FROM users
WHERE username = 'boss';

-- 5. 检查是否有其他用户使用了boss这个推荐人
SELECT 
  '5️⃣ 所有推荐人统计' as 检查项,
  u.username as 推荐人,
  COUNT(*)::text as 直推数量
FROM referral_relationships rr
JOIN users u ON u.id = rr.referrer_id
GROUP BY u.id, u.username
ORDER BY COUNT(*) DESC;

