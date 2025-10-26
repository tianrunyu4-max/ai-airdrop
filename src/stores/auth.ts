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
      const lastLoginTime = localStorage.getItem('last_login_time')
      
      if (currentUser && userSession) {
        try {
          const cachedUser = JSON.parse(userSession)
          
          // ✅ 优化：先使用缓存数据，立即设置用户状态
          user.value = cachedUser
          initialized.value = true
          loading.value = false
          
          // ✅ 优化：检查是否刚刚登录（5秒内），跳过数据库刷新
          const now = Date.now()
          if (lastLoginTime && (now - parseInt(lastLoginTime)) < 5000) {
            console.log('✅ 刚刚登录，跳过数据库刷新')
            return
          }
          
          // ✅ 后台异步刷新用户数据（不阻塞界面）
          setTimeout(async () => {
            try {
              const { data: freshUser, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', currentUser)
                .maybeSingle()
              
              if (!error && freshUser) {
                user.value = freshUser
                localStorage.setItem('user_session', JSON.stringify(freshUser))
                console.log('✅ 后台刷新用户数据成功')
              }
            } catch (e) {
              console.log('⚠️ 后台刷新用户数据失败，使用缓存')
            }
          }, 100) // 100ms后开始后台刷新
          
        } catch (e) {
          // 缓存数据解析失败，清除会话
          localStorage.removeItem('current_user')
          localStorage.removeItem('user_session')
          localStorage.removeItem('last_login_time')
        }
      } else {
        initialized.value = true
      }
    } catch (error) {
      // 初始化失败不影响应用启动
      initialized.value = true
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
      
      // ✅ 先跳转，后台异步保存数据（提升体验速度）
      user.value = users
      localStorage.setItem('current_user', username)
      localStorage.setItem('user_session', JSON.stringify(users))
      localStorage.setItem('last_login_time', Date.now().toString()) // ✅ 记录登录时间
      
      console.log('✅ 登录成功，即将跳转')
      
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

      // ✅ 优化：并行执行用户名检查和密码加密
      const [checkResult, hashedPassword] = await Promise.all([
        supabase
          .from('users')
          .select('username')
          .eq('username', username)
          .maybeSingle(),
        bcrypt.hash(password, 10)
      ])
      
      const { data: existingUser, error: checkError } = checkResult
      
      if (checkError) {
        console.error('检查用户名错误:', checkError)
        throw new Error('注册失败，请稍后重试')
      }
      
      if (existingUser) {
        throw new Error('用户名已被注册')
      }
      
      // ✅ 优化：生成更随机的邀请码，减少重复概率
      const generateInviteCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        const timestamp = Date.now().toString(36).toUpperCase()
        const random = Math.random().toString(36).substring(2, 6).toUpperCase()
        return (timestamp + random).substring(0, 8)
      }
      
      const userInviteCode = generateInviteCode()
      
      // ✅ 优化：假设不是第一个用户（99%的情况），失败时数据库会拒绝
      // 创建新用户
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          username,
          password_hash: hashedPassword,
          invite_code: userInviteCode,
          inviter_id: null, // ✅ 注册时不设置邀请人，升级代理时才设置
          referral_position: 1,
          u_balance: 0, // ✅ 新用户余额为0，通过充值或奖励获得
          points_balance: 150,
          mining_points: 150,
          transfer_points: 0,
          is_agent: false, // ✅ 默认非代理
          agent_paid_at: null,
          is_admin: false, // ✅ 默认非管理员
          language: 'zh'
        })
        .select()
        .single()
      
      if (insertError || !newUser) {
        // 邀请码重复时重试
        if (insertError?.message?.includes('invite_code')) {
          console.log('⚠️ 邀请码重复，重试注册')
          return register(username, password)
        }
        throw new Error('注册失败，请稍后重试')
      }
      
      console.log(`✅ 注册成功：${username}（游客身份，升级代理时填写邀请码）`)
      
      // ✅ 先设置用户数据和缓存，立即返回（提升体验速度）
      user.value = newUser
      localStorage.setItem('current_user', username)
      localStorage.setItem('user_session', JSON.stringify(newUser))
      localStorage.setItem('last_login_time', Date.now().toString()) // ✅ 记录注册时间
      
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
      localStorage.removeItem('last_login_time') // ✅ 清除登录时间
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

