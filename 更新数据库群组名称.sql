-- ==========================================
-- 🔥 更新数据库群组名称：AI 空投计划 → AI 科技创薪
-- ==========================================
-- 使用方法：
-- 1. 打开 Supabase Dashboard
-- 2. 进入 SQL Editor
-- 3. 复制下面的SQL并执行

-- 方案1：更新所有default类型的群组名称
UPDATE chat_groups
SET description = 'AI 科技创薪'
WHERE type = 'default';

-- 方案2：如果有带编号的群组（AI空投计划1, AI空投计划2...），也一并更新
UPDATE chat_groups
SET description = REPLACE(description, 'AI 空投计划', 'AI 科技创薪')
WHERE description LIKE '%AI 空投计划%';

UPDATE chat_groups
SET description = REPLACE(description, 'AI空投计划', 'AI科技创薪')
WHERE description LIKE '%AI空投计划%';

-- 验证更新结果
SELECT 
  id,
  type,
  description,
  member_count,
  is_active,
  created_at
FROM chat_groups
ORDER BY sort_order;

