/**
 * BaseController - 基础控制器
 * 所有Controller继承此类
 */

import { Validator } from '@/utils'
import type { RewardType } from '@/config'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

export class BaseController {
  /**
   * 成功响应
   */
  protected static success<T>(data?: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message
    }
  }

  /**
   * 错误响应
   */
  protected static error(error: string, code?: string): ApiResponse {
    return {
      success: false,
      error,
      code
    }
  }

  /**
   * 验证必填参数
   */
  protected static validateRequired(params: Record<string, any>): void {
    const fields = Object.keys(params)
    Validator.requiredFields(params, fields)
  }

  /**
   * 验证数值范围
   */
  protected static validateRange(
    value: number,
    fieldName: string,
    min: number,
    max: number
  ): void {
    Validator.range(value, fieldName, min, max)
  }

  /**
   * 验证正数
   */
  protected static validatePositive(value: number, fieldName: string): void {
    Validator.positive(value, fieldName)
  }

  /**
   * 验证用户名
   */
  protected static validateUsername(username: string): void {
    Validator.username(username)
  }

  /**
   * 验证密码
   */
  protected static validatePassword(password: string): void {
    Validator.password(password)
  }

  /**
   * 验证邀请码
   */
  protected static validateInviteCode(inviteCode: string): void {
    Validator.inviteCode(inviteCode)
  }

  /**
   * 验证钱包地址
   */
  protected static validateWalletAddress(address: string): void {
    Validator.walletAddress(address)
  }

  /**
   * 统一错误处理
   */
  protected static async handleRequest<T>(
    handler: () => Promise<T>
  ): Promise<ApiResponse<T>> {
    try {
      const data = await handler()
      return this.success(data)
    } catch (error) {
      console.error('Controller Error:', error)
      
      if (error instanceof Error) {
        return this.error(error.message, (error as any).code)
      }
      
      return this.error('未知错误')
    }
  }

  /**
   * 权限检查：是否是管理员
   */
  protected static checkAdminPermission(userId: string, user: any): void {
    if (!user?.is_admin) {
      throw new Error('需要管理员权限')
    }
  }

  /**
   * 权限检查：是否是代理
   */
  protected static checkAgentPermission(userId: string, user: any): void {
    if (!user?.is_agent) {
      throw new Error('需要代理权限')
    }
  }

  /**
   * 权限检查：是否是本人或管理员
   */
  protected static checkSelfOrAdmin(
    currentUserId: string,
    targetUserId: string,
    user: any
  ): void {
    if (currentUserId !== targetUserId && !user?.is_admin) {
      throw new Error('没有操作权限')
    }
  }
}









































