-- ============================================
-- 一点多单制：增加订单数量字段
-- ============================================
-- 说明：
-- 1. 每个Binary成员有一个order_count（订单数量）
-- 2. 初始加入 = 1单
-- 3. 复投 = +1单
-- 4. 对碰计算基于单量，不是人数
-- ============================================

-- 1. 增加订单数量字段
ALTER TABLE binary_members 
ADD COLUMN IF NOT EXISTS order_count INT DEFAULT 1 NOT NULL;

-- 2. 为现有数据设置默认值
UPDATE binary_members 
SET order_count = 1 
WHERE order_count IS NULL OR order_count = 0;

-- 3. 添加索引（优化查询）
CREATE INDEX IF NOT EXISTS idx_binary_members_order_count 
ON binary_members(order_count);

-- 4. 添加注释
COMMENT ON COLUMN binary_members.order_count IS '订单数量（一点多单制：初始1单，复投+1单）';

-- 5. 说明：a_side_count/b_side_count/a_side_pending/b_side_pending 现在表示单量而不是人数
COMMENT ON COLUMN binary_members.a_side_count IS 'A区总订单数量（包括所有下级）';
COMMENT ON COLUMN binary_members.b_side_count IS 'B区总订单数量（包括所有下级）';
COMMENT ON COLUMN binary_members.a_side_pending IS 'A区待配对订单数量';
COMMENT ON COLUMN binary_members.b_side_pending IS 'B区待配对订单数量';

-- 完成
SELECT '✅ 一点多单制迁移完成' as status;





















