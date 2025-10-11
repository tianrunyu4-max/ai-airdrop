#!/usr/bin/env node

/**
 * 真实测试 - 模拟前端登录和注册
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vtezesyfhvbkgpdkuyeo.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZXplc3lmaHZia2dwZGt1eWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTk2NDEsImV4cCI6MjA3NTA3NTY0MX0.yltJO7ycKMODw0-tS6EMN6P1u7AH6fI6yTvvqwgvQMs'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

console.log('🧪 真实测试 - 模拟前端操作')
console.log('═'.repeat(80))
console.log('')

// ============================================
// 测试1: 登录 admin 用户
// ============================================
async function testLogin() {
  console.log('📋 测试1: 登录 admin 用户')
  console.log('─'.repeat(80))
  
  // 模拟前端登录逻辑（来自 src/stores/auth.ts）
  const username = 'admin'
  const password = 'admin123'
  
  console.log(`正在尝试登录...`)
  console.log(`  用户名: ${username}`)
  console.log(`  密码: ${password}`)
  console.log('')
  
  // 前端会拼接邮箱
  const email = `${username}@airdrop.app`
  
  console.log(`  → 转换为邮箱: ${email}`)
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })
  
  if (error) {
    console.log(`  ❌ 登录失败: ${error.message}`)
    console.log('')
    console.log('  原因分析:')
    
    if (error.message.includes('Invalid login credentials')) {
      console.log('  1. Auth用户不存在或密码错误')
      console.log('  2. 邮箱未确认')
      console.log('')
      console.log('  解决方案:')
      console.log('  需要在Supabase Dashboard手动创建Auth用户:')
      console.log('  https://supabase.com/dashboard/project/vtezesyfhvbkgpdkuyeo/auth/users')
      console.log('')
      console.log('  步骤:')
      console.log('  1. 点击 "Add user"')
      console.log('  2. Email: admin@airdrop.app')
      console.log('  3. Password: admin123')
      console.log('  4. Auto Confirm: ✅ 勾选')
      console.log('  5. 创建后，确保users表中有对应记录（UUID匹配）')
    }
    
    return null
  }
  
  console.log(`  ✅ Auth登录成功!`)
  console.log(`  用户ID: ${data.user.id}`)
  console.log(`  邮箱: ${data.user.email}`)
  console.log('')
  
  // 获取用户详细信息
  console.log('  → 获取用户详细信息...')
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single()
  
  if (userError) {
    console.log(`  ❌ 获取用户信息失败: ${userError.message}`)
    console.log('')
    console.log('  原因: users表中没有对应记录')
    console.log('  解决方案: 在SQL Editor中执行:')
    console.log(`  INSERT INTO users (id, username, invite_code, inviter_id, is_agent, is_admin, u_balance, points_balance)`)
    console.log(`  VALUES ('${data.user.id}', 'admin', 'AI8K3Q9Z', NULL, true, true, 100, 500);`)
    return null
  }
  
  console.log(`  ✅ 用户信息获取成功!`)
  console.log(`  用户名: ${userData.username}`)
  console.log(`  邀请码: ${userData.invite_code}`)
  console.log(`  U余额: ${userData.u_balance}`)
  console.log(`  积分: ${userData.points_balance}`)
  console.log(`  是否管理员: ${userData.is_admin ? '是' : '否'}`)
  console.log('')
  
  return userData
}

// ============================================
// 测试2: 注册新用户
// ============================================
async function testRegister(inviteCode) {
  console.log('📋 测试2: 注册新用户')
  console.log('─'.repeat(80))
  
  const testUsername = 'testuser001'
  const testPassword = 'test123456'
  
  console.log(`正在尝试注册...`)
  console.log(`  用户名: ${testUsername}`)
  console.log(`  密码: ${testPassword}`)
  console.log(`  邀请码: ${inviteCode}`)
  console.log('')
  
  // 步骤1: 验证邀请码（前端逻辑）
  console.log('  → 步骤1: 验证邀请码...')
  
  const { data: inviterData, error: inviterError } = await supabase
    .from('users')
    .select('id, username')
    .eq('invite_code', inviteCode)
    .single()
  
  if (inviterError || !inviterData) {
    console.log(`  ❌ 邀请码验证失败: ${inviterError?.message || '未找到邀请人'}`)
    console.log('')
    console.log('  原因: 匿名用户无法读取users表')
    console.log('  解决方案: 在SQL Editor中执行:')
    console.log(`  CREATE POLICY "Allow anonymous to read invite codes"`)
    console.log(`  ON users FOR SELECT TO anon`)
    console.log(`  USING (invite_code IS NOT NULL);`)
    return false
  }
  
  console.log(`  ✅ 邀请码验证成功`)
  console.log(`  邀请人: ${inviterData.username}`)
  console.log('')
  
  // 步骤2: 注册Auth账号
  console.log('  → 步骤2: 注册Auth账号...')
  
  const email = `${testUsername}@airdrop.app`
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: email,
    password: testPassword
  })
  
  if (signUpError || !signUpData.user) {
    console.log(`  ❌ Auth注册失败: ${signUpError?.message || '未知错误'}`)
    console.log('')
    console.log('  可能原因:')
    console.log('  1. Email Provider未启用')
    console.log('  2. 需要邮箱确认但未配置SMTP')
    console.log('  3. User Signups被禁用')
    return false
  }
  
  console.log(`  ✅ Auth注册成功`)
  console.log(`  用户ID: ${signUpData.user.id}`)
  console.log('')
  
  // 步骤3: 插入users表
  console.log('  → 步骤3: 插入users表...')
  
  // 生成邀请码
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const newInviteCode = Array.from({ length: 8 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
  
  // 使用新用户的session
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${signUpData.session?.access_token}`
      }
    }
  })
  
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
    console.log(`  ❌ 插入users表失败: ${insertError.message}`)
    console.log('')
    console.log('  原因: RLS策略不允许插入')
    console.log('  解决方案: 在SQL Editor中执行:')
    console.log(`  CREATE POLICY "Allow users to insert their own record"`)
    console.log(`  ON users FOR INSERT TO authenticated`)
    console.log(`  WITH CHECK (auth.uid() = id);`)
    
    // 清理Auth用户
    await supabase.auth.admin.deleteUser(signUpData.user.id).catch(() => {})
    
    return false
  }
  
  console.log(`  ✅ users表插入成功`)
  console.log(`  新用户邀请码: ${newInviteCode}`)
  console.log('')
  
  // 清理测试用户
  console.log('  → 清理测试用户...')
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZXplc3lmaHZia2dwZGt1eWVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5OTY0MSwiZXhwIjoyMDc1MDc1NjQxfQ.GXgjAJcc1A1WztAns4Tij5WbdtAdvY0Xer8kI8KTmYI'
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  await admin.auth.admin.deleteUser(signUpData.user.id)
  await admin.from('users').delete().eq('id', signUpData.user.id)
  
  console.log(`  ✅ 测试用户已清理`)
  console.log('')
  
  return true
}

// ============================================
// 主流程
// ============================================
async function main() {
  try {
    // 测试1: 登录
    const loginUser = await testLogin()
    
    if (!loginUser) {
      console.log('═'.repeat(80))
      console.log('❌ 登录测试失败！')
      console.log('═'.repeat(80))
      console.log('')
      console.log('⚠️  admin用户无法登录，需要手动创建Auth用户')
      console.log('')
      console.log('📝 手动创建步骤:')
      console.log('1. 打开: https://supabase.com/dashboard/project/vtezesyfhvbkgpdkuyeo/auth/users')
      console.log('2. 点击 "Add user" → "Create new user"')
      console.log('3. Email: admin@airdrop.app')
      console.log('4. Password: admin123')
      console.log('5. Auto Confirm: ✅ 勾选')
      console.log('6. 创建后，复制UUID')
      console.log('7. 在SQL Editor中执行:')
      console.log('')
      console.log('UPDATE users SET id = \'粘贴UUID\' WHERE username = \'admin\';')
      console.log('')
      console.log('或者删除现有admin记录，重新插入:')
      console.log('')
      console.log('DELETE FROM users WHERE username = \'admin\';')
      console.log('INSERT INTO users (id, username, invite_code, inviter_id, is_agent, is_admin, u_balance, points_balance)')
      console.log('VALUES (\'粘贴UUID\', \'admin\', \'AI8K3Q9Z\', NULL, true, true, 100, 500);')
      console.log('')
      process.exit(1)
    }
    
    // 测试2: 注册
    const registerSuccess = await testRegister(loginUser.invite_code)
    
    if (!registerSuccess) {
      console.log('═'.repeat(80))
      console.log('⚠️  注册测试失败（但登录正常）')
      console.log('═'.repeat(80))
      console.log('')
      console.log('登录功能正常，但注册流程需要配置')
      console.log('')
      process.exit(1)
    }
    
    // 成功
    console.log('═'.repeat(80))
    console.log('🎉 所有测试通过！')
    console.log('═'.repeat(80))
    console.log('')
    console.log('✅ 登录测试: 通过')
    console.log('✅ 注册测试: 通过')
    console.log('')
    console.log('📝 系统可用:')
    console.log('   访问: http://localhost:3000/login')
    console.log('   用户名: admin')
    console.log('   密码: admin123')
    console.log(`   邀请码: ${loginUser.invite_code}`)
    console.log('')
    
    process.exit(0)
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()






