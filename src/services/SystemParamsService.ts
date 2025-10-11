/**
 * SystemParamsService - 系统参数配置服务
 * 
 * 功能：
 * 1. 读取所有可配置的系统参数
 * 2. 支持热更新（无需重启）
 * 3. 管理员可通过后台修改
 */

import { BaseService, type ApiResponse } from './BaseService'
import { supabase } from '@/lib/supabase'

export interface SystemParam {
  id: number
  category: string
  param_key: string
  param_value: number
  param_unit?: string
  description?: string
  min_value?: number
  max_value?: number
  updated_at: string
  updated_by?: string
}

export class SystemParamsService extends BaseService {
  // 参数缓存（减少数据库查询）
  private static cache: Map<string, SystemParam> = new Map()
  private static cacheExpiry: number = 0
  private static CACHE_TTL = 60000 // 缓存1分钟

  /**
   * 获取所有系统参数
   */
  static async getAllParams(): Promise<ApiResponse<SystemParam[]>> {
    try {
      const { data, error } = await supabase
        .from('system_params')
        .select('*')
        .order('category, param_key')

      if (error) throw error

      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 按分类获取参数
   */
  static async getParamsByCategory(category: string): Promise<ApiResponse<SystemParam[]>> {
    try {
      const { data, error } = await supabase
        .from('system_params')
        .select('*')
        .eq('category', category)
        .order('param_key')

      if (error) throw error

      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取单个参数值（带缓存）
   */
  static async getParam(paramKey: string): Promise<number> {
    const now = Date.now()

    // 检查缓存
    if (now < this.cacheExpiry && this.cache.has(paramKey)) {
      return this.cache.get(paramKey)!.param_value
    }

    // 缓存过期，重新加载
    await this.refreshCache()

    const param = this.cache.get(paramKey)
    if (!param) {
      console.warn(`⚠️ 参数${paramKey}不存在，使用默认值0`)
      return 0
    }

    return param.param_value
  }

  /**
   * 刷新缓存
   */
  private static async refreshCache(): Promise<void> {
    try {
      const { data } = await supabase
        .from('system_params')
        .select('*')

      if (data) {
        this.cache.clear()
        data.forEach(param => {
          this.cache.set(param.param_key, param)
        })
        this.cacheExpiry = Date.now() + this.CACHE_TTL
        console.log(`✅ 系统参数缓存已刷新（${data.length}个参数）`)
      }
    } catch (error) {
      console.error('刷新参数缓存失败:', error)
    }
  }

  /**
   * 更新参数值
   */
  static async updateParam(
    paramKey: string,
    newValue: number,
    updatedBy: string
  ): Promise<ApiResponse<SystemParam>> {
    this.validateRequired({ paramKey, newValue, updatedBy }, ['paramKey', 'newValue', 'updatedBy'])

    try {
      // 1. 检查参数是否存在
      const { data: existing } = await supabase
        .from('system_params')
        .select('*')
        .eq('param_key', paramKey)
        .single()

      if (!existing) {
        return { success: false, error: '参数不存在' }
      }

      // 2. 验证范围
      if (existing.min_value !== null && newValue < existing.min_value) {
        return {
          success: false,
          error: `参数值不能小于${existing.min_value}${existing.param_unit || ''}`
        }
      }

      if (existing.max_value !== null && newValue > existing.max_value) {
        return {
          success: false,
          error: `参数值不能大于${existing.max_value}${existing.param_unit || ''}`
        }
      }

      // 3. 更新参数
      const { data, error } = await supabase
        .from('system_params')
        .update({
          param_value: newValue,
          updated_by: updatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('param_key', paramKey)
        .select()
        .single()

      if (error) throw error

      // 4. 清除缓存
      this.cache.delete(paramKey)
      this.cacheExpiry = 0

      console.log(`✅ 参数更新成功：${paramKey} = ${newValue}${existing.param_unit || ''}`)

      return {
        success: true,
        data,
        message: `参数更新成功：${existing.description || paramKey}`
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 批量更新参数
   */
  static async batchUpdateParams(
    updates: Array<{ paramKey: string; newValue: number }>,
    updatedBy: string
  ): Promise<ApiResponse<void>> {
    this.validateRequired({ updates, updatedBy }, ['updates', 'updatedBy'])

    try {
      const results = []

      for (const update of updates) {
        const result = await this.updateParam(update.paramKey, update.newValue, updatedBy)
        results.push(result)
      }

      const failedCount = results.filter(r => !r.success).length

      if (failedCount > 0) {
        return {
          success: false,
          error: `${failedCount}个参数更新失败`
        }
      }

      return {
        success: true,
        message: `成功更新${updates.length}个参数`
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 重置参数为默认值（危险操作）
   */
  static async resetToDefault(paramKey: string, updatedBy: string): Promise<ApiResponse<void>> {
    // 这里需要定义每个参数的默认值
    // 或者从初始SQL中读取
    return {
      success: false,
      error: '重置功能暂未实现'
    }
  }

  /**
   * 获取参数变更历史
   */
  static async getParamHistory(paramKey: string): Promise<ApiResponse<any[]>> {
    // 需要创建一个history表来记录变更
    return {
      success: false,
      error: '历史记录功能暂未实现'
    }
  }
}






