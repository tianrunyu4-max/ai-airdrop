<template>
  <!-- 名片模态框 -->
  <dialog class="modal" :class="{ 'modal-open': isOpen }">
    <div class="modal-box max-w-md bg-white p-0 overflow-hidden">
      <!-- 关闭按钮 -->
      <button 
        @click="closeCard"
        class="btn btn-sm btn-circle absolute right-2 top-2 z-10 bg-white shadow-lg"
      >
        ✕
      </button>

      <!-- 加载中 -->
      <div v-if="loading" class="flex justify-center items-center p-12">
        <span class="loading loading-spinner loading-lg text-yellow-500"></span>
      </div>

      <!-- 名片内容 -->
      <div v-else-if="card" class="relative">
        <!-- 头部背景渐变 -->
        <div class="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 h-32"></div>

        <!-- 头像 -->
        <div class="px-6 -mt-16">
          <div class="relative inline-block">
            <img 
              :src="card.avatar_url || defaultAvatar" 
              alt="头像"
              class="w-32 h-32 rounded-xl border-4 border-white shadow-xl object-cover bg-white"
            >
            <div v-if="card.is_agent" class="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
              AI代理
            </div>
          </div>
        </div>

        <!-- 用户信息 -->
        <div class="px-6 pt-4 pb-2">
          <h3 class="text-2xl font-bold text-gray-800 mb-1">{{ card.username || '未知用户' }}</h3>
          <p v-if="card.business_name" class="text-gray-600 text-sm">{{ card.business_name }}</p>
        </div>

        <!-- 商家描述 -->
        <div v-if="card.business_desc" class="px-6 py-3 bg-gray-50">
          <p class="text-gray-700 text-sm">{{ card.business_desc }}</p>
        </div>

        <!-- 广告图片 -->
        <div v-if="card.ad_image_1 || card.ad_image_2" class="px-6 py-4">
          <div class="text-sm font-bold text-gray-700 mb-3">📢 商家展示</div>
          <div class="grid grid-cols-2 gap-3">
            <div v-if="card.ad_image_1" 
              @click="previewImage(card.ad_image_1)"
              class="cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-yellow-500 transition-all"
            >
              <img :src="card.ad_image_1" alt="广告图1" class="w-full h-40 object-cover">
            </div>
            <div v-if="card.ad_image_2" 
              @click="previewImage(card.ad_image_2)"
              class="cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-yellow-500 transition-all"
            >
              <img :src="card.ad_image_2" alt="广告图2" class="w-full h-40 object-cover">
            </div>
          </div>
        </div>

        <!-- 联系方式 -->
        <div v-if="card.contact_info" class="px-6 py-4 bg-yellow-50 border-t border-yellow-200">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span class="text-gray-700 text-sm font-medium">{{ card.contact_info }}</span>
          </div>
        </div>

        <!-- 编辑按钮（仅自己可见） -->
        <div v-if="isOwnCard" class="px-6 py-4 border-t border-gray-200">
          <button 
            @click="editCard"
            class="w-full btn bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 border-none"
          >
            ✏️ 编辑我的名片
          </button>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="p-6 text-center">
        <div class="text-red-500 mb-4">{{ error }}</div>
        <button @click="loadCard" class="btn btn-sm bg-yellow-500 text-white">重试</button>
      </div>
    </div>

    <!-- 背景遮罩 -->
    <form method="dialog" class="modal-backdrop bg-black bg-opacity-50" @click="closeCard">
      <button>close</button>
    </form>
  </dialog>

  <!-- 图片预览模态框 -->
  <dialog class="modal" :class="{ 'modal-open': showImagePreview }">
    <div class="modal-box max-w-4xl bg-black p-0">
      <button 
        @click="showImagePreview = false"
        class="btn btn-sm btn-circle absolute right-2 top-2 z-10 bg-white"
      >
        ✕
      </button>
      <img :src="previewImageUrl" alt="预览" class="w-full h-auto">
    </div>
    <form method="dialog" class="modal-backdrop" @click="showImagePreview = false">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { UserCardService, type UserCard as UserCardType } from '@/services/UserCardService'
import { useAuthStore } from '@/stores/auth'

// Props
const props = defineProps<{
  userId: string | null
  isOpen: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
  edit: []
}>()

// State
const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const card = ref<UserCardType | null>(null)
const showImagePreview = ref(false)
const previewImageUrl = ref('')

// Computed
const isOwnCard = computed(() => {
  return authStore.user?.id === props.userId
})

const defaultAvatar = computed(() => {
  return UserCardService.generateDefaultAvatar(card.value?.username || 'U')
})

// Methods
const loadCard = async () => {
  if (!props.userId) return

  loading.value = true
  error.value = ''

  const result = await UserCardService.getUserCard(props.userId)

  if (result.success && result.data) {
    card.value = result.data
  } else {
    error.value = result.error || '加载名片失败'
  }

  loading.value = false
}

const closeCard = () => {
  emit('close')
}

const editCard = () => {
  emit('edit')
  closeCard()
}

const previewImage = (imageUrl: string) => {
  previewImageUrl.value = imageUrl
  showImagePreview.value = true
}

// Watch
watch(() => props.isOpen, (newValue) => {
  if (newValue && props.userId) {
    loadCard()
  }
})

watch(() => props.userId, (newValue) => {
  if (newValue && props.isOpen) {
    loadCard()
  }
})
</script>

<style scoped>
.modal-box {
  max-height: 90vh;
  overflow-y: auto;
}
</style>

