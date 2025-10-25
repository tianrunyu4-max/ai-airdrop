import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isDevMode } from '@/lib/supabase'
import type { User } from '@/types'
import bcrypt from 'bcryptjs'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const initialized = ref(false)
  const loading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!user.value)

  // Actions
  async function initialize() {
    try {
      loading.value = true
      
      // 🔥 生产模式：从 localStorage 恢复会话（如果存在）
      const currentUser = localStorage.getItem('current_user')
      const userSession = localStorage.getItem('user_session')
      
      if (currentUser && userSession) {
        try {
          const cachedUser = JSON.parse(userSession)
          
          // 从数据库验证并刷新用户数据
          const { data: freshUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', currentUser)
            .maybeSingle()  // ✅ 修复：使用maybeSingle
          
          if (!error && freshUser) {
            user.value = freshUser
            // 更新缓存
            localStorage.setItem('user_session', JSON.stringify(freshUser))
          } else {
            // 如果数据库查询失败，使用缓存数据
            user.value = cachedUser
          }
        } catch (e) {
          // 缓存数据解析失败，清除会话
          localStorage.removeItem('current_user')
          localStorage.removeItem('user_session')
        }
      }
      
      initialized.value = true
    } catch (error) {
      // 初始化失败不影响应用启动
    } finally {
      loading.value = false
    }
  }

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()  // ✅ 修复：使用maybeSingle

      if (error) {
        console.error('数据库查询错误:', error)
        throw error
      }
      if (data) {
        user.value = data
      }
    } catch (error) {
      console.error('Fetch user profile error:', error)
    }
  }

  async function login(username: string, password: string) {
    try {
      loading.value = true
      
      // 🔥 生产模式：从 Supabase 数据库查询用户
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle()  // ✅ 修复：使用maybeSingle，查询不到时不返回error
      
      if (error) {
        console.error('数据库查询错误:', error)
        throw new Error('登录失败，请稍后重试')
      }
      
      if (!users) {
        throw new Error('用户名不存在，请先注册')
      }
      
      // 🔐 使用 bcrypt 验证加密密码（尝试多个可能的字段名）
      const passwordField = users.password_hash || users.password || users['加密密码'] || users['密码哈希']
      const isPasswordValid = await bcrypt.compare(password, passwordField)
      
      if (!isPasswordValid) {
        throw new Error('密码错误')
      }
      
      // 登录成功，保存用户数据
      user.value = users
      
      // 保存到 localStorage 作为会话缓存
      localStorage.setItem('current_user', username)
      localStorage.setItem('user_session', JSON.stringify(users))
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户注册
   * ✅ 注册时不设置邀请关系，升级AI代理时才填写邀请码
   */
  async function register(username: string, password: string) {
    try {
      loading.value = true

      // 🔥 生产模式：检查用户名是否已存在
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle()  // ✅ 修复：使用maybeSingle
      
      if (checkError) {
        console.error('检查用户名错误:', checkError)
        throw new Error('注册失败，请稍后重试')
      }
      
      if (existingUser) {
        throw new Error('用户名已被注册')
      }
      
      // 生成唯一邀请码
      const generateInviteCode = async () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let code = ''
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        
        // 检查邀请码是否唯一
        const { data: existing } = await supabase
          .from('users')
          .select('invite_code')
          .eq('invite_code', code)
          .maybeSingle()  // ✅ 修复：使用maybeSingle
        
        if (existing) {
          return generateInviteCode() // 重复则重新生成
        }
        return code
      }
      
      const userInviteCode = await generateInviteCode()
      
      // 检查是否是第一个用户
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      
      const isFirstUser = (count || 0) === 0
      
      // 🔐 使用 bcrypt 加密密码
      const hashedPassword = await bcrypt.hash(password, 10)
      
      // 创建新用户
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          username,
          password_hash: hashedPassword, // ✅ 存储加密后的密码
          invite_code: userInviteCode,
          inviter_id: null, // ✅ 注册时不设置邀请人，升级代理时才设置
          referral_position: 1,
          u_balance: 0, // ✅ 新用户余额为0，通过充值或奖励获得
          points_balance: 150,
          mining_points: 150,
          transfer_points: 0,
          is_agent: isFirstUser,
          agent_paid_at: isFirstUser ? new Date().toISOString() : null,
          is_admin: isFirstUser,
          language: 'zh'
        })
        .select()
        .single()
      
      if (insertError || !newUser) {
        throw new Error('注册失败，请稍后重试')
      }
      
      console.log(`✅ 注册成功：${username}（游客身份，升级代理时填写邀请码）`)
      
      // 保存用户数据
      user.value = newUser
      
      // 缓存到 localStorage
      localStorage.setItem('current_user', username)
      localStorage.setItem('user_session', JSON.stringify(newUser))
      
      return { 
        success: true
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      loading.value = true
      
      // 🔥 生产模式：清除会话
      localStorage.removeItem('current_user')
      localStorage.removeItem('user_session')
      user.value = null
      
      return { success: true }
    } catch (error) {
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  // 刷新用户数据（从数据库重新加载）
  async function loadUser() {
    try {
      if (!user.value) return

      // 🔥 生产模式：从数据库刷新用户数据
      const currentUsername = localStorage.getItem('current_user')
      if (currentUsername) {
        const { data: freshUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', currentUsername)
          .maybeSingle()  // ✅ 修复：使用maybeSingle
        
        if (!error && freshUser) {
          user.value = freshUser
          // 更新缓存
          localStorage.setItem('user_session', JSON.stringify(freshUser))
        }
      }
    } catch (error) {
      // 刷新失败不影响当前会话
    }
  }

  return {
    user,
    initialized,
    loading,
    isAuthenticated,
    initialize,
    login,
    register,
    logout,
    loadUser
  }
})

