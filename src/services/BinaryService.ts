/**
 * BinaryService - 双轨制二元系统服务 V3.0
 * 更新日期：2025-10-07
 * 
 * 核心功能：
 * 1. AI自动排线（弱区优先，1:1平衡）
 * 2. 1:1对碰奖励（秒结算，85%到账）
 * 3. 8代平级奖励（串糖葫芦式直推链）
 * 4. 复投机制（300U提示，30U复投）
 * 5. 分红结算（直推≥10人，15%分红）
 */

import { BaseService, type ApiResponse } from './BaseService'
import { UserRepository } from '@/repositories'
import { WalletManager } from '@/wallet'
import { BinaryConfig, type BinarySide, calculatePairingBonus, calculateLevelBonus } from '@/config/binary'
import { supabase } from '@/lib/supabase'
import { DividendService } from './DividendService'

export class BinaryService extends BaseService {
  /**
   * 加入双轨制系统
   * 注意：此方法由AgentService自动调用，用户成为代理时自动加入
   * 费用已在AgentService中扣除，此处不再重复扣费
   */
  static async joinBinarySystem(userId: string): Promise<ApiResponse<any>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      // 1. 检查用户是否已加入
      const { data: existing } = await supabase
        .from('binary_members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (existing) {
        return { success: false, error: '您已经加入双轨制系统' }
      }

      // 2. 获取用户邀请人（不再扣费，AgentService已扣除）
      const user = await UserRepository.findById(userId)
      
      // 3. AI自动排线
      const placement = await this.autoPlacement(user.inviter_id || null)

      // 4. 创建二元会员记录（一点多单制：初始1单）
      const { data: member, error } = await supabase
        .from('binary_members')
        .insert({
          user_id: userId,
          upline_id: placement.uplineId,
          position_side: placement.side,
          position_depth: placement.depth,
          order_count: 1, // ✅ 一点多单制：初始1单
          a_side_count: 0,
          b_side_count: 0,
          a_side_pending: 0,
          b_side_pending: 0,
          total_pairing_bonus: 0,
          total_level_bonus: 0,
          total_dividend: 0,
          total_earnings: 0,
          is_active: true,
          reinvest_count: 0
        })
        .select()
        .single()

      if (error) throw error

      // 5. 更新上级的区域计数（传入订单数量，不是固定1）
      await this.updateUplineCount(placement.uplineId, placement.side, 1)

      // 6. 触发对碰计算
      await this.calculatePairing(placement.uplineId)

