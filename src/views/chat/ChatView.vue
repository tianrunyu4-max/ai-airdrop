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
              {{ currentGroup?.name || 'AI科技' }}
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
      class="flex-1 overflow-y-auto p-6 space-y-4 bg-white min-h-0 pt-20"
    >
      <!-- 机器人消息（空投推送） -->
      <div 
        v-for="message in validMessages"
        :key="message.id"
        class="animate-fade-in"
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
              <img 
                v-if="message.type === 'image' && message.image_url" 
                :src="message.image_url" 
                class="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
                @click="viewImage(message.image_url)"
              />
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

      <!-- 空状态 - 醒目设计 -->
      <div v-if="validMessages.length === 0 && !loading" class="flex flex-col items-center justify-center py-20">
        <div class="text-8xl mb-6 animate-bounce">🤖</div>
        <h3 class="text-3xl font-bold text-primary mb-3">欢迎来到 AI科技</h3>
        <p class="text-xl text-base-content/70 mb-6">等待AI智能推送欧易 币安交易所空投资讯</p>
        <div class="flex gap-2">
          <span class="loading loading-dots loading-lg text-primary"></span>
        </div>
        <div class="mt-8 text-center">
          <p class="text-sm text-base-content/50">💡 提示：机器人会自动推送优质空投项目</p>
          <p v-if="authStore.user?.is_agent" class="text-sm text-warning mt-2">⭐ 您是代理，可以切换到其他专属群聊</p>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    </div>

    <!-- 提示信息 - 简化 -->
    <div class="px-4 py-1.5 bg-warning/10 text-warning text-xs text-center flex items-center justify-center gap-2">
      <span>⏰</span>
      <span>{{ t('chat.deleteAfter') }}</span>
    </div>

    <!-- 输入框 - 全屏版 -->
    <div class="p-6 bg-white border-t border-base-300">
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

      <form @submit.prevent="sendMessage" class="flex gap-3">
        <!-- 图片上传按钮 -->
        <input 
          ref="fileInput"
          type="file" 
          accept="image/*" 
          class="hidden"
          @change="handleImageSelect"
        />
        <button
          type="button"
          @click="$refs.fileInput.click()"
          class="btn btn-circle btn-lg btn-primary btn-outline hover:btn-primary hover:scale-110 transition-all shadow-md"
          :disabled="sending"
          title="上传图片"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <input
          v-model="messageInput"
          type="text"
          :placeholder="t('chat.inputPlaceholder')"
          class="input input-bordered flex-1 input-lg text-lg focus:input-primary transition-all h-14"
          :disabled="sending"
          maxlength="500"
        />
        <button
          type="submit"
          class="btn btn-primary btn-lg px-12 gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all font-bold h-14"
          :disabled="(!messageInput.trim() && !selectedImage) || sending"
        >
          <span v-if="sending" class="loading loading-spinner loading-md"></span>
          <template v-else>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span class="text-lg">{{ t('chat.send') }}</span>
          </template>
        </button>
      </form>
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

// 环境标识：区分开发和生产环境的localStorage
const ENV_PREFIX = isDevMode ? 'dev_' : 'prod_'

// UUID验证函数
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// 计算属性：过滤后的消息（生产环境下只显示有效UUID的消息）
const validMessages = computed(() => {
  if (isDevMode) {
    return messages.value // 开发模式显示所有消息
  }
  // 生产环境：过滤掉无效UUID的消息
  return messages.value.filter(msg => {
    // 机器人消息总是显示
    if (msg.is_bot) return true
    // 用户消息：验证UUID
    return msg.user_id && isValidUUID(msg.user_id)
  })
})

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

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

// 🔥 生产模式：切换群组
const switchGroup = async (group: ChatGroup) => {
  if (currentGroup.value?.id === group.id) return

  // 检查权限
  if (!authStore.user?.is_agent && group.type !== 'default_hall') {
    alert('🔒 此群聊为代理专属！\n\n订阅AI代理即可解锁更多群聊\n前往"我的" → "订阅代理"')
    return
  }

  try {
    // 🔥 取消旧的订阅
    if (messageSubscription) {
      messageSubscription.unsubscribe()
      messageSubscription = null
    }
    if (botInterval) {
      clearInterval(botInterval)
      botInterval = null
    }
    
    // 🔥 立即更新群组
    currentGroup.value = group
    
    // 🔥 加载消息
    await loadMessages(group.id)
    
    // 🔥 订阅新群组的实时消息
    subscribeToMessages()
    
    // 如果需要空投机器人演示，可以启用
    // startBotSimulation()
  } catch (error) {
    // 切换失败不影响使用
  }
}

