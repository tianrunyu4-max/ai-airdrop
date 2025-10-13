/**
 * TransactionService - 交易相关业务逻辑（重构版）
 * 使用新架构：Repository + Wallet
 */

import { BaseService, type ApiResponse } from './BaseService'
import { TransactionRepository, UserRepository } from '@/repositories'
import { WalletManager, BalanceValidator } from '@/wallet'
import type { Transaction } from '@/entities'

export interface TransferParams {
  fromUserId: string
  toUserId: string
  amount: number
  type: 'u' | 'points'
  description?: string
}

// 导出Transaction类型
export type { Transaction }

export class TransactionService extends BaseService {
  /**
   * 获取用户的交易记录（localStorage版本）
   */
  static async getUserTransactions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<Transaction[]>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      // 从localStorage读取转账记录
      const storageKey = 'user_transactions'
      const allTransactions = JSON.parse(localStorage.getItem(storageKey) || '[]')
      
      // 过滤出该用户的记录
      const userTransactions = allTransactions
        .filter((t: Transaction) => t.user_id === userId)
        .sort((a: Transaction, b: Transaction) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(offset, offset + limit)
      
      console.log(`✅ 从localStorage加载${userTransactions.length}条交易记录`)
      return { success: true, data: userTransactions }
    } catch (error) {
      console.error('获取交易记录失败:', error)
      return { success: true, data: [] } // 出错时返回空数组
    }
  }

  /**
   * 获取特定类型的交易记录
   */
  static async getTransactionsByType(
    userId: string,
    type: string,
    limit: number = 50
  ): Promise<ApiResponse<Transaction[]>> {
    this.validateRequired({ userId, type }, ['userId', 'type'])

    try {
      const transactions = await TransactionRepository.query({
        user_id: userId,
        type: type as any,
        limit
      })
      return { success: true, data: transactions }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * U转账（使用新架构 - 自动验证+流水）
   */
  static async transferU(params: Omit<TransferParams, 'type'>): Promise<ApiResponse<{
    message: string
  }>> {
    const { fromUserId, toUserId, amount, description } = params

    this.validateRequired({ fromUserId, toUserId, amount }, ['fromUserId', 'toUserId', 'amount'])

    try {
      // 1. 参数验证
      if (amount <= 0) {
        return { success: false, error: '转账金额必须大于0' }
      }

      if (fromUserId === toUserId) {
        return { success: false, error: '不能转账给自己' }
      }

      BalanceValidator.validateTransferAmount(amount)

      // 2. 检查接收方是否存在
      const toUser = await UserRepository.findById(toUserId)
      if (!toUser) {
        return { success: false, error: '接收方不存在' }
      }

      // 3. 使用WalletManager执行转账（自动验证+流水+回滚）
      await WalletManager.transfer(
        fromUserId,
        toUserId,
        amount,
        description
      )

      return {
        success: true,
        data: { message: '转账成功' },
        message: '转账成功'
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 积分转账（localStorage版本）
   */
  static async transferPoints(params: Omit<TransferParams, 'type'>): Promise<ApiResponse<{
    message: string
  }>> {
    const { fromUserId, toUserId, amount, description } = params

    this.validateRequired({ fromUserId, toUserId, amount }, ['fromUserId', 'toUserId', 'amount'])

    try {
      // 1. 参数验证
      if (amount <= 0) {
        return { success: false, error: '转账金额必须大于0' }
      }

      if (fromUserId === toUserId) {
        return { success: false, error: '不能转账给自己' }
      }

      // 2. 使用localStorage处理积分转账
      const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '{}')
      const fromUserKey = Object.keys(registeredUsers).find(key => 
        registeredUsers[key].userData.id === fromUserId
      )
      const toUserKey = Object.keys(registeredUsers).find(key => 
        registeredUsers[key].userData.id === toUserId
      )

      if (!fromUserKey || !toUserKey) {
        return { success: false, error: '用户不存在' }
      }

      const fromUser = registeredUsers[fromUserKey].userData
      const toUser = registeredUsers[toUserKey].userData

      // 3. 检查积分是否充足
      if (fromUser.transfer_points < amount) {
        return { success: false, error: `积分不足，当前可转账积分: ${fromUser.transfer_points}` }
      }

      // 4. 扣除发送方积分
      fromUser.transfer_points = Number((fromUser.transfer_points - amount).toFixed(2))
      fromUser.points_balance = Number((fromUser.points_balance - amount).toFixed(2))
      
      // 5. 增加接收方积分
      toUser.transfer_points = Number((toUser.transfer_points + amount).toFixed(2))
      toUser.points_balance = Number((toUser.points_balance + amount).toFixed(2))

      // 6. 保存更新后的用户数据
      registeredUsers[fromUserKey].userData = fromUser
      registeredUsers[toUserKey].userData = toUser
      localStorage.setItem('registered_users', JSON.stringify(registeredUsers))

      // 7. 记录转账流水
      const transactions = JSON.parse(localStorage.getItem('user_transactions') || '[]')
      const timestamp = new Date().toISOString()

      // 发送方流水
      transactions.push({
        id: `tx-${Date.now()}-points-out`,
        user_id: fromUserId,
        type: 'points_transfer_out',
        amount: -amount,
        balance_after: fromUser.points_balance,
        related_user_id: toUserId,
        currency: 'points',
        description: description || `转账积分给 ${toUser.username}`,
        created_at: timestamp
      })

      // 接收方流水
      transactions.push({
        id: `tx-${Date.now()}-points-in`,
        user_id: toUserId,
        type: 'points_transfer_in',
        amount: amount,
        balance_after: toUser.points_balance,
        related_user_id: fromUserId,
        currency: 'points',
        description: description || `收到 ${fromUser.username} 的积分转账`,
        created_at: timestamp
      })

      localStorage.setItem('user_transactions', JSON.stringify(transactions))

      console.log(`✅ 积分转账成功: ${fromUser.username} -> ${toUser.username}, ${amount} 积分`)

      return {
        success: true,
        data: { message: '转账成功' },
        message: '转账成功'
      }
    } catch (error) {
      console.error('积分转账失败:', error)
      return this.handleError(error)
    }
  }

  /**
   * 获取交易统计
   */
  static async getTransactionStats(userId: string): Promise<ApiResponse<{
    totalIncome: number
    totalExpense: number
    transferIn: number
    transferOut: number
  }>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      const stats = await TransactionRepository.getStats(userId)
      return {
        success: true,
        data: {
          totalIncome: stats.total_income,
          totalExpense: stats.total_expense,
          transferIn: stats.transfer_in,
          transferOut: stats.transfer_out
        }
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 错误处理辅助方法
   */
  private static handleError(error: any): ApiResponse {
    console.error('TransactionService Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '操作失败'
    }
  }
}
