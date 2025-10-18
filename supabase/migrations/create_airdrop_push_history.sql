-- 创建空投推送历史表
CREATE TABLE IF NOT EXISTS airdrop_push_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  airdrop_id UUID REFERENCES airdrops(id) ON DELETE SET NULL,
  group_ids UUID[] NOT NULL,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_airdrop_push_history_airdrop_id ON airdrop_push_history(airdrop_id);
CREATE INDEX IF NOT EXISTS idx_airdrop_push_history_created_at ON airdrop_push_history(created_at DESC);

-- 添加注释
COMMENT ON TABLE airdrop_push_history IS '空投推送历史记录';
COMMENT ON COLUMN airdrop_push_history.airdrop_id IS '空投ID';
COMMENT ON COLUMN airdrop_push_history.group_ids IS '推送的群组ID列表';
COMMENT ON COLUMN airdrop_push_history.success_count IS '成功推送数量';
COMMENT ON COLUMN airdrop_push_history.fail_count IS '失败推送数量';

