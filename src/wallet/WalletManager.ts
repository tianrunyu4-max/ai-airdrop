/**
 * WalletManager - 钱包管理器（安全加固版）
 * 核心功能：余额增加、扣除、转账 - 轻快准狠
 * 
 * 安全特性：
 * - 输入验证
 * - 并发控制（数据库级别）
 * - 余额不会为负
 * - 完整的事务日志
 */

import { UserRepository, TransactionRepository } from '@/repositories'
import { BalanceValidator } from './BalanceValidator'
import { TransactionLogger } from './TransactionLogger'
import { InsufficientBalanceException } from '@/exceptions'
import type { RewardType } from '@/config'
import { safeAdd, safeSubtract } from '@/utils'
import { supabase } from '@/lib/supabase'

export class WalletManager {
  // 金额限制
  private static readonly MAX_AMOUNT = 1000000 // 最大单次金额100万
  private static readonly MIN_AMOUNT = 0.01 // 最小金额0.01

  /**
   * 输入验证
   */
  private static validateAmount(amount: number): void {
    if (!amount || amount <= 0) {
      throw new Error('金额必须大于0')
    }
    if (amount < this.MIN_AMOUNT) {
      throw new Error(`金额不能小于${this.MIN_AMOUNT}`)
    }
    if (amount > this.MAX_AMOUNT) {
      throw new Error(`单次金额不能超过${this.MAX_AMOUNT}`)
    }
    if (!Number.isFinite(amount)) {
      throw new Error('金额格式错误')
    }
  }

  /**
   * 增加U余额（数据库原子操作）
   */
  static async add(
    userId: string,
    amount: number,
    type: RewardType,
    description: string,
    relatedUserId?: string
  ): Promise<void> {
    // 1. 验证输入
    this.validateAmount(amount)
    
    if (!userId || !type || !description) {
      throw new Error('参数不完整')
    }

    // 2. 使用数据库原子操作更新余额（防止并发问题）
    const { data, error } = await supabase.rpc('add_user_balance', {
      p_user_id: userId,
      p_amount: amount
    })

    if (error) {
      console.error('增加余额失败:', error)
      throw new Error('余额更新失败')
    }

    const newBalance = data as number

    // 3. 记录流水（TransactionLogger会自动限制长度）
    await TransactionLogger.log({
      user_id: userId,
      type,
      amount,
      balance_after: newBalance,
      description,
      related_user_id: relatedUserId,
      currency: 'U'
    })
  }

  /**
   * 扣除U余额（数据库原子操作）
   */
  static async deduct(
    userId: string,
    amount: number,
    type: RewardType,
    description: string,
    relatedUserId?: string
  ): Promise<void> {
    // 1. 验证输入
    this.validateAmount(amount)
    
    if (!userId || !type || !description) {
      throw new Error('参数不完整')
    }

    // 2. 使用数据库原子操作扣除余额（自动检查余额充足）
    const { data, error } = await supabase.rpc('deduct_user_balance', {
      p_user_id: userId,
      p_amount: amount
    })

    if (error) {
      if (error.message.includes('insufficient')) {
        throw new InsufficientBalanceException(amount, 0)
      }
      console.error('扣除余额失败:', error)
      throw new Error('余额更新失败')
    }

    const newBalance = data as number

    // 3. 记录流水（TransactionLogger会自动限制长度）
    await TransactionLogger.log({
      user_id: userId,
      type,
      amount: -amount,
      balance_after: newBalance,
      description,
      related_user_id: relatedUserId,
      currency: 'U'
    })
  }

