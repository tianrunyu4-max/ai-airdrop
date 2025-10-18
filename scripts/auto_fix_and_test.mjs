#!/usr/bin/env node

/**
 * 自动修复并测试邀请码系统 - 完整流程
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vtezesyfhvbkgpdkuyeo.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZXplc3lmaHZia2dwZGt1eWVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5OTY0MSwiZXhwIjoyMDc1MDc1NjQxfQ.GXgjAJcc1A1WztAns4Tij5WbdtAdvY0Xer8kI8KTmYI'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZXplc3lmaHZia2dwZGt1eWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTk2NDEsImV4cCI6MjA3NTA3NTY0MX0.yltJO7ycKMODw0-tS6EMN6P1u7AH6fI6yTvvqwgvQMs'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const anon = createClient(SUPABASE_URL, ANON_KEY)

console.log('🚀 自动修复并测试邀请码系统')
console.log('═'.repeat(70))
console.log('')

// ============================================
// 步骤1: 检查现有用户
// ============================================
async function checkExistingUsers() {
  console.log('📋 步骤1: 检查现有用户')
  console.log('─'.repeat(70))
  
  const { data: users, error } = await admin
    .from('users')
    .select('id, username, invite_code, is_admin, created_at')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.log('❌ 查询失败:', error.message)
    return null
  }
  
  if (!users || users.length === 0) {
    console.log('ℹ️  数据库中暂无用户')
    return null
  }
  
  console.log(`✅ 找到 ${users.length} 个用户:\n`)
  users.forEach((u, i) => {
    console.log(`   ${i + 1}. 用户名: ${u.username}`)
    console.log(`      邀请码: ${u.invite_code}`)
    console.log(`      管理员: ${u.is_admin ? '是' : '否'}`)
    console.log(`      创建时间: ${u.created_at}`)
    console.log('')
  })
  
  return users[0]
}

// ============================================
// 步骤2: 检查Auth用户
// ============================================
async function checkAuthUsers() {
  console.log('📋 步骤2: 检查Auth用户')
  console.log('─'.repeat(70))
  
  const { data: authData, error } = await admin.auth.admin.listUsers()
  
  if (error) {
    console.log('❌ 查询失败:', error.message)
    return []
  }
  
  console.log(`✅ 找到 ${authData.users.length} 个Auth用户:\n`)
  authData.users.forEach((u, i) => {
    console.log(`   ${i + 1}. Email: ${u.email}`)
    console.log(`      UUID: ${u.id}`)
    console.log(`      确认状态: ${u.email_confirmed_at ? '已确认' : '未确认'}`)
    console.log('')
  })
  
  return authData.users
}

// ============================================
// 步骤3: 测试RLS策略
// ============================================
async function testRLSPolicy() {
  console.log('📋 步骤3: 测试RLS策略（匿名用户读取邀请码）')
  console.log('─'.repeat(70))
  
  const { data, error } = await anon
    .from('users')
    .select('id, invite_code')
    .limit(1)
  
  if (error) {
    console.log('❌ RLS策略测试失败:', error.message)
    console.log('\n⚠️  需要在Supabase SQL Editor中执行以下SQL:\n')
    console.log('─'.repeat(70))
    console.log(`
DROP POLICY IF EXISTS "Allow anonymous to read invite codes" ON users;

CREATE POLICY "Allow anonymous to read invite codes"
ON users FOR SELECT TO anon
USING (invite_code IS NOT NULL);
`)
    console.log('─'.repeat(70))
    return false
  }
  
  console.log('✅ RLS策略测试通过！匿名用户可以读取邀请码\n')
  return true
}

// ============================================
// 步骤4: 测试邀请码验证（模拟前端）
// ============================================
async function testInviteCodeValidation(inviteCode) {
  console.log('📋 步骤4: 测试邀请码验证（模拟前端注册流程）')
  console.log('─'.repeat(70))
  
  console.log(`正在验证邀请码: ${inviteCode}`)
  
  const { data, error } = await anon
    .from('users')
    .select('id, username')
    .eq('invite_code', inviteCode)
    .single()
  
  if (error || !data) {
    console.log('❌ 邀请码验证失败:', error?.message || '未找到用户')
    return false
  }
  
  console.log(`✅ 邀请码验证成功！`)
  console.log(`   邀请人: ${data.username}`)
  console.log(`   邀请人ID: ${data.id}\n`)
  return true
}

// ============================================
// 步骤5: 测试完整注册流程
// ============================================
async function testFullRegistration(inviteCode) {
  console.log('📋 步骤5: 测试完整注册流程')
  console.log('─'.repeat(70))
  
  const testUsername = 'testuser_' + Date.now()
  const testEmail = `${testUsername}@example.com`
  const testPassword = 'test123456'
  
  console.log(`测试用户: ${testUsername}`)
  console.log(`测试邮箱: ${testEmail}`)
  console.log('')
  
  // 5.1 验证邀请码
  console.log('   → 验证邀请码...')
  const { data: inviterData, error: inviterError } = await anon
    .from('users')
    .select('id')
    .eq('invite_code', inviteCode)
    .single()
  
  if (inviterError || !inviterData) {
    console.log('   ❌ 邀请码验证失败')
    return false
  }
  console.log('   ✅ 邀请码验证通过')
  
  // 5.2 注册Auth账号
  console.log('   → 注册Auth账号...')
  const { data: signUpData, error: signUpError } = await anon.auth.signUp({
    email: testEmail,
    password: testPassword
  })
  
  if (signUpError || !signUpData.user) {
    console.log('   ❌ Auth注册失败:', signUpError?.message)
    return false
  }
  console.log('   ✅ Auth注册成功')
  
  // 5.3 插入users表
  console.log('   → 插入users记录...')
  
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${signUpData.session?.access_token}`
      }
    }
  })
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const newInviteCode = Array.from({ length: 8 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
  
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
    console.log('   ❌ 插入users记录失败:', insertError.message)
    await admin.auth.admin.deleteUser(signUpData.user.id)
    return false
  }
  
  console.log('   ✅ users记录插入成功')
  console.log(`   ✅ 新用户邀请码: ${newInviteCode}`)
  
  // 5.4 清理测试用户
  console.log('   → 清理测试用户...')
  await admin.auth.admin.deleteUser(signUpData.user.id)
  await admin.from('users').delete().eq('id', signUpData.user.id)
  console.log('   ✅ 测试用户已清理\n')
  
  return true
}

// ============================================
// 主流程
// ============================================
async function main() {
  try {
    // 步骤1: 检查现有用户
    const firstUser = await checkExistingUsers()
    
    // 步骤2: 检查Auth用户
    const authUsers = await checkAuthUsers()
    
    if (!firstUser) {
      console.log('⚠️  系统中没有用户！')
      console.log('\n请按照以下步骤创建第一个用户:\n')
      console.log('1. 在Supabase Dashboard → Authentication → Users')
      console.log('   https://supabase.com/dashboard/project/vtezesyfhvbkgpdkuyeo/auth/users')
      console.log('')
      console.log('2. 点击 "Add user" → "Create new user"')
      console.log('   Email: admin@example.com')
      console.log('   Password: admin123')
      console.log('   Auto Confirm: ✅ 勾选')
      console.log('')
      console.log('3. 创建后复制UUID，在SQL Editor中执行:\n')
      console.log('─'.repeat(70))
      console.log(`
INSERT INTO users (
  id, 
  username, 
  invite_code, 
  inviter_id, 
  is_agent, 
  is_admin, 
  u_balance, 
  points_balance
)
VALUES (
  '粘贴UUID',
  'admin',
  'AI8K3Q9Z',
  NULL,
  true,
  true,
  100,
  500
);
`)
      console.log('─'.repeat(70))
      console.log('\n4. 执行完成后重新运行此脚本\n')
      process.exit(1)
    }
    
    const inviteCode = firstUser.invite_code
    
    // 步骤3: 测试RLS策略
    const rlsPassed = await testRLSPolicy()
    if (!rlsPassed) {
      console.log('❌ 测试中止：RLS策略未通过\n')
      process.exit(1)
    }
    
    // 步骤4: 测试邀请码验证
    const validationPassed = await testInviteCodeValidation(inviteCode)
    if (!validationPassed) {
      console.log('❌ 测试中止：邀请码验证失败\n')
      process.exit(1)
    }
    
    // 步骤5: 测试完整注册流程
    const registrationPassed = await testFullRegistration(inviteCode)
    if (!registrationPassed) {
      console.log('❌ 测试中止：注册流程失败\n')
      process.exit(1)
    }
    
    // 成功总结
    console.log('═'.repeat(70))
    console.log('🎉 所有测试通过！邀请码系统工作正常！')
    console.log('═'.repeat(70))
    console.log('')
    console.log('📝 系统信息:')
    console.log(`   第一个用户: ${firstUser.username}`)
    console.log(`   邀请码: ${firstUser.invite_code}`)
    console.log('')
    console.log('📝 使用说明:')
    console.log('   1. 启动服务: npm run dev')
    console.log('   2. 访问: http://localhost:3000/login')
    console.log(`   3. 登录用户名: ${firstUser.username}`)
    console.log('   4. 登录密码: (您设置的密码)')
    console.log(`   5. 邀请他人使用邀请码: ${firstUser.invite_code}`)
    console.log('')
    console.log('✅ 邀请码系统已就绪！')
    console.log('')
    
    process.exit(0)
    
  } catch (error) {
    console.error('❌ 执行过程中出错:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
























