-- 为用户表添加管理员字段
-- 如果字段已存在则跳过

DO $$ 
BEGIN
  -- 检查字段是否存在
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    -- 添加字段
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    
    -- 更新第一个用户为管理员（可选）
    -- UPDATE users SET is_admin = TRUE WHERE id = (SELECT id FROM users ORDER BY created_at LIMIT 1);
    
    RAISE NOTICE '✅ 已添加 is_admin 字段';
  ELSE
    RAISE NOTICE '⏭️ is_admin 字段已存在，跳过';
  END IF;
END $$;

-- 创建索引以加快管理员查询
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

COMMENT ON COLUMN users.is_admin IS '是否为管理员';