      return {
        success: true,
        data: member,
        message: `成功加入双轨制系统！自动分配到${placement.side}区`
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * AI自动排线（弱区优先，1:1平衡）
   */
  private static async autoPlacement(inviterId: string | null): Promise<{
    uplineId: string
    side: BinarySide
    depth: number
  }> {
    // 如果没有邀请人，返回创世用户
    if (!inviterId) {
      return {
        uplineId: 'GENESIS_USER_ID', // 需要替换为实际的创世用户ID
        side: 'A',
        depth: 1
      }
    }

    // 获取邀请人的二元信息
    const { data: inviter } = await supabase
      .from('binary_members')
      .select('*')
      .eq('user_id', inviterId)
      .maybeSingle()

    if (!inviter) {
      // 如果邀请人还没有加入二元，返回创世用户
      return {
        uplineId: 'GENESIS_USER_ID',
        side: 'A',
        depth: 1
      }
    }

    // 找到最适合的位置（弱区优先）
    const placement = await this.findBestPlacement(inviter.user_id)
    
    return placement
  }

  /**
   * 查找最佳安置位置（弱区优先 + 公排滑落）
   * 
   * ✅ 核心原则：
   * 1. 只在付费AI代理（is_agent=true）中查找位置
   * 2. 从团队根节点开始查找整个团队的弱区
   * 3. 弱区优先滑落（哪边人少，新人放哪边）
   * 4. 未付费用户不参与奖励系统，不占用位置
   */
  private static async findBestPlacement(startUserId: string): Promise<{
    uplineId: string
    side: BinarySide
    depth: number
  }> {
    // ✅ 验证起始用户是否为AI代理
    const { data: startUser } = await supabase
      .from('users')
      .select('is_agent')
      .eq('id', startUserId)
      .single()

    if (!startUser?.is_agent) {
      console.log(`⚠️ 起始用户${startUserId}不是AI代理，无法作为上级`)
      throw new Error('只有付费AI代理才能参与Binary系统')
    }

    // ✅ 向上追溯找到根节点（最上级）
    let rootUserId = startUserId
    let currentUserId = startUserId
    
    console.log(`🔍 开始向上追溯，找到团队根节点...`)
    
    while (currentUserId) {
      const { data: member } = await supabase
        .from('binary_members')
        .select('upline_id')
        .eq('user_id', currentUserId)
        .maybeSingle()
      
      if (member?.upline_id) {
        // 验证上级是否为AI代理
        const { data: upline } = await supabase
          .from('users')
          .select('is_agent')
          .eq('id', member.upline_id)
          .single()
        
        if (upline?.is_agent) {
          rootUserId = member.upline_id
          currentUserId = member.upline_id
          console.log(`  ↑ 向上一级：${currentUserId}`)
        } else {
          break
        }
      } else {
        break
      }
    }
    
    console.log(`✅ 找到根节点：${rootUserId}`)

    // BFS（广度优先搜索）从根节点开始查找最佳位置（只在AI代理中）
    const queue = [{ userId: rootUserId, depth: 1 }]
    
    while (queue.length > 0) {
      const { userId, depth } = queue.shift()!

      // ✅ 只查询AI代理的binary记录
      const { data: current } = await supabase
        .from('binary_members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!current) continue

      // ✅ 查询当前节点的直接下级（只查AI代理）
      const { data: children } = await supabase
        .from('binary_members')
        .select(`
          user_id,
          position_side,
          users!inner(is_agent)
        `)
        .eq('upline_id', userId)
        .eq('users.is_agent', true) // 只查AI代理

      // 检查是否有空位
      const hasAChild = children?.some(c => c.position_side === 'A')
      const hasBChild = children?.some(c => c.position_side === 'B')

      // 如果有空位，直接放在空位上
      if (!hasAChild) {
        console.log(`🎯 找到空位：${userId}的A区（仅AI代理）`)
        return {
          uplineId: userId,
          side: 'A',
          depth: depth
        }
      }

      if (!hasBChild) {
        console.log(`🎯 找到空位：${userId}的B区（仅AI代理）`)
        return {
          uplineId: userId,
          side: 'B',
          depth: depth
        }
      }

      // 如果两侧都有人，检查哪一侧更弱，继续向下滑落
      const aSideCount = current.a_side_count || 0
      const bSideCount = current.b_side_count || 0

      // 找到A区和B区的直接下级用户ID（只有AI代理）
      const aChildId = children?.find(c => c.position_side === 'A')?.user_id
      const bChildId = children?.find(c => c.position_side === 'B')?.user_id

      // 弱侧优先：将弱侧加入队列继续查找
      if (aSideCount <= bSideCount && aChildId) {
        console.log(`🔄 继续向A区滑落：${userId} → ${aChildId}（A区${aSideCount}单 vs B区${bSideCount}单，仅AI代理）`)
        queue.push({ userId: aChildId, depth: depth + 1 })
      } else if (bChildId) {
        console.log(`🔄 继续向B区滑落：${userId} → ${bChildId}（A区${aSideCount}单 vs B区${bSideCount}单，仅AI代理）`)
        queue.push({ userId: bChildId, depth: depth + 1 })
      }

      // 限制深度，避免无限循环（最多查找10层）
      if (depth >= 10) {
        console.log(`⚠️ 达到最大深度限制（10层），返回当前位置的弱侧`)
        return {
          uplineId: userId,
          side: aSideCount <= bSideCount ? 'A' : 'B',
          depth: depth
        }
      }
    }

    // 兜底：如果队列为空，返回起始用户的A区
    console.log(`⚠️ 未找到合适位置，返回起始用户的A区`)
    return {
      uplineId: startUserId,
      side: 'A',
      depth: 1
    }
  }

  /**
   * 更新上级的区域计数（递归向上更新所有祖先）
   */
  private static async updateUplineCount(
    uplineId: string,
    side: BinarySide,
    count: number
  ): Promise<void> {
    const field = side === 'A' ? 'a_side_count' : 'b_side_count'
    const pendingField = side === 'A' ? 'a_side_pending' : 'b_side_pending'

    // 1. 更新直接上级
    await supabase
      .from('binary_members')
      .update({
        [field]: supabase.raw(`${field} + ${count}`),
        [pendingField]: supabase.raw(`${pendingField} + ${count}`)
      })
      .eq('user_id', uplineId)

    // 2. 递归向上更新所有祖先上级
    const { data: currentMember } = await supabase
      .from('binary_members')
      .select('upline_id, position_side')
      .eq('user_id', uplineId)
      .maybeSingle()

    if (currentMember && currentMember.upline_id) {
      // 继续向上更新（使用当前成员在其上级中的区域）
      await this.updateUplineCount(
        currentMember.upline_id,
        currentMember.position_side,
        count
      )
    }
  }

  /**
   * 计算对碰奖励（2:1或1:2配对，秒结算）
   */
  static async calculatePairing(userId: string): Promise<void> {
    try {
      const { data: member } = await supabase
        .from('binary_members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!member) return

      // 获取待配对的数量
      const aPending = member.a_side_pending || 0
      const bPending = member.b_side_pending || 0

      // V4.1: 2:1或1:2灵活配对
      let pairsToSettle = 0
      let pairingType = ''
      
      if (aPending >= 2 && bPending >= 1) {
        // 2:1配对
        pairsToSettle = Math.min(Math.floor(aPending / 2), bPending)
        pairingType = '2:1'
      } else if (aPending >= 1 && bPending >= 2) {
        // 1:2配对
        pairsToSettle = Math.min(aPending, Math.floor(bPending / 2))
        pairingType = '1:2'
      } else if (aPending >= 1 && bPending >= 1) {
        // 1:1配对（兼容）
        pairsToSettle = Math.min(aPending, bPending)
        pairingType = '1:1'
      }

      if (pairsToSettle === 0) return

      // ✅ 新增：检查对碰解锁状态（防止躺平获利）
      const { count: directReferrals } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('inviter_id', userId)

      const referralCount = directReferrals || 0

      // 查询已对碰次数（从 pairing_bonuses 表统计）
      const { count: pairingCount } = await supabase
        .from('pairing_bonuses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)

      const totalPairings = pairingCount || 0

      // ✅ 新规则：0直推最多10次对碰，≥2直推无限次
      const MAX_FREE_PAIRINGS = 10 // 未解锁用户的对碰次数限制
      const isUnlocked = referralCount >= BinaryConfig.UNLOCK.MIN_DIRECT_REFERRALS

      console.log(`💰 对碰计算 - 用户${userId}：${pairingType}配对，${pairsToSettle}组，直推${referralCount}人，已对碰${totalPairings}单，${isUnlocked ? '已解锁无限对碰' : `剩余${MAX_FREE_PAIRINGS - totalPairings}单`}`)

      // 如果未解锁且已达到限制次数
      if (!isUnlocked && totalPairings >= MAX_FREE_PAIRINGS) {
        console.log(`⚠️ 用户${userId}未解锁且已达对碰上限（${MAX_FREE_PAIRINGS}单），需推荐≥2人解锁无限对碰`)
        
        // 更新待配对数量（扣除但不奖励，防止累积）
        await this.updatePendingCounts(userId, pairsToSettle, pairingType)
        
        return // 不发放任何奖励
      }

      // 如果未解锁但还有剩余次数，限制本次对碰数量
      let actualPairsToSettle = pairsToSettle
      if (!isUnlocked) {
        const remainingPairings = MAX_FREE_PAIRINGS - totalPairings
        actualPairsToSettle = Math.min(pairsToSettle, remainingPairings)
        console.log(`⚠️ 用户${userId}未解锁，本次对碰限制为${actualPairsToSettle}对（剩余${remainingPairings}单）`)
      }

      // 计算实际奖励（使用限制后的对碰数量）
      const basePairingBonus = calculatePairingBonus(actualPairsToSettle)
      const actualPairingBonus = basePairingBonus // 100% 发放（已通过次数限制）
      const platformFee = actualPairsToSettle * BinaryConfig.PAIRING.BONUS_PER_PAIR * BinaryConfig.PAIRING.PLATFORM_RATIO

      // 15%进入分红池
      await DividendService.addToPool(platformFee, 'pairing_bonus')

      // 发放对碰奖
      await WalletManager.add(
        userId,
        actualPairingBonus,
        'binary_pairing',
        `对碰奖励：${actualPairsToSettle}组(${pairingType}) × ${BinaryConfig.PAIRING.MEMBER_AMOUNT}U = ${actualPairingBonus.toFixed(2)}U${!isUnlocked ? ` (剩余${MAX_FREE_PAIRINGS - totalPairings - actualPairsToSettle}单)` : ''}`
      )

      // 记录对碰奖励到 pairing_bonuses 表（用于统计次数）
      await supabase
        .from('pairing_bonuses')
        .insert({
          user_id: userId,
          pairs: actualPairsToSettle,
          amount: actualPairingBonus,
          pairing_type: pairingType,
          created_at: new Date().toISOString()
        })

      // 更新待配对数量（根据配对类型）
      await this.updatePendingCounts(userId, actualPairsToSettle, pairingType)

      // 更新总收益
      await supabase
        .from('binary_members')
        .update({
          total_pairing_bonus: member.total_pairing_bonus + actualPairingBonus,
          total_earnings: member.total_earnings + actualPairingBonus
        })
        .eq('user_id', userId)

      // 触发平级奖励
      await this.triggerLevelBonus(userId, actualPairsToSettle)

      // 检查是否需要复投
      await this.checkReinvestRequired(userId)

      console.log(`✅ 对碰结算：用户${userId}，${actualPairsToSettle}组(${pairingType})，奖励${actualPairingBonus.toFixed(2)}U${!isUnlocked ? `（剩余${MAX_FREE_PAIRINGS - totalPairings - actualPairsToSettle}单）` : '（无限对碰）'}`)
      
      // 触发滑落机制和弱区补贴
      await this.triggerSlideAndSubsidy(userId, actualPairsToSettle)
    } catch (error) {
      console.error('对碰计算失败:', error)
    }
  }

  /**
   * 更新待配对数量（根据配对类型）
   */
  private static async updatePendingCounts(userId: string, pairs: number, pairingType: string): Promise<void> {
    const { data: member } = await supabase
      .from('binary_members')
      .select('a_side_pending, b_side_pending')
      .eq('user_id', userId)
      .single()

    if (!member) return

    let aDeduct = 0
    let bDeduct = 0

    switch (pairingType) {
      case '2:1':
        aDeduct = pairs * 2
        bDeduct = pairs * 1
        break
      case '1:2':
        aDeduct = pairs * 1
        bDeduct = pairs * 2
        break
      case '1:1':
      default:
        aDeduct = pairs
        bDeduct = pairs
        break
    }

    await supabase
      .from('binary_members')
      .update({
        a_side_pending: Math.max(0, member.a_side_pending - aDeduct),
        b_side_pending: Math.max(0, member.b_side_pending - bDeduct)
      })
      .eq('user_id', userId)
  }

  /**
   * 触发滑落机制和弱区补贴
   */
  private static async triggerSlideAndSubsidy(userId: string, pairsCount: number): Promise<void> {
    try {
      if (!BinaryConfig.PAIRING.SLIDE_ENABLED || !BinaryConfig.PAIRING.WEAK_SIDE_SUBSIDY) {
        return
      }

      // 获取用户当前状态
      const { data: member } = await supabase
        .from('binary_members')
        .select('a_side_pending, b_side_pending, position_side')
        .eq('user_id', userId)
        .single()

      if (!member) return

      const aPending = member.a_side_pending || 0
      const bPending = member.b_side_pending || 0

      // 判断弱区
      const isWeakSide = aPending < bPending ? 'A' : 'B'
      const weakSidePending = isWeakSide === 'A' ? aPending : bPending

      // 如果弱区业绩不足，触发补贴
      if (weakSidePending < BinaryConfig.PAIRING.SUBSIDY_AMOUNT) {
        console.log(`🎯 弱区补贴：用户${userId}，${isWeakSide}区业绩不足，补贴${BinaryConfig.PAIRING.SUBSIDY_AMOUNT}单`)

        // 补贴单量给弱区
        const updateData = isWeakSide === 'A' 
          ? { a_side_pending: aPending + BinaryConfig.PAIRING.SUBSIDY_AMOUNT }
          : { b_side_pending: bPending + BinaryConfig.PAIRING.SUBSIDY_AMOUNT }

        await supabase
          .from('binary_members')
          .update(updateData)
          .eq('user_id', userId)

        // 记录补贴日志
        await supabase
          .from('subsidy_logs')
          .insert({
            user_id: userId,
            weak_side: isWeakSide,
            subsidy_amount: BinaryConfig.PAIRING.SUBSIDY_AMOUNT,
            trigger_pairs: pairsCount,
            created_at: new Date().toISOString()
          })

        console.log(`✅ 弱区补贴完成：${isWeakSide}区增加${BinaryConfig.PAIRING.SUBSIDY_AMOUNT}单`)
      }
    } catch (error) {
      console.error('滑落机制和弱区补贴失败:', error)
    }
  }

  /**
   * 触发平级奖励（向上追溯8代直推链）
   */
  private static async triggerLevelBonus(
    triggerId: string,
    pairsCount: number
  ): Promise<void> {
    try {
      // 获取触发者的用户信息
      const triggerUser = await UserRepository.findById(triggerId)
      
      // 向上追溯8代直推链（串糖葫芦式）
      let currentUserId = triggerUser.inviter_id
      let generation = 1

      while (currentUserId && generation <= BinaryConfig.LEVEL_BONUS.DEPTH) {
        // 获取当前上级
        const upline = await UserRepository.findById(currentUserId)
        
        // 检查是否符合条件（直推≥2人）
        if (upline.direct_referral_count >= BinaryConfig.LEVEL_BONUS.UNLOCK_CONDITION) {
          // 发放平级奖
          const levelBonus = BinaryConfig.LEVEL_BONUS.AMOUNT * pairsCount
          
          await WalletManager.add(
            currentUserId,
            levelBonus,
            'binary_level_bonus',
            `第${generation}代平级奖：下线${triggerUser.username}触发${pairsCount}组对碰，奖励${levelBonus.toFixed(2)}U`
          )

          // 更新统计
          await supabase
            .from('binary_members')
            .update({
              total_level_bonus: supabase.raw(`total_level_bonus + ${levelBonus}`),
              total_earnings: supabase.raw(`total_earnings + ${levelBonus}`)
            })
            .eq('user_id', currentUserId)

          console.log(`💎 平级奖：第${generation}代 ${currentUserId} 获得${levelBonus.toFixed(2)}U`)
        }

        // 继续向上（直推链）
        currentUserId = upline.inviter_id
        generation++
      }
    } catch (error) {
      console.error('平级奖励失败:', error)
    }
  }

  /**
   * 检查并自动复投（原点复投）
   * 说明：累计收益达到300U的倍数时，自动增加1单
   */
  private static async checkReinvestRequired(userId: string): Promise<void> {
    const { data: member } = await supabase
      .from('binary_members')
      .select('*, position_side, upline_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!member) return

    // 检查是否达到复投阈值（200U的倍数）
    const threshold = BinaryConfig.REINVEST.THRESHOLD * (member.reinvest_count + 1)
    
    if (member.total_earnings >= threshold) {
      console.log(`🔄 自动复投触发：用户${userId}，收益${member.total_earnings.toFixed(2)}U ≥ ${threshold}U`)

      // ✅ 原点复投：自动增加订单数量（滑落机制）
      await supabase
        .from('binary_members')
        .update({
          order_count: supabase.raw('order_count + 1'), // 单量+1
          reinvest_count: member.reinvest_count + 1,    // 复投次数+1
          reinvest_required_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      // 触发滑落机制：补贴单量给弱区
      await this.triggerSlideAndSubsidy(userId, 1)

      console.log(`✅ 自动复投成功：用户${userId}，订单数量+1（第${member.reinvest_count + 1}次复投）`)

      // ✅ 递归更新所有上级的单量统计
      if (member.upline_id && member.position_side) {
        await this.updateUplineCount(member.upline_id, member.position_side, 1)
      }

      // ✅ 触发所有上级重新计算对碰
      await this.triggerUplinePairing(userId)

      console.log(`🎉 自动复投完成：用户${userId}，已触发上级对碰计算`)
    }
  }

  /**
   * 触发所有上级重新计算对碰（用于复投后）
   */
  private static async triggerUplinePairing(userId: string): Promise<void> {
    try {
      const { data: member } = await supabase
        .from('binary_members')
        .select('upline_id, position_side')
        .eq('user_id', userId)
        .maybeSingle()

      if (!member || !member.upline_id) return

      // 触发直接上级的对碰计算
      await this.calculatePairing(member.upline_id)

      // 递归向上触发所有祖先上级的对碰
      await this.triggerUplinePairing(member.upline_id)
    } catch (error) {
      console.error('触发上级对碰失败:', error)
    }
  }

  /**
   * 获取用户二元信息
   */
  static async getBinaryInfo(userId: string): Promise<ApiResponse<any>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      // 使用 maybeSingle() 避免在没有记录时产生错误
      const { data: member, error } = await supabase
        .from('binary_members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('查询 binary_members 失败:', error)
        return {
          success: false,
          error: error.message
        }
      }

      if (!member) {
        return {
          success: true,
          data: null,
          message: '您还未加入双轨制系统'
        }
      }

      // 获取用户信息
      const user = await UserRepository.findById(userId)

      // 计算当前可配对数
      const aPending = member.a_side_pending || 0
      const bPending = member.b_side_pending || 0
      const readyPairs = Math.min(aPending, bPending)

      return {
        success: true,
        data: {
          ...member,
          username: user.username,
          direct_referrals: user.direct_referral_count,
          level_bonus_unlocked: user.direct_referral_count >= BinaryConfig.LEVEL_BONUS.UNLOCK_CONDITION,
          dividend_eligible: user.direct_referral_count >= BinaryConfig.DIVIDEND.CONDITION,
          ready_pairs: readyPairs,
          estimated_pairing_bonus: calculatePairingBonus(readyPairs)
        }
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 获取团队信息
   */
  static async getTeamInfo(userId: string, side?: BinarySide): Promise<ApiResponse<any>> {
    this.validateRequired({ userId }, ['userId'])

    try {
      // 获取直接下级
      let query = supabase
        .from('binary_members')
        .select('*')
        .eq('upline_id', userId)

      if (side) {
        query = query.eq('position_side', side)
      }

      const { data: team, error } = await query

      if (error) throw error

      return {
        success: true,
        data: {
          total: team?.length || 0,
          a_side: team?.filter(m => m.position_side === 'A').length || 0,
          b_side: team?.filter(m => m.position_side === 'B').length || 0,
          members: team || []
        }
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 错误处理
   */
  private static handleError(error: any): ApiResponse {
    console.error('BinaryService Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '操作失败'
    }
  }
}

