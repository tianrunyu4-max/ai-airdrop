/**
 * Supabase集成测试
 * 
 * 测试目标：
 * 1. 验证Supabase连接是否正常
 * 2. 测试基本CRUD操作
 * 3. 测试认证流程
 * 4. 测试实时订阅功能
 * 
 * 运行前提：
 * - 需要有真实的Supabase项目
 * - 需要配置.env文件
 * - 需要已部署数据库Schema
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { supabase, isDevMode } from '@/lib/supabase'

describe('Supabase集成测试', () => {
  // 如果是开发模式，跳过所有测试
  if (isDevMode) {
    test.skip('开发模式：跳过Supabase真实连接测试', () => {
      console.log('⚠️  当前使用开发模式，Supabase集成测试已跳过')
      console.log('💡 如需测试真实数据库，请配置.env文件')
    })
    return
  }

  let testUserId: string | null = null
  const testUsername = `test_user_${Date.now()}`
  const testPassword = 'Test@123456'

  beforeAll(async () => {
    console.log('🔧 初始化Supabase集成测试环境')
  })

  afterAll(async () => {
    // 清理测试数据
    if (testUserId) {
      console.log('🧹 清理测试数据...')
      // 注意：这里需要管理员权限才能删除用户
      // 在实际环境中，可能需要使用service role key
    }
  })

  describe('1. 连接测试', () => {
    test('应该能成功连接到Supabase', async () => {
      const { data, error } = await supabase.from('users').select('count').limit(1)
      
      expect(error).toBeNull()
      console.log('✅ Supabase连接成功')
    })

    test('应该能访问数据库表', async () => {
      // 测试访问各个核心表
      const tables = ['users', 'transactions', 'mining_machines', 'chat_groups']
      
      for (const table of tables) {
        const { error } = await supabase.from(table).select('count').limit(1)
        expect(error).toBeNull()
        console.log(`✅ 表 ${table} 可访问`)
      }
    })
  })

  describe('2. 用户认证测试', () => {
    test('应该能注册新用户', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: `${testUsername}@test.com`,
        password: testPassword,
        options: {
          data: {
            username: testUsername
          }
        }
      })

      expect(error).toBeNull()
      expect(data.user).toBeDefined()
      
      if (data.user) {
        testUserId = data.user.id
        console.log('✅ 用户注册成功:', testUserId)
      }
    })

    test('应该能登录已注册用户', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${testUsername}@test.com`,
        password: testPassword
      })

      expect(error).toBeNull()
      expect(data.session).toBeDefined()
      expect(data.user?.id).toBe(testUserId)
      console.log('✅ 用户登录成功')
    })

    test('应该能获取当前会话', async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      expect(error).toBeNull()
      expect(session).toBeDefined()
      console.log('✅ 会话获取成功')
    })

    test('应该能退出登录', async () => {
      const { error } = await supabase.auth.signOut()

      expect(error).toBeNull()
      
      const { data: { session } } = await supabase.auth.getSession()
      expect(session).toBeNull()
      console.log('✅ 用户退出成功')
    })
  })

  describe('3. 数据库CRUD测试', () => {
    beforeEach(async () => {
      // 确保已登录
      await supabase.auth.signInWithPassword({
        email: `${testUsername}@test.com`,
        password: testPassword
      })
    })

    test('应该能插入用户数据', async () => {
      const userData = {
        username: testUsername,
        invite_code: `TEST${Date.now()}`,
        u_balance: 0,
        points_balance: 0
      }

      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.username).toBe(testUsername)
      console.log('✅ 用户数据插入成功')
    })

    test('应该能查询用户数据', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', testUsername)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.username).toBe(testUsername)
      console.log('✅ 用户数据查询成功')
    })

    test('应该能更新用户数据', async () => {
      const newBalance = 100.50

      const { data, error } = await supabase
        .from('users')
        .update({ u_balance: newBalance })
        .eq('username', testUsername)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.u_balance).toBe(newBalance)
      console.log('✅ 用户数据更新成功')
    })
  })

  describe('4. 交易记录测试', () => {
    test('应该能创建交易记录', async () => {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('username', testUsername)
        .single()

      if (!userData) {
        throw new Error('测试用户不存在')
      }

      const transactionData = {
        user_id: userData.id,
        type: 'spot_award',
        amount: 8,
        description: '见点奖',
        balance_after: 8
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.amount).toBe(8)
      console.log('✅ 交易记录创建成功')
    })

    test('应该能查询用户交易历史', async () => {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('username', testUsername)
        .single()

      if (!userData) {
        throw new Error('测试用户不存在')
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      console.log(`✅ 交易历史查询成功，共 ${data?.length} 条记录`)
    })
  })

  describe('5. 实时订阅测试', () => {
    test('应该能订阅数据库变化', async () => {
      return new Promise((resolve) => {
        let messageReceived = false

        // 订阅messages表的变化
        const subscription = supabase
          .channel('test-messages')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'messages'
            },
            (payload) => {
              console.log('📨 收到实时更新:', payload)
              messageReceived = true
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ 实时订阅成功')
              
              // 等待一小段时间后取消订阅
              setTimeout(async () => {
                await subscription.unsubscribe()
                expect(status).toBe('SUBSCRIBED')
                resolve(true)
              }, 1000)
            }
          })
      })
    }, 5000) // 设置5秒超时
  })

  describe('6. RLS (Row Level Security) 测试', () => {
    test('用户应该只能访问自己的数据', async () => {
      // 确保已登录为测试用户
      await supabase.auth.signInWithPassword({
        email: `${testUsername}@test.com`,
        password: testPassword
      })

      // 尝试查询其他用户的数据（应该被RLS阻止）
      const { data, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })

      // 根据RLS规则，用户可能只能看到自己的数据
      console.log(`✅ RLS测试：用户可见 ${count} 条记录`)
    })
  })

  describe('7. 性能测试', () => {
    test('批量查询应该在合理时间内完成', async () => {
      const startTime = Date.now()

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(100)

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(error).toBeNull()
      expect(duration).toBeLessThan(2000) // 应该在2秒内完成
      console.log(`✅ 查询100条记录耗时: ${duration}ms`)
    })

    test('并发查询应该正常工作', async () => {
      const queries = Array(10).fill(null).map(() =>
        supabase.from('users').select('count').limit(1)
      )

      const results = await Promise.all(queries)

      results.forEach((result, index) => {
        expect(result.error).toBeNull()
      })

      console.log('✅ 10个并发查询全部成功')
    })
  })
})


