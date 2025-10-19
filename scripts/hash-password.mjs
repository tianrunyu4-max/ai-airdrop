#!/usr/bin/env node

/**
 * 生成密码的 bcrypt 哈希
 * 使用方法：node scripts/hash-password.mjs [密码]
 */

import bcrypt from 'bcryptjs'

const password = process.argv[2] || 'bossab123'

console.log('\n🔐 生成密码哈希...\n')
console.log(`明文密码: ${password}`)

const hash = await bcrypt.hash(password, 10)

console.log(`加密哈希: ${hash}`)
console.log('\n✅ 完成！\n')
console.log('复制上面的加密哈希值用于 SQL 插入。')

