-- ========================================
-- 修复前后端数据结构不一致问题 (修正版)
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '开始修复前后端数据结构一致性';
    RAISE NOTICE '========================================';
    
    -- ========================================
    -- 第1步：修复 transactions 表
    -- ========================================
    
    -- 添加 currency 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'currency'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN currency VARCHAR(10) DEFAULT 'POINTS';
        RAISE NOTICE '✅ 添加 transactions.currency 字段';
    ELSE
        RAISE NOTICE '⏭️  transactions.currency 已存在';
    END IF;

    -- 添加 status 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'status'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN status VARCHAR(20) DEFAULT 'completed';
        RAISE NOTICE '✅ 添加 transactions.status 字段';
    ELSE
        RAISE NOTICE '⏭️  transactions.status 已存在';
    END IF;

    -- 添加 metadata 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN metadata JSONB;
        RAISE NOTICE '✅ 添加 transactions.metadata 字段';
    ELSE
        RAISE NOTICE '⏭️  transactions.metadata 已存在';
    END IF;

    -- ========================================
    -- 第2步：修复 mining_machines 表
    -- ========================================

    -- 添加 machine_type 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mining_machines' AND column_name = 'machine_type'
    ) THEN
        ALTER TABLE mining_machines 
        ADD COLUMN machine_type VARCHAR(20) DEFAULT 'type1';
        RAISE NOTICE '✅ 添加 mining_machines.machine_type 字段';
    ELSE
        RAISE NOTICE '⏭️  mining_machines.machine_type 已存在';
    END IF;

    -- 添加 compound_level 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mining_machines' AND column_name = 'compound_level'
    ) THEN
        ALTER TABLE mining_machines 
        ADD COLUMN compound_level INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 添加 mining_machines.compound_level 字段';
    ELSE
        RAISE NOTICE '⏭️  mining_machines.compound_level 已存在';
    END IF;

    -- 添加 restart_count 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mining_machines' AND column_name = 'restart_count'
    ) THEN
        ALTER TABLE mining_machines 
        ADD COLUMN restart_count INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 添加 mining_machines.restart_count 字段';
    ELSE
        RAISE NOTICE '⏭️  mining_machines.restart_count 已存在';
    END IF;

    -- 添加 is_first_free 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mining_machines' AND column_name = 'is_first_free'
    ) THEN
        ALTER TABLE mining_machines 
        ADD COLUMN is_first_free BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ 添加 mining_machines.is_first_free 字段';
    ELSE
        RAISE NOTICE '⏭️  mining_machines.is_first_free 已存在';
    END IF;

    -- 添加 last_restart_at 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mining_machines' AND column_name = 'last_restart_at'
    ) THEN
        ALTER TABLE mining_machines 
        ADD COLUMN last_restart_at TIMESTAMPTZ;
        RAISE NOTICE '✅ 添加 mining_machines.last_restart_at 字段';
    ELSE
        RAISE NOTICE '⏭️  mining_machines.last_restart_at 已存在';
    END IF;

    -- ========================================
    -- 第3步：更新现有数据的默认值
    -- ========================================
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '开始更新现有数据';
    RAISE NOTICE '========================================';

    -- 更新 transactions 表
    UPDATE transactions 
    SET currency = 'POINTS' 
    WHERE currency IS NULL;

    UPDATE transactions 
    SET status = 'completed' 
    WHERE status IS NULL;

    -- 更新 mining_machines 表
    UPDATE mining_machines 
    SET machine_type = 'type1' 
    WHERE machine_type IS NULL;

    UPDATE mining_machines 
    SET compound_level = 0 
    WHERE compound_level IS NULL;

    UPDATE mining_machines 
    SET restart_count = 0 
    WHERE restart_count IS NULL;

    UPDATE mining_machines 
    SET is_first_free = false 
    WHERE is_first_free IS NULL;

    RAISE NOTICE '✅ 现有数据更新完成';

    -- ========================================
    -- 第4步：设置NOT NULL约束
    -- ========================================
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '开始设置NOT NULL约束';
    RAISE NOTICE '========================================';

    -- transactions 表
    BEGIN
        ALTER TABLE transactions 
        ALTER COLUMN currency SET NOT NULL;
        RAISE NOTICE '✅ transactions.currency 设置为 NOT NULL';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  transactions.currency 约束可能已存在';
    END;

    BEGIN
        ALTER TABLE transactions 
        ALTER COLUMN status SET NOT NULL;
        RAISE NOTICE '✅ transactions.status 设置为 NOT NULL';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  transactions.status 约束可能已存在';
    END;

    -- mining_machines 表
    BEGIN
        ALTER TABLE mining_machines 
        ALTER COLUMN machine_type SET NOT NULL;
        RAISE NOTICE '✅ mining_machines.machine_type 设置为 NOT NULL';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  mining_machines.machine_type 约束可能已存在';
    END;

    BEGIN
        ALTER TABLE mining_machines 
        ALTER COLUMN compound_level SET NOT NULL;
        RAISE NOTICE '✅ mining_machines.compound_level 设置为 NOT NULL';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  mining_machines.compound_level 约束可能已存在';
    END;

    BEGIN
        ALTER TABLE mining_machines 
        ALTER COLUMN restart_count SET NOT NULL;
        RAISE NOTICE '✅ mining_machines.restart_count 设置为 NOT NULL';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  mining_machines.restart_count 约束可能已存在';
    END;

    BEGIN
        ALTER TABLE mining_machines 
        ALTER COLUMN is_first_free SET NOT NULL;
        RAISE NOTICE '✅ mining_machines.is_first_free 设置为 NOT NULL';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  mining_machines.is_first_free 约束可能已存在';
    END;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ 前后端数据结构一致性修复完成！';
    RAISE NOTICE '========================================';

END $$;

-- ========================================
-- 第5步：验证修复结果
-- ========================================

-- 验证 transactions 表
SELECT 
    '=== transactions 表验证 ===' AS "表",
    COUNT(*) AS "总记录数",
    COUNT(*) FILTER (WHERE currency IS NOT NULL) AS "有currency",
    COUNT(*) FILTER (WHERE status IS NOT NULL) AS "有status"
FROM transactions;

-- 验证 mining_machines 表
SELECT 
    '=== mining_machines 表验证 ===' AS "表",
    COUNT(*) AS "总记录数",
    COUNT(*) FILTER (WHERE machine_type IS NOT NULL) AS "有machine_type",
    COUNT(*) FILTER (WHERE compound_level IS NOT NULL) AS "有compound_level",
    COUNT(*) FILTER (WHERE restart_count IS NOT NULL) AS "有restart_count",
    COUNT(*) FILTER (WHERE is_first_free IS NOT NULL) AS "有is_first_free"
FROM mining_machines;

-- 显示完成消息
SELECT '✅ 所有修复已完成，请刷新浏览器！' AS "状态";

