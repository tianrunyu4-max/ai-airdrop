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
      
      // 检查并修复localStorage数据
      await ensureDefaultUser()
      
      // 🔧 修复：确保boss用户有is_admin权限
      const registeredUsersStr = localStorage.getItem('registered_users')
      const registeredUsers = JSON.parse(registeredUsersStr || '{}')
      if (registeredUsers['boss'] && !registeredUsers['boss'].userData.is_admin) {
        console.log('🔧 修复boss用户权限...')
        registeredUsers['boss'].userData.is_admin = true
        localStorage.setItem('registered_users', JSON.stringify(registeredUsers))
        console.log('✅ boss用户权限已修复')
      }
      
      // 始终从localStorage恢复登录状态（开发和生产环境都使用）
      const currentUser = localStorage.getItem('current_user')
      
      if (currentUser) {
        if (registeredUsers[currentUser]) {
          user.value = registeredUsers[currentUser].userData
          console.log('✅ 从localStorage恢复登录状态:', currentUser)
        }
      }
      
      initialized.value = true
    } catch (error) {
      console.error('Initialize auth error:', error)
    } finally {
      loading.value = false
    }
  }

  // 确保有默认用户（防止localStorage被清理）
  async function ensureDefaultUser() {
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '{}')
      
      // 如果没有用户，创建一个默认的boss用户
      if (Object.keys(registeredUsers).length === 0) {
        console.log('🔧 检测到localStorage为空，创建默认用户...')
        
        const defaultUser = {
          password: 'boss123',
          userData: {
            id: '3314e79e-2d9d-4b08-81a9-5ece03c495ff',
            username: 'boss',
            email: 'boss@example.com',
            is_agent: true,
            is_admin: true, // 🔐 管理员权限
            invite_code: 'DEFAULT01',
            inviter_id: null,
            created_at: new Date().toISOString(),
            balance: 1000,
            points_balance: 500
          }
        }
        
        registeredUsers['boss'] = defaultUser
        localStorage.setItem('registered_users', JSON.stringify(registeredUsers))
        
        console.log('✅ 默认用户创建成功: boss / boss123')
        console.log('📋 当前已注册用户:', Object.keys(registeredUsers))
      } else {
        console.log('📋 当前已注册用户:', Object.keys(registeredUsers))
      }
    } catch (error) {
      console.error('创建默认用户失败:', error)
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
      
      // 始终使用localStorage登录（开发和生产环境）
      // 快速登录，减少延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 从localStorage获取已注册的用户
      const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '{}')
      
      console.log('🔍 登录检查 - 已注册用户:', Object.keys(registeredUsers))
      console.log('🔍 尝试登录用户:', username)
      
      // 验证用户是否已注册
      if (!registeredUsers[username]) {
        console.error('❌ 用户不存在:', username)
        console.log('📋 当前已注册用户列表:', Object.keys(registeredUsers))
        throw new Error('用户名不存在，请先注册')
      }
      
      // 验证密码
      if (registeredUsers[username].password !== password) {
        console.error('❌ 密码错误:', username)
        throw new Error('密码错误')
      }
      
      // 登录成功，恢复用户数据
      user.value = registeredUsers[username].userData
      
      // 保存当前登录用户
      localStorage.setItem('current_user', username)
      
      console.log('✅ 登录成功:', username)
      
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

      // 始终使用localStorage注册（开发和生产环境）
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
        password: password, // 保存密码用于验证
        userData: userData
      }
      localStorage.setItem('registered_users', JSON.stringify(registeredUsers))
      localStorage.setItem('current_user', username)
      
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
      
      // 始终使用localStorage退出（开发和生产环境）
      // 清除当前登录用户
      localStorage.removeItem('current_user')
      user.value = null
      console.log('✅ 退出登录成功')
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  // 刷新用户数据（从localStorage重新加载）
  async function loadUser() {
    try {
      if (!user.value) return

      // 始终从localStorage获取最新数据（开发和生产环境都使用）
      const currentUsername = localStorage.getItem('current_user')
      if (currentUsername) {
        const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '{}')
        if (registeredUsers[currentUsername]) {
          user.value = registeredUsers[currentUsername].userData
          console.log('✅ 刷新用户数据:', currentUsername)
        }
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

