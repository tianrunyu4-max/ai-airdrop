<template>
  <div class="h-full flex flex-col bg-gradient-to-b from-yellow-50 via-white to-yellow-50">
    <!-- 头部 - 醒目设计 -->
    <div class="navbar bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white shadow-2xl border-b-4 border-yellow-300">
      <div class="flex-1">
        <div class="flex items-center gap-4">
          <!-- 大图标 -->
          <div class="avatar placeholder">
            <div class="bg-base-100 text-primary rounded-full w-14 h-14 shadow-lg">
              <span class="text-4xl">{{ currentGroup?.icon || '🤖' }}</span>
            </div>
          </div>
          <!-- 标题信息 -->
          <div>
            <h1 class="text-2xl font-black tracking-wide drop-shadow-lg">
              {{ currentGroup?.name || 'AI科技' }}
            </h1>
            <div class="flex items-center gap-3 mt-1">
              <p class="text-sm font-semibold opacity-90 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {{ formatNumber(currentGroup?.member_count || 0) }} 成员
              </p>
              <span class="text-sm opacity-70">·</span>
              <p class="text-sm font-semibold opacity-90 flex items-center gap-1">
                <span class="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                {{ onlineCount }} 在线
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="flex-none flex items-center gap-3">
        <!-- 实时标签 -->
        <div class="badge badge-success badge-lg gap-2 shadow-lg font-bold">
          <span class="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></span>
          实时推送
        </div>
        <!-- 群组选择器 - 所有人可见 -->
        <GroupSelector 
          :current-group-id="currentGroup?.id || null"
          @select="switchGroup"
        />
        <!-- 代理标识 -->
        <div v-if="authStore.user?.is_agent" class="badge badge-warning badge-lg gap-1 shadow-lg font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          代理
        </div>
      </div>
    </div>

    <!-- 消息列表 - 简化版 -->
    <div
      ref="messageContainer"
      class="flex-1 overflow-y-auto p-4 space-y-3 bg-white"
    >
      <!-- 机器人消息（空投推送） -->
      <div
        v-for="message in messages"
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
          <!-- 头像 -->
          <div class="avatar placeholder flex-shrink-0">
            <div 
              class="w-8 h-8 rounded-full"
              :class="message.user_id === authStore.user?.id ? 'bg-secondary' : 'bg-primary'"
            >
              <span class="text-xs text-white">{{ message.username?.[0] || '?' }}</span>
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
      <div v-if="messages.length === 0 && !loading" class="flex flex-col items-center justify-center py-20">
        <div class="text-8xl mb-6 animate-bounce">🤖</div>
        <h3 class="text-3xl font-bold text-primary mb-3">欢迎来到 AI科技</h3>
        <p class="text-xl text-base-content/70 mb-6">等待 AI 机器人推送最新空投信息...</p>
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

    <!-- 输入框 - 加大尺寸 + 图片上传 -->
    <div class="p-4 bg-yellow-50 border-t-2 border-yellow-200">
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
          class="input input-bordered flex-1 input-lg text-base focus:input-primary transition-all"
          :disabled="sending"
          maxlength="500"
        />
        <button
          type="submit"
          class="btn btn-primary btn-lg px-10 gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all font-bold"
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { supabase, isDevMode } from '@/lib/supabase'
import type { Message, ChatGroup } from '@/types'
import { format } from 'date-fns'
import GroupSelector from '@/components/GroupSelector.vue'

const { t } = useI18n()
const authStore = useAuthStore()

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

// 订阅实时消息
let messageSubscription: any = null
let botInterval: any = null

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

// 切换群组
const switchGroup = async (group: ChatGroup) => {
  // 检查是否是代理
  if (!authStore.user?.is_agent && group.type !== 'default_hall') {
    // 非代理用户尝试进入非默认群，显示订阅提示
    alert('🔒 此群聊为代理专属！\n\n订阅AI代理即可解锁更多群聊\n前往"我的" → "订阅代理"')
    return
  }

  try {
    loading.value = true
    currentGroup.value = group
    messages.value = []
    
    // 加载该群组的消息
    await loadMessages(group.id)
    
    // 加入群组
    await joinGroup(group.id)
    
    // 如果是开发模式，启动机器人
    if (isDevMode) {
      startBotSimulation()
    }
  } catch (error) {
    console.error('Switch group error:', error)
    alert('切换群聊失败')
  } finally {
    loading.value = false
  }
}

// 加载群组消息
const loadMessages = async (groupId: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_group_id', groupId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw error
    messages.value = data || []
    scrollToBottom()
  } catch (error) {
    console.error('Load messages error:', error)
  }
}

