/**
 * 学习卡重启服务
 * 功能：检测达标学习卡并自动销毁，保留未达标的继续运行
 */

import { supabase } from '@/lib/supabase'
import type { ApiResponse } from '@/types/api'

export interface CardStatus {
  id: string
  userId: string
  daysActive: number
  currentRate: number
  baseRate: number
  boostRate: number
  isQualified: boolean
  shouldDestroy: boolean
  totalEarned: number
  releasedPoints: number
  totalPoints: number
}

export interface RestartResult {
  destroyed: CardStatus[]
  kept: CardStatus[]
  totalDestroyed: number
  totalKept: number
  totalEarnings: number
}

export class CardRestartService {
  /**
   * 检测单张学习卡是否达标
   */
  static checkCardStatus(card: any): CardStatus {
    const createdDate = new Date(card.created_at)
    const today = new Date()
    const daysActive = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // 当前释放率 = 基础率 + 加速率
    const baseRate = card.base_rate || 0.01
    const boostRate = card.boost_rate || 0
    const currentRate = baseRate + boostRate
    
    // 达标条件：
    // 1. 运行满5天
    // 2. 释放率在3%-15%之间
    // 3. 状态为active或运行中
    const isQualified = 
      daysActive >= 5 && 
      currentRate >= 0.03 && 
      currentRate <= 0.15 &&
      (card.status === 'active' || card.is_active === true)
    
    return {
      id: card.id,
      userId: card.user_id,
      daysActive,
      currentRate,
      baseRate,
      boostRate,
      isQualified,
      shouldDestroy: isQualified,
      totalEarned: card.released_points * 0.8 || 0, // 80%转U
      releasedPoints: card.released_points || 0,
      totalPoints: card.total_points || 300
    }
  }

  /**
   * 扫描用户所有学习卡
   */
  static async scanUserCards(userId: string): Promise<ApiResponse<RestartResult>> {
    try {
      // 从localStorage获取学习卡
      const cards = JSON.parse(localStorage.getItem('user_learning_cards') || '[]')
      const userCards = cards.filter((c: any) => c.user_id === userId)
      
      if (userCards.length === 0) {
        return {
          success: true,
          data: {
            destroyed: [],
            kept: [],
            totalDestroyed: 0,
            totalKept: 0,
            totalEarnings: 0
          },
          message: '没有找到学习卡'
        }
      }
      
      // 检测每张卡的状态
      const destroyed: CardStatus[] = []
      const kept: CardStatus[] = []
      let totalEarnings = 0
      
      for (const card of userCards) {
        const status = this.checkCardStatus(card)
        
        if (status.shouldDestroy) {
          destroyed.push(status)
          totalEarnings += status.totalEarned
        } else {
          kept.push(status)
        }
      }
      
      return {
        success: true,
        data: {
          destroyed,
          kept,
          totalDestroyed: destroyed.length,
          totalKept: kept.length,
          totalEarnings
        }
      }
    } catch (error) {
      console.error('扫描学习卡失败:', error)
      return {
        success: false,
        error: '扫描失败'
      }
    }
  }

  /**
   * 执行重启：销毁达标学习卡
   */
  static async restartSystem(userId: string): Promise<ApiResponse<RestartResult>> {
    try {
      // 1. 扫描学习卡
      const scanResult = await this.scanUserCards(userId)
      
      if (!scanResult.success || !scanResult.data) {
        return scanResult
      }
      
      const { destroyed, kept, totalEarnings } = scanResult.data
      
      if (destroyed.length === 0) {
        return {
          success: true,
          data: scanResult.data,
          message: '没有需要销毁的学习卡'
        }
      }
      
      // 2. 从localStorage删除达标的卡片
      const cards = JSON.parse(localStorage.getItem('user_learning_cards') || '[]')
      const destroyIds = destroyed.map(d => d.id)
      
      const remainingCards = cards.filter((c: any) => !destroyIds.includes(c.id))
      localStorage.setItem('user_learning_cards', JSON.stringify(remainingCards))
      
      // 3. 记录销毁日志
      const destroyRecords = destroyed.map(card => ({
        id: `destroy-${Date.now()}-${card.id}`,
        card_id: card.id,
        user_id: userId,
        destroy_reason: '达标自动销毁',
        days_active: card.daysActive,
        final_rate: card.currentRate,
        total_earned: card.totalEarned,
        destroyed_at: new Date().toISOString()
      }))
      
      // 保存销毁记录到localStorage
      const existingRecords = JSON.parse(localStorage.getItem('destroy_records') || '[]')
      existingRecords.push(...destroyRecords)
      localStorage.setItem('destroy_records', JSON.stringify(existingRecords))
      
      console.log(`✅ 系统重启完成：销毁${destroyed.length}张，保留${kept.length}张`)
      console.log(`💰 累计收益：${totalEarnings.toFixed(2)}U`)
      
      return {
        success: true,
        data: scanResult.data,
        message: `✅ 成功销毁${destroyed.length}张达标学习卡，保留${kept.length}张继续运行`
      }
    } catch (error) {
      console.error('重启系统失败:', error)
      return {
        success: false,
        error: '重启失败'
      }
    }
  }

  /**
   * 获取销毁记录
   */
  static async getDestroyRecords(userId: string): Promise<ApiResponse<any[]>> {
    try {
      const records = JSON.parse(localStorage.getItem('destroy_records') || '[]')
      const userRecords = records
        .filter((r: any) => r.user_id === userId)
        .sort((a: any, b: any) => new Date(b.destroyed_at).getTime() - new Date(a.destroyed_at).getTime())
      
      return {
        success: true,
        data: userRecords
      }
    } catch (error) {
      return {
        success: false,
        error: '获取记录失败'
      }
    }
  }

  /**
   * 检测是否有需要重启的卡片（用于提示）
   */
  static async needsRestart(userId: string): Promise<boolean> {
    try {
      const scanResult = await this.scanUserCards(userId)
      return scanResult.success && (scanResult.data?.totalDestroyed || 0) > 0
    } catch {
      return false
    }
  }
}

