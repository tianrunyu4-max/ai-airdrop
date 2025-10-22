-- ============================================
-- 分红结算系统 - 数据库迁移脚本 v3
-- 
-- 功能：添加分红池配置表和分红发放函数
-- 兼容已存在的表结构
-- ============================================

-- 1. 检查并创建system_config表
DO $$ 
BEGIN
  -- 如果表不存在，创建表
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_name='system_config') THEN
    CREATE TABLE system_config (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      dividend_pool DECIMAL(20, 8) DEFAULT 0 NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ system_config表已创建';
  ELSE
    RAISE NOTICE '⚠️ system_config表已存在';
  END IF;
END $$;

-- 2. 添加dividend_pool列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='system_config' AND column_name='dividend_pool') THEN
    ALTER TABLE system_config ADD COLUMN dividend_pool DECIMAL(20, 8) DEFAULT 0 NOT NULL;
    RAISE NOTICE '✅ dividend_pool列已添加';
  ELSE
    RAISE NOTICE '⚠️ dividend_pool列已存在';
  END IF;
END $$;

-- 3. 添加created_at列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='system_config' AND column_name='created_at') THEN
    ALTER TABLE system_config ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ created_at列已添加';
  END IF;
END $$;

-- 4. 添加updated_at列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='system_config' AND column_name='updated_at') THEN
    ALTER TABLE system_config ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ updated_at列已添加';
  END IF;
END $$;

-- 5. 初始化系统配置（如果表为空）
INSERT INTO system_config (dividend_pool, created_at, updated_at)
SELECT 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM system_config);

-- 6. 创建分红发放函数
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

-- 7. 创建更新时间触发器
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

-- 8. 添加注释
COMMENT ON TABLE system_config IS '系统配置表';
COMMENT ON COLUMN system_config.dividend_pool IS '分红池金额（对碰奖的15%累积）';
COMMENT ON FUNCTION add_dividend IS '发放分红到用户账户';

-- 9. 验证迁移
DO $$
DECLARE
  config_count INTEGER;
  pool_amount DECIMAL;
BEGIN
  SELECT COUNT(*) INTO config_count FROM system_config;
  SELECT COALESCE(SUM(dividend_pool), 0) INTO pool_amount FROM system_config;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '  💎 分红结算系统 - 数据库迁移完成！';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ system_config表已就绪';
  RAISE NOTICE '✅ add_dividend函数已创建';
  RAISE NOTICE '✅ 配置记录数: %', config_count;
  RAISE NOTICE '✅ 当前分红池: % U', pool_amount;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 分红规则:';
  RAISE NOTICE '   • 对碰奖15%%进入分红池';
  RAISE NOTICE '   • 每周一、三、五、日结算';
  RAISE NOTICE '   • 直推≥10人参与分红';
  RAISE NOTICE '   • 分红池平均分配';
  RAISE NOTICE '';
END $$;





































