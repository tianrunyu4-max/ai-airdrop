-- AI科技 创新发展 - 数据库Schema
-- 持续学习 持续创薪
-- 运行此SQL脚本在Supabase中创建完整数据库结构

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  invite_code VARCHAR(20) UNIQUE,  -- 付费30U后自动生成
  inviter_id UUID REFERENCES users(id),
  parent_id UUID REFERENCES users(id),  -- 双区系统的直接上级
  network_side VARCHAR(1) CHECK (network_side IN ('A', 'B')),  -- A区或B区
  referral_position INT DEFAULT 0,
  has_network BOOLEAN DEFAULT FALSE,
  network_root_id UUID REFERENCES users(id),
  direct_referral_count INT DEFAULT 0,
  
  -- 双区系统业绩字段
  a_side_sales INT DEFAULT 0,        -- A区销售单数
  b_side_sales INT DEFAULT 0,        -- B区销售单数
  a_side_settled INT DEFAULT 0,      -- A区已结算单数
  b_side_settled INT DEFAULT 0,      -- B区已结算单数
  
  -- 收益字段
  total_earnings DECIMAL(10,2) DEFAULT 0,     -- 总收益
  total_pairing_bonus DECIMAL(10,2) DEFAULT 0,  -- 累计对碰奖
  total_level_bonus DECIMAL(10,2) DEFAULT 0,    -- 累计平级奖
  total_dividend DECIMAL(10,2) DEFAULT 0,       -- 累计分红
  
  -- 余额字段
  u_balance DECIMAL(10,2) DEFAULT 0,
  points_balance DECIMAL(10,2) DEFAULT 0,
  mining_points DECIMAL(10,2) DEFAULT 0,    -- 矿机产出积分（可兑换U）
  transfer_points DECIMAL(10,2) DEFAULT 0,  -- 互转积分（不可兑换U）
  
  -- 状态字段
  is_agent BOOLEAN DEFAULT FALSE,           -- 是否付费（30U）
  agent_paid_at TIMESTAMP,
  is_unlocked BOOLEAN DEFAULT FALSE,        -- 是否解锁平级奖（直推≥2人）
  reinvestment_count INT DEFAULT 0,         -- 复投次数
  qualified_for_dividend BOOLEAN DEFAULT FALSE,  -- 是否有分红资格（直推≥10人）
  is_admin BOOLEAN DEFAULT FALSE,
  language VARCHAR(10) DEFAULT 'zh',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
CREATE INDEX IF NOT EXISTS idx_users_inviter ON users(inviter_id);
CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_network_root ON users(network_root_id);
CREATE INDEX IF NOT EXISTS idx_users_network_side ON users(network_side);
CREATE INDEX IF NOT EXISTS idx_users_qualified_dividend ON users(qualified_for_dividend) WHERE qualified_for_dividend = TRUE;

-- ============================================
-- 2. 网体关系表
-- ============================================
CREATE TABLE IF NOT EXISTS network_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INT DEFAULT 1,
  joined_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_owner ON network_nodes(network_owner_id);
CREATE INDEX IF NOT EXISTS idx_network_member ON network_nodes(member_id);

-- ============================================
-- 3. 直推链关系表（用于平级奖 - 3代）
-- ============================================
CREATE TABLE IF NOT EXISTS referral_chain (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  level_1_upline UUID REFERENCES users(id),  -- 第1代直推上级
  level_2_upline UUID REFERENCES users(id),  -- 第2代直推上级
  level_3_upline UUID REFERENCES users(id),  -- 第3代直推上级
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_user ON referral_chain(user_id);

-- ============================================
-- 3.1 对碰奖记录表
-- ============================================
CREATE TABLE IF NOT EXISTS pairing_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pairs_count INT NOT NULL,                  -- 对碰组数
  bonus_amount DECIMAL(10,2) NOT NULL,       -- 奖金金额（组数×7U）
  a_side_before INT NOT NULL,                -- 结算前A区单数
  b_side_before INT NOT NULL,                -- 结算前B区单数
  a_side_after INT NOT NULL,                 -- 结算后A区单数
  b_side_after INT NOT NULL,                 -- 结算后B区单数
  settlement_date DATE NOT NULL,             -- 结算日期
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pairing_user ON pairing_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_pairing_date ON pairing_bonuses(settlement_date DESC);

-- ============================================
-- 3.2 平级奖记录表
-- ============================================
CREATE TABLE IF NOT EXISTS level_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,      -- 获得奖励的上级
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 触发奖励的下级
  level INT NOT NULL CHECK (level BETWEEN 1 AND 3),         -- 第几代（1-3）
  bonus_amount DECIMAL(10,2) NOT NULL,                      -- 奖金金额（2U）
  pairing_bonus_id UUID REFERENCES pairing_bonuses(id),     -- 关联的对碰奖记录
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_level_bonus_user ON level_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_level_bonus_from ON level_bonuses(from_user_id);
CREATE INDEX IF NOT EXISTS idx_level_bonus_date ON level_bonuses(created_at DESC);

-- ============================================
-- 3.3 分红记录表
-- ============================================
CREATE TABLE IF NOT EXISTS dividend_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dividend_amount DECIMAL(10,2) NOT NULL,    -- 分红金额
  total_pool DECIMAL(10,2) NOT NULL,         -- 总分红池
  qualified_members INT NOT NULL,            -- 符合条件会员数
  settlement_date DATE NOT NULL,             -- 结算日期
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dividend_user ON dividend_records(user_id);
CREATE INDEX IF NOT EXISTS idx_dividend_date ON dividend_records(settlement_date DESC);

-- ============================================
-- 4. 交易记录表
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,  -- pairing_bonus, level_bonus, dividend, reinvestment, etc.
  amount DECIMAL(10,2) NOT NULL,
  fee DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) NOT NULL,
  related_user_id UUID REFERENCES users(id),
  description TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  balance_after DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- ============================================
