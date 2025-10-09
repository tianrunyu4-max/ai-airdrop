// 用户类型
export interface User {
  id: string
  username: string
  invite_code: string | null  // 改为可空，付费代理才有
  inviter_id: string | null
  referral_position: number
  has_network: boolean
  network_root_id: string | null
  direct_referral_count: number
  total_earnings: number
  u_balance: number
  points_balance: number  // 总积分余额（mining_points + transfer_points）
  mining_points: number   // 矿机产出积分（可兑换U）
  transfer_points: number // 互转积分（不可兑换U）
  is_agent: boolean
  agent_paid_at: string | null
  qualified_for_dividend: boolean
  is_admin: boolean
  language: 'zh' | 'en'
  created_at: string
}

// 消息类型
export interface Message {
  id: string
  chat_group_id: string
  user_id: string
  username: string
  content: string
  type: 'text' | 'system' | 'bot' | 'image'
  image_url?: string
  is_bot?: boolean
  airdrop_data?: any
  ad_data?: any
  created_at: string
  deleted_at: string | null
}

// 聊天群组分类
export interface ChatCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// 机器人配置
export interface BotConfig {
  bot_name: string
  push_interval: number  // 推送间隔（秒）
  welcome_message?: string
  exchange_filter?: string  // 交易所过滤
  min_score?: number  // 最低评分
}

// 聊天群组类型
export interface ChatGroup {
  id: string
  name: string
  description: string | null
  category_id: string | null
  type: 'default_hall' | 'custom'
  member_count: number
  max_members: number
  owner_id: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  bot_enabled: boolean
  bot_config: BotConfig | null
  created_at: string
}

// 群组成员类型
export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  muted_until: string | null
}

// 矿机类型（V3.0更新）
export interface MiningMachine {
  id: string
  user_id: string
  machine_type: 'type1' | 'type2' | 'type3'  // 矿机型号
  daily_output: number      // 每日产出（积分/天）
  production_days: number   // 生产天数
  points_cost: number       // 积分成本（购买价格）
  initial_points: number    // 初始积分（用于出局计算）
  released_points: number   // 已释放积分
  total_points: number      // 总积分（V3.0：2倍出局 = initial_points * 2）
  base_rate: number         // 基础释放率（V3.0：5%/天）
  boost_rate: number        // 加速释放率（V3.0：已取消，固定为0）
  boost_count: number       // 加速数量（V3.0：已取消，固定为0）
  is_active: boolean        // 是否活跃
  exited_at: string | null  // 出局时间
  restart_count?: number    // 重启次数（V3.0新增）
  compound_level?: number   // 复利等级（V3.0新增：0=2倍，1=4倍，2=8倍...）
  is_first_free?: boolean   // 是否首次免费（V3.0新增）
  last_restart_at?: string  // 最后重启时间（V3.0新增）
  created_at: string
}

// 空投信息类型
export interface Airdrop {
  id: string
  exchange: 'binance' | 'okx'
  title: string
  description: string
  requirements: any
  rewards: string
  start_date: string
  end_date: string
  ai_score: number | null
  ai_analysis: any
  url: string
  is_active: boolean
  created_at: string
}

// 交易记录类型
export interface Transaction {
  id: string
  user_id: string
  type: 'spot_award' | 'peer_spot_award' | 'dividend' | 'repurchase_award' | 
        'transfer_in' | 'transfer_out' | 'withdraw' | 'points_convert'
  amount: number
  currency: 'U' | 'POINTS'
  related_user_id: string | null
  description: string
  status: 'pending' | 'completed' | 'rejected'
  created_at: string
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// 分页参数类型
export interface PaginationParams {
  page: number
  pageSize: number
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

