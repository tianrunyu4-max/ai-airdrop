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
      <div class="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl shadow-2xl p-5">
        <!-- 余额显示 -->
        <div class="text-white mb-4">
          <div class="text-sm opacity-90 mb-1">💰 我的资产</div>
          <div class="text-3xl font-bold">{{ (user.u_balance || 0).toFixed(2) }} U</div>
        </div>
        
        <!-- 学习卡和积分 - 左对齐、更大面积 -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
            <div class="text-white/80 text-sm mb-2">学习卡</div>
            <div class="text-white font-bold text-2xl">{{ myMachines.length }}<span class="text-lg ml-1">张</span></div>
          </div>
          <div class="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
            <div class="text-white/80 text-sm mb-2">积分</div>
            <div class="text-white font-bold text-2xl">{{ (user.transfer_points || 0).toFixed(0) }}</div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="grid grid-cols-3 gap-2">
          <button @click="goToEarnings" class="bg-white/20 backdrop-blur-sm text-white py-2 rounded-lg text-sm font-bold hover:bg-white/30 transition-all">
            收益记录
          </button>
          <button @click="goToTransfer" class="bg-white/20 backdrop-blur-sm text-white py-2 rounded-lg text-sm font-bold hover:bg-white/30 transition-all">
            互转
          </button>
          <button @click="refreshPage" class="bg-white/20 backdrop-blur-sm text-white py-2 rounded-lg text-sm font-bold hover:bg-white/30 transition-all">
            🔄 刷新
          </button>
        </div>
      </div>
    </div>

    <!-- ⚡ 横排双卡片：签到 + 兑换 -->
    <div v-if="user" class="px-4 mt-4">
      <div class="grid grid-cols-2 gap-3">
        
        <!-- 左卡：每日签到 -->
        <div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 shadow-xl">
          <div class="text-white/90 text-xs mb-2 font-semibold">📅 每日签到</div>
          <div class="text-white text-2xl font-bold mb-2">
            {{ isCheckedInToday ? '已签到' : '未签到' }}
          </div>
          <div class="text-white/80 text-xs mb-3">
            {{ activeCardCount }} 张卡 · {{ (releaseRate * 100).toFixed(1) }}% 释放率
          </div>
          <button 
            @click="handleCheckin"
            :disabled="isCheckedInToday || activeCardCount === 0 || loading"
            class="w-full py-3 rounded-xl font-bold text-sm transition-all"
            :class="isCheckedInToday || activeCardCount === 0 || loading
              ? 'bg-white/30 text-white/60 cursor-not-allowed'
              : 'bg-white text-green-600 hover:bg-white/90 shadow-lg'"
          >
            {{ loading ? '签到中...' : isCheckedInToday ? '✅ 今日已签' : '📅 今日签到' }}
          </button>
          <div v-if="!isCheckedInToday && activeCardCount > 0" class="text-white/90 text-xs mt-2 text-center">
            ⚠️ 不签到不释放
          </div>
        </div>

        <!-- 右卡：兑换学习卡 -->
        <div class="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-4 shadow-xl">
          <div class="text-white/90 text-xs mb-2 font-semibold">💳 兑换学习卡</div>
          <div class="text-white text-2xl font-bold mb-2">
            8U/张
          </div>
          <div class="text-white/80 text-xs mb-3">
            {{ myMachines.length }}/10张 · 3倍出局
          </div>
          <button 
            @click="openExchangeModal"
            :disabled="!user?.is_agent || loading"
            class="w-full py-3 rounded-xl font-bold text-sm transition-all"
            :class="!user?.is_agent || loading
              ? 'bg-white/30 text-white/60 cursor-not-allowed'
              : 'bg-white text-orange-600 hover:bg-white/90 shadow-lg'"
          >
            {{ !user?.is_agent ? '需代理身份' : myMachines.length >= 10 ? '已达上限' : '💎 立即兑换' }}
          </button>
          <div v-if="user?.is_agent && myMachines.length < 10" class="text-white/90 text-xs mt-2 text-center">
            💡 最多10张
          </div>
        </div>

      </div>
    </div>

    <!-- ✅ 重启统计卡片（只有拥有学习卡的用户才显示）-->
    <div v-if="user && myMachines.length > 0" class="px-4 mt-4">
      <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-xl">
        <div class="text-white/90 text-xs mb-2 font-semibold">🔄 系统重启统计</div>
        
        <div class="grid grid-cols-2 gap-3 mb-2">
          <div class="bg-white/20 rounded-lg p-3 text-center">
            <div class="text-white text-2xl font-bold">{{ restartStats.this_month || 0 }}</div>
            <div class="text-white/80 text-xs">本月重启</div>
          </div>
          <div class="bg-white/20 rounded-lg p-3 text-center">
            <div class="text-white text-2xl font-bold">{{ restartStats.total_restarts || 0 }}</div>
            <div class="text-white/80 text-xs">累计重启</div>
          </div>
        </div>
        
        <div class="text-white/70 text-xs text-center">
          {{ restartStats.last_restart ? '最近重启：' + formatLastRestart(restartStats.last_restart) : '尚未重启' }}
        </div>
        
        <div class="mt-3 text-white/60 text-xs text-center">
          💡 系统自动检测达标学习卡并销毁
        </div>
      </div>
    </div>

    <!-- 兑换学习卡弹窗 -->
    <div v-if="showExchangeModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" @click="showExchangeModal = false">
      <div class="bg-white rounded-2xl max-w-md w-full my-8" @click.stop>
        <!-- 标题栏 -->
        <div class="sticky top-0 bg-gradient-to-r from-yellow-500 to-orange-500 p-4 flex items-center justify-between">
          <h3 class="text-white font-bold text-lg">💳 兑换学习卡</h3>
          <button @click="showExchangeModal = false" class="text-white hover:bg-white/20 rounded-full p-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        <div class="p-5">
          <!-- ✅ 当前余额显示 -->
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border-2 border-blue-200">
            <div class="text-center text-xs text-gray-600 mb-2 font-bold">💼 当前余额</div>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-white rounded-lg p-2 text-center">
                <div class="text-xs text-gray-500">U余额</div>
                <div class="text-lg font-bold text-yellow-600">{{ (user?.u_balance || 0).toFixed(2) }}U</div>
              </div>
              <div class="bg-white rounded-lg p-2 text-center">
                <div class="text-xs text-gray-500">积分</div>
                <div class="text-lg font-bold text-purple-600">{{ (user?.transfer_points || 0).toFixed(0) }}</div>
              </div>
            </div>
          </div>

          <!-- ✅ 支付方式选择 -->
          <div class="mb-4">
            <div class="text-center text-sm text-gray-700 font-bold mb-3">💳 选择支付方式</div>
            <div class="grid grid-cols-2 gap-3">
              <button
                @click="paymentMethod = 'u'"
                :class="paymentMethod === 'u' 
                  ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-2 border-yellow-600 shadow-lg' 
                  : 'bg-gray-100 text-gray-600 border-2 border-gray-300'"
                class="p-4 rounded-xl font-bold text-sm transition-all hover:shadow-md"
              >
                <div class="text-2xl mb-1">💰</div>
                <div>U余额</div>
                <div class="text-xs opacity-80 mt-1">8U/张</div>
                <div v-if="paymentMethod === 'u'" class="text-xs mt-1">✓ 已选择</div>
              </button>
              <button
                @click="paymentMethod = 'points'"
                :class="paymentMethod === 'points' 
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white border-2 border-purple-600 shadow-lg' 
                  : 'bg-gray-100 text-gray-600 border-2 border-gray-300'"
                class="p-4 rounded-xl font-bold text-sm transition-all hover:shadow-md"
              >
                <div class="text-2xl mb-1">⭐</div>
                <div>积分</div>
                <div class="text-xs opacity-80 mt-1">100积分/张</div>
                <div v-if="paymentMethod === 'points'" class="text-xs mt-1">✓ 已选择</div>
              </button>
            </div>
          </div>

          <!-- 核心信息 -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-yellow-50 rounded-xl p-3 border border-yellow-200 text-center">
              <div class="text-gray-600 text-xs mb-1">兑换成本</div>
              <div class="text-yellow-600 font-bold text-2xl">
                {{ paymentMethod === 'u' ? '8U' : '100积分' }}
              </div>
            </div>
            <div class="bg-orange-50 rounded-xl p-3 border border-orange-200 text-center">
              <div class="text-gray-600 text-xs mb-1">3倍出局</div>
              <div class="text-orange-600 font-bold text-2xl">300积分</div>
            </div>
          </div>

          <!-- 收益分配 -->
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-200">
            <div class="text-sm font-bold text-gray-700 mb-2 text-center">📊 每日收益分配</div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-white rounded-lg p-2 text-center">
                <div class="text-green-600 font-bold">80% → U</div>
              </div>
              <div class="bg-white rounded-lg p-2 text-center">
                <div class="text-blue-600 font-bold">20% → 学分</div>
              </div>
            </div>
          </div>

          <!-- 释放率说明 -->
          <div class="bg-yellow-50 rounded-xl p-3 mb-4 border border-yellow-200">
            <div class="text-xs text-gray-700 text-center">
              <div class="font-bold mb-1">📈 释放率</div>
              <div>基础1% · 1直推3% · 5直推15%封顶</div>
            </div>
          </div>

          <!-- 数量选择 -->
          <div class="mb-4">
            <div class="text-center text-sm text-gray-700 font-bold mb-3">选择数量</div>
            <div class="flex items-center justify-center gap-4">
              <button 
                @click="purchaseCount = Math.max(1, purchaseCount - 1)"
                class="w-10 h-10 bg-gray-200 rounded-full font-bold text-xl text-gray-700 hover:bg-gray-300 transition-all"
              >
                -
              </button>
              <div class="text-4xl font-bold text-yellow-600 w-16 text-center">
                {{ purchaseCount }}
              </div>
              <button 
                @click="purchaseCount = Math.min(10 - myMachines.length, purchaseCount + 1)"
                class="w-10 h-10 bg-yellow-500 rounded-full font-bold text-xl text-white hover:bg-yellow-600 transition-all"
              >
                +
              </button>
            </div>
            <div class="text-center text-sm text-gray-600 mt-2">
              总成本：<span class="font-bold" :class="paymentMethod === 'u' ? 'text-yellow-600' : 'text-purple-600'">
                {{ paymentMethod === 'u' ? (purchaseCount * 8).toFixed(0) + 'U' : (purchaseCount * 100).toFixed(0) + '积分' }}
              </span>
            </div>
          </div>

          <!-- 兑换按钮 -->
          <button 
            @click="exchangeCard"
            :disabled="!canExchange || loading"
            :class="paymentMethod === 'u' 
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
              : 'bg-gradient-to-r from-purple-400 to-blue-500'"
            class="w-full text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all"
          >
            <span v-if="loading">兑换中...</span>
            <span v-else-if="!user?.is_agent">❌ 需代理身份</span>
            <span v-else-if="canExchange">💎 确认兑换 {{ purchaseCount }} 张</span>
            <span v-else-if="paymentMethod === 'u'">❌ U余额不足（需{{ (purchaseCount * 8).toFixed(0) }}U）</span>
            <span v-else>❌ 积分不足（需{{ (purchaseCount * 100).toFixed(0) }}积分）</span>
          </button>
          
          <!-- ✅ 余额提示 -->
          <div v-if="!canExchange && user?.is_agent" class="mt-3 text-center">
            <div v-if="paymentMethod === 'u'" class="text-xs text-red-600 font-medium">
              💡 您的U余额：{{ (user?.u_balance || 0).toFixed(2) }}U，需要：{{ (purchaseCount * 8).toFixed(0) }}U
            </div>
            <div v-else class="text-xs text-red-600 font-medium">
              💡 您的积分：{{ (user?.transfer_points || 0).toFixed(0) }}，需要：{{ (purchaseCount * 100).toFixed(0) }}积分
            </div>
          </div>

          <!-- 提示 -->
          <div class="mt-3 text-xs text-center text-gray-500">
            <div v-if="!user?.is_agent" class="text-red-600 font-medium">
              ⚠️ 需先加入Binary系统（30U）
            </div>
            <div v-else-if="(user?.u_balance || 0) < purchaseCount * 8" class="text-red-600 font-medium">
              余额不足，需要 {{ (purchaseCount * 8).toFixed(2) }}U
            </div>
            <div v-else class="text-gray-600">
              💡 最多10张 · 当前{{ myMachines.length }}张
            </div>
          </div>
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
              <div class="text-yellow-600 font-bold text-xl">{{ (releaseRate * 100).toFixed(1) }}%</div>
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
              <div class="text-yellow-700 font-bold text-sm">{{ (releaseRate * 100).toFixed(1) }}%</div>
            </div>
            <div class="bg-purple-50 rounded-lg p-1.5 text-center border border-purple-100">
              <div class="text-gray-600 text-xs">等级</div>
              <div class="text-purple-600 font-bold text-sm">3倍</div>
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
const showExchangeModal = ref(false) // 兑换弹窗
const paymentMethod = ref<'u' | 'points'>('u') // ✅ 支付方式：u=U余额，points=积分

