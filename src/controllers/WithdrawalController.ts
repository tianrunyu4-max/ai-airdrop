/**
 * WithdrawalController - 提现控制器
 * 处理提现申请、审核、统计
 */

import { BaseController, type ApiResponse } from './BaseController'
import { UserRepository, WithdrawalRepository } from '@/repositories'
import { WalletManager, BalanceValidator } from '@/wallet'
import { WithdrawalConfig, calculateWithdrawalFee, calculateWithdrawalTotal } from '@/config'
import type { Withdrawal, WithdrawalStats } from '@/entities'

export class WithdrawalController extends BaseController {
  /**
   * 创建提现申请
   */
  static async create(params: {
    userId: string
    amount: number
    walletAddress: string
  }): Promise<ApiResponse<Withdrawal>> {
    return this.handleRequest(async () => {
      const { userId, amount, walletAddress } = params

      // 1. 参数验证
      this.validateRequired({ userId, amount, walletAddress })
      this.validateWalletAddress(walletAddress)
      BalanceValidator.validateWithdrawalAmount(amount, WithdrawalConfig.MIN_AMOUNT)

      // 2. 计算手续费和总额
      const fee = calculateWithdrawalFee(amount)
      const totalAmount = calculateWithdrawalTotal(amount)

      // 3. 检查余额
      await BalanceValidator.checkSufficient(userId, totalAmount)

      // 4. 检查待审核数量
      const pendingCount = await WithdrawalRepository.getPendingCount(userId)
      if (pendingCount >= WithdrawalConfig.LIMITS.PENDING_COUNT) {
        throw new Error('您有正在处理的提现申请')
      }

      // 5. 检查今日提现次数
      const todayCount = await WithdrawalRepository.getTodayCount(userId)
      if (todayCount >= WithdrawalConfig.LIMITS.DAILY_COUNT) {
        throw new Error(`每天最多提现${WithdrawalConfig.LIMITS.DAILY_COUNT}次`)
      }

      // 6. 检查今日提现总额
      const todayAmount = await WithdrawalRepository.getTodayAmount(userId)
      if (todayAmount + amount > WithdrawalConfig.LIMITS.DAILY_AMOUNT) {
        throw new Error(`每天最多提现${WithdrawalConfig.LIMITS.DAILY_AMOUNT}U`)
      }

      // 7. 扣除余额
      await WalletManager.deduct(
        userId,
        totalAmount,
        'withdraw',
        `提现申请 ${amount}U（手续费${fee}U）`
      )

      // 8. 创建提现记录
      const withdrawal = await WithdrawalRepository.create({
        user_id: userId,
        amount,
        wallet_address: walletAddress,
        fee,
        total_amount: totalAmount,
        status: 'pending'
      })

      return withdrawal
    })
  }

  /**
   * 获取用户提现记录
   */
  static async getUserWithdrawals(
    userId: string,
    limit: number = 50
  ): Promise<ApiResponse<Withdrawal[]>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })
      return await WithdrawalRepository.getUserWithdrawals(userId, limit)
    })
  }

  /**
   * 获取所有提现记录（管理员）
   */
  static async getAll(
    adminUser: any,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<Withdrawal[]>> {
    return this.handleRequest(async () => {
      // 检查管理员权限
      this.checkAdminPermission(adminUser.id, adminUser)

      return await WithdrawalRepository.getAll(
        status as any,
        limit,
        offset
      )
    })
  }

  /**
   * 审核提现（管理员）
   */
  static async review(
    adminUser: any,
    params: {
      withdrawalId: string
      approved: boolean
      adminNote?: string
      txHash?: string
    }
  ): Promise<ApiResponse<Withdrawal>> {
    return this.handleRequest(async () => {
      const { withdrawalId, approved, adminNote, txHash } = params

      // 1. 检查管理员权限
      this.checkAdminPermission(adminUser.id, adminUser)

      // 2. 参数验证
      this.validateRequired({ withdrawalId, approved })

      // 3. 获取提现记录
      const withdrawal = await WithdrawalRepository.findById(withdrawalId)
      
      if (withdrawal.status !== 'pending') {
        throw new Error('该提现申请已处理')
      }

      // 4. 更新状态
      const newStatus = approved ? 'approved' : 'rejected'
      const updated = await WithdrawalRepository.updateStatus(
        withdrawalId,
        newStatus,
        adminNote,
        txHash
      )

      // 5. 如果拒绝，退回余额
      if (!approved) {
        await WalletManager.add(
          withdrawal.user_id,
          withdrawal.total_amount,
          'refund',
          `提现申请被拒绝，退回${withdrawal.total_amount}U`
        )
      }

      return updated
    })
  }

  /**
   * 更新提现状态（管理员）
   */
  static async updateStatus(
    adminUser: any,
    params: {
      withdrawalId: string
      status: 'processing' | 'completed'
      txHash?: string
    }
  ): Promise<ApiResponse<Withdrawal>> {
    return this.handleRequest(async () => {
      const { withdrawalId, status, txHash } = params

      // 1. 检查管理员权限
      this.checkAdminPermission(adminUser.id, adminUser)

      // 2. 参数验证
      this.validateRequired({ withdrawalId, status })

      // 3. 更新状态
      return await WithdrawalRepository.updateStatus(
        withdrawalId,
        status,
        undefined,
        txHash
      )
    })
  }

  /**
   * 获取提现统计
   */
  static async getStats(userId: string): Promise<ApiResponse<WithdrawalStats>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })
      return await WithdrawalRepository.getStats(userId)
    })
  }

  /**
   * 获取全局提现统计（管理员）
   */
  static async getGlobalStats(adminUser: any): Promise<ApiResponse<WithdrawalStats>> {
    return this.handleRequest(async () => {
      // 检查管理员权限
      this.checkAdminPermission(adminUser.id, adminUser)
      
      return await WithdrawalRepository.getStats()
    })
  }

  /**
   * 计算提现手续费（预览）
   */
  static calculateFee(amount: number): ApiResponse<{
    amount: number
    fee: number
    total: number
  }> {
    try {
      this.validatePositive(amount, 'amount')
      BalanceValidator.validateWithdrawalAmount(amount)

      const fee = calculateWithdrawalFee(amount)
      const total = calculateWithdrawalTotal(amount)

      return this.success({
        amount,
        fee,
        total
      })
    } catch (error) {
      return this.error(error instanceof Error ? error.message : '计算失败')
    }
  }
}






































