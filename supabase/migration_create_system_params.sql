-- ============================================
-- 系统参数配置表
-- ============================================
-- 说明：
-- 1. 存储所有可配置的系统参数
-- 2. 支持热更新（无需重启）
-- 3. 管理员可通过后台修改
-- ============================================

-- 1. 创建系统参数表
CREATE TABLE IF NOT EXISTS system_params (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,  -- 参数分类（binary, mining, withdraw等）
  param_key VARCHAR(100) NOT NULL UNIQUE,  -- 参数键
  param_value DECIMAL(20,4) NOT NULL,  -- 参数值（统一用数字）
  param_unit VARCHAR(20),  -- 单位（U, %, 次, 人 等）
  description TEXT,  -- 参数说明
  min_value DECIMAL(20,4),  -- 最小值
  max_value DECIMAL(20,4),  -- 最大值
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- 2. 插入Binary系统参数
INSERT INTO system_params (category, param_key, param_value, param_unit, description, min_value, max_value) VALUES
-- 费用相关
('binary', 'agent_fee', 30, 'U', 'AI代理加入费用', 10, 100),
('binary', 'pairing_bonus_per_pair', 7, 'U', '每对对碰奖金', 1, 20),
('binary', 'level_bonus_per_person', 2, 'U', '每人平级奖金', 0.5, 10),
('binary', 'reinvest_threshold', 300, 'U', '原点复投阈值', 100, 1000),

-- 解锁条件
('binary', 'max_free_pairings', 10, '次', '未解锁用户最多对碰次数', 5, 50),
('binary', 'min_direct_referrals', 2, '人', '解锁无限对碰的最少直推人数', 1, 10),
('binary', 'level_bonus_depth', 8, '代', '平级奖代数', 5, 20),
('binary', 'dividend_min_referrals', 10, '人', '分红资格的最少直推人数', 5, 50),

-- 比例相关
('binary', 'member_ratio', 85, '%', '会员获得对碰奖的比例', 50, 95),
('binary', 'platform_ratio', 15, '%', '平台费用比例（进入分红池）', 5, 50),

-- 3. 插入AI学习机参数
('mining', 'machine_price', 7, 'U', '学习机价格', 1, 50),
('mining', 'first_activation_points', 100, '积分', '首次激活所需积分', 50, 500),
('mining', 'daily_release_rate', 10, '%', '每日释放率', 1, 50),
('mining', 'exit_multiplier', 2, '倍', '退出倍数', 1.5, 5),
('mining', 'to_u_percent', 70, '%', '释放到U的比例', 50, 100),
('mining', 'to_transfer_percent', 30, '%', '释放到转账积分的比例', 0, 50),
('mining', 'max_machines_per_user', 10, '台', '每人最多学习机数量', 5, 100),

-- 4. 插入提现参数
('withdraw', 'min_amount', 10, 'U', '最低提现金额', 1, 100),
('withdraw', 'fee_percent', 5, '%', '提现手续费比例', 0, 20),
('withdraw', 'daily_limit', 10000, 'U', '每日提现限额', 1000, 100000)
ON CONFLICT (param_key) DO NOTHING;

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_system_params_category ON system_params(category);
CREATE INDEX IF NOT EXISTS idx_system_params_key ON system_params(param_key);

-- 4. 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_system_params_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_params_timestamp
BEFORE UPDATE ON system_params
FOR EACH ROW
EXECUTE FUNCTION update_system_params_timestamp();

-- 5. 添加RLS策略（只读，只有管理员可以修改）
ALTER TABLE system_params ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取
CREATE POLICY "Anyone can read system params"
ON system_params FOR SELECT
TO public
USING (true);

-- 只有管理员可以修改
CREATE POLICY "Only admins can update system params"
ON system_params FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 完成
SELECT '✅ 系统参数表创建完成' as status;

-- 查看所有参数
SELECT 
  category as 分类,
  param_key as 参数键,
  param_value as 参数值,
  param_unit as 单位,
  description as 说明
FROM system_params
ORDER BY category, param_key;





























