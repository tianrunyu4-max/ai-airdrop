-- ==========================================
-- 🔥 更新群组名称：AI 自动赚钱系统 → AI 空投计划
-- ==========================================

-- 更新所有 type='default' 的群组描述
UPDATE chat_groups
SET description = 'AI 空投计划'
WHERE type = 'default'
  AND (description LIKE '%自动赚钱%' OR description = 'AI 自动赚钱系统');

-- 如果有带编号的群组，也一并更新
UPDATE chat_groups
SET description = REPLACE(description, 'AI自动赚钱系统', 'AI空投计划')
WHERE type = 'default'
  AND description LIKE '%AI自动赚钱系统%';

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

