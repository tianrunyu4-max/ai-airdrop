<template>
  <div class="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-yellow-50 pb-20">
    <!-- 顶部标题 -->
    <div class="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 px-6 py-8">
      <h1 class="text-3xl font-bold text-white text-center mb-2">💎 双轨制二元系统</h1>
      <p class="text-center text-yellow-100 text-sm">团队内部排线 · 2:1/1:2对碰 · 定时结算</p>
    </div>

    <!-- 未加入提示 -->
    <div v-if="!binaryInfo" class="px-4 -mt-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 border-2 border-yellow-200 text-center">
        <div class="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        
        <h2 class="text-2xl font-bold text-gray-800 mb-4">立即加入双轨制系统</h2>
        <p class="text-gray-600 mb-6">团队内部排线 + 2:1/1:2对碰 + 定时结算</p>
        
        <!-- 加入费用 -->
        <div class="bg-yellow-50 rounded-xl p-6 mb-6 border-2 border-yellow-300">
          <div class="text-gray-600 text-sm mb-2">加入费用</div>
          <div class="text-yellow-600 font-bold text-4xl">30</div>
        </div>

        <!-- 核心优势 -->
        <div class="grid grid-cols-2 gap-3 mb-6 text-left">
          <div class="bg-gradient-to-br from-yellow-50 to-white rounded-xl p-4 border border-yellow-200">
            <div class="text-yellow-600 font-bold mb-1">🤖 团队排线</div>
            <div class="text-xs text-gray-600">直推下面弱边</div>
          </div>
          <div class="bg-gradient-to-br from-yellow-50 to-white rounded-xl p-4 border border-yellow-200">
            <div class="text-yellow-600 font-bold mb-1">⏰ 定时结算</div>
            <div class="text-xs text-gray-600">每天凌晨12点</div>
          </div>
          <div class="bg-gradient-to-br from-yellow-50 to-white rounded-xl p-4 border border-yellow-200">
            <div class="text-yellow-600 font-bold mb-1">💰 100%到账</div>
            <div class="text-xs text-gray-600">每单6U</div>
          </div>
          <div class="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-200">
            <div class="text-purple-600 font-bold mb-1">🎁 见单奖</div>
            <div class="text-xs text-gray-600">1U/代（5代重复拿）</div>
          </div>
        </div>

        <button 
          @click="joinBinary"
          class="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white py-4 rounded-xl font-bold text-lg hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 transition-all shadow-xl"
        >
          🚀 立即加入（100）
        </button>
      </div>
    </div>

    <!-- 已加入：显示详细信息 -->
    <div v-else>
      <!-- 我的资产卡片 -->
      <div class="px-4 -mt-4">
        <div class="bg-white rounded-2xl shadow-2xl p-6 border-2 border-yellow-200">
          <div class="text-center mb-4">
            <div class="text-gray-500 text-sm mb-1">累计收益</div>
            <div class="text-4xl font-bold text-yellow-600">{{ binaryInfo.total_earnings?.toFixed(2) || '0.00' }}</div>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
              <div class="text-gray-600 text-xs mb-1">对碰奖</div>
              <div class="text-yellow-700 font-bold">{{ binaryInfo.total_pairing_bonus?.toFixed(2) || '0.00' }}U</div>
            </div>
            <div class="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
              <div class="text-gray-600 text-xs mb-1">对碰次数</div>
              <div class="text-yellow-700 font-bold">{{ binaryInfo.total_pairings || '0' }}次</div>
            </div>
          </div>

          <!-- 复投提示 -->
          <div v-if="!binaryInfo.is_active" class="bg-red-50 rounded-xl p-4 mb-4 border-2 border-red-300">
            <div class="text-center text-red-600 font-bold mb-2">⚠️ 需要复投</div>
            <div class="text-sm text-gray-700 mb-3">累计收益已达240（8倍），请复投100继续获得奖励</div>
            <button 
              @click="handleReinvest"
              class="w-full bg-gradient-to-r from-red-400 to-red-500 text-white py-3 rounded-lg font-bold hover:from-red-500 hover:to-red-600 transition-all"
            >
              立即复投（100）
            </button>
          </div>

          <!-- 功能按钮 -->
          <div class="grid grid-cols-2 gap-2">
            <button 
              @click="refreshData"
              class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all text-sm shadow-md"
            >
              刷新数据
            </button>
            <button 
              @click="showInfoModal = true"
              class="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm border-2 border-gray-200"
            >
              系统说明
            </button>
          </div>
        </div>
      </div>

      <!-- 双区业绩 -->
      <div class="px-4 mt-6">
        <h3 class="text-gray-800 text-xl font-bold mb-4 flex items-center">
          <span class="bg-yellow-400 w-1 h-6 rounded-full mr-3"></span>
          双区业绩
        </h3>

        <div class="grid grid-cols-2 gap-4">
          <!-- A区 -->
          <div class="bg-white rounded-xl shadow-lg p-5 border-2 border-blue-300">
            <div class="flex items-center justify-between mb-3">
              <div class="text-blue-600 font-bold text-lg">A区</div>
              <div class="bg-blue-100 px-3 py-1 rounded-full text-blue-700 text-xs font-bold">
                {{ binaryInfo.position_side === 'A' ? '当前区' : '' }}
              </div>
            </div>
            
            <div class="mb-3">
              <div class="text-gray-600 text-xs mb-1">总人数</div>
              <div class="text-blue-600 font-bold text-2xl">{{ binaryInfo.a_side_count || 0 }}</div>
            </div>
            
            <div class="bg-blue-50 rounded-lg p-3">
              <div class="text-gray-600 text-xs mb-1">待配对</div>
              <div class="text-blue-700 font-bold text-xl">{{ binaryInfo.a_side_pending || 0 }}</div>
            </div>
          </div>

          <!-- B区 -->
          <div class="bg-white rounded-xl shadow-lg p-5 border-2 border-green-300">
            <div class="flex items-center justify-between mb-3">
              <div class="text-green-600 font-bold text-lg">B区</div>
              <div class="bg-green-100 px-3 py-1 rounded-full text-green-700 text-xs font-bold">
                {{ binaryInfo.position_side === 'B' ? '当前区' : '' }}
              </div>
            </div>
            
            <div class="mb-3">
              <div class="text-gray-600 text-xs mb-1">总人数</div>
              <div class="text-green-600 font-bold text-2xl">{{ binaryInfo.b_side_count || 0 }}</div>
            </div>
            
            <div class="bg-green-50 rounded-lg p-3">
              <div class="text-gray-600 text-xs mb-1">待配对</div>
              <div class="text-green-700 font-bold text-xl">{{ binaryInfo.b_side_pending || 0 }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 待配对提示 -->
      <div class="px-4 mt-6">
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-300">
          <div class="flex items-center justify-between mb-3">
            <div class="text-purple-700 font-bold">可配对数量</div>
            <div class="text-purple-600 font-bold text-2xl">{{ binaryInfo.ready_pairs || 0 }} 组</div>
          </div>
          <div class="flex items-center justify-between text-sm">
            <div class="text-gray-600">预估对碰奖</div>
            <div class="text-yellow-600 font-bold">{{ binaryInfo.estimated_pairing_bonus?.toFixed(2) || '0.00' }}</div>
          </div>
        </div>
      </div>

      <!-- 直推数量 -->
      <div class="px-4 mt-6">
        <h3 class="text-gray-800 text-xl font-bold mb-4 flex items-center">
          <span class="bg-yellow-400 w-1 h-6 rounded-full mr-3"></span>
          直推团队
        </h3>

        <div class="bg-white rounded-xl p-6 border-2 border-yellow-200">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-bold text-gray-600 text-lg">👥 直推人数</div>
              <div class="text-xs text-gray-500 mt-1">解锁条件：≥2人</div>
            </div>
            <div class="text-4xl font-bold text-yellow-600">
              {{ binaryInfo.direct_referrals || 0 }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 系统说明模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showInfoModal }">
      <div class="modal-box bg-white max-w-2xl">
        <h3 class="font-bold text-lg text-gray-800 mb-4">💎 双轨制系统说明（V5.0简化版）</h3>
        
        <div class="space-y-3 text-sm text-gray-700">
          <div class="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div class="font-bold text-yellow-700 mb-1">🤖 团队内部排线</div>
            <div>新用户自动滑落到推荐人直推的弱边，团队内部发展</div>
          </div>

          <div class="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div class="font-bold text-blue-700 mb-1">⚡ 2:1/1:2对碰奖（V5.1）</div>
            <div>灵活配对：2:1或1:2，每单6U（100%到账），每天凌晨12点统一结算</div>
          </div>

          <div class="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div class="font-bold text-purple-700 mb-1">🎁 见单奖（重复拿！）</div>
            <div>下线对碰，上级5代各得1U（直推≥2人解锁），每次对碰都拿，重复计算</div>
          </div>

          <div class="bg-green-50 rounded-lg p-3 border border-green-200">
            <div class="font-bold text-green-700 mb-1">🔄 复投机制</div>
            <div>总收益达240（8倍）提示复投100，复购单自动补弱区</div>
          </div>
          
          <div class="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <div class="font-bold text-orange-700 mb-1">💎 预留资金</div>
            <div>每单对碰15%（1.5U）预留，暂不分配，留作将来使用</div>
          </div>

          <div class="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div class="font-bold text-purple-700 mb-1">⏰ 定时结算</div>
            <div>每天凌晨12点统一对碰结算，减少系统负载，更加公平</div>
          </div>
        </div>
        
        <div class="modal-action">
          <button class="btn bg-yellow-500 text-white hover:bg-yellow-600 border-none" @click="showInfoModal = false">知道了</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black bg-opacity-30" @click="showInfoModal = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- 说明按钮（浮动） -->
    <button 
      @click="showInfoModal = true"
      class="fixed bottom-24 right-4 bg-yellow-500 text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center hover:bg-yellow-600 transition-all z-10"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { BinaryService } from '@/services/BinaryService'

const authStore = useAuthStore()
const toast = useToast()

const binaryInfo = ref<any>(null)
const showInfoModal = ref(false)

// 加入双轨制
const joinBinary = async () => {
  if (!confirm('确认加入双轨制系统吗？\n\n费用：100\n系统将自动为您分配最佳位置')) {
    return
  }

  const loadingToast = toast.info('正在加入...', 0)

  try {
    const result = await BinaryService.joinBinary(authStore.user!.id)
    
    toast.removeToast(loadingToast)
    
    if (result.success) {
      toast.success(result.message || '加入成功！', 3000)
      await loadBinaryInfo()
    } else {
      toast.error(result.error || '加入失败')
    }
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '加入失败')
  }
}

