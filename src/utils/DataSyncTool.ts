/**
 * 数据同步工具 - 用于修复localStorage和数据库不一致问题
 */

import { supabase } from '@/lib/supabase'

export class DataSyncTool {
  /**
   * 诊断当前用户的数据状况
   */
  static async diagnose(userId: string) {
    console.log('🔍 ===== 开始数据诊断 =====')
    
    const report = {
      localStorage: {} as any,
      database: {} as any,
      issues: [] as string[]
    }
    
    try {
      // 1. 检查localStorage中的学习卡
      const localCards = JSON.parse(localStorage.getItem('user_learning_cards') || '[]')
      const userLocalCards = localCards.filter((c: any) => c.user_id === userId)
      report.localStorage.learningCards = userLocalCards.length
      console.log(`📦 localStorage学习卡: ${userLocalCards.length}张`)
      
      // 2. 检查localStorage中的交易记录
      const localTxs = JSON.parse(localStorage.getItem('user_transactions') || '[]')
      const userLocalTxs = localTxs.filter((t: any) => t.user_id === userId)
      report.localStorage.transactions = userLocalTxs.length
      console.log(`📦 localStorage交易记录: ${userLocalTxs.length}条`)
      
      // 3. 检查数据库中的用户信息
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (userError) {
        report.issues.push(`❌ 查询用户失败: ${userError.message}`)
      } else {
        report.database.user = user
        console.log(`👤 用户: ${user.username}, 代理状态: ${user.is_agent}`)
        console.log(`💰 U余额: ${user.u_balance}, 积分: ${user.transfer_points}`)
      }
      
      // 4. 检查直推关系
      const { data: referrals, error: refError } = await supabase
        .from('referral_relationships')
        .select('referee_id, created_at')
        .eq('referrer_id', userId)
        .eq('is_active', true)
      
      if (refError) {
        report.issues.push(`❌ 查询直推关系失败: ${refError.message}`)
      } else {
        report.database.referrals = referrals?.length || 0
        console.log(`👥 直推关系表(referral_relationships): ${referrals?.length || 0}人`)
      }
      
      // 5. 检查旧的inviter_id关系
      const { data: invitedUsers, error: invError } = await supabase
        .from('users')
        .select('id, username, is_agent')
        .eq('inviter_id', userId)
        .eq('is_agent', true)
      
      if (invError) {
        report.issues.push(`❌ 查询inviter_id关系失败: ${invError.message}`)
      } else {
        report.database.inviterIdCount = invitedUsers?.length || 0
        console.log(`👥 旧关系表(users.inviter_id): ${invitedUsers?.length || 0}人`)
        
        // 检查数据不一致
        if ((invitedUsers?.length || 0) > (referrals?.length || 0)) {
          report.issues.push(`⚠️ 数据不一致: inviter_id有${invitedUsers?.length}人，但referral_relationships只有${referrals?.length}人`)
        }
      }
      
      // 6. 检查Binary系统
      const { data: binary, error: binError } = await supabase
        .from('binary_members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (binError) {
        report.issues.push(`❌ 查询Binary系统失败: ${binError.message}`)
      } else if (binary) {
        report.database.binary = binary
        console.log(`🌳 Binary系统: A侧${binary.a_side_count}人, B侧${binary.b_side_count}人`)
        console.log(`💎 对碰奖: ${binary.total_pairing_bonus}U`)
      } else {
        console.log(`⚠️ 未加入Binary系统`)
      }
      
      console.log('🔍 ===== 诊断完成 =====')
      
      if (report.issues.length > 0) {
        console.warn('⚠️ 发现问题:')
        report.issues.forEach(issue => console.warn(issue))
      } else {
        console.log('✅ 未发现明显问题')
      }
      
      return report
      
    } catch (error) {
      console.error('❌ 诊断失败:', error)
      return null
    }
  }
  
