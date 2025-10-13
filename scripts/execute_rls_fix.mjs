#!/usr/bin/env node

/**
 * 通过Service Role直接执行SQL修复RLS
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vtezesyfhvbkgpdkuyeo.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZXplc3lmaHZia2dwZGt1eWVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5OTY0MSwiZXhwIjoyMDc1MDc1NjQxfQ.GXgjAJcc1A1WztAns4Tij5WbdtAdvY0Xer8kI8KTmYI'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔧 正在修复RLS策略...\n')

// 执行每条SQL语句
const statements = [
  `DROP POLICY IF EXISTS "Allow users to insert their own record" ON users`,
  `DROP POLICY IF EXISTS "Allow users to read their own record" ON users`,
  `DROP POLICY IF EXISTS "Allow users to update their own record" ON users`,
  `DROP POLICY IF EXISTS "users_select_for_invite_anon" ON users`,
  `DROP POLICY IF EXISTS "Allow anonymous to read invite codes" ON users`,
  `DROP POLICY IF EXISTS "Allow anonymous to count users" ON users`,
  
  `CREATE POLICY "Allow anonymous to read invite codes" ON users FOR SELECT TO anon USING (invite_code IS NOT NULL)`,
  
  `CREATE POLICY "Allow users to insert their own record" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)`,
  
  `CREATE POLICY "Allow users to read their own record" ON users FOR SELECT TO authenticated USING (auth.uid() = id)`,
  
  `CREATE POLICY "Allow users to update their own record" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`
]

for (let i = 0; i < statements.length; i++) {
  const sql = statements[i]
  console.log(`执行 SQL ${i + 1}/${statements.length}...`)
  
  try {
    // 使用 rpc 调用（如果存在）
    const { error } = await supabase.rpc('exec', { sql })
    
    if (error) {
      console.log(`   ⚠️  无法通过RPC执行: ${error.message}`)
    } else {
      console.log(`   ✅ 成功`)
    }
  } catch (e) {
    console.log(`   ⚠️  RPC方法不可用，需要手动执行`)
  }
}

console.log('\n📝 由于Supabase限制，某些DDL语句无法通过API执行')
console.log('请手动在Supabase SQL Editor中执行以下SQL:\n')
console.log('─'.repeat(60))
console.log(`
-- 删除旧策略
DROP POLICY IF EXISTS "Allow users to insert their own record" ON users;
DROP POLICY IF EXISTS "Allow users to read their own record" ON users;
DROP POLICY IF EXISTS "Allow users to update their own record" ON users;
DROP POLICY IF EXISTS "users_select_for_invite_anon" ON users;
DROP POLICY IF EXISTS "Allow anonymous to read invite codes" ON users;
DROP POLICY IF EXISTS "Allow anonymous to count users" ON users;

-- 创建新策略
CREATE POLICY "Allow anonymous to read invite codes"
ON users FOR SELECT TO anon
USING (invite_code IS NOT NULL);

CREATE POLICY "Allow users to insert their own record"
ON users FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to read their own record"
ON users FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own record"
ON users FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
`)
console.log('─'.repeat(60))
console.log('\n执行步骤:')
console.log('1. 打开: https://supabase.com/dashboard/project/vtezesyfhvbkgpdkuyeo/sql/new')
console.log('2. 复制上面的SQL')
console.log('3. 粘贴并点击 Run')
console.log('4. 执行完成后，重新运行: node scripts/fix_and_test_invite.mjs\n')













