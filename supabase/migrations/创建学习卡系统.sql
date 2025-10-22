-- ==========================================
-- 📚 AI学习卡系统 - 完整数据库设计
-- ==========================================

-- 1️⃣ 创建学习卡表
CREATE TABLE IF NOT EXISTS mining_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- 学习卡基本信息
  type VARCHAR(20) DEFAULT 'type1',
  status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'finished', 'exited')),
  is_active BOOLEAN DEFAULT false,
  
  -- 积分信息（V4.0：100积分 = 签到释放300积分 = 3倍出局）
  total_points DECIMAL(10,2) DEFAULT 100.00,       -- 总积分（初始100）
  released_points DECIMAL(10,2) DEFAULT 0.00,       -- 已释放积分
  daily_output DECIMAL(10,2) DEFAULT 5.00,          -- 每日基础产出
  
  -- 释放率配置
  base_rate DECIMAL(5,4) DEFAULT 0.01,              -- 基础释放率（1%）
  boost_rate DECIMAL(5,4) DEFAULT 0,                 -- 加速释放率
  
  -- 复利和出局
  compound_count INTEGER DEFAULT 0,                  -- 复利次数
  compound_level INTEGER DEFAULT 0,                  -- 复利等级
  
  -- 时间记录
  last_release_date DATE,                            -- 最后释放日期
  last_checkin_date DATE,                            -- 最后签到日期
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  -- 索引
  CONSTRAINT mining_machines_user_idx UNIQUE(user_id, id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mining_machines_user ON mining_machines(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_machines_status ON mining_machines(status);
CREATE INDEX IF NOT EXISTS idx_mining_machines_active ON mining_machines(is_active);

-- 2️⃣ 启用 RLS
ALTER TABLE mining_machines ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看自己的学习卡
CREATE POLICY "用户查看自己的学习卡" ON mining_machines
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 策略：用户可以创建学习卡
CREATE POLICY "用户创建学习卡" ON mining_machines
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略：用户可以更新自己的学习卡
CREATE POLICY "用户更新自己的学习卡" ON mining_machines
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS 策略：管理员查看所有学习卡
CREATE POLICY "管理员查看所有学习卡" ON mining_machines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- 3️⃣ 创建签到记录表
CREATE TABLE IF NOT EXISTS checkin_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  machine_id UUID REFERENCES mining_machines(id) ON DELETE CASCADE,
  
  -- 签到信息
  checkin_date DATE NOT NULL,
  release_rate DECIMAL(5,4),                         -- 本次释放率（1%-15%）
  points_released DECIMAL(10,2),                     -- 本次释放积分
  points_to_u DECIMAL(10,2),                         -- 转为U的积分（85%）
  points_cleared DECIMAL(10,2),                      -- 清零的积分（15%）
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 唯一约束：每张卡每天只能签到一次
  CONSTRAINT checkin_unique UNIQUE(machine_id, checkin_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_checkin_user ON checkin_records(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_machine ON checkin_records(machine_id);
CREATE INDEX IF NOT EXISTS idx_checkin_date ON checkin_records(checkin_date DESC);

-- 4️⃣ 启用签到记录 RLS
ALTER TABLE checkin_records ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户查看自己的签到记录
CREATE POLICY "用户查看自己的签到记录" ON checkin_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 策略：用户创建签到记录
CREATE POLICY "用户创建签到记录" ON checkin_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ✅ 完成！学习卡系统数据库已创建

