/**
 * BaseRepository - 基础仓储类
 * 所有Repository继承此类
 */

import { supabase } from '@/lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

export interface QueryResult<T> {
  data: T | null
  error: PostgrestError | null
}

export class BaseRepository {
  /**
   * 统一处理查询结果
   */
  protected static async handleQuery<T>(
    query: Promise<{ data: T | null; error: PostgrestError | null }>
  ): Promise<T> {
    const { data, error } = await query

    if (error) {
      console.error('Database Error:', error)
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('Data not found')
    }

    return data
  }

  /**
   * 统一处理查询结果（可为空）
   */
  protected static async handleQueryNullable<T>(
    query: Promise<{ data: T | null; error: PostgrestError | null }>
  ): Promise<T | null> {
    const { data, error } = await query

    if (error) {
      console.error('Database Error:', error)
      throw new Error(error.message)
    }

    return data
  }

  /**
   * 批量插入
   */
  protected static async batchInsert<T>(
    table: string,
    records: Partial<T>[]
  ): Promise<T[]> {
    return this.handleQuery(
      supabase.from(table).insert(records).select()
    )
  }

  /**
   * 批量更新
   */
  protected static async batchUpdate<T>(
    table: string,
    records: Array<{ id: string } & Partial<T>>
  ): Promise<T[]> {
    const promises = records.map(record =>
      supabase.from(table).update(record).eq('id', record.id).select().single()
    )

    const results = await Promise.all(promises)
    return results.map(r => r.data as T)
  }

  /**
   * 检查记录是否存在
   */
  protected static async exists(
    table: string,
    field: string,
    value: any
  ): Promise<boolean> {
    const { data } = await supabase
      .from(table)
      .select('id')
      .eq(field, value)
      .single()

    return !!data
  }

  /**
   * 计数
   */
  protected static async count(
    table: string,
    filters?: Record<string, any>
  ): Promise<number> {
    let query = supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { count } = await query
    return count || 0
  }
}
































