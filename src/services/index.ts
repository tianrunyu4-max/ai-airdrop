/**
 * Services - 统一导出所有Service（重构版）
 * 使用新架构：Repository + Wallet + Config + Utils
 */

export { BaseService, type ApiResponse } from './BaseService'

// 已重构的Service（使用新架构）
export { UserService } from './UserService'
export { TransactionService, type Transaction, type TransferParams } from './TransactionService'
export { WithdrawalService, type Withdrawal } from './WithdrawalService'
export { MiningService } from './MiningService'  // ← 已重构！

// 未重构的Service（保持原样）
export { ChatService } from './ChatService'
export { AdminService } from './AdminService'

// 使用示例（重构后）：
// import { UserService } from '@/services'
// 
// // 订阅代理（自动验证+扣款+流水）
// const result = await UserService.subscribeAgent(userId)
// 
// // U转账（自动验证+流水+回滚）
// await TransactionService.transferU({ fromUserId, toUserId, amount })
// 
// // 提现申请（自动验证+扣款+流水）
// await WithdrawalService.createWithdrawal(userId, amount, walletAddress)
