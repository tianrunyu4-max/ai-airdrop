<template>
  <div id="app" class="h-screen flex flex-col bg-base-100">
    <!-- 初始化加载状态 -->
    <div v-if="isInitializing" class="h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div class="text-center">
        <div class="rocket-icon mb-6 animate-bounce">
          <svg class="w-24 h-24 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">AI 空投计划</h1>
        <p class="text-white/80">持续学习 持续创新</p>
        <div class="mt-6">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    </div>

    <!-- 应用内容 -->
    <template v-else>
      <!-- 开发模式提示 -->
      <DevModeBanner />
      
      <!-- Toast通知容器 -->
      <ToastContainer />
      
      <!-- 主内容区域 -->
      <main class="flex-1 overflow-y-auto pb-16">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <!-- 底部导航栏 -->
      <BottomNav v-if="showBottomNav" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BottomNav from '@/components/layout/BottomNav.vue'
import DevModeBanner from '@/components/common/DevModeBanner.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isInitializing = ref(true)

// 某些页面不显示底部导航（如登录、注册）
const showBottomNav = computed(() => {
  const hiddenRoutes = ['login', 'register']
  return !hiddenRoutes.includes(route.name as string)
})

// 初始化认证状态
onMounted(async () => {
  try {
    // 初始化认证状态
    await authStore.initialize()
    
    // 初始化完成，路由守卫会处理所有的跳转逻辑
    isInitializing.value = false
  } catch (error) {
    console.error('初始化失败:', error)
    isInitializing.value = false
  }
})
</script>

<style>
/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 防止拉动刷新 */
body {
  overscroll-behavior-y: contain;
}

/* 安全区域适配 */
#app {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
