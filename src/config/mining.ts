/**
 * AI学习卡系统配置 V4.0
 * 更新日期：2025-10-11
 * 核心变更：签到释放 + 2%基础 + 10倍出局 + 直推加速3% + 70%到账30%销毁
 */

export const AILearningConfig = {
  // ========== AI学习卡配置 ==========
  MACHINE: {
    NAME: 'AI学习卡',
    COST: 100,                    // 100积分
    COST_IN_U: 7,                 // 7U可兑换100积分
    EXIT_MULTIPLIER: 10,          // 10倍出局
    TOTAL_OUTPUT: 1000,           // 总产出1000积分（100×10）
    MAX_STACK: 10,                // 最多10张/人
    AUTO_GIFT: true,              // 成为AI代理自动送100积分
    FIRST_FREE: false             // 不再是第一次免费，而是成为代理自动送
  },
  
  // ========== 释放规则 ==========
  RELEASE: {
    BASE_RATE: 0.02,              // 基础释放率2%/天
    BOOST_PER_REFERRAL: 0.03,     // 每直推1个AI代理 +3%
    MAX_BOOST: 0.18,              // 最高加速18%（6个直推×3%）
    MAX_RATE: 0.20,               // 最高释放率20%（2%基础 + 18%加速）
    MAX_REFERRALS: 6,             // 最多计算6个直推（达到20%上限）
    REQUIRE_CHECKIN: true,        // 必须签到才释放
    TIME: '00:00',                // 每天00:00释放
    TIMEZONE: 'Asia/Shanghai'
  },
  
  // ========== 积分分配 ==========
  DISTRIBUTION: {
    TO_U_PERCENT: 0.70,           // 70%直接到账U余额
    TO_BURN_PERCENT: 0.30         // 30%自动销毁清0（不再是互转积分）
  },
  
  // ========== 复投规则（取消复利） ==========
  REINVEST: {
    ENABLED: true,                // 允许复投
    AFTER_EXIT: true,             // 出局后可复投
    COMPOUND_ENABLED: false,      // 取消复利滚存
    COMPOUND_MULTIPLIERS: [],     // 清空复利倍数
    COMPOUND_COST_FREE: false     // 不再有复利
  },
  
  // ========== 重启机制（防泡沫） ==========
  RESTART: {
    AUTO_ENABLED: true,           // 后端自动检测：总释放 > 新积分时自动重启
    MANUAL_ENABLED: true,         // 后端可手动重启
    CLEAR_ALL_POINTS: true,       // 重启时所有积分清0销毁
    CONTINUE_EXCHANGE: true,      // 重启后可继续兑换和释放
    PREVENT_BUBBLE: true          // 防止泡沫过大
  },
  
  // ========== 签到机制 ==========
  CHECKIN: {
    REQUIRED: true,               // 必须签到才释放
    DAILY_LIMIT: 1,               // 每天签到1次
    RESET_TIME: '00:00'           // 每天00:00重置
  },
  
  // ========== 状态 ==========
  STATUS: {
    ACTIVE: 'active',             // 学习中（已签到）
    EXITED: 'exited',             // 已出局（10倍）
    INACTIVE: 'inactive',         // 未签到（暂停释放）
    RESTARTED: 'restarted'        // 已重启（积分清0）
  }
}

// 兼容旧代码（保留MiningConfig导出）
export const MiningConfig = {
  TYPES: {
    type1: {
      id: 1,
      name: 'AI学习机',
      cost: AILearningConfig.MACHINE.COST,
      multiplier: AILearningConfig.MACHINE.EXIT_MULTIPLIER
    }
  },
  BASE_RELEASE_RATE: AILearningConfig.RELEASE.BASE_RATE,
  BOOST_PER_REFERRAL: AILearningConfig.RELEASE.BOOST_PER_REFERRAL,
  MAX_BOOST_RATE: AILearningConfig.RELEASE.MAX_BOOST,
  POINTS_TO_U_RATE: AILearningConfig.MACHINE.COST_IN_U / AILearningConfig.MACHINE.COST,
  U_PERCENTAGE: AILearningConfig.DISTRIBUTION.TO_U_PERCENT,
  POINTS_PERCENTAGE: AILearningConfig.DISTRIBUTION.TO_TRANSFER_PERCENT,
  MAX_MACHINES_PER_USER: AILearningConfig.MACHINE.MAX_STACK,
  FIRST_FREE: AILearningConfig.MACHINE.FIRST_FREE,
  EXIT_MULTIPLIER: AILearningConfig.MACHINE.EXIT_MULTIPLIER,
  COMPOUND_ENABLED: AILearningConfig.REINVEST.COMPOUND_ENABLED,
  COMPOUND_MULTIPLIERS: AILearningConfig.REINVEST.COMPOUND_MULTIPLIERS
}

// 导出类型定义
export type AILearningStatus = typeof AILearningConfig.STATUS[keyof typeof AILearningConfig.STATUS]

// 兼容旧类型
export type MiningType = 'type1'
export type MiningStatus = AILearningStatus

// 便捷访问
export const getAILearningConfig = () => {
  return AILearningConfig.MACHINE
}

