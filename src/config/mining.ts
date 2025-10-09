/**
 * AI学习机系统配置 V3.0
 * 更新日期：2025-10-07
 * 核心变更：5%释放率 + 2倍出局 + 70%U/30%互转 + 复利滚存机制
 */

export const AILearningConfig = {
  // ========== AI学习机配置 ==========
  MACHINE: {
    NAME: 'AI学习机',
    COST: 100,                    // 100积分（7U）
    COST_IN_U: 7,                 // 等于7U
    EXIT_MULTIPLIER: 2,           // 2倍出局（从10倍改为2倍）
    TOTAL_OUTPUT: 200,            // 总产出200积分（100×2）
    MAX_STACK: 10,                // 最多10台/人
    FIRST_FREE: true              // 第一次免费送
  },
  
  // ========== 释放规则 ==========
  RELEASE: {
    BASE_RATE: 0.10,              // 基础释放率10%/天（2倍出局，20天完成）
    BOOST_PER_REFERRAL: 0,        // 不再使用直推加速（新逻辑取消加速）
    MAX_BOOST: 0,                 // 不再加速
    MAX_REFERRALS: 0,             // 不再加速
    TIME: '00:00',                // 每天00:00释放
    TIMEZONE: 'Asia/Shanghai'
  },
  
  // ========== 积分分配 ==========
  DISTRIBUTION: {
    TO_U_PERCENT: 0.70,           // 70%兑换U（从80%改为70%）
    TO_TRANSFER_PERCENT: 0.30     // 30%互转积分（从20%改为30%）
  },
  
  // ========== 复投/复利规则 ==========
  REINVEST: {
    ENABLED: true,                // 允许复投
    AFTER_EXIT: true,             // 出局后可复投
    COMPOUND_ENABLED: true,       // 允许复利滚存
    COMPOUND_MULTIPLIERS: [2, 4, 8, 16, 32, 64, 128, 256], // 复利倍数阶梯：2倍→4倍→8倍→16倍...
    COMPOUND_COST_FREE: true      // 复利滚存免费（无需额外支付）
  },
  
  // ========== 重启机制 ==========
  RESTART: {
    AUTO_ENABLED: true,           // 是否开启自动重启
    MANUAL_ENABLED: true,         // 是否允许手动重启
    CLEAR_ALL_POINTS: true,       // 重启时所有积分清0销毁
    EXIT_MULTIPLIER: 2,           // 重启后继续2倍出局
    QUEUE_ENABLED: true,          // 排队等待机制
    CONTINUE_LEARNING: true       // 继续学习拿积分
  },
  
  // ========== 状态 ==========
  STATUS: {
    ACTIVE: 'active',             // 学习中
    EXITED: 'exited',             // 已出局
    RESTARTED: 'restarted',       // 已重启
    QUEUED: 'queued',             // 排队中
    COMPOUNDING: 'compounding'    // 复利滚存中
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

