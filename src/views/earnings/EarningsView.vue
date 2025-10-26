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
        <div class="text-4xl font-bold text-green-600">{{ checkinEarnings.toFixed(2) }} U</div>
        <div class="text-xs text-gray-500 mt-2">每日签到释放学习卡积分</div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="px-4 mt-4">
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-12">
        <div class="loading loading-spinner loading-lg text-primary"></div>
        <p class="text-gray-400 mt-4">加载中...</p>
      </div>

      <!-- 签到释放记录 -->
      <div class="space-y-3">
        <div v-if="checkinRecords.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">📅</div>
          <p class="text-gray-600 font-medium mb-2">暂无签到释放记录</p>
          <p class="text-xs text-gray-500">每日签到释放学习卡积分</p>
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

// 记录列表
const checkinRecords = ref<any[]>([])

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

onMounted(async () => {
  loading.value = true
  try {
    await loadCheckinRecords()
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

