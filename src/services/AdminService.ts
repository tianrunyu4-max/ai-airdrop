/**
 * AdminService - 管理后台服务
 */

import { supabase } from '@/lib/supabase'

export class AdminService {
  /**
   * 获取仪表板统计数据
   */
  static async getDashboardStats() {
    try {
      // 1. 总用户数和今日新增
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { count: todayNewUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // 2. 代理用户数
      const { count: totalAgents } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_agent', true)

      // 3. 待审核提现
      const { data: pendingWithdrawalsData, count: pendingWithdrawalsCount } = await supabase
        .from('withdrawals')
        .select('amount', { count: 'exact' })
        .eq('status', 'pending')

      const pendingAmount = pendingWithdrawalsData?.reduce((sum, w) => sum + w.amount, 0) || 0

      // 4. 活跃矿机
      const { count: activeMachines } = await supabase
        .from('mining_machines')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // 5. 累计产出（从daily_releases表）
      const { data: releasesData } = await supabase
        .from('daily_releases')
        .select('points_to_u')

      const totalMiningOutput = releasesData?.reduce((sum, r) => sum + (r.points_to_u || 0), 0) || 0

      return {
        totalUsers: totalUsers || 0,
        todayNewUsers: todayNewUsers || 0,
        totalAgents: totalAgents || 0,
        agentRate: totalUsers ? ((totalAgents || 0) / totalUsers * 100).toFixed(1) : '0.0',
        pendingWithdrawals: pendingWithdrawalsCount || 0,
        pendingAmount: pendingAmount,
        activeMachines: activeMachines || 0,
        totalMiningOutput: totalMiningOutput
      }
    } catch (error) {
      console.error('Get dashboard stats error:', error)
      return {
        totalUsers: 0,
        todayNewUsers: 0,
        totalAgents: 0,
        agentRate: '0.0',
        pendingWithdrawals: 0,
        pendingAmount: 0,
        activeMachines: 0,
        totalMiningOutput: 0
      }
    }
  }

  /**
   * 获取最新用户
   */
  static async getRecentUsers(limit: number = 5) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, inviter_id, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      // 获取邀请人用户名
      const result = await Promise.all(
        (data || []).map(async (user) => {
          let inviter = '-'
          if (user.inviter_id) {
            const { data: inviterData } = await supabase
              .from('users')
              .select('username')
              .eq('id', user.inviter_id)
              .single()
            
            if (inviterData) inviter = inviterData.username
          }
          
          return {
            ...user,
            inviter
          }
        })
      )

      return result
    } catch (error) {
      console.error('Get recent users error:', error)
      return []
    }
  }

  /**
   * 获取最新提现
   */
  static async getRecentWithdrawals(limit: number = 5) {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('id, user_id, amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      // 获取用户名
      const result = await Promise.all(
        (data || []).map(async (withdrawal) => {
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', withdrawal.user_id)
            .single()

          return {
            ...withdrawal,
            username: userData?.username || '未知'
          }
        })
      )

      return result
    } catch (error) {
      console.error('Get recent withdrawals error:', error)
      return []
    }
  }

  /**
   * 获取统计数据（旧方法，保留兼容性）
   */
  static async getStats() {
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_agent', true)

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalRevenue: 0
    }
  }

  /**
   * 获取提现统计（旧方法，保留兼容性）
   */
  static async getWithdrawalStats() {
    const { data: pending, count: pendingCount } = await supabase
      .from('withdrawals')
      .select('amount', { count: 'exact' })
      .eq('status', 'pending')

    const pendingAmount = pending?.reduce((sum, w) => sum + w.amount, 0) || 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: todayApproved, count: todayApprovedCount } = await supabase
      .from('withdrawals')
      .select('amount', { count: 'exact' })
      .eq('status', 'approved')
      .gte('updated_at', today.toISOString())

    const todayApprovedAmount = todayApproved?.reduce((sum, w) => sum + w.amount, 0) || 0

    const { count: total } = await supabase
      .from('withdrawals')
      .select('*', { count: 'exact', head: true })

    return {
      pending: pendingCount || 0,
      pendingAmount,
      todayApproved: todayApprovedCount || 0,
      todayApprovedAmount,
      total: total || 0,
      totalAmount: 0
    }
  }

  /**
   * 审批提现
   */
  static async approveWithdrawal(withdrawalId: string, note: string) {
    console.log('Admin approve withdrawal:', withdrawalId, note)
    // 实际审批逻辑由WithdrawalService处理
  }

  /**
   * 拒绝提现
   */
  static async rejectWithdrawal(withdrawalId: string, userId: string, amount: number, note: string) {
    console.log('Admin reject withdrawal:', withdrawalId, userId, amount, note)
    // 实际拒绝逻辑由WithdrawalService处理
  }

  /**
   * ✅ 调整用户余额（管理员功能）
   * @param userId 用户ID
   * @param type 调整类型：'u' = U余额，'points' = 积分余额
   * @param amount 调整金额（正数=增加，负数=减少）
   * @param note 备注说明
   */
  static async adjustUserBalance(
    userId: string,
    type: 'u' | 'points',
    amount: number,
    note: string
  ) {
    try {
      // 1. 获取用户当前余额
      const { data: user, error: getUserError } = await supabase
        .from('users')
        .select('username, u_balance, points_balance, mining_points, transfer_points')
        .eq('id', userId)
        .single()

      if (getUserError || !user) {
        throw new Error('用户不存在')
      }

      // 2. 计算新余额
      let updateData: any = {}
      let newBalance = 0

      if (type === 'u') {
        newBalance = Number((user.u_balance + amount).toFixed(2))
        if (newBalance < 0) {
          throw new Error('余额不足，无法减少')
        }
        updateData.u_balance = newBalance
      } else if (type === 'points') {
        // 积分余额 = mining_points + transfer_points
        const currentPointsBalance = user.points_balance || 0
        newBalance = Number((currentPointsBalance + amount).toFixed(2))
        if (newBalance < 0) {
          throw new Error('积分不足，无法减少')
        }
        // 更新 transfer_points（管理员调整的积分记入互转积分）
        updateData.transfer_points = Number(((user.transfer_points || 0) + amount).toFixed(2))
        updateData.points_balance = newBalance
      }

      // 3. 更新用户余额
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      // 4. 记录操作日志
      console.log(`✅ 管理员调整余额：用户=${user.username}, 类型=${type}, 金额=${amount}, 备注=${note}`)

      return {
        success: true,
        message: `成功${amount > 0 ? '增加' : '减少'}${Math.abs(amount)}${type === 'u' ? 'U' : '积分'}`
      }
    } catch (error: any) {
      console.error('调整余额失败:', error)
      throw new Error(error.message || '调整余额失败')
    }
  }
}


