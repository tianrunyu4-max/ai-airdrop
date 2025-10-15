/**
 * Supabase Mock工具
 * 用于在单元测试中模拟Supabase数据库操作
 */

import { vi } from 'vitest'

interface MockUser {
  id: string
  username: string
  u_balance: number
  points_balance?: number
  [key: string]: any
}

interface MockTransaction {
  id?: string
  user_id: string
  type: string
  amount: number
  status: string
  wallet_address?: string
  [key: string]: any
}

export function createMockSupabase() {
  // 模拟数据存储
  const mockUsers = new Map<string, MockUser>()
  const mockTransactions: MockTransaction[] = []
  let transactionIdCounter = 1

  // 辅助函数
  const helpers = {
    addMockUser: (user: MockUser) => {
      mockUsers.set(user.id, { ...user })
    },
    clearMockData: () => {
      mockUsers.clear()
      mockTransactions.length = 0
      transactionIdCounter = 1
    },
    getMockUsers: () => mockUsers,
    getMockTransactions: () => mockTransactions
  }

  // Mock Supabase客户端
  const mockSupabase = {
    from: vi.fn((table: string) => {
      // Mock users表
      if (table === 'users') {
        return {
          select: vi.fn((fields?: string) => ({
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
                mockUsers.set(value, user)
              }
              return Promise.resolve({
                data: null,
                error: null
              })
            })
          }))
        }
      }

      // Mock transactions表
      if (table === 'transactions') {
        return {
          select: vi.fn((fields?: string, options?: any) => ({
            eq: vi.fn((field: string, value: any) => {
              let filtered = mockTransactions.filter((t: any) => t[field] === value)
              
              return {
                eq: vi.fn((field2: string, value2: any) => {
                  filtered = filtered.filter((t: any) => t[field2] === value2)
                  return {
                    in: vi.fn(() => ({
                      gte: vi.fn(() => Promise.resolve({
                        data: filtered,
                        error: null
                      }))
                    }))
                  }
                }),
                in: vi.fn((field2: string, values: any[]) => {
                  filtered = filtered.filter((t: any) => values.includes(t[field2]))
                  return {
                    gte: vi.fn(() => Promise.resolve({
                      data: filtered,
                      error: null
                    }))
                  }
                }),
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
          insert: vi.fn((data: MockTransaction | MockTransaction[]) => {
            const items = Array.isArray(data) ? data : [data]
            const inserted = items.map(item => ({
              ...item,
              id: item.id || `tx-${transactionIdCounter++}`,
              created_at: new Date().toISOString()
            }))
            mockTransactions.push(...inserted)
            
            return {
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: inserted[0],
                  error: null
                }))
              }))
            }
          }),
          update: vi.fn((data: any) => ({
            eq: vi.fn((field: string, value: any) => {
              const transaction = mockTransactions.find((t: any) => t[field] === value)
              if (transaction) {
                Object.assign(transaction, data)
              }
              return Promise.resolve({
                data: null,
                error: null
              })
            })
          }))
        }
      }

      // 默认返回空操作
      return {
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => Promise.resolve({ data: null, error: null })),
        delete: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }
    }),
    
    rpc: vi.fn((functionName: string, params?: any) => {
      // Mock increment函数
      if (functionName === 'increment') {
        const user = mockUsers.get(params.row_id)
        if (user) {
          user.u_balance = (user.u_balance || 0) + params.amount
        }
      }
      return Promise.resolve({ data: null, error: null })
    })
  }

  return {
    ...mockSupabase,
    ...helpers
  }
}

/**
 * 创建Mock用户数据
 */
export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: 'mock-user-' + Date.now(),
    username: 'testuser',
    u_balance: 1000,
    points_balance: 5000,
    is_agent: false,
    ...overrides
  }
}

/**
 * 创建Mock交易数据
 */
export function createMockTransaction(overrides?: Partial<MockTransaction>): MockTransaction {
  return {
    id: 'mock-tx-' + Date.now(),
    user_id: 'mock-user-1',
    type: 'withdraw',
    amount: 100,
    currency: 'U',
    status: 'pending',
    created_at: new Date().toISOString(),
    ...overrides
  }
}



















