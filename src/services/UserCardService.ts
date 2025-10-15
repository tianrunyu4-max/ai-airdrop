import { supabase } from '@/lib/supabase'
import type { BaseServiceResult } from './BaseService'

export interface UserCard {
  id: string
  user_id: string
  avatar_url: string | null
  ad_image_1: string | null
  ad_image_2: string | null
  business_name: string | null
  business_desc: string | null
  contact_info: string | null
  created_at: string
  updated_at: string
  // 关联用户信息
  username?: string
  is_agent?: boolean
}

export class UserCardService {
  /**
   * 获取用户名片
   */
  static async getUserCard(userId: string): Promise<BaseServiceResult<UserCard>> {
    try {
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          *,
          users:user_id (
            username,
            is_agent
          )
        `)
        .eq('user_id', userId)
        .single()

      if (error) throw error

      // 如果没有名片，创建一个默认的
      if (!data) {
        return await this.createDefaultCard(userId)
      }

      // 展平用户信息
      const card: UserCard = {
        ...data,
        username: data.users?.username,
        is_agent: data.users?.is_agent
      }

      return {
        success: true,
        data: card
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '获取名片失败'
      }
    }
  }

  /**
   * 创建默认名片
   */
  static async createDefaultCard(userId: string): Promise<BaseServiceResult<UserCard>> {
    try {
      // 获取用户信息
      const { data: user } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single()

      const username = user?.username || 'User'

      // 生成默认头像
      const defaultAvatar = this.generateDefaultAvatar(username)

      const { data, error } = await supabase
        .from('user_cards')
        .insert({
          user_id: userId,
          avatar_url: defaultAvatar
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as UserCard
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '创建名片失败'
      }
    }
  }

  /**
   * 生成默认SVG头像
   */
  static generateDefaultAvatar(username: string): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']
    const color = colors[Math.floor(Math.random() * colors.length)]
    const firstChar = username.charAt(0).toUpperCase()

    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="${color}"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="100" font-family="Arial, sans-serif">${firstChar}</text>
      </svg>
    `

    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  /**
   * 更新用户名片
   */
  static async updateUserCard(
    userId: string,
    updates: Partial<Omit<UserCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<BaseServiceResult<UserCard>> {
    try {
      const { data, error } = await supabase
        .from('user_cards')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as UserCard,
        message: '名片更新成功'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '更新名片失败'
      }
    }
  }

  /**
   * 上传图片到Supabase Storage
   */
  static async uploadImage(
    userId: string,
    file: File,
    imageType: 'avatar' | 'ad1' | 'ad2'
  ): Promise<BaseServiceResult<string>> {
    try {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        throw new Error('请上传图片文件')
      }

      // 验证文件大小（最大5MB）
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('图片大小不能超过5MB')
      }

      // 生成文件名
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${imageType}_${Date.now()}.${fileExt}`

      // 上传到Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-cards')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      // 获取公共URL
      const { data: publicData } = supabase.storage
        .from('user-cards')
        .getPublicUrl(fileName)

      return {
        success: true,
        data: publicData.publicUrl,
        message: '图片上传成功'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '图片上传失败'
      }
    }
  }

  /**
   * 删除图片
   */
  static async deleteImage(imageUrl: string): Promise<BaseServiceResult<void>> {
    try {
      // 从URL中提取文件路径
      const url = new URL(imageUrl)
      const path = url.pathname.split('/user-cards/')[1]

      if (!path) {
        throw new Error('无效的图片URL')
      }

      const { error } = await supabase.storage
        .from('user-cards')
        .remove([path])

      if (error) throw error

      return {
        success: true,
        message: '图片删除成功'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '图片删除失败'
      }
    }
  }

  /**
   * 批量获取用户名片（用于群聊显示）
   */
  static async getUserCards(userIds: string[]): Promise<BaseServiceResult<UserCard[]>> {
    try {
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          *,
          users:user_id (
            username,
            is_agent
          )
        `)
        .in('user_id', userIds)

      if (error) throw error

      // 展平用户信息
      const cards: UserCard[] = (data || []).map(card => ({
        ...card,
        username: card.users?.username,
        is_agent: card.users?.is_agent
      }))

      return {
        success: true,
        data: cards
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '获取名片列表失败'
      }
    }
  }
}

