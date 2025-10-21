/**
 * WithdrawalRepository - 提现数据访问
 */

import { supabase } from '@/lib/supabase'
import { BaseRepository } from './BaseRepository'
import type { Withdrawal, WithdrawalCreateParams, WithdrawalStats } from '@/entities'
import type { WithdrawalStatus } from '@/config'

export class WithdrawalRepository extends BaseRepository {
  private static readonly TABLE = 'withdrawals'

  /**
   * 创建提现申请
   */
  static async create(params: WithdrawalCreateParams & {
    fee: number
    total_amount: number
    status: WithdrawalStatus
  }): Promise<Withdrawal> {
    return this.handleQuery(
      supabase
        .from(this.TABLE)
        .insert(params)
        .select()
        .single()
    )
  }

  /**
   * 根据ID查找提现
   */
  static async findById(id: string): Promise<Withdrawal> {
    return this.handleQuery(
      supabase
        .from(this.TABLE)
        .select('*')
        .eq('id', id)
        .single()
    )
  }

  /**
   * 更新提现状态
   */
  static async updateStatus(
    id: string,
    status: WithdrawalStatus,
    adminNote?: string,
    txHash?: string
  ): Promise<Withdrawal> {
    const updateData: any = {
      status,
      admin_note: adminNote,
      tx_hash: txHash
    }

    if (status === 'approved' || status === 'rejected') {
      updateData.reviewed_at = new Date().toISOString()
    }

    if (status === 'processing') {
      updateData.processed_at = new Date().toISOString()
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    return this.handleQuery(
      supabase
        .from(this.TABLE)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
    )
  }

  /**
   * 获取用户的提现记录
   */
  static async getUserWithdrawals(
    userId: string,
    limit: number = 50
  ): Promise<Withdrawal[]> {
    return this.handleQuery(
      supabase
        .from(this.TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('applied_at', { ascending: false })
        .limit(limit)
    )
  }

  /**
   * 获取所有提现记录
   */
  static async getAll(
    status?: WithdrawalStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<Withdrawal[]> {
    let query = supabase
      .from(this.TABLE)
      .select('*')
      .order('applied_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    return this.handleQuery(query)
  }

  /**
   * 获取用户待审核的提现数量
   */
  static async getPendingCount(userId: string): Promise<number> {
    return this.count(this.TABLE, {
      user_id: userId,
      status: 'pending'
    })
  }

  /**
   * 获取用户今日提现次数
   */
  static async getTodayCount(userId: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from(this.TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('applied_at', today.toISOString())

    return count || 0
  }

  /**
   * 获取用户今日提现总额
   */
  static async getTodayAmount(userId: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const withdrawals = await this.handleQuery(
      supabase
        .from(this.TABLE)
        .select('amount')
        .eq('user_id', userId)
        .gte('applied_at', today.toISOString())
    )

    return withdrawals.reduce((sum, w) => sum + w.amount, 0)
  }

  /**
   * 获取提现统计
   */
  static async getStats(userId?: string): Promise<WithdrawalStats> {
    let query = supabase.from(this.TABLE).select('*')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const withdrawals = await this.handleQuery(query)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return withdrawals.reduce(
      (acc, w) => {
        acc.total_amount += w.amount

        switch (w.status) {
          case 'pending':
            acc.pending_count++
            break
          case 'approved':
          case 'completed':
            acc.approved_count++
            break
          case 'rejected':
            acc.rejected_count++
            break
        }

        if (new Date(w.applied_at) >= today) {
          acc.today_amount += w.amount
          acc.today_count++
        }

        return acc
      },
      {
        total_amount: 0,
        pending_count: 0,
        approved_count: 0,
        rejected_count: 0,
        today_amount: 0,
        today_count: 0
      }
    )
  }
}



































