<template>
  <!-- 复投提示Modal -->
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div class="bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl transform transition-all" :class="needsReinvestment ? 'border-2 border-red-500' : ''">
      <!-- 顶部图标 -->
      <div class="text-center pt-6 pb-4">
        <div v-if="needsReinvestment" class="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-4xl mb-3 animate-pulse">
          ⚠️
        </div>
        <div v-else class="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-4xl mb-3">
          🔄
        </div>
        <h3 class="text-2xl font-bold text-white mb-2">
          {{ needsReinvestment ? '⚠️ 需要复投' : '复投提示' }}
        </h3>
        <p v-if="isFrozen" class="text-red-400 text-sm font-bold">
          ❄️ 账户已冻结，请立即复投解冻
        </p>
      </div>

      <!-- 内容区域 -->
      <div class="px-6 pb-6">
        <!-- 复投状态 -->
        <div class="bg-gray-900/50 rounded-xl p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-gray-400 text-sm">总收益</span>
            <span class="text-white font-bold text-lg">{{ totalEarnings.toFixed(2) }} U</span>
          </div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-gray-400 text-sm">已复投次数</span>
            <span class="text-white font-bold">{{ reinvestmentCount }}次</span>
          </div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-gray-400 text-sm">应复投次数</span>
            <span :class="needsReinvestment ? 'text-red-400' : 'text-green-400'" class="font-bold">
              {{ expectedReinvestments }}次
            </span>
          </div>
          <div class="h-px bg-gray-700 my-3"></div>
          <div class="flex items-center justify-between">
            <span class="text-gray-400 text-sm">下次复投门槛</span>
            <span class="text-blue-400 font-bold">{{ nextThreshold }} U</span>
          </div>
        </div>

        <!-- 复投金额 -->
        <div class="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 mb-4 border border-yellow-500/30">
          <div class="text-center">
            <div class="text-gray-400 text-sm mb-1">复投金额</div>
            <div class="text-white text-3xl font-bold">30 U</div>
          </div>
        </div>

        <!-- 自动复投开关 -->
        <div class="bg-gray-900/50 rounded-xl p-4 mb-4">
          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <div class="text-white font-medium">自动复投</div>
              <div class="text-xs text-gray-400 mt-1">达到门槛自动扣款复投</div>
            </div>
            <input 
              type="checkbox" 
              v-model="autoReinvest"
              @change="handleAutoReinvestChange"
              class="toggle toggle-success"
            />
          </label>
        </div>

        <!-- 规则说明 -->
        <div class="bg-blue-500/10 rounded-xl p-3 mb-4 border border-blue-500/30">
          <div class="text-xs text-blue-300">
            <div class="font-bold mb-2">💡 复投规则：</div>
            <ul class="space-y-1">
              <li>• 每结算<span class="font-bold text-white">300U</span>收益需复投<span class="font-bold text-white">30U</span></li>
              <li>• 不复投账户将<span class="font-bold text-red-400">冻结</span>，无法使用任何功能</li>
              <li>• 开启自动复投可自动完成，无需手动操作</li>
            </ul>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-3">
          <button 
            v-if="!needsReinvestment"
            @click="close"
            class="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
          >
            稍后再说
          </button>
          <button 
            @click="handleReinvest"
            :disabled="processing"
            :class="[
              'flex-1 py-3 rounded-xl font-bold transition-all',
              needsReinvestment 
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white',
              processing && 'opacity-50 cursor-not-allowed'
            ]"
          >
            <span v-if="processing" class="flex items-center justify-center gap-2">
              <div class="loading loading-spinner loading-sm"></div>
              处理中...
            </span>
            <span v-else>
              {{ needsReinvestment ? '立即复投解冻' : '立即复投' }}
            </span>
          </button>
        </div>

        <div v-if="isFrozen" class="text-center text-xs text-red-400 mt-3">
          ⚠️ 账户已冻结，必须复投才能继续使用
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
// import { NetworkService } from '@/services/network.service'  // ← 已删除
import { supabase, isDevMode } from '@/lib/supabase'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const authStore = useAuthStore()
const toast = useToast()

// 状态
const processing = ref(false)
const autoReinvest = ref(false)

// 复投状态
const totalEarnings = ref(0)
const reinvestmentCount = ref(0)
const expectedReinvestments = ref(0)
const isFrozen = ref(false)
const needsReinvestment = ref(false)
const nextThreshold = ref(300)

// 加载复投状态（临时禁用 - NetworkService已删除）
const loadReinvestmentStatus = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // TODO: 需要实现新的复投状态获取逻辑
    // const status = await NetworkService.getReinvestmentStatus(userId)
    
    // 临时使用authStore中的数据
    const user = authStore.user
    if (user) {
      totalEarnings.value = user.total_earnings || 0
      expectedReinvestments.value = Math.floor(totalEarnings.value / 300)
      reinvestmentCount.value = 0  // TODO: 需要从数据库获取
      needsReinvestment.value = reinvestmentCount.value < expectedReinvestments.value
      isFrozen.value = false  // TODO: 需要从数据库获取
      nextThreshold.value = (expectedReinvestments.value + 1) * 300
    }

    // 加载自动复投设置
    if (!isDevMode) {
      const { data: user } = await supabase
        .from('users')
        .select('auto_reinvest')
        .eq('id', userId)
        .single()

      if (user) {
        autoReinvest.value = user.auto_reinvest || false
      }
    }
  } catch (error: any) {
    console.error('加载复投状态失败:', error)
    toast.error('加载失败')
  }
}

// 处理自动复投开关
const handleAutoReinvestChange = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    if (isDevMode) {
      toast.success(`自动复投已${autoReinvest.value ? '开启' : '关闭'}`)
      return
    }

    await supabase
      .from('users')
      .update({ auto_reinvest: autoReinvest.value })
      .eq('id', userId)

    toast.success(`自动复投已${autoReinvest.value ? '开启' : '关闭'}`)
  } catch (error) {
    toast.error('设置失败')
  }
}

// 处理复投（临时禁用 - NetworkService已删除）
const handleReinvest = async () => {
  processing.value = true
  try {
    const userId = authStore.user?.id
    if (!userId) {
      toast.error('请先登录')
      return
    }

    // TODO: 需要实现新的复投处理逻辑
    // const result = await NetworkService.processReinvestment(userId, false)
    
    // 临时提示
    toast.info('复投功能正在重构中，敬请期待')
    emit('close')
    
    // if (result.success) {
    //   toast.success(result.message)
    //   emit('success')
    //   close()
    // } else {
    //   toast.error(result.message)
    // }
  } catch (error: any) {
    toast.error(error.message || '复投失败')
  } finally {
    processing.value = false
  }
}

// 关闭弹窗
const close = () => {
  if (isFrozen.value || needsReinvestment.value) {
    toast.warning('账户已冻结，必须复投才能继续使用')
    return
  }
  emit('close')
}

onMounted(() => {
  if (props.show) {
    loadReinvestmentStatus()
  }
})

// 监听show变化
watch(() => props.show, (newVal) => {
  if (newVal) {
    loadReinvestmentStatus()
  }
})
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
