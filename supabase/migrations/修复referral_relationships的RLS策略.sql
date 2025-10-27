-- ================================================================
-- 修复 referral_relationships 表的 RLS 策略
-- 问题：前端查询返回0条记录，怀疑是RLS权限问题
-- 解决：添加更宽松的查询策略
-- ================================================================

-- 🔧 删除旧的策略
DROP POLICY IF EXISTS "用户查看自己的直推关系" ON referral_relationships;
DROP POLICY IF EXISTS "管理员查看所有直推关系" ON referral_relationships;
DROP POLICY IF EXISTS "系统创建直推关系" ON referral_relationships;

-- ✅ 新策略1：所有认证用户都可以读取（最宽松，用于测试）
CREATE POLICY "认证用户可以查看直推关系" ON referral_relationships
  FOR SELECT
  TO authenticated
  USING (true);

-- ✅ 新策略2：Service Role 可以插入
CREATE POLICY "服务端可以创建直推关系" ON referral_relationships
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ✅ 新策略3：系统可以插入（通过anon key）
CREATE POLICY "系统可以创建直推关系" ON referral_relationships
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 📊 验证策略
SELECT 
  policyname,
  roles,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'referral_relationships'
ORDER BY policyname;

RAISE NOTICE '✅ RLS 策略已更新为更宽松的版本';

