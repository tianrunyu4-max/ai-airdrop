<template>
  <div class="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-yellow-50 pb-20">
    <!-- 顶部标题 -->
    <div class="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 px-6 py-8">
      <h1 class="text-3xl font-bold text-white text-center mb-2">💳 AI学习卡</h1>
      <p class="text-center text-yellow-100 text-sm">每日签到 · 持续释放</p>
    </div>

    <!-- 加载中提示 -->
    <div v-if="!user" class="px-4 mt-6 text-center">
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <div class="text-gray-500">加载中...</div>
      </div>
    </div>

    <!-- 我的资产卡片 -->
    <div v-if="user" class="px-4 -mt-4">
      <div class="bg-white rounded-2xl shadow-2xl p-6 border-2 border-yellow-200">
        <div class="text-center mb-4">
          <div class="text-gray-500 text-sm mb-1">我的资产</div>
          <div class="text-4xl font-bold text-yellow-600">{{ (user.u_balance || 0).toFixed(2) }} U</div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
            <div class="text-gray-600 text-xs mb-1">互转积分</div>
            <div class="text-yellow-700 font-bold text-lg">{{ (user.transfer_points || 0).toFixed(2) }}</div>
          </div>
          <div class="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
            <div class="text-gray-600 text-xs mb-1">学习卡数量</div>
            <div class="text-yellow-700 font-bold text-lg">{{ myMachines.length }}张</div>
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

    <!-- 每日签到区 -->
    <div v-if="user" class="px-4 mt-6">
      <h3 class="text-gray-800 text-xl font-bold mb-4 flex items-center">
        <span class="bg-green-400 w-1 h-6 rounded-full mr-3"></span>
        📅 每日签到
      </h3>
      
      <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-300">
        <!-- 签到状态 -->
        <div class="text-center mb-4">
          <div v-if="isCheckedInToday" class="text-green-600 text-lg font-bold mb-2">
            ✅ 今日已签到
          </div>
          <div v-else class="text-gray-600 text-lg font-bold mb-2">
            ⏰ 今日未签到
          </div>
          
          <div class="text-sm text-gray-500">
            {{ activeCardCount }} 张学习卡等待签到
          </div>
        </div>
        
        <!-- 当前释放率 -->
        <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-4 border border-green-200">
          <div class="text-center">
            <div class="text-gray-600 text-sm mb-1">当前释放率</div>
            <div class="text-green-600 font-bold text-3xl">
              {{ (releaseRate * 100).toFixed(0) }}%/天
            </div>
            <div class="text-xs text-gray-500 mt-2">
              直推加速：0个1%，1个3%，2个6%，3个9%，4个12%，5个15%
            </div>
            <div class="mt-3 pt-3 border-t border-green-200">
              <div class="text-xs text-gray-600 mb-1">每张卡每日释放</div>
              <div class="flex items-center justify-center gap-4">
                <div class="text-blue-600 font-bold text-lg">
                  {{ (300 * releaseRate).toFixed(1) }} 积分
                </div>
                <div class="text-gray-400">→</div>
                <div class="text-yellow-600 font-bold text-lg">
                  {{ (300 * releaseRate * 0.85 * 0.08).toFixed(3) }} U
                </div>
              </div>
              <div class="text-xs text-gray-400 mt-1">
                （15%自动清0 {{ (300 * releaseRate * 0.15).toFixed(1) }} 积分）
              </div>
            </div>
          </div>
        </div>
        
        <!-- 签到按钮 -->
        <button 
          @click="handleCheckin"
          :disabled="isCheckedInToday || activeCardCount === 0 || loading"
          class="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all"
          :class="isCheckedInToday || activeCardCount === 0 || loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white'"
        >
          {{ loading ? '签到中...' : isCheckedInToday ? '✅ 今日已签到' : '📅 签到启动释放' }}
        </button>
        
        <div v-if="!isCheckedInToday && activeCardCount > 0" class="text-center text-red-500 text-sm mt-3">
          ⚠️ 不签到不释放，请记得每天签到！
        </div>
        
        <div v-if="activeCardCount === 0" class="text-center text-gray-500 text-sm mt-3">
          💡 还没有学习卡，请先兑换学习卡
        </div>
      </div>
    </div>

    <!-- AI学习卡兑换区 -->
    <div v-if="user" class="px-4 mt-6">
      <h3 class="text-gray-800 text-xl font-bold mb-4 flex items-center">
        <span class="bg-yellow-400 w-1 h-6 rounded-full mr-3"></span>
        💳 兑换学习卡
      </h3>

      <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-300">
        <!-- 学习卡图标 -->
        <div class="flex justify-center mb-4">
          <div class="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-all text-6xl">
            💳
          </div>
        </div>

        <!-- 学习卡信息 -->
        <div class="text-center mb-6">
          <h4 class="text-2xl font-bold text-gray-800 mb-2">AI智能学习卡</h4>
          <p class="text-gray-600 text-sm">每日签到 · 持续释放 · 智能分配</p>
        </div>

        <!-- V4.0 核心参数 -->
        <div class="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 mb-4 border-2 border-red-300">
          <div class="text-center text-red-600 font-bold text-sm mb-2">🔥 V4.4 签到制升级</div>
          <div class="text-xs text-gray-700 text-center">
            每日签到 · 1-15%释放 · 3倍出局 · 85%到账15%自动清0
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div class="text-gray-600 text-xs mb-1">兑换成本</div>
            <div class="text-yellow-600 font-bold text-xl">8U</div>
            <div class="text-gray-500 text-xs mt-1">= 100积分</div>
          </div>
          <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div class="text-gray-600 text-xs mb-1">出局倍数</div>
            <div class="text-yellow-600 font-bold text-xl">3倍</div>
            <div class="text-gray-500 text-xs mt-1">共300积分</div>
          </div>
          <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div class="text-gray-600 text-xs mb-1">基础释放</div>
            <div class="text-yellow-600 font-bold text-xl">1%/天</div>
            <div class="text-gray-500 text-xs mt-1">0个直推</div>
          </div>
          <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div class="text-gray-600 text-xs mb-1">直推加速</div>
            <div class="text-yellow-600 font-bold text-xl">1→3→15%</div>
            <div class="text-gray-500 text-xs mt-1">5个封顶</div>
          </div>
        </div>

        <!-- 收益分配 -->
        <div class="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl p-4 mb-4 border border-yellow-300">
          <div class="text-center text-sm font-bold text-gray-700 mb-3">📊 每日收益自动分配</div>
          <div class="space-y-2">
            <div class="flex items-center justify-between bg-white rounded-lg p-3">
              <span class="text-gray-600">85% 自动转U</span>
              <span class="text-yellow-600 font-bold">直接到账</span>
            </div>
            <div class="flex items-center justify-between bg-white rounded-lg p-3">
              <span class="text-gray-600">15% 自动清0</span>
              <span class="text-red-600 font-bold">防泡沫</span>
            </div>
          </div>
        </div>

        <!-- 释放量对照表 V4.4 -->
        <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-6 border border-blue-200">
          <div class="text-center text-sm font-bold text-gray-700 mb-3">💰 每日释放量对照表</div>
          <div class="space-y-1.5 text-xs">
            <div class="flex items-center justify-between bg-white rounded-lg px-3 py-2">
              <span class="text-gray-600">0个直推：1%</span>
              <span class="text-blue-600 font-bold">3积分/天 → 0.204U</span>
            </div>
            <div class="flex items-center justify-between bg-white rounded-lg px-3 py-2">
              <span class="text-gray-600">1个直推：3%</span>
              <span class="text-blue-600 font-bold">9积分/天 → 0.612U</span>
            </div>
            <div class="flex items-center justify-between bg-white rounded-lg px-3 py-2">
              <span class="text-gray-600">2个直推：6%</span>
              <span class="text-blue-600 font-bold">18积分/天 → 1.224U</span>
            </div>
            <div class="flex items-center justify-between bg-white rounded-lg px-3 py-2">
              <span class="text-gray-600">3个直推：9%</span>
              <span class="text-blue-600 font-bold">27积分/天 → 1.836U</span>
            </div>
            <div class="flex items-center justify-between bg-white rounded-lg px-3 py-2">
              <span class="text-gray-600">4个直推：12%</span>
              <span class="text-green-600 font-bold">36积分/天 → 2.448U</span>
            </div>
            <div class="flex items-center justify-between bg-white rounded-lg px-3 py-2 border-2 border-green-400">
              <span class="text-gray-700 font-bold">5个直推：15%</span>
              <span class="text-green-600 font-bold">45积分/天 → 3.06U</span>
            </div>
          </div>
          <div class="text-center text-xs text-gray-500 mt-2">
            💡 基于300积分总产出（3倍出局），85%到账，5个直推封顶
          </div>
        </div>

        <!-- 叠加数量选择 -->
        <div class="mb-6">
          <label class="block text-gray-700 font-bold mb-3 text-center">
            兑换数量（最多10张）
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
            总成本：{{ (purchaseCount * 6).toFixed(0) }}U = {{ (purchaseCount * 100) }}积分
          </div>
        </div>

        <!-- 兑换按钮 -->
        <button 
          @click="exchangeCard"
          :disabled="!canExchange || loading"
          class="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 transition-all shadow-xl"
        >
          {{ loading ? '兑换中...' : canExchange ? `💳 兑换 ${purchaseCount} 张学习卡` : (!user?.is_agent ? '请先加入Binary系统' : 'U余额不足') }}
        </button>

        <!-- 提示信息 -->
        <div class="mt-4 text-xs text-gray-500 text-center">
          <div v-if="!user?.is_agent" class="text-purple-600 font-medium mb-2">
            💡 需要先加入Binary对碰系统（30U）才能兑换学习卡
          </div>
          <div v-else-if="(user?.u_balance || 0) < purchaseCount * 6" class="text-red-600 font-medium mb-2">
            余额不足，需要 {{ (purchaseCount * 6).toFixed(2) }}U
          </div>
          <div>💳 加入代理自动送100积分，可激活第1张学习卡</div>
        </div>
      </div>
    </div>

    <!-- 我的学习卡列表 -->
    <div v-if="user" class="px-4 mt-6 mb-8">
      <h3 class="text-gray-800 text-xl font-bold mb-4 flex items-center justify-between">
        <span class="flex items-center">
          <span class="bg-yellow-400 w-1 h-6 rounded-full mr-3"></span>
          我的学习卡
        </span>
        <span class="text-sm text-gray-600">{{ myMachines.length }}/10</span>
      </h3>

      <!-- 学习机列表 - 2列网格布局 -->
      <div v-if="myMachines.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          v-for="machine in myMachines" 
          :key="machine.id"
          class="bg-white rounded-xl shadow-md p-4 border-2"
          :class="getCardBorderClass(machine)"
        >
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="text-gray-800 font-bold text-base mb-1">AI学习机 #{{ machine.id.slice(-4) }}</h4>
              <span 
                class="inline-block px-2 py-1 rounded-full text-xs font-bold"
                :class="getStatusClass(machine)"
              >
                {{ getStatusText(machine) }}
              </span>
            </div>
            <div class="text-right">
              <div class="text-yellow-600 font-bold text-xl">{{ (((machine.base_rate || 0) + (machine.boost_rate || 0)) * 100).toFixed(1) }}%</div>
              <div class="text-xs text-gray-500">每日释放率</div>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="mb-3">
            <div class="flex justify-between text-xs text-gray-600 mb-1">
              <span>学习进度</span>
              <span class="font-bold">{{ (((machine.released_points || 0) / (machine.total_points || 1)) * 100).toFixed(1) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                class="h-full rounded-full transition-all"
                :class="getProgressBarClass(machine)"
                :style="{ width: `${((machine.released_points || 0) / (machine.total_points || 1) * 100)}%` }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>{{ (machine.released_points || 0).toFixed(0) }}积分</span>
              <span>{{ (machine.total_points || 0).toFixed(0) }}积分</span>
            </div>
          </div>

          <!-- 数据统计 -->
          <div class="grid grid-cols-3 gap-1 text-xs mb-3">
            <div class="bg-yellow-50 rounded-lg p-1.5 text-center border border-yellow-100">
              <div class="text-gray-600 text-xs">日释放</div>
              <div class="text-yellow-700 font-bold text-sm">{{ ((machine.base_rate || 0) * 100).toFixed(1) }}%</div>
            </div>
            <div class="bg-purple-50 rounded-lg p-1.5 text-center border border-purple-100">
              <div class="text-gray-600 text-xs">等级</div>
              <div class="text-purple-600 font-bold text-sm">{{ getCompoundMultiplier(machine) }}倍</div>
            </div>
            <div class="bg-blue-50 rounded-lg p-1.5 text-center border border-blue-100">
              <div class="text-gray-600 text-xs">重启</div>
              <div class="text-gray-700 font-bold text-sm">{{ machine.restart_count || 0 }}次</div>
            </div>
          </div>

          <div class="text-xs text-gray-500 mt-2 text-center">
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
const loading = ref(false)
const purchaseCount = ref(1)
const myMachines = ref<MiningMachine[]>([])
const isCheckedInToday = ref(false)
const releaseRate = ref(0.02) // 默认2%

// 活跃学习卡数量（未完成的学习卡）
const activeCardCount = computed(() => {
  return myMachines.value.filter(m => {
    const machine = m as any
    return machine.released_points < machine.total_points
  }).length
})

// 是否可以兑换（V4.0新逻辑：8U余额）
const canExchange = computed(() => {
  if (!user.value?.is_agent) return false
  const totalCostU = purchaseCount.value * 8
  const uBalance = user.value?.u_balance || 0
  const currentCount = myMachines.value.length
  return uBalance >= totalCostU && currentCount + purchaseCount.value <= 10
})

// 格式化日期
const formatDate = (date: string) => {
  return format(new Date(date), 'yyyy-MM-dd HH:mm')
}

// V4.0签到功能
const handleCheckin = async () => {
  if (!user.value?.id) return
  
  loading.value = true
  const loadingToast = toast.info('签到中...', 0)
  
  try {
    const result = await MiningService.checkin(user.value.id)
    
    if (result.success) {
      toast.removeToast(loadingToast)
      toast.success(result.message || '签到成功！', 3000)
      isCheckedInToday.value = true
      releaseRate.value = result.data?.releaseRate || 0.02
      
      // 刷新数据
      await loadMyMachines()
      await authStore.loadUser()
    } else {
      toast.removeToast(loadingToast)
      toast.error(result.error || '签到失败')
    }
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '签到失败')
  } finally {
    loading.value = false
  }
}

// V4.0兑换学习卡（8U = 100积分）
const exchangeCard = async () => {
  if (!user.value?.id) return
  
  // 检查代理身份
  if (!user.value.is_agent) {
    toast.error('请先加入Binary对碰系统（30U）')
    router.push('/agent')
    return
  }
  
  // 检查余额
  const totalCost = purchaseCount.value * 6
  if ((user.value.u_balance || 0) < totalCost) {
    toast.error(`U余额不足，需要${totalCost}U`)
    return
  }
  
  const confirmMsg = `确定兑换 ${purchaseCount.value} 张AI学习卡吗？\n\n总成本：${totalCost}U\n签到送3倍积分学习`
  
  if (!confirm(confirmMsg)) {
    return
  }
  
  loading.value = true
  const loadingToast = toast.info('兑换中...', 0)
  
  try {
    const result = await MiningService.purchaseMachine(
      user.value.id,
      purchaseCount.value
    )
    
    if (result.success) {
      toast.removeToast(loadingToast)
      toast.success(result.message || `成功兑换${purchaseCount.value}张学习卡！`, 3000)
      purchaseCount.value = 1
      
      // 刷新数据
      await loadMyMachines()
      await authStore.loadUser()
    } else {
      toast.removeToast(loadingToast)
      toast.error(result.error || '兑换失败')
    }
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '兑换失败')
  } finally {
    loading.value = false
  }
}

