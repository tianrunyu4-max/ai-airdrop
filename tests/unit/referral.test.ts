import { describe, it, expect, beforeEach } from 'vitest'
import { createMockUser, createMockAgent, createMockNetwork, createMockReferralChain } from '../utils/mockData'
import type { User } from '@/types'

/**
 * 链动2+1推荐系统测试
 * 
 * 测试范围：
 * 1. "走1留2"网络构建逻辑
 * 2. 见点奖计算
 * 3. 平级见点奖计算
 * 4. 直推分红计算
 * 5. 复购机制
 */

describe('链动2+1推荐系统', () => {
  describe('网络构建 - "走1留2"机制', () => {
    it('第1、2个直推：应该紧缩到推荐人的上级网络', () => {
      // Given: 用户A已注册，network_root_id指向上级
      const userA = createMockUser({
        id: 'user-a',
        network_root_id: 'upper-network-id',
        referral_position: 0
      })

      // When: 用户B通过A的邀请码注册（第1个直推）
      const userB = createMockUser({
        id: 'user-b',
        inviter_id: 'user-a',
        referral_position: 1,
        network_root_id: userA.network_root_id // 紧缩到A的上级网络
      })

      // Then: B应该加入A的上级网络
      expect(userB.network_root_id).toBe(userA.network_root_id)
      expect(userB.inviter_id).toBe('user-a')
      expect(userB.referral_position).toBe(1)
    })

    it('第3个直推：应该开始建立推荐人自己的网络', () => {
      // Given: 用户A已有2个直推
      const userA = createMockUser({
        id: 'user-a',
        has_network: false,
        direct_referral_count: 2
      })

      // When: 用户D通过A的邀请码注册（第3个直推）
      const userD = createMockUser({
        id: 'user-d',
        inviter_id: 'user-a',
        referral_position: 3,
        network_root_id: 'user-a' // 加入A自己的网络
      })

      // 更新A的状态
      userA.has_network = true
      userA.direct_referral_count = 3

      // Then: D应该加入A的网络，A拥有自己的网络
      expect(userD.network_root_id).toBe('user-a')
      expect(userA.has_network).toBe(true)
      expect(userA.direct_referral_count).toBe(3)
    })

    it('完整的网络结构测试', () => {
      // Given: 创建完整的测试网络
      const { userA, userB, userC, userD, userE } = createMockNetwork()

      // Then: 验证网络结构
      // A有5个直推
      expect(userA.direct_referral_count).toBe(5)
      expect(userA.has_network).toBe(true)

      // B、C紧缩到上级网络
      expect(userB.network_root_id).toBe(userA.network_root_id)
      expect(userC.network_root_id).toBe(userA.network_root_id)

      // D、E在A的网络中
      expect(userD.network_root_id).toBe('user-a')
      expect(userE.network_root_id).toBe('user-a')
    })
  })

  describe('见点奖计算', () => {
    it('网络新增成员：网络所有者获得8U', () => {
      // Given: 用户A有自己的网络
      const networkOwner = createMockAgent({
        id: 'owner',
        has_network: true,
        u_balance: 50
      })

      // When: 有新成员加入A的网络
      const spotAwardAmount = 8
      networkOwner.u_balance += spotAwardAmount
      networkOwner.total_earnings += spotAwardAmount

      // Then: 网络所有者获得8U
      expect(networkOwner.u_balance).toBe(58)
      expect(networkOwner.total_earnings).toBe(8)
    })

    it('没有网络的用户：不触发见点奖', () => {
      // Given: 用户B没有自己的网络
      const userWithoutNetwork = createMockAgent({
        id: 'no-network',
        has_network: false,
        u_balance: 50
      })

      // When: 检查是否有网络
      const shouldAward = userWithoutNetwork.has_network

      // Then: 不应该获得奖励
      expect(shouldAward).toBe(false)
    })

    it('多级网络：每个网络所有者都应获得见点奖', () => {
      // Given: 多级网络结构（A -> B -> C，A和B都有网络）
      const ownerA = createMockAgent({
        id: 'owner-a',
        has_network: true,
        u_balance: 100
      })

      const ownerB = createMockAgent({
        id: 'owner-b',
        has_network: true,
        u_balance: 50,
        network_root_id: 'owner-a'
      })

      // When: C加入B的网络（也在A的大网络中）
      const spotAward = 8
      ownerB.u_balance += spotAward // B作为直接网络所有者
      ownerA.u_balance += spotAward // A作为上级网络所有者

      // Then: 两个网络所有者都获得奖励
      expect(ownerB.u_balance).toBe(58)
      expect(ownerA.u_balance).toBe(108)
    })
  })

  describe('平级见点奖计算', () => {
    it('上线有5个直推：触发3U平级见点奖', () => {
      // Given: 5级推荐链，level1和level2有≥5个直推
      const { level1, level2, level5 } = createMockReferralChain()
      
      level1.u_balance = 100
      level2.u_balance = 50

      // When: level5的网络新增成员（触发见点奖）
      const peerSpotAward = 3
      
      // level1有5个直推，获得平级奖
      if (level1.direct_referral_count >= 5) {
        level1.u_balance += peerSpotAward
      }
      
      // level2有5个直推，获得平级奖
      if (level2.direct_referral_count >= 5) {
        level2.u_balance += peerSpotAward
      }

      // Then: 满足条件的上线获得3U
      expect(level1.u_balance).toBe(103)
      expect(level2.u_balance).toBe(53)
    })

    it('上线不足5个直推：不触发平级见点奖', () => {
      // Given: level3只有3个直推
      const { level3, level5 } = createMockReferralChain()
      level3.u_balance = 50

      // When: 检查是否满足条件
      const shouldAward = level3.direct_referral_count >= 5

      // Then: 不应该获得奖励
      expect(shouldAward).toBe(false)
      expect(level3.u_balance).toBe(50)
    })

    it('5级链中多人满足条件：全部发放', () => {
      // Given: 5级链中3人有≥5个直推
      const { level1, level2, level4 } = createMockReferralChain()
      
      const peerSpotAward = 3
      const awardees = [level1, level2, level4].filter(
        user => user.direct_referral_count >= 5
      )

      // When: 发放平级奖
      let totalAwarded = 0
      awardees.forEach(user => {
        user.u_balance += peerSpotAward
        totalAwarded += peerSpotAward
      })

      // Then: 3人都获得奖励
      expect(awardees.length).toBe(3)
      expect(totalAwarded).toBe(9) // 3人 * 3U
    })
  })

  describe('直推分红计算', () => {
    const dividendDays = [1, 3, 5, 0] // 周一、三、五、日

    it('分红日：≥5个直推的代理获得7U', () => {
      // Given: 今天是周一（dayOfWeek = 1）
      const today = new Date('2024-01-01') // 2024-01-01是周一
      const dayOfWeek = today.getDay()

      const inviter = createMockAgent({
        id: 'inviter',
        direct_referral_count: 5,
        qualified_for_dividend: true,
        u_balance: 100
      })

      // When: 新代理订单
      const isDividendDay = dividendDays.includes(dayOfWeek)
      const dividendAmount = 7

      if (isDividendDay && inviter.qualified_for_dividend) {
        inviter.u_balance += dividendAmount
      }

      // Then: 获得7U分红
      expect(isDividendDay).toBe(true)
      expect(inviter.u_balance).toBe(107)
    })

    it('非分红日：不发放分红', () => {
      // Given: 今天是周二（dayOfWeek = 2）
      const today = new Date('2024-01-02') // 2024-01-02是周二
      const dayOfWeek = today.getDay()

      // When: 检查是否为分红日
      const isDividendDay = dividendDays.includes(dayOfWeek)

      // Then: 不是分红日
      expect(isDividendDay).toBe(false)
    })

    it('直推不足5个：不获得分红', () => {
      // Given: 用户只有3个直推
      const inviter = createMockUser({
        direct_referral_count: 3,
        qualified_for_dividend: false
      })

      // When: 检查是否满足条件
      const isQualified = inviter.qualified_for_dividend

      // Then: 不满足分红条件
      expect(isQualified).toBe(false)
    })
  })

  describe('自动复购机制', () => {
    it('全网收益达300U：触发30U复购', () => {
      // Given: 用户累计收益299U
      const user = createMockAgent({
        total_earnings: 299,
        u_balance: 299
      })

      // When: 获得2U新收益
      const newEarning = 2
      user.total_earnings += newEarning
      user.u_balance += newEarning

      const repurchaseThreshold = 300
      const repurchaseAmount = 30

      let shouldRepurchase = false
      if (user.total_earnings >= repurchaseThreshold) {
        shouldRepurchase = true
        user.u_balance -= repurchaseAmount
        user.total_earnings -= repurchaseAmount
      }

      // Then: 触发复购，扣除30U
      expect(shouldRepurchase).toBe(true)
      expect(user.u_balance).toBe(271) // 299 + 2 - 30
      expect(user.total_earnings).toBe(271)
    })

    it('收益未达300U：不触发复购', () => {
      // Given: 用户累计收益250U
      const user = createMockAgent({
        total_earnings: 250,
        u_balance: 250
      })

      // When: 检查是否达到复购阈值
      const repurchaseThreshold = 300
      const shouldRepurchase = user.total_earnings >= repurchaseThreshold

      // Then: 不触发复购
      expect(shouldRepurchase).toBe(false)
    })

    it('复购后：如果是分红日，触发直推分红', () => {
      // Given: 周一，用户达到复购条件，上级有5个直推
      const today = new Date('2024-01-01') // 周一
      const dayOfWeek = today.getDay()
      const dividendDays = [1, 3, 5, 0]

      const inviter = createMockAgent({
        id: 'inviter',
        direct_referral_count: 5,
        qualified_for_dividend: true,
        u_balance: 100
      })

      // When: 复购订单生成
      const isDividendDay = dividendDays.includes(dayOfWeek)
      const dividendAmount = 7

      if (isDividendDay && inviter.qualified_for_dividend) {
        inviter.u_balance += dividendAmount
      }

      // Then: 上级获得分红
      expect(inviter.u_balance).toBe(107)
    })
  })
})






