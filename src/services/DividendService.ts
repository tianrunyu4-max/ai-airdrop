/**
 * 分红系统服务
 * 
 * 功能：
 * 1. 管理分红池
 * 2. 执行分红结算（每周一、三、五、日）
 * 3. 查询分红历史
 * 
 * 规则：
 * - 对碰奖的15%进入分红池
 * - 直推≥10人可参与分红
 * - 平均分配给符合条件的用户
 */

import { BaseService, type ApiResponse } from './BaseService'
import { WalletManager } from '@/wallet'
import { BinaryConfig } from '@/config/binary'
import { supabase } from '@/lib/supabase'

interface DividendRecord {
  id: string
  user_id: string
  amount: number
  pool_balance: number
  eligible_count: number
  created_at: string
}

export class DividendService extends BaseService {
  /**
   * 添加到分红池
   * 
   * @param amount - 金额
   * @param source - 来源（pairing_bonus, system_fee等）
   */
  static async addToPool(amount: number, source: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('dividend_pool')
        .insert({
          amount,
          source,
          created_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      console.log(`✅ 分红池 +${amount.toFixed(2)}U (来源: ${source})`)
    } catch (error) {
      console.error('❌ 添加到分红池失败:', error)
      throw error
    }
  }
  
  /**
   * 获取分红池余额
   */
  static async getPoolBalance(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('dividend_pool')
        .select('amount')
      
      if (error) throw error
      
      const total = data?.reduce((sum, record) => sum + record.amount, 0) || 0
      return total
    } catch (error) {
      console.error('❌ 查询分红池余额失败:', error)
      return 0
    }
  }
  
  /**
   * 执行分红结算
   * 
   * 规则：
   * 1. 查询直推≥10人的用户
   * 2. 平均分配分红池余额
   * 3. 记录分红历史
   * 4. 清空分红池
   */
  static async distributeDividends(): Promise<ApiResponse<{
    totalDistributed: number
    recipientCount: number
    sharePerUser: number
  }>> {
    this.validateRequired({}, [])
    
    try {
      console.log('🎯 开始执行分红结算...')
      
      // 1. 获取分红池余额
      const poolBalance = await this.getPoolBalance()
      
      if (poolBalance <= 0) {
        return {
          success: true,
          data: {
            totalDistributed: 0,
            recipientCount: 0,
            sharePerUser: 0
          },
          message: '分红池余额为0，无需结算'
        }
      }
      
      console.log(`💰 分红池余额: ${poolBalance.toFixed(2)}U`)
      
      // 2. 查询符合条件的用户（直推≥10人）
      const { data: eligibleUsers, error } = await supabase
        .from('users')
        .select('id, username, direct_referral_count')
        .gte('direct_referral_count', BinaryConfig.DIVIDEND.CONDITION)
      
      if (error) throw error
      
      if (!eligibleUsers || eligibleUsers.length === 0) {
        console.log('⚠️ 暂无符合条件的用户（直推≥10人）')
        return {
          success: true,
          data: {
            totalDistributed: 0,
            recipientCount: 0,
            sharePerUser: 0
          },
          message: '暂无符合条件的用户'
        }
      }
      
      console.log(`👥 符合条件的用户数: ${eligibleUsers.length}`)
      
      // 3. 按比例分配（平均分配）
      const sharePerUser = poolBalance / eligibleUsers.length
      let totalDistributed = 0
      
      console.log(`📊 每人分配: ${sharePerUser.toFixed(2)}U`)
      
      // 4. 发放分红
      for (const user of eligibleUsers) {
        // 添加到用户钱包
        await WalletManager.add(
          user.id,
          sharePerUser,
          'dividend',
          `排线分红：${new Date().toLocaleDateString()}`
        )
        
        // 记录分红历史
        await supabase
          .from('dividend_records')
          .insert({
            user_id: user.id,
            amount: sharePerUser,
            pool_balance: poolBalance,
            eligible_count: eligibleUsers.length,
            created_at: new Date().toISOString()
          })
        
        // 更新 binary_members 表的 total_dividend
        await supabase
          .from('binary_members')
          .update({
            total_dividend: supabase.raw(`total_dividend + ${sharePerUser}`)
          })
          .eq('user_id', user.id)
        
        totalDistributed += sharePerUser
        
        console.log(`✅ 分红发放: ${user.username} +${sharePerUser.toFixed(2)}U`)
      }
      
      // 5. 清空分红池
      await supabase
        .from('dividend_pool')
        .delete()
        .lte('created_at', new Date().toISOString())
      
      console.log(`🎉 分红结算完成：${totalDistributed.toFixed(2)}U 分配给 ${eligibleUsers.length} 人`)
      
      return {
        success: true,
        data: {
          totalDistributed,
          recipientCount: eligibleUsers.length,
          sharePerUser
        },
        message: `成功分配 ${totalDistributed.toFixed(2)}U 给 ${eligibleUsers.length} 人`
      }
    } catch (error) {
      console.error('❌ 分红结算失败:', error)
      return this.handleError(error)
    }
  }
  
