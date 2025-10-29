<template>
  <div class="h-full flex flex-col bg-white">
    <!-- 头部 - 顶到最顶部 -->
    <div class="navbar bg-transparent text-base-content w-full px-4 py-1 absolute top-0 left-0 right-0 z-10">
      <div class="flex-1">
        <div class="flex items-center gap-4">
          <!-- 大图标 -->
          <div class="avatar placeholder">
            <div class="bg-base-100 text-primary rounded-full w-12 h-12 shadow-lg">
              <span class="text-3xl">{{ currentGroup?.icon || '🤖' }}</span>
            </div>
          </div>
          <!-- 标题信息 -->
          <div>
            <h1 class="text-xl font-black tracking-wide">
              {{ currentGroup?.description || 'AI 科技创薪' }}
            </h1>
            <div class="flex items-center gap-3 mt-1">
              <p class="text-sm font-semibold text-base-content/70 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {{ formatNumber(currentGroup?.member_count || 0) }}
              </p>
              <span class="text-sm text-base-content/50">·</span>
              <p class="text-sm font-semibold text-base-content/70 flex items-center gap-1">
                <span class="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                {{ onlineCount }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="flex-none flex items-center gap-2">
        <!-- 实时推送 - 和群组选择器一样大 -->
        <button class="btn btn-success btn-sm gap-1 font-bold">
          <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          <span class="whitespace-nowrap">实时推送</span>
        </button>
        <!-- 群组选择器 - 所有人可见 -->
        <GroupSelector 
          :current-group-id="currentGroup?.id || null"
          @select="switchGroup"
        />
      </div>
    </div>

    <!-- 消息列表 - 全屏聊天区域 -->
    <div
      ref="messageContainer"
      class="flex-1 overflow-y-auto p-6 space-y-4 bg-white min-h-0 pt-20 pb-24"
    >
      <!-- 机器人消息（空投推送） -->
      <div 
        v-for="message in validMessages"
        :key="message.id"
      >
        <!-- AI空投机器人消息 -->
        <div v-if="message.is_bot" class="card bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
          <div class="card-body p-5">
            <!-- 头部 -->
            <div class="flex items-center gap-2 mb-3">
              <span class="text-3xl">🤖</span>
              <div>
                <div class="font-bold text-primary text-lg">{{ t('chat.airdropBot') }}</div>
                <div class="text-xs text-base-content/50">{{ formatTime(message.created_at) }}</div>
              </div>
            </div>
            
            <!-- 主体内容：左右布局 -->
            <div class="flex gap-6">
              <!-- 左侧：空投信息（更窄一些） -->
              <div class="flex-1 max-w-md">
                <!-- 消息内容 - 加大字体 -->
                <div class="text-base whitespace-pre-line leading-relaxed font-medium mb-4">{{ message.content }}</div>
                
                <!-- 底部信息 + 按钮（靠左，按钮下移） -->
                <div v-if="message.airdrop_data" class="space-y-4">
                  <!-- 标签 -->
                  <div class="flex gap-2">
                    <div class="badge badge-primary badge-lg text-sm">{{ message.airdrop_data.exchange }}</div>
                    <div class="badge badge-success badge-lg gap-1 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      评分: {{ message.airdrop_data.score }}
                    </div>
                  </div>
                  
                  <!-- 按钮（左对齐，下移，放大） -->
                  <div class="flex gap-3 mt-4">
                    <button class="btn btn-primary btn-lg gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105" @click="participateAirdrop(message)">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span class="font-bold">立即参与</span>
                    </button>
                    <button class="btn btn-outline btn-lg gap-2 hover:btn-secondary transition-all hover:scale-105" @click="shareAirdrop(message)">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span class="font-bold">分享好友</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- 右侧：广告区域（更大） -->
              <div v-if="message.ad_data" class="flex-1 border-l-2 pl-6">
                <div class="flex items-center gap-2 mb-2">
                  <span class="badge badge-warning">广告</span>
                  <span class="text-sm text-base-content/60">推荐内容</span>
                </div>
                
                <!-- 广告内容卡片 -->
                <div class="bg-gradient-to-br from-base-200/40 to-base-200/20 rounded-xl p-4 cursor-pointer hover:from-base-200/60 hover:to-base-200/40 transition-all shadow-sm hover:shadow-md" @click="openAdLink(message.ad_data)">
                  <!-- 3张图片（图片上移） -->
                  <div class="grid grid-cols-3 gap-2 mb-3">
                    <img 
                      v-for="(img, idx) in message.ad_data.images" 
                      :key="idx"
                      :src="img" 
                      class="w-full aspect-square rounded-lg object-cover shadow-sm hover:scale-105 transition-transform"
                      :alt="`广告图片${idx + 1}`"
                    />
                  </div>
                  
                  <!-- 广告标题（新增一行） -->
                  <h4 class="text-lg font-bold text-base-content mb-2">
                    {{ message.ad_data.title || '限时优惠活动' }}
                  </h4>
                  
                  <!-- 广告文案（更大字体） -->
                  <p class="text-base text-base-content/90 line-clamp-2 mb-4 leading-relaxed">{{ message.ad_data.text }}</p>
                  
                  <!-- 点击提示（更明显、更大） -->
                  <div class="flex items-center justify-center gap-2 text-base text-primary font-bold bg-primary/10 rounded-lg py-3 hover:bg-primary/20 transition-colors">
                    <span>立即了解详情</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 用户消息 -->
        <div v-else class="flex gap-2" :class="message.user_id === authStore.user?.id ? 'flex-row-reverse' : ''">
          <!-- 头像 - 自动生成卡通正方形头像 -->
          <div class="avatar placeholder flex-shrink-0">
            <div class="w-8 h-8 rounded-sm">
              <img :src="generateConsistentAvatar(message.username || 'User', 80)" :alt="message.username" class="w-full h-full" />
            </div>
          </div>

          <!-- 消息内容 -->
          <div class="flex flex-col max-w-[70%]" :class="message.user_id === authStore.user?.id ? 'items-end' : 'items-start'">
            <div class="text-xs text-base-content/60 mb-1">
              {{ message.username }}
            </div>
            <div 
              class="rounded-2xl"
              :class="message.user_id === authStore.user?.id 
                ? 'bg-primary text-primary-content rounded-br-sm' 
                : 'bg-base-200 rounded-bl-sm'"
            >
              <!-- 图片消息 -->
              <div v-if="message.type === 'image'">
                <img 
                  v-if="message.image_url" 
                  :src="message.image_url" 
                  class="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
                  @click="viewImage(message.image_url)"
                />
                <div v-else class="px-4 py-2 italic opacity-70">
                  {{ message.content }}
                </div>
              </div>
              <!-- 文字消息 -->
              <div v-else class="px-4 py-2">
                {{ message.content }}
              </div>
            </div>
            <div class="text-xs text-base-content/40 mt-1">
              {{ formatTime(message.created_at) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 - 根据群组类型显示不同内容 -->
      <div v-if="validMessages.length === 0 && !loading" class="flex flex-col items-center justify-center py-20">
        <!-- AI 科技创薪 -->
        <template v-if="currentGroup?.type === 'default'">
          <div class="text-8xl mb-6 animate-bounce">💰</div>
          <h3 class="text-3xl font-bold text-primary mb-3">AI 科技创薪</h3>
          <p class="text-xl text-base-content/70 mb-6">欢迎来到聊天大厅，开始交流吧！</p>
          <div class="mt-8 text-center">
            <p class="text-sm text-base-content/50">💡 发送消息与其他用户交流</p>
            <p class="text-sm text-base-content/50 mt-2">🔹 分享经验 🔹 讨论项目 🔹 互相学习</p>
          </div>
        </template>
        
        <!-- AI Web3 空投群 -->
        <template v-else-if="currentGroup?.type === 'ai_push'">
          <div class="text-8xl mb-6 animate-bounce">🚀</div>
          <h3 class="text-3xl font-bold text-primary mb-3">AI Web3 空投</h3>
          <p class="text-xl text-base-content/70 mb-6">等待AI智能推送优质空投项目</p>
          <div class="flex gap-2">
            <span class="loading loading-dots loading-lg text-primary"></span>
          </div>
          <div class="mt-8 text-center">
            <p class="text-sm text-base-content/50">💡 提示：机器人会自动推送优质空投项目</p>
          </div>
        </template>
        
        <!-- 其他群 -->
        <template v-else>
          <div class="text-8xl mb-6 animate-bounce">💬</div>
          <h3 class="text-3xl font-bold text-primary mb-3">{{ currentGroup?.description || '聊天群' }}</h3>
          <p class="text-xl text-base-content/70 mb-6">开始聊天吧</p>
        </template>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    </div>

    <!-- 🎯 新设计：隐藏式输入框 -->
    <!-- 默认状态：浮动+按钮（左下角） -->
    <button
      v-if="!isInputExpanded"
      @click="isInputExpanded = true"
      class="fixed bottom-20 left-6 btn btn-circle btn-lg btn-primary shadow-2xl hover:scale-110 transition-all z-50"
      :class="{ 'hidden': currentGroup?.type === 'ai_push' }"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <!-- 展开状态：完整输入区域 -->
    <div 
      v-if="isInputExpanded"
      class="fixed bottom-16 left-0 right-0 bg-white border-t border-base-300 shadow-2xl z-50 animate-slide-up"
    >
      <div class="p-4">
        <!-- 图片预览 -->
        <div v-if="imagePreview" class="mb-3 relative inline-block">
          <img :src="imagePreview" class="max-w-xs max-h-32 rounded-lg" />
          <button 
            @click="cancelImage" 
            class="btn btn-circle btn-xs btn-error absolute -top-2 -right-2"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="sendMessage" class="flex gap-2">
          <!-- 隐藏的文件输入 -->
          <input 
            ref="fileInput"
            type="file" 
            accept="image/*" 
            class="hidden"
            @change="handleImageSelect"
          />
          
          <!-- 图片按钮 -->
          <button
            type="button"
            @click="$refs.fileInput.click()"
            class="btn btn-circle btn-primary btn-outline"
            title="上传图片"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <!-- 输入框 -->
          <input
            v-model="messageInput"
            type="text"
            :placeholder="authStore.user ? t('chat.inputPlaceholder') : '💬 发言即可创建账号，轻松聊天'"
            class="input input-bordered flex-1 focus:input-primary"
            maxlength="500"
            @keyup.enter="sendMessage"
            autofocus
          />
          
          <!-- 发送按钮 -->
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!messageInput.trim() && !selectedImage"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
          
          <!-- 收起按钮 -->
          <button
            type="button"
            @click="isInputExpanded = false"
            class="btn btn-ghost btn-circle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase, isDevMode } from '@/lib/supabase'
import type { Message, ChatGroup } from '@/types'
import { format } from 'date-fns'
import GroupSelector from '@/components/GroupSelector.vue'
import { CacheManager, CacheType } from '@/utils/cacheManager'
import { generateConsistentAvatar } from '@/utils/avatarGenerator'

const { t } = useI18n()
const authStore = useAuthStore()
const route = useRoute()

const messages = ref<Message[]>([])
const messageInput = ref('')
const loading = ref(false)
const sending = ref(false)
const currentGroup = ref<ChatGroup | null>(null)
const messageContainer = ref<HTMLElement>()
const onlineCount = ref(1)
const selectedImage = ref<File | null>(null)
const imagePreview = ref<string>('')
const fileInput = ref<HTMLInputElement>()
const isInputExpanded = ref(false) // 控制输入框展开/收起

// 环境标识：区分开发和生产环境的localStorage
const ENV_PREFIX = isDevMode ? 'dev_' : 'prod_'

// 🚀 缓存key
const CACHE_KEYS = {
  GROUP: `${ENV_PREFIX}chat_group_cache`,
  MESSAGES: `${ENV_PREFIX}chat_messages_cache`,
  TIMESTAMP: `${ENV_PREFIX}chat_cache_timestamp`
}

// UUID验证函数
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// 🎯 极简方案：不做过滤，直接显示所有消息
// 由管理员手动清理数据库中的旧消息
const validMessages = computed(() => messages.value)

// 🚀 缓存管理
const loadFromCache = () => {
  try {
    const groupCache = localStorage.getItem(CACHE_KEYS.GROUP)
    const messagesCache = localStorage.getItem(CACHE_KEYS.MESSAGES)
    const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP)
    
    // 缓存有效期：5分钟
    if (timestamp && Date.now() - parseInt(timestamp) < 5 * 60 * 1000) {
      if (groupCache) {
        const parsedGroup = JSON.parse(groupCache)
        // ✅ 验证缓存数据的有效性（包括UUID格式）
        if (parsedGroup && parsedGroup.id && parsedGroup.description && isValidUUID(parsedGroup.id)) {
          currentGroup.value = parsedGroup
          onlineCount.value = Math.floor((currentGroup.value?.member_count || 10) * 0.6)
        } else {
          console.warn('缓存的群组数据无效（ID格式错误），清除缓存')
          clearCache()
          return false
        }
      }
      if (messagesCache) {
        const parsedMessages = JSON.parse(messagesCache)
        if (Array.isArray(parsedMessages)) {
          messages.value = parsedMessages
        }
      }
      return true
    }
    return false
  } catch (e) {
    console.error('缓存加载失败，清除缓存:', e)
    clearCache()
    return false
  }
}

// 清除缓存
const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEYS.GROUP)
    localStorage.removeItem(CACHE_KEYS.MESSAGES)
    localStorage.removeItem(CACHE_KEYS.TIMESTAMP)
  } catch (e) {
    console.error('清除缓存失败:', e)
  }
}

