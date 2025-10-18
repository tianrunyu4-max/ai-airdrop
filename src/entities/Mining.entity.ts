/**
 * Mining Entity - 矿机实体
 */

import type { MiningStatus } from '@/config'

export interface Mining {
  id: string
  user_id: string
  type: 1 | 2 | 3                  // 矿机类型
  cost: number                     // 购买成本
  daily_output: number             // 每日产出
  total_output: number             // 总产出
  released_amount: number          // 已释放数量
  duration: number                 // 总天数
  boost_rate: number               // 加速比例（0-0.10）
  status: MiningStatus
  started_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

// 矿机创建参数
export interface MiningCreateParams {
  user_id: string
  type: 1 | 2 | 3
  cost: number
  daily_output: number
  total_output: number
  duration: number
  boost_rate?: number
}

// 矿机释放记录
export interface MiningRelease {
  id: string
  mining_id: string
  user_id: string
  amount: number
  boost_rate: number
  description: string
  created_at: string
}

// 矿机统计
export interface MiningStats {
  active_count: number         // 运行中的矿机数
  total_cost: number           // 总投入
  total_output: number         // 总产出
  total_released: number       // 已释放
  today_output: number         // 今日产出
}






























