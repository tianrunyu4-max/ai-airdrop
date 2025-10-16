/**
 * Supabase Edge Function: 自动爬取空投信息
 * 
 * 触发方式：
 * 1. Cron Job（每2小时）
 * 2. 手动调用API
 * 
 * 功能：
 * - 爬取币安和欧易的空投资讯
 * - 自动推送到核心群
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// RSS源配置
const RSS_FEEDS = [
  {
    name: '币安公告',
    url: 'https://www.binance.com/en/support/announcement/rss',
    exchange: 'binance',
    autoPush: true
  },
  {
    name: 'OKX公告',
    url: 'https://www.okx.com/support/hc/en-us/articles/rss',
    exchange: 'okx',
    autoPush: true
  }
]

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        }
      })
    }

    console.log('🕷️ 开始自动爬取空投信息...')

    // 创建 Supabase 客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let totalNew = 0
    const results = []

    // 爬取所有RSS源
    for (const feed of RSS_FEEDS) {
      console.log(`📡 正在爬取: ${feed.name}`)
      
      try {
        const newCount = await crawlRSS(feed, supabase)
        results.push({
          feed: feed.name,
          success: true,
          newCount
        })
        totalNew += newCount
      } catch (error) {
        console.error(`❌ 爬取${feed.name}失败:`, error)
        results.push({
          feed: feed.name,
          success: false,
          error: error.message
        })
      }
    }

    console.log(`✅ 爬取完成！共发现 ${totalNew} 条新空投`)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          totalNew,
          results,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  } catch (error) {
    console.error('❌ 执行失败:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})

/**
 * 爬取单个RSS源
 */
async function crawlRSS(feed: any, supabase: any): Promise<number> {
  // 1. 使用rss2json API解析RSS
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`
  
  const response = await fetch(apiUrl)
  const data = await response.json()

  if (data.status !== 'ok') {
    throw new Error(`RSS解析失败: ${data.message}`)
  }

  const items = data.items || []
  let newCount = 0

  for (const item of items) {
    // 2. 检查是否是空投相关
    if (!isAirdropRelated(item.title, item.description)) {
      continue
    }

    // 3. 检查是否已存在
    const { data: existing } = await supabase
      .from('airdrops')
      .select('id')
      .eq('url', item.link)
      .maybeSingle()

    if (existing) {
      continue
    }

    // 4. 提取空投信息
    const airdropInfo = extractAirdropInfo(item, feed.exchange)

    // 5. 保存到数据库
    const { data: newAirdrop, error } = await supabase
      .from('airdrops')
      .insert(airdropInfo)
      .select()
      .single()

    if (error) {
      console.error('添加空投失败:', error)
      continue
    }

    newCount++
    console.log(`✅ 新增空投: ${airdropInfo.title}`)

    // 6. 自动推送到核心群（如果启用）
    if (feed.autoPush && newAirdrop) {
      await pushToCoreGroup(newAirdrop, supabase)
    }
  }

  return newCount
}

/**
 * 判断是否是空投相关
 */
function isAirdropRelated(title: string, description: string): boolean {
  const keywords = [
    'airdrop', '空投',
    'launchpad', 'launchpool', 'megadrop',
    'listing', 'new token',
    'giveaway', '赠送', '免费'
  ]

  const text = (title + ' ' + description).toLowerCase()
  return keywords.some(keyword => text.includes(keyword.toLowerCase()))
}

/**
 * 提取空投信息
 */
function extractAirdropInfo(item: any, exchange: string): any {
  let title = (item.title || 'Unknown Airdrop').replace(/<[^>]*>/g, '')
  let description = (item.description || '').replace(/<[^>]*>/g, '').substring(0, 500)

  const publishDate = item.pubDate ? new Date(item.pubDate) : new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 30)

  // 提取奖励金额
  const rewardsMatch = description.match(/(\d+[\d,]*)\s*(USDT|BTC|ETH|BNB|U)/i)
  const rewards = rewardsMatch ? rewardsMatch[0] : 'TBA'

  // AI评分
  let aiScore = 5
  if (exchange === 'binance') aiScore += 3
  else if (exchange === 'okx') aiScore += 2
  if (rewardsMatch) aiScore += 1
  if (title.toLowerCase().includes('official') || title.includes('官方')) aiScore += 1

  return {
    exchange,
    title,
    description,
    rewards,
    start_date: publishDate.toISOString(),
    end_date: endDate.toISOString(),
    url: item.link,
    ai_score: Math.min(aiScore, 10),
    is_active: true
  }
}

/**
 * 推送到核心群
 */
async function pushToCoreGroup(airdrop: any, supabase: any): Promise<void> {
  try {
    // 1. 获取核心群（type = 'default_hall'）
    const { data: coreGroups } = await supabase
      .from('chat_groups')
      .select('id, name')
      .eq('is_active', true)
      .eq('type', 'default_hall')

    if (!coreGroups || coreGroups.length === 0) {
      console.log('⚠️ 没有找到核心群')
      return
    }

    // 2. 构建消息
    const message = `━━━━━━━━━━━━━━━━━━━━
🎁 自动空投通知

【标题】${airdrop.title}
【交易所】${airdrop.exchange.toUpperCase()}
【奖励】${airdrop.rewards}
【AI评分】${airdrop.ai_score}/10

${airdrop.description ? `【说明】${airdrop.description.substring(0, 200)}...\n\n` : ''}${airdrop.url ? `【链接】${airdrop.url}\n\n` : ''}━━━━━━━━━━━━━━━━━━━━
💡 每2小时自动爬取，立即参与！
━━━━━━━━━━━━━━━━━━━━`

    // 3. 推送到核心群
    for (const group of coreGroups) {
      await supabase
        .from('messages')
        .insert({
          chat_group_id: group.id,
          user_id: null,
          content: message,
          type: 'text',
          is_bot: true
        })

      console.log(`📢 已推送到核心群: ${group.name}`)
    }
  } catch (error) {
    console.error('推送到核心群失败:', error)
  }
}

