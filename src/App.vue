<template>
  <div id="app" class="h-screen flex flex-col bg-base-100">
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '@/components/layout/BottomNav.vue'
import DevModeBanner from '@/components/common/DevModeBanner.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const route = useRoute()

// 某些页面不显示底部导航（如登录、注册）
const showBottomNav = computed(() => {
  const hiddenRoutes = ['login', 'register']
  return !hiddenRoutes.includes(route.name as string)
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
