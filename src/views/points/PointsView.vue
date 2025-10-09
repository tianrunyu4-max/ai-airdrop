<template>
  <div class="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-yellow-50 pb-20">
    <!-- 顶部标题 -->
    <div class="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 px-6 py-8">
      <h1 class="text-3xl font-bold text-white text-center mb-2">🤖 AI学习机</h1>
      <p class="text-center text-yellow-100 text-sm">持续学习 · 持续创薪</p>
    </div>

    <!-- 我的资产卡片 -->
    <div class="px-4 -mt-4">
      <div class="bg-white rounded-2xl shadow-2xl p-6 border-2 border-yellow-200">
        <div class="text-center mb-4">
          <div class="text-gray-500 text-sm mb-1">我的资产</div>
          <div class="text-4xl font-bold text-yellow-600">{{ user?.u_balance.toFixed(2) || '0.00' }} U</div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
            <div class="text-gray-600 text-xs mb-1">互转积分</div>
            <div class="text-yellow-700 font-bold text-lg">{{ user?.transfer_points.toFixed(2) || '0.00' }}</div>
          </div>
          <div class="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
            <div class="text-gray-600 text-xs mb-1">学习机数量</div>
            <div class="text-yellow-700 font-bold text-lg">{{ myMachines.length }}台</div>
          </div>
        </div>

        <!-- 功能按钮 -->
        <div class="grid grid-cols-3 gap-2">
          <button 
            @click="goToTransfer"
            class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all text-sm shadow-md"
          >
            互转积分
          </button>
          <button 
            @click="goToEarnings"
            class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all text-sm shadow-md"
          >
            收益记录
          </button>
          <button 
            @click="refreshPage"
            class="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm border-2 border-gray-200"
          >
            刷新
          </button>
        </div>
      </div>
    </div>

    <!-- AI学习机购买区 -->
    <div class="px-4 mt-6">
      <h3 class="text-gray-800 text-xl font-bold mb-4 flex items-center">
        <span class="bg-yellow-400 w-1 h-6 rounded-full mr-3"></span>
        AI学习机
      </h3>

      <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-300">
        <!-- 学习机图标 -->
        <div class="flex justify-center mb-4">
          <div class="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>

        <!-- 学习机信息 -->
        <div class="text-center mb-6">
          <h4 class="text-2xl font-bold text-gray-800 mb-2">AI智能学习机</h4>
          <p class="text-gray-600 text-sm">自动学习 · 持续收益 · 智能分配</p>
        </div>

        <!-- V3.0 核心参数 -->
        <div class="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 mb-4 border-2 border-red-300">
          <div class="text-center text-red-600 font-bold text-sm mb-2">🔥 V3.0 重大升级</div>
          <div class="text-xs text-gray-700 text-center">
            10%释放 · 2倍出局 · 20天回本 · 持续学习 送积分
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div class="text-gray-600 text-xs mb-1">购买成本</div>
            <div class="text-yellow-600 font-bold text-xl">100积分</div>
            <div class="text-gray-500 text-xs mt-1">首次免费送 🎁</div>
          </div>
          <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div class="text-gray-600 text-xs mb-1">出局倍数</div>
            <div class="text-yellow-600 font-bold text-xl">2倍</div>
            <div class="text-gray-500 text-xs mt-1">共200积分</div>
          </div>
          <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div class="text-gray-600 text-xs mb-1">基础释放</div>
            <div class="text-yellow-600 font-bold text-xl">10%/天</div>
            <div class="text-gray-500 text-xs mt-1">20天出局</div>
          </div>
          <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div class="text-gray-600 text-xs mb-1">持续学习</div>
            <div class="text-yellow-600 font-bold text-xl">免费</div>
            <div class="text-gray-500 text-xs mt-1">2→4→8→16倍</div>
          </div>
        </div>

        <!-- 收益分配 -->
        <div class="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl p-4 mb-6 border border-yellow-300">
          <div class="text-center text-sm font-bold text-gray-700 mb-3">📊 每日收益自动分配</div>
          <div class="space-y-2">
            <div class="flex items-center justify-between bg-white rounded-lg p-3">
              <span class="text-gray-600">70% 自动转U</span>
              <span class="text-yellow-600 font-bold">直接到账</span>
            </div>
            <div class="flex items-center justify-between bg-white rounded-lg p-3">
              <span class="text-gray-600">30% 互转积分</span>
              <span class="text-yellow-600 font-bold">赠送团队</span>
            </div>
          </div>
        </div>

        <!-- 叠加数量选择 -->
        <div class="mb-6">
          <label class="block text-gray-700 font-bold mb-3 text-center">
            购买数量（最多10台）
          </label>
          <div class="flex items-center justify-center gap-4">
            <button 
              @click="purchaseCount = Math.max(1, purchaseCount - 1)"
              class="w-12 h-12 bg-gray-200 rounded-full font-bold text-xl text-gray-700 hover:bg-gray-300 transition-all"
            >
              -
            </button>
            <div class="text-4xl font-bold text-yellow-600 w-20 text-center">
              {{ purchaseCount }}
            </div>
            <button 
              @click="purchaseCount = Math.min(10, purchaseCount + 1)"
              class="w-12 h-12 bg-yellow-500 rounded-full font-bold text-xl text-white hover:bg-yellow-600 transition-all"
            >
              +
            </button>
          </div>
          <div class="text-center text-sm text-gray-600 mt-2">
            总成本：{{ myMachines.length === 0 ? `${purchaseCount * 100}积分` : `${(purchaseCount * 7).toFixed(0)}U` }}
          </div>
        </div>

        <!-- 购买按钮 -->
        <button 
          @click="purchaseMachine"
          :disabled="!canPurchase"
          class="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 transition-all shadow-xl"
        >
          {{ canPurchase ? `🚀 立即购买 ${purchaseCount} 台` : (myMachines.length === 0 ? '积分不足' : 'U余额不足') }}
        </button>

        <!-- 提示信息 -->
        <div class="mt-4 text-xs text-gray-500 text-center">
          <div v-if="!user?.is_agent" class="text-purple-600 font-medium mb-2">
            💡 需要先加入Binary对碰系统（30U）才能激活第一台学习机
          </div>
          <div>🎁 排队领取 学习机 毕业了可以持续学习送积分</div>
        </div>
      </div>
    </div>

    <!-- 我的学习机列表 -->
    <div class="px-4 mt-6 mb-8">
      <h3 class="text-gray-800 text-xl font-bold mb-4 flex items-center justify-between">
        <span class="flex items-center">
          <span class="bg-yellow-400 w-1 h-6 rounded-full mr-3"></span>
          我的学习机
        </span>
        <span class="text-sm text-gray-600">{{ myMachines.length }}/10</span>
      </h3>

      <!-- 学习机列表 -->
      <div v-if="myMachines.length > 0" class="space-y-4">
        <div 
          v-for="machine in myMachines" 
          :key="machine.id"
          class="bg-white rounded-xl shadow-md p-5 border-2"
          :class="machine.is_active ? 'border-yellow-300' : 'border-gray-300'"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h4 class="text-gray-800 font-bold text-lg mb-1">AI学习机 #{{ machine.id.slice(-4) }}</h4>
              <span 
                class="inline-block px-3 py-1 rounded-full text-xs font-bold"
                :class="machine.is_active ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'"
              >
                {{ machine.is_active ? '🟢 学习中' : '⭕ 已出局' }}
              </span>
            </div>
            <div class="text-right">
              <div class="text-yellow-600 font-bold text-xl">{{ ((machine.base_rate + machine.boost_rate) * 100).toFixed(1) }}%</div>
              <div class="text-xs text-gray-500">每日释放率</div>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="mb-4">
            <div class="flex justify-between text-xs text-gray-600 mb-2">
              <span>学习进度</span>
              <span class="font-bold">{{ ((machine.released_points / machine.total_points) * 100).toFixed(1) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                class="h-full rounded-full transition-all"
                :class="machine.is_active ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gray-400'"
                :style="{ width: `${(machine.released_points / machine.total_points * 100)}%` }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>{{ machine.released_points.toFixed(0) }}积分</span>
              <span>{{ machine.total_points.toFixed(0) }}积分</span>
            </div>
          </div>

          <!-- 数据统计 -->
          <div class="grid grid-cols-3 gap-2 text-xs mb-4">
            <div class="bg-yellow-50 rounded-lg p-2 text-center border border-yellow-100">
              <div class="text-gray-600 mb-1">日释放率</div>
              <div class="text-yellow-700 font-bold">{{ (machine.base_rate * 100).toFixed(1) }}%</div>
            </div>
            <div class="bg-purple-50 rounded-lg p-2 text-center border border-purple-100">
              <div class="text-gray-600 mb-1">学习等级</div>
              <div class="text-purple-600 font-bold">{{ getCompoundMultiplier(machine) }}倍</div>
            </div>
            <div class="bg-yellow-50 rounded-lg p-2 text-center border border-yellow-100">
              <div class="text-gray-600 mb-1">重启次数</div>
              <div class="text-gray-700 font-bold">{{ machine.restart_count || 0 }}次</div>
            </div>
          </div>

          <!-- 操作按钮（V3.0：持续学习 送积分） -->
          <div v-if="!machine.is_active" class="grid grid-cols-3 gap-2">
            <button 
              @click="compoundReinvest(machine.id)"
              class="bg-gradient-to-r from-purple-400 to-purple-500 text-white py-2 rounded-lg font-bold text-xs hover:from-purple-500 hover:to-purple-600 transition-all"
            >
              💎 持续学习 送积分
            </button>
            <button 
              @click="restartMachine(machine.id)"
              class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-2 rounded-lg font-bold text-xs hover:from-yellow-500 hover:to-yellow-600 transition-all"
            >
              🔄 重启（2倍）
            </button>
            <button 
              @click="repurchaseMachine"
              class="bg-gradient-to-r from-blue-400 to-blue-500 text-white py-2 rounded-lg font-bold text-xs hover:from-blue-500 hover:to-blue-600 transition-all"
            >
              🚀 复购
            </button>
          </div>

          <div class="text-xs text-gray-500 mt-3 text-center">
            开始时间：{{ formatDate(machine.created_at) }}
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="bg-white rounded-xl p-12 text-center border-2 border-dashed border-yellow-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 mx-auto text-yellow-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <div class="text-gray-600 mb-2 font-bold">还没有学习机</div>
        <div class="text-gray-400 text-sm">快去购买你的第一台AI学习机吧！</div>
      </div>
    </div>

    <!-- V3.0 说明模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showRestartInfo }">
      <div class="modal-box bg-white max-w-2xl">
        <h3 class="font-bold text-lg text-gray-800 mb-4">🔥 V3.0 学习机说明</h3>
        
        <div class="space-y-3 text-sm text-gray-700">
          <div class="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div class="font-bold text-purple-700 mb-1">💎 持续学习 送积分（推荐）</div>
            <div>出局后免费升级，倍数翻倍：2倍→4倍→8倍→16倍...，保持10%释放率</div>
          </div>

          <div class="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div class="font-bold text-yellow-700 mb-1">🔄 手动重启</div>
            <div>积分清0销毁，重新开始2倍出局（200积分），学习等级重置为0</div>
          </div>
          
          <div class="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div class="font-bold text-blue-700 mb-1">🚀 复购学习</div>
            <div>支付100积分（7U）购买新学习机，重新开始2倍出局</div>
          </div>

          <div class="bg-red-50 rounded-lg p-3 border border-red-200">
            <div class="font-bold text-red-700 mb-1">🎁 首次免费</div>
            <div>第一次购买学习机免费送，邀请人和团队可互转积分学习</div>
          </div>
          
          <div class="bg-green-50 rounded-lg p-3 border border-green-200">
            <div class="font-bold text-green-700 mb-1">📊 每日收益</div>
            <div>10%日释放率，70%转U，30%互转积分，20天2倍出局</div>
          </div>
        </div>
        
        <div class="modal-action">
          <button class="btn bg-yellow-500 text-white hover:bg-yellow-600 border-none" @click="showRestartInfo = false">知道了</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black bg-opacity-30" @click="showRestartInfo = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- 重启说明按钮（浮动） -->
    <button 
      @click="showRestartInfo = true"
      class="fixed bottom-24 right-4 bg-yellow-500 text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center hover:bg-yellow-600 transition-all z-10"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import type { MiningMachine } from '@/types'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { MiningService } from '@/services/MiningService'

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const toast = useToast()

// 状态
const purchaseCount = ref(1)
const myMachines = ref<MiningMachine[]>([])
const showRestartInfo = ref(false)

// 是否可以购买（第1台用积分，后续用U）
const canPurchase = computed(() => {
  const currentMachineCount = myMachines.value.length
  
  // 第1台：需要100互转积分
  if (currentMachineCount === 0) {
    const totalCostPoints = purchaseCount.value * 100 // 100积分
    const transferPoints = user.value?.transfer_points || 0
    return transferPoints >= totalCostPoints && purchaseCount.value <= 10
  }
  
  // 第2台及以后：需要U余额
  const totalCostU = purchaseCount.value * 7 // 每台7U
  const uBalance = user.value?.u_balance || 0
  return uBalance >= totalCostU && currentMachineCount + purchaseCount.value <= 10
})

// 格式化日期
const formatDate = (date: string) => {
  return format(new Date(date), 'yyyy-MM-dd HH:mm')
}

// 购买学习机（第1台用积分，后续用U）
const purchaseMachine = async () => {
  if (!user.value || !canPurchase.value) {
    const errorMsg = myMachines.value.length === 0 ? '积分不足或超出数量限制' : 'U余额不足或超出数量限制'
    toast.error(errorMsg)
    return
  }

  const isFirstMachine = myMachines.value.length === 0
  const costText = isFirstMachine 
    ? `${purchaseCount.value * 100}积分（激活第1台学习机）`
    : `${purchaseCount.value * 7}U`
  
  const confirmMsg = `确定购买 ${purchaseCount.value} 台AI学习机吗？\n\n总成本：${costText}\n2倍出局，每日自动释放10%`

  if (!confirm(confirmMsg)) {
    return
  }

  const loadingToast = toast.info('正在购买AI学习机...', 0)

  try {
    // 批量购买（调用后端服务）
    for (let i = 0; i < purchaseCount.value; i++) {
      const result = await MiningService.purchaseMachine(user.value.id, 'type1')
      
      if (!result.success) {
        toast.removeToast(loadingToast)
        toast.error(result.error || '购买失败')
        return
      }
    }

    // 重新加载学习机列表和用户信息
    await loadMyMachines()
    await authStore.loadUser()

    toast.removeToast(loadingToast)
    toast.success(`🎉 成功购买 ${purchaseCount.value} 台AI学习机！`, 3000)
    purchaseCount.value = 1
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '购买失败')
    console.error('购买学习机失败:', error)
  }
}

