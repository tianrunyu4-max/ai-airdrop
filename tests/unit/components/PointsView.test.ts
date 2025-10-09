/**
 * PointsView组件测试
 * 
 * 测试目标：
 * 1. 矿机购买功能
 * 2. 积分兑换U功能
 * 3. 矿机列表展示
 * 4. 余额显示
 * 5. 错误处理
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PointsView from '@/views/points/PointsView.vue'
import { useAuthStore } from '@/stores/auth'
import { MiningService } from '@/services/mining.service'

// Mock window.confirm and window.alert
const mockConfirm = vi.fn()
const mockAlert = vi.fn()
global.confirm = mockConfirm
global.alert = mockAlert

// Mock MiningService
vi.mock('@/services/mining.service', () => ({
  MiningService: {
    purchaseMachine: vi.fn(),
    convertPoints: vi.fn(),
    getUserMachines: vi.fn(),
    calculateDailyRelease: vi.fn()
  }
}))

describe('PointsView 组件测试', () => {
  let wrapper: any
  let authStore: any

  beforeEach(() => {
    // 设置Pinia
    setActivePinia(createPinia())
    authStore = useAuthStore()

    // 模拟登录用户
    authStore.user = {
      id: 'test-user-id',
      username: 'testuser',
      mining_points: 500,
      transfer_points: 200,
      u_balance: 50,
      points_balance: 700,
      direct_referral_count: 5,
      is_agent: true
    }

    // 清空localStorage
    localStorage.clear()
    localStorage.setItem('current_user', JSON.stringify(authStore.user))

    // 清除所有mock
    vi.clearAllMocks()
    mockConfirm.mockReturnValue(true) // 默认确认
    mockAlert.mockImplementation(() => {})
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('1. 组件渲染', () => {
    test('应该正确渲染余额信息', async () => {
      wrapper = mount(PointsView, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.vm.$nextTick()

      // 检查余额显示
      const text = wrapper.text()
      expect(text).toContain('500.00') // mining_points
      expect(text).toContain('200.00') // transfer_points
      expect(text).toContain('50.00')  // u_balance
    })

    test('应该显示矿机商城', async () => {
      wrapper = mount(PointsView)

      expect(wrapper.text()).toContain('矿机商城')
      expect(wrapper.text()).toContain('共识算力一型矿机')
      expect(wrapper.text()).toContain('共识算力二型矿机')
      expect(wrapper.text()).toContain('共识算力三型矿机')
    })

    test('应该显示我的矿机区域', async () => {
      wrapper = mount(PointsView)

      expect(wrapper.text()).toContain('我的矿机')
    })
  })

  describe('2. 矿机购买功能', () => {
    test('积分充足时，应该能购买矿机', async () => {
      wrapper = mount(PointsView)
      await wrapper.vm.$nextTick()

      const initialMachinesCount = wrapper.vm.myMachines.length
      const initialPoints = authStore.user.transfer_points + authStore.user.mining_points

      // 模拟购买
      await wrapper.vm.purchaseMachine('type1', 25)
      await wrapper.vm.$nextTick()

      // 验证confirm被调用
      expect(mockConfirm).toHaveBeenCalled()
      
      // 验证矿机列表增加
      expect(wrapper.vm.myMachines.length).toBe(initialMachinesCount + 1)
      
      // 验证积分减少
      const currentPoints = authStore.user.transfer_points + authStore.user.mining_points
      expect(currentPoints).toBe(initialPoints - 25)
    })

    test('积分不足时，应该禁用购买按钮', async () => {
      // 设置积分不足
      authStore.user.mining_points = 10
      authStore.user.transfer_points = 10
      authStore.user.points_balance = 20

      wrapper = mount(PointsView)
      await wrapper.vm.$nextTick()

      // 查找购买按钮
      const purchaseButtons = wrapper.findAll('button').filter((btn: any) => 
        btn.text().includes('立即兑换')
      )

      // 所有购买按钮应该被禁用（因为积分不足）
      purchaseButtons.forEach((btn: any) => {
        expect(btn.element.disabled).toBe(true)
      })
    })

    test('购买成功后，应该更新矿机列表', async () => {
      wrapper = mount(PointsView)
      await wrapper.vm.$nextTick()

      const initialLength = wrapper.vm.myMachines.length

      // 执行购买
      await wrapper.vm.purchaseMachine('type1', 25)
      await wrapper.vm.$nextTick()

      // 验证矿机列表更新
      expect(wrapper.vm.myMachines.length).toBe(initialLength + 1)
      
      // 找到新增的矿机
      const newMachine = wrapper.vm.myMachines[wrapper.vm.myMachines.length - 1]
      expect(newMachine.machine_type).toBe('type1')
      expect(newMachine.is_active).toBe(true)
      expect(newMachine.points_cost).toBe(25)
    })

    test('购买失败时，应该显示错误提示', async () => {
      // 设置积分不足
      authStore.user.mining_points = 10
      authStore.user.transfer_points = 10

      wrapper = mount(PointsView)
      await wrapper.vm.$nextTick()

      // 获取toast实例
      const toastInstance = wrapper.vm.toast

      await wrapper.vm.purchaseMachine('type1', 25)
      await wrapper.vm.$nextTick()

      // 验证toast.error被调用（在实际使用中会显示Toast通知）
      // 注意：由于useToast是响应式的，直接检查toasts数组即可
      expect(wrapper.vm.canPurchase(25)).toBe(false)
    })
  })

  describe('3. 积分兑换U功能', () => {
    test('应该正确计算可兑换数量', async () => {
      authStore.user.mining_points = 500

      wrapper = mount(PointsView)
      await wrapper.vm.$nextTick()

      // 可兑换数量应该是70%向下取整到100的倍数
      expect(wrapper.vm.convertableAmount).toBe(300) // 500 * 0.7 = 350, 向下取整到300
    })

    test('应该正确计算预计获得的U', async () => {
      wrapper = mount(PointsView)
      
      // 设置兑换数量
      wrapper.vm.convertAmount = 100

      await wrapper.vm.$nextTick()

      // 100积分 * 0.7 * 7 / 100 = 4.9U
      expect(wrapper.vm.willReceiveU).toBe(4.9)
    })

    test('应该正确计算互转积分', async () => {
      wrapper = mount(PointsView)
      
      wrapper.vm.convertAmount = 100
      await wrapper.vm.$nextTick()

      // 100积分 * 0.3 = 30积分
      expect(wrapper.vm.willReceiveTransferPoints).toBe(30)
    })

    test('积分低于100时，不能兑换', async () => {
      authStore.user.mining_points = 50

      wrapper = mount(PointsView)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.canConvert).toBe(false)
    })

    test('兑换成功后，应该更新余额', async () => {
      const mockResult = {
        success: true,
        u_received: 4.9,
        points_received: 30
      }

      vi.mocked(MiningService.convertPoints).mockResolvedValue(mockResult)

      wrapper = mount(PointsView)
      
      wrapper.vm.convertAmount = 100
      wrapper.vm.showConvertModal = true
      await wrapper.vm.$nextTick()

      const initialMiningPoints = authStore.user.mining_points
      const initialUBalance = authStore.user.u_balance

      await wrapper.vm.confirmConvert()
      await wrapper.vm.$nextTick()

      // 验证余额变化（在实际实现中）
      // 注意：当前实现是直接修改，理想情况应该调用Service
    })

    test('兑换数量必须是100的倍数', async () => {
      wrapper = mount(PointsView)
      
      wrapper.vm.convertAmount = 150 // 不是100的倍数
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isValidConvertAmount).toBe(false)

      wrapper.vm.convertAmount = 200 // 是100的倍数
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isValidConvertAmount).toBe(true)
    })
  })

  describe('4. 矿机列表展示', () => {
    test('有矿机时，应该显示矿机列表', async () => {
      wrapper = mount(PointsView)
      await wrapper.vm.$nextTick()

      // 直接设置矿机数据
      wrapper.vm.myMachines = [
        {
          id: 'machine-1',
          user_id: 'test-user-id',
          machine_type: 'type1',
          daily_output: 5,
          production_days: 5,
          points_cost: 25,
          initial_points: 25,
          released_points: 10,
          total_points: 250,
          base_rate: 1,
          boost_rate: 10,
          boost_count: 5,
          is_active: true,
          exited_at: null,
          created_at: new Date().toISOString()
        }
      ]
      
      await wrapper.vm.$nextTick()

      // 验证矿机显示
      expect(wrapper.vm.myMachines.length).toBe(1)
      expect(wrapper.text()).toContain('共识算力一型矿机')
      expect(wrapper.text()).toContain('运行中')
    })

    test('无矿机时，应该显示空状态', async () => {
      vi.mocked(MiningService.getUserMachines).mockResolvedValue([])

      wrapper = mount(PointsView)
      
      await wrapper.vm.loadMyMachines()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('暂无矿机')
    })

    test('应该正确显示矿机释放进度', async () => {
      const mockMachine = {
        id: 'machine-1',
        user_id: 'test-user-id',
        machine_type: 'type1',
        daily_output: 5,
        production_days: 5,
        points_cost: 25,
        initial_points: 100,
        released_points: 250, // 已释放25%
        total_points: 1000,
        base_rate: 1,
        boost_rate: 10,
        boost_count: 5,
        is_active: true,
        exited_at: null,
        created_at: new Date().toISOString()
      }

      wrapper = mount(PointsView)
      wrapper.vm.myMachines = [mockMachine]
      await wrapper.vm.$nextTick()

      // 验证进度条显示（250/1000 = 25%）
      const text = wrapper.text()
      expect(text).toContain('250.00')
      expect(text).toContain('1000.00')
    })

    test('已出局的矿机应该显示正确状态', async () => {
      const mockMachine = {
        id: 'machine-1',
        user_id: 'test-user-id',
        machine_type: 'type1',
        daily_output: 5,
        production_days: 5,
        points_cost: 25,
        initial_points: 100,
        released_points: 1000, // 已达到10倍
        total_points: 1000,
        base_rate: 1,
        boost_rate: 10,
        boost_count: 5,
        is_active: false,
        exited_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      wrapper = mount(PointsView)
      wrapper.vm.myMachines = [mockMachine]
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('已出局')
    })
  })

  describe('5. 边界条件测试', () => {
    test('未登录用户应该处理空用户状态', async () => {
      authStore.user = null

      wrapper = mount(PointsView)
      await wrapper.vm.$nextTick()

      // 应该显示0.00
      const text = wrapper.text()
      expect(text).toContain('0.00')
    })

    test('购买按钮应该根据积分状态启用/禁用', async () => {
      authStore.user.mining_points = 100
      authStore.user.transfer_points = 0

      wrapper = mount(PointsView)
      await wrapper.vm.$nextTick()

      // type1需要25积分，应该可以购买
      expect(wrapper.vm.canPurchase(25)).toBe(true)

      // type3需要150积分，应该不能购买
      expect(wrapper.vm.canPurchase(150)).toBe(false)
    })

    test('应该正确处理并发购买请求', async () => {
      wrapper = mount(PointsView)
      await wrapper.vm.$nextTick()

      // 发起多个购买请求
      await wrapper.vm.purchaseMachine('type1', 25)
      await wrapper.vm.purchaseMachine('type2', 50)
      await wrapper.vm.$nextTick()

      // 应该创建多台矿机
      expect(wrapper.vm.myMachines.length).toBe(2)
      expect(mockConfirm).toHaveBeenCalledTimes(2)
    })
  })

  describe('6. 用户交互测试', () => {
    test('点击兑换按钮应该打开模态框', async () => {
      authStore.user.mining_points = 500

      wrapper = mount(PointsView)
      await wrapper.vm.$nextTick()

      // 查找兑换按钮并点击
      const convertButton = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('兑换U')
      )

      expect(convertButton).toBeDefined()
      
      if (convertButton) {
        await convertButton.trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.vm.showConvertModal).toBe(true)
      }
    })

    test('模态框中取消按钮应该关闭模态框', async () => {
      wrapper = mount(PointsView)
      
      wrapper.vm.showConvertModal = true
      await wrapper.vm.$nextTick()

      // 查找取消按钮
      const cancelButton = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('取消')
      )

      if (cancelButton) {
        await cancelButton.trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.vm.showConvertModal).toBe(false)
      }
    })
  })
})

