-- ========================================
-- V5.0 重大升级 - 数据库迁移（简化版）
-- 更新日期：2025-10-15
-- 
-- 核心变更：
-- 1. 团队内部滑落（取消全局弱区优先）
-- 2. 定时结算（每天凌晨12点）
-- 3. 删除平级奖、删除贡献奖、删除分红池
-- 4. 复投240U，复购单给弱区
-- 5. 对碰奖：85%给会员，15%预留
-- ========================================

-- 1. 更新系统参数
-- ========================================

-- 复投阈值：200U → 240U（8倍）
UPDATE system_params 
SET param_value = 240, 
    description = '复投阈值：赚240U（8倍）需复投30U' 
WHERE param_key = 'reinvest_threshold';

-- 删除旧的平级奖参数（V5.0已删除）
UPDATE system_params 
SET description = '平级奖深度（已废弃，V5.0已删除）' 
WHERE param_key = 'level_bonus_depth';

UPDATE system_params 
SET description = '平级奖金额（已废弃，V5.0已删除）' 
WHERE param_key = 'level_bonus_per_person';

-- 新增V5.0系统参数
INSERT INTO system_params (param_key, param_value, description, param_group) VALUES
('pairing_settlement_time', '00:00', '对碰结算时间（每天凌晨12点）', 'binary'),
('auto_placement_strategy', 'TEAM_INTERNAL', '自动排线策略（V5.0：团队内部滑落）', 'binary'),
('reserved_ratio', '15', '对碰奖预留比例（15%预留，暂不分配）', 'binary')
ON CONFLICT (param_key) DO UPDATE
SET param_value = EXCLUDED.param_value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 2. 创建定时任务表
-- ========================================

CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_name TEXT UNIQUE NOT NULL,
  cron_schedule TEXT NOT NULL,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  is_enabled BOOLEAN DEFAULT true,
  task_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE scheduled_tasks IS 'V5.0 定时任务配置表';
COMMENT ON COLUMN scheduled_tasks.task_name IS '任务名称';
COMMENT ON COLUMN scheduled_tasks.cron_schedule IS 'Cron表达式';
COMMENT ON COLUMN scheduled_tasks.last_run IS '上次运行时间';
COMMENT ON COLUMN scheduled_tasks.next_run IS '下次运行时间';
COMMENT ON COLUMN scheduled_tasks.is_enabled IS '是否启用';

-- 插入定时任务
INSERT INTO scheduled_tasks (task_name, cron_schedule, task_description) VALUES
('pairing_settlement', '0 0 * * *', '每天凌晨12点对碰结算')
ON CONFLICT (task_name) DO UPDATE
SET cron_schedule = EXCLUDED.cron_schedule,
    task_description = EXCLUDED.task_description,
    updated_at = NOW();

-- 3. 创建定时任务日志表
-- ========================================

CREATE TABLE IF NOT EXISTS task_execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_name TEXT NOT NULL,
  execution_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'running')),
  affected_users INTEGER DEFAULT 0,
  total_amount DECIMAL(20, 2) DEFAULT 0,
  error_message TEXT,
  execution_duration INTEGER, -- 毫秒
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_task_logs_task_name ON task_execution_logs(task_name);
CREATE INDEX IF NOT EXISTS idx_task_logs_execution_time ON task_execution_logs(execution_time DESC);

COMMENT ON TABLE task_execution_logs IS 'V5.0 定时任务执行日志';
COMMENT ON COLUMN task_execution_logs.affected_users IS '影响的用户数';
COMMENT ON COLUMN task_execution_logs.total_amount IS '总金额';
COMMENT ON COLUMN task_execution_logs.execution_duration IS '执行时长（毫秒）';

-- 4. 更新binary_members表（新增字段用于定时结算）
-- ========================================

-- 新增pending_settlement字段，用于记录待结算的对碰奖
ALTER TABLE binary_members 
ADD COLUMN IF NOT EXISTS pending_settlement_amount DECIMAL(20, 2) DEFAULT 0;

COMMENT ON COLUMN binary_members.pending_settlement_amount IS 'V5.0 待结算对碰奖金额（每天凌晨12点结算）';

-- 5. 新增预留资金表（15%预留）
-- ========================================

CREATE TABLE IF NOT EXISTS reserved_funds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pairing_record_id UUID,
  amount DECIMAL(20, 2) NOT NULL,
  percentage DECIMAL(5, 2) DEFAULT 15.00,
  source_type TEXT DEFAULT 'pairing',
  status TEXT DEFAULT 'reserved' CHECK (status IN ('reserved', 'allocated', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_reserved_funds_status ON reserved_funds(status);
CREATE INDEX IF NOT EXISTS idx_reserved_funds_created ON reserved_funds(created_at DESC);

-- 添加注释
COMMENT ON TABLE reserved_funds IS 'V5.0 预留资金表（对碰奖的15%）';
COMMENT ON COLUMN reserved_funds.amount IS '预留金额';
COMMENT ON COLUMN reserved_funds.percentage IS '预留百分比';
COMMENT ON COLUMN reserved_funds.source_type IS '来源类型';
COMMENT ON COLUMN reserved_funds.status IS '状态：reserved预留/allocated已分配/cancelled已取消';

-- 6. 创建V5.0升级标记
-- ========================================

INSERT INTO system_config (key, value, description) VALUES
('v5_upgrade_completed', 'true'::jsonb, 'V5.0升级已完成'),
('v5_upgrade_date', to_jsonb(NOW()::text), 'V5.0升级日期')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();

-- 7. 数据清理（可选）
-- ========================================

-- 标记旧的平级奖记录
UPDATE rewards 
SET description = CONCAT(description, ' (V4.2历史记录)') 
WHERE reward_type = 'level_bonus' 
AND description NOT LIKE '%(V4.2历史记录)%';

-- ========================================
-- 迁移完成
-- ========================================

-- 输出升级信息
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'V5.0 数据库升级完成（简化版）！';
  RAISE NOTICE '升级时间：%', NOW();
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 1. 系统参数已更新（复投240U、预留15%）';
  RAISE NOTICE '✅ 2. 定时任务表已创建';
  RAISE NOTICE '✅ 3. 定时任务日志表已创建';
  RAISE NOTICE '✅ 4. Binary成员表已更新';
  RAISE NOTICE '✅ 5. 预留资金表已创建';
  RAISE NOTICE '✅ 6. 旧数据已标记';
  RAISE NOTICE '========================================';
  RAISE NOTICE '核心变更：';
  RAISE NOTICE '  - 删除平级奖、贡献奖、分红池';
  RAISE NOTICE '  - 只保留对碰奖（85%会员+15%预留）';
  RAISE NOTICE '  - 团队内部滑落+定时结算';
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚠️ 注意：请配置定时任务（Supabase Edge Functions）';
  RAISE NOTICE '========================================';
END$$;

