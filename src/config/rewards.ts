/**
 * 奖励系统配置
 */

export const RewardsConfig = {
  // ========== 奖励类型 ==========
  TYPES: {
    PAIRING_BONUS: 'pairing_bonus',      // 对碰奖
    LEVEL_BONUS: 'level_bonus',          // 平级奖
    DIVIDEND: 'dividend',                // 分红
    MINING_RELEASE: 'mining_release',    // 矿机释放
    REFERRAL_BONUS: 'referral_bonus',    // 推荐奖
    AGENT_FEE: 'agent_fee',              // 代理费用
    TRANSFER_IN: 'transfer_in',          // 转入
    TRANSFER_OUT: 'transfer_out',        // 转出
    DEPOSIT: 'deposit',                  // 充值
    WITHDRAW: 'withdraw',                // 提现
    REFUND: 'refund',                    // 退款
    FREEZE: 'freeze',                    // 冻结
    UNFREEZE: 'unfreeze',                // 解冻
    POINTS_EXCHANGE: 'points_exchange',  // 积分兑换
    MINING_PURCHASE: 'mining_purchase'   // 购买矿机
  },
  
  // ========== 奖励描述模板 ==========
  DESCRIPTIONS: {
    pairing_bonus: (times: number) => `对碰奖 ${times}次`,
    level_bonus: (from: string) => `平级奖 来自${from}`,
    dividend: (amount: number) => `分红 ${amount}U`,
    mining_release: (type: string, amount: number) => `${type}矿机释放 ${amount}积分`,
    referral_bonus: (username: string) => `推荐奖励 来自${username}`,
    agent_fee: () => '订阅代理',
    transfer_in: (from: string) => `收到转账 来自${from}`,
    transfer_out: (to: string) => `转账给 ${to}`,
    deposit: () => '充值',
    withdraw: () => '提现',
    refund: () => '退款',
    freeze: () => '余额冻结',
    unfreeze: () => '余额解冻',
    points_exchange: (points: number, u: number) => `兑换 ${points}积分 → ${u}U`,
    mining_purchase: (type: string) => `购买${type}矿机`
  },
  
  // ========== 收益记录类型 ==========
  EARNINGS_TYPES: {
    PAIRING: 'pairing',
    LEVEL: 'level',
    DIVIDEND: 'dividend',
    MINING: 'mining',
    REFERRAL: 'referral'
  },
  
  // ========== 奖励图标 ==========
  ICONS: {
    pairing_bonus: '💰',
    level_bonus: '🎁',
    dividend: '💎',
    mining_release: '⛏️',
    referral_bonus: '👥',
    agent_fee: '⭐',
    transfer_in: '📥',
    transfer_out: '📤',
    deposit: '💵',
    withdraw: '🏦',
    refund: '↩️',
    freeze: '🔒',
    unfreeze: '🔓',
    points_exchange: '🔄',
    mining_purchase: '🛒'
  },
  
  // ========== 奖励颜色 ==========
  COLORS: {
    pairing_bonus: 'success',
    level_bonus: 'info',
    dividend: 'warning',
    mining_release: 'primary',
    referral_bonus: 'secondary',
    agent_fee: 'accent',
    transfer_in: 'success',
    transfer_out: 'error',
    deposit: 'success',
    withdraw: 'warning',
    refund: 'info',
    freeze: 'error',
    unfreeze: 'success',
    points_exchange: 'primary',
    mining_purchase: 'warning'
  }
}

// 类型定义
export type RewardType = typeof RewardsConfig.TYPES[keyof typeof RewardsConfig.TYPES]
export type EarningsType = typeof RewardsConfig.EARNINGS_TYPES[keyof typeof RewardsConfig.EARNINGS_TYPES]

// 工具函数
export const getRewardDescription = (type: RewardType, ...args: any[]) => {
  const template = RewardsConfig.DESCRIPTIONS[type as keyof typeof RewardsConfig.DESCRIPTIONS]
  return template ? (template as any)(...args) : type
}

export const getRewardIcon = (type: RewardType) => {
  return RewardsConfig.ICONS[type as keyof typeof RewardsConfig.ICONS] || '💰'
}

export const getRewardColor = (type: RewardType) => {
  return RewardsConfig.COLORS[type as keyof typeof RewardsConfig.COLORS] || 'neutral'
}