-- 5. 矿机表
-- ============================================
CREATE TABLE IF NOT EXISTS mining_machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  initial_points DECIMAL(10,2) NOT NULL,
  released_points DECIMAL(10,2) DEFAULT 0,
  total_points DECIMAL(10,2) NOT NULL,
  base_rate DECIMAL(5,4) DEFAULT 0.01,
  boost_rate DECIMAL(5,4) DEFAULT 0,
  boost_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  exited_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mining_user ON mining_machines(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_active ON mining_machines(is_active);

-- ============================================
-- 6. 每日释放记录表
-- ============================================
CREATE TABLE IF NOT EXISTS daily_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID REFERENCES mining_machines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  release_date DATE NOT NULL,
  release_amount DECIMAL(10,2) NOT NULL,
  release_rate DECIMAL(5,4) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(machine_id, release_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_release_date ON daily_releases(release_date);
CREATE INDEX IF NOT EXISTS idx_daily_release_user ON daily_releases(user_id);

-- ============================================
-- 7. 提现申请表
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  wallet_address TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  admin_note TEXT,
  applied_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- ============================================
-- 8. 聊天群组表
-- ============================================
CREATE TABLE IF NOT EXISTS chat_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'default_hall',
  member_count INT DEFAULT 0,
  max_members INT DEFAULT 50000,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_type ON chat_groups(type);

-- ============================================
-- 9. 群组成员表
-- ============================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  muted_until TIMESTAMP,
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- ============================================
-- 10. 消息表
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_group ON messages(chat_group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted_at);

-- ============================================
-- 11. 空投信息表
-- ============================================
CREATE TABLE IF NOT EXISTS airdrops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exchange VARCHAR(20) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requirements JSONB,
  rewards TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  ai_score DECIMAL(3,1),
  ai_analysis JSONB,
  url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_airdrops_exchange ON airdrops(exchange);
CREATE INDEX IF NOT EXISTS idx_airdrops_active ON airdrops(is_active);
CREATE INDEX IF NOT EXISTS idx_airdrops_created ON airdrops(created_at DESC);

-- ============================================
-- 12. 系统配置表
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 初始化系统配置
INSERT INTO system_config (key, value, description) VALUES
('agent_fee', '30', '代理费用（U）'),
('spot_award', '8', '见点奖（U）'),
('peer_spot_award', '3', '平级见点奖（U）'),
('peer_levels', '5', '平级见点奖层级数'),
('dividend_per_order', '7', '直推分红每单金额（U）'),
('dividend_days', '[1,3,5,7]', '分红发放日期（周几）'),
('min_referrals_for_dividend', '5', '分红最低直推人数'),
('repurchase_threshold', '300', '复购提示阈值（U）'),
('repurchase_fee', '30', '复购费用（U）'),
('min_withdraw', '20', '最低提现金额（U）'),
('points_to_u_rate', '0.07', '积分兑换U比例（100积分=7U）'),
('u_withdraw_ratio', '0.7', '积分兑换U比例（70%）'),
('transfer_ratio', '0.3', '互转流通比例（30%）')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 存储过程和函数
-- ============================================

-- 增加群组成员数
CREATE OR REPLACE FUNCTION increment_group_members(group_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE chat_groups 
  SET member_count = member_count + 1
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql;

-- 自动删除10分钟前的消息
CREATE OR REPLACE FUNCTION auto_delete_old_messages()
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET deleted_at = NOW()
  WHERE created_at < NOW() - INTERVAL '10 minutes'
    AND deleted_at IS NULL
    AND type = 'text';
END;
$$ LANGUAGE plpgsql;

-- 生成邀请码
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 触发器
-- ============================================

-- 自动设置updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的数据
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY transactions_select_own ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY mining_machines_select_own ON mining_machines
  FOR SELECT USING (auth.uid() = user_id);

-- 消息可被群组成员查看
CREATE POLICY messages_select_group_members ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = messages.chat_group_id
        AND group_members.user_id = auth.uid()
    )
  );

-- ============================================
-- 创建默认大厅
-- ============================================
INSERT INTO chat_groups (name, type, member_count, max_members)
VALUES ('默认大厅 1', 'default_hall', 0, 50000);

-- 完成
SELECT 'Database schema created successfully!' AS status;

