<template>
  <div v-if="isDev" class="alert alert-warning shadow-lg fixed top-0 left-0 right-0 z-50 rounded-none">
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <h3 class="font-bold">开发模式 (Development Mode)</h3>
          <div class="text-xs">
            当前使用模拟数据 | 未连接真实数据库 | 部分功能仅为界面展示
          </div>
        </div>
      </div>
      <button @click="dismissBanner" class="btn btn-sm btn-ghost">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { isDevMode } from '@/lib/supabase'

const isDev = ref(isDevMode)
const dismissed = ref(false)

const dismissBanner = () => {
  dismissed.value = true
  isDev.value = false
}
</script>






