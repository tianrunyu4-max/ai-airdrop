-- ==========================================
-- 修复 messages 表的 RLS 策略
-- ==========================================

-- 1. 禁用 RLS（如果需要快速修复）
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 或者

-- 2. 添加允许所有用户插入和查询的策略
DROP POLICY IF EXISTS "允许所有人查看消息" ON messages;
DROP POLICY IF EXISTS "允许所有人发送消息" ON messages;

CREATE POLICY "允许所有人查看消息" 
ON messages FOR SELECT 
USING (true);

CREATE POLICY "允许所有人发送消息" 
ON messages FOR INSERT 
WITH CHECK (true);

-- 3. 查看当前策略
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'messages';

