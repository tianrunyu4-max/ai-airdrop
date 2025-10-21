/**
 * TransferController - 转账控制器
 * 处理U和积分互转
 */

import { BaseController, type ApiResponse } from './BaseController'
import { UserRepository, TransactionRepository } from '@/repositories'
import { WalletManager, BalanceValidator } from '@/wallet'
import type { Transaction } from '@/entities'

export class TransferController extends BaseController {
  /**
   * U转账
   */
  static async transferU(params: {
    fromUserId: string
    toUserId: string
    amount: number
    description?: string
  }): Promise<ApiResponse<{
    success: boolean
    message: string
  }>> {
    return this.handleRequest(async () => {
      const { fromUserId, toUserId, amount, description } = params

      // 1. 参数验证
      this.validateRequired({ fromUserId, toUserId, amount })
      this.validatePositive(amount, 'amount')
      BalanceValidator.validateTransferAmount(amount)

      // 2. 检查是否转账给自己
      if (fromUserId === toUserId) {
        throw new Error('不能转账给自己')
      }

      // 3. 检查接收方是否存在
      const toUser = await UserRepository.findById(toUserId)
      if (!toUser) {
        throw new Error('接收方不存在')
      }

      // 4. 执行转账（自动验证余额+记录流水）
      await WalletManager.transfer(
        fromUserId,
        toUserId,
        amount,
        description
      )

      return {
        success: true,
        message: '转账成功'
      }
    })
  }

  /**
   * 积分转账
   */
  static async transferPoints(params: {
    fromUserId: string
    toUserId: string
    amount: number
    description?: string
  }): Promise<ApiResponse<{
    success: boolean
    message: string
  }>> {
    return this.handleRequest(async () => {
      const { fromUserId, toUserId, amount, description } = params

      // 1. 参数验证
      this.validateRequired({ fromUserId, toUserId, amount })
      this.validatePositive(amount, 'amount')

      // 2. 检查是否转账给自己
      if (fromUserId === toUserId) {
        throw new Error('不能转账给自己')
      }

      // 3. 检查接收方是否存在
      const toUser = await UserRepository.findById(toUserId)
      if (!toUser) {
        throw new Error('接收方不存在')
      }

      // 4. 检查发送方积分是否充足
      await BalanceValidator.checkPointsSufficient(fromUserId, amount, 'transfer')

      // 5. 扣除发送方积分
      const fromUser = await UserRepository.findById(fromUserId)
      await UserRepository.updatePoints(
        fromUserId,
        fromUser.points_balance - amount,
        fromUser.mining_points,
        fromUser.transfer_points - amount
      )

      // 6. 增加接收方积分
      await UserRepository.updatePoints(
        toUserId,
        toUser.points_balance + amount,
        toUser.mining_points,
        toUser.transfer_points + amount
      )

      // 7. 记录流水
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
        message: '转账成功'
      }
    })
  }

  /**
   * 根据用户名转账
   */
  static async transferByUsername(params: {
    fromUserId: string
    toUsername: string
    amount: number
    type: 'u' | 'points'
    description?: string
  }): Promise<ApiResponse<{
    success: boolean
    message: string
  }>> {
    return this.handleRequest(async () => {
      const { fromUserId, toUsername, amount, type, description } = params

      // 1. 参数验证
      this.validateRequired({ fromUserId, toUsername, amount, type })
      this.validateUsername(toUsername)

      // 2. 查找接收方
      const toUser = await UserRepository.findByUsername(toUsername)
      if (!toUser) {
        throw new Error(`用户 ${toUsername} 不存在`)
      }

      // 3. 根据类型执行转账
      if (type === 'u') {
        return await this.transferU({
          fromUserId,
          toUserId: toUser.id,
          amount,
          description
        })
      } else {
        return await this.transferPoints({
          fromUserId,
          toUserId: toUser.id,
          amount,
          description
        })
      }
    })
  }

  /**
   * 获取转账记录
   */
  static async getTransferHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<Transaction[]>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })

      // 查询转账相关的交易记录
      const transactions = await TransactionRepository.query({
        user_id: userId,
        limit,
        offset
      })

      // 过滤出转账记录
      return transactions.filter(tx => 
        tx.type === 'transfer_in' || tx.type === 'transfer_out'
      )
    })
  }

  /**
   * 获取转账统计
   */
  static async getTransferStats(userId: string): Promise<ApiResponse<{
    transfer_in: number
    transfer_out: number
    total_count: number
  }>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })

      const stats = await TransactionRepository.getStats(userId)

      return {
        transfer_in: stats.transfer_in,
        transfer_out: stats.transfer_out,
        total_count: stats.count
      }
    })
  }
}



































