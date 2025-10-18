/**
 * Transaction Entity - 交易实体
 */

import type { RewardType } from '@/config'

export interface Transaction {
  id: string
  user_id: string
  type: RewardType
  amount: number
  balance_after: number
  related_user_id: string | null
  description: string
  metadata: Record<string, any> | null  // 扩展字段
  created_at: string
}

// 交易创建参数
export interface TransactionCreateParams {
  user_id: string
  type: RewardType
  amount: number
  balance_after: number
  related_user_id?: string
  description: string
  metadata?: Record<string, any>
}

// 交易查询参数
export interface TransactionQueryParams {
  user_id?: string
  type?: RewardType
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

// 交易统计
export interface TransactionStats {
  total_income: number      // 总收入
  total_expense: number     // 总支出
  transfer_in: number       // 转入
  transfer_out: number      // 转出
  count: number             // 交易笔数
}






























