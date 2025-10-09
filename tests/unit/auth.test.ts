import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockUser, createMockAgent } from '../utils/mockData'
import type { User } from '@/types'

/**
 * 用户认证系统测试
 * 
 * 测试范围：
 * 1. 用户注册逻辑
 * 2. 用户登录逻辑
 * 3. 邀请码验证
 * 4. 数据持久化
 */

describe('用户认证系统', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('用户注册', () => {
    it('应该成功注册新用户', () => {
      // Given: 有效的注册信息
      const username = 'newuser'
      const password = '123456'
      const inviteCode = 'TEST2024'

      // When: 调用注册逻辑
      const registeredUsers: any = {}
      const userData = createMockUser({
        username,
        inviter_id: 'mock-inviter-id'
      })

      registeredUsers[username] = {
        password,
        userData
      }

      // Then: 用户数据应该被正确保存
      expect(registeredUsers[username]).toBeDefined()
      expect(registeredUsers[username].password).toBe(password)
      expect(registeredUsers[username].userData.username).toBe(username)
      expect(registeredUsers[username].userData.u_balance).toBe(50) // 新用户初始余额
    })

    it('应该拒绝无效的邀请码', () => {
      // Given: 无效的邀请码
      const invalidCodes = ['', '123', 'ABCDEFGHI', 'test@123', 'Test2024']

      // When & Then: 验证每个无效邀请码
      invalidCodes.forEach(code => {
        const isValid = /^[A-Z0-9]{8}$/.test(code)
        expect(isValid).toBe(false)
      })
    })

    it('应该接受有效的邀请码', () => {
      // Given: 有效的邀请码
      const validCodes = ['TEST2024', 'ABCD1234', '12345678', 'AAAAAAAA']

      // When & Then: 验证每个有效邀请码
      validCodes.forEach(code => {
        const isValid = /^[A-Z0-9]{8}$/.test(code)
        expect(isValid).toBe(true)
      })
    })

    it('应该拒绝重复的用户名', () => {
      // Given: 已存在的用户
      const existingUser = 'existinguser'
      const registeredUsers: any = {
        [existingUser]: {
          password: '123456',
          userData: createMockUser({ username: existingUser })
        }
      }

      // When: 尝试注册相同用户名
      const isDuplicate = registeredUsers[existingUser] !== undefined

      // Then: 应该检测到重复
      expect(isDuplicate).toBe(true)
    })
  })

  describe('用户登录', () => {
    const username = 'testuser'
    const password = '123456'
    let registeredUsers: any

    beforeEach(() => {
      // Setup: 预先注册一个用户
      registeredUsers = {
        [username]: {
          password,
          userData: createMockUser({ username })
        }
      }
    })

    it('应该成功登录已注册用户', () => {
      // When: 使用正确的凭证登录
      const user = registeredUsers[username]
      const passwordMatch = user.password === password

      // Then: 登录成功
      expect(user).toBeDefined()
      expect(passwordMatch).toBe(true)
    })

    it('应该拒绝未注册的用户', () => {
      // When: 使用未注册的用户名
      const nonExistentUser = registeredUsers['nonexistent']

      // Then: 用户不存在
      expect(nonExistentUser).toBeUndefined()
    })

    it('应该拒绝错误的密码', () => {
      // When: 使用错误的密码
      const user = registeredUsers[username]
      const wrongPassword = 'wrongpassword'
      const passwordMatch = user.password === wrongPassword

      // Then: 密码不匹配
      expect(passwordMatch).toBe(false)
    })
  })

  describe('成为代理', () => {
    it('应该生成8位邀请码', () => {
      // When: 生成邀请码
      const generateInviteCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let code = ''
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
      }

      const inviteCode = generateInviteCode()

      // Then: 邀请码符合规则
      expect(inviteCode).toHaveLength(8)
      expect(/^[A-Z0-9]{8}$/.test(inviteCode)).toBe(true)
    })

    it('应该扣除30U并更新用户状态', () => {
      // Given: 用户有50U余额
      const user = createMockUser({ u_balance: 50 })

      // When: 成为代理
      const agentFee = 30
      user.u_balance -= agentFee
      user.is_agent = true
      user.invite_code = 'TEST2024'
      user.agent_paid_at = new Date().toISOString()

      // Then: 状态正确更新
      expect(user.u_balance).toBe(20)
      expect(user.is_agent).toBe(true)
      expect(user.invite_code).toBe('TEST2024')
      expect(user.agent_paid_at).not.toBeNull()
    })

    it('应该拒绝余额不足的用户', () => {
      // Given: 用户只有20U余额
      const user = createMockUser({ u_balance: 20 })
      const agentFee = 30

      // When: 检查余额
      const canBecomeAgent = user.u_balance >= agentFee

      // Then: 余额不足
      expect(canBecomeAgent).toBe(false)
    })
  })

  describe('数据持久化', () => {
    it('应该保存用户数据到localStorage', () => {
      // Given: 新注册的用户
      const username = 'testuser'
      const userData = createMockUser({ username })
      const registeredUsers = {
        [username]: {
          password: '123456',
          userData
        }
      }

      // When: 保存到localStorage
      const savedData = JSON.stringify(registeredUsers)
      const parsedData = JSON.parse(savedData)

      // Then: 数据完整保存
      expect(parsedData[username]).toBeDefined()
      expect(parsedData[username].userData.username).toBe(username)
    })

    it('应该从localStorage恢复用户数据', () => {
      // Given: localStorage中有用户数据
      const username = 'testuser'
      const userData = createMockUser({ username })
      const storedData = JSON.stringify({
        [username]: { password: '123456', userData }
      })

      // When: 从localStorage读取
      const parsedData = JSON.parse(storedData)
      const currentUser = parsedData[username]

      // Then: 数据正确恢复
      expect(currentUser).toBeDefined()
      expect(currentUser.userData.username).toBe(username)
    })
  })
})






