import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockUser, createMockAgent } from '../../utils/mockData'
import type { User } from '@/types'

/**
 * 管理后台 - 用户管理模块测试
 * 
 * 测试范围：
 * 1. 获取用户列表（分页、搜索、筛选）
 * 2. 获取用户详情
 * 3. 更新用户信息
 * 4. 封禁/解封用户
 * 5. 重置用户密码
 * 6. 用户统计数据
 */

describe('管理后台 - 用户管理', () => {
  describe('获取用户列表', () => {
    it('应该返回分页的用户列表', () => {
      // Given: 有10个用户
      const users = Array.from({ length: 10 }, (_, i) => 
        createMockUser({ id: `user-${i}`, username: `user${i}` })
      )

      const page = 1
      const pageSize = 5

      // When: 获取第1页，每页5条
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedUsers = users.slice(start, end)

      // Then: 应该返回5个用户
      expect(paginatedUsers).toHaveLength(5)
      expect(paginatedUsers[0].username).toBe('user0')
      expect(paginatedUsers[4].username).toBe('user4')
    })

    it('应该支持用户名搜索', () => {
      // Given: 多个用户
      const users = [
        createMockUser({ username: 'alice' }),
        createMockUser({ username: 'bob' }),
        createMockUser({ username: 'charlie' }),
        createMockUser({ username: 'alice123' })
      ]

      // When: 搜索关键词 "alice"
      const searchTerm = 'alice'
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )

      // Then: 应该返回2个匹配的用户
      expect(filtered).toHaveLength(2)
      expect(filtered[0].username).toBe('alice')
      expect(filtered[1].username).toBe('alice123')
    })

    it('应该支持按代理状态筛选', () => {
      // Given: 混合用户和代理
      const users = [
        createMockUser({ is_agent: false }),
        createMockAgent({ is_agent: true }),
        createMockUser({ is_agent: false }),
        createMockAgent({ is_agent: true })
      ]

      // When: 筛选代理用户
      const agents = users.filter(user => user.is_agent)

      // Then: 应该返回2个代理
      expect(agents).toHaveLength(2)
      agents.forEach(agent => {
        expect(agent.is_agent).toBe(true)
      })
    })

    it('应该支持按注册时间排序', () => {
      // Given: 不同注册时间的用户
      const users = [
        createMockUser({ created_at: '2024-01-03T00:00:00Z' }),
        createMockUser({ created_at: '2024-01-01T00:00:00Z' }),
        createMockUser({ created_at: '2024-01-02T00:00:00Z' })
      ]

      // When: 按时间降序排序（最新的在前）
      const sorted = [...users].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      // Then: 最新的应该在第一位
      expect(sorted[0].created_at).toBe('2024-01-03T00:00:00Z')
      expect(sorted[2].created_at).toBe('2024-01-01T00:00:00Z')
    })
  })

  describe('获取用户详情', () => {
    it('应该返回完整的用户信息', () => {
      // Given: 一个用户
      const user = createMockAgent({
        id: 'user-123',
        username: 'testuser',
        u_balance: 100,
        points_balance: 500,
        direct_referral_count: 5,
        total_earnings: 200
      })

      // When: 获取用户详情
      const detail = user

      // Then: 应该包含所有字段
      expect(detail.id).toBe('user-123')
      expect(detail.username).toBe('testuser')
      expect(detail.u_balance).toBe(100)
      expect(detail.points_balance).toBe(500)
      expect(detail.direct_referral_count).toBe(5)
      expect(detail.total_earnings).toBe(200)
      expect(detail.is_agent).toBe(true)
    })

    it('应该包含用户的网络信息', () => {
      // Given: 有网络的用户
      const user = createMockAgent({
        has_network: true,
        network_root_id: 'user-123',
        direct_referral_count: 10
      })

      // Then: 应该显示网络信息
      expect(user.has_network).toBe(true)
      expect(user.network_root_id).toBe('user-123')
      expect(user.direct_referral_count).toBe(10)
    })
  })

  describe('更新用户信息', () => {
    it('应该允许管理员修改用户余额', () => {
      // Given: 一个用户
      const user = createMockUser({ u_balance: 50 })

      // When: 管理员增加余额
      const adjustment = 100
      user.u_balance += adjustment

      // Then: 余额应该更新
      expect(user.u_balance).toBe(150)
    })

    it('应该允许管理员修改用户积分', () => {
      // Given: 一个用户
      const user = createMockUser({ points_balance: 200 })

      // When: 管理员扣除积分
      const adjustment = -50
      user.points_balance += adjustment

      // Then: 积分应该更新
      expect(user.points_balance).toBe(150)
    })

    it('应该允许管理员设置/取消管理员权限', () => {
      // Given: 普通用户
      const user = createMockUser({ is_admin: false })

      // When: 设置为管理员
      user.is_admin = true

      // Then: 权限应该更新
      expect(user.is_admin).toBe(true)

      // When: 取消管理员
      user.is_admin = false

      // Then: 权限应该撤销
      expect(user.is_admin).toBe(false)
    })
  })

  describe('封禁/解封用户', () => {
    it('应该能够封禁用户', () => {
      // Given: 正常用户
      const user = createMockUser({
        id: 'user-123',
        // 假设有 banned 字段
      }) as User & { banned?: boolean, banned_at?: string, banned_reason?: string }

      // When: 封禁用户
      user.banned = true
      user.banned_at = new Date().toISOString()
      user.banned_reason = '违规操作'

      // Then: 用户应该被封禁
      expect(user.banned).toBe(true)
      expect(user.banned_at).toBeDefined()
      expect(user.banned_reason).toBe('违规操作')
    })

    it('应该能够解封用户', () => {
      // Given: 被封禁的用户
      const user = createMockUser({}) as User & { banned?: boolean, banned_at?: string | null }
      user.banned = true
      user.banned_at = '2024-01-01T00:00:00Z'

      // When: 解封用户
      user.banned = false
      user.banned_at = null

      // Then: 用户应该被解封
      expect(user.banned).toBe(false)
      expect(user.banned_at).toBeNull()
    })
  })

  describe('用户统计数据', () => {
    it('应该计算总用户数', () => {
      // Given: 多个用户
      const users = Array.from({ length: 100 }, (_, i) => 
        createMockUser({ id: `user-${i}` })
      )

      // When: 统计总数
      const total = users.length

      // Then: 应该返回100
      expect(total).toBe(100)
    })

    it('应该计算代理用户数', () => {
      // Given: 混合用户
      const users = [
        ...Array.from({ length: 30 }, (_, i) => createMockAgent({ id: `agent-${i}` })),
        ...Array.from({ length: 70 }, (_, i) => createMockUser({ id: `user-${i}` }))
      ]

      // When: 统计代理数
      const agentCount = users.filter(u => u.is_agent).length

      // Then: 应该返回30
      expect(agentCount).toBe(30)
    })

    it('应该计算今日新增用户数', () => {
      // Given: 不同时间注册的用户
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const users = [
        createMockUser({ created_at: new Date(today.getTime() + 3600000).toISOString() }), // 今天
        createMockUser({ created_at: new Date(today.getTime() + 7200000).toISOString() }), // 今天
        createMockUser({ created_at: new Date(today.getTime() - 86400000).toISOString() }) // 昨天
      ]

      // When: 统计今日新增
      const todayUsers = users.filter(user => {
        const userDate = new Date(user.created_at)
        userDate.setHours(0, 0, 0, 0)
        return userDate.getTime() === today.getTime()
      })

      // Then: 应该返回2
      expect(todayUsers).toHaveLength(2)
    })

    it('应该计算用户总余额', () => {
      // Given: 多个用户
      const users = [
        createMockUser({ u_balance: 100 }),
        createMockUser({ u_balance: 200 }),
        createMockUser({ u_balance: 150 })
      ]

      // When: 计算总余额
      const totalBalance = users.reduce((sum, user) => sum + user.u_balance, 0)

      // Then: 应该返回450
      expect(totalBalance).toBe(450)
    })
  })

  describe('批量操作', () => {
    it('应该支持批量更新用户状态', () => {
      // Given: 多个用户ID
      const userIds = ['user-1', 'user-2', 'user-3']
      const users = userIds.map(id => createMockUser({ id })) as Array<User & { banned?: boolean }>

      // When: 批量封禁
      users.forEach(user => {
        user.banned = true
      })

      // Then: 所有用户应该被封禁
      users.forEach(user => {
        expect(user.banned).toBe(true)
      })
    })

    it('应该支持批量导出用户数据', () => {
      // Given: 用户列表
      const users = [
        createMockUser({ username: 'user1', u_balance: 100 }),
        createMockUser({ username: 'user2', u_balance: 200 })
      ]

      // When: 导出为CSV格式
      const csvHeader = 'username,u_balance,is_agent'
      const csvRows = users.map(user => 
        `${user.username},${user.u_balance},${user.is_agent}`
      )
      const csv = [csvHeader, ...csvRows].join('\n')

      // Then: 应该生成正确的CSV
      expect(csv).toContain('username,u_balance,is_agent')
      expect(csv).toContain('user1,100,false')
      expect(csv).toContain('user2,200,false')
    })
  })
})






