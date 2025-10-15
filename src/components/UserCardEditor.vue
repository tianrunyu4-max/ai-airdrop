<template>
  <!-- 编辑名片模态框 -->
  <dialog class="modal" :class="{ 'modal-open': isOpen }">
    <div class="modal-box max-w-2xl bg-white">
      <h3 class="font-bold text-2xl text-gray-800 mb-6">✏️ 编辑我的名片</h3>

      <!-- 加载中 -->
      <div v-if="loading" class="flex justify-center items-center p-12">
        <span class="loading loading-spinner loading-lg text-yellow-500"></span>
      </div>

      <!-- 编辑表单 -->
      <div v-else class="space-y-6">
        <!-- 头像上传 -->
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">正方形头像</label>
          <div class="flex items-center gap-4">
            <img 
              :src="formData.avatar_url || defaultAvatar" 
              alt="头像预览"
              class="w-24 h-24 rounded-xl border-2 border-gray-300 object-cover bg-gray-100"
            >
            <div class="flex-1">
              <input 
                type="file" 
                ref="avatarInput"
                accept="image/*"
                @change="handleAvatarUpload"
                class="file-input file-input-bordered file-input-sm w-full"
              >
              <p class="text-xs text-gray-500 mt-1">建议尺寸：200x200px，最大5MB</p>
            </div>
          </div>
        </div>

        <!-- 商家名称 -->
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">商家名称（选填）</label>
          <input 
            v-model="formData.business_name"
            type="text"
            placeholder="例如：张三服装店"
            maxlength="100"
            class="input input-bordered w-full"
          >
        </div>

        <!-- 商家描述 -->
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">商家描述（选填）</label>
          <textarea 
            v-model="formData.business_desc"
            placeholder="介绍一下您的业务..."
            maxlength="500"
            rows="3"
            class="textarea textarea-bordered w-full"
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">{{ formData.business_desc?.length || 0 }}/500</p>
        </div>

        <!-- 广告图片1 -->
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">📢 广告图片1</label>
          <div v-if="formData.ad_image_1" class="mb-2">
            <div class="relative inline-block">
              <img 
                :src="formData.ad_image_1" 
                alt="广告图1"
                class="w-full h-48 rounded-lg object-cover border-2 border-gray-300"
              >
              <button 
                @click="removeImage('ad1')"
                class="btn btn-sm btn-circle absolute top-2 right-2 bg-red-500 text-white border-none"
              >
                ✕
              </button>
            </div>
          </div>
          <input 
            v-else
            type="file" 
            ref="ad1Input"
            accept="image/*"
            @change="handleAdUpload($event, 'ad1')"
            class="file-input file-input-bordered file-input-sm w-full"
          >
          <p class="text-xs text-gray-500 mt-1">建议尺寸：800x600px，最大5MB</p>
        </div>

        <!-- 广告图片2 -->
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">📢 广告图片2</label>
          <div v-if="formData.ad_image_2" class="mb-2">
            <div class="relative inline-block">
              <img 
                :src="formData.ad_image_2" 
                alt="广告图2"
                class="w-full h-48 rounded-lg object-cover border-2 border-gray-300"
              >
              <button 
                @click="removeImage('ad2')"
                class="btn btn-sm btn-circle absolute top-2 right-2 bg-red-500 text-white border-none"
              >
                ✕
              </button>
            </div>
          </div>
          <input 
            v-else
            type="file" 
            ref="ad2Input"
            accept="image/*"
            @change="handleAdUpload($event, 'ad2')"
            class="file-input file-input-bordered file-input-sm w-full"
          >
          <p class="text-xs text-gray-500 mt-1">建议尺寸：800x600px，最大5MB</p>
        </div>

        <!-- 联系方式 -->
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">联系方式（选填）</label>
          <input 
            v-model="formData.contact_info"
            type="text"
            placeholder="例如：微信号、电话等"
            maxlength="200"
            class="input input-bordered w-full"
          >
        </div>

        <!-- 提示信息 -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-700">
            💡 <strong>提示：</strong>您的名片将在所有群聊中同步显示，其他用户点击您的头像即可查看。
          </p>
        </div>
      </div>

      <!-- 按钮 -->
      <div class="modal-action">
        <button 
          @click="closeEditor" 
          class="btn"
          :disabled="uploading"
        >
          取消
        </button>
        <button 
          @click="saveCard" 
          class="btn bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 border-none"
          :disabled="uploading || loading"
        >
          <span v-if="uploading" class="loading loading-spinner loading-sm"></span>
          {{ uploading ? '上传中...' : '保存' }}
        </button>
      </div>
    </div>

    <!-- 背景遮罩 -->
    <form method="dialog" class="modal-backdrop bg-black bg-opacity-50" @click="closeEditor">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { UserCardService } from '@/services/UserCardService'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