// V3.0：持续学习 送积分（免费，倍数翻倍）
const compoundReinvest = async (machineId: string) => {
  const machine = myMachines.value.find(m => m.id === machineId)
  if (!machine) return

  const currentLevel = machine.compound_level || 0
  const multipliers = [2, 4, 8, 16, 32, 64, 128, 256]
  
  if (currentLevel >= multipliers.length) {
    toast.error('已达到最高学习等级')
    return
  }

  const nextMultiplier = multipliers[currentLevel + 1]
  
  if (!confirm(`💎 确认持续学习 送积分吗？\n\n免费将出局倍数升级为 ${nextMultiplier}倍\n（${multipliers[currentLevel]}倍 → ${nextMultiplier}倍）\n\n继续10%日释放率，积分清0重新计算`)) {
    return
  }

  const loadingToast = toast.info('正在升级学习等级...', 0)

  try {
    machine.is_active = true
    machine.compound_level = currentLevel + 1
    machine.total_points = 100 * nextMultiplier
    machine.released_points = 0
    machine.exited_at = null
    machine.restart_count = (machine.restart_count || 0) + 1

    localStorage.setItem('my_machines', JSON.stringify(myMachines.value))

    toast.removeToast(loadingToast)
    toast.success(`💎 升级成功！持续学习升级为${nextMultiplier}倍出局`, 3000)
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '升级失败')
  }
}

