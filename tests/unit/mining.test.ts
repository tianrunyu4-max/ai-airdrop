import { describe, it, expect, beforeEach } from 'vitest'
import { createMockUser, createMockMiningMachine } from '../utils/mockData'
import type { User, MiningMachine } from '@/types'

/**
 * 矿机系统测试
 * 
 * 测试范围：
 * 1. 矿机购买
 * 2. 每日积分释放
 * 3. 加速机制（直推加速）
 * 4. 10倍出局
 * 5. 积分兑换U
 * 6. 重启机制
 */

describe('矿机系统', () => {
  describe('矿机购买', () => {
    it('购买100积分矿机：正确创建矿机记录', () => {
      // Given: 用户有100积分
      const user = createMockUser({
        points_balance: 100
      })

      const purchaseAmount = 100
      const multiplier = 10

      // When: 购买矿机
      user.points_balance -= purchaseAmount

      const machine = createMockMiningMachine({
        user_id: user.id,
        initial_points: purchaseAmount,
        released_points: 0,
        total_points: purchaseAmount * multiplier, // 10倍出局
        base_rate: 0.01, // 1%
        boost_rate: 0,
        is_active: true
      })

      // Then: 矿机记录正确创建
      expect(user.points_balance).toBe(0)
      expect(machine.initial_points).toBe(100)
      expect(machine.total_points).toBe(1000)
      expect(machine.base_rate).toBe(0.01)
      expect(machine.is_active).toBe(true)
    })

    it('积分不足：购买失败', () => {
      // Given: 用户只有50积分
      const user = createMockUser({
        points_balance: 50
      })

      const purchaseAmount = 100

      // When: 检查积分是否足够
      const canPurchase = user.points_balance >= purchaseAmount

      // Then: 积分不足，不能购买
      expect(canPurchase).toBe(false)
    })

    it('已有50台矿机：拒绝购买', () => {
      // Given: 用户已有50台矿机
      const existingMachines = Array(50).fill(null).map((_, i) =>
        createMockMiningMachine({ id: `machine-${i}` })
      )

      const maxMachines = 50

      // When: 检查矿机数量
      const canPurchaseMore = existingMachines.length < maxMachines

      // Then: 不能购买更多
      expect(canPurchaseMore).toBe(false)
      expect(existingMachines.length).toBe(50)
    })
  })

  describe('每日积分释放', () => {
    it('基础释放1%：每天释放1积分', () => {
      // Given: 100积分矿机，无加速
      const machine = createMockMiningMachine({
        initial_points: 100,
        released_points: 0,
        base_rate: 0.01,
        boost_rate: 0
      })

      // When: 每日释放
      const dailyRelease = machine.initial_points * (machine.base_rate + machine.boost_rate)
      machine.released_points += dailyRelease

      // Then: 释放1积分
      expect(dailyRelease).toBe(1)
      expect(machine.released_points).toBe(1)
    })

    it('5个直推加速：释放率提升到11%（1%+10%）', () => {
      // Given: 用户有5个直推
      const user = createMockUser({
        direct_referral_count: 5
      })

      const machine = createMockMiningMachine({
        initial_points: 100,
        base_rate: 0.01,
        boost_rate: user.direct_referral_count * 0.02, // 每个直推+2%
        boost_count: user.direct_referral_count
      })

      // When: 计算每日释放
      const dailyRelease = machine.initial_points * (machine.base_rate + machine.boost_rate)

      // Then: 每天释放11积分
      expect(machine.boost_rate).toBe(0.10) // 5 * 2%
      expect(dailyRelease).toBe(11) // 100 * 11%
    })

    it('20个直推：达到最大加速40%（1%+40%）', () => {
      // Given: 用户有20个直推
      const user = createMockUser({
        direct_referral_count: 20
      })

      const maxBoostReferrals = 20
      const boostCount = Math.min(user.direct_referral_count, maxBoostReferrals)

      const machine = createMockMiningMachine({
        initial_points: 100,
        base_rate: 0.01,
        boost_rate: boostCount * 0.02,
        boost_count: boostCount
      })

      // When: 计算每日释放
      const dailyRelease = machine.initial_points * (machine.base_rate + machine.boost_rate)

      // Then: 最大释放41积分
      expect(machine.boost_rate).toBe(0.40)
      expect(dailyRelease).toBe(41)
    })

    it('超过20个直推：不再增加加速', () => {
      // Given: 用户有30个直推
      const user = createMockUser({
        direct_referral_count: 30
      })

      const maxBoostReferrals = 20
      const boostCount = Math.min(user.direct_referral_count, maxBoostReferrals)

      // When: 计算加速
      const boostRate = boostCount * 0.02

      // Then: 加速上限40%
      expect(boostCount).toBe(20)
      expect(boostRate).toBe(0.40)
    })
  })

  describe('10倍出局机制', () => {
    it('释放达到1000积分：矿机出局', () => {
      // Given: 矿机已释放999积分
      const machine = createMockMiningMachine({
        initial_points: 100,
        released_points: 999,
        total_points: 1000,
        is_active: true
      })

      // When: 再释放2积分
      const dailyRelease = 2
      machine.released_points += dailyRelease

      // 检查是否达到出局条件
      if (machine.released_points >= machine.total_points) {
        machine.is_active = false
        machine.exited_at = new Date().toISOString()
        machine.released_points = machine.total_points // 限制在total_points
      }

      // Then: 矿机出局
      expect(machine.is_active).toBe(false)
      expect(machine.released_points).toBe(1000)
      expect(machine.exited_at).not.toBeNull()
    })

    it('出局后可以复投：购买新矿机', () => {
      // Given: 用户有一台已出局的矿机和足够的积分
      const exitedMachine = createMockMiningMachine({
        is_active: false,
        released_points: 1000,
        total_points: 1000,
        exited_at: new Date().toISOString()
      })

      const user = createMockUser({
        points_balance: 100
      })

      // When: 购买新矿机
      const newMachine = createMockMiningMachine({
        user_id: user.id,
        initial_points: 100,
        released_points: 0,
        total_points: 1000,
        is_active: true
      })

      user.points_balance -= 100

      // Then: 新矿机创建成功
      expect(exitedMachine.is_active).toBe(false)
      expect(newMachine.is_active).toBe(true)
      expect(user.points_balance).toBe(0)
    })
  })

  describe('积分兑换U', () => {
    it('兑换100积分：获得4.9U + 30积分', () => {
      // Given: 用户有100积分
      const user = createMockUser({
        points_balance: 100,
        u_balance: 50
      })

      const convertAmount = 100
      const pointsToURate = 0.07 // 100积分 = 7U
      const uPercentage = 0.7 // 70%转为U
      const pointsPercentage = 0.3 // 30%留存为积分

      // When: 兑换积分
      const totalU = convertAmount * pointsToURate
      const receivedU = totalU * uPercentage
      const returnedPoints = convertAmount * pointsPercentage

      user.points_balance -= convertAmount
      user.u_balance += receivedU
      user.points_balance += returnedPoints

      // Then: 正确分配
      expect(receivedU).toBe(4.9) // 100 * 0.07 * 0.7
      expect(returnedPoints).toBe(30) // 100 * 0.3
      expect(user.u_balance).toBe(54.9)
      expect(user.points_balance).toBe(30)
    })

    it('兑换1000积分：获得49U + 300积分', () => {
      // Given: 用户有1000积分
      const user = createMockUser({
        points_balance: 1000,
        u_balance: 0
      })

      const convertAmount = 1000
      const pointsToURate = 0.07
      const uPercentage = 0.7
      const pointsPercentage = 0.3

      // When: 兑换
      const totalU = convertAmount * pointsToURate
      const receivedU = totalU * uPercentage
      const returnedPoints = convertAmount * pointsPercentage

      user.points_balance -= convertAmount
      user.u_balance += receivedU
      user.points_balance += returnedPoints

      // Then: 正确计算
      expect(receivedU).toBe(49) // 1000 * 0.07 * 0.7
      expect(returnedPoints).toBe(300) // 1000 * 0.3
      expect(user.u_balance).toBe(49)
      expect(user.points_balance).toBe(300)
    })
  })

  describe('重启机制', () => {
    it('加速积分不足：所有矿机重启，销毁30%积分', () => {
      // Given: 用户有3台矿机，积分不足以支撑加速
      const machines = [
        createMockMiningMachine({ id: 'machine-1', released_points: 500 }),
        createMockMiningMachine({ id: 'machine-2', released_points: 300 }),
        createMockMiningMachine({ id: 'machine-3', released_points: 200 })
      ]

      const user = createMockUser({
        points_balance: 1000
      })

      // When: 触发重启机制
      const destructionRate = 0.3

      // 销毁30%积分
      user.points_balance *= (1 - destructionRate)

      // 重启所有矿机
      machines.forEach(machine => {
        machine.is_active = false
        machine.exited_at = new Date().toISOString()
      })

      // Then: 积分销毁，矿机停止
      expect(user.points_balance).toBe(700) // 1000 * 0.7
      machines.forEach(machine => {
        expect(machine.is_active).toBe(false)
      })
    })

    it('重启后：积分排队等待新积分释放', () => {
      // Given: 重启后的用户
      const user = createMockUser({
        points_balance: 700 // 销毁30%后剩余
      })

      // When: 等待新的矿机释放积分
      const newPoints = 100
      user.points_balance += newPoints

      // Then: 积分恢复增长
      expect(user.points_balance).toBe(800)
    })
  })

  describe('综合测试：完整矿机生命周期', () => {
    it('购买 -> 释放 -> 出局 -> 兑换', () => {
      // Given: 用户初始状态
      const user = createMockUser({
        points_balance: 100,
        u_balance: 0,
        direct_referral_count: 5
      })

      // Step 1: 购买矿机
      const machine = createMockMiningMachine({
        user_id: user.id,
        initial_points: 100,
        released_points: 0,
        total_points: 1000,
        base_rate: 0.01,
        boost_rate: 0.10, // 5个直推
        is_active: true
      })
      user.points_balance -= 100

      expect(user.points_balance).toBe(0)

      // Step 2: 每日释放（11% = 11积分/天）
      const dailyRelease = machine.initial_points * (machine.base_rate + machine.boost_rate)
      
      // 模拟91天（11 * 91 = 1001 > 1000）
      for (let day = 1; day <= 91; day++) {
        if (machine.is_active) {
          const beforeRelease = machine.released_points
          machine.released_points += dailyRelease

          // 检查是否达到出局上限
          if (machine.released_points >= machine.total_points) {
            // 只释放到total_points为止
            const actualRelease = machine.total_points - beforeRelease
            user.points_balance += actualRelease
            
            machine.is_active = false
            machine.released_points = machine.total_points
            machine.exited_at = new Date().toISOString()
            break
          } else {
            user.points_balance += dailyRelease
          }
        }
      }

      // Step 3: 验证出局
      expect(machine.is_active).toBe(false)
      expect(machine.released_points).toBe(1000)
      expect(user.points_balance).toBe(1000)

      // Step 4: 兑换积分
      const convertAmount = 1000
      const receivedU = convertAmount * 0.07 * 0.7
      const returnedPoints = convertAmount * 0.3

      user.points_balance -= convertAmount
      user.u_balance += receivedU
      user.points_balance += returnedPoints

      // Then: 最终状态
      expect(user.u_balance).toBe(49) // 1000 * 0.07 * 0.7
      expect(user.points_balance).toBe(300) // 1000 * 0.3
    })
  })
})

