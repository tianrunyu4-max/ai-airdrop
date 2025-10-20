/**
 * BaseService - 所有Service的基类
 * 提供统一的错误处理和响应格式
 */

import type { PostgrestError } from '@supabase/supabase-js'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class BaseService {
  /**
   * 统一处理Supabase请求
   * @param request Supabase查询Promise
   * @returns 标准化的响应格式
   */
  protected static async handleRequest<T>(
    request: Promise<{ data: T | null; error: PostgrestError | null }>
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await request

      if (error) {
        return {
          success: false,
          error: this.formatError(error)
        }
      }

      return {
        success: true,
        data: data as T
      }
    } catch (error) {
      console.error('API Request Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 格式化错误信息为用户友好的消息
   * @param error PostgrestError
   * @returns 用户友好的错误消息
   */
  protected static formatError(error: PostgrestError): string {
    // 数据不存在
    if (error.code === 'PGRST116') {
      return '数据不存在'
    }

    // 唯一约束冲突
    if (error.code === '23505') {
      if (error.message.includes('username')) {
        return '用户名已存在'
      }
      if (error.message.includes('invite_code')) {
        return '邀请码已存在'
      }
      return '数据已存在'
    }

    // 外键约束
    if (error.code === '23503') {
      return '关联数据不存在'
    }

    // 检查约束
    if (error.code === '23514') {
      if (error.message.includes('balance')) {
        return '余额不足'
      }
      return '数据验证失败'
    }

    // 权限错误
    if (error.code === '42501') {
      return '没有操作权限'
    }

    // 默认返回原始错误消息
    return error.message || '操作失败，请重试'
  }

  /**
   * 验证必填参数
   * @param params 参数对象
   * @param requiredFields 必填字段列表
   * @throws Error 如果有必填字段缺失
   */
  protected static validateRequired(
    params: Record<string, any>,
    requiredFields: string[]
  ): void {
    for (const field of requiredFields) {
      if (params[field] === undefined || params[field] === null || params[field] === '') {
        throw new Error(`缺少必填参数: ${field}`)
      }
    }
  }

  /**
   * 延迟执行（用于模拟网络延迟）
   * @param ms 毫秒数
   */
  protected static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
































