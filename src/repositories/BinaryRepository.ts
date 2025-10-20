/**
 * BinaryRepository - 双区系统数据访问
 */

import { supabase } from '@/lib/supabase'
import { BaseRepository } from './BaseRepository'
import type { BinaryNode, BinaryNodeCreateParams, Placement, TeamStats } from '@/entities'

export class BinaryRepository extends BaseRepository {
  private static readonly TABLE = 'binary_nodes'

  /**
   * 创建节点
   */
  static async createNode(params: BinaryNodeCreateParams): Promise<BinaryNode> {
    return this.handleQuery(
      supabase
        .from(this.TABLE)
        .insert(params)
        .select()
        .single()
    )
  }

  /**
   * 获取节点
   */
  static async getNode(userId: string): Promise<BinaryNode | null> {
    return this.handleQueryNullable(
      supabase
        .from(this.TABLE)
        .select('*')
        .eq('user_id', userId)
        .single()
    )
  }

  /**
   * 检查用户是否已加入
   */
  static async hasJoined(userId: string): Promise<boolean> {
    return this.exists(this.TABLE, 'user_id', userId)
  }

  /**
   * 获取用户销售业绩
   */
  static async getUserSales(userId: string): Promise<{
    a_side_sales: number
    b_side_sales: number
    total_earnings: number
  }> {
    return this.handleQuery(
      supabase
        .from('users')
        .select('a_side_sales, b_side_sales, total_earnings')
        .eq('id', userId)
        .single()
    )
  }

  /**
   * 更新销售业绩
   */
  static async updateSales(
    userId: string,
    side: 'A' | 'B',
    amount: number
  ): Promise<void> {
    const field = side === 'A' ? 'a_side_sales' : 'b_side_sales'
    await supabase.rpc('increment_sales', {
      user_id: userId,
      field,
      amount
    })
  }

  /**
   * 获取团队人数
   */
  static async getTeamCount(userId: string, side: 'A' | 'B'): Promise<number> {
    // 查找该用户节点
    const node = await this.getNode(userId)
    if (!node) return 0

    // 查找对应侧的所有子节点
    const { count } = await supabase
      .from(this.TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', userId)
      .eq('side', side)

    return count || 0
  }

  /**
   * 查找空位
   * @param rootId 根节点用户ID
   * @param targetSide 目标侧（A或B）
   */
  static async findEmptySlot(
    rootId: string,
    targetSide: 'A' | 'B'
  ): Promise<Placement> {
    // 使用广度优先搜索找到最浅的空位
    // 这里简化实现，实际应该使用数据库存储过程
    const rootNode = await this.getNode(rootId)
    if (!rootNode) {
      throw new Error('Root node not found')
    }

    // 检查根节点的目标侧是否有空位
    const childField = targetSide === 'A' ? 'a_child_id' : 'b_child_id'
    if (!rootNode[childField]) {
      return {
        parent_id: rootId,
        side: targetSide,
        level: rootNode.level + 1,
        position: `${rootNode.position}-${targetSide}`
      }
    }

    // 递归查找子节点的空位
    const childId = rootNode[childField]
    if (childId) {
      return this.findEmptySlot(childId, targetSide)
    }

    throw new Error('No empty slot found')
  }

  /**
   * 获取有业绩的用户
   */
  static async getUsersWithSales(): Promise<Array<{
    id: string
    a_side_sales: number
    b_side_sales: number
  }>> {
    return this.handleQuery(
      supabase
        .from('users')
        .select('id, a_side_sales, b_side_sales')
        .or('a_side_sales.gte.30,b_side_sales.gte.30')
    )
  }

  /**
   * 获取本周加入费用总额
   */
  static async getTotalFeesThisWeek(): Promise<number> {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data } = await supabase
      .from(this.TABLE)
      .select('user_id')
      .gte('created_at', weekAgo.toISOString())

    // 每个用户加入需支付30U
    return (data?.length || 0) * 30
  }

  /**
   * 获取团队统计
   */
  static async getTeamStats(userId: string): Promise<TeamStats> {
    const sales = await this.getUserSales(userId)
    const aSideCount = await this.getTeamCount(userId, 'A')
    const bSideCount = await this.getTeamCount(userId, 'B')

    return {
      a_side_count: aSideCount,
      b_side_count: bSideCount,
      a_side_sales: sales.a_side_sales,
      b_side_sales: sales.b_side_sales,
      total_members: aSideCount + bSideCount,
      max_depth: 0 // TODO: 计算最大深度
    }
  }

  /**
   * 更新节点子节点ID
   */
  static async updateChild(
    parentId: string,
    side: 'A' | 'B',
    childId: string
  ): Promise<void> {
    const field = side === 'A' ? 'a_child_id' : 'b_child_id'
    await supabase
      .from(this.TABLE)
      .update({ [field]: childId })
      .eq('user_id', parentId)
  }
}


































