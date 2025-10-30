/**
 * 双轨制二元系统配置 V5.0 简化版
 * 更新日期：2025-10-15
 * 核心：团队内部排线 + 2:1/1:2对碰 + 定时结算 + 复购补弱区
 * 
 * ✨ V5.0重大升级（简化版）：
 * 1. 自动排线：取消全局弱区优先 → 改为团队内部滑落（直推下面按弱边排）
 * 2. 对碰结算：取消即时结算 → 改为每天凌晨12点统一结算
 * 3. 奖励机制：删除平级奖、删除贡献奖、删除分红池 → 只保留对碰奖
 * 4. 对碰奖分配：85%给会员，15%预留（暂不分配）
 * 5. 复投机制：200U复投 → 改为240U（8倍）复投，复购单自动补弱区
 */

export const BinaryConfig = {
  // ========== 加入费用 ==========
  JOIN_FEE: 100,                   // 入单费用100
  
  // ========== 对碰奖励（配对奖励）V5.0 ==========
  PAIRING: {
    BONUS_PER_PAIR: 10,            // 每单对碰奖励10
    MEMBER_RATIO: 0.8,             // 80%封顶到账会员
    MEMBER_AMOUNT: 8,              // 会员实际获得：10 × 80% = 8
    RESERVED_RATIO: 0.2,           // 20%预留
    RATIO: '2:1_OR_1:2',           // 对碰比例2:1或1:2（灵活配对）
    REQUIRED_UNITS: {
      TWO_ONE: { A: 2, B: 1 },     // 2:1 配对所需单量
      ONE_TWO: { A: 1, B: 2 }      // 1:2 配对所需单量
    },
    SLIDE_ENABLED: true,           // 启用滑落机制
    NO_RESET: true,                // 不归零
    SCHEDULED_SETTLEMENT: true,    // ✨ V5.0：定时结算（每天凌晨12点）
    SETTLEMENT_TIME: '00:00'       // 结算时间：凌晨12点
  },
  
  // ========== 见单奖（直推链5代重复拿）V5.1 ==========
  SPOT_BONUS: {
    ENABLED: true,                 // 启用见单奖
    AMOUNT: 5,                     // 每对5
    DEPTH: 5,                      // 5代直推链
    UNLOCK_CONDITION: 2,           // 直推≥2人才能拿见单奖
    TRIGGER_ON_PAIRING: true,      // 下线对碰时触发
    RECURSIVE: true                // 重复拿（5代都拿）
  },
  
  
  // ========== 自动排线（AI智能）V5.0 ==========
  AUTO_PLACEMENT: {
    ENABLED: true,                 // 启用自动排线
    STRATEGY: 'TEAM_INTERNAL',     // ✨ V5.0：团队内部滑落（取消弱区优先）
    SLIDE_TO_DIRECT_REFERRAL: true,// 滑落到直推下面（而非全局弱区）
    WEAK_SIDE_PRIORITY: true,      // 在直推下面选择弱边
    BALANCE_RATIO: '1:1',          // 保持直推下面左右平衡
    SIDES: ['A', 'B'],             // A区和B区
    MAX_DEPTH: 100                 // 最大深度
  },
  
  // ========== 复投机制 V5.0 ==========
  REINVEST: {
    THRESHOLD: 240,                // ✨ V5.0：总收益达到240（8倍）提示复投
    AMOUNT: 100,                   // 复投金额100
    AUTO_AVAILABLE: true,          // 支持自动复投
    FREEZE_TRANSFER_IF_NOT: true,  // 不复投无法互转
    CONTINUE_AFTER: true,          // 复投后继续累积计算
    SLIDE_MECHANISM: true,         // 启用滑落机制
    ADD_TO_WEAK_SIDE: true         // ✨ V5.0：复购单自动添加到弱区pending
  },
  
  // ========== 分红结算 V5.0 ==========
  DIVIDEND: {
    ENABLED: false,                // ✨ V5.0：删除分红机制
    CONDITION: 10,                 // 直推≥10人获得排线分红（已废弃）
    RATIO: 0.15,                   // 15%分红比例（已废弃）
    SETTLEMENT_DAYS: [1, 3, 5, 0], // 每周一、三、五、日结算（已废弃）
    TIME: '00:00',                 // 结算时间（已废弃）
    POOL_SOURCE: 'pairing_platform' // 分红池来源（已废弃）
  },
  
  // ========== 解锁条件 V5.0 ==========
  UNLOCK: {
    MIN_DIRECT_REFERRALS: 2,       // 最少直推2人
    MAX_FREE_PAIRINGS: 10,         // 直推<2人最多对碰10次
    WITHOUT_UNLOCK: {
      PAIRING_LIMIT: 10            // 未解锁时对碰次数限制
    }
  },
  
  // ========== 二元结构 ==========
  BINARY_TREE: {
    CALCULATION_UNIT: 'order',     // 按单量计算（不看金额）
    PAIRING_RULE: '2:1_OR_1:2',    // 对碰比例：2:1或1:2（灵活配对）
    AUTO_DEDUCT: true,             // 对碰完自动结转
    KEEP_REMAINING: true           // 未结算业绩保留
  },
  
  // ========== 奖励结算 V5.0 ==========
  SETTLEMENT: {
    PAIRING_SCHEDULED: true,       // ✨ V5.0：对碰奖定时结算（每天凌晨12点）
    PAIRING_TIME: '00:00',         // 对碰结算时间
    LEVEL_BONUS_ENABLED: false,    // 平级奖已删除
    CONTRIBUTION_ENABLED: false,   // 贡献奖已删除
    DIVIDEND_ENABLED: false        // 分红已删除
  }
}

// 便捷访问
export const { 
  JOIN_FEE,
  PAIRING,
  SPOT_BONUS,
  AUTO_PLACEMENT,
  REINVEST,
  DIVIDEND,
  UNLOCK,
  SETTLEMENT
} = BinaryConfig

// 类型定义
export type BinarySide = 'A' | 'B'
export type BinaryStatus = 'active' | 'frozen' | 'reinvest_required'

// 计算辅助函数
export const calculatePairingBonus = (pairs: number) => {
  return pairs * PAIRING.BONUS_PER_PAIR * PAIRING.MEMBER_RATIO
}

/**
 * 计算对碰奖中的预留金额
 * @param pairs 对碰组数
 * @returns 预留金额（15%）
 */
export const calculateReservedAmount = (pairs: number): number => {
  return pairs * PAIRING.BONUS_PER_PAIR * PAIRING.RESERVED_RATIO
}

export const calculatePairingReadyCounts = (aPending: number, bPending: number): {
  pairsToSettle: number
  pairingType: '2:1' | '1:2'
} | null => {
  const required = BinaryConfig.PAIRING.REQUIRED_UNITS

  const canTwoOne = aPending >= required.TWO_ONE.A && bPending >= required.TWO_ONE.B
  if (canTwoOne) {
    const pairs = Math.min(
      Math.floor(aPending / required.TWO_ONE.A),
      Math.floor(bPending / required.TWO_ONE.B)
    )
    if (pairs > 0) {
      return {
        pairsToSettle: pairs,
        pairingType: '2:1'
      }
    }
  }

  const canOneTwo = aPending >= required.ONE_TWO.A && bPending >= required.ONE_TWO.B
  if (canOneTwo) {
    const pairs = Math.min(
      Math.floor(aPending / required.ONE_TWO.A),
      Math.floor(bPending / required.ONE_TWO.B)
    )
    if (pairs > 0) {
      return {
        pairsToSettle: pairs,
        pairingType: '1:2'
      }
    }
  }

  return null
}


