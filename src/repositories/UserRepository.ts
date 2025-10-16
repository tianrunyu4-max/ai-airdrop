/**
 * UserRepository - 用户数据访问
 */

import { supabase } from '@/lib/supabase'
import { BaseRepository } from './BaseRepository'
import type { User, UserCreateParams, UserUpdateParams } from '@/entities'

export class UserRepository extends BaseRepository {
  private static readonly TABLE = 'users'

  /**
   * 根据ID查找用户
   */
  static async findById(id: string): Promise<User> {
    return this.handleQuery(
      supabase
        .from(this.TABLE)
        .select('*')
        .eq('id', id)
        .single()
    )
  }

  /**
   * 根据用户名查找用户
   */
  static async findByUsername(username: string): Promise<User | null> {
    return this.handleQueryNullable(
      supabase
        .from(this.TABLE)
        .select('*')
        .eq('username', username)
        .single()
    )
  }

  /**
   * 根据邀请码查找用户
   */
  static async findByInviteCode(inviteCode: string): Promise<User | null> {
    return this.handleQueryNullable(
      supabase
        .from(this.TABLE)
        .select('*')
        .eq('invite_code', inviteCode)
        .single()
    )
  }

  /**
   * 创建用户
   */
  static async create(params: UserCreateParams): Promise<User> {
    return this.handleQuery(
      supabase
        .from(this.TABLE)
        .insert(params)
        .select()
        .single()
    )
  }

  /**
   * 更新用户
   */
  static async update(id: string, params: UserUpdateParams): Promise<User> {
    return this.handleQuery(
      supabase
        .from(this.TABLE)
        .update(params)
        .eq('id', id)
        .select()
        .single()
    )
  }

  /**
   * 更新余额
   */
  static async updateBalance(id: string, balance: number): Promise<User> {
    return this.update(id, { u_balance: balance })
  }

  /**
   * 更新积分
   */
  static async updatePoints(
    id: string,
    pointsBalance: number,
    miningPoints: number,
    transferPoints: number
  ): Promise<User> {
    return this.update(id, {
      points_balance: pointsBalance,
      mining_points: miningPoints,
      transfer_points: transferPoints
    })
  }

  /**
   * 更新邀请码
   */
  static async updateInviteCode(id: string, inviteCode: string): Promise<User> {
    return this.update(id, { invite_code: inviteCode })
  }

  /**
   * 更新邀请人
   */
  static async updateInviter(id: string, inviterId: string): Promise<User> {
    return this.update(id, { inviter_id: inviterId })
  }

  /**
   * 增加直推人数
   */
  static async incrementDirectReferrals(id: string): Promise<User> {
    return this.handleQuery(
      supabase.rpc('increment_direct_referrals', { user_id: id })
    )
  }

  /**
   * 更新销售业绩
   */
  static async updateSales(
    id: string,
    aSideSales: number,
    bSideSales: number
  ): Promise<User> {
    return this.update(id, {
      a_side_sales: aSideSales,
      b_side_sales: bSideSales
    })
  }

  /**
   * 增加总收益
   */
  static async incrementTotalEarnings(id: string, amount: number): Promise<User> {
    return this.handleQuery(
      supabase.rpc('increment_total_earnings', {
        user_id: id,
        amount
      })
    )
  }

  /**
   * 冻结账户
   */
  static async freezeAccount(id: string, reason?: string): Promise<User> {
    return this.update(id, {
      is_frozen: true,
      freeze_reason: reason || '需要复投'
    })
  }

  /**
   * 解冻账户
   */
  static async unfreezeAccount(id: string): Promise<User> {
    return this.update(id, {
      is_frozen: false,
      freeze_reason: null
    })
  }

  /**
   * 获取直推列表
   */
  static async getDirectReferrals(id: string): Promise<User[]> {
    return this.handleQuery(
      supabase
        .from(this.TABLE)
        .select('*')
        .eq('inviter_id', id)
        .order('created_at', { ascending: false })
    )
  }

  /**
   * 获取上级链（用于平级奖）
   */
  static async getUplineChain(id: string, depth: number): Promise<User[]> {
    const upline: User[] = []
    let currentId = id

    for (let i = 0; i < depth; i++) {
      const user = await this.findById(currentId)
      if (!user.inviter_id) break

      const inviter = await this.findById(user.inviter_id)
      upline.push(inviter)
      currentId = inviter.id
    }

    return upline
  }

  /**
   * 获取分红符合条件的用户（直推≥10人）
   */
  static async getDividendEligibleUsers(): Promise<User[]> {
    return this.handleQuery(
      supabase
        .from(this.TABLE)
        .select('*')
        .gte('direct_referral_count', 10)
    )
  }

  /**
   * 获取所有用户数量
   */
  static async getTotalCount(): Promise<number> {
    return this.count(this.TABLE)
  }

  /**
   * 获取代理数量
   */
  static async getAgentCount(): Promise<number> {
    return this.count(this.TABLE, { is_agent: true })
  }

  /**
   * 检查用户名是否存在
   */
  static async usernameExists(username: string): Promise<boolean> {
    return this.exists(this.TABLE, 'username', username)
  }

  /**
   * 检查邀请码是否存在
   */
  static async inviteCodeExists(inviteCode: string): Promise<boolean> {
    return this.exists(this.TABLE, 'invite_code', inviteCode)
  }
}




















