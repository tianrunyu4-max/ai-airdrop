<template>
  <div class="drawer drawer-end">
    <input id="group-drawer" type="checkbox" class="drawer-toggle" v-model="isOpen" />
    
    <!-- 触发按钮 -->
    <div class="drawer-content">
      <label for="group-drawer" class="btn btn-primary btn-outline gap-2 hover:scale-105 transition-all shadow-md hover:shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span class="hidden sm:inline font-bold">切换群聊</span>
      </label>
    </div>
    
    <!-- 侧边栏 -->
    <div class="drawer-side z-50">
      <label for="group-drawer" class="drawer-overlay"></label>
      <div class="w-96 min-h-full bg-base-100 shadow-2xl">
        <!-- 头部 -->
        <div class="sticky top-0 bg-gradient-to-r from-primary to-secondary text-primary-content p-6 shadow-lg z-10">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold">群聊列表</h2>
              <p class="text-sm opacity-80">{{ authStore.user?.is_agent ? '⭐ 代理专属权限已解锁' : '💎 订阅代理解锁更多群聊' }}</p>
            </div>
            <label for="group-drawer" class="btn btn-ghost btn-circle">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </label>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="flex justify-center items-center p-12">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>

        <!-- 群组列表 -->
        <div v-else class="p-4 space-y-6">
          <!-- 按分类显示 -->
          <div v-for="category in categories" :key="category.id" class="space-y-2">
            <!-- 分类标题 -->
            <div class="flex items-center gap-2 px-2 py-1">
              <span class="text-2xl">{{ category.icon }}</span>
              <h3 class="font-bold text-lg">{{ category.name }}</h3>
              <span class="text-xs text-base-content/50">({{ getCategoryGroupCount(category.id) }})</span>
            </div>

            <!-- 该分类下的群组 -->
            <div class="space-y-2">
              <div
                v-for="group in getGroupsByCategory(category.id)"
                :key="group.id"
                @click="selectGroup(group)"
                class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all hover:shadow-lg"
                :class="{ 'ring-2 ring-primary': currentGroupId === group.id }"
              >
                <div class="card-body p-4">
                  <div class="flex items-start gap-3">
                    <!-- 图标 -->
                    <div class="text-3xl">{{ group.icon || '💬' }}</div>
                    
                    <!-- 信息 -->
                    <div class="flex-1 min-w-0">
                      <h4 class="font-bold text-base truncate">{{ group.name }}</h4>
                      <p v-if="group.description" class="text-xs text-base-content/60 line-clamp-2 mt-1">
                        {{ group.description }}
                      </p>
                      
                      <!-- 统计信息 -->
                      <div class="flex items-center gap-3 mt-2">
                        <div class="badge badge-sm gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          {{ formatNumber(group.member_count) }}
                        </div>
                        
                        <div v-if="group.bot_enabled" class="badge badge-primary badge-sm gap-1">
                          <span>🤖</span>
                          <span>AI推送</span>
                        </div>
                        
                        <div v-if="group.type === 'default_hall'" class="badge badge-success badge-sm">
                          主群
                        </div>
                        
                        <!-- 代理专属标识 -->
                        <div v-if="group.type !== 'default_hall' && !authStore.user?.is_agent" class="badge badge-warning badge-sm gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          代理专属
                        </div>
                      </div>
                    </div>

                    <!-- 选中标记或锁定标记 -->
                    <div v-if="currentGroupId === group.id" class="text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div v-else-if="group.type !== 'default_hall' && !authStore.user?.is_agent" class="text-warning">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 未分类群组 -->
          <div v-if="uncategorizedGroups.length > 0" class="space-y-2">
            <h3 class="font-bold text-lg px-2">其他群聊</h3>
            <div class="space-y-2">
              <div
                v-for="group in uncategorizedGroups"
                :key="group.id"
                @click="selectGroup(group)"
                class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all"
                :class="{ 'ring-2 ring-primary': currentGroupId === group.id }"
              >
                <div class="card-body p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="font-bold">{{ group.name }}</h4>
                      <p class="text-xs text-base-content/60">{{ formatNumber(group.member_count) }} 成员</p>
                    </div>
                    <div v-if="currentGroupId === group.id" class="text-primary">✓</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { ChatGroup, ChatCategory } from '@/types'

