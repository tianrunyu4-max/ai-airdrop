<template>
  <div class="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 pb-24">
    <!-- 顶部标题栏 -->
    <div class="bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 px-4 pt-8 pb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1">💎 我的团队</h1>
          <p class="text-white/80 text-sm">团队总业绩：<span class="font-bold">{{ totalSales }}人</span> | 直推：<span class="font-bold">{{ directReferrals }}人</span></p>
        </div>
        <button @click="refreshData" class="btn btn-circle btn-ghost text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" :class="{ 'animate-spin': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="px-4 -mt-4">
      <!-- ⚡ 横排双卡片：A/B区对碰 -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <!-- A区卡片 -->
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 shadow-xl">
          <div class="text-white/80 text-xs mb-2 font-semibold">A区业绩</div>
          <div class="text-white text-3xl font-bold mb-3">{{ aSideSales }}</div>
          <div class="space-y-2">
            <div class="flex justify-between text-white/90 text-xs">
              <span>已结算</span>
              <span class="font-bold">{{ aSideSettled }}单</span>
            </div>
            <div class="flex justify-between text-white/90 text-xs">
              <span>未结算</span>
              <span class="font-bold">{{ aSidePending }}单</span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-white/20">
            <div class="h-2 bg-white/20 rounded-full overflow-hidden">
              <div class="h-full bg-white rounded-full transition-all duration-500" :style="{ width: aSidePercentage + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- B区卡片 -->
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 shadow-xl">
          <div class="text-white/80 text-xs mb-2 font-semibold">B区业绩</div>
          <div class="text-white text-3xl font-bold mb-3">{{ bSideSales }}</div>
          <div class="space-y-2">
            <div class="flex justify-between text-white/90 text-xs">
              <span>已结算</span>
              <span class="font-bold">{{ bSideSettled }}单</span>
            </div>
            <div class="flex justify-between text-white/90 text-xs">
              <span>未结算</span>
              <span class="font-bold">{{ bSidePending }}单</span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-white/20">
            <div class="h-2 bg-white/20 rounded-full overflow-hidden">
              <div class="h-full bg-white rounded-full transition-all duration-500" :style="{ width: bSidePercentage + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ⚡ 横排三卡片：对碰统计 -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-white rounded-xl p-4 shadow-lg">
          <div class="text-yellow-500 text-2xl mb-1">{{ pendingPairs }}</div>
          <div class="text-gray-600 text-xs">可对碰</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-lg">
          <div class="text-blue-500 text-2xl mb-1">{{ settledPairs }}</div>
          <div class="text-gray-600 text-xs">已对碰</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-lg">
          <div class="text-green-500 text-2xl mb-1">{{ totalPairingBonus.toFixed(0) }}</div>
          <div class="text-gray-600 text-xs">累计奖金</div>
        </div>
      </div>

      <!-- ⚡ 对碰奖励大卡片 -->
      <div class="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-5 mb-4 shadow-2xl">
        <div class="flex items-center justify-between mb-2">
          <div class="text-white text-sm font-semibold">💰 预计对碰奖</div>
          <div class="text-white/80 text-xs">每日凌晨12点结算</div>
        </div>
        <div class="text-white text-4xl font-bold mb-1">{{ estimatedPairingBonus.toFixed(2) }} U</div>
        <div class="text-white/90 text-xs">{{ pendingPairs }}组待结算 × 6U = {{ estimatedPairingBonus.toFixed(2) }}U</div>
        <div :class="isUnlocked ? 'bg-green-500/30 text-white' : 'bg-orange-500/30 text-white'" class="mt-3 py-2 px-3 rounded-lg text-xs font-semibold">
          {{ isUnlocked ? '✅ 已解锁对碰奖' : '⚠️ 未解锁（需直推≥2人）' }}
        </div>
      </div>

      <!-- ⚡ 横排双卡片：收益统计 -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <!-- 对碰+见单 -->
        <div class="bg-white rounded-2xl p-4 shadow-lg">
          <div class="text-gray-500 text-xs mb-3">奖励收益</div>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600">对碰奖</span>
              <span class="text-yellow-600 font-bold">{{ totalPairingBonus.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600">见单奖</span>
              <span class="text-green-600 font-bold">{{ totalLevelBonus.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- 分红+总收益 -->
        <div class="bg-white rounded-2xl p-4 shadow-lg">
          <div class="text-gray-500 text-xs mb-3">累计收益</div>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600">分红</span>
              <span class="text-blue-600 font-bold">{{ totalDividend.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600">总收益</span>
              <span class="text-orange-600 font-bold text-lg">{{ totalEarnings.toFixed(2) }} U</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ⚡ 直推列表 -->
      <div class="bg-white rounded-2xl p-4 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-gray-800 font-bold flex items-center gap-2">
            <span>👥</span>
            <span>直推列表</span>
          </h3>
          <div class="badge badge-warning badge-sm">{{ directReferrals }}人</div>
        </div>

        <div v-if="loading" class="text-center py-12">
          <div class="loading loading-spinner loading-lg text-yellow-500"></div>
        </div>

        <div v-else-if="referralList.length === 0" class="text-center py-12">
          <div class="text-6xl mb-3">👥</div>
          <p class="text-gray-600 font-medium mb-1">暂无直推会员</p>
          <p class="text-xs text-gray-500">分享你的推荐码邀请好友加入</p>
        </div>

        <div v-else class="grid grid-cols-2 gap-3">
          <div 
            v-for="(member, index) in referralList" 
            :key="member.id"
            class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-3 shadow-sm border border-yellow-200 hover:shadow-md transition-all"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {{ index + 1 }}
              </div>
              <div 
                :class="[
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  member.network_side === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                ]"
              >
                {{ member.network_side }}区
              </div>
            </div>
            <div class="text-gray-800 font-medium text-sm mb-1 truncate">{{ member.username }}</div>
            <div class="text-xs text-gray-500">{{ formatDate(member.created_at) }}</div>
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
const referralList = ref<any[]>([])

// 计算直推人数（基于实际列表长度，而不是缓存的数字）
const directReferrals = computed(() => referralList.value.length)

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
const loadNetworkStats = async (forceRefresh = false) => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // ✅ 检查用户是否是AI代理
    if (!authStore.user?.is_agent) {
      console.log('⚠️ 非AI代理用户，不加载团队数据')
      aSideSales.value = 0
      bSideSales.value = 0
      aSideSettled.value = 0
      bSideSettled.value = 0
      totalPairingBonus.value = 0
      totalLevelBonus.value = 0
      totalDividend.value = 0
      isUnlocked.value = false
      return
    }

    // ✅ 优化：从缓存加载（如果存在且新鲜，且不是强制刷新）
    const cacheKey = `team_stats_${userId}`
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached)
        // 缓存5秒有效（更短的缓存时间）
        if (Date.now() - timestamp < 5000) {
          aSideSales.value = cachedData.aSideSales || 0
          bSideSales.value = cachedData.bSideSales || 0
          aSideSettled.value = cachedData.aSideSettled || 0
          bSideSettled.value = cachedData.bSideSettled || 0
          totalPairingBonus.value = cachedData.totalPairingBonus || 0
          totalLevelBonus.value = cachedData.totalLevelBonus || 0
          totalDividend.value = cachedData.totalDividend || 0
          isUnlocked.value = cachedData.isUnlocked || false
          console.log('✅ 从缓存加载团队统计 (5秒)')
          return
        }
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
      // directReferrals 现在是computed，不需要手动设置
      
      // ✅ 保存到缓存（不包括directReferrals，因为它是computed）
      localStorage.setItem(cacheKey, JSON.stringify({
        data: {
          aSideSales: aSideSales.value,
          bSideSales: bSideSales.value,
          aSideSettled: aSideSettled.value,
          bSideSettled: bSideSettled.value,
          totalPairingBonus: totalPairingBonus.value,
          totalLevelBonus: totalLevelBonus.value,
          totalDividend: totalDividend.value,
          isUnlocked: isUnlocked.value
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
      // directReferrals 现在是computed，不需要手动设置
    }
  } catch (error: any) {
    console.error('加载网络统计失败:', error)
    // 不显示错误提示，使用默认值
  }
}

// 加载直推列表
const loadReferralList = async (forceRefresh = false) => {
  try {
    const userId = authStore.user?.id
    console.log('🔍 [直推列表] 开始加载，用户ID:', userId, '是否代理:', authStore.user?.is_agent)
    
    if (!userId) {
      console.error('❌ [直推列表] 用户ID不存在')
      return
    }

    // ✅ 检查用户是否是AI代理
    if (!authStore.user?.is_agent) {
      console.log('⚠️ [直推列表] 非AI代理用户，不加载直推列表')
      referralList.value = []
      return
    }

    // ✅ 优化：从缓存加载（如果存在且新鲜，且不是强制刷新）
    const cacheKey = `team_referrals_${userId}`
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached)
        // 缓存5秒有效（更短的缓存时间）
        if (Date.now() - timestamp < 5000) {
          referralList.value = cachedData || []
          console.log('✅ 从缓存加载直推列表 (5秒)')
          return
        }
      }
    }

    // ✅ 从直推关系表查询（referral_relationships）
    // 🔧 临时方案：boss账号直接使用数据库中的真实ID
    let realUserId = userId
    
    if (authStore.user?.username === 'boss') {
      realUserId = 'd6a5223c-0576-4030-b2b6-a5f861172829' // boss的真实ID
      console.log('🔍 [直推列表] 使用boss的真实ID:', realUserId)
    } else {
      // 其他用户通过username查询
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('users')
        .select('id')
        .eq('username', authStore.user?.username)
        .single()
      
      if (currentUserError || !currentUserData) {
        console.error('❌ [直推列表] 查询当前用户失败:', currentUserError)
        referralList.value = []
        return
      }
      realUserId = currentUserData.id
      console.log('🔍 [直推列表] 真实用户ID:', realUserId)
    }
    
    const { data: relationships, error: relError } = await supabase
      .from('referral_relationships')
      .select('referee_id, created_at')
      .eq('referrer_id', realUserId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50)

    console.log('🔍 [直推列表] 数据库查询结果:', {
      relationships: relationships,
      count: relationships?.length || 0,
      error: relError
    })

    if (relError) {
      console.error('❌ [直推列表] 查询直推关系失败:', relError)
      referralList.value = []
      return
    }

    if (!relationships || relationships.length === 0) {
      console.log('📊 [直推列表] 当前无直推下级')
      referralList.value = []
      // 更新缓存
      localStorage.setItem(cacheKey, JSON.stringify({
        data: [],
        timestamp: Date.now()
      }))
      return
    }

    // ✅ 获取所有被推荐人的ID
    const refereeIds = relationships.map(r => r.referee_id)
    console.log('🔍 [直推列表] 被推荐人IDs:', refereeIds)

    // ✅ 查询用户信息（只查询AI代理）
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, username, network_side, created_at, is_agent')
      .in('id', refereeIds)
      .eq('is_agent', true)  // ✅ 只查询AI代理

    console.log('🔍 [直推列表] 用户查询结果:', {
      users: users,
      count: users?.length || 0,
      error: userError
    })

    if (userError) {
      console.error('❌ [直推列表] 查询用户信息失败:', userError)
      referralList.value = []
      return
    }

    // ✅ 合并数据：用户信息 + 推荐关系创建时间
    const userMap = new Map(users?.map(u => [u.id, u]) || [])
    
    referralList.value = relationships
      .filter(rel => userMap.has(rel.referee_id))  // 只保留AI代理
      .map(rel => {
        const user = userMap.get(rel.referee_id)!
        return {
          id: user.id,
          username: user.username,
          network_side: user.network_side,
          created_at: rel.created_at,  // 使用推荐关系建立时间
          is_agent: user.is_agent
        }
      })
    
    console.log(`✅ [直推列表] 加载完成: ${referralList.value.length} 人`, referralList.value)
    
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
const refreshData = async (forceRefresh = true) => {
  loading.value = true
  const loadingToast = toast.info('刷新中...', 0)
  
  try {
    // 如果是强制刷新，先清除缓存
    if (forceRefresh) {
      const userId = authStore.user?.id
      localStorage.removeItem(`team_stats_${userId}`)
      localStorage.removeItem(`team_referrals_${userId}`)
      console.log('✅ 已清除团队缓存')
    }
    
    // 重新加载数据（传递 forceRefresh 参数）
    await Promise.all([
      loadNetworkStats(forceRefresh),
      loadReferralList(forceRefresh)
    ])
    
    toast.removeToast(loadingToast)
    toast.success('✅ 刷新成功！', 2000)
    
    // 检查是否需要复投
    await checkReinvestment()
  } catch (error) {
    console.error('刷新失败:', error)
    toast.removeToast(loadingToast)
    toast.error('刷新失败，请重试')
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
  // 首次加载强制刷新，不使用缓存
  refreshData(true)
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
