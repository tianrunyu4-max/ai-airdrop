/**
 * Supabase配置检查脚本
 * 
 * 功能：
 * 1. 检查.env文件是否存在
 * 2. 验证环境变量配置
 * 3. 测试Supabase连接
 * 4. 给出具体的修复建议
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 开始检查Supabase配置...\n')

// Step 1: 检查.env文件
console.log('📋 Step 1: 检查.env文件')
const envPath = path.join(__dirname, '..', '.env')
const envExists = fs.existsSync(envPath)

if (!envExists) {
  console.log('❌ .env文件不存在！')
  console.log('\n💡 解决方案:')
  console.log('1. 在项目根目录创建.env文件')
  console.log('2. 添加以下内容：\n')
  console.log('VITE_SUPABASE_URL=https://你的项目ID.supabase.co')
  console.log('VITE_SUPABASE_ANON_KEY=你的anon密钥\n')
  console.log('📚 详细指南: docs/SUPABASE_QUICK_SETUP.md')
  process.exit(1)
}

console.log('✅ .env文件存在\n')

// Step 2: 加载环境变量
console.log('📋 Step 2: 加载环境变量')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  }
})

// Step 3: 检查必需变量
console.log('📋 Step 3: 检查必需变量')
const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
const missingVars = requiredVars.filter(v => !envVars[v])

if (missingVars.length > 0) {
  console.log(`❌ 缺少必需的环境变量: ${missingVars.join(', ')}`)
  console.log('\n💡 解决方案:')
  console.log('在.env文件中添加缺少的变量\n')
  console.log('📚 详细指南: docs/SUPABASE_QUICK_SETUP.md')
  process.exit(1)
}

console.log('✅ 所有必需变量已配置\n')

// Step 4: 检查变量值
console.log('📋 Step 4: 检查变量值')
const url = envVars['VITE_SUPABASE_URL']
const key = envVars['VITE_SUPABASE_ANON_KEY']

if (url.includes('your-project-id') || url.includes('placeholder')) {
  console.log('❌ VITE_SUPABASE_URL 使用的是示例值')
  console.log('\n💡 解决方案:')
  console.log('1. 访问 https://app.supabase.com')
  console.log('2. 创建或选择你的项目')
  console.log('3. Settings → API → 复制 Project URL')
  console.log('4. 替换.env中的VITE_SUPABASE_URL\n')
  process.exit(1)
}

if (key.includes('your-anon-key') || key.includes('placeholder') || key.length < 100) {
  console.log('❌ VITE_SUPABASE_ANON_KEY 使用的是示例值或不完整')
  console.log('\n💡 解决方案:')
  console.log('1. 访问 https://app.supabase.com')
  console.log('2. Settings → API → 复制 anon public key (很长！)')
  console.log('3. 替换.env中的VITE_SUPABASE_ANON_KEY')
  console.log('4. 确保完整复制（通常200+字符）\n')
  process.exit(1)
}

console.log('✅ 变量值格式正确\n')

// Step 5: 测试连接
console.log('📋 Step 5: 测试Supabase连接')
console.log('⏳ 连接中...')

try {
  const supabase = createClient(url, key)
  
  // 尝试简单查询
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1)
    
  if (error) {
    // 如果表不存在，说明需要部署schema
    if (error.message.includes('relation "users" does not exist') || 
        error.message.includes('does not exist')) {
      console.log('⚠️  连接成功，但表不存在')
      console.log('\n💡 解决方案:')
      console.log('1. 访问 Supabase Dashboard')
      console.log('2. SQL Editor → New Query')
      console.log('3. 复制 supabase/schema.sql 的内容')
      console.log('4. 粘贴并执行')
      console.log('\n📚 详细指南: docs/SUPABASE_QUICK_SETUP.md')
      process.exit(1)
    }
    
    // 其他错误
    throw error
  }
  
  console.log('✅ Supabase连接成功！')
  console.log('✅ 数据库表已存在\n')
  
} catch (error) {
  console.log('❌ 连接失败')
  console.log(`错误信息: ${error.message}\n`)
  console.log('💡 可能的原因:')
  console.log('1. Project URL 或 Anon Key 不正确')
  console.log('2. 网络连接问题')
  console.log('3. Supabase项目未激活')
  console.log('\n📚 详细指南: docs/SUPABASE_QUICK_SETUP.md')
  process.exit(1)
}

// 全部通过
console.log('🎉 恭喜！Supabase配置完成！')
console.log('\n✅ 配置检查清单:')
console.log('  ✓ .env文件存在')
console.log('  ✓ 环境变量已配置')
console.log('  ✓ 变量值格式正确')
console.log('  ✓ Supabase连接成功')
console.log('  ✓ 数据库表已部署')
console.log('\n🚀 下一步:')
console.log('  → 运行测试: npm test -- --run')
console.log('  → 启动开发: npm run dev')
console.log('  → 访问应用: http://localhost:3000')


































