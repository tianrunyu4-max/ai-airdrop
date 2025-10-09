/**
 * 提现功能测试（使用Mock）
 * 
 * 测试目标：
 * 1. 提现申请功能
 * 2. 提现条件验证
 * 3. 提现记录查询
 * 4. 钱包地址验证
 * 5. 余额扣除
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { WithdrawalService } from '@/services/withdrawal.service'
import { createMockUser } from '../utils/mockSupabase'

// Mock数据存储（必须在vi.mock外部，但可以在测试中访问）
const mockUsers = new Map()
const mockTransactions: any[] = []

// Mock Supabase模块
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn((field: string, value: any) => ({
                single: vi.fn(() => {
                  const user = mockUsers.get(value)
                  return Promise.resolve({
                    data: user || null,
                    error: user ? null : { message: 'User not found' }
                  })
                })
              }))
            })),
            update: vi.fn((data: any) => ({
              eq: vi.fn((field: string, value: any) => {
                const user = mockUsers.get(value)
                if (user) {
                  Object.assign(user, data)
                }
                return Promise.resolve({ data: null, error: null })
              })
            }))
          }
        }

        if (table === 'transactions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn((field: string, value: any) => {
                let filtered = mockTransactions.filter((t: any) => t[field] === value)
                return {
                  // 第二层 eq
                  eq: vi.fn((field2: string, value2: any) => {
                    filtered = filtered.filter((t: any) => t[field2] === value2)
                    return {
                      // 第三层 eq - 修复！
                      eq: vi.fn((field3: string, value3: any) => {
                        filtered = filtered.filter((t: any) => t[field3] === value3)
                        return {
                          // 第三层之后也需要支持order
                          order: vi.fn(() => ({
                            range: vi.fn(() => Promise.resolve({
                              data: filtered,
                              error: null,
                              count: filtered.length
                            }))
                          }))
                        }
                      }),
                      // in方法 - 第二层之后
                      in: vi.fn((field3: string, values: any[]) => {
                        filtered = filtered.filter((t: any) => values.includes(t[field3]))
                        return {
                          gte: vi.fn(() => Promise.resolve({ data: filtered, error: null }))
                        }
                      }),
                      // order方法 - 第二层之后
                      order: vi.fn(() => ({
                        range: vi.fn(() => Promise.resolve({
                          data: filtered,
                          error: null,
                          count: filtered.length
                        }))
                      }))
                    }
                  }),
                  // in方法 - 第一层之后
                  in: vi.fn((field2: string, values: any[]) => {
                    filtered = filtered.filter((t: any) => values.includes(t[field2]))
                    return {
                      gte: vi.fn(() => Promise.resolve({ data: filtered, error: null }))
                    }
                  }),
                  // order方法 - 第一层之后
                  order: vi.fn(() => ({
                    range: vi.fn(() => Promise.resolve({
                      data: filtered,
                      error: null,
                      count: filtered.length
                    }))
                  }))
                }
              })
            })),
            insert: vi.fn((data: any) => {
              const item = { ...data, id: 'tx-' + Date.now(), created_at: new Date().toISOString() }
              mockTransactions.push(item)
              return {
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: item, error: null }))
                }))
              }
            })
          }
        }

        return {
          select: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }
      }),
      rpc: vi.fn(() => Promise.resolve({ data: null, error: null }))
    },
    isDevMode: true
  }
})

describe('提现功能测试', () => {
  beforeEach(() => {
    // 每个测试前清空Mock数据
    mockUsers.clear()
    mockTransactions.length = 0
  })

  describe('1. 提现申请', () => {
    test('余额充足时，应该能申请提现', async () => {
      // 准备测试数据
      const mockUser = createMockUser({
        id: 'user-1',
        u_balance: 50,
        username: 'testuser'
      })
      mockUsers.set(mockUser.id, mockUser)

      // 执行测试
      const result = await WithdrawalService.createWithdrawal({
        userId: mockUser.id,
        amount: 20,
        walletAddress: 'TRX1234567890123456789012345678901' // 34位有效TRC20地址
      })

      // 验证结果
      expect(result).toBeDefined()
      expect(result.amount).toBe(20)
      expect(result.status).toBe('pending')
      expect(result.wallet_address).toBe('TRX1234567890123456789012345678901')
    })

    test('余额不足时，提现应该失败', async () => {
      const mockUser = createMockUser({
        id: 'user-2',
        u_balance: 10,
        username: 'testuser2'
      })
      mockUsers.set(mockUser.id, mockUser)

      await expect(
        WithdrawalService.createWithdrawal({
          userId: mockUser.id,
          amount: 20,
          walletAddress: 'TRX1234567890123456789012345678901'
        })
      ).rejects.toThrow('余额不足')
    })

    test('提现金额低于最小额度时，应该失败', async () => {
      const mockUser = createMockUser({
        id: 'user-3',
        u_balance: 100,
        username: 'testuser3'
      })
      mockUsers.set(mockUser.id, mockUser)

      await expect(
        WithdrawalService.createWithdrawal({
          userId: mockUser.id,
          amount: 10, // 低于20U最小额度
          walletAddress: 'TRX1234567890123456789012345678901'
        })
      ).rejects.toThrow('提现金额不能低于20U')
    })

    test('钱包地址为空时，应该失败', async () => {
      const mockUser = createMockUser({
        id: 'user-4',
        u_balance: 100,
        username: 'testuser4'
      })
      mockUsers.set(mockUser.id, mockUser)

      await expect(
        WithdrawalService.createWithdrawal({
          userId: mockUser.id,
          amount: 20,
          walletAddress: ''
        })
      ).rejects.toThrow('请输入有效的钱包地址')
    })
  })

  describe('2. 提现记录查询', () => {
    test('应该能查询用户的提现记录', async () => {
      const userId = 'user-1'
      
      // 准备用户数据
      mockUsers.set(userId, createMockUser({ id: userId }))
      
      // 创建一些提现记录
      mockTransactions.push(
        {
          id: 'tx-1',
          user_id: userId,
          type: 'withdraw',
          amount: 100,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: 'tx-2',
          user_id: userId,
          type: 'withdraw',
          amount: 200,
          status: 'completed',
          created_at: new Date().toISOString()
        }
      )

      const result = await WithdrawalService.getUserWithdrawals(userId, {
        page: 1,
        pageSize: 10
      })

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(result.data.length).toBe(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
    })

    test('应该能按状态筛选提现记录', async () => {
      const userId = 'user-1'
      
      mockUsers.set(userId, createMockUser({ id: userId }))
      
      // 创建不同状态的提现记录
      mockTransactions.push(
        {
          id: 'tx-1',
          user_id: userId,
          type: 'withdraw',
          amount: 100,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: 'tx-2',
          user_id: userId,
          type: 'withdraw',
          amount: 200,
          status: 'completed',
          created_at: new Date().toISOString()
        }
      )

      const result = await WithdrawalService.getUserWithdrawals(userId, {
        status: 'pending'
      })

      expect(result).toBeDefined()
      expect(result.data.length).toBe(1)
      result.data.forEach(withdrawal => {
        expect(withdrawal.status).toBe('pending')
      })
    })

    test('空记录时应该返回空数组', async () => {
      const userId = 'user-new'
      mockUsers.set(userId, createMockUser({ id: userId }))

      const result = await WithdrawalService.getUserWithdrawals(userId)

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  describe('3. 钱包地址验证', () => {
    test('有效的TRC20地址应该通过验证', () => {
      const validAddresses = [
        'TRX1234567890123456789012345678901',
        'TABCdefghijk1234567890ABCDEF123456'
      ]

      validAddresses.forEach(address => {
        expect(WithdrawalService.validateWalletAddress(address)).toBe(true)
      })
    })

    test('无效的地址应该验证失败', () => {
      const invalidAddresses = [
        'TRX123', // 太短
        'INVALID_ADDRESS',
        '0x1234567890123456789012345678901234567890', // ETH地址
        ''
      ]

      invalidAddresses.forEach(address => {
        expect(WithdrawalService.validateWalletAddress(address)).toBe(false)
      })
    })
  })

  describe('4. 提现金额计算', () => {
    test('应该正确计算手续费', () => {
      const amount = 100
      const fee = WithdrawalService.calculateFee(amount)

      // 假设手续费为2%
      expect(fee).toBe(2)
    })

    test('应该正确计算实际到账金额', () => {
      const amount = 100
      const actualAmount = WithdrawalService.calculateActualAmount(amount)

      // 实际到账 = 申请金额 - 手续费
      expect(actualAmount).toBe(98)
    })

    test('最小提现额度应该是20U', () => {
      expect(WithdrawalService.MIN_WITHDRAWAL_AMOUNT).toBe(20)
    })
  })

  describe('5. 并发提现控制', () => {
    test('同一用户不能有多个pending状态的提现', async () => {
      const userId = 'user-5'
      const mockUser = createMockUser({
        id: userId,
        u_balance: 100
      })
      mockUsers.set(mockUser.id, mockUser)

      // 第一次提现
      const firstWithdrawal = await WithdrawalService.createWithdrawal({
        userId,
        amount: 20,
        walletAddress: 'TRX1234567890123456789012345678901'
      })

      // 验证第一次提现成功
      expect(firstWithdrawal.status).toBe('pending')
      expect(mockTransactions.length).toBe(1)

      // 第二次提现（应该失败）
      await expect(
        WithdrawalService.createWithdrawal({
          userId,
          amount: 20,
          walletAddress: 'TRX1234567890123456789012345678901'
        })
      ).rejects.toThrow('您有正在处理的提现申请')
    })
  })

  describe('6. 提现限额', () => {
    test('单笔提现不能超过最大额度', async () => {
      const userId = 'user-6'
      const maxAmount = 10000 // 假设最大额度10000U
      
      const mockUser = createMockUser({
        id: userId,
        u_balance: 20000 // 余额足够
      })
      mockUsers.set(mockUser.id, mockUser)

      await expect(
        WithdrawalService.createWithdrawal({
          userId,
          amount: maxAmount + 1,
          walletAddress: 'TRX1234567890123456789012345678901'
        })
      ).rejects.toThrow('单笔提现不能超过')
    })

    test('应该能查询用户的每日提现额度', async () => {
      const userId = 'user-6'
      mockUsers.set(userId, createMockUser({ id: userId }))

      const limit = await WithdrawalService.getDailyWithdrawalLimit(userId)

      expect(limit).toBeDefined()
      expect(limit.dailyLimit).toBeGreaterThan(0)
      expect(limit.todayWithdrawn).toBeGreaterThanOrEqual(0)
      expect(limit.remaining).toBeGreaterThanOrEqual(0)
    })
  })
})
