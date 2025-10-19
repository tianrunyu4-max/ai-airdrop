#!/usr/bin/env node

/**
 * 修复 boss 账号密码（加密为 bcrypt）
 * 使用方法：node scripts/fix-boss-password.mjs
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载环境变量
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：缺少 Supabase 配置')
  console.error('请确保 .env 文件中包含：')
  console.error('  VITE_SUPABASE_URL=your_url')
  console.error('  VITE_SUPABASE_ANON_KEY=your_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixBossPassword() {
  console.log('🔧 开始修复 boss 账号密码...\n')

  try {
    // 1. 查询 boss 账号
    console.log('📝 查询 boss 账号...')
    const { data: bossUser, error: queryError } = await supabase
      .from('users')
      .select('id, username, password')
      .eq('username', 'boss')
      .single()

    if (queryError) {
      console.error('❌ 查询失败:', queryError.message)
      process.exit(1)
    }

    if (!bossUser) {
      console.error('❌ 未找到 boss 账号')
      process.exit(1)
    }

    console.log(`✅ 找到账号：${bossUser.username} (ID: ${bossUser.id})`)
    console.log(`   当前密码（数据库）：${bossUser.password}`)

    // 2. 检查密码是否已加密
    const isBcryptHash = bossUser.password && bossUser.password.startsWith('$2a$') || bossUser.password.startsWith('$2b$')
    
    if (isBcryptHash) {
      console.log('\n✅ 密码已经是加密格式，尝试验证...')
      
      // 验证密码
      const isValid = await bcrypt.compare('boss123', bossUser.password)
      
      if (isValid) {
        console.log('✅ 密码验证成功！boss123 可以正常登录')
        console.log('\n🎉 无需修复，密码已正确配置！')
        return
      } else {
        console.log('⚠️  密码验证失败，需要重新加密')
      }
    } else {
      console.log('\n⚠️  密码是明文格式，需要加密')
    }

    // 3. 生成新的加密密码
    console.log('\n🔐 生成新的加密密码...')
    const plainPassword = 'boss123'
    const hashedPassword = await bcrypt.hash(plainPassword, 10)
    
    console.log(`   明文密码：${plainPassword}`)
    console.log(`   加密密码：${hashedPassword}`)

    // 4. 更新数据库
    console.log('\n💾 更新数据库...')
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        is_admin: true  // 确保管理员权限
      })
      .eq('id', bossUser.id)

    if (updateError) {
      console.error('❌ 更新失败:', updateError.message)
      process.exit(1)
    }

    console.log('✅ 更新成功！')

    // 5. 验证更新
    console.log('\n🔍 验证更新...')
    const { data: updatedUser } = await supabase
      .from('users')
      .select('username, password, is_admin')
      .eq('id', bossUser.id)
      .single()

    if (updatedUser) {
      console.log(`✅ 账号：${updatedUser.username}`)
      console.log(`✅ 密码已加密：${updatedUser.password.substring(0, 20)}...`)
      console.log(`✅ 管理员权限：${updatedUser.is_admin ? '是' : '否'}`)
      
      // 最终验证
      const finalCheck = await bcrypt.compare('boss123', updatedUser.password)
      console.log(`✅ 密码验证：${finalCheck ? '通过' : '失败'}`)
    }

    console.log('\n🎉 修复完成！')
    console.log('\n📝 登录信息：')
    console.log('   用户名：boss')
    console.log('   密码：boss123')
    console.log('   登录地址：https://ai-airdrop.vercel.app/admin')

  } catch (error) {
    console.error('\n❌ 发生错误:', error.message)
    process.exit(1)
  }
}

// 执行修复
fixBossPassword()

