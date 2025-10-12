/**
 * AirdropCrawlerService - 空投信息自动爬取服务
 * 
 * 功能：
 * 1. RSS订阅（主要方式）
 * 2. 自动解析空投信息
 * 3. 自动添加到数据库
 * 4. 自动推送到群聊
 */

import { BaseService, type ApiResponse } from './BaseService'
import { supabase } from '@/lib/supabase'

// RSS源配置
const RSS_FEEDS = [
  {
    name: 'Binance Announcements',
    url: 'https://www.binance.com/en/support/announcement/rss',
    exchange: 'binance',
    enabled: true
  },
  {
    name: 'CoinMarketCap Airdrops',
    url: 'https://coinmarketcap.com/airdrop/rss.xml',
    exchange: 'coinmarketcap',
    enabled: true
  }
]

export class AirdropCrawlerService extends BaseService {
  /**
   * 手动触发爬取所有RSS源
   */
  static async crawlAll(): Promise<ApiResponse<any>> {
    try {
      console.log('🕷️ 开始爬取所有RSS源...')
      
      const results = []
      let totalNew = 0

      for (const feed of RSS_FEEDS) {
        if (!feed.enabled) continue

        console.log(`📡 正在爬取: ${feed.name}`)
        
        const result = await this.crawlRSS(feed.url, feed.exchange)
        
        if (result.success && result.data) {
          results.push({
            feed: feed.name,
            success: true,
            newCount: result.data.newCount || 0
          })
          totalNew += result.data.newCount || 0
        } else {
          results.push({
            feed: feed.name,
            success: false,
            error: result.error
          })
        }
      }

      console.log(`✅ 爬取完成！共发现 ${totalNew} 条新空投`)

      return {
        success: true,
        data: {
          totalNew,
          results
        },
        message: `爬取完成！发现 ${totalNew} 条新空投`
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 爬取单个RSS源
   */
  private static async crawlRSS(rssUrl: string, exchange: string): Promise<ApiResponse<any>> {
    try {
      // 1. 使用RSS解析API（rss2json.com - 免费）
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`
      
      const response = await fetch(apiUrl)
      const data = await response.json()

      if (data.status !== 'ok') {
        throw new Error(`RSS解析失败: ${data.message || '未知错误'}`)
      }

      // 2. 解析RSS条目
      const items = data.items || []
      let newCount = 0

      for (const item of items) {
        // 3. 检查是否是空投相关（标题包含关键词）
        const isAirdrop = this.isAirdropRelated(item.title, item.description)
        
        if (!isAirdrop) continue

        // 4. 检查是否已存在
        const exists = await this.checkExists(item.link)
        
        if (exists) continue

        // 5. 提取空投信息
        const airdropInfo = this.extractAirdropInfo(item, exchange)

        // 6. 添加到数据库
        const { error } = await supabase
          .from('airdrops')
          .insert(airdropInfo)

        if (error) {
          console.error('添加空投失败:', error)
          continue
        }

        newCount++
        console.log(`✅ 新增空投: ${airdropInfo.title}`)

        // 7. 自动推送到群聊
        await this.pushToChat(airdropInfo)
      }

      return {
        success: true,
        data: {
          newCount,
          totalItems: items.length
        }
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 判断是否是空投相关
   */
  private static isAirdropRelated(title: string, description: string): boolean {
    const keywords = [
      'airdrop',
      '空投',
      'launchpad',
      'launchpool',
      'megadrop',
      'listing',
      'new token',
      'giveaway',
      '赠送',
      '免费'
    ]

    const text = (title + ' ' + description).toLowerCase()
    
    return keywords.some(keyword => text.includes(keyword.toLowerCase()))
  }

  /**
   * 检查空投是否已存在
   */
  private static async checkExists(url: string): Promise<boolean> {
    const { data } = await supabase
      .from('airdrops')
      .select('id')
      .eq('url', url)
      .maybeSingle()

    return !!data
  }

  /**
   * 提取空投信息
   */
  private static extractAirdropInfo(item: any, exchange: string): any {
    // 提取标题
    let title = item.title || 'Unknown Airdrop'
    
    // 清理HTML标签
    title = title.replace(/<[^>]*>/g, '')
    
    // 提取描述
    let description = item.description || item.content || ''
    description = description.replace(/<[^>]*>/g, '').substring(0, 500)

    // 提取时间
    const publishDate = item.pubDate ? new Date(item.pubDate) : new Date()
    
    // 预估结束时间（默认30天后）
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)

    // 尝试提取奖励金额（简单正则）
    const rewardsMatch = description.match(/(\d+[\d,]*)\s*(USDT|BTC|ETH|BNB|U)/i)
    const rewards = rewardsMatch ? rewardsMatch[0] : 'TBA'

    // AI评分（简单算法）
    let aiScore = 5
    if (exchange === 'binance') aiScore += 3 // 币安加分
    if (rewardsMatch) aiScore += 1 // 有明确奖励加分
    if (title.includes('official') || title.includes('官方')) aiScore += 1

    return {
      exchange,
      title,
      description,
      rewards,
      start_date: publishDate.toISOString(),
      end_date: endDate.toISOString(),
      url: item.link,
      ai_score: Math.min(aiScore, 10),
      is_active: true,
      created_at: new Date().toISOString()
    }
  }

  /**
   * 推送到群聊
   */
  private static async pushToChat(airdrop: any): Promise<void> {
    try {
      // 1. 获取所有活跃群组
      const { data: groups } = await supabase
        .from('chat_groups')
        .select('id')
        .eq('is_active', true)

      if (!groups || groups.length === 0) return

      // 2. 构建消息
      const message = `━━━━━━━━━━━━━━━━━━━━
🎁 新空投通知（自动）

【标题】${airdrop.title}
【交易所】${airdrop.exchange.toUpperCase()}
【奖励】${airdrop.rewards}
【AI评分】${airdrop.ai_score}/10

${airdrop.description ? `【说明】${airdrop.description.substring(0, 200)}...\n\n` : ''}${airdrop.url ? `【链接】${airdrop.url}\n\n` : ''}━━━━━━━━━━━━━━━━━━━━
💡 自动抓取，立即参与！
━━━━━━━━━━━━━━━━━━━━`

      // 3. 推送到所有群组
      for (const group of groups) {
        await supabase
          .from('messages')
          .insert({
            group_id: group.id,
            user_id: null,
            content: message,
            message_type: 'system'
          })
      }

      console.log(`📢 已推送到 ${groups.length} 个群组`)
    } catch (error) {
      console.error('推送到群聊失败:', error)
    }
  }

  /**
   * 获取RSS源列表
   */
  static async getRSSFeeds(): Promise<ApiResponse<any[]>> {
    return {
      success: true,
      data: RSS_FEEDS
    }
  }

  /**
   * 更新RSS源状态
   */
  static async toggleRSSFeed(feedUrl: string, enabled: boolean): Promise<ApiResponse<void>> {
    const feed = RSS_FEEDS.find(f => f.url === feedUrl)
    
    if (!feed) {
      return {
        success: false,
        error: 'RSS源不存在'
      }
    }

    feed.enabled = enabled

    return {
      success: true,
      message: `RSS源已${enabled ? '启用' : '禁用'}`
    }
  }

  /**
   * 添加自定义RSS源
   */
  static async addCustomRSS(name: string, url: string, exchange: string): Promise<ApiResponse<void>> {
    RSS_FEEDS.push({
      name,
      url,
      exchange,
      enabled: true
    })

    return {
      success: true,
      message: 'RSS源添加成功'
    }
  }
}








