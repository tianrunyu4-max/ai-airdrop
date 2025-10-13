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
        <component :is="item.icon" :class="['w-7 h-7 transition-transform', routeIsActive ? 'text-primary scale-110' : 'text-base-content/60']" />
        <span :class="[
          'text-sm mt-1 font-bold tracking-wide transition-all',
          routeIsActive ? 'text-primary nav-text-active' : 'text-base-content/70 nav-text-inactive'
        ]">
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
  @apply flex flex-col items-center justify-center gap-1 transition-all duration-200 w-full h-full;
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

/* 激活状态文字 - 立体效果 */
.nav-text-active {
  text-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.05),
    0 0 8px rgba(var(--p), 0.3);
  transform: scale(1.05);
}

/* 未激活状态文字 - 轻微阴影 */
.nav-text-inactive {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 悬停效果 */
.btm-nav > a > button:hover .nav-text-inactive {
  color: rgba(var(--bc), 0.9);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>

