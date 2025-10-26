#!/usr/bin/env node

/**
 * 快速测试并修复邀请码系统
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vtezesyfhvbkgpdkuyeo.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZXplc3lmaHZia2dwZGt1eWVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5OTY0MSwiZXhwIjoyMDc1MDc1NjQxfQ.GXgjAJcc1A1WztAns4Tij5WbdtAdvY0Xer8kI8KTmYI'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZXplc3lmaHZia2dwZGt1eWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTk2NDEsImV4cCI6MjA3NTA3NTY0MX0.yltJO7ycKMODw0-tS6EMN6P1u7AH6fI6yTvvqwgvQMs'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const anon = createClient(SUPABASE_URL, ANON_KEY)

console.log('🚀 快速测试邀请码系统\n')
console.log('═'.repeat(60))

// 测试1: 检查匿名用户能否读取邀请码
console.log('\n📋 测试1: 匿名用户读取邀请码权限')
console.log('─'.repeat(60))

const { data: anonData, error: anonError } = await anon
  .from('users')
  .select('id, invite_code')
  .limit(1)

if (anonError) {
  console.log('❌ 失败:', anonError.message)
  console.log('\n🔧 需要修复RLS策略！')
  console.log('\n请执行以下步骤:')
  console.log('1. 打开 Supabase SQL Editor:')
  console.log('   https://supabase.com/dashboard/project/vtezesyfhvbkgpdkuyeo/sql/new')
  console.log('\n2. 复制并执行以下SQL:\n')
  console.log('─'.repeat(60))
  console.log(`
-- 删除旧策略
DROP POLICY IF EXISTS "Allow users to insert their own record" ON users;
DROP POLICY IF EXISTS "Allow users to read their own record" ON users;
DROP POLICY IF EXISTS "Allow users to update their own record" ON users;
DROP POLICY IF EXISTS "users_select_for_invite_anon" ON users;
DROP POLICY IF EXISTS "Allow anonymous to read invite codes" ON users;
DROP POLICY IF EXISTS "Allow anonymous to count users" ON users;

-- 创建新策略（关键：允许匿名用户读取邀请码）
CREATE POLICY "Allow anonymous to read invite codes"
ON users FOR SELECT TO anon
USING (invite_code IS NOT NULL);

-- 允许已认证用户操作自己的记录
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
  console.log('\n3. 执行完成后，重新运行此脚本验证\n')
  process.exit(1)
}

console.log('✅ 通过！匿名用户可以读取邀请码')

// 测试2: 检查是否有第一个用户
console.log('\n📋 测试2: 检查第一个用户')
console.log('─'.repeat(60))

const { data: users, error: usersError } = await admin
  .from('users')
  .select('id, username, invite_code, created_at')
  .order('created_at', { ascending: true })
  .limit(1)

if (usersError) {
  console.log('❌ 查询失败:', usersError.message)
  process.exit(1)
}

let genesisInviteCode = null

if (!users || users.length === 0) {
  console.log('ℹ️  系统暂无用户，正在创建第一个用户...\n')
  
  // 生成邀请码
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  genesisInviteCode = Array.from({ length: 8 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
  
  // 创建Auth用户
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: 'admin@airdrop.app',
    password: 'admin123',
    email_confirm: true
  })
  
  if (authError) {
    console.log('❌ 创建Auth用户失败:', authError.message)
    process.exit(1)
  }
  
  // 插入users表
  const { error: insertError } = await admin
    .from('users')
    .insert({
      id: authData.user.id,
      username: 'admin',
      invite_code: genesisInviteCode,
      inviter_id: null,
      is_agent: true,
      is_admin: true,
      u_balance: 100,
      points_balance: 500
    })
  
  if (insertError) {
    console.log('❌ 插入用户记录失败:', insertError.message)
    process.exit(1)
  }
  
  console.log('✅ 第一个用户创建成功!')
  console.log(`   用户名: admin`)
  console.log(`   密码: admin123`)
  console.log(`   邀请码: ${genesisInviteCode}`)
} else {
  const firstUser = users[0]
  genesisInviteCode = firstUser.invite_code
  console.log('✅ 系统已有用户')
  console.log(`   用户名: ${firstUser.username}`)
  console.log(`   邀请码: ${firstUser.invite_code}`)
  console.log(`   创建时间: ${firstUser.created_at}`)
}

// 测试3: 验证邀请码查询（模拟前端注册流程）
console.log('\n📋 测试3: 模拟前端验证邀请码')
console.log('─'.repeat(60))

const { data: inviterData, error: inviterError } = await anon
  .from('users')
  .select('id')
  .eq('invite_code', genesisInviteCode)
  .single()

if (inviterError || !inviterData) {
  console.log('❌ 邀请码验证失败')
  console.log('   错误:', inviterError?.message || '未找到用户')
  process.exit(1)
}

console.log('✅ 邀请码验证成功！前端可以正常验证邀请码')

// 测试4: 模拟完整注册流程
console.log('\n📋 测试4: 模拟完整注册流程')
console.log('─'.repeat(60))

const testUsername = 'test_' + Date.now()
const testEmail = `${testUsername}@airdrop.app`
const testPassword = 'test123456'

console.log(`正在注册测试用户: ${testUsername}`)

// 注册Auth
const { data: signUpData, error: signUpError } = await anon.auth.signUp({
  email: testEmail,
  password: testPassword
})

if (signUpError || !signUpData.user) {
  console.log('❌ Auth注册失败:', signUpError?.message)
  process.exit(1)
}

console.log('   ✅ Auth注册成功')

// 创建带token的客户端
const userClient = createClient(SUPABASE_URL, ANON_KEY, {
  global: {
    headers: {
      Authorization: `Bearer ${signUpData.session?.access_token}`
    }
  }
})

// 生成新邀请码
const newInviteCode = Array.from({ length: 8 }, () => 
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
).join('')

// 插入users表
const { error: insertError } = await userClient
  .from('users')
  .insert({
    id: signUpData.user.id,
    username: testUsername,
    invite_code: newInviteCode,
    inviter_id: inviterData.id,
    is_agent: false,
    is_admin: false,
    u_balance: 0,
    points_balance: 0
  })

if (insertError) {
  console.log('❌ 插入用户记录失败:', insertError.message)
  
  // 清理Auth用户
  await admin.auth.admin.deleteUser(signUpData.user.id)
  process.exit(1)
}

console.log('   ✅ 用户记录插入成功')
console.log(`   ✅ 新用户邀请码: ${newInviteCode}`)

// 清理测试用户
await admin.auth.admin.deleteUser(signUpData.user.id)
await admin.from('users').delete().eq('id', signUpData.user.id)
console.log('   ✅ 测试用户已清理')

// 最终总结
console.log('\n' + '═'.repeat(60))
console.log('🎉 所有测试通过！邀请码系统工作正常！')
console.log('═'.repeat(60))
console.log('\n📝 使用说明:')
console.log(`\n1. 启动开发服务器:`)
console.log(`   npm run dev`)
console.log(`\n2. 打开浏览器访问:`)
console.log(`   http://localhost:3000/login`)
console.log(`\n3. 登录第一个用户:`)
console.log(`   用户名: admin`)
console.log(`   密码: admin123`)
console.log(`\n4. 邀请他人注册:`)
console.log(`   邀请码: ${genesisInviteCode}`)
console.log(`\n5. 查看邀请码:`)
console.log(`   登录后在个人中心查看您的邀请码\n`)

process.exit(0)








































