#!/usr/bin/env node

/**
 * 🚀 空投爬虫系统
 * 
 * 功能：
 * 1. 从多个平台抓取空投信息
 * 2. AI自动评分筛选
 * 3. 存储到Supabase数据库
 * 4. 每天定时推送（10:00 + 20:00）
 */

import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import * as cheerio from 'cheerio'
import cron from 'node-cron'

// ==========================================
// 🔧 配置
// ==========================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ==========================================
// 📊 1. Layer3.xyz 爬虫
// ==========================================

async function crawlLayer3() {
  console.log('🔄 正在抓取 Layer3.xyz...')
  
  try {
    // Layer3 API（需要注册获取API Key）
    const response = await axios.get('https://layer3.xyz/api/quests', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      },
      timeout: 10000
    })
    
    const quests = response.data.data || response.data || []
    const airdrops = []
    
    for (const quest of quests.slice(0, 20)) { // 只取前20个
      // 筛选条件：有奖励 + 难度适中
      if (!quest.reward || quest.difficulty === 'hard') continue
      
      const airdrop = {
        title: quest.title || quest.name,
        description: quest.description,
        platform: 'Layer3',
        project_name: quest.project?.name || 'Unknown',
        type: 'web3',
        category: quest.category || 'DeFi',
        reward_min: 100,
        reward_max: parseInt(quest.estimatedReward) || 500,
        reward_description: quest.reward,
        difficulty: quest.difficulty || 'medium',
        steps: quest.tasks?.map(t => t.title) || [],
        url: `https://layer3.xyz/quests/${quest.id}`,
        source_url: 'https://layer3.xyz',
        raw_data: quest
      }
      
      // 计算AI评分
      airdrop.ai_score = calculateAIScore(airdrop)
      
      airdrops.push(airdrop)
    }
    
    console.log(`✅ Layer3: 抓取到 ${airdrops.length} 个空投`)
    return airdrops
    
  } catch (error) {
    console.error('❌ Layer3 抓取失败:', error.message)
    return []
  }
}

// ==========================================
// 📊 2. Galxe.com 爬虫
// ==========================================

async function crawlGalxe() {
  console.log('🔄 正在抓取 Galxe.com...')
  
  try {
    // Galxe GraphQL API
    const query = `
      query CampaignList {
        campaigns(first: 20, orderBy: "trending") {
          list {
            id
            name
            description
            thumbnail
            space {
              name
            }
            rewardInfo {
              discordRole
              nft
            }
          }
        }
      }
    `
    
    const response = await axios.post('https://graphigo.prd.galaxy.eco/query', {
      query,
      operationName: 'CampaignList'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 10000
    })
    
    const campaigns = response.data?.data?.campaigns?.list || []
    const airdrops = []
    
    for (const campaign of campaigns) {
      const airdrop = {
        title: campaign.name,
        description: campaign.description?.substring(0, 500),
        platform: 'Galxe',
        project_name: campaign.space?.name || 'Unknown',
        type: 'web3',
        category: 'NFT',
        reward_min: 50,
        reward_max: 300,
        reward_description: campaign.rewardInfo?.nft ? 'NFT奖励' : '积分奖励',
        difficulty: 'easy',
        url: `https://galxe.com/campaign/${campaign.id}`,
        source_url: 'https://galxe.com',
        raw_data: campaign
      }
      
      airdrop.ai_score = calculateAIScore(airdrop)
      airdrops.push(airdrop)
    }
    
    console.log(`✅ Galxe: 抓取到 ${airdrops.length} 个空投`)
    return airdrops
    
  } catch (error) {
    console.error('❌ Galxe 抓取失败:', error.message)
    return []
  }
}

// ==========================================
// 📊 3. DeFiLlama 爬虫（项目融资 = 潜在空投）
// ==========================================

