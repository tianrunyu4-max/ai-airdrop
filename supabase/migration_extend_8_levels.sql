-- ============================================
-- 扩展平级奖到8代 - referral_chain表升级
-- 
-- 功能：支持8代平级奖追溯
-- 更新日期：2025-10-07
-- 
-- 使用方法：
-- 1. 登录 Supabase Dashboard
-- 2. 进入 SQL Editor → New Query
-- 3. 复制粘贴此脚本
-- 4. 点击 Run 执行
-- ============================================

-- ============================================
-- 1. 扩展 referral_chain 表到8代
-- ============================================

-- 添加第4代到第8代字段
DO $$ 
BEGIN
  -- Level 4
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='referral_chain' AND column_name='level_4_upline') THEN
    ALTER TABLE referral_chain ADD COLUMN level_4_upline UUID REFERENCES users(id);
    RAISE NOTICE '✅ 添加 level_4_upline 字段';
  END IF;
  
  -- Level 5
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='referral_chain' AND column_name='level_5_upline') THEN
    ALTER TABLE referral_chain ADD COLUMN level_5_upline UUID REFERENCES users(id);
    RAISE NOTICE '✅ 添加 level_5_upline 字段';
  END IF;
  
  -- Level 6
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='referral_chain' AND column_name='level_6_upline') THEN
    ALTER TABLE referral_chain ADD COLUMN level_6_upline UUID REFERENCES users(id);
    RAISE NOTICE '✅ 添加 level_6_upline 字段';
  END IF;
  
  -- Level 7
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='referral_chain' AND column_name='level_7_upline') THEN
    ALTER TABLE referral_chain ADD COLUMN level_7_upline UUID REFERENCES users(id);
    RAISE NOTICE '✅ 添加 level_7_upline 字段';
  END IF;
  
  -- Level 8
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='referral_chain' AND column_name='level_8_upline') THEN
    ALTER TABLE referral_chain ADD COLUMN level_8_upline UUID REFERENCES users(id);
    RAISE NOTICE '✅ 添加 level_8_upline 字段';
  END IF;
END $$;

-- ============================================
-- 2. 创建辅助函数：构建直推链
-- ============================================

-- 递归获取用户的8代直推链
CREATE OR REPLACE FUNCTION get_upline_chain(p_user_id UUID, p_depth INTEGER DEFAULT 8)
RETURNS TABLE (
  level INTEGER,
  upline_id UUID,
  upline_username VARCHAR
) AS $$
DECLARE
  v_current_id UUID;
  v_level INTEGER;
BEGIN
  v_current_id := p_user_id;
  v_level := 0;
  
  WHILE v_level < p_depth LOOP
    -- 获取当前用户的邀请人
    SELECT inviter_id INTO v_current_id
    FROM users
    WHERE id = v_current_id;
    
    -- 如果没有邀请人，退出循环
    EXIT WHEN v_current_id IS NULL;
    
    v_level := v_level + 1;
    
    -- 返回当前层级信息
    RETURN QUERY
    SELECT 
      v_level AS level,
      v_current_id AS upline_id,
      u.username AS upline_username
    FROM users u
    WHERE u.id = v_current_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. 创建或更新直推链记录函数
-- ============================================

