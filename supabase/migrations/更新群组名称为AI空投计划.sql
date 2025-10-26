-- ==========================================
-- 🔥 更新群组名称：AI 自动赚钱系统 → AI 科技创薪
-- ==========================================

-- 更新所有 type='default' 的群组描述
UPDATE chat_groups
SET description = 'AI 科技创薪'
WHERE type = 'default'
  AND (description LIKE '%自动赚钱%' OR description = 'AI 自动赚钱系统' OR description LIKE '%空投计划%');

-- 如果有带编号的群组，也一并更新
UPDATE chat_groups
SET description = REPLACE(REPLACE(description, 'AI自动赚钱系统', 'AI科技创薪'), 'AI空投计划', 'AI科技创薪')
WHERE type = 'default'
  AND (description LIKE '%AI自动赚钱系统%' OR description LIKE '%空投计划%');

-- 验证更新结果
SELECT 
  id,
  type,
  description,
  sort_order,
  is_active
FROM chat_groups
ORDER BY sort_order;

-- ==========================================
-- ✅ 更新完成！
-- ==========================================

