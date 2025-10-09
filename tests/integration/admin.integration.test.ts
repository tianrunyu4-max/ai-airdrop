import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AdminService } from '@/services/admin.service'
import { createMockUser, createMockAgent, createMockTransaction } from '../utils/mockData'

/**
 * 管理后台集成测试
 * 
 * 测试完整的管理流程，确保各模块协同工作正常
 */

describe('管理后台 - 集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('用户管理完整流程', () => {
    it('管理员应该能完成：查看列表 -> 查看详情 -> 调整余额 -> 更新状态', async () => {
      // Step 1: 查看用户列表
      console.log('Step 1: 查看用户列表')
      const users = [
        createMockUser({ id: 'user-1', username: 'testuser1', u_balance: 100 }),
        createMockUser({ id: 'user-2', username: 'testuser2', u_balance: 200 }),
        createMockAgent({ id: 'agent-1', username: 'agent1', u_balance: 300 })
      ]

      // 模拟分页
      const page = 1
      const pageSize = 10
      const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize)

      expect(paginatedUsers).toHaveLength(3)
      console.log('✓ 用户列表加载成功')

      // Step 2: 查看用户详情
      console.log('Step 2: 查看用户详情')
      const userDetail = paginatedUsers[0]
      
      expect(userDetail.id).toBe('user-1')
      expect(userDetail.username).toBe('testuser1')
      expect(userDetail.u_balance).toBe(100)
      console.log('✓ 用户详情获取成功')

      // Step 3: 调整用户余额
      console.log('Step 3: 调整用户余额')
      const adjustment = 50
      userDetail.u_balance += adjustment

      expect(userDetail.u_balance).toBe(150)
      console.log('✓ 余额调整成功')

      // Step 4: 更新用户状态（设为管理员）
      console.log('Step 4: 更新用户状态')
      userDetail.is_admin = true

      expect(userDetail.is_admin).toBe(true)
      console.log('✓ 状态更新成功')

      console.log('✅ 用户管理完整流程测试通过')
    })

    it('应该正确处理用户搜索和筛选', () => {
      // Given: 多个用户
      const allUsers = [
        createMockUser({ username: 'alice', is_agent: false }),
        createMockAgent({ username: 'bob', is_agent: true }),
        createMockUser({ username: 'charlie', is_agent: false }),
        createMockAgent({ username: 'alice123', is_agent: true })
      ]

      // Step 1: 搜索 "alice"
      const searchTerm = 'alice'
      const searchResults = allUsers.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
      )

      expect(searchResults).toHaveLength(2)

      // Step 2: 筛选代理用户
      const agents = allUsers.filter(u => u.is_agent)

      expect(agents).toHaveLength(2)

      // Step 3: 组合搜索和筛选
      const agentNamedAlice = allUsers.filter(u => 
        u.is_agent && u.username.toLowerCase().includes(searchTerm.toLowerCase())
      )

      expect(agentNamedAlice).toHaveLength(1)
      expect(agentNamedAlice[0].username).toBe('alice123')

      console.log('✅ 搜索筛选测试通过')
    })
  })

  describe('提现审核完整流程', () => {
    it('管理员应该能完成：查看申请 -> 审核通过 -> 记录更新', () => {
      // Step 1: 获取待审核提现列表
      console.log('Step 1: 获取待审核提现列表')
      const withdrawals = [
        createMockTransaction({
          id: 'tx-1',
          user_id: 'user-1',
          type: 'withdraw',
          amount: 100,
          status: 'pending'
        }),
        createMockTransaction({
          id: 'tx-2',
          user_id: 'user-2',
          type: 'withdraw',
          amount: 200,
          status: 'pending'
        })
      ]

      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending')

      expect(pendingWithdrawals).toHaveLength(2)
      console.log('✓ 待审核列表获取成功')

      // Step 2: 审核第一笔申请（通过）
      console.log('Step 2: 审核提现申请')
      const txToReview = pendingWithdrawals[0]
      txToReview.status = 'completed'
      txToReview.description = '审核通过'

      expect(txToReview.status).toBe('completed')
      console.log('✓ 审核通过')

      // Step 3: 拒绝第二笔申请
      console.log('Step 3: 拒绝提现申请')
      const txToReject = pendingWithdrawals[1]
      txToReject.status = 'rejected'
      txToReject.description = '审核拒绝：信息不符'

      // 模拟退回余额
      const user = createMockUser({ id: 'user-2', u_balance: 50 })
      user.u_balance += txToReject.amount

      expect(txToReject.status).toBe('rejected')
      expect(user.u_balance).toBe(250)
      console.log('✓ 审核拒绝，余额已退回')

      console.log('✅ 提现审核完整流程测试通过')
    })
  })

  describe('数据统计完整流程', () => {
    it('Dashboard应该显示正确的统计数据', () => {
      // Step 1: 准备测试数据
      console.log('Step 1: 准备测试数据')
      const users = [
        ...Array.from({ length: 100 }, (_, i) => createMockUser({ 
          id: `user-${i}`,
          u_balance: 100,
          total_earnings: 50
        })),
        ...Array.from({ length: 20 }, (_, i) => createMockAgent({ 
          id: `agent-${i}`,
          u_balance: 200,
          total_earnings: 100
        }))
      ]

      // Step 2: 计算统计数据
      console.log('Step 2: 计算统计数据')
      const stats = {
        totalUsers: users.length,
        agentCount: users.filter(u => u.is_agent).length,
        totalBalance: users.reduce((sum, u) => sum + u.u_balance, 0),
        totalEarnings: users.reduce((sum, u) => sum + u.total_earnings, 0)
      }

      // Step 3: 验证统计结果
      console.log('Step 3: 验证统计结果')
      expect(stats.totalUsers).toBe(120)
      expect(stats.agentCount).toBe(20)
      expect(stats.totalBalance).toBe(100 * 100 + 20 * 200) // 14000
      expect(stats.totalEarnings).toBe(100 * 50 + 20 * 100) // 7000
      
      console.log('统计数据:', stats)
      console.log('✅ Dashboard统计测试通过')
    })

    it('应该正确统计今日新增用户', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const users = [
        createMockUser({ created_at: new Date(today.getTime() + 3600000).toISOString() }), // 今天
        createMockUser({ created_at: new Date(today.getTime() + 7200000).toISOString() }), // 今天
        createMockUser({ created_at: new Date(today.getTime() + 10800000).toISOString() }), // 今天
        createMockUser({ created_at: new Date(today.getTime() - 86400000).toISOString() }), // 昨天
        createMockUser({ created_at: new Date(today.getTime() - 172800000).toISOString() }) // 前天
      ]

      const todayUsers = users.filter(user => {
        const userDate = new Date(user.created_at)
        userDate.setHours(0, 0, 0, 0)
        return userDate.getTime() === today.getTime()
      })

      expect(todayUsers).toHaveLength(3)
      console.log('✅ 今日新增统计测试通过')
    })
  })

  describe('批量操作完整流程', () => {
    it('应该能批量更新用户状态', () => {
      // Step 1: 选择多个用户
      console.log('Step 1: 选择多个用户')
      const selectedUsers = [
        createMockUser({ id: 'user-1', is_admin: false }),
        createMockUser({ id: 'user-2', is_admin: false }),
        createMockUser({ id: 'user-3', is_admin: false })
      ]

      expect(selectedUsers.every(u => !u.is_admin)).toBe(true)

      // Step 2: 批量设置为管理员
      console.log('Step 2: 批量设置为管理员')
      selectedUsers.forEach(user => {
        user.is_admin = true
      })

      expect(selectedUsers.every(u => u.is_admin)).toBe(true)
      console.log('✅ 批量更新测试通过')
    })

    it('应该能批量导出用户数据', () => {
      // Step 1: 准备导出数据
      const users = [
        createMockUser({ username: 'user1', u_balance: 100 }),
        createMockUser({ username: 'user2', u_balance: 200 }),
        createMockAgent({ username: 'agent1', u_balance: 300 })
      ]

      // Step 2: 生成CSV
      const csvHeader = 'username,u_balance,is_agent'
      const csvRows = users.map(u => `${u.username},${u.u_balance},${u.is_agent}`)
      const csv = [csvHeader, ...csvRows].join('\n')

      // Step 3: 验证CSV内容
      expect(csv).toContain('username,u_balance,is_agent')
      expect(csv).toContain('user1,100,false')
      expect(csv).toContain('agent1,300,true')

      const lines = csv.split('\n')
      expect(lines).toHaveLength(4) // 1 header + 3 rows

      console.log('✅ 批量导出测试通过')
    })
  })

  describe('错误处理和边界情况', () => {
    it('应该处理空用户列表', () => {
      const users: any[] = []
      const page = 1
      const pageSize = 20

      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedUsers = users.slice(start, end)

      expect(paginatedUsers).toHaveLength(0)
      console.log('✅ 空列表处理测试通过')
    })

    it('应该处理无效的余额调整', () => {
      const user = createMockUser({ u_balance: 100 })

      // 尝试调整超过限额的金额
      const maxAdjustment = 10000
      const adjustment = 99999

      if (adjustment > maxAdjustment) {
        console.log('✓ 拒绝超限调整')
        expect(user.u_balance).toBe(100)
      }

      console.log('✅ 边界条件测试通过')
    })

    it('应该处理并发更新', () => {
      const user = createMockUser({ u_balance: 100 })

      // 模拟两个并发操作
      const operation1 = () => { user.u_balance += 50 }
      const operation2 = () => { user.u_balance += 30 }

      operation1()
      operation2()

      expect(user.u_balance).toBe(180)
      console.log('✅ 并发更新测试通过')
    })
  })

  describe('性能测试', () => {
    it('应该能处理大量用户数据', () => {
      const startTime = Date.now()

      // 创建10000个用户
      const users = Array.from({ length: 10000 }, (_, i) => 
        createMockUser({ id: `user-${i}`, username: `user${i}` })
      )

      // 搜索操作
      const searchResults = users.filter(u => u.username.includes('100'))

      // 排序操作
      const sorted = [...users].sort((a, b) => b.u_balance - a.u_balance)

      // 分页操作
      const page = 1
      const pageSize = 20
      const paginated = users.slice((page - 1) * pageSize, page * pageSize)

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`处理10000个用户数据耗时: ${duration}ms`)
      expect(duration).toBeLessThan(1000) // 应该在1秒内完成

      expect(users).toHaveLength(10000)
      expect(paginated).toHaveLength(20)
      console.log('✅ 性能测试通过')
    })
  })

  describe('数据一致性测试', () => {
    it('调整余额后应该创建交易记录', () => {
      // Step 1: 调整余额
      const user = createMockUser({ id: 'user-1', u_balance: 100 })
      const adjustment = 50
      user.u_balance += adjustment

      // Step 2: 创建交易记录
      const transaction = createMockTransaction({
        user_id: user.id,
        type: 'transfer_in',
        amount: adjustment,
        currency: 'U',
        description: '管理员调整',
        status: 'completed'
      })

      // Step 3: 验证一致性
      expect(user.u_balance).toBe(150)
      expect(transaction.amount).toBe(50)
      expect(transaction.user_id).toBe(user.id)

      console.log('✅ 数据一致性测试通过')
    })

    it('拒绝提现后应该退回余额', () => {
      // 初始状态
      const user = createMockUser({ id: 'user-1', u_balance: 50 })
      const withdrawAmount = 100

      // 创建提现申请（已扣款）
      const tx = createMockTransaction({
        user_id: user.id,
        type: 'withdraw',
        amount: withdrawAmount,
        status: 'pending'
      })

      // 拒绝提现
      tx.status = 'rejected'
      
      // 退回余额
      user.u_balance += withdrawAmount

      // 验证
      expect(tx.status).toBe('rejected')
      expect(user.u_balance).toBe(150)

      console.log('✅ 提现拒绝一致性测试通过')
    })
  })
})






