-- ================================================================
-- 数据迁移：从 users.inviter_id 迁移到 referral_relationships
-- 功能：将现有的推荐关系迁移到新的直推关系表
-- 创建时间：2025-10-27
-- ================================================================

-- 🔍 第一步：检查当前状态
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  -- 统计旧系统中有推荐人的用户数
  SELECT COUNT(*) INTO old_count 
  FROM users 
  WHERE inviter_id IS NOT NULL 
    AND is_agent = true;
  
  -- 统计新系统中的直推关系数
  SELECT COUNT(*) INTO new_count 
  FROM referral_relationships;
  
  RAISE NOTICE '📊 旧系统（users.inviter_id）中的代理推荐关系数: %', old_count;
  RAISE NOTICE '📊 新系统（referral_relationships）中的直推关系数: %', new_count;
  RAISE NOTICE '📊 需要迁移的关系数: %', old_count - new_count;
END $$;

-- 🚀 第二步：执行迁移（只迁移AI代理的直推关系）
INSERT INTO referral_relationships (
  referrer_id,
  referee_id,
  created_at,
  is_active
)
SELECT 
  u.inviter_id AS referrer_id,
  u.id AS referee_id,
  u.created_at,
  true AS is_active
FROM users u
WHERE 
  u.inviter_id IS NOT NULL          -- 有推荐人
  AND u.is_agent = true              -- 是AI代理
  AND NOT EXISTS (                    -- 避免重复插入
    SELECT 1 
    FROM referral_relationships rr 
    WHERE rr.referee_id = u.id
  )
ON CONFLICT (referee_id) DO NOTHING;  -- 如果已存在，跳过

-- 📊 第三步：验证迁移结果
DO $$
DECLARE
  migrated_count INTEGER;
  total_count INTEGER;
  boss_referrals INTEGER;
BEGIN
  -- 统计迁移后的总数
  SELECT COUNT(*) INTO total_count 
  FROM referral_relationships;
  
  -- 统计boss的直推数
  SELECT COUNT(*) INTO boss_referrals 
  FROM referral_relationships rr
  JOIN users u ON u.id = rr.referrer_id
  WHERE u.username = 'boss';
  
  RAISE NOTICE '✅ 迁移完成！';
  RAISE NOTICE '📊 当前直推关系总数: %', total_count;
  RAISE NOTICE '📊 boss账号的直推数: %', boss_referrals;
END $$;

-- 🔍 第四步：显示boss的直推列表（用于验证）
DO $$
DECLARE
  boss_id UUID;
  referral_record RECORD;
BEGIN
  -- 获取boss的ID
  SELECT id INTO boss_id FROM users WHERE username = 'boss';
  
  IF boss_id IS NOT NULL THEN
    RAISE NOTICE '👑 boss账号的直推列表：';
    
    FOR referral_record IN
      SELECT 
        u.username,
        u.created_at,
        rr.is_active
      FROM referral_relationships rr
      JOIN users u ON u.id = rr.referee_id
      WHERE rr.referrer_id = boss_id
      ORDER BY rr.created_at DESC
    LOOP
      RAISE NOTICE '  └─ % (加入时间: %, 状态: %)', 
        referral_record.username, 
        referral_record.created_at,
        CASE WHEN referral_record.is_active THEN '✅活跃' ELSE '❌失效' END;
    END LOOP;
  ELSE
    RAISE NOTICE '⚠️ 未找到boss账号';
  END IF;
END $$;

-- ✅ 迁移完成
RAISE NOTICE '🎉 数据迁移完成！所有AI代理的直推关系已同步到 referral_relationships 表。';

