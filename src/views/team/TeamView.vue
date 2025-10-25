<template>
  <div class="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-yellow-50 pb-24">
    <!-- 顶部统计 -->
    <div class="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 px-4 pt-6 pb-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-white">💎 我的团队</h1>
        <button @click="refreshData" class="text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" :class="{ 'animate-spin': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <!-- 总业绩卡片 -->
      <div class="bg-white/90 backdrop-blur-lg rounded-2xl p-4 mb-4 shadow-xl">
        <div class="text-gray-600 text-sm mb-1">团队总业绩</div>
        <div class="text-3xl font-bold text-yellow-600 mb-2">{{ totalSales }}人</div>
        <div class="flex items-center justify-between text-sm">
          <div>
            <span class="text-gray-600">直推：</span>
            <span class="text-gray-800 font-bold">{{ directReferrals }}人</span>
          </div>
          <div :class="isUnlocked ? 'text-green-600' : 'text-orange-600'" class="font-bold">
            {{ isUnlocked ? '✅ 已解锁对碰奖' : '⚠️ 未解锁（需直推≥2人）' }}
          </div>
        </div>
      </div>
    </div>

    <!-- A/B区对碰展示 -->
    <div class="px-4 -mt-4">
      <!-- 对碰奖预览卡片 -->
      <div class="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-4 mb-4 shadow-xl">
        <div class="flex items-center justify-between mb-2">
          <div class="text-white text-sm">预计对碰奖</div>
          <div class="text-white text-xs opacity-80">每日凌晨12点结算</div>
        </div>
        <div class="text-white text-3xl font-bold mb-1">{{ estimatedPairingBonus.toFixed(2) }} U</div>
        <div class="text-white/80 text-xs">{{ pendingPairs }}组 × 6U = {{ estimatedPairingBonus.toFixed(2) }}U</div>
      </div>

      <!-- A/B区业绩对比 -->
      <div class="bg-white rounded-2xl p-4 mb-4 shadow-lg border-2 border-yellow-200">
        <h3 class="text-gray-800 font-bold mb-4 flex items-center gap-2">
          <span>双区业绩</span>
          <span class="text-xs text-gray-500">（弱区优先，2:1/1:2灵活配对）</span>
        </h3>

        <!-- 可视化对比 -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <div class="text-blue-600 font-bold">A区</div>
            <div class="text-blue-600 text-xl font-bold">{{ aSideSales }}单</div>
          </div>
          <div class="h-3 bg-gray-200 rounded-full overflow-hidden mb-1">
            <div 
              class="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
              :style="{ width: aSidePercentage + '%' }"
            ></div>
          </div>
          <div class="text-xs text-gray-600 mb-4">
            已结算：{{ aSideSettled }}单 | 未结算：{{ aSidePending }}单
          </div>

          <div class="flex items-center justify-between mb-2">
            <div class="text-green-600 font-bold">B区</div>
            <div class="text-green-600 text-xl font-bold">{{ bSideSales }}单</div>
          </div>
          <div class="h-3 bg-gray-200 rounded-full overflow-hidden mb-1">
            <div 
              class="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
              :style="{ width: bSidePercentage + '%' }"
            ></div>
          </div>
          <div class="text-xs text-gray-600">
            已结算：{{ bSideSettled }}单 | 未结算：{{ bSidePending }}单
          </div>
        </div>

        <!-- 对碰统计 -->
        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          <div class="bg-yellow-50 rounded-lg p-2 border border-yellow-200">
            <div class="text-gray-600 mb-1">可对碰</div>
            <div class="text-yellow-700 font-bold text-lg">{{ pendingPairs }}</div>
          </div>
          <div class="bg-blue-50 rounded-lg p-2 border border-blue-200">
            <div class="text-gray-600 mb-1">已对碰</div>
            <div class="text-blue-700 font-bold text-lg">{{ settledPairs }}</div>
          </div>
          <div class="bg-green-50 rounded-lg p-2 border border-green-200">
            <div class="text-gray-600 mb-1">累计奖金</div>
            <div class="text-green-700 font-bold text-lg">{{ totalPairingBonus.toFixed(0) }}</div>
          </div>
        </div>
      </div>

      <!-- 收益统计 -->
      <div class="bg-white rounded-2xl p-4 mb-4 shadow-lg border-2 border-yellow-200">
        <h3 class="text-gray-800 font-bold mb-4">收益统计</h3>
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center">
            <div class="text-yellow-600 text-2xl font-bold">{{ totalPairingBonus.toFixed(2) }}</div>
            <div class="text-xs text-gray-600 mt-1">对碰奖</div>
          </div>
          <div class="text-center">
            <div class="text-green-600 text-2xl font-bold">{{ totalLevelBonus.toFixed(2) }}</div>
            <div class="text-xs text-gray-600 mt-1">见单奖</div>
          </div>
          <div class="text-center">
            <div class="text-blue-600 text-2xl font-bold">{{ totalDividend.toFixed(2) }}</div>
            <div class="text-xs text-gray-600 mt-1">分红</div>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-gray-200 text-center">
          <div class="text-gray-600 text-sm">总收益</div>
          <div class="text-yellow-600 text-2xl font-bold">{{ totalEarnings.toFixed(2) }} U</div>
        </div>
      </div>

      <!-- 直推列表 -->
      <div class="bg-white rounded-2xl p-4 mb-4 shadow-lg border-2 border-yellow-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-gray-800 font-bold">直推列表</h3>
          <div class="text-sm text-gray-600">共{{ directReferrals }}人</div>
        </div>

        <div v-if="loading" class="text-center py-8">
          <div class="loading loading-spinner loading-md text-yellow-500"></div>
        </div>

        <div v-else-if="referralList.length === 0" class="text-center py-8">
          <div class="text-gray-400 text-4xl mb-2">👥</div>
          <p class="text-gray-600">暂无直推会员</p>
          <p class="text-xs text-gray-500 mt-2">分享你的推荐码邀请好友加入</p>
        </div>

        <div v-else class="space-y-2">
          <div 
            v-for="(member, index) in referralList" 
            :key="member.id"
            class="bg-yellow-50 rounded-xl p-3 flex items-center justify-between hover:bg-yellow-100 transition-all border border-yellow-200"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                {{ index + 1 }}
              </div>
              <div>
                <div class="text-gray-800 font-medium">{{ member.username }}</div>
                <div class="text-xs text-gray-600">{{ formatDate(member.created_at) }}</div>
              </div>
            </div>
            <div class="text-right">
              <div 
                :class="[
                  'text-xs font-bold px-2 py-1 rounded-full',
                  member.network_side === 'A' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-green-100 text-green-700 border border-green-300'
                ]"
              >
                {{ member.network_side }}区
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 复投提示Modal -->
    <ReinvestModal 
      :show="showReinvestModal"
      @close="showReinvestModal = false"
      @success="handleReinvestSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { BinaryService } from '@/services/BinaryService'
