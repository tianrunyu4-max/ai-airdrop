/**
 * 🚀 空投服务
 * 从数据库读取爬虫抓取的空投信息
 */

import { supabase } from '@/lib/supabase'

export interface Airdrop {
  id: string
  title: string
  description: string
  platform: string
  project_name: string
  type: 'web3' | 'cex'
  category?: string
  reward_min?: number
  reward_max?: number
  reward_description?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  ai_score: number
  steps?: string[]
  url?: string
  status: string
  created_at: string
}

export const AirdropService = {
  /**
   * 获取待推送的空投（按评分排序）
   * @param limit 数量限制
   * @param type 类型筛选（'web3' | 'cex' | 'all'）
   */
  async getAirdropsForPush(limit: number = 10, type: 'web3' | 'cex' | 'all' = 'all') {
    try {
      let query = supabase
        .from('airdrops')
        .select('*')
        .eq('status', 'active')
        .gt('ai_score', 7.0) // 只推送评分 >= 7.0 的优质空投
        .order('ai_score', { ascending: false })
        .order('priority', { ascending: false })
        .limit(limit)
      
      // 类型筛选
      if (type !== 'all') {
        query = query.eq('type', type)
      }
      
      // 排除最近12小时内推送过的
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      query = query.or(`last_pushed_at.is.null,last_pushed_at.lt.${twelveHoursAgo}`)
      
      const { data, error } = await query
      
      if (error) {
        console.error('❌ 获取空投失败:', error)
        return { success: false, data: [], error: error.message }
      }
      
      return { success: true, data: data || [], error: null }
      
    } catch (error: any) {
      console.error('❌ 获取空投异常:', error)
      return { success: false, data: [], error: error.message }
    }
  },

  /**
   * 标记空投已推送
   */
  async markAsPushed(airdropId: string) {
    try {
      const { error } = await supabase
        .from('airdrops')
        .update({
          push_count: supabase.rpc('increment_push_count'),
          last_pushed_at: new Date().toISOString()
        })
        .eq('id', airdropId)
      
      if (error) {
        console.error('❌ 标记推送失败:', error)
      }
    } catch (error) {
      console.error('❌ 标记推送异常:', error)
    }
  },

  /**
   * 记录推送历史
   */
  async recordPush(airdropId: string, chatGroupId: string, messageId: string, batchNumber: number) {
    try {
      const { error } = await supabase
        .from('airdrop_pushes')
        .insert({
          airdrop_id: airdropId,
          chat_group_id: chatGroupId,
          message_id: messageId,
          batch_number: batchNumber,
          push_time: new Date().toISOString()
        })
      
      if (error) {
        console.error('❌ 记录推送历史失败:', error)
      }
    } catch (error) {
      console.error('❌ 记录推送历史异常:', error)
    }
  },

  /**
   * 格式化空投消息内容
   */
  formatAirdropMessage(airdrop: Airdrop): string {
    const stars = '⭐'.repeat(Math.ceil(airdrop.ai_score / 2))
    
    let content = `🚀 ${airdrop.title}\n\n`
    
    // 奖励信息
    if (airdrop.reward_min && airdrop.reward_max) {
      content += `💎 预计奖励：${airdrop.reward_min}-${airdrop.reward_max} USDT\n`
    } else if (airdrop.reward_description) {
      content += `💎 奖励：${airdrop.reward_description}\n`
    }
    
    // AI评分
    content += `🎯 AI评分：${airdrop.ai_score}/10 ${stars}\n`
    
    // 平台
    content += `📱 平台：${airdrop.platform}\n`
    
    // 分类
    if (airdrop.category) {
      content += `📂 分类：${airdrop.category}\n`
    }
    
    // 难度
    if (airdrop.difficulty) {
      const difficultyMap = {
        easy: '简单 ✅',
        medium: '中等 ⚡',
        hard: '困难 🔥'
      }
      content += `📊 难度：${difficultyMap[airdrop.difficulty]}\n`
    }
    
    // 描述
    if (airdrop.description) {
      content += `\n📝 ${airdrop.description.substring(0, 200)}\n`
    }
    
    // 参与步骤
    if (airdrop.steps && airdrop.steps.length > 0) {
      content += `\n✅ 参与步骤：\n`
      airdrop.steps.slice(0, 5).forEach((step, index) => {
        content += `${index + 1}. ${step}\n`
      })
    }
    
    // 链接
    if (airdrop.url) {
      content += `\n🔗 ${airdrop.url}`
    }
    
    return content
  },

  /**
   * 获取统计信息
   */
  async getStats() {
    try {
      // 总数
      const { count: total } = await supabase
        .from('airdrops')
        .select('*', { count: 'exact', head: true })
      
      // 活跃空投
      const { count: active } = await supabase
        .from('airdrops')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
      
      // 已推送
      const { count: pushed } = await supabase
        .from('airdrops')
        .select('*', { count: 'exact', head: true })
        .gt('push_count', 0)
      
      // Web3空投
      const { count: web3 } = await supabase
        .from('airdrops')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'web3')
      
      // 交易所空投
      const { count: cex } = await supabase
        .from('airdrops')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'cex')
      
      // 平均评分
      const { data: avgData } = await supabase
        .from('airdrops')
        .select('ai_score')
      
      const avgScore = avgData && avgData.length > 0
        ? avgData.reduce((sum, a) => sum + a.ai_score, 0) / avgData.length
        : 0
      
      return {
        total: total || 0,
        active: active || 0,
        pushed: pushed || 0,
        web3: web3 || 0,
        cex: cex || 0,
        avgScore: avgScore.toFixed(1)
      }
    } catch (error: any) {
      console.error('❌ 获取统计失败:', error)
      return {
        total: 0,
        active: 0,
        pushed: 0,
        web3: 0,
        cex: 0,
        avgScore: '0.0'
      }
    }
  }
}

