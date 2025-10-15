-- ============================================
-- 用户名片系统
-- ============================================

-- 1. 创建用户名片表
CREATE TABLE IF NOT EXISTS user_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  avatar_url TEXT,                    -- 正方形头像URL
  ad_image_1 TEXT,                    -- 广告图片1
  ad_image_2 TEXT,                    -- 广告图片2
  business_name VARCHAR(100),         -- 商家名称
  business_desc TEXT,                 -- 商家描述
  contact_info VARCHAR(200),          -- 联系方式
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_user_cards_user ON user_cards(user_id);

-- 3. 启用RLS
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;

-- 4. 创建RLS策略

-- 所有人可以查看名片
CREATE POLICY user_cards_select_all ON user_cards
  FOR SELECT USING (true);

-- 用户只能插入自己的名片
CREATE POLICY user_cards_insert_own ON user_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的名片
CREATE POLICY user_cards_update_own ON user_cards
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的名片
CREATE POLICY user_cards_delete_own ON user_cards
  FOR DELETE USING (auth.uid() = user_id);

-- 5. 创建自动更新时间戳函数
CREATE OR REPLACE FUNCTION update_user_card_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建触发器
CREATE TRIGGER update_user_card_timestamp_trigger
  BEFORE UPDATE ON user_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_user_card_timestamp();

-- 7. 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-cards', 'user-cards', true)
ON CONFLICT (id) DO NOTHING;

-- 8. 设置存储桶策略

-- 允许所有人查看
CREATE POLICY "User cards images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-cards');

-- 允许认证用户上传到自己的文件夹
CREATE POLICY "Users can upload their own card images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-cards' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户更新自己的图片
CREATE POLICY "Users can update their own card images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 允许用户删除自己的图片
CREATE POLICY "Users can delete their own card images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 9. 创建默认头像生成函数
CREATE OR REPLACE FUNCTION generate_default_avatar(user_id UUID, username TEXT)
RETURNS TEXT AS $$
DECLARE
  colors TEXT[] := ARRAY['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
  color TEXT;
  first_char TEXT;
BEGIN
  -- 随机选择一个颜色
  color := colors[1 + floor(random() * array_length(colors, 1))];
  
  -- 获取用户名首字母
  first_char := UPPER(SUBSTRING(username FROM 1 FOR 1));
  
  -- 返回SVG格式的头像URL（可以用base64编码）
  RETURN 'data:image/svg+xml;base64,' || encode(
    ('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">' ||
     '<rect width="200" height="200" fill="' || color || '"/>' ||
     '<text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="100" font-family="Arial, sans-serif">' ||
     first_char || '</text></svg>')::bytea, 
    'base64'
  );
END;
$$ LANGUAGE plpgsql;

-- 10. 创建自动创建用户名片的触发器函数
CREATE OR REPLACE FUNCTION auto_create_user_card()
RETURNS TRIGGER AS $$
BEGIN
  -- 当新用户加入群组时，自动创建名片（如果不存在）
  INSERT INTO user_cards (user_id, avatar_url)
  VALUES (
    NEW.user_id,
    generate_default_avatar(NEW.user_id, (SELECT username FROM users WHERE id = NEW.user_id))
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. 创建触发器（用户加入群组时自动创建名片）
CREATE TRIGGER auto_create_user_card_on_join
  AFTER INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_card();

-- 完成
SELECT 'User cards system created successfully!' AS status;

