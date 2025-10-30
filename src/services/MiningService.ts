/**
 * MiningService - AI学习卡系统服务 V4.4
 * 使用新架构：Repository + Wallet + Config
 * 
 * 实现AI学习卡核心业务逻辑：
 * 1. 加入代理（30U）自动送100积分（可激活第1张学习卡）
 * 2. U余额兑换学习卡（8U = 100积分）
 * 3. 每日签到释放（不签到不释放）
 * 4. 基础释放率1%/天 + 直推加速1%/人，最高10%
 * 5. 3倍出局（30-300天）
 * 6. 80%到账U余额，20%充学分
 * 7. 自动重启机制（总释放>新积分时触发）
 * 8. 叠加机制（最多10张）
 * 
 * 更新日期：2025-10-16
 */

import { BaseService, type ApiResponse } from './BaseService'
import { UserRepository } from '@/repositories'
import { WalletManager, BalanceValidator } from '@/wallet'
import { MiningConfig, AILearningConfig } from '@/config'
import { supabase } from '@/lib/supabase'
import type { MiningMachine } from '@/types'

export class MiningService extends BaseService {
  /**
   * 兑换学习卡（V4.0新逻辑：8U余额 = 100积分 = 1张学习卡）- localStorage版本
   * 注意：需要代理身份（已加入Binary系统）
   */
  static async purchaseMachine(
    userId: string, 
    quantity: number = 1,
    machineType: 'type1' | 'type2' | 'type3' = 'type1'
  ): Promise<ApiResponse<MiningMachine>> {
    this.validateRequired({ userId, quantity }, ['userId', 'quantity'])

    try {
      // 1. 验证数量
      if (quantity < 1 || quantity > 10) {
        return { success: false, error: '每次兑换数量必须在1-10张之间' }
      }

      // 2. 从localStorage获取当前用户信息
      const userSession = localStorage.getItem('user_session')
      if (!userSession) {
        return { success: false, error: '请先登录' }
      }

      let user
      try {
        user = JSON.parse(userSession)
        if (user.id !== userId) {
          return { success: false, error: '用户ID不匹配' }
        }
      } catch (e) {
        return { success: false, error: '用户数据异常' }
      }

      // 3. 必须是代理身份
      if (!user.is_agent) {
        return {
          success: false,
          error: '请先加入Binary对碰系统（30U）才能兑换学习卡'
        }
      }

      // 4. 检查学习卡数量限制
      const storageKey = 'user_learning_cards'
      const allCards = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const userCards = allCards.filter((card: any) => card.user_id === userId)

      if (userCards.length + quantity > 10) {
        return {
          success: false,
          error: '已达到最大学习卡数量限制（10张）'
        }
      }

      // 5. 计算费用（8U × 数量）
      const totalCost = 8 * quantity

      // 6. 检查余额
      const currentBalance = Number(user.u_balance) || 0
      if (currentBalance < totalCost) {
        return { 
          success: false, 
          error: `U余额不足，需要${totalCost}U，当前余额${currentBalance.toFixed(2)}U` 
        }
      }

      // 7. 扣除U余额（同时更新 Supabase 和 localStorage）
      const newBalance = Number((currentBalance - totalCost).toFixed(2))
      
      // 更新 Supabase 余额
      const { error: updateError } = await supabase
        .from('users')
        .update({ u_balance: newBalance })
        .eq('id', userId)
      
      if (updateError) {
        console.error('更新Supabase余额失败:', updateError)
        return { success: false, error: '余额扣除失败' }
      }
      
      // 更新 localStorage 余额（保持同步）
      user.u_balance = newBalance
      localStorage.setItem('user_session', JSON.stringify(user))

      // 8. 批量创建学习卡
      const timestamp = new Date().toISOString()

      for (let i = 0; i < quantity; i++) {
        const machine = {
          id: `lc-${Date.now()}-${i}`,
          user_id: userId,
          type: machineType,
          status: 'inactive',
          is_active: false,
          total_points: 300, // 3倍出局
          released_points: 0,
          daily_output: 5,
          base_rate: 0.01, // 1% 基础释放率
          boost_rate: 0,
          compound_count: 0,
          compound_level: 0,
          restart_count: 0,
          last_release_date: null,
          last_checkin_date: null,
          created_at: timestamp,
          expires_at: null
        }

        allCards.push(machine)
      }

      // 9. 保存学习卡到localStorage
      localStorage.setItem(storageKey, JSON.stringify(allCards))

      // 10. 记录交易流水
      const transactions = JSON.parse(localStorage.getItem('user_transactions') || '[]')
      transactions.push({
        id: `tx-${Date.now()}-exchange`,
        user_id: userId,
        type: 'exchange_learning_card',
        amount: -totalCost,
        balance_after: newBalance,
        currency: 'U',
        description: `兑换${quantity}张AI学习卡（${totalCost}U）`,
        created_at: timestamp
      })
      localStorage.setItem('user_transactions', JSON.stringify(transactions))

      console.log(`✅ 成功兑换${quantity}张学习卡，余额：${currentBalance} → ${newBalance}`)

      return {
        success: true,
        data: allCards[allCards.length - 1] as MiningMachine,
        message: `🎉 成功兑换${quantity}张AI学习卡！请每日签到启动释放积分`
      }
    } catch (error) {
      console.error('兑换失败:', error)
      return this.handleError(error)
    }
  }