CREATE OR REPLACE FUNCTION build_referral_chain(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_level_1 UUID;
  v_level_2 UUID;
  v_level_3 UUID;
  v_level_4 UUID;
  v_level_5 UUID;
  v_level_6 UUID;
  v_level_7 UUID;
  v_level_8 UUID;
BEGIN
  -- 获取8代上级
  SELECT inviter_id INTO v_level_1 FROM users WHERE id = p_user_id;
  IF v_level_1 IS NULL THEN RETURN; END IF;
  
  SELECT inviter_id INTO v_level_2 FROM users WHERE id = v_level_1;
  SELECT inviter_id INTO v_level_3 FROM users WHERE id = v_level_2;
  SELECT inviter_id INTO v_level_4 FROM users WHERE id = v_level_3;
  SELECT inviter_id INTO v_level_5 FROM users WHERE id = v_level_4;
  SELECT inviter_id INTO v_level_6 FROM users WHERE id = v_level_5;
  SELECT inviter_id INTO v_level_7 FROM users WHERE id = v_level_6;
  SELECT inviter_id INTO v_level_8 FROM users WHERE id = v_level_7;
  
  -- 插入或更新 referral_chain
  INSERT INTO referral_chain (
    user_id,
    level_1_upline,
    level_2_upline,
    level_3_upline,
    level_4_upline,
    level_5_upline,
    level_6_upline,
    level_7_upline,
    level_8_upline,
    updated_at
  ) VALUES (
    p_user_id,
    v_level_1,
    v_level_2,
    v_level_3,
    v_level_4,
    v_level_5,
    v_level_6,
    v_level_7,
    v_level_8,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    level_1_upline = v_level_1,
    level_2_upline = v_level_2,
    level_3_upline = v_level_3,
    level_4_upline = v_level_4,
    level_5_upline = v_level_5,
    level_6_upline = v_level_6,
    level_7_upline = v_level_7,
    level_8_upline = v_level_8,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. 批量重建所有用户的直推链
-- ============================================

DO $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '开始重建直推链...';
  
  FOR v_user IN SELECT id FROM users WHERE inviter_id IS NOT NULL
  LOOP
    PERFORM build_referral_chain(v_user.id);
    v_count := v_count + 1;
    
    -- 每100条记录输出一次进度
    IF v_count % 100 = 0 THEN
      RAISE NOTICE '已处理 % 条记录', v_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ 完成！共处理 % 条记录', v_count;
END $$;

-- ============================================
-- 5. 创建触发器：自动维护直推链
-- ============================================

-- 当用户注册或更新邀请人时，自动更新直推链
CREATE OR REPLACE FUNCTION trigger_update_referral_chain()
RETURNS TRIGGER AS $$
BEGIN
  -- 仅当 inviter_id 发生变化时才更新
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.inviter_id IS DISTINCT FROM NEW.inviter_id) THEN
    PERFORM build_referral_chain(NEW.id);
    
    -- 同时更新下级的直推链（因为他们的上级链可能变了）
    UPDATE users SET updated_at = NOW()
    WHERE inviter_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS trigger_users_referral_chain ON users;

-- 创建新触发器
CREATE TRIGGER trigger_users_referral_chain
  AFTER INSERT OR UPDATE OF inviter_id ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_referral_chain();

-- ============================================
-- 6. 创建索引（优化查询性能）
-- ============================================

CREATE INDEX IF NOT EXISTS idx_referral_level_4 ON referral_chain(level_4_upline) WHERE level_4_upline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referral_level_5 ON referral_chain(level_5_upline) WHERE level_5_upline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referral_level_6 ON referral_chain(level_6_upline) WHERE level_6_upline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referral_level_7 ON referral_chain(level_7_upline) WHERE level_7_upline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referral_level_8 ON referral_chain(level_8_upline) WHERE level_8_upline IS NOT NULL;

-- ============================================
-- 7. 创建查询视图（方便使用）
-- ============================================

-- 用户完整直推链视图（8代）
CREATE OR REPLACE VIEW v_user_upline_chain AS
SELECT 
  rc.user_id,
  u.username AS user_name,
  rc.level_1_upline,
  u1.username AS level_1_name,
  u1.direct_referral_count >= 2 AS level_1_unlocked,
  rc.level_2_upline,
  u2.username AS level_2_name,
  u2.direct_referral_count >= 2 AS level_2_unlocked,
  rc.level_3_upline,
  u3.username AS level_3_name,
  u3.direct_referral_count >= 2 AS level_3_unlocked,
  rc.level_4_upline,
  u4.username AS level_4_name,
  u4.direct_referral_count >= 2 AS level_4_unlocked,
  rc.level_5_upline,
  u5.username AS level_5_name,
  u5.direct_referral_count >= 2 AS level_5_unlocked,
  rc.level_6_upline,
  u6.username AS level_6_name,
  u6.direct_referral_count >= 2 AS level_6_unlocked,
  rc.level_7_upline,
  u7.username AS level_7_name,
  u7.direct_referral_count >= 2 AS level_7_unlocked,
  rc.level_8_upline,
  u8.username AS level_8_name,
  u8.direct_referral_count >= 2 AS level_8_unlocked
FROM referral_chain rc
JOIN users u ON rc.user_id = u.id
LEFT JOIN users u1 ON rc.level_1_upline = u1.id
LEFT JOIN users u2 ON rc.level_2_upline = u2.id
LEFT JOIN users u3 ON rc.level_3_upline = u3.id
LEFT JOIN users u4 ON rc.level_4_upline = u4.id
LEFT JOIN users u5 ON rc.level_5_upline = u5.id
LEFT JOIN users u6 ON rc.level_6_upline = u6.id
LEFT JOIN users u7 ON rc.level_7_upline = u7.id
LEFT JOIN users u8 ON rc.level_8_upline = u8.id;

-- ============================================
-- 8. 验证和测试查询
-- ============================================

-- 测试：查看某个用户的8代上级
-- SELECT * FROM get_upline_chain('USER_ID_HERE', 8);

-- 测试：查看某个用户的完整直推链
-- SELECT * FROM v_user_upline_chain WHERE user_id = 'USER_ID_HERE';

-- 统计：各层级人数分布
-- SELECT 
--   COUNT(*) FILTER (WHERE level_1_upline IS NOT NULL) AS level_1_count,
--   COUNT(*) FILTER (WHERE level_2_upline IS NOT NULL) AS level_2_count,
--   COUNT(*) FILTER (WHERE level_3_upline IS NOT NULL) AS level_3_count,
--   COUNT(*) FILTER (WHERE level_4_upline IS NOT NULL) AS level_4_count,
--   COUNT(*) FILTER (WHERE level_5_upline IS NOT NULL) AS level_5_count,
--   COUNT(*) FILTER (WHERE level_6_upline IS NOT NULL) AS level_6_count,
--   COUNT(*) FILTER (WHERE level_7_upline IS NOT NULL) AS level_7_count,
--   COUNT(*) FILTER (WHERE level_8_upline IS NOT NULL) AS level_8_count
-- FROM referral_chain;

-- ============================================
-- 9. 完成通知
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ 8代平级奖系统升级完成！';
  RAISE NOTICE '';
  RAISE NOTICE '📊 系统信息：';
  RAISE NOTICE '- referral_chain 表已扩展到8代';
  RAISE NOTICE '- 已创建辅助函数 get_upline_chain()';
  RAISE NOTICE '- 已创建自动维护触发器';
  RAISE NOTICE '- 已创建查询视图 v_user_upline_chain';
  RAISE NOTICE '';
  RAISE NOTICE '👥 数据统计：';
  RAISE NOTICE '- 总记录数：%', (SELECT COUNT(*) FROM referral_chain);
  RAISE NOTICE '- 有1代上级：%', (SELECT COUNT(*) FROM referral_chain WHERE level_1_upline IS NOT NULL);
  RAISE NOTICE '- 有8代上级：%', (SELECT COUNT(*) FROM referral_chain WHERE level_8_upline IS NOT NULL);
  RAISE NOTICE '';
  RAISE NOTICE '🎯 下一步：';
  RAISE NOTICE '1. 测试 BinaryService.triggerLevelBonus() 功能';
  RAISE NOTICE '2. 验证8代平级奖是否正常发放';
  RAISE NOTICE '3. 在前端查看平级奖记录';
END $$;

-- ============================================
-- ✅ 完成！
-- ============================================