async function crawlDeFiLlama() {
  console.log('🔄 正在抓取 DeFiLlama...')
  
  try {
    const response = await axios.get('https://api.llama.fi/protocols', {
      timeout: 10000
    })
    
    const protocols = response.data || []
    const airdrops = []
    
    // 筛选：无代币 + TVL > 1000万 = 潜在空投
    const potentialAirdrops = protocols
      .filter(p => !p.symbol && p.tvl > 10000000)
      .slice(0, 10)
    
    for (const protocol of potentialAirdrops) {
      const airdrop = {
        title: `${protocol.name} 潜在空投`,
        description: `${protocol.name} 是一个 ${protocol.category} 项目，当前TVL: ${(protocol.tvl / 1000000).toFixed(2)}M，尚未发币，有空投潜力。`,
        platform: 'DeFiLlama',
        project_name: protocol.name,
        type: 'web3',
        category: protocol.category,
        reward_min: 500,
        reward_max: 5000,
        reward_description: '预期空投',
        difficulty: 'medium',
        url: protocol.url || `https://defillama.com/protocol/${protocol.slug}`,
        source_url: 'https://defillama.com',
        raw_data: protocol
      }
      
      airdrop.ai_score = calculateAIScore(airdrop)
      airdrops.push(airdrop)
    }
    
    console.log(`✅ DeFiLlama: 抓取到 ${airdrops.length} 个潜在空投`)
    return airdrops
    
  } catch (error) {
    console.error('❌ DeFiLlama 抓取失败:', error.message)
    return []
  }
}

// ==========================================
// 📊 4. Twitter 爬虫（需要API Key）
// ==========================================

async function crawlTwitter() {
  console.log('🔄 正在抓取 Twitter...')
  
  const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN
  
  if (!TWITTER_BEARER_TOKEN) {
    console.log('⚠️ 未配置 Twitter API，跳过')
    return []
  }
  
  try {
    const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      params: {
        query: '#airdrop OR #空投 -is:retweet lang:zh',
        max_results: 10,
        'tweet.fields': 'created_at,author_id'
      },
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`
      },
      timeout: 10000
    })
    
    const tweets = response.data?.data || []
    const airdrops = []
    
    for (const tweet of tweets) {
      // 简单解析（实际需要更复杂的NLP）
      const airdrop = {
        title: tweet.text.substring(0, 100),
        description: tweet.text,
        platform: 'Twitter',
        project_name: 'Community',
        type: 'web3',
        reward_min: 10,
        reward_max: 100,
        difficulty: 'easy',
        url: `https://twitter.com/i/web/status/${tweet.id}`,
        source_url: 'https://twitter.com',
        raw_data: tweet
      }
      
      airdrop.ai_score = calculateAIScore(airdrop) - 2.0 // Twitter信息质量较低，减分
      airdrops.push(airdrop)
    }
    
    console.log(`✅ Twitter: 抓取到 ${airdrops.length} 个空投`)
    return airdrops
    
  } catch (error) {
    console.error('❌ Twitter 抓取失败:', error.message)
    return []
  }
}

// ==========================================
// 📊 5. 中文资讯网站爬虫（Foresight/PANews）
// ==========================================

async function crawlChineseNews() {
  console.log('🔄 正在抓取中文资讯...')
  
  try {
    const response = await axios.get('https://foresightnews.pro/article', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 10000
    })
    
    const $ = cheerio.load(response.data)
    const airdrops = []
    
    // 查找包含"空投"关键词的文章
    $('article').each((i, elem) => {
      const title = $(elem).find('h2').text()
      const link = $(elem).find('a').attr('href')
      
      if (title.includes('空投') || title.includes('Airdrop')) {
        airdrops.push({
          title: title.substring(0, 100),
          description: title,
          platform: 'Foresight News',
          project_name: 'Community',
          type: 'web3',
          reward_min: 100,
          reward_max: 1000,
          difficulty: 'medium',
          url: link?.startsWith('http') ? link : `https://foresightnews.pro${link}`,
          source_url: 'https://foresightnews.pro',
          raw_data: { title, link }
        })
      }
    })
    
    airdrops.forEach(a => a.ai_score = calculateAIScore(a))
    
    console.log(`✅ 中文资讯: 抓取到 ${airdrops.length} 个空投`)
    return airdrops
    
  } catch (error) {
    console.error('❌ 中文资讯抓取失败:', error.message)
    return []
  }
}

// ==========================================
// 🤖 AI评分算法
// ==========================================

function calculateAIScore(airdrop) {
  let score = 5.0
  
  // 奖励金额（最高+3分）
  if (airdrop.reward_max > 5000) score += 3.0
  else if (airdrop.reward_max > 1000) score += 2.0
  else if (airdrop.reward_max > 500) score += 1.0
  
  // 难度（越简单分数越高，最高+2分）
  if (airdrop.difficulty === 'easy') score += 2.0
  else if (airdrop.difficulty === 'medium') score += 1.0
  
  // 平台可信度（最高+1.5分）
  if (['Layer3', 'Galxe', 'DeFiLlama'].includes(airdrop.platform)) {
    score += 1.5
  } else if (['Foresight News', 'PANews'].includes(airdrop.platform)) {
    score += 1.0
  }
  
  // 限制在0-10之间
  return Math.min(Math.max(score, 0), 10)
}