  /**
   * 转账（localStorage版本）
   */
  static async transfer(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description?: string
  ): Promise<void> {
    this.validateAmount(amount)

    if (fromUserId === toUserId) {
      throw new Error('不能给自己转账')
    }

    // ✅ 使用Supabase处理转账
    try {
      // 1. 查询双方用户
      const { data: users, error: queryError } = await supabase
        .from('users')
        .select('id, username, u_balance')
        .in('id', [fromUserId, toUserId])
      
      if (queryError) throw queryError
      if (!users || users.length !== 2) {
        throw new Error('用户不存在')
      }

      const fromUser = users.find(u => u.id === fromUserId)
      const toUser = users.find(u => u.id === toUserId)
      
      if (!fromUser || !toUser) {
        throw new Error('用户不存在')
      }

      // 2. 检查余额
      const fromBalance = Number(fromUser.u_balance) || 0
      const toBalance = Number(toUser.u_balance) || 0

      if (fromBalance < amount) {
        throw new Error(`余额不足，当前余额: ${fromBalance} U`)
      }

      // 3. 计算新余额
      const newFromBalance = Number((fromBalance - amount).toFixed(2))
      const newToBalance = Number((toBalance + amount).toFixed(2))
      
      console.log(`💸 转账: ${fromUser.username}(${fromBalance}U) → ${toUser.username}(${toBalance}U), 金额: ${amount}U`)

      // 4. 更新发送方余额
      const { error: fromError } = await supabase
        .from('users')
        .update({ 
          u_balance: newFromBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', fromUserId)
      
      if (fromError) throw fromError

      // 5. 更新接收方余额
      const { error: toError } = await supabase
        .from('users')
        .update({ 
          u_balance: newToBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', toUserId)
      
      if (toError) throw toError

      // 6. 记录转账流水到localStorage（保持兼容性）
      const transactions = JSON.parse(localStorage.getItem('user_transactions') || '[]')
      const timestamp = new Date().toISOString()

      transactions.push({
        id: `tx-${Date.now()}-out`,
        user_id: fromUserId,
        type: 'transfer_out',
        amount: -amount,
        balance_after: newFromBalance,
        related_user_id: toUserId,
        currency: 'U',
        description: description || `转账给 ${toUser.username}`,
        created_at: timestamp
      })

      transactions.push({
        id: `tx-${Date.now()}-in`,
        user_id: toUserId,
        type: 'transfer_in',
        amount: amount,
        balance_after: newToBalance,
        related_user_id: fromUserId,
        currency: 'U',
        description: description || `收到 ${fromUser.username} 的转账`,
        created_at: timestamp
      })

      localStorage.setItem('user_transactions', JSON.stringify(transactions))

      console.log(`✅ 转账成功: ${fromUser.username} -> ${toUser.username}, ${amount} U`)
    } catch (error) {
      console.error('❌ 转账失败:', error)
      throw error
    }
  }

  /**
   * 获取余额（只读操作）
   */
  static async getBalance(userId: string): Promise<{
    u_balance: number
    points_balance: number
    frozen_balance: number
  }> {
    const user = await UserRepository.findById(userId)
    return {
      u_balance: user.u_balance || 0,
      points_balance: user.points_balance || 0,
      frozen_balance: user.frozen_balance || 0
    }
  }

  /**
   * 增加积分余额（原子操作）
   */
  static async addPoints(
    userId: string,
    amount: number,
    type: RewardType,
    description: string
  ): Promise<void> {
    this.validateAmount(amount)

    const { data, error } = await supabase.rpc('add_user_points', {
      p_user_id: userId,
      p_amount: amount
    })

    if (error) {
      console.error('增加积分失败:', error)
      throw new Error('积分更新失败')
    }

    const newBalance = data as number

    await TransactionLogger.log({
      user_id: userId,
      type,
      amount,
      balance_after: newBalance,
      description,
      currency: 'POINTS'
    })
  }

  /**
   * 扣除积分余额（原子操作）
   */
  static async deductPoints(
    userId: string,
    amount: number,
    type: RewardType,
    description: string
  ): Promise<void> {
    this.validateAmount(amount)

    const { data, error } = await supabase.rpc('deduct_user_points', {
      p_user_id: userId,
      p_amount: amount
    })

    if (error) {
      if (error.message.includes('insufficient')) {
        throw new InsufficientBalanceException(amount, 0)
      }
      throw new Error('积分扣除失败')
    }

    const newBalance = data as number

    await TransactionLogger.log({
      user_id: userId,
      type,
      amount: -amount,
      balance_after: newBalance,
      description,
      currency: 'POINTS'
    })
  }

  /**
   * 增加互转积分（原子操作 - 用于AI学习机释放的30%）
   */
  static async addTransferPoints(
    userId: string,
    amount: number,
    type: RewardType,
    description: string
  ): Promise<void> {
    this.validateAmount(amount)

    const { data, error } = await supabase.rpc('add_transfer_points', {
      p_user_id: userId,
      p_amount: amount
    })

    if (error) {
      console.error('增加互转积分失败:', error)
      throw new Error('互转积分更新失败')
    }

    const newBalance = data as number

    await TransactionLogger.log({
      user_id: userId,
      type,
      amount,
      balance_after: newBalance,
      description,
      currency: 'TRANSFER_POINTS'
    })
  }

  /**
   * 扣除互转积分（原子操作）
   */
  static async deductTransferPoints(
    userId: string,
    amount: number,
    type: RewardType,
    description: string
  ): Promise<void> {
    this.validateAmount(amount)

    const { data, error } = await supabase.rpc('deduct_transfer_points', {
      p_user_id: userId,
      p_amount: amount
    })

    if (error) {
      console.error('扣除互转积分失败:', error)
      throw new Error('互转积分不足或扣除失败: ' + error.message)
    }

    const newBalance = data as number

    await TransactionLogger.log({
      user_id: userId,
      type,
      amount: -amount,
      balance_after: newBalance,
      description: description.substring(0, 200),
      currency: 'TRANSFER_POINTS'
    })
  }
}
