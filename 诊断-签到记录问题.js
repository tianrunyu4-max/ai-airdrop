// ========================================
// 🔍 签到记录诊断脚本
// ========================================
console.log('=== 🔍 开始诊断签到记录问题 ===\n')

// 1. 获取用户信息
const userSession = JSON.parse(localStorage.getItem('user_session') || '{}')
const userId = userSession.id
console.log('👤 当前用户ID:', userId)
console.log('💰 当前U余额:', userSession.u_balance)

// 2. 检查学习卡
const cards = JSON.parse(localStorage.getItem('user_learning_cards') || '[]')
const myCards = cards.filter(c => c.user_id === userId)
console.log('\n💳 学习卡信息:')
console.log('  - 总数:', myCards.length, '张')
console.log('  - 详情:', myCards.map(c => ({
  id: c.id,
  status: c.status,
  last_checkin: c.last_checkin_date,
  released: c.released_points,
  total: c.total_points
})))

// 3. 检查所有交易记录
const transactions = JSON.parse(localStorage.getItem('user_transactions') || '[]')
console.log('\n📊 交易记录统计:')
console.log('  - 总记录数:', transactions.length)

// 按类型分组
const byType = transactions.reduce((acc, tx) => {
  acc[tx.type] = (acc[tx.type] || 0) + 1
  return acc
}, {})
console.log('  - 按类型分组:', byType)

// 4. 检查签到释放记录
const myTransactions = transactions.filter(tx => tx.user_id === userId)
console.log('\n📝 我的交易记录:', myTransactions.length, '条')

const checkinRecords = myTransactions.filter(tx => tx.type === 'checkin_release')
console.log('📅 签到释放记录:', checkinRecords.length, '条')

if (checkinRecords.length > 0) {
  console.log('\n✅ 最新的5条签到记录:')
  checkinRecords.slice(-5).forEach((record, idx) => {
    console.log(`  ${idx + 1}. 时间: ${record.created_at}`)
    console.log(`     金额: +${record.amount}U`)
    console.log(`     释放率: ${(record.metadata?.release_rate * 100).toFixed(1)}%`)
    console.log(`     卡数: ${record.metadata?.cards_count}张`)
  })
} else {
  console.log('❌ 没有找到签到释放记录！')
}

// 5. 检查今天的签到情况
const today = new Date().toISOString().split('T')[0]
const todayCheckins = checkinRecords.filter(r => r.created_at?.startsWith(today))
console.log('\n📆 今天的签到记录:', todayCheckins.length, '条')

// 6. 检查学习卡的最后签到时间
console.log('\n🔍 学习卡签到状态:')
myCards.forEach((card, idx) => {
  const lastCheckin = card.last_checkin_date
  const isToday = lastCheckin?.startsWith(today)
  console.log(`  卡${idx + 1}: ${isToday ? '✅ 今天已签到' : '❌ 未签到'} (${lastCheckin || '从未签到'})`)
})

// 7. 问题诊断
console.log('\n=== 🎯 问题诊断 ===')

if (myCards.length === 0) {
  console.log('❌ 问题: 没有学习卡')
  console.log('✅ 解决: 请先兑换学习卡')
} else if (checkinRecords.length === 0) {
  console.log('❌ 问题: 虽然学习卡显示已签到，但localStorage中没有交易记录')
  console.log('💡 可能原因:')
  console.log('  1. localStorage写入失败')
  console.log('  2. 签到逻辑中交易记录创建失败')
  console.log('  3. localStorage被清空过')
  console.log('\n✅ 解决方案:')
  console.log('  1. 再次点击签到按钮')
  console.log('  2. 观察控制台是否有错误')
  console.log('  3. 检查浏览器是否禁用了localStorage')
} else if (todayCheckins.length === 0) {
  console.log('⚠️ 有历史签到记录，但今天还没有签到')
  console.log('💡 可能是缓存显示问题，请尝试刷新页面')
} else {
  console.log('✅ 一切正常！')
  console.log(`📊 共有 ${checkinRecords.length} 条签到记录`)
  console.log(`📅 今天签到了 ${todayCheckins.length} 次`)
}

// 8. 检查localStorage配额
try {
  const used = new Blob(Object.values(localStorage)).size
  console.log('\n💾 localStorage使用情况:')
  console.log('  - 已使用:', (used / 1024).toFixed(2), 'KB')
  console.log('  - 可用: ~5MB')
} catch (e) {
  console.log('⚠️ 无法检查localStorage使用情况')
}

console.log('\n=== 诊断完成 ===')