// 获取或创建默认群聊
const getDefaultGroup = async () => {
  try {
    // 查找可用的默认大厅
    const { data, error } = await supabase
      .from('chat_groups')
      .select('*')
      .eq('type', 'default_hall')
      .lt('member_count', 50000)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // 如果没有可用大厅，创建新的
    if (!data) {
      const { data: newGroup, error: createError } = await supabase
        .from('chat_groups')
        .insert({
          name: `大厅 ${Date.now()}`,
          type: 'default_hall',
          member_count: 0,
          max_members: 50000
        })
        .select()
        .single()

      if (createError) throw createError
      currentGroup.value = newGroup
    } else {
      currentGroup.value = data
    }

    // 加入群组
    await joinGroup(currentGroup.value!.id)
  } catch (error) {
    console.error('Get default group error:', error)
  }
}

// 加入群组
const joinGroup = async (groupId: string) => {
  try {
    // 检查是否已经是成员
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', authStore.user!.id)
      .single()

    if (!existing) {
      // 添加成员
      await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: authStore.user!.id,
          role: 'member'
        })

      // 更新成员计数
      await supabase.rpc('increment_group_members', { group_id: groupId })
    }
  } catch (error) {
    console.error('Join group error:', error)
  }
}

// 订阅实时消息
const subscribeToMessages = () => {
  if (!currentGroup.value) return

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
        const { data: user } = await supabase
          .from('users')
          .select('username')
          .eq('id', payload.new.user_id)
          .single()

        messages.value.push({
          ...payload.new,
          username: user?.username || 'Unknown'
        } as Message)

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

// 发送消息
const sendMessage = async () => {
  if (!messageInput.value.trim() && !selectedImage.value) return
  if (!currentGroup.value) return
  if (!authStore.user) return

  try {
    sending.value = true

    // 开发模式和生产模式都用同样的逻辑（因为Supabase配置了）
    const newMessage: any = {
      id: `msg-${Date.now()}`,
      chat_group_id: currentGroup.value.id,
      user_id: authStore.user.id,
      username: authStore.user.username,
      content: messageInput.value.trim() || '发送了一张图片',
      type: selectedImage.value ? 'image' : 'text',
      is_bot: false,
      created_at: new Date().toISOString()
    }

    // 如果有图片，使用预览URL
    if (selectedImage.value && imagePreview.value) {
      newMessage.image_url = imagePreview.value
    }

    messages.value.push(newMessage)
    
    messageInput.value = ''
    cancelImage()
    scrollToBottom()
  } catch (error) {
    console.error('Send message error:', error)
    alert('发送失败: ' + (error as Error).message)
  } finally {
    sending.value = false
  }
}

// 模拟AI机器人推送（开发模式）
const startBotSimulation = () => {
  if (!isDevMode) return

  // 添加欢迎消息（带广告）
  setTimeout(() => {
    messages.value.push({
      id: 'bot-welcome',
      chat_group_id: 'dev-group',
      user_id: 'bot',
      username: 'AI空投机器人',
      content: '🎉 欢迎来到AI智能科技学习集成大厅！\n\n我会每小时为您推送最新的空投信息。\n您也可以在这里和其他用户交流。',
      type: 'text',
      is_bot: true,
      ad_data: adPool[0], // 欢迎消息也带广告
      created_at: new Date().toISOString()
    } as any)
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
    
    messages.value.push({
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
    } as any)
    
    scrollToBottom()
  }, 30000) // 30秒推送一次（测试用）

  // 模拟在线人数变化
  setInterval(() => {
    onlineCount.value = Math.floor(Math.random() * 100) + 50
  }, 5000)
}

// 初始化开发模式数据
const initDevMode = () => {
  if (!isDevMode) return
  
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
  
  // 添加一些历史消息（包括机器人消息）
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
      created_at: new Date(Date.now() - 600000).toISOString()
    },
    {
      id: 'msg-1',
      chat_group_id: 'dev-group',
      user_id: 'user-1',
      username: 'Alice',
      content: '大家好！有人参加币安的空投吗？',
      type: 'text',
      is_bot: false,
      created_at: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 'msg-2',
      chat_group_id: 'dev-group',
      user_id: 'user-2',
      username: 'Bob',
      content: '参加了，这个评分挺高的',
      type: 'text',
      is_bot: false,
      created_at: new Date(Date.now() - 240000).toISOString()
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
      created_at: new Date(Date.now() - 120000).toISOString()
    }
  ] as any

  scrollToBottom()
  startBotSimulation()
}

// 生命周期
onMounted(async () => {
  if (isDevMode) {
    // 开发模式：使用模拟数据
    initDevMode()
  } else {
    // 生产模式：连接真实数据库
    await getDefaultGroup()
    await loadMessages()
    subscribeToMessages()
  }
})

onUnmounted(() => {
  if (messageSubscription) {
    messageSubscription.unsubscribe()
  }
  if (botInterval) {
    clearInterval(botInterval)
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
