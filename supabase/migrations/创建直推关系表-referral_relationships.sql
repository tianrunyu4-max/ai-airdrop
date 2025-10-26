-- ==========================================
-- 🎯 创建直推关系表（Referral Relationships）
-- ==========================================
-- 用途：
--   1. 记录AI代理之间的推荐关系（业务关系）
--   2. 用于计算加速释放率（每个直推+3%，最高15%）
--   3. 用于发放见单奖（推荐一人升级AI代理，获得5U）
-- 
-- 与Binary系统的区别：
--   - referral_relationships.referrer_id = 业务推荐人（人工选择）
--   - binary_members.upline_id = Binary系统上级（自动排线）
--   - 两者可能不同！
-- ==========================================

-- 1️⃣ 创建直推关系表
CREATE TABLE IF NOT EXISTS referral_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 关系双方（都必须是AI代理）
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 推荐人（上级、邀请人）
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- 被推荐人（下级、被邀请人）
  
  -- 关系建立时间
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 状态
  is_active BOOLEAN DEFAULT true,                                    -- 关系是否有效
  
  -- 唯一约束：一个人只能有一个推荐人
  CONSTRAINT unique_referee UNIQUE(referee_id)
);

-- 2️⃣ 创建索引（提升查询性能）
CREATE INDEX IF NOT EXISTS idx_referral_referrer ON referral_relationships(referrer_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_referral_referee ON referral_relationships(referee_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_referral_created ON referral_relationships(created_at DESC);

-- 3️⃣ 添加注释
COMMENT ON TABLE referral_relationships IS '直推关系表：记录AI代理之间的推荐关系（业务关系）';
COMMENT ON COLUMN referral_relationships.referrer_id IS '推荐人ID（邀请别人升级AI代理的人）';
COMMENT ON COLUMN referral_relationships.referee_id IS '被推荐人ID（被邀请升级AI代理的人）';
COMMENT ON COLUMN referral_relationships.is_active IS '关系是否有效（预留字段，用于未来可能的关系失效）';

-- 4️⃣ 启用RLS（行级安全）
ALTER TABLE referral_relationships ENABLE ROW LEVEL SECURITY;

-- 5️⃣ RLS策略：用户可以查看自己的推荐关系
DROP POLICY IF EXISTS "用户查看自己的直推关系" ON referral_relationships;
CREATE POLICY "用户查看自己的直推关系" ON referral_relationships
  FOR SELECT
  USING (
    auth.uid() = referrer_id OR auth.uid() = referee_id
  );

-- 6️⃣ RLS策略：系统可以创建直推关系（通过Service Role）
DROP POLICY IF EXISTS "系统创建直推关系" ON referral_relationships;
CREATE POLICY "系统创建直推关系" ON referral_relationships
  FOR INSERT
  WITH CHECK (true);  -- Service Role可以插入

-- 7️⃣ RLS策略：管理员可以查看所有直推关系
DROP POLICY IF EXISTS "管理员查看所有直推关系" ON referral_relationships;
CREATE POLICY "管理员查看所有直推关系" ON referral_relationships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- 8️⃣ 创建辅助函数：查询某用户的直推人数
CREATE OR REPLACE FUNCTION get_direct_referral_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM referral_relationships
  WHERE referrer_id = p_user_id
    AND is_active = true;
  
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION get_direct_referral_count IS '查询某用户的直推人数（有效关系）';

-- 9️⃣ 创建辅助函数：查询某用户的推荐人
CREATE OR REPLACE FUNCTION get_referrer(p_user_id UUID)
RETURNS TABLE (
  referrer_id UUID,
  referrer_username TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as referrer_id,
    u.username as referrer_username,
    r.created_at
  FROM referral_relationships r
  JOIN users u ON r.referrer_id = u.id
  WHERE r.referee_id = p_user_id
    AND r.is_active = true
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_referrer IS '查询某用户的推荐人信息';

-- 🔟 创建辅助函数：查询某用户的直推列表
CREATE OR REPLACE FUNCTION get_direct_referrals(p_user_id UUID)
RETURNS TABLE (
  referee_id UUID,
  referee_username TEXT,
  is_agent BOOLEAN,
  agent_paid_at TIMESTAMPTZ,
  referral_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as referee_id,
    u.username as referee_username,
    u.is_agent,
    u.agent_paid_at,
    r.created_at as referral_created_at
  FROM referral_relationships r
  JOIN users u ON r.referee_id = u.id
  WHERE r.referrer_id = p_user_id
    AND r.is_active = true
    AND u.is_agent = true  -- 只返回已经是AI代理的
  ORDER BY r.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_direct_referrals IS '查询某用户的直推列表（只包含AI代理）';

-- 1️⃣1️⃣ 创建触发器函数：发放见单奖
CREATE OR REPLACE FUNCTION reward_referrer_on_new_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  v_bonus_amount DECIMAL(10, 2) := 5.00;  -- 见单奖：5U
BEGIN
  -- 获取推荐人ID
  v_referrer_id := NEW.referrer_id;
  
  -- 发放见单奖给推荐人
  PERFORM add_user_balance(v_referrer_id, v_bonus_amount);
  
  -- 记录交易流水
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    description,
    currency,
    related_user_id
  ) VALUES (
    v_referrer_id,
    'referral_bonus',
    v_bonus_amount,
    '直推见单奖：推荐新成员升级AI代理',
    'U',
    NEW.referee_id
  );
  
  RETURN NEW;
END;
$$;

-- 创建触发器：新建直推关系时自动发放见单奖
DROP TRIGGER IF EXISTS trigger_referral_bonus ON referral_relationships;
CREATE TRIGGER trigger_referral_bonus
  AFTER INSERT ON referral_relationships
  FOR EACH ROW
  EXECUTE FUNCTION reward_referrer_on_new_agent();

COMMENT ON FUNCTION reward_referrer_on_new_agent IS '新建直推关系时，自动发放5U见单奖给推荐人';

-- ==========================================
-- ✅ 迁移完成检查
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ 直推关系表创建完成！';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📋 表名：referral_relationships';
  RAISE NOTICE '🎯 用途：';
  RAISE NOTICE '   1. 记录AI代理推荐关系';
  RAISE NOTICE '   2. 计算加速释放率';
  RAISE NOTICE '   3. 发放见单奖';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🔧 辅助函数：';
  RAISE NOTICE '   - get_direct_referral_count(user_id)';
  RAISE NOTICE '   - get_referrer(user_id)';
  RAISE NOTICE '   - get_direct_referrals(user_id)';
  RAISE NOTICE '============================================';
  RAISE NOTICE '⚡ 触发器：';
  RAISE NOTICE '   - trigger_referral_bonus';
  RAISE NOTICE '   - 新建直推关系时自动发放5U见单奖';
  RAISE NOTICE '============================================';
END $$;

