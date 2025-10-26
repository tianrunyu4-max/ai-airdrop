import { supabase } from '@/lib/supabase'
import { WalletManager } from '@/wallet/WalletManager'
import { BinaryService } from './BinaryService'
import type { ApiResponse } from '@/types'

/**
 * 代理服务
 * 负责处理AI代理相关业务逻辑
 * 注意：成为代理 = 加入Binary对碰系统（30U）
 */
export class AgentService {
  // 成为代理的费用（30U）= 加入Binary系统费用
  private static readonly AGENT_FEE = 30

  /**
   * 成为AI代理 = 加入Binary对碰系统（支付30U）
   * 
   * ✅ 核心逻辑：
   * 1. 注册时不需要邀请码（游客身份）
   * 2. 付费时才填写邀请码（这时才建立上下级关系）
   * 3. 只有付费AI代理才进入奖励系统
   * 
   * @param userId 用户ID
   * @param inviteCode 邀请码（必填）
   */
  static async becomeAgent(userId: string, inviteCode: string): Promise<ApiResponse<void>> {
    try {
      console.log('🎯 开始成为AI代理（加入Binary系统）...', userId, '邀请码:', inviteCode)

      // 1. 验证邀请码（必填）
      if (!inviteCode || inviteCode.trim() === '') {
        return {
          success: false,
          error: '请输入邀请码'
        }
      }

      // 2. 查找邀请人
      const { data: inviter, error: inviterError } = await supabase
        .from('users')
        .select('id, username, is_agent')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single()

      if (inviterError || !inviter) {
        return {
          success: false,
          error: '邀请码无效，请检查后重试'
        }
      }

      // 3. 验证邀请人必须是AI代理
      if (!inviter.is_agent) {
        return {
          success: false,
          error: '邀请人还未成为AI代理，无法邀请新成员'
        }
      }

      // 4. 检查用户是否已经是代理
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('is_agent, u_balance, username, inviter_id')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      if (user.is_agent) {
        return {
          success: false,
          error: '您已经是AI代理了'
        }
      }

      // 5. 检查是否已有邀请人（防止重复设置）
      if (user.inviter_id) {
        return {
          success: false,
          error: '您已经有邀请人了，无法更换'
        }
      }

      // 6. 检查U余额是否充足
      if (user.u_balance < this.AGENT_FEE) {
        return {
          success: false,
          error: `U余额不足，需要${this.AGENT_FEE}U（当前: ${user.u_balance.toFixed(2)}U）`
        }
      }

      // 7. 扣除30U（使用WalletManager原子操作）
      await WalletManager.deduct(
        userId,
        this.AGENT_FEE,
        'agent_purchase',
        `成为AI代理，加入Binary对碰系统（30U，邀请人：${inviter.username}）`
      )

      // 8. 设置为代理 + 设置邀请人关系（关键！）
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_agent: true,
          inviter_id: inviter.id, // ✅ 付费时才设置邀请人
          agent_paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) throw updateError

      console.log(`✅ 设置邀请人关系：${user.username} → ${inviter.username}`)

      // 9. 自动加入Binary对碰系统
      console.log('🔄 自动加入Binary对碰系统...')
      const binaryResult = await BinaryService.joinBinarySystem(userId)
      
      if (!binaryResult.success) {
        console.error('⚠️ 加入Binary系统失败，但代理身份已设置:', binaryResult.error)
        // 不回滚，只记录错误
      } else {
        console.log('✅ 成功加入Binary对碰系统')
      }

      // 10. 自动赠送100积分（V4.0新增）
      console.log('🎁 自动赠送100互转积分...')
      
      // ✅ 同时增加 transfer_points 和 points_balance
      await WalletManager.addTransferPoints(
        userId,
        100,
        'binary_auto_gift',
        '加入Binary系统自动赠送100互转积分（可激活学习卡）'
      )
      
      await WalletManager.addPoints(
        userId,
        100,
        'binary_auto_gift',
        '加入Binary系统自动赠送100积分（总积分余额）'
      )
      
      console.log('✅ 已赠送100互转积分')

      console.log('✅ 成为AI代理成功')

      return {
        success: true,
        message: `🎉 恭喜！您已加入Binary对碰系统！\n\n您的邀请人：${inviter.username}\n\n🎁 系统赠送：100积分\n✅ 可以互转积分\n✅ 可以激活AI学习卡\n✅ 开始对碰、平级、分红收益！`
      }
    } catch (error: any) {
      console.error('❌ 成为AI代理失败:', error)
      return {
        success: false,
        error: error.message || '成为代理失败'
      }
    }
  }

  /**
   * 检查用户是否为代理
   */
  static async isAgent(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_agent')
        .eq('id', userId)
        .single()

      if (error) throw error

      return data?.is_agent || false
    } catch (error) {
      console.error('检查代理状态失败:', error)
      return false
    }
  }

  /**
   * 获取代理统计信息
   */
  static async getAgentStats(): Promise<ApiResponse<{
    totalAgents: number
    totalRevenue: number
  }>> {
    try {
      // 统计代理数量
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_agent', true)

      if (countError) throw countError

      // 统计代理收入（30U × 代理数量）
      const totalRevenue = (count || 0) * this.AGENT_FEE

      return {
        success: true,
        data: {
          totalAgents: count || 0,
          totalRevenue
        }
      }
    } catch (error: any) {
      console.error('获取代理统计失败:', error)
      return {
        success: false,
        error: error.message || '获取统计失败'
      }
    }
  }
}

