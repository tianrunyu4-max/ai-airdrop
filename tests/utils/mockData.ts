import type { User, Transaction, MiningMachine, Message } from '@/types'

/**
 * 测试数据生成器
 */

export const createMockUser = (overrides: Partial<User> = {}): User => {
  return {
    id: 'test-user-id',
    username: 'testuser',
    invite_code: null,
    inviter_id: null,
    referral_position: 0,
    has_network: false,
    network_root_id: null,
    direct_referral_count: 0,
    total_earnings: 0,
    u_balance: 50,
    points_balance: 0,
    is_agent: false,
    agent_paid_at: null,
    qualified_for_dividend: false,
    is_admin: false,
    language: 'zh',
    created_at: new Date().toISOString(),
    ...overrides
  }
}

export const createMockAgent = (overrides: Partial<User> = {}): User => {
  return createMockUser({
    is_agent: true,
    invite_code: 'TEST2024',
    agent_paid_at: new Date().toISOString(),
    u_balance: 20,
    ...overrides
  })
}

export const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => {
  return {
    id: 'test-transaction-id',
    user_id: 'test-user-id',
    type: 'spot_award',
    amount: 8,
    currency: 'U',
    related_user_id: null,
    description: '见点奖',
    status: 'completed',
    created_at: new Date().toISOString(),
    ...overrides
  }
}

export const createMockMiningMachine = (overrides: Partial<MiningMachine> = {}): MiningMachine => {
  return {
    id: 'test-machine-id',
    user_id: 'test-user-id',
    initial_points: 100,
    released_points: 10,
    total_points: 1000,
    base_rate: 0.01,
    boost_rate: 0,
    boost_count: 0,
    is_active: true,
    exited_at: null,
    created_at: new Date().toISOString(),
    ...overrides
  }
}

export const createMockMessage = (overrides: Partial<Message> = {}): Message => {
  return {
    id: 'test-message-id',
    chat_group_id: 'test-group-id',
    user_id: 'test-user-id',
    username: 'testuser',
    content: 'Test message',
    type: 'text',
    created_at: new Date().toISOString(),
    deleted_at: null,
    ...overrides
  }
}

/**
 * 创建用户网络结构（用于测试链动2+1）
 */
export const createMockNetwork = () => {
  // 用户A - 网络所有者
  const userA = createMockAgent({
    id: 'user-a',
    username: 'userA',
    has_network: true,
    direct_referral_count: 5,
    qualified_for_dividend: true
  })

  // 用户B、C - A的前2个直推（紧缩到A的上级网络）
  const userB = createMockUser({
    id: 'user-b',
    username: 'userB',
    inviter_id: 'user-a',
    referral_position: 1,
    network_root_id: userA.network_root_id
  })

  const userC = createMockUser({
    id: 'user-c',
    username: 'userC',
    inviter_id: 'user-a',
    referral_position: 2,
    network_root_id: userA.network_root_id
  })

  // 用户D、E - A的第3、4个直推（建立A的网络）
  const userD = createMockUser({
    id: 'user-d',
    username: 'userD',
    inviter_id: 'user-a',
    referral_position: 3,
    network_root_id: 'user-a'
  })

  const userE = createMockUser({
    id: 'user-e',
    username: 'userE',
    inviter_id: 'user-a',
    referral_position: 4,
    network_root_id: 'user-a'
  })

  return { userA, userB, userC, userD, userE }
}

/**
 * 创建5级推荐链（用于测试平级见点奖）
 */
export const createMockReferralChain = () => {
  const level1 = createMockAgent({
    id: 'level-1',
    username: 'level1',
    direct_referral_count: 5,
    qualified_for_dividend: true
  })

  const level2 = createMockAgent({
    id: 'level-2',
    username: 'level2',
    inviter_id: 'level-1',
    direct_referral_count: 5,
    qualified_for_dividend: true
  })

  const level3 = createMockUser({
    id: 'level-3',
    username: 'level3',
    inviter_id: 'level-2',
    direct_referral_count: 3
  })

  const level4 = createMockAgent({
    id: 'level-4',
    username: 'level4',
    inviter_id: 'level-3',
    direct_referral_count: 6,
    qualified_for_dividend: true
  })

  const level5 = createMockUser({
    id: 'level-5',
    username: 'level5',
    inviter_id: 'level-4',
    has_network: true
  })

  return { level1, level2, level3, level4, level5 }
}






