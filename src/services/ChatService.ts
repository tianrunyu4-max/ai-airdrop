/**
 * ChatService - 聊天相关业务逻辑
 */

import { supabase } from '@/lib/supabase'
import { BaseService, type ApiResponse } from './BaseService'
import type { Message, ChatGroup, ChatCategory } from '@/types'

export class ChatService extends BaseService {
  /**
   * 获取所有群聊分类
   */
  static async getCategories(): Promise<ApiResponse<ChatCategory[]>> {
    return this.handleRequest(
      supabase
        .from('chat_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
    )
  }

  /**
   * 获取所有群组
   */
  static async getGroups(): Promise<ApiResponse<ChatGroup[]>> {
    return this.handleRequest(
      supabase
        .from('chat_groups')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
    )
  }

  /**
   * 获取指定分类下的群组
   * @param categoryId 分类ID
   */
  static async getGroupsByCategory(categoryId: string): Promise<ApiResponse<ChatGroup[]>> {
    this.validateRequired({ categoryId }, ['categoryId'])

    return this.handleRequest(
      supabase
        .from('chat_groups')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('sort_order')
    )
  }

  /**
   * 获取群组信息
   * @param groupId 群组ID
   */
  static async getGroup(groupId: string): Promise<ApiResponse<ChatGroup>> {
    this.validateRequired({ groupId }, ['groupId'])

    return this.handleRequest(
      supabase
        .from('chat_groups')
        .select('*')
        .eq('id', groupId)
        .single()
    )
  }

  /**
   * 获取群组消息
   * @param groupId 群组ID
   * @param limit 限制数量
   * @param offset 偏移量
   */
  static async getMessages(
    groupId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ApiResponse<Message[]>> {
    this.validateRequired({ groupId }, ['groupId'])

    return this.handleRequest(
      supabase
        .from('messages')
        .select('*')
        .eq('chat_group_id', groupId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1)
    )
  }

  /**
   * 发送消息
   * @param message 消息数据
   */
  static async sendMessage(
    message: Omit<Message, 'id' | 'created_at' | 'deleted_at'>
  ): Promise<ApiResponse<Message>> {
    this.validateRequired(
      message,
      ['chat_group_id', 'user_id', 'username', 'content', 'type']
    )

    return this.handleRequest(
      supabase
        .from('messages')
        .insert(message)
        .select()
        .single()
    )
  }

  /**
   * 删除消息（软删除）
   * @param messageId 消息ID
   */
  static async deleteMessage(messageId: string): Promise<ApiResponse<Message>> {
    this.validateRequired({ messageId }, ['messageId'])

    return this.handleRequest(
      supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single()
    )
  }

  /**
   * 加入群组
   * @param groupId 群组ID
   * @param userId 用户ID
   */
  static async joinGroup(groupId: string, userId: string): Promise<ApiResponse<any>> {
    this.validateRequired({ groupId, userId }, ['groupId', 'userId'])

    // 检查是否已经是成员
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      return {
        success: true,
        message: '已经是群成员'
      }
    }

    // 添加成员
    const insertResult = await this.handleRequest(
      supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member'
        })
        .select()
        .single()
    )

    if (!insertResult.success) {
      return insertResult
    }

    // 更新群成员数
    await supabase.rpc('increment_group_members', { group_id: groupId })

    return {
      success: true,
      data: insertResult.data,
      message: '加入群组成功'
    }
  }

  /**
   * 离开群组
   * @param groupId 群组ID
   * @param userId 用户ID
   */
  static async leaveGroup(groupId: string, userId: string): Promise<ApiResponse<any>> {
    this.validateRequired({ groupId, userId }, ['groupId', 'userId'])

    const deleteResult = await this.handleRequest(
      supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)
    )

    if (!deleteResult.success) {
      return deleteResult
    }

    // 更新群成员数
    await supabase.rpc('decrement_group_members', { group_id: groupId })

    return {
      success: true,
      message: '离开群组成功'
    }
  }

  /**
   * 上传图片到Supabase Storage
   * @param file 图片文件
   * @param userId 用户ID
   */
  static async uploadImage(file: File, userId: string): Promise<ApiResponse<string>> {
    this.validateRequired({ file, userId }, ['file', 'userId'])

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('chat-images')
      .upload(fileName, file)

    if (error) {
      return {
        success: false,
        error: this.formatError(error as any)
      }
    }

    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(fileName)

    return {
      success: true,
      data: urlData.publicUrl
    }
  }

  /**
   * 订阅群组消息（实时）
   * @param groupId 群组ID
   * @param callback 回调函数
   */
  static subscribeToMessages(
    groupId: string,
    callback: (message: Message) => void
  ) {
    return supabase
      .channel(`messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_group_id=eq.${groupId}`
        },
        (payload) => {
          callback(payload.new as Message)
        }
      )
      .subscribe()
  }

  /**
   * 取消订阅
   * @param subscription 订阅对象
   */
  static unsubscribe(subscription: any) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }
}


