// 复投
const handleReinvest = async () => {
  if (!confirm('确认复投吗？\n\n费用：100\n复投后继续累积对碰奖和见单奖')) {
    return
  }

  const loadingToast = toast.info('正在复投...', 0)

  try {
    const result = await BinaryService.reinvest(authStore.user!.id)
    
    toast.removeToast(loadingToast)
    
    if (result.success) {
      toast.success(result.message || '复投成功！', 3000)
      await loadBinaryInfo()
    } else {
      toast.error(result.error || '复投失败')
    }
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '复投失败')
  }
}

// 加载二元信息
const loadBinaryInfo = async () => {
  if (!authStore.user) return

  try {
    const result = await BinaryService.getBinaryInfo(authStore.user.id)
    if (result.success) {
      binaryInfo.value = result.data
    }
  } catch (error) {
    console.error('加载二元信息失败:', error)
  }
}

// 刷新数据
const refreshData = async () => {
  const loadingToast = toast.info('刷新中...', 0)
  await loadBinaryInfo()
  toast.removeToast(loadingToast)
  toast.success('已刷新')
}

onMounted(() => {
  loadBinaryInfo()
})
</script>

<style scoped>
/* 黄白主题样式 */
.modal-box {
  max-height: 80vh;
  overflow-y: auto;
}
</style>

