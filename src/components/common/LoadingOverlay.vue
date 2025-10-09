<template>
  <div 
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click="onBackdropClick"
  >
    <div class="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center">
      <!-- 加载动画 -->
      <div class="relative w-20 h-20 mx-auto mb-4">
        <div class="absolute inset-0 border-4 border-yellow-200 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-yellow-500 rounded-full border-t-transparent animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-2xl">{{ emoji }}</span>
        </div>
      </div>

      <!-- 加载文本 -->
      <h3 class="text-gray-800 font-bold text-lg mb-2">{{ title }}</h3>
      <p class="text-gray-600 text-sm">{{ message }}</p>

      <!-- 进度条（可选） -->
      <div v-if="showProgress" class="mt-4">
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div class="text-xs text-gray-500 mt-2">{{ progress }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface Props {
  show: boolean
  title?: string
  message?: string
  emoji?: string
  showProgress?: boolean
  progress?: number
  allowClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '处理中...',
  message: '请稍候',
  emoji: '⏳',
  showProgress: false,
  progress: 0,
  allowClose: false
})

const emit = defineEmits(['close'])

const onBackdropClick = () => {
  if (props.allowClose) {
    emit('close')
  }
}
</script>

