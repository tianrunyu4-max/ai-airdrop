-- ============================================
-- 复投机制 - 数据库迁移脚本
-- 
-- 功能：添加账户冻结字段和自动复投设置
-- ============================================

-- 添加is_frozen字段（账户冻结状态）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='is_frozen') THEN
    ALTER TABLE users ADD COLUMN is_frozen BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 添加auto_reinvest字段（自动复投设置）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='auto_reinvest') THEN
    ALTER TABLE users ADD COLUMN auto_reinvest BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_users_is_frozen ON users(is_frozen) WHERE is_frozen = TRUE;

-- 添加注释
COMMENT ON COLUMN users.is_frozen IS '账户是否冻结（达到复投门槛但未复投）';
COMMENT ON COLUMN users.auto_reinvest IS '是否开启自动复投';

-- 验证迁移
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'users' 
    AND column_name IN ('is_frozen', 'auto_reinvest');
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ 新增字段数: %', column_count;
  
  IF column_count = 2 THEN
    RAISE NOTICE '✅ 复投机制字段添加成功！';
  ELSE
    RAISE WARNING '⚠️ 字段数不完整，预期2个，实际%个', column_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '  🔄 复投机制 - 数据库迁移完成！';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ is_frozen字段: 账户冻结状态';
  RAISE NOTICE '✅ auto_reinvest字段: 自动复投设置';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 复投规则:';
  RAISE NOTICE '   • 每结算300U必须复投30U';
  RAISE NOTICE '   • 不复投则账户冻结';
  RAISE NOTICE '   • 可设置自动复投';
  RAISE NOTICE '';
END $$;





































