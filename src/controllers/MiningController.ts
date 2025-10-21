/**
 * MiningController - 矿机控制器
 * 处理矿机购买、释放、统计
 */

import { BaseController, type ApiResponse } from './BaseController'
import { UserRepository } from '@/repositories'
import { WalletManager, BalanceValidator } from '@/wallet'
import { MiningConfig, getMiningType } from '@/config'
import { calculateMiningBoost, calculateDailyOutput } from '@/utils'

// 注意：实际应该从 @/repositories 导入 MiningRepository
// 这里简化处理
export class MiningController extends BaseController {
  /**
   * 购买矿机
   */
  static async purchase(params: {
    userId: string
    type: 1 | 2 | 3
  }): Promise<ApiResponse<{
    success: boolean
    message: string
    mining: any
  }>> {
    return this.handleRequest(async () => {
      const { userId, type } = params

      // 1. 参数验证
      this.validateRequired({ userId, type })

      if (![1, 2, 3].includes(type)) {
        throw new Error('矿机类型无效')
      }

      // 2. 获取矿机配置
      const miningType = getMiningType(type)
      if (!miningType) {
        throw new Error('矿机类型不存在')
      }

      // 3. 检查积分是否充足
      await BalanceValidator.checkPointsSufficient(userId, miningType.cost, 'mining')

      // 4. 获取用户信息（计算加速）
      const user = await UserRepository.findById(userId)
      const boostRate = calculateMiningBoost(user.direct_referral_count)

      // 5. 扣除积分
      await UserRepository.updatePoints(
        userId,
        user.points_balance - miningType.cost,
        user.mining_points - miningType.cost,
        user.transfer_points
      )

      // 6. 创建矿机记录
      // TODO: 实际应该调用 MiningRepository.create()
      const mining = {
        id: `mining_${Date.now()}`,
        user_id: userId,
        type,
        cost: miningType.cost,
        daily_output: miningType.dailyOutput,
        total_output: miningType.totalOutput,
        released_amount: 0,
        duration: miningType.duration,
        boost_rate: boostRate,
        status: 'active',
        started_at: new Date().toISOString()
      }

      return {
        success: true,
        message: '矿机购买成功',
        mining
      }
    })
  }

  /**
   * 获取用户矿机列表
   */
  static async getUserMinings(userId: string): Promise<ApiResponse<any[]>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })

      // TODO: 实际应该调用 MiningRepository.getUserMinings(userId)
      return []
    })
  }

  /**
   * 获取矿机详情
   */
  static async getDetail(miningId: string): Promise<ApiResponse<any>> {
    return this.handleRequest(async () => {
      this.validateRequired({ miningId })

      // TODO: 实际应该调用 MiningRepository.findById(miningId)
      return null
    })
  }

  /**
   * 手动释放矿机积分（测试用/管理员）
   */
  static async release(
    miningId: string,
    adminUser?: any
  ): Promise<ApiResponse<{
    released: number
    boost_rate: number
  }>> {
    return this.handleRequest(async () => {
      this.validateRequired({ miningId })

      // 如果有adminUser，检查权限
      if (adminUser) {
        this.checkAdminPermission(adminUser.id, adminUser)
      }

      // TODO: 实际应该实现真实的释放逻辑
      // 1. 获取矿机信息
      // 2. 计算今日应释放数量（含加速）
      // 3. 更新已释放数量
      // 4. 增加用户积分
      // 5. 记录释放记录

      return {
        released: 0,
        boost_rate: 0
      }
    })
  }

  /**
   * 获取矿机统计
   */
  static async getStats(userId: string): Promise<ApiResponse<{
    active_count: number
    total_cost: number
    total_output: number
    total_released: number
    today_output: number
  }>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })

      // TODO: 实际应该调用 MiningRepository.getStats(userId)
      return {
        active_count: 0,
        total_cost: 0,
        total_output: 0,
        total_released: 0,
        today_output: 0
      }
    })
  }

  /**
   * 获取所有运行中的矿机（定时任务用）
   */
  static async getActiveMinings(adminUser?: any): Promise<ApiResponse<any[]>> {
    return this.handleRequest(async () => {
      // 如果有adminUser，检查权限
      if (adminUser) {
        this.checkAdminPermission(adminUser.id, adminUser)
      }

      // TODO: 实际应该调用 MiningRepository.getActiveMinings()
      return []
    })
  }

  /**
   * 获取矿机类型配置
   */
  static getMiningTypes(): ApiResponse<typeof MiningConfig.TYPES> {
    return this.success(MiningConfig.TYPES)
  }

  /**
   * 计算购买矿机预览
   */
  static preview(params: {
    type: 1 | 2 | 3
    directReferrals: number
  }): ApiResponse<{
    type: any
    boost_rate: number
    daily_output_base: number
    daily_output_boosted: number
    total_output: number
    duration: number
    exit_multiplier: number
  }> {
    try {
      const { type, directReferrals } = params

      this.validateRequired({ type, directReferrals })

      const miningType = getMiningType(type)
      if (!miningType) {
        throw new Error('矿机类型不存在')
      }

      const boostRate = calculateMiningBoost(directReferrals)
      const dailyOutputBoosted = calculateDailyOutput(miningType.dailyOutput, boostRate)

      return this.success({
        type: miningType,
        boost_rate: boostRate,
        daily_output_base: miningType.dailyOutput,
        daily_output_boosted: dailyOutputBoosted,
        total_output: miningType.totalOutput,
        duration: miningType.duration,
        exit_multiplier: miningType.exitMultiplier
      })
    } catch (error) {
      return this.error(error instanceof Error ? error.message : '计算失败')
    }
  }
}



































