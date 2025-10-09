-- 添加积分分类字段
-- 将原有的points_balance拆分为mining_points和transfer_points

-- 添加新字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS mining_points DECIMAL(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS transfer_points DECIMAL(10,2) DEFAULT 0;

-- 注释
COMMENT ON COLUMN users.mining_points IS '矿机产出积分（可兑换U）';
COMMENT ON COLUMN users.transfer_points IS '互转积分（不可兑换U）';
COMMENT ON COLUMN users.points_balance IS '总积分余额（mining_points + transfer_points）';

-- 更新矿机表结构
ALTER TABLE mining_machines ADD COLUMN IF NOT EXISTS machine_type VARCHAR(20) DEFAULT 'type1';
ALTER TABLE mining_machines ADD COLUMN IF NOT EXISTS daily_output DECIMAL(10,2) DEFAULT 0;
ALTER TABLE mining_machines ADD COLUMN IF NOT EXISTS production_days INT DEFAULT 0;
ALTER TABLE mining_machines ADD COLUMN IF NOT EXISTS points_cost DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN mining_machines.machine_type IS '矿机型号（type1/type2/type3）';
COMMENT ON COLUMN mining_machines.daily_output IS '每日产出（积分/天）';
COMMENT ON COLUMN mining_machines.production_days IS '生产天数';
COMMENT ON COLUMN mining_machines.points_cost IS '积分成本（购买价格）';






