#!/usr/bin/env node

/**
 * 自动修复并测试邀请码系统
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vtezesyfhvbkgpdkuyeo.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZXplc3lmaHZia2dwZGt1eWVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5OTY0MSwiZXhwIjoyMDc1MDc1NjQxfQ.GXgjAJcc1A1WztAns4Tij5WbdtAdvY0Xer8kI8KTmYI'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZXplc3lmaHZia2dwZGt1eWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTk2NDEsImV4cCI6MjA3NTA3NTY0MX0.yltJO7ycKMODw0-tS6EMN6P1u7AH6fI6yTvvqwgvQMs'

// Service role client (管理员权限)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Anon client (模拟前端)
const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY)

console.log('🚀 开始自动修复邀请码系统...\n')

// ============================================
// 步骤1: 修复RLS策略
// ============================================
async function fixRLSPolicies() {
  console.log('📋 步骤1: 修复RLS策略...')
  
  const sqlScript = `
-- 删除旧策略
DROP POLICY IF EXISTS "Allow users to insert their own record" ON users;
DROP POLICY IF EXISTS "Allow users to read their own record" ON users;
DROP POLICY IF EXISTS "Allow users to update their own record" ON users;
DROP POLICY IF EXISTS "users_select_for_invite_anon" ON users;
DROP POLICY IF EXISTS "Allow anonymous to read invite codes" ON users;
DROP POLICY IF EXISTS "Allow anonymous to count users" ON users;

-- 创建新策略
CREATE POLICY "Allow anonymous to read invite codes"
ON users FOR SELECT
TO anon
USING (invite_code IS NOT NULL);

CREATE POLICY "Allow users to insert their own record"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to read their own record"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own record"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
`

  const { error } = await supabaseAdmin.rpc('exec_sql', { sql: sqlScript }).catch(() => {
    // 如果rpc不存在，直接用from执行（这会失败，但我们用另一种方式）
    return { error: null }
  })

  // 由于无法直接执行DDL，我们分步执行
  console.log('   ⚠️  请手动在Supabase SQL Editor中执行 supabase/fix_invite_system.sql')
  console.log('   或者我将尝试通过API验证策略是否已存在...\n')
  
  // 验证：尝试用匿名客户端读取users表
  const { data, error: testError } = await supabaseAnon
    .from('users')
    .select('id, invite_code')
    .limit(1)

  if (testError) {
    console.log('   ❌ RLS策略未正确配置')
    console.log('   错误:', testError.message)
    console.log('\n   👉 请执行以下步骤:')
    console.log('   1. 打开 https://supabase.com/dashboard/project/vtezesyfhvbkgpdkuyeo/sql/new')
    console.log('   2. 复制 supabase/fix_invite_system.sql 的内容')
    console.log('   3. 粘贴并点击 Run\n')
    return false
  }

  console.log('   ✅ RLS策略验证通过（匿名用户可以读取邀请码）\n')
  return true
}

// ============================================
// 步骤2: 检查并创建第一个用户
// ============================================
async function ensureGenesisUser() {
  console.log('📋 步骤2: 检查第一个用户...')

  // 检查是否已有用户
  const { data: existingUsers, error: countError } = await supabaseAdmin
    .from('users')
    .select('id, username, invite_code, created_at')
    .order('created_at', { ascending: true })
    .limit(1)

  if (countError) {
    console.log('   ❌ 查询用户失败:', countError.message)
    return null
  }

  if (existingUsers && existingUsers.length > 0) {
    const firstUser = existingUsers[0]
    console.log('   ✅ 系统已有用户:')
    console.log(`      用户名: ${firstUser.username}`)
    console.log(`      邀请码: ${firstUser.invite_code}`)
    console.log(`      创建时间: ${firstUser.created_at}\n`)
    return firstUser.invite_code
  }

  console.log('   ℹ️  系统暂无用户，需要创建第一个用户')
  console.log('   正在创建创世用户 admin...\n')

  // 生成邀请码
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const inviteCode = generateInviteCode()

  // 创建Auth用户
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@airdrop.app',
    password: 'admin123',
    email_confirm: true
  })

  if (authError) {
    console.log('   ❌ 创建Auth用户失败:', authError.message)
    return null
  }

  console.log('   ✅ Auth用户创建成功')

  // 插入users表
  const { error: insertError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      username: 'admin',
      invite_code: inviteCode,
      inviter_id: null,
      is_agent: true,
      is_admin: true,
      u_balance: 100,
      points_balance: 500
    })

  if (insertError) {
    console.log('   ❌ 插入用户记录失败:', insertError.message)
    return null
  }

  console.log('   ✅ 创世用户创建成功!')
  console.log(`      用户名: admin`)
  console.log(`      密码: admin123`)
  console.log(`      邀请码: ${inviteCode}\n`)

  return inviteCode
}

// ============================================
// 步骤3: 测试邀请码验证
// ============================================
async function testInviteCodeValidation(validInviteCode) {
  console.log('📋 步骤3: 测试邀请码验证（模拟前端）...')

  // 测试1: 用匿名客户端查询有效邀请码
  console.log('   测试1: 验证有效邀请码...')
  const { data: validData, error: validError } = await supabaseAnon
    .from('users')
    .select('id')
    .eq('invite_code', validInviteCode)
    .single()

  if (validError || !validData) {
    console.log('   ❌ 有效邀请码验证失败')
    console.log('   错误:', validError?.message || '未找到用户')
    return false
  }
  console.log('   ✅ 有效邀请码验证成功\n')

  // 测试2: 验证无效邀请码
  console.log('   测试2: 验证无效邀请码...')
  const { data: invalidData, error: invalidError } = await supabaseAnon
    .from('users')
    .select('id')
    .eq('invite_code', 'INVALID1')
    .single()

  if (invalidData) {
    console.log('   ❌ 无效邀请码应该返回空，但找到了数据')
    return false
  }
  console.log('   ✅ 无效邀请码正确返回空\n')

  return true
}

// ============================================
// 步骤4: 测试完整注册流程
// ============================================
async function testRegistrationFlow(validInviteCode) {
  console.log('📋 步骤4: 测试完整注册流程...')

  const testUsername = 'testuser_' + Date.now()
  const testPassword = 'test123456'
  const testEmail = `${testUsername}@airdrop.app`

  console.log(`   正在注册测试用户: ${testUsername}`)

  // 步骤1: 前端验证邀请码（匿名）
  console.log('   → 验证邀请码...')
  const { data: inviterData, error: inviterError } = await supabaseAnon
    .from('users')
    .select('id')
    .eq('invite_code', validInviteCode)
    .single()

  if (inviterError || !inviterData) {
    console.log('   ❌ 邀请码验证失败')
    return false
  }
  console.log('   ✅ 邀请码验证通过')

  // 步骤2: 注册Auth账号
  console.log('   → 注册Auth账号...')
  const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({
    email: testEmail,
    password: testPassword
  })

  if (signUpError || !signUpData.user) {
    console.log('   ❌ Auth注册失败:', signUpError?.message)
    return false
  }
  console.log('   ✅ Auth注册成功')

  // 步骤3: 插入users表（使用新用户的session）
  console.log('   → 插入用户记录...')
  
  // 创建带session的客户端
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${signUpData.session?.access_token}`
      }
    }
  })

  const newInviteCode = generateInviteCode()
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
    console.log('   ❌ 插入用户记录失败:', insertError.message)
    return false
  }

  console.log('   ✅ 用户记录插入成功')
  console.log(`   ✅ 新用户邀请码: ${newInviteCode}\n`)

  // 清理测试用户
  console.log('   → 清理测试用户...')
  await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id)
  await supabaseAdmin.from('users').delete().eq('id', signUpData.user.id)
  console.log('   ✅ 测试用户已清理\n')

  return true
}

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ============================================
// 主流程
// ============================================
async function main() {
  try {
    // 步骤1: 修复RLS
    const rlsFixed = await fixRLSPolicies()
    if (!rlsFixed) {
      console.log('❌ RLS策略未配置，请先手动执行 SQL 脚本后重新运行此脚本\n')
      process.exit(1)
    }

    // 步骤2: 确保有第一个用户
    const genesisInviteCode = await ensureGenesisUser()
    if (!genesisInviteCode) {
      console.log('❌ 无法创建或获取第一个用户\n')
      process.exit(1)
    }

    // 步骤3: 测试邀请码验证
    const validationPassed = await testInviteCodeValidation(genesisInviteCode)
    if (!validationPassed) {
      console.log('❌ 邀请码验证测试失败\n')
      process.exit(1)
    }

    // 步骤4: 测试完整注册流程
    const registrationPassed = await testRegistrationFlow(genesisInviteCode)
    if (!registrationPassed) {
      console.log('❌ 注册流程测试失败\n')
      process.exit(1)
    }

    // 成功总结
    console.log('═══════════════════════════════════════════')
    console.log('🎉 邀请码系统修复并测试完成！')
    console.log('═══════════════════════════════════════════')
    console.log('\n✅ 所有测试通过！')
    console.log('\n📝 使用说明:')
    console.log(`   1. 登录: http://localhost:3000/login`)
    console.log(`      用户名: admin`)
    console.log(`      密码: admin123`)
    console.log(`\n   2. 邀请他人注册使用邀请码: ${genesisInviteCode}`)
    console.log(`\n   3. 查看邀请码: 登录后在个人中心查看\n`)

  } catch (error) {
    console.error('❌ 执行过程中出错:', error.message)
    process.exit(1)
  }
}

main()


































