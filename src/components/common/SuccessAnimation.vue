<template>
  <div 
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
  >
    <div class="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center animate-scale-up">
      <!-- 成功动画 -->
      <div class="relative w-24 h-24 mx-auto mb-4">
        <div class="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full animate-pulse"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <svg class="w-12 h-12 text-white animate-check" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <!-- 成功信息 -->
      <h3 class="text-gray-800 font-bold text-xl mb-2">{{ title }}</h3>
      <p class="text-gray-600">{{ message }}</p>

      <!-- 详细信息 -->
      <div v-if="details" class="mt-4 bg-gray-50 rounded-xl p-4">
        <div v-for="(value, key) in details" :key="key" class="flex justify-between items-center py-1">
          <span class="text-gray-600 text-sm">{{ key }}:</span>
          <span class="text-gray-800 font-bold text-sm">{{ value }}</span>
        </div>
      </div>

      <!-- 自动关闭倒计时 -->
      <div v-if="autoClose" class="mt-4 text-xs text-gray-500">
        {{ countdown }}秒后自动关闭
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

interface Props {
  show: boolean
  title?: string
  message?: string
  details?: Record<string, string>
  autoClose?: boolean
  autoCloseDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '操作成功！',
  message: '',
  autoClose: true,
  autoCloseDelay: 3000
})

const emit = defineEmits(['close'])

const countdown = ref(Math.ceil(props.autoCloseDelay / 1000))
let timer: NodeJS.Timeout | null = null
let countdownTimer: NodeJS.Timeout | null = null

watch(() => props.show, (newVal) => {
  if (newVal && props.autoClose) {
    countdown.value = Math.ceil(props.autoCloseDelay / 1000)
    
    // 倒计时
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0 && countdownTimer) {
        clearInterval(countdownTimer)
      }
    }, 1000)
    
    // 自动关闭
    timer = setTimeout(() => {
      emit('close')
    }, props.autoCloseDelay)
  }
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scale-up {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes check {
  0% {
    stroke-dasharray: 0 50;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    stroke-dasharray: 50 0;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.animate-scale-up {
  animation: scale-up 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-check {
  animation: check 0.6s ease-out 0.2s both;
}
</style>

