/**
 * Calculator - 计算工具
 */

import { BinaryConfig, MiningConfig, WithdrawalConfig } from '@/config'

/**
 * 计算对碰次数
 */
export function calculatePairingTimes(aSideSales: number, bSideSales: number): number {
  const minSide = Math.min(aSideSales, bSideSales)
  const maxSide = Math.max(aSideSales, bSideSales)
  
  // 检查是否满足2:1或1:2比例
  if (maxSide < minSide * BinaryConfig.PAIRING_RATIO.MIN) {
    return 0
  }
  
  // 计算对碰次数（每单30U）
  return Math.floor(minSide / BinaryConfig.PAIRING_UNIT)
}

/**
 * 计算对碰奖励
 */
export function calculatePairingBonus(pairs: number): number {
  return pairs * BinaryConfig.PAIRING_BONUS
}

/**
 * 计算平级奖励
 */
export function calculateLevelBonus(pairs: number): number {
  return pairs * BinaryConfig.LEVEL_BONUS
}

/**
 * 计算矿机加速比例
 */
export function calculateMiningBoost(directReferrals: number): number {
  const boost = directReferrals * MiningConfig.BOOST.PER_REFERRAL
  return Math.min(boost, MiningConfig.BOOST.MAX)
}

/**
 * 计算矿机每日产出（含加速）
 */
export function calculateDailyOutput(baseOutput: number, boostRate: number): number {
  return baseOutput * (1 + boostRate)
}

/**
 * 计算提现手续费
 */
export function calculateWithdrawalFee(amount: number): number {
  const fee = amount * WithdrawalConfig.FEE_RATE
  return Math.max(fee, WithdrawalConfig.MIN_FEE)
}

/**
 * 计算提现总额（含手续费）
 */
export function calculateWithdrawalTotal(amount: number): number {
  return amount + calculateWithdrawalFee(amount)
}

/**
 * 计算复利
 * @param principal 本金
 * @param rate 利率
 * @param times 次数
 */
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  times: number
): number {
  return principal * Math.pow(1 + rate, times)
}

/**
 * 计算百分比
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0
  return (part / total) * 100
}

/**
 * 计算增长率
 */
export function calculateGrowthRate(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0
  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * 计算平均值
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}

/**
 * 保留小数位
 */
export function round(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * 向下取整到指定小数位
 */
export function floor(value: number, decimals: number = 2): number {
  return Math.floor(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * 向上取整到指定小数位
 */
export function ceil(value: number, decimals: number = 2): number {
  return Math.ceil(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * 安全的加法（避免浮点数精度问题）
 */
export function safeAdd(a: number, b: number): number {
  return round(a + b)
}

/**
 * 安全的减法
 */
export function safeSubtract(a: number, b: number): number {
  return round(a - b)
}

/**
 * 安全的乘法
 */
export function safeMultiply(a: number, b: number): number {
  return round(a * b)
}

/**
 * 安全的除法
 */
export function safeDivide(a: number, b: number): number {
  if (b === 0) return 0
  return round(a / b)
}








