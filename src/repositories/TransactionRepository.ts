/**
 * TransactionRepository - 交易数据访问
 */

import { supabase } from '@/lib/supabase'
import { BaseRepository } from './BaseRepository'
import type { 
  Transaction, 
  TransactionCreateParams, 
  TransactionQueryParams,
  TransactionStats 
} from '@/entities'

export class TransactionRepository extends BaseRepository {
  private static readonly TABLE = 'transactions'

  /**
   * 创建交易记录
   */
  static async create(params: TransactionCreateParams): Promise<Transaction> {
    return this.handleQuery(
      supabase
        .from(this.TABLE)
        .insert(params)
        .select()
        .single()
    )
  }

  /**
   * 根据ID查找交易
   */
  static async findById(id: string): Promise<Transaction> {
    return this.handleQuery(
      supabase
        .from(this.TABLE)
        .select('*')
        .eq('id', id)
        .single()
    )
  }

  /**
   * 根据订单ID查找（防重复扣款）
   */
  static async findByOrderId(orderId: string): Promise<Transaction | null> {
    return this.handleQueryNullable(
      supabase
        .from(this.TABLE)
        .select('*')
        .eq('metadata->>order_id', orderId)
        .single()
    )
  }

  /**
   * 查询用户交易记录
   */
  static async query(params: TransactionQueryParams): Promise<Transaction[]> {
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
   * 获取用户交易统计
   */
  static async getStats(userId: string): Promise<TransactionStats> {
    const transactions = await this.query({ user_id: userId, limit: 10000 })

    return transactions.reduce(
      (acc, tx) => {
        if (tx.amount > 0) {
          acc.total_income += tx.amount
          if (tx.type === 'transfer_in') {
            acc.transfer_in += tx.amount
          }
        } else {
          acc.total_expense += Math.abs(tx.amount)
          if (tx.type === 'transfer_out') {
            acc.transfer_out += Math.abs(tx.amount)
          }
        }
        acc.count++
        return acc
      },
      {
        total_income: 0,
        total_expense: 0,
        transfer_in: 0,
        transfer_out: 0,
        count: 0
      }
    )
  }

  /**
   * 获取今日交易总额
   */
  static async getTodayTotal(userId: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const transactions = await this.query({
      user_id: userId,
      start_date: today.toISOString()
    })

    return transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
  }

  /**
   * 获取今日交易次数
   */
  static async getTodayCount(userId: string, type?: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const filters: any = {
      user_id: userId,
      created_at: `gte.${today.toISOString()}`
    }

    if (type) {
      filters.type = type
    }

    return this.count(this.TABLE, filters)
  }

  /**
   * 批量创建交易记录
   */
  static async batchCreate(
    transactions: TransactionCreateParams[]
  ): Promise<Transaction[]> {
    return this.batchInsert(this.TABLE, transactions)
  }
}









