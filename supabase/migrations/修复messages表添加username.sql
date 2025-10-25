-- ==========================================
-- 修复messages表 - 添加username字段
-- ==========================================

-- 添加username列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'username'
  ) THEN
    ALTER TABLE messages ADD COLUMN username TEXT;
  END IF;
END $$;

-- 更新现有消息的username（从users表）
UPDATE messages m
SET username = u.username
FROM users u
WHERE m.user_id = u.id
  AND m.username IS NULL;

-- 设置默认值
ALTER TABLE messages ALTER COLUMN username SET DEFAULT 'User';

-- ==========================================
-- ✅ 修复完成
-- ==========================================