const saveToCache = () => {
  try {
    if (currentGroup.value) {
      localStorage.setItem(CACHE_KEYS.GROUP, JSON.stringify(currentGroup.value))
    }
    if (messages.value.length > 0) {
      // ⚡ 阅后即焚：只缓存最新5条消息
      const recentMessages = messages.value.slice(-5)
      localStorage.setItem(CACHE_KEYS.MESSAGES, JSON.stringify(recentMessages))
    }
    localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString())
  } catch (e) {
    console.error('缓存保存失败:', e)
  }
}

// 订阅实时消息
let messageSubscription: any = null
let botInterval: any = null
let cleanupInterval: any = null

// 广告数据池（3张图片 + 标题）
const adPool = [
  {
    title: '新手福利活动',
    images: [
      'https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=200&h=200&fit=crop'
    ],
    text: '注册即送100U体验金，完成实名认证再送50U！限时活动，先到先得！',
    link: 'https://example.com/promo1'
  },
  {
    title: 'VIP会员优惠',
    images: [
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=200&h=200&fit=crop'
    ],
    text: '成为代理享受更多推荐奖励，月入过万不是梦！立即升级享受专属权益！',
    link: 'https://example.com/vip'
  },
  {
    title: '独家合作项目',
    images: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1634704784915-aacf363b021f?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200&h=200&fit=crop'
    ],
    text: '参与指定空投项目，额外获得10%平台奖励！机会难得，不容错过！',
    link: 'https://example.com/bonus'
  },
  {
    title: '推荐好友奖励',
    images: [
      'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1644361566696-3d442b5b482a?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=200&h=200&fit=crop'
    ],
    text: '每邀请1人成功注册，双方各得20U！邀请越多，奖励越多！',
    link: 'https://example.com/invite'
  }
]

