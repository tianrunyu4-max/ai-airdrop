<template>
  <div class="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-yellow-50 pb-24">
    <!-- 顶部统计卡片 -->
    <div class="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 px-4 pt-6 pb-8">
      <div class="flex items-center justify-between mb-6">
        <button @click="$router.back()" class="text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-xl font-bold text-white">📊 收益明细</h1>
        <div class="w-6"></div>
      </div>

      <!-- 签到释放统计 -->
      <div class="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl">
        <div class="text-gray-600 text-sm mb-1">签到释放总收益</div>
        <div class="text-4xl font-bold text-green-600 mb-3">{{ checkinEarnings.toFixed(2) }} U</div>
        
        <!-- 直推释放率 -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border border-blue-200">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs text-gray-600 mb-1">📈 当前释放率</div>
              <div class="text-2xl font-bold text-blue-600">{{ (releaseRate * 100).toFixed(1) }}%</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-600 mb-1">直推AI代理</div>
              <div class="text-lg font-bold text-purple-600">{{ referralCount }}人</div>
            </div>
          </div>
          <div class="text-xs text-gray-500 mt-2 text-center">
            {{ referralCount >= 5 ? '🎉 已达最高释放率15%' : `💡 再直推${5 - referralCount}人达到15%封顶` }}
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="px-4 mt-4">
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-12">
        <div class="loading loading-spinner loading-lg text-primary"></div>
        <p class="text-gray-400 mt-4">加载中...</p>
      </div>

      <!-- ✅ 自动修复提示 -->
      <div v-if="showRepairHint" class="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-2xl p-4 mb-4 shadow-lg">
        <div class="flex items-start gap-3">
          <div class="text-3xl">⚠️</div>
          <div class="flex-1">
            <div class="font-bold text-gray-800 mb-2">检测到签到异常</div>
            <p class="text-sm text-gray-600 mb-3">
              您有 {{ myCardsCount }} 张学习卡，但今天还没有签到记录。
            </p>
            <button 
              @click="autoRepair"
              class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg transition-all"
            >
              🔧 自动修复记录
            </button>
          </div>
          <button @click="showRepairHint = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 签到释放记录 -->
      <div class="space-y-3">
        <div v-if="checkinRecords.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">📅</div>
          <p class="text-gray-600 font-medium mb-2">暂无签到释放记录</p>
          <p class="text-xs text-gray-500 mb-4">每日签到释放学习卡积分</p>
          <button 
            @click="$router.push('/points')"
            class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
          >
            📱 前往签到
          </button>
        </div>
        
        <div 
          v-for="record in checkinRecords" 
          :key="record.id"
          class="bg-white rounded-xl p-4 hover:bg-yellow-50 transition-all border-2 border-yellow-200 shadow-lg"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <span class="text-white font-bold text-lg">📅</span>
              </div>
              <div>
                <div class="text-gray-800 font-bold">签到释放</div>
                <div class="text-xs text-gray-600">{{ formatDate(record.created_at) }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xl font-bold text-green-600">+{{ record.amount.toFixed(2) }} U</div>
              <div class="text-xs text-gray-400">{{ record.metadata?.cards_count || 1 }}张学习卡</div>
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
            <div class="grid grid-cols-2 gap-2 text-xs mb-2">
              <div>
                <span class="text-gray-600">释放积分：</span>
                <span class="text-green-600 font-bold">{{ record.metadata?.total_released?.toFixed(2) || '0' }}</span>
              </div>
              <div>
                <span class="text-gray-600">释放率：</span>
                <span class="text-green-600 font-bold">{{ ((record.metadata?.release_rate || 0) * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="text-xs text-gray-600">
              <span>80% → </span>
              <span class="text-green-600 font-bold">{{ record.metadata?.to_u?.toFixed(2) || '0' }}U</span>
              <span class="mx-2">|</span>
              <span>20% → </span>
              <span class="text-blue-600 font-bold">{{ record.metadata?.to_burn?.toFixed(2) || '0' }}积分（学习AI）</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { supabase, isDevMode } from '@/lib/supabase'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// 状态
const loading = ref(true)

// 收益统计
const checkinEarnings = ref(0)

// 释放率相关
const releaseRate = ref(0.01) // 默认1%
const referralCount = ref(0)

// 记录列表
const checkinRecords = ref<any[]>([])

// ✅ 自动修复相关
const showRepairHint = ref(false)
const myCardsCount = ref(0)

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}


// 加载签到释放记录
const loadCheckinRecords = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // 从localStorage读取交易记录
    const transactions = JSON.parse(localStorage.getItem('user_transactions') || '[]')
    
    // 筛选签到释放记录 - 添加调试日志
    console.log(`📊 localStorage中共有${transactions.length}条交易记录`)
    
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    checkinRecords.value = transactions
      .filter((tx: any) => {
        const isSameUser = tx.user_id === userId
        const isCheckinType = tx.type === 'checkin_release'
        const txDate = new Date(tx.created_at)
        const isToday = txDate >= todayStart
        
        if (isToday && isSameUser && isCheckinType) {
          console.log(`✅ 找到今天的签到记录:`, tx)
        }
        
        return isSameUser && isCheckinType
      })
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50)
    
    // 计算签到总收益
    checkinEarnings.value = checkinRecords.value.reduce((sum, record) => sum + (record.amount || 0), 0)
    
    console.log(`✅ 共加载${checkinRecords.value.length}条签到释放记录，今日记录数：${checkinRecords.value.filter(r => new Date(r.created_at) >= todayStart).length}`)
    
    // 如果没有记录，输出提示
    if (checkinRecords.value.length === 0) {
      console.warn('⚠️ 没有找到任何签到释放记录，请检查是否已签到')
    }
  } catch (error: any) {
    console.error('加载签到记录失败:', error)
    toast.error('加载签到记录失败')
  }
}