// Props
const props = defineProps<{
  isOpen: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
  saved: []
}>()

// State
const authStore = useAuthStore()
const toast = useToast()
const loading = ref(false)
const uploading = ref(false)
const avatarInput = ref<HTMLInputElement>()
const ad1Input = ref<HTMLInputElement>()
const ad2Input = ref<HTMLInputElement>()

const formData = ref({
  avatar_url: '',
  ad_image_1: '',
  ad_image_2: '',
  business_name: '',
  business_desc: '',
  contact_info: ''
})

// Computed
const defaultAvatar = computed(() => {
  return UserCardService.generateDefaultAvatar(authStore.user?.username || 'U')
})

// Methods
const loadCurrentCard = async () => {
  if (!authStore.user?.id) return

  loading.value = true

  const result = await UserCardService.getUserCard(authStore.user.id)

  if (result.success && result.data) {
    formData.value = {
      avatar_url: result.data.avatar_url || '',
      ad_image_1: result.data.ad_image_1 || '',
      ad_image_2: result.data.ad_image_2 || '',
      business_name: result.data.business_name || '',
      business_desc: result.data.business_desc || '',
      contact_info: result.data.contact_info || ''
    }
  }

  loading.value = false
}

const handleAvatarUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  await uploadImage(file, 'avatar')
}

const handleAdUpload = async (event: Event, type: 'ad1' | 'ad2') => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  await uploadImage(file, type)
}

const uploadImage = async (file: File, type: 'avatar' | 'ad1' | 'ad2') => {
  if (!authStore.user?.id) return

  uploading.value = true

  const result = await UserCardService.uploadImage(
    authStore.user.id,
    file,
    type
  )

  if (result.success && result.data) {
    if (type === 'avatar') {
      formData.value.avatar_url = result.data
    } else if (type === 'ad1') {
      formData.value.ad_image_1 = result.data
    } else if (type === 'ad2') {
      formData.value.ad_image_2 = result.data
    }
    toast.success(result.message || '上传成功')
  } else {
    toast.error(result.error || '上传失败')
  }

  uploading.value = false
}

const removeImage = async (type: 'ad1' | 'ad2') => {
  const imageUrl = type === 'ad1' ? formData.value.ad_image_1 : formData.value.ad_image_2

  if (!imageUrl) return

  if (!confirm('确认删除这张图片吗？')) return

  const result = await UserCardService.deleteImage(imageUrl)

  if (result.success) {
    if (type === 'ad1') {
      formData.value.ad_image_1 = ''
    } else {
      formData.value.ad_image_2 = ''
    }
    toast.success('删除成功')
  } else {
    toast.error(result.error || '删除失败')
  }
}

const saveCard = async () => {
  if (!authStore.user?.id) return

  loading.value = true

  const result = await UserCardService.updateUserCard(authStore.user.id, formData.value)

  if (result.success) {
    toast.success('名片保存成功')
    emit('saved')
    closeEditor()
  } else {
    toast.error(result.error || '保存失败')
  }

  loading.value = false
}

const closeEditor = () => {
  emit('close')
}

// Watch
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    loadCurrentCard()
  }
})
</script>

<style scoped>
.modal-box {
  max-height: 90vh;
  overflow-y: auto;
}
</style>