// 🔥 生产模式：从 Supabase 加载消息（带缓存优化）
const loadMessages = async (groupId?: string) => {
  try {
    const targetGroupId = groupId || currentGroup.value?.id
    if (!targetGroupId) {
      messages.value = []
      return
    }
    
    const storageKey = `${ENV_PREFIX}chat_messages_${targetGroupId}`
    
    // 🚀 优化1：先从缓存加载（快速显示）
    const cachedMessages = localStorage.getItem(storageKey)
    if (cachedMessages) {
      messages.value = JSON.parse(cachedMessages)
      nextTick(() => scrollToBottom())
    }
    
    // 🚀 优化2：异步从数据库刷新（保证数据准确）
    const { data: freshMessages, error } = await supabase
      .from('messages')
      .select(`
        *,
        username:users(username)
      `)
      .eq('chat_group_id', targetGroupId)
      .order('created_at', { ascending: true })
      .limit(100) // 只加载最近100条消息
    
    if (!error && freshMessages) {
      // 格式化消息（展开 username 对象）
      const formattedMessages = freshMessages.map(msg => ({
        ...msg,
        username: msg.username?.username || 'Unknown'
      }))
      
      messages.value = formattedMessages
      
      // 更新缓存
      localStorage.setItem(storageKey, JSON.stringify(formattedMessages))
      
      nextTick(() => scrollToBottom())
    }
  } catch (error) {
    // 加载失败不影响现有缓存数据
  }
}

// 🔥 生产模式：获取或创建默认群聊（AI科技主群）
const getDefaultGroup = async () => {
  try {
    // 优先查找"AI科技"主群
    let { data, error } = await supabase
      .from('chat_groups')
      .select('*')
      .eq('name', 'AI科技')
      .eq('type', 'default_hall')
      .maybeSingle()

    // 如果找不到，查找任何 default_hall 类型的群
    if (!data) {
      const result = await supabase
        .from('chat_groups')
        .select('*')
        .eq('type', 'default_hall')
        .limit(1)
        .maybeSingle()
      
      data = result.data
      error = result.error
    }

    // 如果还是没有，创建"AI科技"主群
    if (!data) {
      const { data: newGroup, error: createError } = await supabase
        .from('chat_groups')
        .insert({
          name: 'AI科技',
          icon: '🤖',
          type: 'default_hall',
          description: '核心群聊',
          member_count: 0,
          max_members: 50000,
          is_active: true
        })
        .select()
        .single()

      if (createError) throw createError
      currentGroup.value = newGroup
    } else {
      currentGroup.value = data
    }

    // 如果用户已登录，加入群组
    if (authStore.user) {
      await joinGroup(currentGroup.value!.id)
    }
  } catch (error) {
    // 失败不影响使用
  }
}

