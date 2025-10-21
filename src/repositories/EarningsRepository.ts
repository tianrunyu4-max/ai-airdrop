/**
 * EarningsRepository - 收益记录数据访问
 */

import { supabase } from '@/lib/supabase'
import { BaseRepository } from './BaseRepository'
import type {
  Earnings,
  EarningsCreateParams,
  EarningsQueryParams,
  EarningsStats
} from '@/entities'

export class EarningsRepository extends BaseRepository {
  private static readonly TABLE = 'earnings'

  /**
   * 创建收益记录
   */
  static async create(params: EarningsCreateParams): Promise<Earnings> {
    return this.handleQuery(
      supabase
        .from(this.TABLE)
        .insert(params)
        .select()
        .single()
    )
  }

  /**
   * 查询收益记录
   */
  static async query(params: EarningsQueryParams): Promise<Earnings[]> {
    let query = supabase.from(this.TABLE).select('*')

    if (params.user_id) {
      query = query.eq('user_id', params.user_id)
    }

    if (params.type) {
      query = query.eq('type', params.type)
    }

    if (params.start_date) {
      query = query.gte('created_at', params.start_date)
    }

    if (params.end_date) {
      query = query.lte('created_at', params.end_date)
    }

    query = query.order('created_at', { ascending: false })

    if (params.limit) {
      const offset = params.offset || 0
      query = query.range(offset, offset + params.limit - 1)
    }

    return this.handleQuery(query)
  }

  /**
   * 获取用户收益统计
   */
  static async getStats(userId: string): Promise<EarningsStats> {
    const earnings = await this.query({ user_id: userId, limit: 10000 })

    return earnings.reduce(
      (acc, earning) => {
        acc.total_amount += earning.amount

        switch (earning.type) {
          case 'pairing':
            acc.pairing_amount += earning.amount
            break
          case 'level':
            acc.level_amount += earning.amount
            break
          case 'dividend':
            acc.dividend_amount += earning.amount
            break
          case 'mining':
            acc.mining_amount += earning.amount
            break
          case 'referral':
            acc.referral_amount += earning.amount
            break
        }

        acc.count++
        return acc
      },
      {
        total_amount: 0,
        pairing_amount: 0,
        level_amount: 0,
        dividend_amount: 0,
        mining_amount: 0,
        referral_amount: 0,
        count: 0
      }
    )
  }

  /**
   * 获取今日收益
   */
  static async getTodayEarnings(userId: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const earnings = await this.query({
      user_id: userId,
      start_date: today.toISOString()
    })

    return earnings.reduce((sum, e) => sum + e.amount, 0)
  }

  /**
   * 获取本周收益
   */
  static async getWeekEarnings(userId: string): Promise<number> {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const earnings = await this.query({
      user_id: userId,
      start_date: weekAgo.toISOString()
    })

    return earnings.reduce((sum, e) => sum + e.amount, 0)
  }

  /**
   * 获取本月收益
   */
  static async getMonthEarnings(userId: string): Promise<number> {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const earnings = await this.query({
      user_id: userId,
      start_date: monthAgo.toISOString()
    })

    return earnings.reduce((sum, e) => sum + e.amount, 0)
  }

  /**
   * 批量创建收益记录
   */
  static async batchCreate(
    earnings: EarningsCreateParams[]
  ): Promise<Earnings[]> {
    return this.batchInsert(this.TABLE, earnings)
  }
}



