const authStore = useAuthStore()

const props = defineProps<{
  currentGroupId: string | null
}>()

const emit = defineEmits<{
  (e: 'select', group: ChatGroup): void
}>()

const isOpen = ref(false)
const loading = ref(true)
const categories = ref<ChatCategory[]>([])
const groups = ref<ChatGroup[]>([])

// 按分类获取群组（过滤掉非代理用户无法访问的群）
const getGroupsByCategory = (categoryId: string) => {
  return groups.value.filter(g => {
    // 如果是主群，所有人可见
    if (g.type === 'default_hall') return g.category_id === categoryId
    
    // 如果是代理专属群，只有代理可见
    if (g.type === 'agent_only' || g.type === 'custom') {
      return g.category_id === categoryId && authStore.user?.is_agent
    }
    
    return g.category_id === categoryId
  })
}

// 获取分类下的群组数量
const getCategoryGroupCount = (categoryId: string) => {
  return getGroupsByCategory(categoryId).length
}

// 未分类的群组
const uncategorizedGroups = computed(() => {
  return groups.value.filter(g => !g.category_id)
})

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  return num.toString()
}

// 选择群组
const selectGroup = (group: ChatGroup) => {
  emit('select', group)
  isOpen.value = false
}

// 加载数据
const loadData = async () => {
  // 直接使用模拟数据（开发模式）
  categories.value = [
    { id: '1', name: '综合交流', description: '综合话题讨论区', icon: '💬', sort_order: 1, is_active: true, created_at: '', updated_at: '' },
    { id: '2', name: '空投推荐', description: 'AI推荐的优质空投', icon: '🎁', sort_order: 2, is_active: true, created_at: '', updated_at: '' },
    { id: '3', name: '交易策略', description: '交易技巧和策略分享', icon: '📈', sort_order: 3, is_active: true, created_at: '', updated_at: '' }
  ]

  groups.value = [
    { id: 'dev-group', name: 'AI科技', description: '主群聊 - 所有用户可见，AI空投推送', category_id: '1', type: 'default_hall', member_count: 128, max_members: 100000, owner_id: null, icon: '🤖', sort_order: 1, is_active: true, bot_enabled: true, bot_config: null, created_at: '' },
    { id: '2', name: '币安空投专区', description: '币安交易所空投信息（代理专属）', category_id: '2', type: 'agent_only', member_count: 56, max_members: 100000, owner_id: null, icon: '🟡', sort_order: 2, is_active: true, bot_enabled: true, bot_config: null, created_at: '' },
    { id: '3', name: 'OKX空投专区', description: 'OKX交易所空投信息（代理专属）', category_id: '2', type: 'agent_only', member_count: 43, max_members: 100000, owner_id: null, icon: '⚫', sort_order: 3, is_active: true, bot_enabled: true, bot_config: null, created_at: '' },
    { id: '4', name: '高分空投推荐', description: 'AI评分8分以上（代理专属）', category_id: '2', type: 'agent_only', member_count: 89, max_members: 100000, owner_id: null, icon: '⭐', sort_order: 4, is_active: true, bot_enabled: true, bot_config: null, created_at: '' },
    { id: '5', name: '合约交易策略', description: '合约交易技巧分享（代理专属）', category_id: '3', type: 'agent_only', member_count: 34, max_members: 100000, owner_id: null, icon: '📊', sort_order: 5, is_active: true, bot_enabled: false, bot_config: null, created_at: '' }
  ]
  
  loading.value = false
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