// 🔥 生产模式：加入群组
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
      // 添加成员
      await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: authStore.user.id,
          role: 'member'
        })

      // 更新成员计数（如果有这个RPC函数）
      await supabase.rpc('increment_group_members', { group_id: groupId }).catch(() => {})
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

  // 订阅新群组的消息
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
        // 获取用户名
        let username = 'Unknown'
        try {
          const { data: user } = await supabase
            .from('users')
            .select('username')
            .eq('id', payload.new.user_id)
            .maybeSingle()
          
          username = user?.username || 'Unknown'
        } catch {
          // 静默失败
        }

        const newMessage = {
          ...payload.new,
          username
        } as Message

        // 添加到界面
        messages.value.push(newMessage)

        // 🔥 保存到缓存
        const storageKey = `${ENV_PREFIX}chat_messages_${currentGroup.value?.id}`
        const storedMessages = JSON.parse(localStorage.getItem(storageKey) || '[]')
        storedMessages.push(newMessage)
        localStorage.setItem(storageKey, JSON.stringify(storedMessages))

        scrollToBottom()
      }
    )
    .subscribe()
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
  if (!currentGroup.value) return

  // 必须登录才能发送消息
  if (!authStore.user) {
    alert('请先登录')
    return
  }

  try {
    sending.value = true

    const messageContent = messageInput.value.trim() || '发送了一张图片'
    const messageType = selectedImage.value ? 'image' : 'text'

    // TODO: 如果有图片，需要上传到 Supabase Storage
    let imageUrl = null
    if (selectedImage.value && imagePreview.value) {
      // 简化版：直接使用预览图（base64）
      // 生产环境应该上传到 Supabase Storage
      imageUrl = imagePreview.value
    }

    // 🔥 发送到 Supabase 数据库
    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        chat_group_id: currentGroup.value.id,
        user_id: authStore.user.id,
        content: messageContent,
        type: messageType,
        image_url: imageUrl,
        is_bot: false
      })
      .select('*, username:users(username)')
      .single()

    if (error) throw error

    // 🔥 保存到 localStorage 缓存（性能优化）
    const storageKey = `${ENV_PREFIX}chat_messages_${currentGroup.value.id}`
    const storedMessages = JSON.parse(localStorage.getItem(storageKey) || '[]')
    storedMessages.push({
      ...newMessage,
      username: newMessage.username?.username || authStore.user.username
    })
    localStorage.setItem(storageKey, JSON.stringify(storedMessages))
    
    // 清空输入框
    messageInput.value = ''
    cancelImage()
    
    // Realtime 会自动推送新消息，无需手动添加到 messages 数组
  } catch (error) {
    alert('发送失败: ' + (error as Error).message)
  } finally {
    sending.value = false
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

  // 模拟空投推送（每30秒一次，带广告）
  botInterval = setInterval(() => {
    const airdrops = [
      {
        exchange: '币安',
        title: 'BNB质押空投',
        score: 8.5,
        content: '🔥 币安新空投！\n\n项目：BNB质押奖励\n奖励：预计50 USDT\nAI评分：8.5/10\n\n✅ 参与方式：质押BNB即可\n⏰ 截止时间：本月底'
      },
      {
        exchange: 'OKX',
        title: 'OKB持仓空投',
        score: 7.8,
        content: '⭐ OKX空投来袭！\n\n项目：OKB持仓奖励\n奖励：预计30 USDT\nAI评分：7.8/10\n\n✅ 参与方式：持有OKB即可\n⏰ 截止时间：48小时'
      },
      {
        exchange: '币安',
        title: 'Launchpool新项目',
        score: 9.2,
        content: '💎 高分推荐！\n\n项目：Launchpool - XXX代币\n奖励：预计100 USDT\nAI评分：9.2/10 ⭐⭐⭐\n\n✅ 参与方式：质押BNB/FDUSD\n⏰ 截止时间：7天'
      }
    ]

    const randomAirdrop = airdrops[Math.floor(Math.random() * airdrops.length)]
    
    // 所有消息都带广告（100%显示）
    const randomAd = adPool[Math.floor(Math.random() * adPool.length)]
    
    const botMsg = {
      id: `bot-${Date.now()}`,
      chat_group_id: 'dev-group',
      user_id: 'bot',
      username: 'AI空投机器人',
      content: randomAirdrop.content,
      type: 'text',
      is_bot: true,
      airdrop_data: {
        exchange: randomAirdrop.exchange,
        score: randomAirdrop.score
      },
      ad_data: randomAd, // 广告数据（可能为null）
      created_at: new Date().toISOString()
    } as any
    
    messages.value.push(botMsg)
    
    // 🔥 保存到缓存
    const storageKey = `${ENV_PREFIX}chat_messages_dev-group`
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]')
    stored.push(botMsg)
    localStorage.setItem(storageKey, JSON.stringify(stored))
    
    scrollToBottom()
  }, 30000) // 30秒推送一次（测试用）

  // 模拟在线人数变化
  setInterval(() => {
    onlineCount.value = Math.floor(Math.random() * 100) + 50
  }, 5000)
}

// 初始化开发模式数据
const initDevMode = () => {
  // 🔥 移除 isDevMode 检查，统一使用本地模式
  // if (!isDevMode) return
  
  loading.value = false
  currentGroup.value = {
    id: 'dev-group',
    name: 'AI科技',
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
    console.log('✅ 从缓存加载消息:', messages.value.length, '条')
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
  startBotSimulation()
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
        
        // 清理旧的不带环境前缀的聊天消息
        if (key.startsWith('chat_messages_') && !key.startsWith(ENV_PREFIX)) {
          keysToRemove.push(key)
          cleanedCount++
        }
        
        // 生产环境：额外清理开发环境的数据
        if (!isDevMode && key.startsWith('dev_')) {
          keysToRemove.push(key)
          cleanedCount++
        }
      }
      
      // 删除标记的keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      if (cleanedCount > 0) {
        console.log(`✅ 后台清理完成！共清理 ${cleanedCount} 条旧数据`)
      }
    } catch (error) {
      console.error('清理localStorage失败:', error)
    }
  }, 100) // 延迟100ms执行，让页面先加载
}

// 🔥 生产模式：初始化
onMounted(async () => {
  // 清理旧数据
  cleanupOldLocalStorage()
  
  // 🔥 获取默认群组
  await getDefaultGroup()
  
  // 🔥 加载消息
  if (currentGroup.value) {
    await loadMessages(currentGroup.value.id)
    
    // 🔥 订阅实时消息
    subscribeToMessages()
  }
  
  // 如果需要机器人演示，可以启用
  // startBotSimulation()
  
  // 启动自动清理（可选）
  // startAutoCleanup()
})

// 监听路由变化，当返回聊天页面时重新加载消息
watch(() => route.path, (newPath, oldPath) => {
  if (newPath === '/chat' && oldPath !== '/chat') {
    loadMessages()
  }
})

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
})

// 点击广告
const openAdLink = (adData: any) => {
  // TODO: 记录广告点击数据
  console.log('广告点击:', adData)
  alert(`📢 广告跳转\n\n${adData.text}\n\n功能开发中...`)
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
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
