#!/usr/bin/env node

/**
 * 清理并创建第一个用户
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vtezesyfhvbkgpdkuyeo.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZXplc3lmaHZia2dwZGt1eWVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5OTY0MSwiZXhwIjoyMDc1MDc1NjQxfQ.GXgjAJcc1A1WztAns4Tij5WbdtAdvY0Xer8kI8KTmYI'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('🧹 清理并创建第一个用户\n')

// 步骤1: 检查现有用户
console.log('📋 步骤1: 检查现有用户')
const { data: existingUsers } = await admin
  .from('users')
  .select('*')
  .order('created_at', { ascending: true })

if (existingUsers && existingUsers.length > 0) {
  console.log(`✅ 找到 ${existingUsers.length} 个用户:`)
  existingUsers.forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.username} (邀请码: ${u.invite_code})`)
  })
  
  const firstUser = existingUsers[0]
  console.log(`\n✅ 第一个用户信息:`)
  console.log(`   用户名: ${firstUser.username}`)
  console.log(`   邀请码: ${firstUser.invite_code}`)
  console.log(`   创建时间: ${firstUser.created_at}`)
  
  console.log(`\n📝 使用说明:`)
  console.log(`   1. 前端登录: http://localhost:3000/login`)
  console.log(`      用户名: ${firstUser.username}`)
  console.log(`      密码: (您之前设置的密码)`)
  console.log(`\n   2. 邀请他人使用邀请码: ${firstUser.invite_code}\n`)
  
  process.exit(0)
}

console.log('ℹ️  数据库中没有用户，准备创建...\n')

// 步骤2: 检查Auth中是否有admin@airdrop.app
console.log('📋 步骤2: 检查Auth中的用户')
const { data: authUsers, error: listError } = await admin.auth.admin.listUsers()

if (listError) {
  console.log('❌ 无法列出Auth用户:', listError.message)
  process.exit(1)
}

console.log(`找到 ${authUsers.users.length} 个Auth用户`)

// 查找admin@airdrop.app
const adminAuthUser = authUsers.users.find(u => u.email === 'admin@airdrop.app')

if (adminAuthUser) {
  console.log(`✅ 找到 admin@airdrop.app (ID: ${adminAuthUser.id})`)
  console.log('   正在检查是否有对应的users记录...')
  
  const { data: userData } = await admin
    .from('users')
    .select('*')
    .eq('id', adminAuthUser.id)
    .single()
  
  if (userData) {
    console.log('   ✅ users表中已有记录')
    console.log(`   用户名: ${userData.username}`)
    console.log(`   邀请码: ${userData.invite_code}`)
    console.log(`\n📝 可以直接使用:`)
    console.log(`   用户名: ${userData.username}`)
    console.log(`   邀请码: ${userData.invite_code}\n`)
    process.exit(0)
  }
  
  console.log('   ⚠️  Auth用户存在但users表中无记录')
  console.log('   正在补充users记录...\n')
  
  // 生成邀请码
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const inviteCode = Array.from({ length: 8 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
  
  const { error: insertError } = await admin
    .from('users')
    .insert({
      id: adminAuthUser.id,
      username: 'admin',
      invite_code: inviteCode,
      inviter_id: null,
      is_agent: true,
      is_admin: true,
      u_balance: 100,
      points_balance: 500
    })
  
  if (insertError) {
    console.log('❌ 插入users记录失败:', insertError.message)
    process.exit(1)
  }
  
  console.log('✅ users记录补充成功!')
  console.log(`   用户名: admin`)
  console.log(`   密码: admin123`)
  console.log(`   邀请码: ${inviteCode}`)
  console.log(`\n📝 使用说明:`)
  console.log(`   1. 登录: http://localhost:3000/login`)
  console.log(`      用户名: admin`)
  console.log(`      密码: admin123`)
  console.log(`\n   2. 邀请他人使用邀请码: ${inviteCode}\n`)
  
  process.exit(0)
}

// 步骤3: 创建全新的admin用户
console.log('📋 步骤3: 创建全新的admin用户\n')

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const inviteCode = Array.from({ length: 8 }, () => 
  chars[Math.floor(Math.random() * chars.length)]
).join('')

console.log('正在创建Auth用户...')
const { data: newAuthUser, error: createError } = await admin.auth.admin.createUser({
  email: 'admin@airdrop.app',
  password: 'admin123',
  email_confirm: true
})

if (createError) {
  console.log('❌ 创建Auth用户失败:', createError.message)
  console.log('\n可能的原因:')
  console.log('1. admin@airdrop.app 已存在但未被列出（缓存问题）')
  console.log('2. 邮箱格式被Supabase拒绝')
  console.log('\n建议手动在Supabase Dashboard创建:')
  console.log('1. 打开: https://supabase.com/dashboard/project/vtezesyfhvbkgpdkuyeo/auth/users')
  console.log('2. 点击 "Add user" → "Create new user"')
  console.log('3. 输入:')
  console.log('   Email: admin@airdrop.app')
  console.log('   Password: admin123')
  console.log('   Auto Confirm: Yes')
  console.log('4. 创建后，复制用户的 UUID')
  console.log('5. 在SQL Editor中执行:\n')
  console.log(`INSERT INTO users (id, username, invite_code, inviter_id, is_agent, is_admin, u_balance, points_balance)
VALUES ('粘贴UUID', 'admin', '${inviteCode}', NULL, true, true, 100, 500);\n`)
  process.exit(1)
}

console.log('✅ Auth用户创建成功')

console.log('正在创建users记录...')
const { error: insertError } = await admin
  .from('users')
  .insert({
    id: newAuthUser.user.id,
    username: 'admin',
    invite_code: inviteCode,
    inviter_id: null,
    is_agent: true,
    is_admin: true,
    u_balance: 100,
    points_balance: 500
  })

if (insertError) {
  console.log('❌ 插入users记录失败:', insertError.message)
  await admin.auth.admin.deleteUser(newAuthUser.user.id)
  process.exit(1)
}

console.log('✅ users记录创建成功!\n')

console.log('═'.repeat(60))
console.log('🎉 第一个用户创建完成！')
console.log('═'.repeat(60))
console.log(`\n📝 登录信息:`)
console.log(`   用户名: admin`)
console.log(`   密码: admin123`)
console.log(`   邀请码: ${inviteCode}`)
console.log(`\n📝 使用说明:`)
console.log(`   1. 启动服务: npm run dev`)
console.log(`   2. 打开浏览器: http://localhost:3000/login`)
console.log(`   3. 登录后可在个人中心查看邀请码`)
console.log(`   4. 邀请他人使用邀请码: ${inviteCode}\n`)

process.exit(0)








































