/**
 * AdminService - 管理后台服务（临时）
 * TODO: 后续需要重构
 */

import { supabase } from '@/lib/supabase'

export class AdminService {
  static async getStats() {
    // 临时实现
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalRevenue: 0
    }
  }

  static async getWithdrawalStats() {
    // 临时实现
    return {
      pending: 0,
      pendingAmount: 0,
      todayApproved: 0,
      todayApprovedAmount: 0,
      total: 0,
      totalAmount: 0
    }
  }

  static async approveWithdrawal(withdrawalId: string, note: string) {
    // 使用WithdrawalService
    console.log('Admin approve withdrawal:', withdrawalId, note)
  }

  static async rejectWithdrawal(withdrawalId: string, userId: string, amount: number, note: string) {
    // 使用WithdrawalService
    console.log('Admin reject withdrawal:', withdrawalId, userId, amount, note)
  }
}


