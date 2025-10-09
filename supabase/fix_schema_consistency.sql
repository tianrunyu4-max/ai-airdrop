-- ========================================
-- 修复前后端数据结构不一致问题
-- ========================================
-- 目的：确保数据库表结构与代码期望一致
-- 时间：2025-10-08

-- ========================================
-- 第1步：修复 transactions 表
-- ========================================

-- 添加缺失的字段（如果不存在）
DO $$
BEGIN
    -- 添加 currency 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'currency'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN currency VARCHAR(10) DEFAULT 'POINTS';
        RAISE NOTICE '✅ 添加 transactions.currency 字段';
    END IF;

    -- 添加 status 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'status'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN status VARCHAR(20) DEFAULT 'completed';
        RAISE NOTICE '✅ 添加 transactions.status 字段';
    END IF;

    -- 添加 metadata 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN metadata JSONB;
        RAISE NOTICE '✅ 添加 transactions.metadata 字段';
    END IF;
END $$;

-- ========================================
-- 第2步：修复 mining_machines 表
-- ========================================

DO $$
BEGIN
    -- 添加 machine_type 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mining_machines' AND column_name = 'machine_type'
    ) THEN
        ALTER TABLE mining_machines 
        ADD COLUMN machine_type VARCHAR(20) DEFAULT 'type1';
        RAISE NOTICE '✅ 添加 mining_machines.machine_type 字段';
    END IF;

    -- 添加 compound_level 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mining_machines' AND column_name = 'compound_level'
    ) THEN
        ALTER TABLE mining_machines 
        ADD COLUMN compound_level INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 添加 mining_machines.compound_level 字段';
    END IF;

    -- 添加 restart_count 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mining_machines' AND column_name = 'restart_count'
    ) THEN
        ALTER TABLE mining_machines 
        ADD COLUMN restart_count INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 添加 mining_machines.restart_count 字段';
    END IF;

    -- 添加 is_first_free 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mining_machines' AND column_name = 'is_first_free'
    ) THEN
        ALTER TABLE mining_machines 
        ADD COLUMN is_first_free BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ 添加 mining_machines.is_first_free 字段';
    END IF;

    -- 添加 last_restart_at 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mining_machines' AND column_name = 'last_restart_at'
    ) THEN
        ALTER TABLE mining_machines 
        ADD COLUMN last_restart_at TIMESTAMPTZ;
        RAISE NOTICE '✅ 添加 mining_machines.last_restart_at 字段';
    END IF;
END $$;

-- ========================================
-- 第3步：更新现有数据的默认值
-- ========================================

-- 更新 transactions 表的 currency 为 'POINTS'
UPDATE transactions 
SET currency = 'POINTS' 
WHERE currency IS NULL;

-- 更新 transactions 表的 status 为 'completed'
UPDATE transactions 
SET status = 'completed' 
WHERE status IS NULL;

-- 更新 mining_machines 的 machine_type
UPDATE mining_machines 
SET machine_type = 'type1' 
WHERE machine_type IS NULL;

-- 更新 mining_machines 的 compound_level
UPDATE mining_machines 
SET compound_level = 0 
WHERE compound_level IS NULL;

-- 更新 mining_machines 的 restart_count
UPDATE mining_machines 
SET restart_count = 0 
WHERE restart_count IS NULL;

RAISE NOTICE '✅ 更新现有数据完成';

-- ========================================
-- 第4步：设置NOT NULL约束
-- ========================================

-- 为 transactions 设置 NOT NULL 约束
ALTER TABLE transactions 
ALTER COLUMN currency SET NOT NULL;

ALTER TABLE transactions 
ALTER COLUMN status SET NOT NULL;

-- 为 mining_machines 设置 NOT NULL 约束
ALTER TABLE mining_machines 
ALTER COLUMN machine_type SET NOT NULL;

ALTER TABLE mining_machines 
ALTER COLUMN compound_level SET NOT NULL;

ALTER TABLE mining_machines 
ALTER COLUMN restart_count SET NOT NULL;

ALTER TABLE mining_machines 
ALTER COLUMN is_first_free SET NOT NULL;

RAISE NOTICE '✅ NOT NULL 约束设置完成';

-- ========================================
-- 第5步：验证修复结果
-- ========================================

SELECT '========== 修复完成，验证结果 ==========' AS "状态";

-- 验证 transactions 表
SELECT 
    COUNT(*) AS "transactions记录数",
    COUNT(*) FILTER (WHERE currency IS NOT NULL) AS "有currency的记录",
    COUNT(*) FILTER (WHERE status IS NOT NULL) AS "有status的记录"
FROM transactions;

-- 验证 mining_machines 表
SELECT 
    COUNT(*) AS "mining_machines记录数",
    COUNT(*) FILTER (WHERE machine_type IS NOT NULL) AS "有machine_type的记录",
    COUNT(*) FILTER (WHERE compound_level IS NOT NULL) AS "有compound_level的记录",
    COUNT(*) FILTER (WHERE restart_count IS NOT NULL) AS "有restart_count的记录"
FROM mining_machines;

-- 列出所有字段
SELECT 
    '=== transactions 表字段 ===' AS "表",
    column_name AS "字段",
    data_type AS "类型",
    is_nullable AS "可空"
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

SELECT 
    '=== mining_machines 表字段 ===' AS "表",
    column_name AS "字段",
    data_type AS "类型",
    is_nullable AS "可空"
FROM information_schema.columns
WHERE table_name = 'mining_machines'
ORDER BY ordinal_position;

SELECT '✅ 前后端数据结构一致性修复完成！' AS "完成状态";

