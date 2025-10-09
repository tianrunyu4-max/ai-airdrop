-- ========================================
-- 快速修复和测试脚本
-- ========================================
-- 目的：禁用RLS并验证数据
-- 使用方法：在 Supabase SQL Editor 中执行此脚本

-- ========================================
-- 第1步：禁用RLS（行级安全策略）
-- ========================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE mining_machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE binary_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE dividend_pool DISABLE ROW LEVEL SECURITY;
ALTER TABLE dividend_records DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 第2步：验证学习机数据
-- ========================================

-- 统计信息
SELECT 
    '========== 学习机统计 ==========' AS "步骤",
    '' AS "详情";

SELECT 
    COUNT(*) AS "总学习机数",
    COUNT(*) FILTER (WHERE is_active = true) AS "活跃学习机数",
    COALESCE(SUM(initial_points), 0) AS "总投入积分",
    COALESCE(SUM(released_points), 0) AS "总释放积分"
FROM mining_machines;

-- 详细信息
SELECT 
    '========== 学习机详情 ==========' AS "步骤",
    '' AS "详情";

SELECT 
    id AS "学习机ID",
    user_id AS "用户ID",
    initial_points AS "初始积分",
    released_points AS "已释放",
    is_active AS "是否活跃",
    created_at AS "创建时间"
FROM mining_machines
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- 第3步：验证用户信息
-- ========================================

SELECT 
    '========== 用户信息 ==========' AS "步骤",
    '' AS "详情";

SELECT 
    id AS "用户ID",
    username AS "用户名",
    invite_code AS "邀请码",
    is_admin AS "是否管理员",
    is_agent AS "是否代理"
FROM users
WHERE invite_code = 'EHPHR0AI';

-- ========================================
-- 完成！
-- ========================================

SELECT '✅ 脚本执行完成！' AS "状态", 
       '如果上面显示有学习机数据，请返回浏览器刷新页面' AS "下一步";