// ✅ 计算释放率（正确公式：基础1% + 每人3% = 最高15%）
const calculateReleaseRate = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // ✅ 从数据库查询直推人数（referral_relationships表）
    const { count, error } = await supabase
      .from('referral_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', userId)
      .eq('is_active', true)
    
    if (error) {
      console.error('查询直推数量失败:', error)
      referralCount.value = 0
      releaseRate.value = 0.01
      return
    }
    
    referralCount.value = count || 0
    
    // ✅ 计算释放率（正确公式）
    // 没有直推 → 保底1%
    // 有直推 → 直接按 3% × 人数（最高15%）
    // 0个直推：1%（保底）
    // 1个直推：3%
    // 2个直推：6%
    // 3个直推：9%
    // 4个直推：12%
    // 5个或以上：15%（封顶）
    if (referralCount.value === 0) {
      releaseRate.value = 0.01  // 没有直推，保底1%
    } else {
      releaseRate.value = Math.min(referralCount.value * 0.03, 0.15)  // 有直推，3% × 人数，最高15%
    }
    
    console.log(`✅ 释放率计算: ${referralCount.value}人 → ${(releaseRate.value * 100).toFixed(1)}%`)
  } catch (error) {
    console.error('计算释放率失败:', error)
    releaseRate.value = 0.01
    referralCount.value = 0
  }
}

// ✅ 自动修复签到记录
const autoRepair = async () => {
  const loadingToast = toast.info('🔧 正在修复...', 0)
  
  try {
    const userId = authStore.user?.id
    if (!userId) {
      toast.removeToast(loadingToast)
      toast.error('请先登录')
      return
    }
    
    // 获取学习卡信息
    const cards = JSON.parse(localStorage.getItem('user_learning_cards') || '[]')
    const myCards = cards.filter((c: any) => c.user_id === userId)
    
    if (myCards.length === 0) {
      toast.removeToast(loadingToast)
      toast.error('您还没有学习卡')
      return
    }
    
    // 计算签到收益
    const activeCards = myCards.filter((c: any) => {
      const released = c.released_points || 0
      const total = c.total_points || 300
      return released < total
    })
    
    const cardsCount = activeCards.length
    const rate = releaseRate.value || 0.05
    const totalReleased = cardsCount * 5 * rate
    const toU = totalReleased * 0.8
    const toBurn = totalReleased * 0.2
    
    // 创建补救记录
    const transactions = JSON.parse(localStorage.getItem('user_transactions') || '[]')
    
    const newRecord = {
      id: `tx-${Date.now()}-checkin-修复`,
      user_id: userId,
      type: 'checkin_release',
      amount: parseFloat(toU.toFixed(2)),
      balance_after: authStore.user?.u_balance || 0,
      currency: 'U',
      description: `签到释放：${totalReleased.toFixed(2)}积分 → ${toU.toFixed(2)}U（释放率${(rate * 100).toFixed(1)}%）+ ${toBurn.toFixed(2)}积分销毁`,
      metadata: {
        cards_count: cardsCount,
        total_released: totalReleased,
        to_u: toU,
        to_burn: toBurn,
        release_rate: rate
      },
      created_at: new Date().toISOString()
    }
    
    transactions.push(newRecord)
    localStorage.setItem('user_transactions', JSON.stringify(transactions))
    
    toast.removeToast(loadingToast)
    toast.success(`✅ 修复成功！+${toU.toFixed(2)}U`, 3000)
    
    // 刷新记录
    showRepairHint.value = false
    await loadCheckinRecords()
    
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(`修复失败：${error.message}`)
    console.error('修复失败:', error)
  }
}

// ✅ 检测是否需要显示修复提示
const checkRepairHint = () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return
    
    // 检查学习卡
    const cards = JSON.parse(localStorage.getItem('user_learning_cards') || '[]')
    const myCards = cards.filter((c: any) => c.user_id === userId)
    myCardsCount.value = myCards.length
    
    if (myCards.length === 0) return
    
    // 检查今天是否有签到记录
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = checkinRecords.value.filter((r: any) => r.created_at?.startsWith(today))
    
    // 检查学习卡是否今天已签到
    const todayCheckedInCards = myCards.filter((c: any) => c.last_checkin_date?.startsWith(today))
    
    // 如果有学习卡，有些已签到，但没有签到记录，显示修复提示
    if (myCards.length > 0 && todayCheckedInCards.length > 0 && todayRecords.length === 0) {
      showRepairHint.value = true
      console.log('⚠️ 检测到签到异常，建议修复')
    }
  } catch (error) {
    console.error('检测修复提示失败:', error)
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      loadCheckinRecords(),
      calculateReleaseRate()
    ])
    
    // ✅ 检测是否需要修复
    setTimeout(() => {
      checkRepairHint()
    }, 500)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.bg-gray-750 {
  background-color: #2d3748;
}
</style>