// 获取学习等级倍数
const getCompoundMultiplier = (machine: MiningMachine) => {
  const multipliers = [2, 4, 8, 16, 32, 64, 128, 256]
  const level = machine.compound_level || 0
  return multipliers[level] || 2
}

// 获取卡片状态文本
const getStatusText = (machine: any) => {
  const status = machine.status || 'inactive'
  if (status === 'inactive') return '⏰ 待签到'
  if (status === 'active') return '🟢 学习中'
  if (status === 'finished') return '✅ 已完成'
  return '⭕ 已出局'
}

// 获取卡片状态样式
const getStatusClass = (machine: any) => {
  const status = machine.status || 'inactive'
  if (status === 'inactive') return 'bg-blue-100 text-blue-700'
  if (status === 'active') return 'bg-yellow-100 text-yellow-700'
  if (status === 'finished') return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-600'
}

// 获取卡片边框样式
const getCardBorderClass = (machine: any) => {
  const status = machine.status || 'inactive'
  if (status === 'inactive') return 'border-blue-300'
  if (status === 'active') return 'border-yellow-300'
  if (status === 'finished') return 'border-green-300'
  return 'border-gray-300'
}

// 获取进度条颜色
const getProgressBarClass = (machine: any) => {
  const status = machine.status || 'inactive'
  if (status === 'inactive') return 'bg-gradient-to-r from-blue-400 to-blue-600'
  if (status === 'active') return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
  if (status === 'finished') return 'bg-gradient-to-r from-green-400 to-green-600'
  return 'bg-gray-400'
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

// 加载我的学习机（localStorage版本）
const loadMyMachines = async () => {
  if (!user.value) return

  try {
    // 从localStorage读取学习卡
    const storageKey = 'user_learning_cards'
    const allCards = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    // 过滤出当前用户的学习卡
    const userCards = allCards
      .filter((card: any) => card.user_id === user.value.id)
      .sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    
    myMachines.value = userCards
    console.log(`✅ 从localStorage加载${userCards.length}张学习卡`)
    if (userCards.length > 0) {
      console.log('学习卡详情:', userCards.map((c: any) => ({
        id: c.id.slice(-4),
        status: c.status,
        released: c.released_points,
        total: c.total_points,
        progress: `${((c.released_points / c.total_points) * 100).toFixed(1)}%`
      })))
    }
  } catch (err) {
    console.error('加载学习机异常:', err)
    myMachines.value = []
  }
}

// V4.3 计算释放率（0个1%，1个3%，2个6%，3个9%，4个12%，5个15%封顶）
const calculateReleaseRate = async () => {
  if (!user.value?.id) return
  
  try {
    // 从localStorage查询直推AI代理数量
    const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '{}')
    
    // 统计直推AI代理数量
    let referralCount = 0
    for (const key in registeredUsers) {
      const userData = registeredUsers[key].userData
      if (userData.inviter_id === user.value.id && userData.is_agent) {
        referralCount++
      }
    }
    
    // V4.3：0个1%，1个3%，2个6%，3个9%，4个12%，5个15%封顶
    // 公式：rate = 0.01 + 0.01 * (3 * count - 1) when count > 0
    let rate: number
    if (referralCount === 0) {
      rate = 0.01 // 1%
    } else {
      const count = Math.min(referralCount, 5) // 最多5个直推
      const boost = 0.01 * (3 * count - 1)
      rate = Math.min(0.01 + boost, 0.15) // 上限15%
    }
    releaseRate.value = rate
    
    console.log(`✅ V4.3释放率: ${referralCount}个直推 = ${(rate * 100).toFixed(0)}%`)
  } catch (error) {
    console.error('计算释放率失败:', error)
    releaseRate.value = 0.01
  }
}

// 检查签到状态
const checkCheckinStatus = () => {
  if (!myMachines.value || myMachines.value.length === 0) {
    isCheckedInToday.value = false
    return
  }
  
  const today = new Date().toISOString().split('T')[0]
  
  // 过滤出未完成的学习卡
  const activeCards = myMachines.value.filter(m => {
    const machine = m as any
    return machine.released_points < machine.total_points
  })
  
  if (activeCards.length === 0) {
    isCheckedInToday.value = false
    return
  }
  
  // 检查是否所有未完成的卡都已签到
  isCheckedInToday.value = activeCards.every(
    m => (m as any).last_checkin_date === today
  )
}

onMounted(async () => {
  await loadMyMachines()
  await calculateReleaseRate()
  checkCheckinStatus()
})
</script>

<style scoped>
/* 黄白主题样式 */
.modal-box {
  max-height: 80vh;
  overflow-y: auto;
}
</style>
