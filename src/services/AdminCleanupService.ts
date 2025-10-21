/**
 * 管理员消息清理服务
 */
import { supabase } from '@/lib/supabase'

export class AdminCleanupService {
  /**
   * 清理过期消息
   * - 用户消息：5分钟
   * - 机器人消息（自动赚钱群）：10分钟
   * - 机器人消息（AI科技群）：24小时
   */
  static async cleanupExpiredMessages() {
    try {
      // 调用数据库清理函数
      const { data, error } = await supabase.rpc('cleanup_expired_messages')
      
      if (error) {
        console.error('清理消息失败:', error)
        return {
          success: false,
          error: error.message
        }
      }
      
      return {
        success: true,
        message: '✅ 消息清理完成'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取消息统计
   */
  static async getMessageStats() {
    try {
      const { data: stats, error } = await supabase
        .from('messages')
        .select('is_bot, created_at, chat_group_id')
      
      if (error) throw error
      
      const now = Date.now()
      const userMessages = stats?.filter(m => !m.is_bot) || []
      const botMessages = stats?.filter(m => m.is_bot) || []
      
      const expiredUsers = userMessages.filter(m => 
        now - new Date(m.created_at).getTime() > 5 * 60 * 1000
      ).length
      
      const expiredBots = botMessages.filter(m => 
        now - new Date(m.created_at).getTime() > 10 * 60 * 1000
      ).length
      
      return {
        total: stats?.length || 0,
        userMessages: userMessages.length,
        botMessages: botMessages.length,
        expiredUsers,
        expiredBots,
        willDelete: expiredUsers + expiredBots
      }
    } catch (error: any) {
      console.error('获取统计失败:', error)
      return null
    }
  }
}

