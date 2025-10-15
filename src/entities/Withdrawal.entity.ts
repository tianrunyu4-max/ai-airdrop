/**
 * Withdrawal Entity - 提现实体
 */

import type { WithdrawalStatus } from '@/config'

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  fee: number
  total_amount: number
  wallet_address: string
  status: WithdrawalStatus
  admin_note: string | null
  tx_hash: string | null         // 区块链交易哈希
  applied_at: string
  reviewed_at: string | null
  processed_at: string | null
  completed_at: string | null
}

// 提现创建参数
export interface WithdrawalCreateParams {
  user_id: string
  amount: number
  wallet_address: string
}

// 提现审核参数
export interface WithdrawalReviewParams {
  withdrawal_id: string
  approved: boolean
  admin_note?: string
  tx_hash?: string
}

// 提现统计
export interface WithdrawalStats {
  total_amount: number       // 总提现金额
  pending_count: number      // 待审核数量
  approved_count: number     // 已通过数量
  rejected_count: number     // 已拒绝数量
  today_amount: number       // 今日提现
  today_count: number        // 今日笔数
}


















