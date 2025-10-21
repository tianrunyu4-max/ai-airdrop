/**
 * 充值服务
 */
import { supabase } from '@/lib/supabase'

export interface RechargeConfig {
  usdt_trc20: string
  usdt_erc20: string
  enable_recharge: boolean
  min_amount: number
  notice: string
}

export interface RechargeRecord {
  id: string
  user_id: string
  amount: number
  currency: string
  network: string
  txid?: string
  status: 'pending' | 'confirmed' | 'rejected'
  proof_image?: string
  admin_note?: string
  created_at: string
  confirmed_at?: string
  confirmed_by?: string
}

export class RechargeService {
  /**
   * 获取充值配置
   */
  static async getRechargeConfig(): Promise<RechargeConfig | null> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'recharge_config')
        .single()
      
      if (error) throw error
      return data?.value as RechargeConfig
    } catch (error) {
      console.error('获取充值配置失败:', error)
      return null
    }
  }

  /**
   * 创建充值记录
   */
  static async createRecharge(data: {
    amount: number
    currency: string
    network: string
    txid?: string
    proof_image?: string
  }) {
    try {
      const { data: record, error } = await supabase
        .from('recharge_records')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          ...data,
          status: 'pending'
        })
        .select()
        .single()
      
      if (error) throw error
      
      return {
        success: true,
        data: record
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取用户充值记录
   */
  static async getUserRecharges() {
    try {
      const { data, error } = await supabase
        .from('recharge_records')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as RechargeRecord[]
    } catch (error) {
      console.error('获取充值记录失败:', error)
      return []
    }
  }

  /**
   * 管理员：获取所有充值记录
   */
  static async getAllRecharges(status?: string) {
    try {
      let query = supabase
        .from('recharge_records')
        .select(`
          *,
          user:user_id (
            username,
            phone
          )
        `)
        .order('created_at', { ascending: false })
      
      if (status) {
        query = query.eq('status', status)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    } catch (error) {
      console.error('获取充值记录失败:', error)
      return []
    }
  }

  /**
   * 管理员：确认充值
   */
  static async confirmRecharge(rechargeId: string, note?: string) {
    try {
      const { data: recharge, error: fetchError } = await supabase
        .from('recharge_records')
        .select('*')
        .eq('id', rechargeId)
        .single()
      
      if (fetchError) throw fetchError
      
      // 更新充值记录
      const { error: updateError } = await supabase
        .from('recharge_records')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: (await supabase.auth.getUser()).data.user?.id,
          admin_note: note
        })
        .eq('id', rechargeId)
      
      if (updateError) throw updateError
      
      // 增加用户余额
      const { error: balanceError } = await supabase.rpc('update_user_balance', {
        p_user_id: recharge.user_id,
        p_amount: recharge.amount,
        p_type: 'recharge',
        p_description: `充值确认 ${recharge.amount} USDT`
      })
      
      if (balanceError) throw balanceError
      
      return {
        success: true,
        message: '充值已确认'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 管理员：拒绝充值
   */
  static async rejectRecharge(rechargeId: string, note: string) {
    try {
      const { error } = await supabase
        .from('recharge_records')
        .update({
          status: 'rejected',
          admin_note: note
        })
        .eq('id', rechargeId)
      
      if (error) throw error
      
      return {
        success: true,
        message: '充值已拒绝'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 更新充值配置（管理员）
   */
  static async updateRechargeConfig(config: Partial<RechargeConfig>) {
    try {
      const { error } = await supabase
        .from('system_config')
        .update({
          value: config,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'recharge_config')
      
      if (error) throw error
      
      return {
        success: true,
        message: '配置已更新'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

