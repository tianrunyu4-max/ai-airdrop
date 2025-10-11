-- ============================================
-- 修复签到功能 - 添加缺失的数据库字段
-- ============================================
-- 
-- 问题：签到功能需要的字段在mining_machines表中缺失
-- 解决：添加last_checkin_date、checkin_count、is_checked_in_today字段
--
-- 使用方法：
-- 1. 登录 Supabase Dashboard
-- 2. 进入 SQL Editor → New Query
-- 3. 复制粘贴此脚本
-- 4. 点击 Run 执行
-- ============================================

-- ============================================
-- 1. 添加签到相关字段到mining_machines表
-- ============================================

-- 添加最后签到日期字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mining_machines' AND column_name = 'last_checkin_date'
  ) THEN
    ALTER TABLE mining_machines 
    ADD COLUMN last_checkin_date DATE;
    RAISE NOTICE '✅ 添加 mining_machines.last_checkin_date 字段';
  ELSE
    RAISE NOTICE '⏭️  mining_machines.last_checkin_date 已存在';
  END IF;
END $$;

-- 添加签到次数字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mining_machines' AND column_name = 'checkin_count'
  ) THEN
    ALTER TABLE mining_machines 
    ADD COLUMN checkin_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ 添加 mining_machines.checkin_count 字段';
  ELSE
    RAISE NOTICE '⏭️  mining_machines.checkin_count 已存在';
  END IF;
END $$;

-- 添加今日是否已签到字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mining_machines' AND column_name = 'is_checked_in_today'
  ) THEN
    ALTER TABLE mining_machines 
    ADD COLUMN is_checked_in_today BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ 添加 mining_machines.is_checked_in_today 字段';
  ELSE
    RAISE NOTICE '⏭️  mining_machines.is_checked_in_today 已存在';
  END IF;
END $$;

-- 添加状态字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mining_machines' AND column_name = 'status'
  ) THEN
    ALTER TABLE mining_machines 
    ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    RAISE NOTICE '✅ 添加 mining_machines.status 字段';
  ELSE
    RAISE NOTICE '⏭️  mining_machines.status 已存在';
  END IF;
END $$;

-- 添加是否激活字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mining_machines' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE mining_machines 
    ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE '✅ 添加 mining_machines.is_active 字段';
  ELSE
    RAISE NOTICE '⏭️  mining_machines.is_active 已存在';
  END IF;
END $$;

-- ============================================
-- 2. 更新现有数据的默认值
-- ============================================

-- 更新checkin_count的默认值
UPDATE mining_machines 
SET checkin_count = 0 
WHERE checkin_count IS NULL;

-- 更新is_checked_in_today的默认值
UPDATE mining_machines 
SET is_checked_in_today = FALSE 
WHERE is_checked_in_today IS NULL;

-- 更新status的默认值
UPDATE mining_machines 
SET status = 'active' 
WHERE status IS NULL;

-- 更新is_active的默认值
UPDATE mining_machines 
SET is_active = TRUE 
WHERE is_active IS NULL;

-- ============================================
-- 3. 验证字段是否添加成功
-- ============================================

-- 检查mining_machines表结构
SELECT 
    '=== mining_machines 表字段验证 ===' AS "验证结果",
    column_name AS "字段名",
    data_type AS "数据类型",
    is_nullable AS "可为空",
    column_default AS "默认值"
FROM information_schema.columns
WHERE table_name = 'mining_machines'
  AND column_name IN ('last_checkin_date', 'checkin_count', 'is_checked_in_today', 'status', 'is_active')
ORDER BY column_name;

-- 检查数据更新情况
SELECT 
    '=== 数据更新验证 ===' AS "验证结果",
    COUNT(*) AS "总记录数",
    COUNT(*) FILTER (WHERE checkin_count IS NOT NULL) AS "有checkin_count",
    COUNT(*) FILTER (WHERE is_checked_in_today IS NOT NULL) AS "有is_checked_in_today",
    COUNT(*) FILTER (WHERE status IS NOT NULL) AS "有status",
    COUNT(*) FILTER (WHERE is_active IS NOT NULL) AS "有is_active"
FROM mining_machines;

-- ============================================
-- 4. 修复daily_releases表结构
-- ============================================

-- 添加points_to_u字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_releases' AND column_name = 'points_to_u'
  ) THEN
    ALTER TABLE daily_releases 
    ADD COLUMN points_to_u DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE '✅ 添加 daily_releases.points_to_u 字段';
  ELSE
    RAISE NOTICE '⏭️  daily_releases.points_to_u 已存在';
  END IF;
END $$;

-- 添加points_burned字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_releases' AND column_name = 'points_burned'
  ) THEN
    ALTER TABLE daily_releases 
    ADD COLUMN points_burned DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE '✅ 添加 daily_releases.points_burned 字段';
  ELSE
    RAISE NOTICE '⏭️  daily_releases.points_burned 已存在';
  END IF;
END $$;

-- 添加u_amount字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_releases' AND column_name = 'u_amount'
  ) THEN
    ALTER TABLE daily_releases 
    ADD COLUMN u_amount DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE '✅ 添加 daily_releases.u_amount 字段';
  ELSE
    RAISE NOTICE '⏭️  daily_releases.u_amount 已存在';
  END IF;
END $$;

-- ============================================
-- 5. 完成提示
-- ============================================

SELECT '✅ 签到功能数据库字段修复完成！' AS "修复状态",
       '现在可以正常使用签到功能了' AS "说明";

-- ============================================
-- 5. 使用说明
-- ============================================

SELECT 
    '📋 使用说明' AS "说明",
    '1. 刷新浏览器页面' AS "步骤1",
    '2. 进入AI学习页面' AS "步骤2", 
    '3. 点击"📅 签到启动释放"按钮' AS "步骤3",
    '4. 检查是否成功释放积分' AS "步骤4";