// 格式化时间
const formatTime = (timestamp: string) => {
  return format(new Date(timestamp), 'HH:mm')
}

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  return num.toString()
}

// ⚡ 滚动到底部（优化：减少抖动）
const scrollToBottom = (smooth = false) => {
  // 🎯 直接滚动，不使用多层异步
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

// 🔥 生产模式：切换群组（优化版）
const switchGroup = async (group: ChatGroup) => {
  if (currentGroup.value?.id === group.id) return

  // 检查权限
  if (!authStore.user?.is_agent && group.type !== 'default_hall') {
    alert('🔒 此群聊为代理专属！\n\n订阅AI代理即可解锁更多群聊\n前往"我的" → "订阅代理"')
    return
  }

  try {
    // 🚀 立即切换群组（不等待加载）
    currentGroup.value = group
    
    // 🔥 取消旧的订阅
    if (messageSubscription) {
      messageSubscription.unsubscribe()
      messageSubscription = null
    }
    if (botInterval) {
      clearInterval(botInterval)
      botInterval = null
    }
    
    // 🚀 静默加载消息，订阅实时更新
    loadMessages(group.id, true)  // 静默加载，不显示loading
    subscribeToMessages()
    
    // 🤖 只在切换到空投群时启动机器人
    if (group.type === 'ai_push') {
      startBotForGroup(group)
    }
  } catch (error) {
    // 切换失败不影响使用
  }
}

// 🔥 生产模式：从 Supabase 加载消息（静默加载，避免闪烁）
const loadMessages = async (groupId?: string, silent: boolean = false) => {
  try {
    // 只在非静默模式下显示loading
    if (!silent) {
      loading.value = true
    }
    
    const targetGroupId = groupId || currentGroup.value?.id
    if (!targetGroupId) {
      messages.value = []
      if (!silent) loading.value = false
      return
    }
    
    // ⚡ 优化：查询所有字段（避免JOIN，加快查询速度）
    const { data: freshMessages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_group_id', targetGroupId)
      .order('created_at', { ascending: true })
      .limit(50)
    
    if (!error && freshMessages) {
      // ⚡ 直接使用查询结果，无需额外处理
      messages.value = freshMessages
      
      // ✅ 只在非静默模式下滚动（避免初始化时的视觉跳动）
      if (!silent) {
        await nextTick()
        scrollToBottom()
      }
    }
  } catch (error) {
    console.error('加载消息失败:', error)
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

// ⚡ 极简加载：3步完成
const getDefaultGroup = async () => {
  loading.value = true

  try {
    // ⚡ 只查群组，不查消息（消息靠实时推送）
    const { data: groupData } = await supabase
      .from('chat_groups')
      .select('*')
      .eq('type', 'default')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!groupData) {
      loading.value = false
      return
    }

    // 设置状态（空消息列表，靠实时推送）
    currentGroup.value = { ...groupData, name: groupData.description }
    messages.value = []
    onlineCount.value = 6
  } catch (error) {
    console.error('加载错误:', error)
  } finally {
    loading.value = false
  }
}

// 🔥 生产模式：加入群组（智能分群）
const joinGroup = async (groupId: string) => {
  try {
    if (!authStore.user) return // 未登录不加入群组

    // 检查是否已经是成员
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', authStore.user.id)
      .maybeSingle()

    if (!existing) {
      // 检查群组是否已满
      const { data: group } = await supabase
        .from('chat_groups')
        .select('member_count, max_members, type, group_number')
        .eq('id', groupId)
        .maybeSingle()

      if (group && group.member_count >= group.max_members && group.type === 'default') {
        // 默认群已满，创建或加入下一个群
        const nextGroupNumber = (group.group_number || 1) + 1
        
        // 查找是否已存在下一个群
        let { data: nextGroup } = await supabase
          .from('chat_groups')
          .select('*')
          .eq('type', 'default')
          .eq('group_number', nextGroupNumber)
          .maybeSingle()

        // 如果不存在，创建新群
        if (!nextGroup) {
          const { data: newGroup } = await supabase
            .from('chat_groups')
            .insert({
              type: 'default',
              icon: '💰',
              description: `AI科技创薪${nextGroupNumber}`,
              group_number: nextGroupNumber,
              member_count: 0,
              max_members: group.max_members,
              is_active: true
            })
            .select()
            .single()

          nextGroup = newGroup
        }

        // 加入新群
        if (nextGroup) {
          await supabase
            .from('group_members')
            .insert({
              group_id: nextGroup.id,
              user_id: authStore.user.id,
              role: 'member'
            })

          // 更新新群成员计数
          await supabase
            .from('chat_groups')
            .update({ member_count: supabase.raw('member_count + 1') })
            .eq('id', nextGroup.id)

          // 切换到新群
          currentGroup.value = {
            ...nextGroup,
            name: nextGroup.description
          } as any
        }
      } else {
        // 群未满或非默认群，正常加入
        await supabase
          .from('group_members')
          .insert({
            group_id: groupId,
            user_id: authStore.user.id,
            role: 'member'
          })

        // 更新成员计数
        await supabase
          .from('chat_groups')
          .update({ member_count: supabase.raw('member_count + 1') })
          .eq('id', groupId)
      }
    }
  } catch (error) {
    // 静默处理所有错误
  }
}

// 🔥 生产模式：订阅 Supabase Realtime 消息
const subscribeToMessages = () => {
  if (!currentGroup.value) return

  // 取消旧订阅
  if (messageSubscription) {
    messageSubscription.unsubscribe()
    messageSubscription = null
  }

  // 订阅新群组的消息（使用英文列名）
  messageSubscription = supabase
    .channel(`messages:${currentGroup.value.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_group_id=eq.${currentGroup.value.id}`
      },
      async (payload) => {
        // 新消息已经是正确格式
        const newMessage = {
          ...payload.new,
          username: authStore.user?.username || 'User'
        } as Message

        // 空投群：只显示机器人消息
        if (currentGroup.value?.type === 'ai_push' && !newMessage.is_bot) {
          return
        }

        // 🔥 消息去重：避免重复添加
        const exists = messages.value.some(m => m.id === newMessage.id)
        if (exists) {
          return
        }

        // ⚡ 阅后即焚：添加新消息时，保持最多1条
        messages.value.push(newMessage)
        if (messages.value.length > 1) {
          messages.value.shift() // 删除最旧的消息
        }
        
        scrollToBottom()
        
        // ⚡ 更新在线人数（有新消息说明有人活跃）
        if (currentGroup.value?.member_count) {
          onlineCount.value = Math.min(
            Math.floor(currentGroup.value.member_count * 0.65), // 提升到65%在线率
            onlineCount.value + 1 // 至少+1
          )
        }
        
        // 🚀 更新缓存
        saveToCache()
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIPTION_ERROR') {
        console.error('订阅失败，3秒后重试')
        setTimeout(() => subscribeToMessages(), 3000)
      }
    })
}

// 处理图片选择
const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file && file.type.startsWith('image/')) {
    selectedImage.value = file
    
    // 生成预览
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// 取消图片
const cancelImage = () => {
  selectedImage.value = null
  imagePreview.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 查看大图
const viewImage = (url: string) => {
  window.open(url, '_blank')
}

// 🔥 生产模式：发送消息到 Supabase 数据库
const sendMessage = async () => {
  if (!messageInput.value.trim() && !selectedImage.value) return
  
  // 验证群组
  if (!currentGroup.value) {
    alert('❌ 群组未加载，请刷新页面')
    return
  }
  
  if (!currentGroup.value.id) {
    alert('❌ 群组ID错误，请刷新页面')
    return
  }

  // ✅ 验证群组ID是否为合法UUID
  if (!isValidUUID(currentGroup.value.id)) {
    console.error('❌ 群组ID格式错误:', currentGroup.value.id)
    alert('❌ 数据加载异常，请刷新页面')
    return
  }

  // 🔥 AI科技创薪群禁止用户聊天
  if (currentGroup.value.type === 'ai_push') {
    alert('❌ 此群只接收机器人推送，不可聊天')
    return
  }

  // ✅ 如果没有账号，自动创建游客账号（发言即注册）
  if (!authStore.user) {
    console.log('🎉 检测到新用户发言，自动创建账号...')
    const success = await authStore.createGuestAccount()
    if (!success) {
      alert('❌ 创建账号失败，请刷新页面重试')
      return
    }
    toast.success(`🎉 账号已创建！您的用户名：${authStore.user?.username}`, 3000)
  }

  try {
    const messageContent = messageInput.value.trim() || '发送了一张图片'
    const messageType = selectedImage.value ? 'image' : 'text'

    // 获取用户ID（适配不同的字段名）
    const userId = authStore.user.id || authStore.user['id'] || authStore.user['用户ID']
    
    if (!userId) {
      throw new Error('无法获取用户ID，请重新登录')
    }

    // 处理图片：暂时使用 base64（生产环境应该上传到 Supabase Storage）
    let imageUrl = null
    if (selectedImage.value && imagePreview.value) {
      imageUrl = imagePreview.value
    }

    // 🔥 立即清空输入框（极速体验）
    const contentToSend = messageContent
    const imageToSend = imageUrl
    messageInput.value = ''
    cancelImage()
    
    // 🚀 乐观更新：立即显示消息（无延迟）
    const tempMessage: any = {
      id: `temp-${Date.now()}`,
      chat_group_id: currentGroup.value.id,
      user_id: userId,
      username: authStore.user.username,
      content: contentToSend,
      type: messageType,
      image_url: imageToSend,
      is_bot: false,
      created_at: new Date().toISOString()
    }
    
  messages.value.push(tempMessage)
  // ⚡ 移除滚动调用，减少抖动

    // 🔥 后台异步发送（不阻塞UI，不显示loading）
    const messageData: any = {
      chat_group_id: currentGroup.value.id,
      user_id: userId,
      username: authStore.user.username, // ✅ 保存用户名到数据库
      content: contentToSend,
      type: messageType,
      is_bot: false
    }
    
    if (imageToSend && messageType === 'image') {
      messageData.image_url = imageToSend
    }

    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select('*')
      .single()

    if (error) {
      // 发送失败：移除临时消息
      messages.value = messages.value.filter(m => m.id !== tempMessage.id)
      console.error('发送失败:', error.message)
      // 静默失败，不弹窗打扰用户
      return
    }

    // 发送成功：替换临时消息为真实消息
    Object.assign(tempMessage, {
      ...newMessage,
      username: authStore.user.username
    })
    
    // 🚀 更新缓存
    saveToCache()
    
    // ✅ 发送成功后自动收起输入框
    isInputExpanded.value = false
    
  } catch (error) {
    console.error('发送消息异常:', error)
    // 静默失败，不影响用户体验
  }
}


// 模拟AI机器人推送（开发模式）
const startBotSimulation = () => {
  // 🔥 移除 isDevMode 检查，统一使用本地模式
  // if (!isDevMode) return

  // 添加欢迎消息（带广告）
  setTimeout(() => {
    const welcomeMsg = {
      id: 'bot-welcome',
      chat_group_id: 'dev-group',
      user_id: 'bot',
      username: 'AI空投机器人',
      content: '🎉 欢迎来到AI智能科技学习集成大厅！\n\n我会每小时为您推送最新的空投信息。\n您也可以在这里和其他用户交流。',
      type: 'text',
      is_bot: true,
      ad_data: adPool[0], // 欢迎消息也带广告
      created_at: new Date().toISOString()
    } as any
    
    messages.value.push(welcomeMsg)
    
    // 🔥 保存到缓存
    const storageKey = `${ENV_PREFIX}chat_messages_dev-group`
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]')
    stored.push(welcomeMsg)
    localStorage.setItem(storageKey, JSON.stringify(stored))
    
    scrollToBottom()
  }, 1000)

  // 🤖 根据群组类型启动不同的机器人（生产模式也启动）
  if (currentGroup.value) {
    startBotForGroup(currentGroup.value)
  }

  // ⚡ 动态更新在线人数（基于成员数）
  setInterval(() => {
    if (currentGroup.value?.member_count) {
      // 在线率在50%-70%之间波动
      const onlineRate = 0.5 + Math.random() * 0.2
      onlineCount.value = Math.floor(currentGroup.value.member_count * onlineRate)
    }
  }, 5000)
}

// 初始化开发模式数据
const initDevMode = () => {
  // 🔥 移除 isDevMode 检查，统一使用本地模式
  // if (!isDevMode) return
  
  loading.value = false
  currentGroup.value = {
    id: 'dev-group',
    name: 'AI 科技创薪',
    type: 'default_hall',
    member_count: 128,
    max_members: 100000,
    icon: '🤖',
    description: '主群聊 - 人人可见',
    created_at: new Date().toISOString()
  } as any

  onlineCount.value = 66
  
  // 🔥 先尝试从缓存加载消息
  const storageKey = `${ENV_PREFIX}chat_messages_dev-group`
  const cachedMessages = localStorage.getItem(storageKey)
  
  if (cachedMessages) {
    // 有缓存，立即加载
    messages.value = JSON.parse(cachedMessages)
  } else {
    // 无缓存，创建初始消息
    messages.value = [
      {
        id: 'bot-1',
        chat_group_id: 'dev-group',
        user_id: 'bot',
        username: 'AI空投机器人',
        content: '🔥 币安新空投！\n\n项目：BNB质押奖励\n奖励：预计50 USDT\nAI评分：8.5/10\n\n✅ 参与方式：质押BNB即可\n⏰ 截止时间：本月底',
        type: 'bot',
        is_bot: true,
        airdrop_data: {
          exchange: '币安',
          score: 8.5
        },
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10分钟前
      },
      {
        id: 'msg-1',
        chat_group_id: 'dev-group',
        user_id: 'user-1',
        username: 'Alice',
        content: '大家好！有人参加币安的空投吗？',
        type: 'text',
        is_bot: false,
        created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString() // 8分钟前
      },
      {
        id: 'msg-2',
        chat_group_id: 'dev-group',
        user_id: 'user-2',
        username: 'Bob',
        content: '参加了，这个评分挺高的',
        type: 'text',
        is_bot: false,
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5分钟前
      },
      {
        id: 'bot-2',
        chat_group_id: 'dev-group',
        user_id: 'bot',
        username: 'AI空投机器人',
        content: '💎 高分推荐！\n\n项目：Launchpool - XXX代币\n奖励：预计100 USDT\nAI评分：9.2/10 ⭐⭐⭐\n\n✅ 参与方式：质押BNB/FDUSD\n⏰ 截止时间：7天',
        type: 'bot',
        is_bot: true,
        airdrop_data: {
          exchange: '币安',
          score: 9.2
        },
        created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString() // 3分钟前
      }
    ] as any
    
    // 保存到缓存
    localStorage.setItem(storageKey, JSON.stringify(messages.value))
  }

  scrollToBottom()
  // 🔥 不再使用 startBotSimulation，改用 startBotForGroup
}

// 自动清理旧消息（每5分钟检查一次）
const startAutoCleanup = () => {
  cleanupInterval = setInterval(() => {
    loadMessages() // loadMessages 会自动过滤并清理旧消息
  }, 5 * 60 * 1000) // 每5分钟检查一次（降低频率）
}

// 清理旧的localStorage数据（自动迁移）- 异步执行，不阻塞UI
const cleanupOldLocalStorage = () => {
  // 使用 setTimeout 将清理任务放到下一个事件循环，避免阻塞UI
  setTimeout(() => {
    try {
      let cleanedCount = 0
      const keysToRemove: string[] = []
      
      // 遍历所有localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        
        // 🔥 清理所有聊天消息缓存（包括新旧格式）
        if (key.includes('chat_messages_')) {
          keysToRemove.push(key)
          cleanedCount++
        }
        
        // 生产环境：额外清理开发环境的数据
        if (!isDevMode && key.startsWith('dev_')) {
          keysToRemove.push(key)
          cleanedCount++
        }
        
        // 清理prod_前缀的旧数据
        if (key.startsWith('prod_')) {
          keysToRemove.push(key)
          cleanedCount++
        }
      }
      
      // 删除标记的keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log('🗑️ 清理旧缓存:', key)
      })
      
      if (cleanedCount > 0) {
        console.log(`✅ 已清理 ${cleanedCount} 个旧缓存`)
      }
    } catch (error) {
      // 清理失败不影响使用
    }
  }, 100) // 延迟100ms执行，让页面先加载
}

