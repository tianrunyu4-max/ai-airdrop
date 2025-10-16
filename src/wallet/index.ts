/**
 * Wallet - 统一导出钱包模块
 */

export { WalletManager } from './WalletManager'
export { BalanceValidator } from './BalanceValidator'
export { TransactionLogger } from './TransactionLogger'

// 使用示例：
// import { WalletManager, BalanceValidator } from '@/wallet'
// 
// // 增加余额
// await WalletManager.add(userId, 100, 'pairing_bonus', '对碰奖')
//
// // 扣除余额（自动验证）
// await WalletManager.deduct(userId, 50, 'agent_fee', '订阅代理')
//
// // 转账
// await WalletManager.transfer(fromUserId, toUserId, 100)























