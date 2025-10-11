/**
 * TransactionLogger - 交易流水记录器
 * 所有余额变动都会被记录
 */

import { TransactionRepository } from '@/repositories'
import type { TransactionCreateParams } from '@/entities'

export class TransactionLogger {
  /**
   * 记录交易流水
   */
  static async log(params: TransactionCreateParams): Promise<void> {
    try {
      await TransactionRepository.create(params)
    } catch (error) {
      console.error('Transaction log failed:', error)
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 批量记录交易流水
   */
  static async batchLog(transactions: TransactionCreateParams[]): Promise<void> {
    try {
      await TransactionRepository.batchCreate(transactions)
    } catch (error) {
      console.error('Batch transaction log failed:', error)
    }
  }

  /**
   * 记录转账流水（双向）
   */
  static async logTransfer(
    fromUserId: string,
    toUserId: string,
    amount: number,
    fromBalanceAfter: number,
    toBalanceAfter: number,
    description?: string
  ): Promise<void> {
    await this.batchLog([
      {
        user_id: fromUserId,
        type: 'transfer_out',
        amount: -amount,
        balance_after: fromBalanceAfter,
        related_user_id: toUserId,
        description: description || '转账'
      },
      {
        user_id: toUserId,
        type: 'transfer_in',
        amount,
        balance_after: toBalanceAfter,
        related_user_id: fromUserId,
        description: description || '收到转账'
      }
    ])
  }

  /**
   * 记录奖励流水
   */
  static async logReward(
    userId: string,
    amount: number,
    balanceAfter: number,
    type: 'pairing_bonus' | 'level_bonus' | 'dividend',
    description: string,
    sourceUserId?: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      type,
      amount,
      balance_after: balanceAfter,
      related_user_id: sourceUserId,
      description
    })
  }

  /**
   * 记录提现流水
   */
  static async logWithdrawal(
    userId: string,
    amount: number,
    fee: number,
    balanceAfter: number,
    withdrawalId: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      type: 'withdraw',
      amount: -(amount + fee),
      balance_after: balanceAfter,
      description: `提现 ${amount}U（手续费${fee}U）`,
      metadata: { withdrawal_id: withdrawalId }
    })
  }

  /**
   * 记录退款流水
   */
  static async logRefund(
    userId: string,
    amount: number,
    balanceAfter: number,
    reason: string,
    relatedTransactionId?: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      type: 'refund',
      amount,
      balance_after: balanceAfter,
      description: `退款: ${reason}`,
      metadata: { related_transaction_id: relatedTransactionId }
    })
  }
}