// V3.0：重启学习机（2倍出局，积分清0销毁）
const restartMachine = async (machineId: string) => {
  if (!confirm('⚠️ 确认重启这台学习机吗？\n\n重启后：\n- 所有累计积分清0销毁\n- 重新开始2倍出局（200积分）\n- 学习等级重置为0\n- 继续10%日释放率')) {
    return
  }

  const loadingToast = toast.info('正在重启...', 0)

  try {
    const machine = myMachines.value.find(m => m.id === machineId)
    if (machine) {
      machine.is_active = true
      machine.total_points = 200 // 2倍出局
      machine.released_points = 0
      machine.exited_at = null
      machine.restart_count = (machine.restart_count || 0) + 1
      machine.compound_level = 0 // 重置学习等级

      localStorage.setItem('my_machines', JSON.stringify(myMachines.value))

      toast.removeToast(loadingToast)
      toast.success('🔄 重启成功！积分已清0，重新开始2倍出局', 3000)
    }
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '重启失败')
  }
}

// 复购学习
const repurchaseMachine = () => {
  // 滚动到顶部购买区域
  window.scrollTo({ top: 0, behavior: 'smooth' })
  toast.info('💡 请在上方购买新的AI学习机 😊', 3000)
}

// 获取学习等级倍数
const getCompoundMultiplier = (machine: MiningMachine) => {
  const multipliers = [2, 4, 8, 16, 32, 64, 128, 256]
  const level = machine.compound_level || 0
  return multipliers[level] || 2
}

// 跳转到互转页面
const goToTransfer = () => {
  router.push('/transfer')
}

// 跳转到收益记录页面
const goToEarnings = () => {
  router.push('/earnings')
}

// 刷新页面
const refreshPage = () => {
  loadMyMachines()
  toast.success('已刷新')
}

// 加载我的学习机
// 从数据库加载我的学习机
const loadMyMachines = async () => {
  if (!user.value) return

  try {
    const { data, error } = await supabase
      .from('mining_machines')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('加载学习机失败:', error)
      return
    }

    myMachines.value = data || []
  } catch (err) {
    console.error('加载学习机异常:', err)
  }
}

onMounted(() => {
  loadMyMachines()
})
</script>

<style scoped>
/* 黄白主题样式 */
.modal-box {
  max-height: 80vh;
  overflow-y: auto;
}
</style>