// ✅ 重启统计（初始值，立即显示）
const restartStats = ref<any>({
  total_restarts: 0,
  this_week: 0,
  this_month: 0,
  last_restart: null
})

// 活跃学习卡数量（未完成的学习卡）
const activeCardCount = computed(() => {
  return myMachines.value.filter(m => {
    const machine = m as any
    return machine.released_points < machine.total_points
  }).length
})

// ✅ 是否可以兑换（支持U余额或积分）
const canExchange = computed(() => {
  if (!user.value?.is_agent) return false
  
  const currentCount = myMachines.value.length
  if (currentCount + purchaseCount.value > 10) return false
  
  if (paymentMethod.value === 'u') {
    // U余额支付：8U/张
    const totalCost = purchaseCount.value * 8
    return (user.value.u_balance || 0) >= totalCost
  } else {
    // 积分支付：100积分/张
    const totalCost = purchaseCount.value * 100
    return (user.value.transfer_points || 0) >= totalCost
  }
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

// 🔒 防重复兑换锁
const isExchanging = ref(false)

// ✅ V4.0兑换学习卡（支持8U或100积分）- 防重复点击加固
const exchangeCard = async () => {
  if (!user.value?.id) return
  
  // 🔒 防止重复点击
  if (isExchanging.value) {
    toast.warning('正在兑换中，请勿重复点击', 2000)
    return
  }
  
  // 检查代理身份
  if (!user.value.is_agent) {
    toast.error('请先加入Binary对碰系统（30U）')
    router.push('/agent')
    return
  }
  
  // 根据支付方式检查余额
  let confirmMsg = ''
  if (paymentMethod.value === 'u') {
    const totalCost = purchaseCount.value * 8
    if ((user.value.u_balance || 0) < totalCost) {
      toast.error(`U余额不足，需要${totalCost}U`)
      return
    }
    confirmMsg = `确定兑换 ${purchaseCount.value} 张AI学习卡吗？\n\n💰 支付方式：U余额\n💵 总成本：${totalCost}U\n📊 签到送3倍积分学习`
  } else {
    const totalCost = purchaseCount.value * 100
    if ((user.value.transfer_points || 0) < totalCost) {
      toast.error(`积分不足，需要${totalCost}积分`)
      return
    }
    confirmMsg = `确定兑换 ${purchaseCount.value} 张AI学习卡吗？\n\n⭐ 支付方式：积分\n💎 总成本：${totalCost}积分\n📊 签到送3倍积分学习`
  }
  
  if (!confirm(confirmMsg)) {
    return
  }
  
  // 🔒 加锁
  isExchanging.value = true
  loading.value = true
  const loadingToast = toast.info('兑换中...', 0)
  
  try {
    let result
    
    if (paymentMethod.value === 'u') {
      // U余额支付
      result = await MiningService.purchaseMachine(
        user.value.id,
        purchaseCount.value
      )
    } else {
      // ✅ 积分支付
      result = await MiningService.purchaseMachineWithPoints(
        user.value.id,
        purchaseCount.value
      )
    }
    
    if (result.success) {
      toast.removeToast(loadingToast)
      toast.success(result.message || `成功兑换${purchaseCount.value}张学习卡！`, 3000)
      purchaseCount.value = 1
      paymentMethod.value = 'u' // 重置支付方式
      showExchangeModal.value = false // 关闭弹窗
      
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
    // 🔓 延迟释放锁（防止快速重复点击）
    setTimeout(() => {
      isExchanging.value = false
    }, 1000)
  }
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

// ✅ 打开兑换弹窗（重置状态）
const openExchangeModal = () => {
  purchaseCount.value = 1 // 重置数量
  paymentMethod.value = 'u' // 默认U余额支付
  showExchangeModal.value = true
}

// 刷新页面
const refreshPage = async () => {
  loading.value = true
  const loadingToast = toast.info('刷新中...', 0)
  
  try {
    // 清除所有相关缓存
    const userId = authStore.user?.id
    localStorage.removeItem('tools_posts_cache')
    localStorage.removeItem(`weekly_limit_${userId}`)
    localStorage.removeItem(`team_stats_${userId}`) // 团队统计缓存
    localStorage.removeItem(`team_referrals_${userId}`) // 直推列表缓存
    
    console.log('✅ 已清除所有缓存')
    
    // 重新加载所有数据
    await Promise.all([
      authStore.loadUser(),
      loadMyMachines(),
      calculateReleaseRate()
    ])
    
    // 重新检查签到状态
    checkCheckinStatus()
    
    toast.removeToast(loadingToast)
    toast.success('✅ 刷新成功！', 2000)
  } catch (error) {
    console.error('刷新失败:', error)
    toast.removeToast(loadingToast)
    toast.error('刷新失败，请重试')
  } finally {
    loading.value = false
  }
}

// ✅ 加载我的学习机（从localStorage读取，与购买逻辑保持一致）
const loadMyMachines = async () => {
  if (!user.value?.id) return

  try {
    // 从localStorage读取学习卡
    const storageKey = 'user_learning_cards'
    const allCards = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    // 过滤出当前用户的学习卡
    const userCards = allCards
      .filter((card: any) => card.user_id === user.value?.id)
      .sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    
    myMachines.value = userCards
    console.log(`✅ 加载学习卡成功：${userCards.length}张`)
  } catch (err) {
    console.error('加载学习机异常:', err)
    myMachines.value = []
  }
}

// ✅ 计算释放率（正确公式：基础1% + 每人3% = 最高15%）
const calculateReleaseRate = async () => {
  if (!user.value?.id) return
  
  try {
    // ✅ 从数据库查询直推人数（referral_relationships表）
    const { count, error } = await supabase
      .from('referral_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.value.id)
      .eq('is_active', true)
    
    if (error) {
      console.error('查询直推数量失败:', error)
      releaseRate.value = 0.01
      return
    }
    
    const referralCount = count || 0
    
    // ✅ 计算释放率（正确公式）
    // 没有直推 → 保底1%
    // 有直推 → 直接按 3% × 人数（最高15%）
    // 0个直推：1%（保底）
    // 1个直推：3%
    // 2个直推：6%
    // 3个直推：9%
    // 4个直推：12%
    // 5个或以上：15%（封顶）
    if (referralCount === 0) {
      releaseRate.value = 0.01  // 没有直推，保底1%
    } else {
      releaseRate.value = Math.min(referralCount * 0.03, 0.15)  // 有直推，3% × 人数，最高15%
    }
    
    console.log(`✅ 释放率计算: ${referralCount}人 → ${(releaseRate.value * 100).toFixed(1)}%`)
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

// ✅ 加载重启统计（从数据库读取）
const loadRestartStats = async () => {
  if (!user.value?.id) return
  
  try {
    const { data, error } = await supabase
      .from('user_restart_stats')
      .select('*')
      .eq('user_id', user.value.id)
      .maybeSingle()
    
    if (error) {
      console.error('查询重启统计失败:', error)
      // 如果查询失败，使用默认值
      restartStats.value = {
        user_id: user.value.id,
        total_restarts: 0,
        this_week: 0,
        this_month: 0,
        last_restart: null
      }
      return
    }
    
    if (data) {
      restartStats.value = data
    } else {
      // 如果没有记录，显示初始状态
      restartStats.value = {
        user_id: user.value.id,
        total_restarts: 0,
        this_week: 0,
        this_month: 0,
        last_restart: null
      }
    }
  } catch (error) {
    console.error('加载重启统计失败:', error)
  }
}

// ✅ 格式化最近重启时间
const formatLastRestart = (dateString: string) => {
  if (!dateString) return '尚未重启'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}

onMounted(async () => {
  // ⚡ 并行加载所有数据（同时显示）
  const tasks = [
    loadMyMachines(),
    calculateReleaseRate()
  ]
  
  // ✅ 重启统计也并行加载（不等待，立即显示初始值）
  if (user.value?.is_agent) {
    tasks.push(loadRestartStats())
  }
  
  // 等待所有异步任务完成
  await Promise.all(tasks)
  
  // 检查签到状态（同步操作）
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
