/**
 * 提现系统配置
 */

export const WithdrawalConfig = {
  // ========== 提现限制 ==========
  MIN_AMOUNT: 20,              // 最低提现金额
  MAX_AMOUNT: 100000,          // 最高提现金额
  
  // ========== 手续费 ==========
  FEE_RATE: 0.05,              // 5%手续费
  MIN_FEE: 1,                  // 最低手续费1U
  
  // ========== 提现状态 ==========
  STATUS: {
    PENDING: 'pending',        // 待审核
    APPROVED: 'approved',      // 已通过
    REJECTED: 'rejected',      // 已拒绝
    PROCESSING: 'processing',  // 处理中
    COMPLETED: 'completed'     // 已完成
  },
  
  // ========== 提现限制 ==========
  LIMITS: {
    DAILY_COUNT: 3,            // 每天最多3次
    DAILY_AMOUNT: 10000,       // 每天最多10000U
    PENDING_COUNT: 1           // 最多1笔待审核
  },
  
  // ========== 钱包地址验证 ==========
  WALLET: {
    TYPE: 'TRC20',
    ADDRESS_LENGTH: 34,
    ADDRESS_PREFIX: 'T'
  },
  
  // ========== 审核时间 ==========
  REVIEW: {
    AUTO_APPROVE_ENABLED: false,  // 是否自动审核
    AUTO_APPROVE_THRESHOLD: 100,  // 自动审核阈值
    REVIEW_TIMEOUT: 24 * 60 * 60 * 1000  // 24小时超时
  }
}

// 类型定义
export type WithdrawalStatus = typeof WithdrawalConfig.STATUS[keyof typeof WithdrawalConfig.STATUS]

// 工具函数
export const calculateWithdrawalFee = (amount: number): number => {
  const fee = amount * WithdrawalConfig.FEE_RATE
  return Math.max(fee, WithdrawalConfig.MIN_FEE)
}

export const calculateTotalWithdrawal = (amount: number): number => {
  return amount + calculateWithdrawalFee(amount)
}

export const validateWithdrawalAmount = (amount: number): { valid: boolean; error?: string } => {
  if (amount < WithdrawalConfig.MIN_AMOUNT) {
    return { valid: false, error: `最低提现${WithdrawalConfig.MIN_AMOUNT}U` }
  }
  if (amount > WithdrawalConfig.MAX_AMOUNT) {
    return { valid: false, error: `最高提现${WithdrawalConfig.MAX_AMOUNT}U` }
  }
  return { valid: true }
}

export const validateWalletAddress = (address: string): boolean => {
  const { ADDRESS_PREFIX, ADDRESS_LENGTH } = WithdrawalConfig.WALLET
  return address.startsWith(ADDRESS_PREFIX) && address.length === ADDRESS_LENGTH
}