// ==========================================
// 💾 保存到数据库
// ==========================================

async function saveAirdropsToDatabase(airdrops) {
  console.log(`\n💾 开始保存 ${airdrops.length} 个空投到数据库...`)
  
  let successCount = 0
  let skipCount = 0
  let errorCount = 0
  
  for (const airdrop of airdrops) {
    try {
      // 检查是否已存在
      const { data: existing } = await supabase
        .from('airdrops')
        .select('id')
        .eq('title', airdrop.title)
        .eq('platform', airdrop.platform)
        .single()
      
      if (existing) {
        skipCount++
        continue
      }
      
      // 插入新空投
      const { error } = await supabase
        .from('airdrops')
        .insert({
          ...airdrop,
          status: 'active',
          is_verified: false,
          priority: Math.floor(airdrop.ai_score * 10) // 评分越高优先级越高
        })
      
      if (error) {
        console.error(`❌ 保存失败 [${airdrop.title}]:`, error.message)
        errorCount++
      } else {
        successCount++
      }
      
    } catch (error) {
      console.error(`❌ 处理失败 [${airdrop.title}]:`, error.message)
      errorCount++
    }
  }
  
  console.log(`\n✅ 保存完成：成功 ${successCount} | 跳过 ${skipCount} | 失败 ${errorCount}`)
}

// ==========================================
// 🚀 主爬虫任务
// ==========================================

async function runCrawler() {
  console.log('\n' + '='.repeat(50))
  console.log('🚀 空投爬虫启动 - ' + new Date().toLocaleString('zh-CN'))
  console.log('='.repeat(50) + '\n')
  
  try {
    // 并行抓取所有数据源
    const [layer3, galxe, defiLlama, twitter, chineseNews] = await Promise.all([
      crawlLayer3(),
      crawlGalxe(),
      crawlDeFiLlama(),
      crawlTwitter(),
      crawlChineseNews()
    ])
    
    // 合并所有空投
    const allAirdrops = [
      ...layer3,
      ...galxe,
      ...defiLlama,
      ...twitter,
      ...chineseNews
    ]
    
    console.log(`\n📊 总共抓取到 ${allAirdrops.length} 个空投`)
    
    // 去重（基于 title）
    const uniqueAirdrops = []
    const seenTitles = new Set()
    
    for (const airdrop of allAirdrops) {
      if (!seenTitles.has(airdrop.title)) {
        seenTitles.add(airdrop.title)
        uniqueAirdrops.push(airdrop)
      }
    }
    
    console.log(`📊 去重后剩余 ${uniqueAirdrops.length} 个空投`)
    
    // 按评分排序
    uniqueAirdrops.sort((a, b) => b.ai_score - a.ai_score)
    
    // 只保存评分 >= 7.0 的优质空投
    const highQualityAirdrops = uniqueAirdrops.filter(a => a.ai_score >= 7.0)
    
    console.log(`📊 优质空投（评分>=7.0）: ${highQualityAirdrops.length} 个`)
    
    // 保存到数据库
    if (highQualityAirdrops.length > 0) {
      await saveAirdropsToDatabase(highQualityAirdrops)
    } else {
      console.log('⚠️ 没有找到优质空投，跳过保存')
    }
    
    console.log('\n✅ 爬虫任务完成！\n')
    
  } catch (error) {
    console.error('\n❌ 爬虫任务失败:', error.message)
  }
}

// ==========================================
// ⏰ 定时任务
// ==========================================

function setupSchedule() {
  console.log('⏰ 设置定时任务...')
  
  // 每6小时执行一次爬虫（0点、6点、12点、18点）
  cron.schedule('0 0,6,12,18 * * *', () => {
    runCrawler()
  })
  
  console.log('✅ 定时任务已设置：每6小时执行一次（0/6/12/18点）')
  console.log('✅ 机器人推送时间：每天10:00 + 20:00（由前端控制）\n')
}

// ==========================================
// 🎯 启动入口
// ==========================================

async function main() {
  console.log('🚀 空投爬虫系统启动中...\n')
  
  // 立即执行一次
  await runCrawler()
  
  // 设置定时任务
  setupSchedule()
  
  console.log('✅ 爬虫系统运行中...\n')
  console.log('💡 提示：按 Ctrl+C 停止服务\n')
}

// 运行
main().catch(error => {
  console.error('❌ 系统启动失败:', error)
  process.exit(1)
})

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n👋 正在停止爬虫系统...')
  process.exit(0)
})

