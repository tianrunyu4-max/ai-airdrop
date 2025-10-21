-- ==========================================
-- 🚀 空投爬虫系统 - 数据库设计
-- ==========================================

-- 1️⃣ 空投信息表
CREATE TABLE IF NOT EXISTS airdrops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 基本信息
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL, -- 'Layer3', 'Galxe', 'Twitter', 'DeFiLlama' 等
  project_name TEXT NOT NULL, -- 项目名称（如 'zkSync Era'）
  
  -- 分类
  type TEXT NOT NULL DEFAULT 'web3', -- 'web3' 或 'cex'
  category TEXT, -- 'DeFi', 'NFT', 'GameFi', 'Layer2' 等
  
  -- 奖励信息
  reward_min INTEGER, -- 最低奖励（USDT）
  reward_max INTEGER, -- 最高奖励（USDT）
  reward_description TEXT, -- 奖励描述
  
  -- 难度和评分
  difficulty TEXT, -- 'easy', 'medium', 'hard'
  ai_score DECIMAL(3,1) DEFAULT 5.0, -- AI评分 0.0-10.0
  
  -- 参与信息
  steps TEXT[], -- 参与步骤（数组）
  requirements TEXT, -- 参与要求
  deadline TIMESTAMP, -- 截止时间
  
  -- 链接
  url TEXT, -- 任务链接
  twitter_url TEXT,
  discord_url TEXT,
  
  -- 状态
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'completed', 'verified'
  is_verified BOOLEAN DEFAULT false, -- 是否已人工审核
  priority INTEGER DEFAULT 50, -- 优先级（1-100）
  
  -- 推送状态
  push_count INTEGER DEFAULT 0, -- 已推送次数
  last_pushed_at TIMESTAMP, -- 最后推送时间
  
  -- 数据来源
  source_url TEXT, -- 原始数据URL
  raw_data JSONB, -- 原始数据（备份）
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 索引
  CONSTRAINT airdrops_title_platform_unique UNIQUE(title, platform)
);

-- 创建索引
CREATE INDEX idx_airdrops_status ON airdrops(status);
CREATE INDEX idx_airdrops_ai_score ON airdrops(ai_score DESC);
CREATE INDEX idx_airdrops_deadline ON airdrops(deadline);
CREATE INDEX idx_airdrops_type ON airdrops(type);
CREATE INDEX idx_airdrops_platform ON airdrops(platform);

-- 2️⃣ 推送历史表
CREATE TABLE IF NOT EXISTS airdrop_pushes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  airdrop_id UUID REFERENCES airdrops(id) ON DELETE CASCADE,
  chat_group_id UUID REFERENCES chat_groups(id),
  message_id UUID, -- 对应的消息ID
  push_time TIMESTAMP DEFAULT NOW(),
  batch_number INTEGER, -- 批次号（每天2批：1=早上, 2=晚上）
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_airdrop_pushes_time ON airdrop_pushes(push_time DESC);
CREATE INDEX idx_airdrop_pushes_batch ON airdrop_pushes(batch_number);

-- 3️⃣ 数据源配置表
CREATE TABLE IF NOT EXISTS airdrop_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- 'Layer3', 'Galxe', 'Twitter' 等
  type TEXT NOT NULL, -- 'api', 'crawler', 'rss', 'manual'
  url TEXT,
  api_key TEXT,
  config JSONB, -- 配置参数
  is_enabled BOOLEAN DEFAULT true,
  last_crawled_at TIMESTAMP,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 插入默认数据源
INSERT INTO airdrop_sources (name, type, url, is_enabled) VALUES
('Layer3', 'api', 'https://layer3.xyz/api/quests', true),
('Galxe', 'api', 'https://graphigo.prd.galaxy.eco/query', true),
('TaskOn', 'crawler', 'https://taskon.xyz', true),
('DeFiLlama', 'api', 'https://api.llama.fi/protocols', true),
('Twitter', 'api', 'https://api.twitter.com/2/tweets/search/recent', false),
('Foresight', 'crawler', 'https://foresightnews.pro', false),
('PANews', 'crawler', 'https://www.panewslab.com', false)
ON CONFLICT (name) DO NOTHING;

-- 4️⃣ 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_airdrops_updated_at BEFORE UPDATE ON airdrops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_airdrop_sources_updated_at BEFORE UPDATE ON airdrop_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5️⃣ AI评分函数
CREATE OR REPLACE FUNCTION calculate_ai_score(
  reward_min_param INTEGER,
  reward_max_param INTEGER,
  difficulty_param TEXT,
  platform_param TEXT,
  is_verified_param BOOLEAN
)
RETURNS DECIMAL(3,1) AS $$
DECLARE
  score DECIMAL(3,1) := 5.0;
BEGIN
  -- 奖励金额（最高+3分）
  IF reward_max_param > 5000 THEN
    score := score + 3.0;
  ELSIF reward_max_param > 1000 THEN
    score := score + 2.0;
  ELSIF reward_max_param > 500 THEN
    score := score + 1.0;
  END IF;
  
  -- 难度（越简单分数越高，最高+2分）
  IF difficulty_param = 'easy' THEN
    score := score + 2.0;
  ELSIF difficulty_param = 'medium' THEN
    score := score + 1.0;
  END IF;
  
  -- 平台可信度（最高+1.5分）
  IF platform_param IN ('Layer3', 'Galxe', 'DeFiLlama') THEN
    score := score + 1.5;
  ELSIF platform_param IN ('TaskOn', 'Foresight') THEN
    score := score + 1.0;
  END IF;
  
  -- 人工审核通过（+0.5分）
  IF is_verified_param THEN
    score := score + 0.5;
  END IF;
  
  -- 限制在0-10之间
  RETURN LEAST(GREATEST(score, 0.0), 10.0);
END;
$$ LANGUAGE plpgsql;

-- 6️⃣ 获取待推送空投函数
CREATE OR REPLACE FUNCTION get_airdrops_for_push(
  limit_count INTEGER DEFAULT 10,
  exclude_recently_pushed BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  project_name TEXT,
  description TEXT,
  ai_score DECIMAL(3,1),
  reward_min INTEGER,
  reward_max INTEGER,
  difficulty TEXT,
  url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.project_name,
    a.description,
    a.ai_score,
    a.reward_min,
    a.reward_max,
    a.difficulty,
    a.url
  FROM airdrops a
  WHERE 
    a.status = 'active'
    AND (a.deadline IS NULL OR a.deadline > NOW())
    AND (
      NOT exclude_recently_pushed 
      OR a.last_pushed_at IS NULL 
      OR a.last_pushed_at < NOW() - INTERVAL '12 hours'
    )
  ORDER BY 
    a.ai_score DESC,
    a.priority DESC,
    a.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 7️⃣ 标记空投已推送
CREATE OR REPLACE FUNCTION mark_airdrop_pushed(airdrop_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE airdrops 
  SET 
    push_count = push_count + 1,
    last_pushed_at = NOW()
  WHERE id = airdrop_id_param;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- ✅ 数据库结构创建完成！
-- ==========================================

-- 查看创建的表
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('airdrops', 'airdrop_pushes', 'airdrop_sources')
ORDER BY table_name;

