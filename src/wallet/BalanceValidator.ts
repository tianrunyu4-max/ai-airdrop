/**
 * BalanceValidator - 余额验证器
 * 防止余额不足、账户冻结、重复扣款等问题
 */

import { UserRepository, TransactionRepository } from '@/repositories'
import { 
  InsufficientBalanceException, 
  AccountFrozenException,
  DuplicateOperationException 
} from '@/exceptions'

export class BalanceValidator {
  /**
   * 检查余额是否充足
   */
  static async checkSufficient(userId: string, amount: number): Promise<void> {
    const user = await UserRepository.findById(userId)

    // 检查账户是否冻结
    if (user.is_frozen) {
      throw new AccountFrozenException(user.freeze_reason || undefined)
    }

    // 检查余额
    if (user.u_balance < amount) {
      throw new InsufficientBalanceException(amount, user.u_balance)
    }
  }

  /**
   * 检查积分是否充足
   */
  static async checkPointsSufficient(
    userId: string,
    amount: number,
    type: 'mining' | 'transfer' = 'transfer'
  ): Promise<void> {
    const user = await UserRepository.findById(userId)

    const balance = type === 'mining' ? user.mining_points : user.transfer_points
    const balanceType = type === 'mining' ? '矿机积分' : '互转积分'

    if (balance < amount) {
      throw new InsufficientBalanceException(amount, balance)
    }
  }

  /**
   * 防止重复扣款
   * @param orderId 订单ID（唯一标识）
   */
  static async checkDuplicate(orderId: string): Promise<void> {
    const transaction = await TransactionRepository.findByOrderId(orderId)

    if (transaction) {
      throw new DuplicateOperationException(`订单${orderId}已处理`)
    }
  }

  /**
   * 检查账户状态
   */
  static async checkAccountStatus(userId: string): Promise<void> {
    const user = await UserRepository.findById(userId)

    if (user.is_frozen) {
      throw new AccountFrozenException(user.freeze_reason || undefined)
    }
  }

  /**
   * 验证转账金额
   */
  static validateTransferAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('转账金额必须大于0')
    }

    if (amount > 1000000) {
      throw new Error('单次转账金额不能超过1,000,000U')
    }

    // 检查小数位数（最多2位）
    if (!Number.isInteger(amount * 100)) {
      throw new Error('转账金额最多支持2位小数')
    }
  }

  /**
   * 验证提现金额
   */
  static validateWithdrawalAmount(amount: number, minAmount: number = 20): void {
    if (amount < minAmount) {
      throw new Error(`最低提现金额为${minAmount}U`)
    }

    if (amount > 100000) {
      throw new Error('单次提现金额不能超过100,000U')
    }

    if (!Number.isInteger(amount * 100)) {
      throw new Error('提现金额最多支持2位小数')
    }
  }
}







