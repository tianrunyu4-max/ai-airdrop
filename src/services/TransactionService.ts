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
   * 获取用户的交易记录
   */
  static async getUserTransactions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<Transaction[]>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      const transactions = await TransactionRepository.query({
        user_id: userId,
        limit,
        offset
      })
      return { success: true, data: transactions }
    } catch (error) {
      return this.handleError(error)
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
   * 积分转账（使用新架构）
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

      // 2. 检查接收方是否存在
      const toUser = await UserRepository.findById(toUserId)
      if (!toUser) {
        return { success: false, error: '接收方不存在' }
      }

      // 3. 检查发送方积分是否充足
      await BalanceValidator.checkPointsSufficient(fromUserId, amount, 'transfer')

      // 4. 扣除发送方积分
      const fromUser = await UserRepository.findById(fromUserId)
      await UserRepository.updatePoints(
        fromUserId,
        fromUser.points_balance - amount,
        fromUser.mining_points,
        fromUser.transfer_points - amount
      )

      // 5. 增加接收方积分
      await UserRepository.updatePoints(
        toUserId,
        toUser.points_balance + amount,
        toUser.mining_points,
        toUser.transfer_points + amount
      )

      // 6. 记录流水
      await TransactionRepository.create({
        user_id: fromUserId,
        type: 'transfer_out',
        amount: -amount,
        balance_after: fromUser.points_balance - amount,
        related_user_id: toUserId,
        description: description || `转账积分给 ${toUser.username}`
      })

      await TransactionRepository.create({
        user_id: toUserId,
        type: 'transfer_in',
        amount: amount,
        balance_after: toUser.points_balance + amount,
        related_user_id: fromUserId,
        description: description || '收到积分转账'
      })

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
