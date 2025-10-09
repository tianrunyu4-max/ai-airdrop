/**
 * WithdrawalService - 提现相关业务逻辑（重构版）
 * 使用新架构：Repository + Wallet + Config
 */

import { BaseService, type ApiResponse } from './BaseService'
import { WithdrawalRepository, UserRepository } from '@/repositories'
import { WalletManager, BalanceValidator } from '@/wallet'
import { WithdrawalConfig, calculateWithdrawalFee, calculateTotalWithdrawal, validateWalletAddress } from '@/config'
import type { Withdrawal } from '@/entities'

// 导出Withdrawal类型
export type { Withdrawal }

export class WithdrawalService extends BaseService {
  /**
   * 创建提现申请（使用新架构）
   */
  static async createWithdrawal(
    userId: string,
    amount: number,
    walletAddress: string
  ): Promise<ApiResponse<Withdrawal>> {
    this.validateRequired({ userId, amount, walletAddress }, ['userId', 'amount', 'walletAddress'])

    try {
      // 1. 验证金额
      BalanceValidator.validateWithdrawalAmount(amount, WithdrawalConfig.MIN_AMOUNT)

      // 2. 验证钱包地址
      if (!validateWalletAddress(walletAddress)) {
        return {
          success: false,
          error: '请输入有效的TRC20钱包地址'
        }
      }

      // 3. 计算手续费和总额
      const fee = calculateWithdrawalFee(amount)
      const totalAmount = calculateTotalWithdrawal(amount)

      // 4. 检查待审核数量
      const pendingCount = await WithdrawalRepository.getPendingCount(userId)
      if (pendingCount >= WithdrawalConfig.LIMITS.PENDING_COUNT) {
        return {
          success: false,
          error: '您有正在处理的提现申请'
        }
      }

      // 5. 检查今日提现次数
      const todayCount = await WithdrawalRepository.getTodayCount(userId)
      if (todayCount >= WithdrawalConfig.LIMITS.DAILY_COUNT) {
        return {
          success: false,
          error: `每天最多提现${WithdrawalConfig.LIMITS.DAILY_COUNT}次`
        }
      }

      // 6. 扣除余额（使用WalletManager - 自动验证+流水）
      await WalletManager.deduct(
        userId,
        totalAmount,
        'withdraw',
        `提现申请 ${amount}U（手续费${fee}U）`
      )

      // 7. 创建提现记录
      const withdrawal = await WithdrawalRepository.create({
        user_id: userId,
        amount,
        wallet_address: walletAddress,
        fee,
        total_amount: totalAmount,
        status: 'pending'
      })

      return {
        success: true,
        data: withdrawal,
        message: '提现申请已提交'
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取用户提现记录
   */
  static async getUserWithdrawals(
    userId: string,
    limit: number = 50
  ): Promise<ApiResponse<Withdrawal[]>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      const withdrawals = await WithdrawalRepository.getUserWithdrawals(userId, limit)
      return { success: true, data: withdrawals }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取所有提现记录（管理员）
   */
  static async getAllWithdrawals(
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<Withdrawal[]>> {
    try {
      const withdrawals = await WithdrawalRepository.getAll(
        status as any,
        limit,
        offset
      )
      return { success: true, data: withdrawals }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 审核提现（管理员）
   */
  static async reviewWithdrawal(
    withdrawalId: string,
    approved: boolean,
    adminNote?: string
  ): Promise<ApiResponse<Withdrawal>> {
    this.validateRequired({ withdrawalId, approved }, ['withdrawalId', 'approved'])

    try {
      // 1. 获取提现记录
      const withdrawal = await WithdrawalRepository.findById(withdrawalId)

      if (withdrawal.status !== 'pending') {
        return {
          success: false,
          error: '该提现申请已处理'
        }
      }

      // 2. 更新状态
      const newStatus = approved ? 'approved' : 'rejected'
      const updated = await WithdrawalRepository.updateStatus(
        withdrawalId,
        newStatus,
        adminNote
      )

      // 3. 如果拒绝，退回余额（使用WalletManager）
      if (!approved) {
        await WalletManager.add(
          withdrawal.user_id,
          withdrawal.total_amount,
          'refund',
          `提现申请被拒绝，退回${withdrawal.total_amount}U`
        )
      }

      return {
        success: true,
        data: updated,
        message: approved ? '提现申请已通过' : '提现申请已拒绝'
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取提现统计
   */
  static async getWithdrawalStats(userId: string): Promise<ApiResponse<{
    totalWithdrawn: number
    pendingCount: number
    approvedCount: number
    rejectedCount: number
  }>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      const stats = await WithdrawalRepository.getStats(userId)
      return {
        success: true,
        data: {
          totalWithdrawn: stats.total_amount,
          pendingCount: stats.pending_count,
          approvedCount: stats.approved_count,
          rejectedCount: stats.rejected_count
        }
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 计算提现手续费（预览）
   */
  static calculateFee(amount: number): number {
    return calculateWithdrawalFee(amount)
  }

  /**
   * 验证钱包地址
   */
  static validateWalletAddress(address: string): boolean {
    return validateWalletAddress(address)
  }

  /**
   * 错误处理辅助方法
   */
  private static handleError(error: any): ApiResponse {
    console.error('WithdrawalService Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '操作失败'
    }
  }
}
