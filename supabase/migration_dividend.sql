-- ============================================
-- 分红结算系统 - 数据库迁移脚本
-- 
-- 功能：添加分红池配置表和分红发放函数
-- ============================================

-- 1. 创建系统配置表（用于存储分红池金额）
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dividend_pool DECIMAL(20, 8) DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE system_config IS '系统配置表';
COMMENT ON COLUMN system_config.dividend_pool IS '分红池金额（对碰奖的15%累积）';

-- 2. 创建分红发放函数
CREATE OR REPLACE FUNCTION add_dividend(
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  -- 更新用户余额和总分红
  UPDATE users
  SET 
    u_balance = u_balance + p_amount,
    total_earnings = total_earnings + p_amount,
    total_dividend = total_dividend + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 如果用户不存在，抛出异常
  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在: %', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_dividend IS '发放分红到用户账户';

-- 3. 初始化系统配置（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM system_config LIMIT 1) THEN
    INSERT INTO system_config (dividend_pool) VALUES (0);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- 如果表不存在或有其他错误，忽略
    NULL;
END $$;

-- 4. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_system_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_system_config_timestamp ON system_config;

CREATE TRIGGER trigger_update_system_config_timestamp
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_system_config_timestamp();

-- 验证迁移
DO $$
DECLARE
  table_count INTEGER;
  function_count INTEGER;
  config_count INTEGER;
BEGIN
  -- 检查表是否存在
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_name = 'system_config';
  
  -- 检查函数是否存在
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname = 'add_dividend';
  
  -- 检查配置记录是否存在
  SELECT COUNT(*) INTO config_count
  FROM system_config;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ 表存在: %', (table_count > 0);
  RAISE NOTICE '✅ 函数存在: %', (function_count > 0);
  RAISE NOTICE '✅ 配置记录: %', config_count;
  
  IF table_count > 0 AND function_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════';
    RAISE NOTICE '  💎 分红结算系统 - 数据库迁移完成！';
    RAISE NOTICE '════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '✅ system_config表: 存储分红池金额';
    RAISE NOTICE '✅ add_dividend函数: 发放分红到用户账户';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 分红规则:';
    RAISE NOTICE '   • 对碰奖15%%进入分红池';
    RAISE NOTICE '   • 每周一、三、五、七结算';
    RAISE NOTICE '   • 直推≥10人参与分红';
    RAISE NOTICE '   • 分红池平均分配';
    RAISE NOTICE '';
  ELSE
    RAISE WARNING '⚠️ 迁移可能不完整';
  END IF;
END $$;
