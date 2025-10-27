-- ==========================================
-- 📊 学习卡重启系统 - 数据库表
-- ==========================================

-- 1. 创建重启日志表
CREATE TABLE IF NOT EXISTS restart_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),           -- 管理员ID（自动重启为NULL）
  restart_type VARCHAR(20) NOT NULL,            -- 'manual' | 'auto'
  total_scanned INTEGER DEFAULT 0,              -- 扫描总数
  total_destroyed INTEGER DEFAULT 0,            -- 销毁数量
  total_kept INTEGER DEFAULT 0,                 -- 保留数量
  affected_users JSONB,                         -- 受影响用户ID列表
  restart_time TIMESTAMPTZ DEFAULT NOW(),       -- 重启时间
  details JSONB,                                -- 详细信息
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_restart_logs_time ON restart_logs(restart_time DESC);
CREATE INDEX IF NOT EXISTS idx_restart_logs_type ON restart_logs(restart_type);

-- 注释
COMMENT ON TABLE restart_logs IS '学习卡重启日志';
COMMENT ON COLUMN restart_logs.restart_type IS '重启类型：manual=手动，auto=自动';
COMMENT ON COLUMN restart_logs.total_destroyed IS '销毁的学习卡数量';
COMMENT ON COLUMN restart_logs.affected_users IS '受影响的用户ID列表';

-- 2. 创建用户重启统计表
CREATE TABLE IF NOT EXISTS user_restart_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_restarts INTEGER DEFAULT 0,             -- 累计重启次数
  this_week INTEGER DEFAULT 0,                  -- 本周重启次数
  this_month INTEGER DEFAULT 0,                 -- 本月重启次数
  last_restart TIMESTAMPTZ,                     -- 最近重启时间
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_restart_stats_user ON user_restart_stats(user_id);

-- 注释
COMMENT ON TABLE user_restart_stats IS '用户重启统计';
COMMENT ON COLUMN user_restart_stats.this_week IS '本周被重启次数';
COMMENT ON COLUMN user_restart_stats.last_restart IS '最近一次被重启时间';

-- 3. 创建RLS策略
ALTER TABLE restart_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_restart_stats ENABLE ROW LEVEL SECURITY;

-- restart_logs: 管理员可以查看所有记录
DROP POLICY IF EXISTS "管理员查看重启日志" ON restart_logs;
CREATE POLICY "管理员查看重启日志" ON restart_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- restart_logs: 管理员可以插入记录
DROP POLICY IF EXISTS "管理员创建重启日志" ON restart_logs;
CREATE POLICY "管理员创建重启日志" ON restart_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- user_restart_stats: 用户可以查看自己的统计
DROP POLICY IF EXISTS "用户查看自己的重启统计" ON user_restart_stats;
CREATE POLICY "用户查看自己的重启统计" ON user_restart_stats
  FOR SELECT
  USING (user_id::text = (SELECT auth.uid()::text));

-- user_restart_stats: 系统可以更新统计
DROP POLICY IF EXISTS "系统更新重启统计" ON user_restart_stats;
CREATE POLICY "系统更新重启统计" ON user_restart_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. 创建辅助函数

-- 更新用户重启统计
CREATE OR REPLACE FUNCTION update_user_restart_stats(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO user_restart_stats (user_id, total_restarts, this_week, this_month, last_restart, updated_at)
  VALUES (p_user_id, 1, 1, 1, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET total_restarts = user_restart_stats.total_restarts + 1,
      this_week = user_restart_stats.this_week + 1,
      this_month = user_restart_stats.this_month + 1,
      last_restart = NOW(),
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重置每周统计（每周一凌晨执行）
CREATE OR REPLACE FUNCTION reset_weekly_restart_stats()
RETURNS void AS $$
BEGIN
  UPDATE user_restart_stats SET this_week = 0;
  RAISE NOTICE '✅ 已重置所有用户的本周重启统计';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重置每月统计（每月1号凌晨执行）
CREATE OR REPLACE FUNCTION reset_monthly_restart_stats()
RETURNS void AS $$
BEGIN
  UPDATE user_restart_stats SET this_month = 0;
  RAISE NOTICE '✅ 已重置所有用户的本月重启统计';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 创建定时任务（使用pg_cron扩展，如果可用）
-- 注意：需要在Supabase Dashboard中手动启用pg_cron扩展

-- 每周一凌晨2点重置本周统计
-- SELECT cron.schedule(
--   'reset-weekly-restart-stats',
--   '0 2 * * 1',
--   $$SELECT reset_weekly_restart_stats()$$
-- );

-- 每月1号凌晨2点重置本月统计
-- SELECT cron.schedule(
--   'reset-monthly-restart-stats',
--   '0 2 1 * *',
--   $$SELECT reset_monthly_restart_stats()$$
-- );

-- 完成提示
SELECT '✅ 学习卡重启系统表创建完成' AS status;

