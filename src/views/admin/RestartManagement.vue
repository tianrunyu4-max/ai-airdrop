<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
    <!-- 顶部标题 -->
    <div class="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-8">
      <h1 class="text-3xl font-bold text-white text-center mb-2">🔄 学习卡重启管理</h1>
      <p class="text-center text-white/80 text-sm">管理员专用 · 检测并销毁达标学习卡</p>
    </div>

    <!-- 管理员验证 -->
    <div v-if="!isAdmin" class="px-4 mt-6">
      <div class="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
        <div class="text-6xl mb-4">🔒</div>
        <div class="text-red-600 font-bold text-lg mb-2">无权限访问</div>
        <div class="text-gray-600 text-sm">此页面仅限管理员使用</div>
      </div>
    </div>

    <!-- 管理员界面 -->
    <div v-else class="px-4 mt-4 space-y-4">
      
      <!-- 当前状态卡片 -->
      <div class="bg-white rounded-2xl p-6 shadow-xl">
        <h2 class="text-lg font-bold text-gray-800 mb-4">📊 系统状态</h2>
        
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div class="text-blue-600 text-3xl font-bold">{{ totalCards }}</div>
            <div class="text-blue-600 text-xs mt-1">总学习卡</div>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div class="text-green-600 text-3xl font-bold">{{ activeUsers }}</div>
            <div class="text-green-600 text-xs mt-1">活跃用户</div>
          </div>
        </div>

        <button 
          @click="loadSystemStats"
          :disabled="loading"
          class="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
        >
          {{ loading ? '加载中...' : '🔄 刷新状态' }}
        </button>
      </div>

      <!-- 重启操作卡片 -->
      <div class="bg-white rounded-2xl p-6 shadow-xl">
        <h2 class="text-lg font-bold text-gray-800 mb-4">⚡ 重启操作</h2>
        
        <div class="space-y-3">
          <!-- 扫描按钮 -->
          <button 
            @click="scanAllCards"
            :disabled="scanning || restarting"
            class="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {{ scanning ? '🔍 扫描中...' : '🔍 全平台扫描' }}
          </button>

          <!-- 执行重启按钮 -->
          <button 
            v-if="scanResult && scanResult.qualifiedCount > 0"
            @click="confirmRestart"
            :disabled="scanning || restarting"
            class="w-full bg-gradient-to-r from-red-400 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {{ restarting ? '🔥 执行中...' : `🔥 执行重启 (销毁${scanResult.qualifiedCount}张)` }}
          </button>
        </div>

        <!-- 扫描结果 -->
        <div v-if="scanResult" class="mt-4 space-y-3">
          <div class="bg-gray-50 rounded-xl p-4">
            <div class="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div class="text-gray-600">扫描总数</div>
                <div class="text-2xl font-bold text-blue-600">{{ scanResult.totalScanned }}</div>
              </div>
              <div>
                <div class="text-gray-600">需要销毁</div>
                <div class="text-2xl font-bold text-red-600">{{ scanResult.qualifiedCount }}</div>
              </div>
              <div>
                <div class="text-gray-600">继续运行</div>
                <div class="text-2xl font-bold text-green-600">{{ scanResult.keptCount }}</div>
              </div>
            </div>
          </div>

          <!-- 达标学习卡列表 -->
          <div v-if="scanResult.qualifiedCards.length > 0" class="bg-red-50 border border-red-200 rounded-xl p-4">
            <div class="font-bold text-sm text-red-600 mb-2">🔥 达标学习卡（将被销毁）</div>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div 
                v-for="card in scanResult.qualifiedCards" 
                :key="card.id"
                class="bg-white rounded-lg p-3 border border-red-200"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-gray-700">{{ card.username }}</span>
                  <span class="text-xs text-red-600">运行{{ card.days }}天</span>
                </div>
                <div class="flex items-center justify-between text-xs text-gray-600">
                  <span>释放率: {{ (card.rate * 100).toFixed(1) }}%</span>
                  <span>收益: {{ card.earned.toFixed(2) }}U</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 重启历史 -->
      <div class="bg-white rounded-2xl p-6 shadow-xl">
        <h2 class="text-lg font-bold text-gray-800 mb-4">📜 重启历史</h2>
        
        <div v-if="restartHistory.length === 0" class="text-center py-8 text-gray-400">
          暂无重启记录
        </div>

        <div v-else class="space-y-3">
          <div 
            v-for="log in restartHistory" 
            :key="log.id"
            class="bg-gray-50 rounded-xl p-4"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold text-gray-800">
                {{ log.restart_type === 'auto' ? '🤖 自动重启' : '👨‍💼 手动重启' }}
              </span>
              <span class="text-xs text-gray-500">{{ formatDate(log.restart_time) }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div class="text-center">
                <div class="text-gray-600">扫描</div>
                <div class="font-bold text-blue-600">{{ log.total_scanned }}</div>
              </div>
              <div class="text-center">
                <div class="text-gray-600">销毁</div>
                <div class="font-bold text-red-600">{{ log.total_destroyed }}</div>
              </div>
              <div class="text-center">
                <div class="text-gray-600">保留</div>
                <div class="font-bold text-green-600">{{ log.total_kept }}</div>
              </div>
            </div>
          </div>
        </div>

        <button 
          @click="loadRestartHistory"
          class="w-full mt-3 bg-gray-200 text-gray-700 py-2 rounded-xl font-bold text-sm hover:bg-gray-300 transition-all"
        >
          加载更多
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { supabase } from '@/lib/supabase'
import { CardRestartService } from '@/services/CardRestartService'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// 状态
const loading = ref(false)
const scanning = ref(false)
const restarting = ref(false)
const totalCards = ref(0)
const activeUsers = ref(0)
const scanResult = ref<any>(null)
const restartHistory = ref<any[]>([])

// 权限检查
const isAdmin = computed(() => authStore.user?.is_admin === true)

// 加载系统状态
const loadSystemStats = async () => {
  loading.value = true
  
  try {
    // 统计所有学习卡
    const allCards = JSON.parse(localStorage.getItem('user_learning_cards') || '[]')
    totalCards.value = allCards.length
    
    // 统计活跃用户（有学习卡的用户）
    const userIds = new Set(allCards.map((c: any) => c.user_id))
    activeUsers.value = userIds.size
    
    toast.success('✅ 状态已刷新')
  } catch (error) {
    console.error('加载状态失败:', error)
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 扫描所有学习卡
const scanAllCards = async () => {
  scanning.value = true
  const loadingToast = toast.info('🔍 正在扫描全平台学习卡...', 0)
  
  try {
    // 获取所有学习卡
    const allCards = JSON.parse(localStorage.getItem('user_learning_cards') || '[]')
    
    let qualifiedCards: any[] = []
    let keptCards: any[] = []
    
    // 获取所有用户信息
    const userIds = [...new Set(allCards.map((c: any) => c.user_id))]
    const { data: users } = await supabase
      .from('users')
      .select('id, username')
      .in('id', userIds)
    
    const userMap = new Map(users?.map(u => [u.id, u.username]) || [])
    
    // 检测每张卡
    for (const card of allCards) {
      const status = CardRestartService.checkCardStatus(card)
      
      const cardInfo = {
        id: card.id,
        userId: card.user_id,
        username: userMap.get(card.user_id) || '未知用户',
        days: status.daysActive,
        rate: status.currentRate,
        earned: status.totalEarned,
        isQualified: status.isQualified
      }
      
      if (status.shouldDestroy) {
        qualifiedCards.push(cardInfo)
      } else {
        keptCards.push(cardInfo)
      }
    }
    
    scanResult.value = {
      totalScanned: allCards.length,
      qualifiedCount: qualifiedCards.length,
      keptCount: keptCards.length,
      qualifiedCards,
      keptCards
    }
    
    toast.removeToast(loadingToast)
    toast.success(`✅ 扫描完成：发现${qualifiedCards.length}张达标学习卡`, 3000)
    
  } catch (error) {
    console.error('扫描失败:', error)
    toast.removeToast(loadingToast)
    toast.error('扫描失败')
  } finally {
    scanning.value = false
  }
}

// 确认重启
const confirmRestart = async () => {
  if (!scanResult.value || scanResult.value.qualifiedCount === 0) return
  
  const confirmMsg = `确认执行重启操作？\n\n将销毁 ${scanResult.value.qualifiedCount} 张达标学习卡\n影响 ${new Set(scanResult.value.qualifiedCards.map((c: any) => c.userId)).size} 名用户\n\n此操作不可撤销！`
  
  if (!confirm(confirmMsg)) {
    return
  }
  
  restarting.value = true
  const loadingToast = toast.info('🔥 正在执行重启...', 0)
  
  try {
    // 获取所有学习卡
    const allCards = JSON.parse(localStorage.getItem('user_learning_cards') || '[]')
    const destroyIds = scanResult.value.qualifiedCards.map((c: any) => c.id)
    
    // 删除达标的卡片
    const remainingCards = allCards.filter((c: any) => !destroyIds.includes(c.id))
    localStorage.setItem('user_learning_cards', JSON.stringify(remainingCards))
    
    // 统计受影响的用户
    const affectedUserIds = [...new Set(scanResult.value.qualifiedCards.map((c: any) => c.userId))]
    
    // 更新每个用户的统计
    for (const userId of affectedUserIds) {
      await supabase.rpc('update_user_restart_stats', { p_user_id: userId })
    }
    
    // 记录重启日志
    await supabase.from('restart_logs').insert({
      admin_id: authStore.user?.id,
      restart_type: 'manual',
      total_scanned: scanResult.value.totalScanned,
      total_destroyed: scanResult.value.qualifiedCount,
      total_kept: scanResult.value.keptCount,
      affected_users: affectedUserIds
    })
    
    toast.removeToast(loadingToast)
    toast.success(`✅ 重启完成！销毁${scanResult.value.qualifiedCount}张，保留${scanResult.value.keptCount}张`, 5000)
    
    // 重置扫描结果
    scanResult.value = null
    
    // 刷新状态和历史
    await loadSystemStats()
    await loadRestartHistory()
    
  } catch (error) {
    console.error('重启失败:', error)
    toast.removeToast(loadingToast)
    toast.error('重启失败')
  } finally {
    restarting.value = false
  }
}

// 加载重启历史
const loadRestartHistory = async () => {
  try {
    const { data, error } = await supabase
      .from('restart_logs')
      .select('*')
      .order('restart_time', { ascending: false })
      .limit(10)
    
    if (error) throw error
    
    restartHistory.value = data || []
  } catch (error) {
    console.error('加载历史失败:', error)
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

onMounted(async () => {
  if (!isAdmin.value) {
    toast.error('无权限访问')
    setTimeout(() => {
      router.push('/chat')
    }, 2000)
    return
  }
  
  await loadSystemStats()
  await loadRestartHistory()
})
</script>

