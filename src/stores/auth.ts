import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isDevMode } from '@/lib/supabase'
import type { User } from '@/types'

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
      
      // 开发模式：从localStorage恢复登录状态
      if (isDevMode) {
        const currentUser = localStorage.getItem('current_user')
        
        if (currentUser) {
          const registeredUsersStr = localStorage.getItem('registered_users')
          const registeredUsers = JSON.parse(registeredUsersStr || '{}')
          
          if (registeredUsers[currentUser]) {
            user.value = registeredUsers[currentUser].userData
          }
        }
        initialized.value = true
        return
      }
      
      // 生产模式：从Supabase获取session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      }
      
      initialized.value = true
    } catch (error) {
      console.error('Initialize auth error:', error)
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
        .single()

      if (error) throw error
      user.value = data
    } catch (error) {
      console.error('Fetch user profile error:', error)
    }
  }

  async function login(username: string, password: string) {
    try {
      loading.value = true
      
      // 模拟登录（开发阶段）
      if (isDevMode) {
        // 快速登录，减少延迟
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // 从localStorage获取已注册的用户
        const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '{}')
        
        // 验证用户是否已注册
        if (!registeredUsers[username]) {
          throw new Error('用户名不存在，请先注册')
        }
        
        // 验证密码
        if (registeredUsers[username].password !== password) {
          throw new Error('密码错误')
        }
        
        // 登录成功，恢复用户数据
        user.value = registeredUsers[username].userData
        
        // 保存当前登录用户
        localStorage.setItem('current_user', username)
        
        return { success: true }
      }
      
      // 真实Supabase登录（不使用Auth，直接users表）
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (error || !userData) {
        throw new Error('用户名不存在')
      }

      // 验证密码
      if (userData.password_hash !== password) {
        throw new Error('密码错误')
      }

      user.value = userData

      return { success: true }
    } catch (error: any) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  async function register(username: string, password: string, inviteCode?: string) {
    try {
      loading.value = true

      // 模拟注册（开发阶段）
      if (isDevMode) {
        // 快速注册，减少延迟
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // 从localStorage获取已注册用户
        const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '{}')
        const userCount = Object.keys(registeredUsers).length
        
        console.log(`📝 当前已注册用户数: ${userCount}`)
        
        // 检查用户名是否已存在
        if (registeredUsers[username]) {
          throw new Error('用户名已被注册')
        }
        
        // 生成用户专属邀请码（8位大写字母+数字）
        const generateInviteCode = () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
          let code = ''
          for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
          }
          // 确保邀请码唯一
          for (const user in registeredUsers) {
            if (registeredUsers[user].userData.invite_code === code) {
              return generateInviteCode() // 如果重复，重新生成
            }
          }
          return code
        }
        
        const userInviteCode = generateInviteCode()
        
        // 创建模拟用户数据
        const isFirstUser = userCount === 0
        const userData = {
          id: 'mock-user-id-' + username,
          username,
          invite_code: userInviteCode, // 每个用户都有自己的邀请码
          inviter_id: null, // 注册时不绑定邀请人，付费成为代理时才绑定
          referral_position: 1,
          has_network: false,
          network_root_id: null,
          direct_referral_count: 0,
          total_earnings: 0,
          u_balance: 50, // 给新用户50U初始余额用于测试
          points_balance: 150, // 总积分
          mining_points: 150, // 矿机产出积分（用于测试购买矿机和兑换U）
          transfer_points: 0, // 互转积分
          is_agent: isFirstUser, // 第一个用户自动成为代理（用于测试）
          agent_paid_at: isFirstUser ? new Date().toISOString() : null,
          qualified_for_dividend: false,
          is_admin: isFirstUser, // 第一个用户自动成为管理员
          language: 'zh',
          created_at: new Date().toISOString()
        }
        
        console.log('✅ 用户注册成功，邀请码:', userInviteCode)
        
        // 保存用户到localStorage
        registeredUsers[username] = {
          password: password, // 开发模式下保存密码用于验证
          userData: userData
        }
        localStorage.setItem('registered_users', JSON.stringify(registeredUsers))
        localStorage.setItem('current_user', username)
        
        user.value = userData
        
        return { 
          success: true
        }
      }

      // 真实Supabase注册（不使用Auth，直接users表）
      
      // 检查用户名是否已存在
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()
      
      if (existingUser) {
        throw new Error('用户名已被注册')
      }

      // 生成邀请码和UUID
      const generateInviteCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let code = ''
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
      }

      const newInviteCode = generateInviteCode()
      const userId = crypto.randomUUID()

      // 检查是否是第一个用户
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // 直接插入users表
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: username,
          password_hash: password, // 临时明文存储，生产环境需加密
          invite_code: newInviteCode,
          inviter_id: null,
          is_agent: false,
          is_admin: (count === 0),
          u_balance: 50,
          points_balance: 150,
          mining_points: 150,
          transfer_points: 0
        })

      if (insertError) {
        console.error('插入用户失败:', insertError)
        throw new Error('注册失败: ' + insertError.message)
      }

      // 获取用户信息
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      user.value = userData

      return { 
        success: true
      }
    } catch (error: any) {
      console.error('Register error:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      loading.value = true
      
      // 开发模式
      if (isDevMode) {
        // 清除当前登录用户
        localStorage.removeItem('current_user')
        user.value = null
        return { success: true }
      }
      
      // 生产模式
      await supabase.auth.signOut()
      user.value = null
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  // 刷新用户数据（从数据库重新加载）
  async function loadUser() {
    try {
      if (!user.value) return

      // 开发模式：从Supabase数据库获取最新数据
      if (isDevMode) {
        // 通过username查询最新数据
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', user.value.username)
          .single()

        if (error) {
          console.error('Load user error:', error)
          return
        }

        if (userData) {
          // 更新store中的用户数据
          user.value = userData

          // 更新localStorage中的用户数据
          const currentUsername = localStorage.getItem('current_user')
          if (currentUsername) {
            const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '{}')
            if (registeredUsers[currentUsername]) {
              registeredUsers[currentUsername].userData = userData
              localStorage.setItem('registered_users', JSON.stringify(registeredUsers))
            }
          }
        }
        return
      }

      // 生产模式：从Supabase获取最新数据
      if (user.value.id) {
        await fetchUserProfile(user.value.id)
      }
    } catch (error) {
      console.error('Load user error:', error)
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