  /**
   * ✅ 用积分兑换学习卡（100积分 = 1张学习卡）
   * 注意：需要代理身份（已加入Binary系统）
   */
  static async purchaseMachineWithPoints(
    userId: string,
    quantity: number = 1,
    machineType: 'type1' | 'type2' | 'type3' = 'type1'
  ): Promise<ApiResponse<MiningMachine>> {
    this.validateRequired({ userId, quantity }, ['userId', 'quantity'])

    try {
      // 1. 验证数量
      if (quantity < 1 || quantity > 10) {
        return { success: false, error: '每次兑换数量必须在1-10张之间' }
      }

      // 2. 从localStorage获取当前用户信息
      const userSession = localStorage.getItem('user_session')
      if (!userSession) {
        return { success: false, error: '请先登录' }
      }

      let user
      try {
        user = JSON.parse(userSession)
        if (user.id !== userId) {
          return { success: false, error: '用户ID不匹配' }
        }
      } catch (e) {
        return { success: false, error: '用户数据异常' }
      }

      // 3. 必须是代理身份
      if (!user.is_agent) {
        return {
          success: false,
          error: '请先加入Binary对碰系统（30U）才能兑换学习卡'
        }
      }

      // 4. 检查学习卡数量限制
      const storageKey = 'user_learning_cards'
      const allCards = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const userCards = allCards.filter((card: any) => card.user_id === userId)

      if (userCards.length + quantity > 10) {
        return {
          success: false,
          error: '已达到最大学习卡数量限制（10张）'
        }
      }

      // 5. 计算费用（100积分 × 数量）
      const totalCost = 100 * quantity

      // 6. 检查积分余额
      const currentPoints = Number(user.transfer_points) || 0
      if (currentPoints < totalCost) {
        return {
          success: false,
          error: `积分不足，需要${totalCost}积分，当前${currentPoints.toFixed(0)}积分`
        }
      }

      // 7. 扣除积分（使用WalletManager原子操作）
      const { WalletManager } = await import('@/wallet/WalletManager')
      await WalletManager.deductTransferPoints(
        userId,
        totalCost,
        'exchange_learning_card',
        `兑换${quantity}张AI学习卡（${totalCost}积分）`
      )

      // 8. 从数据库重新加载用户数据（确保数据一致）
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError || !updatedUser) {
        console.error('获取用户数据失败:', fetchError)
        return { success: false, error: '获取用户数据失败' }
      }

      // 9. 更新localStorage用户数据
      localStorage.setItem('user_session', JSON.stringify(updatedUser))

      // 10. 批量创建学习卡
      const timestamp = new Date().toISOString()

      for (let i = 0; i < quantity; i++) {
        const machine = {
          id: `lc-${Date.now()}-${i}`,
          user_id: userId,
          type: machineType,
          status: 'inactive',
          is_active: false,
          total_points: 300, // 3倍出局
          released_points: 0,
          daily_output: 5,
          base_rate: 0.01, // 1% 基础释放率
          boost_rate: 0,
          compound_count: 0,
          compound_level: 0,
          restart_count: 0,
          last_release_date: null,
          last_checkin_date: null,
          created_at: timestamp,
          expires_at: null
        }

        allCards.push(machine)
      }

      // 11. 保存学习卡到localStorage
      localStorage.setItem(storageKey, JSON.stringify(allCards))

      console.log(`✅ 成功用积分兑换${quantity}张学习卡`)

      return {
        success: true,
        data: allCards[allCards.length - 1] as MiningMachine,
        message: `🎉 成功兑换${quantity}张AI学习卡！请每日签到启动释放积分`
      }
    } catch (error) {
      console.error('积分兑换失败:', error)
      return this.handleError(error)
    }
  }

  /**
   * 每日释放积分（V3.0：70%转U，30%互转积分，10%基础释放率，2倍出局，20天完成）
   * 注意：出局后自动停止，不再释放
   */
  static async releaseDailyPoints(machineId: string): Promise<number> {
    try {
      // 获取学习卡信息（只查询运行中的）
      const { data: machine, error } = await supabase
        .from('mining_machines')
        .select('*')
        .eq('id', machineId)
        .eq('is_active', true)
        .single()

      if (error || !machine) {
        console.log(`学习卡 ${machineId} 未找到或已停止`)
        return 0
      }

      // 计算每日释放量（基于总产出，而非初始投入）
      const dailyReleaseRate = machine.base_rate
      const dailyRelease = machine.total_points * dailyReleaseRate
      
      // 检查是否会超过total_points（3倍出局）
      const potentialRelease = machine.released_points + dailyRelease
      let actualRelease = dailyRelease
      let shouldExit = false

      if (potentialRelease >= machine.total_points) {
        // 只释放到total_points为止，然后出局
        actualRelease = machine.total_points - machine.released_points
        shouldExit = true
      }

      // 如果没有可释放的了，直接出局
      if (actualRelease <= 0) {
        await supabase
          .from('mining_machines')
          .update({
            is_active: false,
            exited_at: new Date().toISOString()
          })
          .eq('id', machineId)
        
        return 0
      }

      // 更新学习卡释放记录
      const updateData: any = {
        released_points: machine.released_points + actualRelease
      }

      if (shouldExit) {
        updateData.is_active = false
        updateData.exited_at = new Date().toISOString()
        updateData.released_points = machine.total_points
      }

      const { error: updateError } = await supabase
        .from('mining_machines')
        .update(updateData)
        .eq('id', machineId)

      if (updateError) throw updateError

      // 🔥 核心逻辑：自动分配积分（V3.0：70%转U，30%互转）
      // 70%转U（100积分=8U，所以1积分=0.08U）
      const toU = actualRelease * 0.70
      const uAmount = toU * 0.08 // 1积分=0.08U
      
      await WalletManager.add(
        machine.user_id,
        uAmount,
        'mining_release',
        `AI学习卡每日释放${actualRelease.toFixed(2)}积分：${toU.toFixed(2)}积分自动兑换${uAmount.toFixed(2)}U${shouldExit ? '（已出局，停止释放）' : ''}`
      )

      // 30%转互转积分（给团队新伙伴学习AI）
      const toTransfer = actualRelease * 0.30
      
      await WalletManager.addTransferPoints(
        machine.user_id,
        toTransfer,
        'mining_release',
        `AI学习卡每日释放${toTransfer.toFixed(2)}互转积分（可赠送团队）${shouldExit ? '（已出局）' : ''}`
      )

      if (shouldExit) {
        console.log(`✅ 学习卡 ${machineId} 已完成学习，累计释放${machine.total_points}积分，已2倍出局`)
      }

      return actualRelease
    } catch (error) {
      console.error('释放积分失败:', error)
      return 0
    }
  }

  /**
   * 每日签到（V4.0新增：必须签到才释放）- localStorage版本 + 防并发保护
   */
  static async checkin(userId: string): Promise<ApiResponse<{ 
    checkedInCount: number
    totalReleased: number
    releaseRate: number
  }>> {
    this.validateRequired({ userId }, ['userId'])

    // 🔒 防并发保护：声明签到锁key（在try外声明，确保catch也能访问）
    const CHECKIN_LOCK_KEY = `checkin_lock_${userId}`

    try {
      const today = new Date().toISOString().split('T')[0]

      // 🔒 检查签到锁
      const lockTime = parseInt(localStorage.getItem(CHECKIN_LOCK_KEY) || '0')
      const now = Date.now()
      
      if (lockTime && (now - lockTime) < 3000) {
        return {
          success: false,
          error: '签到处理中，请稍候...'
        }
      }
      
      // 🔒 加锁（3秒有效期）
      localStorage.setItem(CHECKIN_LOCK_KEY, now.toString())

      // 1. 从localStorage获取用户所有学习卡
      const storageKey = 'user_learning_cards'
      const allCards = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const userCards = allCards.filter((card: any) => card.user_id === userId)

      if (userCards.length === 0) {
        // 🔓 释放锁
        localStorage.removeItem(CHECKIN_LOCK_KEY)
        
        return {
          success: false,
          error: '您还没有学习卡，请先兑换学习卡'
        }
      }

      // 过滤未出局的学习卡
      const activeCards = userCards.filter((card: any) => 
        card.released_points < card.total_points
      )

      if (activeCards.length === 0) {
        // 🔓 释放锁
        localStorage.removeItem(CHECKIN_LOCK_KEY)
        
        return {
          success: false,
          error: '您没有可签到的学习卡'
        }
      }

      // 2. 检查今天是否已签到
      const alreadyCheckedIn = activeCards.some((card: any) => 
        card.last_checkin_date === today
      )
      if (alreadyCheckedIn) {
        // 🔓 释放锁
        localStorage.removeItem(CHECKIN_LOCK_KEY)
        
        return {
          success: false,
          error: '今天已签到，明天再来吧！'
        }
      }

      // 3. ✅ 计算释放率（根据直推人数动态计算：1人=3%，3人=9%，5人=15%）
      const releaseRate = await this.calculateReleaseRate(userId)
      console.log(`✅ 当前释放率：${(releaseRate * 100).toFixed(1)}%`)

      // 4. 批量签到并释放
      let totalReleased = 0
      let checkedInCount = 0

      for (const card of activeCards) {
        // 计算今日释放量
        const dailyRelease = card.total_points * releaseRate
        card.released_points = Number((card.released_points + dailyRelease).toFixed(2))
        
        // 更新签到状态
        card.last_checkin_date = today
        card.is_active = true
        card.status = 'active'
        card.boost_rate = 0

        // 检查是否出局
        if (card.released_points >= card.total_points) {
          card.released_points = card.total_points
          card.is_active = false
          card.status = 'finished'
        }

        totalReleased += dailyRelease
        checkedInCount++
      }

      // 5. 保存更新后的学习卡到localStorage
      localStorage.setItem(storageKey, JSON.stringify(allCards))
      
      console.log('✅ 签到完成，已更新学习卡:', activeCards.map(c => ({
        id: c.id.slice(-4),
        released: c.released_points,
        total: c.total_points,
        progress: `${((c.released_points / c.total_points) * 100).toFixed(1)}%`
      })))

      // 6. 分配释放的积分到用户账户
      // 80% 转 U (兑换价：100积分=8U，即1积分=0.08U)
      const toU = totalReleased * 0.80
      const uAmount = toU * 0.08 // 1积分 = 0.08U (100积分=8U)
      
      // 20% 充学分（学习AI）
      const toBurn = totalReleased * 0.20

      // 更新用户余额（同时更新 Supabase 和 localStorage）
      const userSession = localStorage.getItem('user_session')
      if (!userSession) {
        console.error('未找到用户会话')
        return {
          success: false,
          error: '用户会话已失效，请重新登录'
        }
      }
      
      let user
      try {
        user = JSON.parse(userSession)
      } catch (e) {
        console.error('用户数据解析失败')
        return {
          success: false,
          error: '用户数据异常'
        }
      }
      
      // 防御性检查：确保所有余额字段都是有效数字
      const currentUBalance = Number(user.u_balance) || 0
      
      // 计算新余额
      const newUBalance = Number((currentUBalance + uAmount).toFixed(2))
      
      // 更新 Supabase 余额
      const { error: updateError } = await supabase
        .from('users')
        .update({ u_balance: newUBalance })
        .eq('id', userId)
      
      if (updateError) {
        console.error('更新Supabase余额失败:', updateError)
      }
      
      // 更新 localStorage 余额（保持同步）
      user.u_balance = newUBalance
      localStorage.setItem('user_session', JSON.stringify(user))
      
      // ✅ V5.2：同步更新 binary_members.total_earnings（用于复投计算）
      const { error: binaryError } = await supabase
        .from('binary_members')
        .update({
          total_earnings: supabase.raw(`COALESCE(total_earnings, 0) + ${uAmount}`)
        })
        .eq('user_id', userId)
      
      if (!binaryError) {
        console.log(`✅ 学习卡收益已计入复投：+${uAmount.toFixed(2)}U`)
      }
      
      // 7. ✅ 记录签到释放流水（增强版）
      let transactionCreated = false
      let retryCount = 0
      const maxRetries = 3
      
      while (!transactionCreated && retryCount < maxRetries) {
        try {
          const transactions = JSON.parse(localStorage.getItem('user_transactions') || '[]')
          const timestamp = new Date().toISOString()
          
          const newTransaction = {
            id: `tx-${Date.now()}-${retryCount}-checkin`,
            user_id: userId,
            type: 'checkin_release',
            amount: uAmount,
            balance_after: newUBalance,
            currency: 'U',
            description: `签到释放：${totalReleased.toFixed(2)}积分 → ${uAmount.toFixed(2)}U（释放率${(releaseRate * 100).toFixed(1)}%）+ ${toBurn.toFixed(2)}积分销毁`,
            metadata: {
              cards_count: checkedInCount,
              total_released: totalReleased,
              to_u: uAmount,
              to_burn: toBurn,
              release_rate: releaseRate
            },
            created_at: timestamp
          }
          
          transactions.push(newTransaction)
          
          // 尝试写入localStorage
          try {
            localStorage.setItem('user_transactions', JSON.stringify(transactions))
          } catch (storageError) {
            // 如果localStorage满了，清理旧记录
            console.warn(`⚠️ localStorage写入失败(尝试${retryCount + 1}/${maxRetries})，尝试清理...`)
            
            // 只保留最近100条记录
            if (transactions.length > 100) {
              const recentTransactions = transactions.slice(-100)
              localStorage.setItem('user_transactions', JSON.stringify(recentTransactions))
              console.log(`🧹 已清理旧记录，保留最近100条`)
              retryCount++
              continue
            } else {
              throw storageError
            }
          }
          
          console.log(`✅ 签到释放：${totalReleased.toFixed(2)}积分`)
          console.log(`   余额变化：U ${currentUBalance} → ${newUBalance} (+${uAmount.toFixed(2)})`)
          console.log(`   🔥 销毁：${toBurn.toFixed(2)}积分（防泡沫）`)
          console.log(`   📝 交易记录已创建: ${newTransaction.id}`)
          console.log(`   📊 当前共有${transactions.length}条交易记录`)
          
          // 验证记录是否成功保存
          const savedTransactions = JSON.parse(localStorage.getItem('user_transactions') || '[]')
          const recordFound = savedTransactions.some((tx: any) => tx.id === newTransaction.id)
          
          if (!recordFound) {
            console.error(`⚠️ 交易记录验证失败(尝试${retryCount + 1}/${maxRetries})`)
            retryCount++
          } else {
            console.log(`✅ 交易记录保存验证成功`)
            transactionCreated = true
          }
        } catch (txError) {
          console.error(`❌ 创建交易记录失败(尝试${retryCount + 1}/${maxRetries}):`, txError)
          retryCount++
          
          if (retryCount >= maxRetries) {
            console.error('❌ 交易记录创建彻底失败，但签到仍然成功')
          }
        }
      }
      
      if (!transactionCreated) {
        console.warn('⚠️ 警告：签到成功但交易记录未创建，收益记录页面可能不显示本次签到')
      }

      // 🔓 释放锁（成功时）
      localStorage.removeItem(CHECKIN_LOCK_KEY)

      return {
        success: true,
        data: {
          checkedInCount,
          totalReleased,
          releaseRate
        },
        message: `✅ 签到成功！${checkedInCount}张学习卡开始释放\n释放率：${(releaseRate * 100).toFixed(1)}%\n本次释放：${totalReleased.toFixed(2)}积分（${uAmount.toFixed(2)}U + ${toBurn.toFixed(2)}积分自动清0）`
      }
    } catch (error) {
      // 🔓 释放锁（失败时）
      localStorage.removeItem(CHECKIN_LOCK_KEY)
      
      return this.handleError(error)
    }
  }

  /**
   * ✅ 计算释放率（正确公式：基础1% + 每人3% = 最高15%）
   */
  private static async calculateReleaseRate(userId: string): Promise<number> {
    try {
      // 1. ✅ 从直推关系表查询直推人数
      const { count, error } = await supabase
        .from('referral_relationships')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', userId)
        .eq('is_active', true)

      if (error) {
        console.error('查询直推数量失败:', error)
        return 0.01  // 降级返回基础释放率
      }

      const referralCount = count || 0

      // 2. ✅ 计算释放率（正确公式）
      // 没有直推 → 保底1%
      // 有直推 → 直接按 3% × 人数（最高15%）
      // 0个直推：1%（保底）
      // 1个直推：3%
      // 2个直推：6%
      // 3个直推：9%
      // 4个直推：12%
      // 5个或以上：15%（封顶）
      let finalRate: number
      if (referralCount === 0) {
        finalRate = 0.01  // 没有直推，保底1%
      } else {
        finalRate = Math.min(referralCount * 0.03, 0.15)  // 有直推，3% × 人数，最高15%
      }

      console.log(`✅ 释放率计算: ${referralCount}个直推 → ${(finalRate * 100).toFixed(1)}%`)

      return finalRate
    } catch (error) {
      console.error('计算释放率失败:', error)
      return 0.01  // 降级返回基础释放率
    }
  }

  /**
   * V4.4 每日释放积分（签到后执行，85%到账U，15%自动清0）
   */
  private static async releaseDailyPointsV4(machineId: string, releaseRate: number): Promise<number> {
    try {
      // 获取学习卡信息
      const { data: machine, error } = await supabase
        .from('mining_machines')
        .select('*')
        .eq('id', machineId)
        .single()

      if (error || !machine) {
        console.log(`学习卡 ${machineId} 未找到`)
        return 0
      }

      // 计算每日释放量（基于总产出300积分，而非初始100积分）
      const dailyRelease = machine.total_points * releaseRate
      
      // 检查是否会超过total_points（3倍出局）
      const potentialRelease = machine.released_points + dailyRelease
      let actualRelease = dailyRelease
      let shouldExit = false

      if (potentialRelease >= machine.total_points) {
        // 只释放到total_points为止，然后出局
        actualRelease = machine.total_points - machine.released_points
        shouldExit = true
      }

      if (actualRelease <= 0) {
        // 已经出局
        await supabase
          .from('mining_machines')
          .update({
            is_active: false,
            status: 'exited',
            exited_at: new Date().toISOString()
          })
          .eq('id', machineId)
        
        return 0
      }

      // 分配：85%到账U，15%自动清0
      const toU = actualRelease * AILearningConfig.DISTRIBUTION.TO_U_PERCENT
      const toBurn = actualRelease * AILearningConfig.DISTRIBUTION.TO_BURN_PERCENT

      // 85%转U余额
      const uAmount = toU * 0.08 // 100积分 = 8U，所以积分×0.08=U
      await WalletManager.add(
        machine.user_id,
        uAmount,
        'u_balance',
        'mining_release',
        `AI学习卡释放${toU.toFixed(2)}积分，兑换${uAmount.toFixed(2)}U`
      )

      // 15%自动清0（记录日志即可，不实际存储）
      console.log(`学习卡 ${machineId} 自动清0 ${toBurn.toFixed(2)} 积分`)

      // 更新学习卡释放记录
      const updateData: any = {
        released_points: machine.released_points + actualRelease
      }

      if (shouldExit) {
        updateData.is_active = false
        updateData.status = 'exited'
        updateData.exited_at = new Date().toISOString()
        updateData.released_points = machine.total_points
      }

      await supabase
        .from('mining_machines')
        .update(updateData)
        .eq('id', machineId)

      // 记录释放日志
      await supabase
        .from('daily_releases')
        .insert({
          user_id: machine.user_id,
          machine_id: machineId,
          release_date: new Date().toISOString().split('T')[0],
          points_to_u: toU,
          points_burned: toBurn,
          u_amount: uAmount,
          release_rate: releaseRate
        })

      return actualRelease
    } catch (error) {
      console.error(`释放积分失败 (${machineId}):`, error)
      return 0
    }
  }

  /**
   * 批量释放所有活跃矿机（V3.0旧方法，保留兼容性）
   */
  static async releaseAllMachines(): Promise<void> {
    try {
      const { data: machines, error } = await supabase
        .from('mining_machines')
        .select('id')
        .eq('is_active', true)

      if (error || !machines) {
        return
      }

      // 并发释放所有矿机
      const releasePromises = machines.map(machine => 
        this.releaseDailyPoints(machine.id)
      )

      await Promise.all(releasePromises)
    } catch (error) {
      console.error('批量释放失败:', error)
    }
  }

  /**
   * 积分兑换U（使用新架构 - 自动验证+流水）
   */
  static async convertPointsToU(
    userId: string,
    pointsAmount: number
  ): Promise<ApiResponse<{ receivedU: number; returnedPoints: number }>> {
    this.validateRequired({ userId, pointsAmount }, ['userId', 'pointsAmount'])

    try {
      // 1. 参数验证
      if (pointsAmount <= 0) {
        return { success: false, error: '兑换积分必须大于0' }
      }

      // 2. 验证积分余额（使用BalanceValidator）
      await BalanceValidator.checkPointsSufficient(userId, pointsAmount, 'convert')

      // 3. 获取用户信息
      const user = await UserRepository.findById(userId)

      // 4. 计算兑换结果
      const totalU = pointsAmount * MiningConfig.POINTS_TO_U_RATE
      const receivedU = totalU * MiningConfig.U_PERCENTAGE
      const returnedPoints = pointsAmount * MiningConfig.POINTS_PERCENTAGE

      // 5. 扣除积分（使用WalletManager）
      await WalletManager.deductPoints(
        userId,
        pointsAmount,
        'points_convert',
        `积分兑换：${pointsAmount}积分 → ${receivedU.toFixed(2)}U`
      )

      // 6. 增加U余额
      await WalletManager.add(
        userId,
        receivedU,
        'points_convert',
        `积分兑换获得${receivedU.toFixed(2)}U`
      )

      // 7. 返还30%积分
      if (returnedPoints > 0) {
        await WalletManager.addPoints(
          userId,
          returnedPoints,
          'points_convert',
          `积分兑换返还${returnedPoints.toFixed(2)}积分`
        )
      }

      return {
        success: true,
        data: {
          receivedU,
          returnedPoints
        },
        message: `成功兑换！获得${receivedU.toFixed(2)}U + 返还${returnedPoints.toFixed(2)}积分`
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 更新矿机加速率
   * 当用户直推数量变化时调用
   */
  static async updateMachineBoost(userId: string): Promise<void> {
    try {
      // 获取用户当前直推数
      const user = await UserRepository.findById(userId)

      // 计算新的加速率（最多10%）
      const potentialBoostRate = user.direct_referral_count * MiningConfig.BOOST_PER_REFERRAL
      const boostRate = Math.min(potentialBoostRate, MiningConfig.MAX_BOOST_RATE)
      const actualBoostCount = Math.floor(boostRate / MiningConfig.BOOST_PER_REFERRAL)

      // 更新所有活跃矿机的加速率
      const { error: updateError } = await supabase
        .from('mining_machines')
        .update({
          boost_rate: boostRate,
          boost_count: actualBoostCount
        })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (updateError) {
        console.error('更新矿机加速率失败:', updateError)
      }
    } catch (error) {
      console.error('更新矿机加速失败:', error)
    }
  }

  /**
   * 复利滚存（V3.0新功能）
   * 出局后可选择复利滚存：2倍→4倍→8倍→16倍...
   * 免费，无需额外支付，积分滚存到下一轮
   */
  static async compoundReinvest(machineId: string): Promise<ApiResponse<boolean>> {
    this.validateRequired({ machineId }, ['machineId'])

    try {
      // 获取学习卡信息
      const { data: machine, error } = await supabase
        .from('mining_machines')
        .select('*')
        .eq('id', machineId)
        .single()

      if (error || !machine) {
        return { success: false, error: '学习卡不存在' }
      }

      if (machine.is_active) {
        return { success: false, error: '学习卡还在学习中，请等待出局后再选择复利滚存' }
      }

      // 获取当前复利等级
      const currentLevel = machine.compound_level || 0
      const nextLevel = currentLevel + 1

      // 检查是否超出复利倍数上限
      if (nextLevel >= MiningConfig.COMPOUND_MULTIPLIERS.length) {
        return { 
          success: false, 
          error: `已达到最高复利等级（${MiningConfig.COMPOUND_MULTIPLIERS[MiningConfig.COMPOUND_MULTIPLIERS.length - 1]}倍）` 
        }
      }

      // 计算新的出局倍数
      const nextMultiplier = MiningConfig.COMPOUND_MULTIPLIERS[nextLevel]
      const newTotalPoints = machine.initial_points * nextMultiplier

      // 复利滚存：积分清0，重新开始
      const { error: updateError } = await supabase
        .from('mining_machines')
        .update({
          is_active: true,
          total_points: newTotalPoints,
          released_points: 0,
          exited_at: null,
          compound_level: nextLevel,
          restart_count: (machine.restart_count || 0) + 1,
          last_restart_at: new Date().toISOString()
        })
        .eq('id', machineId)

      if (updateError) throw updateError

      console.log(`💎 学习机 ${machineId} 复利滚存成功，${nextMultiplier}倍出局（${newTotalPoints}积分）`)

      return {
        success: true,
        data: true,
        message: `💎 复利滚存成功！学习机升级为${nextMultiplier}倍出局（${newTotalPoints}积分），5%日释放率`
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 手动重启学习机（V3.0：2倍出局，所有积分清0销毁）
   * 重启后重新开始2倍出局，所有累计积分清零销毁
   */
  static async manualRestart(machineId: string): Promise<ApiResponse<boolean>> {
    this.validateRequired({ machineId }, ['machineId'])

    try {
      // 获取学习机信息
      const { data: machine, error } = await supabase
        .from('mining_machines')
        .select('*')
        .eq('id', machineId)
        .single()

      if (error || !machine) {
        return { success: false, error: '学习机不存在' }
      }

      if (machine.is_active) {
        return { success: false, error: '学习机还在学习中，无需重启' }
      }

      // 🔥 V4.0 重启机制：所有积分清0销毁，重新开始3倍出局
      const newTotalPoints = machine.initial_points * AILearningConfig.MACHINE.EXIT_MULTIPLIER // 3倍 = 300积分
      
      const { error: updateError } = await supabase
        .from('mining_machines')
        .update({
          is_active: true,
          total_points: newTotalPoints,
          released_points: 0,
          exited_at: null,
          restart_count: (machine.restart_count || 0) + 1,
          last_restart_at: new Date().toISOString(),
          compound_level: 0 // 重启重置复利等级
        })
        .eq('id', machineId)

      if (updateError) throw updateError

      console.log(`🔄 学习卡 ${machineId} 重启成功，3倍出局（${newTotalPoints}积分），所有积分已清0销毁`)

      return {
        success: true,
        data: true,
        message: `🔄 重启成功！所有积分清0销毁，学习卡重新开始3倍出局（${newTotalPoints}积分），2-20%释放率`
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 自动重启学习机（批量处理所有已出局的学习机）
   * V3.0：2倍出局，所有积分清0销毁
   */
  static async autoRestartAllExited(): Promise<void> {
    try {
      // 获取所有已出局的学习机
      const { data: machines, error } = await supabase
        .from('mining_machines')
        .select('*')
        .eq('is_active', false)
        .not('exited_at', 'is', null)

      if (error || !machines || machines.length === 0) {
        return
      }

      // 批量重启
      for (const machine of machines) {
        const newTotalPoints = machine.initial_points * AILearningConfig.MACHINE.EXIT_MULTIPLIER // 3倍

        await supabase
          .from('mining_machines')
          .update({
            is_active: true,
            total_points: newTotalPoints,
            released_points: 0,
            exited_at: null,
            restart_count: (machine.restart_count || 0) + 1,
            last_restart_at: new Date().toISOString(),
            compound_level: 0
          })
          .eq('id', machine.id)

        console.log(`自动重启学习机 ${machine.id}，2倍出局，积分已清0销毁`)
      }
    } catch (error) {
      console.error('自动重启失败:', error)
    }
  }

  /**
   * 获取重启状态
   */
  static async getRestartStats(userId: string): Promise<ApiResponse<{
    totalRestarts: number
    exitedMachines: number
    activeMachines: number
  }>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      const { data: machines, error } = await supabase
        .from('mining_machines')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      const totalRestarts = machines?.reduce((sum, m) => sum + (m.restart_count || 0), 0) || 0
      const exitedMachines = machines?.filter(m => !m.is_active).length || 0
      const activeMachines = machines?.filter(m => m.is_active).length || 0

      return {
        success: true,
        data: {
          totalRestarts,
          exitedMachines,
          activeMachines
        }
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取用户矿机统计
   */
  static async getUserMachineStats(userId: string): Promise<ApiResponse<{
    totalMachines: number
    activeMachines: number
    totalReleased: number
    dailyIncome: number
  }>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      const { data: machines, error } = await supabase
        .from('mining_machines')
        .select('*')
        .eq('user_id', userId)

      if (error || !machines) {
        return {
          success: true,
          data: {
            totalMachines: 0,
            activeMachines: 0,
            totalReleased: 0,
            dailyIncome: 0
          }
        }
      }

      const activeMachines = machines.filter(m => m.is_active)
      const totalReleased = machines.reduce((sum, m) => sum + m.released_points, 0)
      const dailyIncome = activeMachines.reduce(
        (sum, m) => sum + m.initial_points * (m.base_rate + m.boost_rate),
        0
      )

      return {
        success: true,
        data: {
          totalMachines: machines.length,
          activeMachines: activeMachines.length,
          totalReleased,
          dailyIncome
        }
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取用户的矿机列表
   */
  static async getUserMachines(
    userId: string,
    activeOnly: boolean = false
  ): Promise<ApiResponse<MiningMachine[]>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      let query = supabase
        .from('mining_machines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      const { data: machines, error } = await query

      if (error) throw error

      return {
        success: true,
        data: machines || []
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 批量触发每日释放（用于管理员手动触发或定时任务）
   * 
   * @returns 成功释放的学习机数量和总释放金额
   */
  static async triggerAllDailyReleases(): Promise<ApiResponse<{
    processedCount: number
    totalReleased: number
    exitedCount: number
  }>> {
    try {
      console.log('🚀 开始批量触发每日释放...')
      
      // 1. 获取所有活跃的学习机
      const { data: activeMachines, error } = await supabase
        .from('mining_machines')
        .select('*')
        .eq('is_active', true)
      
      if (error) throw error
      
      if (!activeMachines || activeMachines.length === 0) {
        return {
          success: true,
          data: {
            processedCount: 0,
            totalReleased: 0,
            exitedCount: 0
          },
          message: '暂无活跃的学习机'
        }
      }
      
      console.log(`📊 找到 ${activeMachines.length} 台活跃学习机`)
      
      // 2. 逐个处理
      let processedCount = 0
      let totalReleased = 0
      let exitedCount = 0
      
      for (const machine of activeMachines) {
        try {
          const released = await this.releaseDailyPoints(machine.id)
          
          if (released > 0) {
            processedCount++
            totalReleased += released
            
            // 检查是否已出局
            const { data: updatedMachine } = await supabase
              .from('mining_machines')
              .select('is_active')
              .eq('id', machine.id)
              .single()
            
            if (updatedMachine && !updatedMachine.is_active) {
              exitedCount++
            }
          }
        } catch (error) {
          console.error(`❌ 学习机 ${machine.id} 释放失败:`, error)
          // 继续处理其他学习机
        }
      }
      
      console.log(`✅ 批量释放完成:`)
      console.log(`   - 处理数量: ${processedCount}/${activeMachines.length}`)
      console.log(`   - 总释放量: ${totalReleased.toFixed(2)} 积分`)
      console.log(`   - 出局数量: ${exitedCount}`)
      
      return {
        success: true,
        data: {
          processedCount,
          totalReleased,
          exitedCount
        },
        message: `成功处理 ${processedCount} 台学习机，总释放 ${totalReleased.toFixed(2)} 积分`
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取活跃学习机统计信息（用于管理面板显示）
   */
  static async getActiveStats(): Promise<ApiResponse<{
    totalActive: number
    totalUsers: number
    totalInvested: number
    totalReleased: number
  }>> {
    try {
      // 1. 统计活跃学习机
      const { data: activeMachines, error: activeError } = await supabase
        .from('mining_machines')
        .select('initial_points, released_points, user_id')
        .eq('is_active', true)
      
      if (activeError) throw activeError
      
      // 2. 计算统计数据
      const totalActive = activeMachines?.length || 0
      const uniqueUsers = new Set(activeMachines?.map(m => m.user_id) || []).size
      const totalInvested = activeMachines?.reduce((sum, m) => sum + m.initial_points, 0) || 0
      const totalReleased = activeMachines?.reduce((sum, m) => sum + m.released_points, 0) || 0
      
      return {
        success: true,
        data: {
          totalActive,
          totalUsers: uniqueUsers,
          totalInvested,
          totalReleased
        }
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 自动重启检测（V4.0新增：防泡沫机制）
   * 后端定时任务调用，当总释放积分 > 新充值积分时自动重启
   */
  static async checkAndRestart(): Promise<ApiResponse<{
    shouldRestart: boolean
    totalReleased: number
    totalExchanged: number
    message: string
  }>> {
    try {
      // 1. 统计总释放积分（所有学习卡累计释放）
      const { data: machines, error: machinesError } = await supabase
        .from('mining_machines')
        .select('released_points')

      if (machinesError) throw machinesError

      const totalReleased = machines?.reduce((sum, m) => sum + (m.released_points || 0), 0) || 0

      // 2. 统计新兑换积分（从wallet_transactions查询exchange_learning_card类型）
      const { data: transactions, error: txError } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('transaction_type', 'exchange_learning_card')

      if (txError) throw txError

      const totalExchanged = (transactions?.length || 0) * AILearningConfig.MACHINE.COST // 每次兑换100积分

      console.log(`💡 泡沫检测：总释放 ${totalReleased} vs 总兑换 ${totalExchanged}`)

      // 3. 判断是否需要重启
      const shouldRestart = totalReleased > totalExchanged

      if (shouldRestart && AILearningConfig.RESTART.AUTO_ENABLED) {
        console.log('⚠️ 检测到泡沫过大，触发自动重启！')
        await this.systemRestart()
        
        return {
          success: true,
          data: {
            shouldRestart: true,
            totalReleased,
            totalExchanged,
            message: '系统已自动重启，所有积分已清0'
          }
        }
      }

      return {
        success: true,
        data: {
          shouldRestart: false,
          totalReleased,
          totalExchanged,
          message: '系统正常，无需重启'
        }
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 系统重启（清空所有学习卡积分）
   */
  private static async systemRestart(): Promise<void> {
    try {
      console.log('🔄 开始系统重启...')

      // 1. 清空所有学习卡积分
      const { error: updateError } = await supabase
        .from('mining_machines')
        .update({
          released_points: 0,
          status: 'restarted',
          is_active: false,
          restart_count: (machine.restart_count || 0) + 1
        })
        .in('status', ['active', 'inactive', 'exited'])

      if (updateError) throw updateError

      // 2. 记录重启日志
      const { error: logError } = await supabase
        .from('system_logs')
        .insert({
          event: 'auto_restart',
          reason: 'prevent_bubble',
          details: {
            timestamp: new Date().toISOString(),
            trigger: 'total_released_gt_exchanged'
          }
        })

      if (logError) {
        console.error('记录重启日志失败:', logError)
      }

      console.log('✅ 系统重启完成，所有学习卡积分已清0')
    } catch (error) {
      console.error('❌ 系统重启失败:', error)
      throw error
    }
  }

  /**
   * 管理员手动重启系统（V4.0新增）
   */
  static async adminManualRestart(adminId: string): Promise<ApiResponse<void>> {
    this.validateRequired({ adminId }, ['adminId'])

    try {
      // 验证管理员权限
      const { data: admin, error: adminError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', adminId)
        .single()

      if (adminError || !admin?.is_admin) {
        return {
          success: false,
          error: '无权限执行此操作'
        }
      }

      // 执行重启
      await this.systemRestart()

      // 记录手动重启日志
      await supabase
        .from('system_logs')
        .insert({
          event: 'manual_restart',
          reason: 'admin_operation',
          details: {
            admin_id: adminId,
            timestamp: new Date().toISOString()
          }
        })

      return {
        success: true,
        message: '✅ 系统已手动重启，所有学习卡积分已清0'
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 错误处理辅助方法
   */
  private static handleError(error: any): ApiResponse {
    console.error('MiningService Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '操作失败'
    }
  }
}

