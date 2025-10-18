/**
 * Earnings Entity - 收益记录实体
 */

import type { EarningsType } from '@/config'

export interface Earnings {
  id: string
  user_id: string
  type: EarningsType
  amount: number
  description: string
  source_user_id: string | null    // 来源用户ID
  metadata: Record<string, any> | null  // 扩展字段（如对碰次数、矿机ID等）
  created_at: string
}

// 收益创建参数
export interface EarningsCreateParams {
  user_id: string
  type: EarningsType
  amount: number
  description: string
  source_user_id?: string
  metadata?: Record<string, any>
}

// 收益查询参数
export interface EarningsQueryParams {
  user_id?: string
  type?: EarningsType
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

// 收益统计
export interface EarningsStats {
  total_amount: number           // 总收益
  pairing_amount: number         // 对碰奖
  level_amount: number           // 平级奖
  dividend_amount: number        // 分红
  mining_amount: number          // 矿机收益
  referral_amount: number        // 推荐奖
  count: number                  // 记录数
}

// 收益日报
export interface EarningsDaily {
  date: string
  total_amount: number
  by_type: Record<EarningsType, number>
}






























