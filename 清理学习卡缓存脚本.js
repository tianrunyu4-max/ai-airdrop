// ==========================================
// 🧹 清理学习卡缓存脚本
// ==========================================
// 用途：清理localStorage中的学习卡数据
// 使用方法：在浏览器控制台执行此脚本
// ==========================================

// 方法1：清理特定用户的学习卡
function clearUserLearningCards(userId) {
  const storageKey = 'user_learning_cards'
  const allCards = JSON.parse(localStorage.getItem(storageKey) || '[]')
  
  // 过滤掉指定用户的学习卡
  const filteredCards = allCards.filter(card => card.user_id !== userId)
  
  localStorage.setItem(storageKey, JSON.stringify(filteredCards))
  
  console.log(`✅ 已清理用户 ${userId} 的学习卡`)
  console.log(`剩余学习卡数量：${filteredCards.length}`)
}

// 方法2：清理所有学习卡（慎用）
function clearAllLearningCards() {
  localStorage.removeItem('user_learning_cards')
  console.log('✅ 已清理所有学习卡数据')
}

// 方法3：查看当前学习卡数据
function viewLearningCards() {
  const storageKey = 'user_learning_cards'
  const allCards = JSON.parse(localStorage.getItem(storageKey) || '[]')
  
  console.log('📋 当前学习卡数据：')
  console.table(allCards.map(card => ({
    用户ID: card.user_id,
    卡片ID: card.id,
    状态: card.status,
    创建时间: card.created_at
  })))
  
  return allCards
}

// 使用示例：
console.log('='.repeat(50))
console.log('🧹 学习卡清理工具')
console.log('='.repeat(50))
console.log('')
console.log('可用命令：')
console.log('1. viewLearningCards()           - 查看当前学习卡')
console.log('2. clearUserLearningCards(userId) - 清理特定用户的学习卡')
console.log('3. clearAllLearningCards()       - 清理所有学习卡（慎用）')
console.log('')
console.log('示例：clearUserLearningCards("your-user-id")')
console.log('='.repeat(50))

