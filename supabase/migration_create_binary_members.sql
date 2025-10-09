-- ============================================
-- 创建 binary_members 表 - 对碰系统V3.0
-- 
-- 功能：独立的二元系统会员表
-- 用途：管理双轨制对碰系统的所有数据
-- 
-- 使用方法：
-- 1. 登录 Supabase Dashboard
-- 2. 进入 SQL Editor → New Query
-- 3. 复制粘贴此脚本
-- 4. 点击 Run 执行
-- ============================================

-- ============================================
-- 1. 创建 binary_members 表
-- ============================================
CREATE TABLE IF NOT EXISTS binary_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 关联用户
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  upline_id UUID REFERENCES users(id),  -- 上级ID（排线上级）
  
  -- 位置信息
  position_side VARCHAR(1) CHECK (position_side IN ('A', 'B')),  -- A区或B区
  position_depth INTEGER DEFAULT 1,  -- 深度（层级）
  
  -- A区统计
  a_side_count INTEGER DEFAULT 0,    -- A区总人数
  a_side_pending INTEGER DEFAULT 0,  -- A区待配对单数
  
  -- B区统计
  b_side_count INTEGER DEFAULT 0,    -- B区总人数
  b_side_pending INTEGER DEFAULT 0,  -- B区待配对单数
  
  -- 收益统计
  total_pairing_bonus DECIMAL(20, 2) DEFAULT 0,  -- 累计对碰奖
  total_level_bonus DECIMAL(20, 2) DEFAULT 0,    -- 累计平级奖
  total_dividend DECIMAL(20, 2) DEFAULT 0,       -- 累计分红
  total_earnings DECIMAL(20, 2) DEFAULT 0,       -- 总收益
  
  -- 状态字段
  is_active BOOLEAN DEFAULT true,                -- 是否激活（复投控制）
  reinvest_count INTEGER DEFAULT 0,              -- 复投次数
  reinvest_required_at TIMESTAMPTZ,              -- 需要复投时间
  auto_reinvest BOOLEAN DEFAULT false,           -- 是否自动复投
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 创建索引（优化查询性能）
-- ============================================
CREATE INDEX IF NOT EXISTS idx_binary_user ON binary_members(user_id);
CREATE INDEX IF NOT EXISTS idx_binary_upline ON binary_members(upline_id);
CREATE INDEX IF NOT EXISTS idx_binary_side ON binary_members(position_side);
CREATE INDEX IF NOT EXISTS idx_binary_active ON binary_members(is_active);
CREATE INDEX IF NOT EXISTS idx_binary_reinvest ON binary_members(reinvest_required_at) WHERE reinvest_required_at IS NOT NULL;

-- ============================================
-- 3. 添加更新时间触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_binary_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_binary_members_updated_at
  BEFORE UPDATE ON binary_members
  FOR EACH ROW
  EXECUTE FUNCTION update_binary_members_updated_at();

-- ============================================
-- 4. 添加RLS（Row Level Security）策略
-- ============================================
ALTER TABLE binary_members ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的记录
CREATE POLICY "Users can view their own binary member record"
  ON binary_members
  FOR SELECT
  USING (user_id = auth.uid()::uuid);

-- 用户可以更新自己的auto_reinvest设置
CREATE POLICY "Users can update their own settings"
  ON binary_members
  FOR UPDATE
  USING (user_id = auth.uid()::uuid)
  WITH CHECK (user_id = auth.uid()::uuid);

-- 系统可以插入新记录（通过服务层）
CREATE POLICY "Service can insert binary members"
  ON binary_members
  FOR INSERT
  WITH CHECK (true);

-- 系统可以更新所有记录（通过服务层）
CREATE POLICY "Service can update binary members"
  ON binary_members
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. 创建辅助视图（方便查询）
-- ============================================