import { supabase, isDevMode } from '@/lib/supabase'
import ReinvestModal from '@/components/reinvest/ReinvestModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// 状态
const loading = ref(true)
const showReinvestModal = ref(false)

// 网络统计
const aSideSales = ref(0)
const bSideSales = ref(0)
const aSideSettled = ref(0)
const bSideSettled = ref(0)
const totalPairingBonus = ref(0)
const totalLevelBonus = ref(0)
const totalDividend = ref(0)
const isUnlocked = ref(false)

// 直推列表
const directReferrals = ref(0)
const referralList = ref<any[]>([])

// 计算属性
const totalSales = computed(() => aSideSales.value + bSideSales.value)

const aSidePending = computed(() => aSideSales.value - aSideSettled.value)
const bSidePending = computed(() => bSideSales.value - bSideSettled.value)

const pendingPairs = computed(() => Math.min(aSidePending.value, bSidePending.value))
const settledPairs = computed(() => Math.min(aSideSettled.value, bSideSettled.value))

const estimatedPairingBonus = computed(() => {
  // V5.1：每组6U × 100% = 6U
  return pendingPairs.value * 6
})

const totalEarnings = computed(() => 
  totalPairingBonus.value + totalLevelBonus.value + totalDividend.value
)

// 百分比计算（用于进度条）
const maxSales = computed(() => Math.max(aSideSales.value, bSideSales.value, 1))
const aSidePercentage = computed(() => (aSideSales.value / maxSales.value) * 100)
const bSidePercentage = computed(() => (bSideSales.value / maxSales.value) * 100)

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天加入'
  } else if (diffDays === 1) {
    return '昨天加入'
  } else if (diffDays < 30) {
    return `${diffDays}天前加入`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}

