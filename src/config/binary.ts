/**
 * 双轨制二元系统配置 V3.0
 * 更新日期：2025-10-07
 * 核心：AI自动排线 + 1:1对碰 + 8代平级奖 + 分红
 */

export const BinaryConfig = {
  // ========== 加入费用 ==========
  JOIN_FEE: 30,                    // 入单费用30U
  
  // ========== 对碰奖励（配对奖励）==========
  PAIRING: {
    BONUS_PER_PAIR: 7,             // 每单对碰奖励7U
    MEMBER_RATIO: 0.85,            // 85%自动到账会员
    MEMBER_AMOUNT: 5.95,           // 会员实际获得：7U × 85% = 5.95U
    PLATFORM_RATIO: 0.15,          // 15%平台分红池
    RATIO: '1:1',                  // 对碰比例1:1（严格配对）
    NO_LIMIT: true,                // 不封顶
    NO_RESET: true,                // 不归零
    INSTANT_SETTLEMENT: true       // 秒结算
  },
  
  // ========== 平级奖（向上奖励）==========
  LEVEL_BONUS: {
    AMOUNT: 2,                     // 每次平级奖2U
    DEPTH: 8,                      // 追溯8代直推链（串糖葫芦式）
    UNLOCK_CONDITION: 2,           // 直推≥2人解锁伞下平级奖
    TRIGGER_ON_PAIRING: true,      // 下线触发对碰奖时触发
    MAX_RECIPIENTS: 8              // 最多8个人获得（8代）
  },
  
  // ========== 自动排线（AI智能）==========
  AUTO_PLACEMENT: {
    ENABLED: true,                 // 启用自动排线
    WEAK_SIDE_PRIORITY: true,      // 弱区优先填补
    BALANCE_RATIO: '1:1',          // 保持1:1平衡
    SIDES: ['A', 'B'],             // A区和B区
    MAX_DEPTH: 100,                // 最大深度
    AUTO_BALANCE: true             // 自动平衡强弱区
  },
  
  // ========== 复投机制 ==========
  REINVEST: {
    THRESHOLD: 300,                // 总收益达到300U提示复投
    AMOUNT: 30,                    // 复投金额30U
    AUTO_AVAILABLE: true,          // 支持自动复投
    FREEZE_TRANSFER_IF_NOT: true,  // 不复投无法互转
    CONTINUE_AFTER: true           // 复投后继续累积计算
  },
  
  // ========== 分红结算 ==========
  DIVIDEND: {
    CONDITION: 10,                 // 直推≥10人获得排线分红
    RATIO: 0.15,                   // 15%分红比例
    SETTLEMENT_DAYS: [1, 3, 5, 0], // 每周一、三、五、日结算
    TIME: '00:00',                 // 结算时间
    POOL_SOURCE: 'pairing_platform' // 分红池来源：对碰奖的15%
  },
  
  // ========== 解锁条件 ==========
  UNLOCK: {
    MIN_DIRECT_REFERRALS: 2,       // 最少直推2人解锁平级奖
    WITHOUT_UNLOCK: {
      LEVEL_BONUS: false           // 直推<2人不触发平级奖
    }
  },
  
  // ========== 二元结构 ==========
  BINARY_TREE: {
    CALCULATION_UNIT: 'order',     // 按单量计算（不看金额）
    PAIRING_RULE: '1:1',           // 1比1对碰
    AUTO_DEDUCT: true,             // 对碰完自动结转
    KEEP_REMAINING: true           // 未结算业绩保留
  },
  
  // ========== 奖励结算 ==========
  SETTLEMENT: {
    PAIRING_INSTANT: true,         // 对碰奖秒结算
    LEVEL_INSTANT: true,           // 平级奖秒结算
    DIVIDEND_SCHEDULED: true       // 分红按计划结算
  }
}

// 便捷访问
export const { 
  JOIN_FEE,
  PAIRING,
  LEVEL_BONUS,
  AUTO_PLACEMENT,
  REINVEST,
  DIVIDEND 
} = BinaryConfig

// 类型定义
export type BinarySide = 'A' | 'B'
export type BinaryStatus = 'active' | 'frozen' | 'reinvest_required'

// 计算辅助函数
export const calculatePairingBonus = (pairs: number) => {
  return pairs * PAIRING.BONUS_PER_PAIR * PAIRING.MEMBER_RATIO
}

export const calculateLevelBonus = (recipients: number) => {
  return Math.min(recipients, LEVEL_BONUS.MAX_RECIPIENTS) * LEVEL_BONUS.AMOUNT
}


