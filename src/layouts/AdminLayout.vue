<template>
  <div class="min-h-screen bg-base-200 flex">
    <!-- 侧边栏 -->
    <aside class="w-64 bg-base-100 shadow-lg hidden lg:block">
      <div class="p-6">
        <h1 class="text-2xl font-bold text-gradient">管理后台</h1>
        <p class="text-sm text-base-content/60 mt-1">AI智能科技学习集成</p>
      </div>
      
      <!-- 导航菜单 -->
      <nav class="px-4 pb-4">
        <ul class="menu">
          <li v-for="item in menuItems" :key="item.path">
            <router-link 
              :to="item.path"
              :class="{ 'active': isActive(item.path) }"
              class="flex items-center gap-3"
            >
              <component :is="item.icon" class="w-5 h-5" />
              <span>{{ item.label }}</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- 退出按钮 -->
      <div class="absolute bottom-4 left-4 right-4">
        <button class="btn btn-outline btn-error w-full" @click="handleLogout">
          <ArrowLeftOnRectangleIcon class="w-5 h-5" />
          退出登录
        </button>
      </div>
    </aside>

    <!-- 移动端顶部栏 -->
    <div class="lg:hidden fixed top-0 left-0 right-0 z-50 bg-base-100 shadow">
      <div class="navbar">
        <div class="flex-none">
          <button class="btn btn-square btn-ghost" @click="showMobileMenu = !showMobileMenu">
            <Bars3Icon class="w-6 h-6" />
          </button>
        </div>
        <div class="flex-1">
          <span class="text-lg font-bold">管理后台</span>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <main class="flex-1 lg:ml-0 mt-16 lg:mt-0">
      <!-- 顶部栏 -->
      <div class="bg-base-100 shadow-sm p-4 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">{{ currentPageTitle }}</h2>
          <p class="text-sm text-base-content/60">{{ currentPageDesc }}</p>
        </div>
        <div class="flex items-center gap-4">
          <!-- 管理员信息 -->
          <div class="text-right hidden md:block">
            <div class="text-sm font-semibold">{{ authStore.user?.username }}</div>
            <div class="text-xs text-base-content/60">管理员</div>
          </div>
          <div class="avatar placeholder">
            <div class="bg-primary text-primary-content rounded-full w-10">
              <span>{{ authStore.user?.username[0] }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="p-6">
        <router-view />
      </div>
    </main>

    <!-- 移动端菜单 -->
    <div 
      v-if="showMobileMenu"
      class="fixed inset-0 z-40 lg:hidden"
      @click="showMobileMenu = false"
    >
      <div class="absolute inset-0 bg-black/50"></div>
      <div class="absolute left-0 top-0 bottom-0 w-64 bg-base-100 shadow-xl" @click.stop>
        <div class="p-6">
          <h1 class="text-2xl font-bold text-gradient">管理后台</h1>
        </div>
        <nav class="px-4">
          <ul class="menu">
            <li v-for="item in menuItems" :key="item.path">
              <router-link 
                :to="item.path"
                :class="{ 'active': isActive(item.path) }"
                @click="showMobileMenu = false"
              >
                <component :is="item.icon" class="w-5 h-5" />
                <span>{{ item.label }}</span>
              </router-link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  ChartBarIcon,
  UsersIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  RocketLaunchIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const showMobileMenu = ref(false)

// 菜单项
const menuItems = [
  { 
    path: '/admin/dashboard', 
    label: '仪表盘', 
    icon: ChartBarIcon,
    desc: '数据概览'
  },
  { 
    path: '/admin/users', 
    label: '用户管理', 
    icon: UsersIcon,
    desc: '用户列表与管理'
  },
  { 
    path: '/admin/withdrawals', 
    label: '提现审核', 
    icon: BanknotesIcon,
    desc: '提现申请审核'
  },
  { 
    path: '/admin/airdrops', 
    label: '空投管理', 
    icon: RocketLaunchIcon,
    desc: '空投信息管理'
  },
  { 
    path: '/admin/groups', 
    label: '群聊管理', 
    icon: ChatBubbleLeftRightIcon,
    desc: '群聊分类与群组管理'
  },
  { 
    path: '/admin/params', 
    label: '系统参数', 
    icon: Cog6ToothIcon,
    desc: '配置所有系统参数'
  },
  { 
    path: '/admin/system', 
    label: '系统管理', 
    icon: Cog6ToothIcon,
    desc: '系统功能管理'
  }
]

// 当前页面信息
const currentPageTitle = computed(() => {
  const item = menuItems.find(m => m.path === route.path)
  return item?.label || '管理后台'
})

const currentPageDesc = computed(() => {
  const item = menuItems.find(m => m.path === route.path)
  return item?.desc || ''
})

// 判断是否活跃路由
const isActive = (path: string) => {
  return route.path === path
}

// 退出登录
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.menu li > a.active {
  @apply bg-primary text-primary-content;
}
</style>






