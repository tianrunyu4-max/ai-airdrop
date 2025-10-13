/**
 * BinaryController - 双区系统控制器
 * 处理自动排线、对碰奖、平级奖相关接口
 */

import { BaseController, type ApiResponse } from './BaseController'
import { BinaryRepository, UserRepository } from '@/repositories'
import { WalletManager } from '@/wallet'
import { BinaryConfig } from '@/config'
import { 
  calculatePairingTimes, 
  calculatePairingBonus, 
  calculateLevelBonus,
  generateInviteCode 
} from '@/utils'
import type { BinaryNode, TeamStats } from '@/entities'

export class BinaryController extends BaseController {
  /**
   * 加入双区系统
   */
  static async join(
    userId: string,
    inviterId: string
  ): Promise<ApiResponse<{
    node: BinaryNode
    inviteCode: string
  }>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId, inviterId })

      // 1. 检查是否已加入
      const hasJoined = await BinaryRepository.hasJoined(userId)
      if (hasJoined) {
        throw new Error('您已经加入过了')
      }

      // 2. 检查邀请人是否存在
      const inviter = await UserRepository.findById(inviterId)
      if (!inviter) {
        throw new Error('邀请人不存在')
      }

      // 3. 扣除加入费用
      await WalletManager.deduct(
        userId,
        BinaryConfig.JOIN_FEE,
        'agent_fee',
        '加入双区系统'
      )

      // 4. 生成邀请码
      let inviteCode = generateInviteCode()
      while (await UserRepository.inviteCodeExists(inviteCode)) {
        inviteCode = generateInviteCode()
      }
      await UserRepository.updateInviteCode(userId, inviteCode)

      // 5. 自动排线（简化实现，实际应在Service层）
      const placement = await this.autoPlacement(inviterId)

      // 6. 创建节点
      const node = await BinaryRepository.createNode({
        user_id: userId,
        parent_id: placement.parent_id,
        side: placement.side,
        level: placement.level,
        position: placement.position
      })

      // 7. 更新上级销售业绩
      await BinaryRepository.updateSales(
        placement.parent_id,
        placement.side,
        BinaryConfig.JOIN_FEE
      )

      // 8. 绑定上下级关系
      await UserRepository.updateInviter(userId, inviterId)
      await UserRepository.incrementDirectReferrals(inviterId)

      return { node, inviteCode }
    })
  }

  /**
   * 获取用户双区信息
   */
  static async getInfo(userId: string): Promise<ApiResponse<{
    node: BinaryNode | null
    stats: TeamStats
  }>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })

      const node = await BinaryRepository.getNode(userId)
      
      if (!node) {
        return {
          node: null,
          stats: {
            a_side_count: 0,
            b_side_count: 0,
            a_side_sales: 0,
            b_side_sales: 0,
            total_members: 0,
            max_depth: 0
          }
        }
      }

      const stats = await BinaryRepository.getTeamStats(userId)

      return { node, stats }
    })
  }

  /**
   * 手动触发对碰结算（测试用/管理员）
   */
  static async settlePairing(
    userId: string,
    adminUser?: any
  ): Promise<ApiResponse<{
    pairs: number
    pairingBonus: number
    levelBonus: number
  }>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })

      // 如果有adminUser，检查权限
      if (adminUser) {
        this.checkAdminPermission(adminUser.id, adminUser)
      }

      // 1. 获取A/B区销售业绩
      const sales = await BinaryRepository.getUserSales(userId)

      // 2. 计算对碰次数
      const pairs = calculatePairingTimes(sales.a_side_sales, sales.b_side_sales)

      if (pairs === 0) {
        return {
          pairs: 0,
          pairingBonus: 0,
          levelBonus: 0
        }
      }

      // 3. 发放对碰奖
      const pairingBonus = calculatePairingBonus(pairs)
      await WalletManager.add(
        userId,
        pairingBonus,
        'pairing_bonus',
        `对碰奖 ${pairs}次`
      )

      // 4. 更新总收益
      await UserRepository.incrementTotalEarnings(userId, pairingBonus)

      // 5. 触发平级奖
      let totalLevelBonus = 0
      const upline = await UserRepository.getUplineChain(userId, BinaryConfig.LEVEL_BONUS_DEPTH)

      for (const ancestor of upline) {
        // 检查是否解锁平级奖（直推≥2人）
        if (ancestor.direct_referral_count >= BinaryConfig.LEVEL_BONUS_UNLOCK) {
          const levelBonus = calculateLevelBonus(pairs)
          await WalletManager.add(
            ancestor.id,
            levelBonus,
            'level_bonus',
            `平级奖 来自用户${userId}`
          )
          await UserRepository.incrementTotalEarnings(ancestor.id, levelBonus)
          totalLevelBonus += levelBonus
        }
      }

      // 6. 检查是否需要复投
      await this.checkReinvestment(userId)

      return {
        pairs,
        pairingBonus,
        levelBonus: totalLevelBonus
      }
    })
  }

  /**
   * 获取有业绩的用户列表（管理员/定时任务用）
   */
  static async getUsersWithSales(adminUser?: any): Promise<ApiResponse<Array<{
    id: string
    a_side_sales: number
    b_side_sales: number
  }>>> {
    return this.handleRequest(async () => {
      // 如果有adminUser，检查权限
      if (adminUser) {
        this.checkAdminPermission(adminUser.id, adminUser)
      }

      return await BinaryRepository.getUsersWithSales()
    })
  }

  /**
   * 自动排线（私有方法）
   */
  private static async autoPlacement(inviterId: string): Promise<{
    parent_id: string
    side: 'A' | 'B'
    level: number
    position: string
  }> {
    // 1. 获取A/B区人数
    const aSideCount = await BinaryRepository.getTeamCount(inviterId, 'A')
    const bSideCount = await BinaryRepository.getTeamCount(inviterId, 'B')

    // 2. 确定弱区
    let weakSide: 'A' | 'B'
    if (aSideCount < bSideCount) {
      weakSide = 'A'
    } else if (bSideCount < aSideCount) {
      weakSide = 'B'
    } else {
      // 相等时，按5:1比例随机
      weakSide = Math.random() > 0.2 ? 'A' : 'B'
    }

    // 3. 在弱区找空位
    return await BinaryRepository.findEmptySlot(inviterId, weakSide)
  }

  /**
   * 检查是否需要复投（私有方法）
   */
  private static async checkReinvestment(userId: string): Promise<void> {
    const user = await UserRepository.findById(userId)

    // 每结算300U提示复投
    if (user.total_earnings >= BinaryConfig.REINVEST.THRESHOLD) {
      // 如果不复投，冻结账户
      if (BinaryConfig.REINVEST.FREEZE_IF_NOT) {
        await UserRepository.freezeAccount(userId, '需要复投')
      }

      // TODO: 发送通知到前端
      console.log(`用户${userId}需要复投`)
    }
  }
}














