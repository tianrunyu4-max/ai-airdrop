#!/usr/bin/env node

/**
 * 创建第一个用户 - 使用不同的邮箱策略
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vtezesyfhvbkgpdkuyeo.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZXplc3lmaHZia2dwZGt1eWVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5OTY0MSwiZXhwIjoyMDc1MDc1NjQxfQ.GXgjAJcc1A1WztAns4Tij5WbdtAdvY0Xer8kI8KTmYI'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('🚀 创建第一个用户\n')

// 生成邀请码
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const inviteCode = Array.from({ length: 8 }, () => 
  chars[Math.floor(Math.random() * chars.length)]
).join('')

// 尝试不同的邮箱格式
const emailOptions = [
  'admin@example.com',
  'admin@test.com',
  'admin@demo.com',
  `admin${Date.now()}@example.com`
]

let authUser = null
let usedEmail = null

for (const email of emailOptions) {
  console.log(`尝试创建 ${email}...`)
  
  const { data, error } = await admin.auth.admin.createUser({
    email: email,
    password: 'admin123',
    email_confirm: true,
    user_metadata: {
      username: 'admin'
    }
  })
  
  if (!error && data.user) {
    authUser = data.user
    usedEmail = email
    console.log(`✅ Auth用户创建成功: ${email}\n`)
    break
  } else {
    console.log(`   ❌ 失败: ${error?.message || '未知错误'}`)
  }
}

if (!authUser) {
  console.log('\n❌ 所有邮箱格式都失败了')
  console.log('\n这可能是Supabase项目配置问题。请检查:')
  console.log('1. Authentication → Providers → Email 是否已启用')
  console.log('2. Authentication → Settings → User Signups 是否允许')
  console.log('\n或者手动创建用户:')
  console.log('1. 打开: https://supabase.com/dashboard/project/vtezesyfhvbkgpdkuyeo/auth/users')
  console.log('2. 点击 "Add user"')
  console.log('3. 输入任意邮箱和密码，确认后复制UUID')
  console.log('4. 在SQL Editor执行:\n')
  console.log(`INSERT INTO users (id, username, invite_code, inviter_id, is_agent, is_admin, u_balance, points_balance)
VALUES ('粘贴UUID', 'admin', '${inviteCode}', NULL, true, true, 100, 500);\n`)
  process.exit(1)
}

// 创建users记录
console.log('正在创建users记录...')
const { error: insertError } = await admin
  .from('users')
  .insert({
    id: authUser.id,
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
  await admin.auth.admin.deleteUser(authUser.id)
  process.exit(1)
}

console.log('✅ users记录创建成功!\n')

console.log('═'.repeat(60))
console.log('🎉 第一个用户创建完成！')
console.log('═'.repeat(60))
console.log(`\n📧 邮箱: ${usedEmail}`)
console.log(`👤 用户名: admin`)
console.log(`🔑 密码: admin123`)
console.log(`🎫 邀请码: ${inviteCode}`)

console.log(`\n📝 登录方式:`)
console.log(`   方式1: 用户名登录`)
console.log(`      用户名: admin`)
console.log(`      密码: admin123`)
console.log(`\n   方式2: 邮箱登录`)
console.log(`      邮箱: ${usedEmail}`)
console.log(`      密码: admin123`)

console.log(`\n🔗 访问地址:`)
console.log(`   http://localhost:3000/login`)

console.log(`\n📤 邀请他人:`)
console.log(`   使用邀请码: ${inviteCode}\n`)

// 最后测试一下登录
console.log('正在测试登录...')
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZXplc3lmaHZia2dwZGt1eWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTk2NDEsImV4cCI6MjA3NTA3NTY0MX0.yltJO7ycKMODw0-tS6EMN6P1u7AH6fI6yTvvqwgvQMs'
const testClient = createClient(SUPABASE_URL, ANON_KEY)

const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
  email: usedEmail,
  password: 'admin123'
})

if (loginError) {
  console.log('⚠️  登录测试失败:', loginError.message)
  console.log('   但用户已创建，可能需要等待几秒后重试\n')
} else {
  console.log('✅ 登录测试成功！\n')
}

process.exit(0)

