// 🤖 根据群组类型启动对应的机器人（简化版）
const startBotForGroup = (group: any) => {
  // 先清理旧的机器人
  if (botInterval) {
    clearInterval(botInterval)
    botInterval = null
  }
  
  if (!group) return
  
  // 只有空投群需要启动定时机器人
  if (group.type === 'ai_push') {
    startAirdropBot()
  }
  // AI科技创薪群为纯聊天群，无需启动机器人
}

// 🤖 空投机器人：每2小时推送
const startAirdropBot = () => {
  pushAirdropMessage()  // 立即推送一条
  botInterval = setInterval(() => {
    pushAirdropMessage()
  }, 2 * 60 * 1000) // 2分钟（测试用）
}

// 📢 推送空投消息（只从数据库读取真实爬虫数据）
const pushAirdropMessage = async () => {
  // 从数据库读取真实空投数据
  const dbAirdrops = await loadAirdropsFromDatabase()
  
  if (dbAirdrops.length > 0) {
    // 推送真实空投
    pushAirdropFromDatabase(dbAirdrops)
  } else {
    // 数据库为空，记录日志，不推送
    console.warn('⚠️ 数据库中没有空投数据，请先运行爬虫或手动添加数据')
  }
}

// 🗄️ 从数据库加载空投
const loadAirdropsFromDatabase = async () => {
  try {
    // 50% Web3, 50% CEX（去中心化交易所 vs 中心化交易所）
    const randomNum = Math.random()
    const type = randomNum < 0.5 ? 'web3' : 'cex'
    
    const { data, error } = await supabase
      .from('airdrops')
      .select('*')
      .eq('status', 'active')
      .eq('type', type)
      .gte('ai_score', 7.0)
      .order('ai_score', { ascending: false })
      .limit(20)
    
    if (error) {
      console.error('❌ 加载空投失败:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('❌ 加载空投异常:', error)
    return []
  }
}

// 📤 推送数据库中的空投
const pushAirdropFromDatabase = (airdrops: any[]) => {
  if (airdrops.length === 0) return
  
  // 随机选择一个
  const airdrop = airdrops[Math.floor(Math.random() * airdrops.length)]
  
  // 格式化消息内容
  const stars = '⭐'.repeat(Math.ceil(airdrop.ai_score / 2))
  let content = `🚀 ${airdrop.title}\n\n`
  
  if (airdrop.reward_min && airdrop.reward_max) {
    content += `💎 预计奖励：${airdrop.reward_min}-${airdrop.reward_max} USDT\n`
  }
  
  content += `🎯 AI评分：${airdrop.ai_score}/10 ${stars}\n`
  content += `📱 平台：${airdrop.platform}\n`
  
  if (airdrop.difficulty) {
    const diffMap: any = { easy: '简单 ✅', medium: '中等 ⚡', hard: '困难 🔥' }
    content += `📊 难度：${diffMap[airdrop.difficulty] || airdrop.difficulty}\n`
  }
  
  if (airdrop.description) {
    content += `\n📝 ${airdrop.description.substring(0, 200)}\n`
  }
  
  if (airdrop.steps && airdrop.steps.length > 0) {
    content += `\n✅ 参与步骤：\n`
    airdrop.steps.slice(0, 5).forEach((step: string, i: number) => {
      content += `${i + 1}. ${step}\n`
    })
  }
  
  if (airdrop.url) {
    content += `\n🔗 ${airdrop.url}`
  }
  
  // 推送消息
  const botMsg = {
    id: `airdrop-bot-${Date.now()}`,
    chat_group_id: currentGroup.value?.id || 'ai_push_group',
    user_id: 'airdrop_bot',
    username: 'AI空投机器人',
    content: content,
    type: 'text',
    is_bot: true,
    created_at: new Date().toISOString()
  } as any
  
  messages.value.push(botMsg)
  scrollToBottom()
  
  // 发送到 Supabase
  supabase.from('messages').insert({
    chat_group_id: botMsg.chat_group_id,
    user_id: botMsg.user_id,
    content: botMsg.content,
    type: botMsg.type,
    is_bot: botMsg.is_bot
  }).then(({ error }) => {
    if (error) console.error('❌ 保存消息失败:', error)
  })
  
  // 标记已推送
  supabase.from('airdrops').update({
    push_count: airdrop.push_count + 1,
    last_pushed_at: new Date().toISOString()
  }).eq('id', airdrop.id).then(({ error }) => {
    if (error) console.error('❌ 更新推送状态失败:', error)
  })
}

// 💰 推送赚钱消息（已废弃，聊天群改为纯聊天功能）
// const pushMoneyMessage = () => {
//   // 聊天群不需要机器人，只用于用户之间的交流
// }

// 🚀 取消定时刷新：不需要前端过滤
let refreshInterval: any = null

const startPeriodicRefresh = () => {
  // 不需要定时刷新，管理员手动清理数据库
}

// 🔥 简化版：一步到位初始化（批量加载，0次跳转）
// ⚡ 极简初始化：直接加载，不阻塞
onMounted(async () => {
  cleanupOldLocalStorage()
  await getDefaultGroup()
  
  // ✅ 检测是否需要显示"发言即注册"提示
  if (route.query.tip === 'speak_to_create' && !authStore.user) {
    toast.info('💡 发言即可创建账号，无需注册！', 5000)
  }
})

// 监听路由变化已禁用（避免重复加载）
// watch(() => route.path, (newPath, oldPath) => {
//   if (newPath === '/chat' && oldPath !== '/chat') {
//     loadMessages()
//   }
// })

onUnmounted(() => {
  if (messageSubscription) {
    messageSubscription.unsubscribe()
  }
  if (botInterval) {
    clearInterval(botInterval)
  }
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
  }
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// 点击广告
const openAdLink = (adData: any) => {
  alert(`📢 广告跳转\n\n${adData.text}\n\n功能开发中...`)
  // TODO: 记录广告点击数据
  // window.open(adData.link, '_blank')
}

// 参与空投
const participateAirdrop = (message: any) => {
  // TODO: 跳转到空投详情页或打开外部链接
  alert(`🚀 准备参与空投！\n\n${message.airdrop_data?.exchange || '未知交易所'}\n\n功能开发中...`)
}

// 收藏空投
const bookmarkAirdrop = (message: any) => {
  // TODO: 保存到收藏列表
  alert('⭐ 已收藏！\n\n可以在"我的-收藏"中查看')
}

// 分享空投
const shareAirdrop = (message: any) => {
  // TODO: 生成分享链接或文案
  const shareText = `🎁 发现好空投！\n\n${message.content.split('\n').slice(0, 3).join('\n')}\n\n快来参与吧！`
  
  if (navigator.share) {
    navigator.share({
      title: 'AI智能科技学习集成',
      text: shareText
    })
  } else {
    // 复制到剪贴板
    navigator.clipboard.writeText(shareText)
    alert('📋 分享内容已复制到剪贴板！')
  }
}
</script>

<style scoped>
/* ⚡ 输入框滑入动画（保留） */
.animate-slide-up {
  animation: slide-up 0.2s ease-out;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ⚡ 优化：GPU加速，防止抖动 */
.space-y-4 > * {
  transform: translateZ(0);
  will-change: auto;
}
</style>
