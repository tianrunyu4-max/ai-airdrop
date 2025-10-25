-- ==========================================
-- 升级 airdrops 表结构
-- 添加 AI 评分、Twitter、风险等级等字段
-- ==========================================

-- 1. 添加新字段
ALTER TABLE public.airdrops
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS ai_score DECIMAL(3, 1) DEFAULT 7.0,
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS time_required VARCHAR(50),
ADD COLUMN IF NOT EXISTS participation_cost TEXT,
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS source_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS push_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_pushed_at TIMESTAMPTZ;

-- 2. 创建索引（提高查询性能）
CREATE INDEX IF NOT EXISTS idx_airdrops_type_status 
ON public.airdrops(type, status);

CREATE INDEX IF NOT EXISTS idx_airdrops_ai_score 
ON public.airdrops(ai_score DESC);

CREATE INDEX IF NOT EXISTS idx_airdrops_verified 
ON public.airdrops(verified);

CREATE INDEX IF NOT EXISTS idx_airdrops_source_type 
ON public.airdrops(source_type);

CREATE INDEX IF NOT EXISTS idx_airdrops_last_pushed 
ON public.airdrops(last_pushed_at DESC NULLS LAST);

-- 3. 添加约束
ALTER TABLE public.airdrops
ADD CONSTRAINT check_ai_score_range 
CHECK (ai_score >= 0 AND ai_score <= 10);

ALTER TABLE public.airdrops
ADD CONSTRAINT check_risk_level 
CHECK (risk_level IN ('none', 'low', 'medium', 'high'));

ALTER TABLE public.airdrops
ADD CONSTRAINT check_difficulty 
CHECK (difficulty IN ('very_easy', 'easy', 'medium', 'hard', 'very_hard'));

-- 4. 创建用于推送的视图（AI筛选）
CREATE OR REPLACE VIEW v_推送空投列表 AS
SELECT 
  id,
  title,
  description,
  reward_amount,
  type,
  ai_score,
  risk_level,
  estimated_value,
  difficulty,
  verified,
  push_count,
  last_pushed_at,
  created_at
FROM public.airdrops
WHERE status = 'active'
  AND ai_score >= 7.0
  AND verified = true
ORDER BY 
  CASE type 
    WHEN 'web3' THEN 1 
    WHEN 'cex' THEN 2 
  END,
  ai_score DESC,
  COALESCE(last_pushed_at, '1970-01-01'::timestamptz) ASC;

-- 5. 创建统计视图
CREATE OR REPLACE VIEW v_空投统计 AS
SELECT 
  type,
  COUNT(*) as 空投数量,
  ROUND(AVG(ai_score), 2) as 平均评分,
  SUM(estimated_value) as 预计总价值,
  COUNT(CASE WHEN verified = true THEN 1 END) as 已验证数量,
  COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as 低风险数量,
  COUNT(CASE WHEN difficulty = 'easy' OR difficulty = 'very_easy' THEN 1 END) as 简单任务数量
FROM public.airdrops
WHERE status = 'active'
GROUP BY type;

-- 6. 验证表结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'airdrops'
  AND column_name IN (
    'twitter_url', 'ai_score', 'risk_level', 'estimated_value',
    'difficulty', 'time_required', 'participation_cost', 'tags',
    'source', 'source_type', 'verified', 'push_count', 'last_pushed_at'
  )
ORDER BY ordinal_position;

-- 7. 查看统计视图
SELECT * FROM v_空投统计;

-- ==========================================
-- 执行完成后，表结构已升级
-- 可以插入完整的空投数据了
-- ==========================================

