/**
 * UserController - 用户控制器
 * 处理用户相关的所有接口
 */

import { BaseController, type ApiResponse } from './BaseController'
import { UserRepository } from '@/repositories'
import { WalletManager } from '@/wallet'
import { BinaryConfig } from '@/config'
import { generateInviteCode } from '@/utils'
import type { User, UserPublic } from '@/entities'

export class UserController extends BaseController {
  /**
   * 获取用户信息
   */
  static async getProfile(userId: string): Promise<ApiResponse<User>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })
      return await UserRepository.findById(userId)
    })
  }

  /**
   * 更新用户信息
   */
  static async updateProfile(
    userId: string,
    updates: {
      username?: string
      auto_reinvest?: boolean
    }
  ): Promise<ApiResponse<User>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })

      // 如果更新用户名，需要验证
      if (updates.username) {
        this.validateUsername(updates.username)

        // 检查用户名是否已存在
        const exists = await UserRepository.usernameExists(updates.username)
        if (exists) {
          throw new Error('用户名已存在')
        }
      }

      return await UserRepository.update(userId, updates)
    })
  }

  /**
   * 获取用户余额
   */
  static async getBalance(userId: string): Promise<ApiResponse<{
    u_balance: number
    points_balance: number
    mining_points: number
    transfer_points: number
    frozen_balance: number
  }>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })
      return await WalletManager.getBalance(userId)
    })
  }

  /**
   * 订阅代理
   */
  static async subscribeAgent(userId: string): Promise<ApiResponse<User>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })

      // 1. 检查是否已经是代理
      const user = await UserRepository.findById(userId)
      if (user.is_agent) {
        throw new Error('您已经是代理了')
      }

      // 2. 扣除费用（自动验证余额+记录流水）
      await WalletManager.deduct(
        userId,
        BinaryConfig.JOIN_FEE,
        'agent_fee',
        '订阅代理'
      )

      // 3. 生成邀请码（如果没有）
      let inviteCode = user.invite_code
      if (!inviteCode) {
        inviteCode = generateInviteCode()
        // 确保邀请码唯一
        while (await UserRepository.inviteCodeExists(inviteCode)) {
          inviteCode = generateInviteCode()
        }
      }

      // 4. 更新代理状态
      return await UserRepository.update(userId, {
        is_agent: true,
        invite_code: inviteCode,
        agent_paid_at: new Date().toISOString()
      })
    })
  }

  /**
   * 获取直推列表
   */
  static async getDirectReferrals(userId: string): Promise<ApiResponse<UserPublic[]>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })
      
      const referrals = await UserRepository.getDirectReferrals(userId)
      
      // 移除敏感字段
      return referrals.map(user => {
        const { password_hash, ...publicUser } = user
        return publicUser
      })
    })
  }

  /**
   * 根据邀请码查找用户
   */
  static async findByInviteCode(inviteCode: string): Promise<ApiResponse<UserPublic | null>> {
    return this.handleRequest(async () => {
      this.validateRequired({ inviteCode })
      this.validateInviteCode(inviteCode)

      const user = await UserRepository.findByInviteCode(inviteCode)
      if (!user) {
        return null
      }

      // 移除敏感字段
      const { password_hash, ...publicUser } = user
      return publicUser
    })
  }

  /**
   * 检查用户名是否可用
   */
  static async checkUsername(username: string): Promise<ApiResponse<{
    available: boolean
  }>> {
    return this.handleRequest(async () => {
      this.validateRequired({ username })
      this.validateUsername(username)

      const exists = await UserRepository.usernameExists(username)
      return { available: !exists }
    })
  }

  /**
   * 获取团队统计
   */
  static async getTeamStats(userId: string): Promise<ApiResponse<{
    direct_count: number
    a_side_sales: number
    b_side_sales: number
    total_earnings: number
  }>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId })

      const user = await UserRepository.findById(userId)
      
      return {
        direct_count: user.direct_referral_count,
        a_side_sales: user.a_side_sales,
        b_side_sales: user.b_side_sales,
        total_earnings: user.total_earnings
      }
    })
  }

  /**
   * 设置自动复投
   */
  static async setAutoReinvest(
    userId: string,
    enabled: boolean
  ): Promise<ApiResponse<User>> {
    return this.handleRequest(async () => {
      this.validateRequired({ userId, enabled })

      return await UserRepository.update(userId, {
        auto_reinvest: enabled
      })
    })
  }

  /**
   * 获取用户统计（管理员）
   */
  static async getUserStats(adminUser: any): Promise<ApiResponse<{
    total_users: number
    total_agents: number
  }>> {
    return this.handleRequest(async () => {
      // 检查管理员权限
      this.checkAdminPermission(adminUser.id, adminUser)

      const total_users = await UserRepository.getTotalCount()
      const total_agents = await UserRepository.getAgentCount()

      return {
        total_users,
        total_agents
      }
    })
  }
}














