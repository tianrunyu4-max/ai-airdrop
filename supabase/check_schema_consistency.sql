-- ========================================
-- 检查数据库表结构一致性
-- ========================================

-- 1. 检查 transactions 表结构
SELECT 
    '========== transactions 表字段 ==========' AS info;
    
SELECT 
    column_name AS "字段名",
    data_type AS "数据类型",
    is_nullable AS "可为空",
    column_default AS "默认值"
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- 2. 检查 mining_machines 表字段
SELECT 
    '========== mining_machines 表字段 ==========' AS info;
    
SELECT 
    column_name AS "字段名",
    data_type AS "数据类型",
    is_nullable AS "可为空"
FROM information_schema.columns
WHERE table_name = 'mining_machines'
ORDER BY ordinal_position;

-- 3. 检查是否缺少重要字段
SELECT 
    '========== 缺失字段检查 ==========' AS info;

-- 检查 transactions 是否有 currency 字段
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transactions' AND column_name = 'currency'
        ) 
        THEN '✅ transactions.currency 存在'
        ELSE '❌ transactions.currency 缺失'
    END AS "currency字段";

-- 检查 mining_machines 是否有关键字段
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'mining_machines' AND column_name = 'machine_type'
        ) 
        THEN '✅ mining_machines.machine_type 存在'
        ELSE '❌ mining_machines.machine_type 缺失'
    END AS "machine_type字段",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'mining_machines' AND column_name = 'compound_level'
        ) 
        THEN '✅ mining_machines.compound_level 存在'
        ELSE '❌ mining_machines.compound_level 缺失'
    END AS "compound_level字段",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'mining_machines' AND column_name = 'restart_count'
        ) 
        THEN '✅ mining_machines.restart_count 存在'
        ELSE '❌ mining_machines.restart_count 缺失'
    END AS "restart_count字段",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'mining_machines' AND column_name = 'is_first_free'
        ) 
        THEN '✅ mining_machines.is_first_free 存在'
        ELSE '❌ mining_machines.is_first_free 缺失'
    END AS "is_first_free字段";

