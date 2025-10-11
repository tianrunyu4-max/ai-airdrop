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

      <!-- 总收益统计 -->
      <div class="bg-white/90 backdrop-blur-lg rounded-2xl p-4 mb-4 shadow-xl">
        <div class="text-gray-600 text-sm mb-1">总收益</div>
        <div class="text-3xl font-bold text-yellow-600 mb-4">{{ totalEarnings.toFixed(2) }} U</div>
        
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center">
            <div class="text-xl font-bold text-yellow-600">{{ pairingBonus.toFixed(2) }}</div>
            <div class="text-xs text-gray-600">对碰奖</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold text-green-600">{{ levelBonus.toFixed(2) }}</div>
            <div class="text-xs text-gray-600">平级奖</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold text-blue-600">{{ dividend.toFixed(2) }}</div>
            <div class="text-xs text-gray-600">分红</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab切换 -->
    <div class="sticky top-0 z-10 bg-white px-4 py-3 border-b border-yellow-200">
      <div class="flex gap-2">
        <button 
          v-for="tab in tabs" 
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="[
            'flex-1 py-2 px-4 rounded-xl font-medium transition-all',
            activeTab === tab.value 
              ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg' 
              : 'bg-yellow-50 text-gray-600 hover:bg-yellow-100'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="px-4 mt-4">
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-12">
        <div class="loading loading-spinner loading-lg text-primary"></div>
        <p class="text-gray-400 mt-4">加载中...</p>
      </div>

      <!-- 对碰奖记录 -->
      <div v-else-if="activeTab === 'pairing'" class="space-y-3">
        <div v-if="pairingRecords.length === 0" class="text-center py-12">
          <div class="text-gray-500 mb-2">📊</div>
          <p class="text-gray-400">暂无对碰奖记录</p>
        </div>
        
        <div 
          v-for="record in pairingRecords" 
          :key="record.id"
          class="bg-white rounded-xl p-4 hover:bg-yellow-50 transition-all border-2 border-yellow-200 shadow-lg"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span class="text-white font-bold text-lg">💰</span>
              </div>
              <div>
                <div class="text-gray-800 font-bold">对碰奖</div>
                <div class="text-xs text-gray-600">{{ formatDate(record.created_at) }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xl font-bold text-yellow-400">+{{ record.bonus_amount.toFixed(2) }} U</div>
              <div class="text-xs text-gray-400">{{ record.pairs_count }}组</div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-gray-900/50 rounded-lg p-2">
              <div class="text-gray-400 mb-1">A区业绩</div>
              <div class="text-white">
                <span class="text-blue-400 font-bold">{{ record.a_side_before }}</span>
                <span class="text-gray-500 mx-1">→</span>
                <span class="font-bold">{{ record.a_side_after }}</span>
              </div>
            </div>
            <div class="bg-gray-900/50 rounded-lg p-2">
              <div class="text-gray-400 mb-1">B区业绩</div>
              <div class="text-white">
                <span class="text-green-400 font-bold">{{ record.b_side_before }}</span>
                <span class="text-gray-500 mx-1">→</span>
                <span class="font-bold">{{ record.b_side_after }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 平级奖记录 -->
      <div v-else-if="activeTab === 'level'" class="space-y-3">
        <div v-if="levelRecords.length === 0" class="text-center py-12">
          <div class="text-gray-500 mb-2">🎁</div>
          <p class="text-gray-400">暂无平级奖记录</p>
        </div>
        
        <div 
          v-for="record in levelRecords" 
          :key="record.id"
          class="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-all"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                <span class="text-white font-bold text-lg">🎁</span>
              </div>
              <div>
                <div class="text-white font-bold">平级奖 - 第{{ record.level }}代</div>
                <div class="text-xs text-gray-400">{{ formatDate(record.created_at) }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xl font-bold text-green-400">+{{ record.bonus_amount.toFixed(2) }} U</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分红记录 -->
      <div v-else-if="activeTab === 'dividend'" class="space-y-3">
        <div v-if="dividendRecords.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">💎</div>
          <p class="text-gray-600 font-medium mb-2">暂无分红记录</p>
          <p class="text-xs text-gray-500">直推≥10人可参与分红</p>
          <p class="text-xs text-gray-400 mt-1">每周一、三、五、日结算</p>
        </div>
        
        <div 
          v-for="record in dividendRecords" 
          :key="record.id"
          class="bg-white rounded-xl p-4 hover:bg-yellow-50 transition-all border-2 border-yellow-200 shadow-lg"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <span class="text-2xl">💎</span>
              </div>
              <div>
                <div class="text-gray-800 font-bold text-lg">排线分红</div>
                <div class="text-xs text-gray-500">{{ formatDate(record.created_at) }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-blue-600">+{{ record.amount.toFixed(2) }} U</div>
              <div class="text-xs text-gray-500">已到账</div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
              <div class="text-gray-600 text-xs mb-1">分红池总额</div>
              <div class="text-blue-600 font-bold text-lg">{{ record.pool_balance?.toFixed(2) || '0.00' }} U</div>
            </div>
            <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
              <div class="text-gray-600 text-xs mb-1">参与人数</div>
              <div class="text-yellow-600 font-bold text-lg">{{ record.eligible_count || 0 }}人</div>
            </div>
          </div>
          
          <div class="mt-3 bg-yellow-50 rounded-lg p-2 text-xs">
            <span class="text-gray-600">💡 每人分配: </span>
            <span class="text-yellow-600 font-bold">
              {{ (record.amount).toFixed(2) }} U
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部说明 -->
    <div class="px-4 mt-6 pb-4">
      <div class="bg-white rounded-xl p-4 text-xs border-2 border-yellow-200 shadow-lg">
        <div class="font-bold text-gray-800 mb-3 text-sm">💡 收益说明</div>
        <ul class="space-y-2 text-gray-600">
          <li class="flex items-start gap-2">
            <span class="text-yellow-500">💰</span>
            <span><strong class="text-gray-800">对碰奖：</strong>A/B两区配对，每组10U（会员收益85%）</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-green-500">🎁</span>
            <span><strong class="text-gray-800">平级奖：</strong>下线触发对碰奖，向上8代直推链各得2U</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">💎</span>
            <span><strong class="text-gray-800">分红：</strong>直推≥10人，每周一、三、五、日结算，分红池15%平均分配</span>
          </li>
        </ul>
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
const activeTab = ref<'pairing' | 'level' | 'dividend'>('pairing')

// 收益统计
const totalEarnings = ref(0)
const pairingBonus = ref(0)
const levelBonus = ref(0)
const dividend = ref(0)

// 记录列表
const pairingRecords = ref<any[]>([])
const levelRecords = ref<any[]>([])
const dividendRecords = ref<any[]>([])

// Tab配置
const tabs = [
  { label: '对碰奖', value: 'pairing' as const },
  { label: '平级奖', value: 'level' as const },
  { label: '分红', value: 'dividend' as const }
]

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

// 加载收益统计
const loadEarningsStats = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    if (isDevMode) {
      // 开发模式：模拟数据
      totalEarnings.value = 1256.50
      pairingBonus.value = 842.00
      levelBonus.value = 324.50
      dividend.value = 90.00
      return
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('total_earnings, total_pairing_bonus, total_level_bonus, total_dividend')
      .eq('id', userId)
      .single()

    if (error) throw error

    totalEarnings.value = user.total_earnings || 0
    pairingBonus.value = user.total_pairing_bonus || 0
    levelBonus.value = user.total_level_bonus || 0
    dividend.value = user.total_dividend || 0
  } catch (error: any) {
    console.error('加载收益统计失败:', error)
    toast.error('加载收益统计失败')
  }
}

// 加载对碰奖记录
const loadPairingRecords = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    if (isDevMode) {
      // 开发模式：模拟数据
      pairingRecords.value = [
        {
          id: '1',
          bonus_amount: 595,
          pairs_count: 100,
          a_side_before: 500,
          b_side_before: 100,
          a_side_after: 400,
          b_side_after: 0,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          bonus_amount: 119,
          pairs_count: 20,
          a_side_before: 420,
          b_side_before: 20,
          a_side_after: 400,
          b_side_after: 0,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          bonus_amount: 59.5,
          pairs_count: 10,
          a_side_before: 410,
          b_side_before: 10,
          a_side_after: 400,
          b_side_after: 0,
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]
      return
    }

    const { data, error } = await supabase
      .from('pairing_bonuses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    pairingRecords.value = data || []
  } catch (error: any) {
    console.error('加载对碰奖记录失败:', error)
    toast.error('加载对碰奖记录失败')
  }
}

// 加载平级奖记录
const loadLevelRecords = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    if (isDevMode) {
      // 开发模式：模拟数据
      levelRecords.value = [
        {
          id: '1',
          level: 1,
          bonus_amount: 2,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          level: 2,
          bonus_amount: 2,
          created_at: new Date(Date.now() - 43200000).toISOString()
        },
        {
          id: '3',
          level: 1,
          bonus_amount: 2,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '4',
          level: 3,
          bonus_amount: 2,
          created_at: new Date(Date.now() - 129600000).toISOString()
        }
      ]
      return
    }

    const { data, error } = await supabase
      .from('level_bonuses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    levelRecords.value = data || []
  } catch (error: any) {
    console.error('加载平级奖记录失败:', error)
    toast.error('加载平级奖记录失败')
  }
}

// 加载分红记录
const loadDividendRecords = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    if (isDevMode) {
      // 开发模式：模拟数据
      dividendRecords.value = [
        {
          id: '1',
          amount: 45,
          pool_balance: 900,
          eligible_count: 20,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          amount: 45,
          pool_balance: 1350,
          eligible_count: 30,
          created_at: new Date(Date.now() - 259200000).toISOString()
        }
      ]
      return
    }

    const { data, error } = await supabase
      .from('dividend_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    dividendRecords.value = data || []
  } catch (error: any) {
    console.error('加载分红记录失败:', error)
    toast.error('加载分红记录失败')
  }
}

// 加载所有数据
const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadEarningsStats(),
      loadPairingRecords(),
      loadLevelRecords(),
      loadDividendRecords()
    ])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAllData()
})
</script>

<style scoped>
.bg-gray-750 {
  background-color: #2d3748;
}
</style>

