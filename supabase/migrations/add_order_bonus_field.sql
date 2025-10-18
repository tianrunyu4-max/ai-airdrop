-- ========================================
-- 添加见单奖字段
-- 创建时间：2025-10-18
-- ========================================

-- 给 binary_members 表添加 total_order_bonus 字段
ALTER TABLE binary_members
ADD COLUMN IF NOT EXISTS total_order_bonus DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- 添加注释
COMMENT ON COLUMN binary_members.total_order_bonus IS '见单奖总额：直推链5层，下线每次对碰各获得1U';

-- 创建见单奖记录表（可选，用于详细统计）
CREATE TABLE IF NOT EXISTS order_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generation INT NOT NULL CHECK (generation >= 1 AND generation <= 5),
  pairs INT NOT NULL DEFAULT 1,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  trigger_username VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_order_bonuses_user_id ON order_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_order_bonuses_trigger_user_id ON order_bonuses(trigger_user_id);
CREATE INDEX IF NOT EXISTS idx_order_bonuses_created_at ON order_bonuses(created_at);

-- 添加注释
COMMENT ON TABLE order_bonuses IS '见单奖记录表：记录每次见单奖的详细信息';
COMMENT ON COLUMN order_bonuses.user_id IS '获得奖励的用户ID';
COMMENT ON COLUMN order_bonuses.trigger_user_id IS '触发对碰的下线用户ID';
COMMENT ON COLUMN order_bonuses.generation IS '层级（1-5层）';
COMMENT ON COLUMN order_bonuses.pairs IS '对碰组数';
COMMENT ON COLUMN order_bonuses.amount IS '奖励金额';
COMMENT ON COLUMN order_bonuses.trigger_username IS '触发者用户名（冗余字段，便于查询）';

