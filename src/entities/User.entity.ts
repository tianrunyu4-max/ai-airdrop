/**
 * User Entity - 用户实体
 */

export interface User {
  // 基础信息
  id: string
  username: string
  password_hash: string
  invite_code: string
  
  // 余额信息
  u_balance: number                // U余额
  points_balance: number           // 总积分
  mining_points: number            // 矿机积分
  transfer_points: number          // 互转积分
  frozen_balance: number           // 冻结余额
  
  // 双区系统
  inviter_id: string | null        // 邀请人ID
  direct_referral_count: number    // 直推人数
  a_side_sales: number             // A区销售额
  b_side_sales: number             // B区销售额
  total_pairs: number              // 总对碰次数
  total_earnings: number           // 总收益
  
  // 代理信息
  is_agent: boolean                // 是否是代理
  is_admin: boolean                // 是否是管理员
  agent_paid_at: string | null     // 代理支付时间
  
  // 账户状态
  is_frozen: boolean               // 账户是否冻结
  freeze_reason: string | null     // 冻结原因
  auto_reinvest: boolean           // 是否自动复投
  
  // 时间戳
  created_at: string
  updated_at: string
}

// 用户创建参数
export interface UserCreateParams {
  username: string
  password_hash: string
  invite_code?: string
  inviter_id?: string
}

// 用户更新参数
export interface UserUpdateParams {
  username?: string
  u_balance?: number
  points_balance?: number
  mining_points?: number
  transfer_points?: number
  frozen_balance?: number
  is_agent?: boolean
  is_frozen?: boolean
  freeze_reason?: string
  auto_reinvest?: boolean
}

// 用户统计信息
export interface UserStats {
  total_users: number
  total_agents: number
  total_balance: number
  active_users_today: number
}

// 用户公开信息（不包含敏感字段）
export type UserPublic = Omit<User, 'password_hash'>