// 加载网络统计
const loadNetworkStats = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // ✅ 优化：从缓存加载（如果存在且新鲜）
    const cacheKey = `team_stats_${userId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { data: cachedData, timestamp } = JSON.parse(cached)
      // 缓存30秒有效
      if (Date.now() - timestamp < 30000) {
        aSideSales.value = cachedData.aSideSales || 0
        bSideSales.value = cachedData.bSideSales || 0
        aSideSettled.value = cachedData.aSideSettled || 0
        bSideSettled.value = cachedData.bSideSettled || 0
        totalPairingBonus.value = cachedData.totalPairingBonus || 0
        totalLevelBonus.value = cachedData.totalLevelBonus || 0
        totalDividend.value = cachedData.totalDividend || 0
        isUnlocked.value = cachedData.isUnlocked || false
        directReferrals.value = cachedData.directReferrals || 0
        console.log('✅ 从缓存加载团队统计')
        return
      }
    }

    // 获取用户二元系统信息
    const result = await BinaryService.getBinaryInfo(userId)
    
    if (result.success && result.data) {
      const data = result.data
      
      // 更新统计数据
      aSideSales.value = data.a_side_count || 0
      bSideSales.value = data.b_side_count || 0
      aSideSettled.value = (data.a_side_count || 0) - (data.a_side_pending || 0)
      bSideSettled.value = (data.b_side_count || 0) - (data.b_side_pending || 0)
      totalPairingBonus.value = data.total_pairing_bonus || 0
      totalLevelBonus.value = data.total_level_bonus || 0
      totalDividend.value = data.total_dividend || 0
      isUnlocked.value = data.level_bonus_unlocked || false
      directReferrals.value = data.direct_referrals || 0
      
      // ✅ 保存到缓存
      localStorage.setItem(cacheKey, JSON.stringify({
        data: {
          aSideSales: aSideSales.value,
          bSideSales: bSideSales.value,
          aSideSettled: aSideSettled.value,
          bSideSettled: bSideSettled.value,
          totalPairingBonus: totalPairingBonus.value,
          totalLevelBonus: totalLevelBonus.value,
          totalDividend: totalDividend.value,
          isUnlocked: isUnlocked.value,
          directReferrals: directReferrals.value
        },
        timestamp: Date.now()
      }))
    } else {
      // 未加入二元系统，使用默认值
      aSideSales.value = 0
      bSideSales.value = 0
      aSideSettled.value = 0
      bSideSettled.value = 0
      totalPairingBonus.value = 0
      totalLevelBonus.value = 0
      totalDividend.value = 0
      isUnlocked.value = false
      directReferrals.value = 0
    }
  } catch (error: any) {
    console.error('加载网络统计失败:', error)
    // 不显示错误提示，使用默认值
  }
}

// 加载直推列表
const loadReferralList = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // ✅ 优化：从缓存加载（如果存在且新鲜）
    const cacheKey = `team_referrals_${userId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { data: cachedData, timestamp } = JSON.parse(cached)
      // 缓存30秒有效
      if (Date.now() - timestamp < 30000) {
        referralList.value = cachedData || []
        console.log('✅ 从缓存加载直推列表')
        return
      }
    }

    // 🔥 生产模式：从数据库查询直推用户
    const { data, error } = await supabase
      .from('users')
      .select('id, username, network_side, created_at')
      .eq('inviter_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      // 查询失败，使用空数组
      referralList.value = []
      return
    }

    referralList.value = data || []
    
    // ✅ 保存到缓存
    localStorage.setItem(cacheKey, JSON.stringify({
      data: referralList.value,
      timestamp: Date.now()
    }))
  } catch (error) {
    // 加载失败，使用空数组
    referralList.value = []
  }
}

// 刷新数据
const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadNetworkStats(),
      loadReferralList()
    ])
    toast.success('数据已刷新')
    
    // 检查是否需要复投
    await checkReinvestment()
  } finally {
    loading.value = false
  }
}

// 检查复投
const checkReinvestment = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // 获取二元系统信息
    const result = await BinaryService.getBinaryInfo(userId)
    
    if (result.success && result.data) {
      const data = result.data
      
      // 检查是否需要复投
      if (!data.is_active && data.total_earnings >= 300) {
        showReinvestModal.value = true
      }
    }
  } catch (error) {
    console.error('检查复投失败:', error)
  }
}

// 复投成功处理
const handleReinvestSuccess = () => {
  refreshData()
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
