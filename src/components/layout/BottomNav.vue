<template>
  <nav class="btm-nav btm-nav-md bg-base-100 border-t border-base-300 fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
    <router-link
      v-for="item in navItems"
      :key="item.name"
      :to="item.path"
      custom
      v-slot="{ navigate, isActive: routeIsActive }"
    >
      <button
        :class="{ active: routeIsActive }"
        @click="navigate"
      >
        <component :is="item.icon" :class="['w-6 h-6', routeIsActive ? 'text-primary' : 'text-base-content/60']" />
        <span :class="['text-xs mt-1', routeIsActive ? 'text-primary font-semibold' : 'text-base-content/60']">
          {{ item.label }}
        </span>
      </button>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  UsersIcon,
  UserCircleIcon
} from '@heroicons/vue/24/outline'

// 底部导航项
const navItems = [
  { name: 'chat', path: '/chat', icon: ChatBubbleLeftRightIcon, label: '聊天' },
  { name: 'points', path: '/points', icon: SparklesIcon, label: 'AI学习' },
  { name: 'team', path: '/team', icon: UsersIcon, label: '团队' },
  { name: 'profile', path: '/profile', icon: UserCircleIcon, label: '我的' }
]

// 不再需要手动判断和导航，router-link 自动处理
</script>

<style scoped>
.btm-nav > a > button {
  @apply flex flex-col items-center justify-center gap-1 transition-all duration-75 w-full h-full;
}

.btm-nav > a {
  @apply flex-1;
}

.btm-nav > a > button.active {
  @apply bg-primary/10;
}

/* 快速响应点击 */
.btm-nav > a > button:active {
  @apply scale-95;
}
</style>