-- 用户二元系统完整信息视图
CREATE OR REPLACE VIEW v_binary_member_info AS
SELECT 
  bm.*,
  u.username,
  u.direct_referral_count,
  u.invite_code,
  upline.username AS upline_username,
  -- 计算可配对数
  LEAST(bm.a_side_pending, bm.b_side_pending) AS ready_pairs,
  -- 计算预估对碰奖（7U × 85% = 5.95U）
  LEAST(bm.a_side_pending, bm.b_side_pending) * 5.95 AS estimated_pairing_bonus,
  -- 是否解锁平级奖
  (u.direct_referral_count >= 2) AS level_bonus_unlocked,
  -- 是否有分红资格
  (u.direct_referral_count >= 10) AS dividend_eligible
FROM binary_members bm
JOIN users u ON bm.user_id = u.id
LEFT JOIN users upline ON bm.upline_id = upline.id;

-- ============================================
-- 6. 创建统计函数（性能优化）
-- ============================================

-- 获取用户的二元系统统计
CREATE OR REPLACE FUNCTION get_binary_stats(p_user_id UUID)
RETURNS TABLE (
  total_members INTEGER,
  a_side_members INTEGER,
  b_side_members INTEGER,
  total_pending INTEGER,
  ready_pairs INTEGER,
  total_earnings DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (a_side_count + b_side_count)::INTEGER AS total_members,
    a_side_count::INTEGER AS a_side_members,
    b_side_count::INTEGER AS b_side_members,
    (a_side_pending + b_side_pending)::INTEGER AS total_pending,
    LEAST(a_side_pending, b_side_pending)::INTEGER AS ready_pairs,
    binary_members.total_earnings
  FROM binary_members
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. 数据迁移（如果users表中已有数据）
-- ============================================

-- 将 users 表中已有的双区数据迁移到 binary_members
-- 注意：只迁移已付费（is_agent=true）的用户
INSERT INTO binary_members (
  user_id,
  upline_id,
  position_side,
  a_side_count,
  b_side_count,
  a_side_pending,
  b_side_pending,
  total_pairing_bonus,
  total_level_bonus,
  total_dividend,
  total_earnings,
  is_active,
  reinvest_count
)
SELECT 
  id AS user_id,
  parent_id AS upline_id,
  network_side AS position_side,
  COALESCE(a_side_sales, 0) AS a_side_count,
  COALESCE(b_side_sales, 0) AS b_side_count,
  GREATEST(COALESCE(a_side_sales, 0) - COALESCE(a_side_settled, 0), 0) AS a_side_pending,
  GREATEST(COALESCE(b_side_sales, 0) - COALESCE(b_side_settled, 0), 0) AS b_side_pending,
  COALESCE(total_pairing_bonus, 0) AS total_pairing_bonus,
  COALESCE(total_level_bonus, 0) AS total_level_bonus,
  COALESCE(total_dividend, 0) AS total_dividend,
  COALESCE(total_earnings, 0) AS total_earnings,
  COALESCE(is_unlocked, true) AS is_active,
  COALESCE(reinvestment_count, 0) AS reinvest_count
FROM users
WHERE is_agent = true  -- 只迁移已付费的用户
  AND parent_id IS NOT NULL  -- 只迁移已排线的用户
ON CONFLICT (user_id) DO NOTHING;  -- 如果已存在则跳过

-- ============================================
-- 8. 创建通知
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ binary_members 表创建成功！';
  RAISE NOTICE '📊 已迁移 % 条记录', (SELECT COUNT(*) FROM binary_members);
  RAISE NOTICE '👥 当前活跃会员：%', (SELECT COUNT(*) FROM binary_members WHERE is_active = true);
  RAISE NOTICE '';
  RAISE NOTICE '🎯 下一步：';
  RAISE NOTICE '1. 检查 binary_members 表是否创建成功';
  RAISE NOTICE '2. 在 Table Editor 中查看数据';
  RAISE NOTICE '3. 测试 BinaryService 功能';
  RAISE NOTICE '4. 刷新前端页面查看效果';
END $$;

-- ============================================
-- 9. 验证脚本（可选）
-- ============================================

-- 查看表结构
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'binary_members'
-- ORDER BY ordinal_position;

-- 查看索引
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'binary_members';

-- 查看策略
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'binary_members';

-- ============================================
-- ✅ 完成！
-- ============================================