  /**
   * 修复直推关系数据
   * 将users.inviter_id的数据同步到referral_relationships
   */
  static async fixReferralRelationships(userId: string) {
    console.log('🔧 ===== 开始修复直推关系 =====')
    
    try {
      // 1. 查询所有通过inviter_id推荐的AI代理
      const { data: invitedUsers, error: queryError } = await supabase
        .from('users')
        .select('id, username, is_agent, created_at')
        .eq('inviter_id', userId)
        .eq('is_agent', true)
      
      if (queryError) {
        console.error('❌ 查询失败:', queryError)
        return { success: false, error: queryError.message }
      }
      
      if (!invitedUsers || invitedUsers.length === 0) {
        console.log('ℹ️ 没有需要修复的数据')
        return { success: true, fixed: 0 }
      }
      
      console.log(`📋 找到${invitedUsers.length}个需要同步的推荐关系`)
      
      // 2. 逐个检查并插入到referral_relationships
      let fixedCount = 0
      for (const user of invitedUsers) {
        // 检查是否已存在
        const { data: existing } = await supabase
          .from('referral_relationships')
          .select('id')
          .eq('referrer_id', userId)
          .eq('referee_id', user.id)
          .maybeSingle()
        
        if (existing) {
          console.log(`⏭️ ${user.username} 已存在，跳过`)
          continue
        }
        
        // 插入新关系
        const { error: insertError } = await supabase
          .from('referral_relationships')
          .insert({
            referrer_id: userId,
            referee_id: user.id,
            is_active: true,
            created_at: user.created_at
          })
        
        if (insertError) {
          console.error(`❌ 插入${user.username}失败:`, insertError)
        } else {
          console.log(`✅ 已添加 ${user.username} 到直推关系表`)
          fixedCount++
        }
      }
      
      console.log(`🔧 ===== 修复完成: 同步了${fixedCount}条关系 =====`)
      
      return { success: true, fixed: fixedCount }
      
    } catch (error) {
      console.error('❌ 修复失败:', error)
      return { success: false, error: String(error) }
    }
  }
  
  /**
   * 清除所有缓存
   */
  static clearAllCache(userId: string) {
    console.log('🧹 ===== 清除所有缓存 =====')
    
    const cacheKeys = [
      `team_stats_${userId}`,
      `team_referrals_${userId}`,
      `user_learning_cards`,
      `user_transactions`,
      `release_rate_${userId}`,
      `checkin_status_${userId}`
    ]
    
    cacheKeys.forEach(key => {
      localStorage.removeItem(key)
      console.log(`🗑️ 已清除: ${key}`)
    })
    
    console.log('✅ 所有缓存已清除')
  }
  
  /**
   * 完整修复流程
   */
  static async fullRepair(userId: string) {
    console.log('🚀 ===== 开始完整修复流程 =====')
    
    // 1. 诊断
    const diagnosis = await this.diagnose(userId)
    
    if (!diagnosis) {
      return { success: false, message: '诊断失败' }
    }
    
    // 2. 如果有数据不一致，修复直推关系
    const needsFix = diagnosis.issues.some(issue => issue.includes('数据不一致'))
    if (needsFix) {
      console.log('🔧 发现数据不一致，开始修复...')
      const fixResult = await this.fixReferralRelationships(userId)
      
      if (!fixResult.success) {
        return { success: false, message: '修复直推关系失败', error: fixResult.error }
      }
      
      console.log(`✅ 成功修复${fixResult.fixed}条直推关系`)
    }
    
    // 3. 清除缓存
    this.clearAllCache(userId)
    
    // 4. 再次诊断验证
    console.log('🔍 验证修复结果...')
    const verification = await this.diagnose(userId)
    
    console.log('🎉 ===== 完整修复流程完成 =====')
    
    return { 
      success: true, 
      message: '修复完成，请刷新页面',
      before: diagnosis,
      after: verification
    }
  }
}

// 暴露到window对象，方便在控制台调用
if (typeof window !== 'undefined') {
  (window as any).DataSyncTool = DataSyncTool
}

