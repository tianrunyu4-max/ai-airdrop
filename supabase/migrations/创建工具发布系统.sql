-- ==========================================
-- 🛠️ 工具发布系统 - 代理专属功能
-- ==========================================

-- 创建发布表
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  content TEXT NOT NULL CHECK (length(content) <= 50),
  image_url_1 TEXT,
  image_url_2 TEXT,
  is_pinned BOOLEAN DEFAULT false,
  pin_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(is_pinned, pin_order DESC);

-- 创建发布记录表（记录每周发布次数）
CREATE TABLE IF NOT EXISTS post_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- 每周一的日期
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_post_records_user_week ON post_records(user_id, week_start);

-- 启用RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_records ENABLE ROW LEVEL SECURITY;

-- RLS策略：所有人可查看
CREATE POLICY "所有人可查看发布" ON posts
  FOR SELECT
  USING (true);

-- RLS策略：付费代理可创建
CREATE POLICY "付费代理可创建发布" ON posts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_agent = true
    )
  );

-- RLS策略：创建者可更新
CREATE POLICY "创建者可更新发布" ON posts
  FOR UPDATE
  USING (user_id = auth.uid());

-- RLS策略：创建者可删除
CREATE POLICY "创建者可删除发布" ON posts
  FOR DELETE
  USING (user_id = auth.uid());

-- RLS策略：发布记录
CREATE POLICY "用户可查看自己的发布记录" ON post_records
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "用户可创建发布记录" ON post_records
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "用户可更新发布记录" ON post_records
  FOR UPDATE
  USING (user_id = auth.uid());

-- ==========================================
-- 🔧 辅助函数
-- ==========================================

-- 获取本周开始日期（周一）
CREATE OR REPLACE FUNCTION get_week_start(check_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
  RETURN check_date - EXTRACT(DOW FROM check_date)::INTEGER + 1;
END;
$$ LANGUAGE plpgsql;

-- 检查用户本周是否可以发布
CREATE OR REPLACE FUNCTION can_post_this_week(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  week_start DATE;
  post_count INTEGER;
BEGIN
  week_start := get_week_start();
  
  SELECT COALESCE(pr.post_count, 0) INTO post_count
  FROM post_records pr
  WHERE pr.user_id = p_user_id 
    AND pr.week_start = week_start;
  
  RETURN COALESCE(post_count, 0) < 1;
END;
$$ LANGUAGE plpgsql;

-- 更新发布计数
CREATE OR REPLACE FUNCTION increment_post_count(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  week_start DATE;
BEGIN
  week_start := get_week_start();
  
  INSERT INTO post_records (user_id, week_start, post_count)
  VALUES (p_user_id, week_start, 1)
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET post_count = post_records.post_count + 1;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- ✅ 初始化完成
-- ==========================================

