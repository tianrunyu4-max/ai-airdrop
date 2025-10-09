/**
 * UserService - 用户相关业务逻辑（重构版）
 * 使用新架构：Repository + Wallet
 */

import { BaseService, type ApiResponse } from './BaseService'
import { UserRepository } from '@/repositories'
import { WalletManager } from '@/wallet'
import { BinaryConfig } from '@/config'
import { generateInviteCode } from '@/utils'
import type { User } from '@/types'

export class UserService extends BaseService {
  /**
   * 获取用户信息
   */
  static async getProfile(userId: string): Promise<ApiResponse<User>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      const user = await UserRepository.findById(userId)
      return { success: true, data: user }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 更新用户信息
   */
  static async updateProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<ApiResponse<User>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      const user = await UserRepository.update(userId, updates)
      return { success: true, data: user }
    } catch (error) {
      return this.handleError(error)
    }
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
    this.validateRequired({ userId }, ['userId'])

    try {
      const balance = await WalletManager.getBalance(userId)
      return { success: true, data: balance }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 订阅代理（使用新架构）
   */
  static async subscribeAgent(userId: string): Promise<ApiResponse<User>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      // 1. 检查是否已经是代理
      const user = await UserRepository.findById(userId)
      if (user.is_agent) {
        return {
          success: false,
          error: '您已经是代理了'
        }
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
      const updatedUser = await UserRepository.update(userId, {
        is_agent: true,
        invite_code: inviteCode,
        agent_paid_at: new Date().toISOString()
      })

      return { 
        success: true, 
        data: updatedUser,
        message: '订阅成功'
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取用户的直推列表
   */
  static async getDirectReferrals(userId: string): Promise<ApiResponse<User[]>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      const referrals = await UserRepository.getDirectReferrals(userId)
      return { success: true, data: referrals }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取用户的团队统计
   */
  static async getTeamStats(userId: string): Promise<ApiResponse<{
    direct_count: number
    a_side_sales: number
    b_side_sales: number
    total_earnings: number
  }>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      const user = await UserRepository.findById(userId)
      
      return {
        success: true,
        data: {
          direct_count: user.direct_referral_count,
          a_side_sales: user.a_side_sales,
          b_side_sales: user.b_side_sales,
          total_earnings: user.total_earnings
        }
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 根据用户名查找用户
   */
  static async findByUsername(username: string): Promise<ApiResponse<User | null>> {
    this.validateRequired({ username }, ['username'])

    try {
      const user = await UserRepository.findByUsername(username)
      return { success: true, data: user }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 根据邀请码查找用户
   */
  static async findByInviteCode(inviteCode: string): Promise<ApiResponse<User | null>> {
    this.validateRequired({ inviteCode }, ['inviteCode'])

    try {
      const user = await UserRepository.findByInviteCode(inviteCode)
      return { success: true, data: user }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 检查用户名是否可用
   */
  static async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const exists = await UserRepository.usernameExists(username)
      return !exists
    } catch (error) {
      return false
    }
  }

  /**
   * 错误处理辅助方法
   */
  private static handleError(error: any): ApiResponse {
    console.error('UserService Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '操作失败'
    }
  }
}