  /**
   * 查询用户分红历史
   * 
   * @param userId - 用户ID
   * @param limit - 返回记录数（默认50）
   */
  static async getDividendHistory(
    userId: string, 
    limit: number = 50
  ): Promise<ApiResponse<DividendRecord[]>> {
    this.validateRequired({ userId }, ['userId'])
    
    try {
      const { data, error } = await supabase
        .from('dividend_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      return this.handleError(error)
    }
  }
  
  /**
   * 查询所有分红历史（管理员）
   * 
   * @param limit - 返回记录数（默认100）
   */
  static async getAllDividendHistory(
    limit: number = 100
  ): Promise<ApiResponse<DividendRecord[]>> {
    try {
      const { data, error } = await supabase
        .from('dividend_records')
        .select(`
          *,
          users:user_id (
            username,
            wallet_address
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      return this.handleError(error)
    }
  }
  
  /**
   * 获取分红统计信息
   */
  static async getDividendStats(): Promise<ApiResponse<{
    poolBalance: number
    eligibleCount: number
    totalDistributed: number
    lastDistributionDate: string | null
  }>> {
    try {
      // 分红池余额
      const poolBalance = await this.getPoolBalance()
      
      // 符合条件的用户数
      const { count: eligibleCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('direct_referral_count', BinaryConfig.DIVIDEND.CONDITION)
      
      // 历史总分红
      const { data: records } = await supabase
        .from('dividend_records')
        .select('amount')
      
      const totalDistributed = records?.reduce((sum, r) => sum + r.amount, 0) || 0
      
      // 最后分红日期
      const { data: lastRecord } = await supabase
        .from('dividend_records')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      return {
        success: true,
        data: {
          poolBalance,
          eligibleCount: eligibleCount || 0,
          totalDistributed,
          lastDistributionDate: lastRecord?.created_at || null
        }
      }
    } catch (error) {
      return this.handleError(error)
    }
  }
  
  /**
   * 检查今天是否应该执行分红
   * 
   * @returns true: 今天需要分红, false: 今天不需要
   */
  static shouldDistributeToday(): boolean {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0=Sunday, 1=Monday, ...
    
    // 每周一(1)、三(3)、五(5)、日(0) 执行分红
    const dividendDays = BinaryConfig.DIVIDEND.SETTLEMENT_DAYS
    
    return dividendDays.includes(dayOfWeek)
  }
  
  /**
   * 获取下次分红日期
   */
  static getNextDividendDate(): Date {
    const today = new Date()
    const currentDay = today.getDay()
    const dividendDays = BinaryConfig.DIVIDEND.SETTLEMENT_DAYS.sort((a, b) => a - b)
    
    // 找到下一个分红日
    let nextDay = dividendDays.find(day => day > currentDay)
    
    if (!nextDay) {
      // 如果本周没有了，取下周的第一个
      nextDay = dividendDays[0] + 7
    }
    
    const daysUntilNext = nextDay - currentDay
    const nextDate = new Date(today)
    nextDate.setDate(today.getDate() + daysUntilNext)
    nextDate.setHours(0, 0, 0, 0)
    
    return nextDate
  }
}

