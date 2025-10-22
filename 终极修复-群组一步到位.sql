-- ==========================================
-- 🎯 终极修复：确保登录直接进入赚钱群（简化版）
-- ==========================================
-- 删除所有旧群组，只创建两个正确的群
-- ==========================================

-- 1️⃣ 删除所有旧的聊天群组
DELETE FROM chat_groups;

-- 2️⃣ 创建默认聊天群（AI 自动赚钱系统）- sort_order = 1，最优先
INSERT INTO chat_groups (
  type,
  icon,
  description,
  is_active,
  sort_order
) VALUES (
  'default',
  '💰',
  'AI 自动赚钱系统',
  true,
  1
);

-- 3️⃣ 创建空投推送群（AI 科技空投）- sort_order = 2
INSERT INTO chat_groups (
  type,
  icon,
  description,
  is_active,
  sort_order
) VALUES (
  'ai_push',
  '🚀',
  'AI 科技空投',
  true,
  2
);

-- 4️⃣ 验证结果（应该只有2条记录，赚钱系统排第一）
SELECT id, type, icon, description, is_active, sort_order 
FROM chat_groups 
ORDER BY sort_order;

-- ✅ 执行完成后，硬刷新网页测试（Ctrl + Shift + R）
-- 应该直接进入"AI 自动赚钱系统"，不再跳转！
