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
      
      <!-- 🆕 升级AI代理横幅（非代理用户可见） -->
      <div v-if="authStore.user && !authStore.user.is_agent && !isUpgradeBannerClosed && showBottomNav" 
           class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 flex items-center justify-between shadow-lg animate-slide-down">
        <div class="flex items-center gap-3 flex-1">
          <span class="text-2xl">👑</span>
          <div>
            <div class="font-bold text-sm">升级AI代理解锁全部功能！</div>
            <div class="text-xs opacity-90">对碰奖励 · 见单奖励 · 积分互转 · AI学习卡</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="goToUpgrade" 
                  class="btn btn-sm bg-white text-purple-600 hover:bg-gray-100 border-none shadow-md hover:scale-105 transition-all">
            仅需30U 立即升级 →
          </button>
          <button @click="closeBanner" 
                  class="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20">
            ✕
          </button>
        </div>
      </div>
      
      <!-- 主内容区域 -->
      <main class="flex-1 overflow-y-auto pb-16" :class="{ 'pt-16': authStore.user && !authStore.user.is_agent && !isUpgradeBannerClosed && showBottomNav }">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <!-- ✅ 使用 keep-alive 缓存底部导航的5个主要页面，加速切换 -->
            <keep-alive :max="5">
              <component 
                :is="Component" 
                :key="shouldCache(route) ? route.name : route.path" 
                v-if="Component"
              />
            </keep-alive>
          </transition>
        </router-view>
      </main>

      <!-- 底部导航栏 -->
      <BottomNav v-if="showBottomNav" />
      
      <!-- 🆕 悬浮升级按钮（非代理用户可见） -->
      <button v-if="authStore.user && !authStore.user.is_agent && showBottomNav"
              @click="goToUpgrade"
              class="fixed bottom-24 right-6 btn btn-circle btn-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl hover:scale-110 transition-all z-40 border-none animate-bounce-slow">
        <span class="text-3xl">👑</span>
      </button>
      
      <!-- 🆕 悬浮按钮提示气泡 -->
      <div v-if="authStore.user && !authStore.user.is_agent && showBottomNav && showUpgradeTip"
           class="fixed bottom-40 right-2 bg-white rounded-xl shadow-2xl p-3 z-40 max-w-[140px] animate-fade-in border-2 border-purple-200">
        <button @click="showUpgradeTip = false" class="absolute -top-2 -right-2 btn btn-circle btn-xs bg-gray-200 border-none text-gray-600">
          ✕
        </button>
        <div class="text-xs font-bold text-purple-600 mb-1">🚀 升级AI代理</div>
        <div class="text-xs text-gray-600">解锁全部功能仅需30U</div>
        <div class="flex gap-1 mt-2">
          <span class="badge badge-xs badge-warning">对碰奖</span>
          <span class="badge badge-xs badge-success">见单奖</span>
        </div>
      </div>
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

// 🆕 升级横幅关闭状态（localStorage持久化）
const isUpgradeBannerClosed = ref(false)
const showUpgradeTip = ref(true)

// 某些页面不显示底部导航（如登录、注册）
const showBottomNav = computed(() => {
  const hiddenRoutes = ['login', 'register']
  return !hiddenRoutes.includes(route.name as string)
})

// ✅ 判断路由是否需要缓存（底部导航的5个主要页面）
const shouldCache = (route: any) => {
  const cachedRoutes = ['chat', 'points', 'tools', 'team', 'profile']
  return cachedRoutes.includes(route.name as string)
}

// 🆕 关闭升级横幅
const closeBanner = () => {
  isUpgradeBannerClosed.value = true
  // 记住用户关闭状态（24小时后重新显示）
  const expireTime = Date.now() + 24 * 60 * 60 * 1000
  localStorage.setItem('upgrade_banner_closed', expireTime.toString())
}

// 🆕 跳转到升级页面
const goToUpgrade = () => {
  router.push('/profile')
  // 滚动到升级卡片位置（延迟执行）
  setTimeout(() => {
    const upgradeCard = document.querySelector('.upgrade-agent-card')
    if (upgradeCard) {
      upgradeCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 300)
}

// ✅ 预加载底部导航页面（加速首次切换）
const preloadBottomNavPages = () => {
  // 在空闲时预加载其他页面
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      Promise.all([
        import('@/views/points/PointsView.vue'),
        import('@/views/tools/ToolsView.vue'),
        import('@/views/team/TeamView.vue'),
        import('@/views/profile/ProfileView.vue')
      ])
    })
  } else {
    // 降级方案：延迟2秒后加载
    setTimeout(() => {
      Promise.all([
        import('@/views/points/PointsView.vue'),
        import('@/views/tools/ToolsView.vue'),
        import('@/views/team/TeamView.vue'),
        import('@/views/profile/ProfileView.vue')
      ])
    }, 2000)
  }
}

// 初始化认证状态
onMounted(async () => {
  try {
    // 初始化认证状态
    await authStore.initialize()
    
    // ✅ 预加载底部导航页面
    preloadBottomNavPages()
    
    // 🆕 检查横幅关闭状态
    const closedTime = localStorage.getItem('upgrade_banner_closed')
    if (closedTime) {
      const expireTime = parseInt(closedTime)
      if (Date.now() < expireTime) {
        isUpgradeBannerClosed.value = true
      } else {
        localStorage.removeItem('upgrade_banner_closed')
      }
    }
    
    // 🆕 5秒后显示提示气泡
    setTimeout(() => {
      showUpgradeTip.value = true
    }, 5000)
    
    // 🆕 30秒后自动隐藏提示气泡
    setTimeout(() => {
      showUpgradeTip.value = false
    }, 35000)
    
    // 初始化完成，路由守卫会处理所有的跳转逻辑
    isInitializing.value = false
  } catch (error) {
    console.error('初始化失败:', error)
    isInitializing.value = false
  }
})
</script>

<style>
/* ⚡ 页面切换动画 - 极速切换（0.1s） */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 🆕 横幅下滑动画 */
@keyframes slide-down {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-down {
  animation: slide-down 0.5s ease-out;
}

/* 🆕 慢速弹跳动画 */
@keyframes bounce-slow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 2s infinite;
}

/* 🆕 淡入动画 */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
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
