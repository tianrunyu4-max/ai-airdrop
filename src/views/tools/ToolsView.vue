<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20">
    <!-- 顶部标题 -->
    <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 shadow-lg">
      <h1 class="text-2xl font-bold">🛠️ 工具中心</h1>
      <p class="text-white/80 mt-1">付费代理专属功能</p>
    </div>

    <div class="container mx-auto p-4 max-w-4xl">
      <!-- 权限提示 -->
      <div v-if="!authStore.user?.is_agent" class="alert alert-warning shadow-lg mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <h3 class="font-bold">需要付费代理权限</h3>
          <div class="text-sm">订阅AI代理后即可使用发布功能</div>
        </div>
        <router-link to="/profile" class="btn btn-sm btn-primary">前往订阅</router-link>
      </div>

      <!-- 🎯 隐藏式+号按钮 -->
      <button
        v-if="authStore.user?.is_agent && !isFormExpanded"
        @click="isFormExpanded = true"
        class="fixed bottom-20 left-6 btn btn-circle btn-lg btn-primary shadow-2xl hover:scale-110 transition-all z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <!-- 🎯 展开状态：发布表单 -->
      <div 
        v-if="isFormExpanded"
        class="fixed bottom-16 left-0 right-0 bg-white border-t-2 border-primary shadow-2xl z-50 animate-slide-up"
      >
        <div class="container mx-auto p-4 max-w-4xl">
          <!-- 标题栏 -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-primary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              发布内容
            </h3>
            <button
              @click="isFormExpanded = false"
              class="btn btn-ghost btn-circle btn-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 系统限制提示 -->
          <div class="alert alert-info shadow-sm mb-4 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div class="flex-1">
              <p>每周限制1次发布 | 本周剩余：<span class="font-bold">{{ weeklyRemaining }}</span> 次</p>
              <p class="text-xs mt-1">系统当前共 <span class="font-bold">{{ posts.length }}/20</span> 条发布</p>
            </div>
          </div>

          <!-- 发布表单 -->
          <form @submit.prevent="submitPost" class="space-y-3">
            <!-- 文字内容 -->
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-semibold text-sm">内容（最多50字）</span>
                <span class="label-text-alt text-xs">{{ postForm.content.length }}/50</span>
              </label>
              <textarea
                v-model="postForm.content"
                class="textarea textarea-bordered h-20 resize-none text-sm"
                placeholder="输入您想发布的内容..."
                maxlength="50"
                required
              ></textarea>
            </div>

            <!-- 图片上传 -->
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-semibold text-sm">图片（最多2张）</span>
              </label>
              <div class="grid grid-cols-2 gap-3">
                <!-- 图片1 -->
                <div class="relative border-2 border-dashed border-base-300 rounded-lg p-2 hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    @change="handleImageUpload($event, 0)"
                    class="hidden"
                    ref="fileInput1"
                  />
                  <div v-if="!postForm.images[0]" @click="$refs.fileInput1.click()" class="cursor-pointer flex flex-col items-center justify-center h-24">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-xs text-base-content/60 mt-1">点击上传</span>
                  </div>
                  <div v-else class="relative">
                    <img :src="postForm.images[0]" class="w-full h-24 object-cover rounded" />
                    <button type="button" @click="removeImage(0)" class="btn btn-circle btn-xs btn-error absolute -top-2 -right-2">✕</button>
                  </div>
                </div>

                <!-- 图片2 -->
                <div class="relative border-2 border-dashed border-base-300 rounded-lg p-2 hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    @change="handleImageUpload($event, 1)"
                    class="hidden"
                    ref="fileInput2"
                  />
                  <div v-if="!postForm.images[1]" @click="$refs.fileInput2.click()" class="cursor-pointer flex flex-col items-center justify-center h-24">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-xs text-base-content/60 mt-1">点击上传</span>
                  </div>
                  <div v-else class="relative">
                    <img :src="postForm.images[1]" class="w-full h-24 object-cover rounded" />
                    <button type="button" @click="removeImage(1)" class="btn btn-circle btn-xs btn-error absolute -top-2 -right-2">✕</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 提交按钮 -->
            <div class="flex gap-2">
              <button
                type="submit"
                class="btn btn-primary flex-1"
                :disabled="loading || weeklyRemaining === 0 || !postForm.content.trim() || posts.length >= 20"
              >
                <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                {{ loading ? '发布中...' : '立即发布' }}
              </button>
              <button
                type="button"
                @click="isFormExpanded = false"
                class="btn btn-ghost"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 管理员清理功能 -->
      <div v-if="authStore.user?.is_admin" class="card bg-error/10 border-2 border-error shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title text-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            管理员操作
          </h2>
          <button
            @click="clearAllPosts"
            class="btn btn-error"
            :disabled="loading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            一键清理所有发布
          </button>
        </div>
      </div>

      <!-- 发布列表 -->
      <div class="card bg-white shadow-xl">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title text-primary">📋 最新发布</h2>
            <span class="badge badge-primary badge-lg">{{ posts.length }}/20</span>
          </div>
          
          <div v-if="postsLoading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg text-primary"></span>
          </div>

          <div v-else-if="posts.length === 0" class="text-center py-12 text-base-content/60">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto mb-4 text-base-content/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p class="text-lg">暂无发布内容</p>
            <p class="text-sm mt-2" v-if="authStore.user?.is_agent">点击左下角 + 号发布内容</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="post in posts"
              :key="post.id"
              class="border border-base-300 rounded-lg p-4 hover:shadow-md transition-shadow"
              :class="{ 'bg-warning/5 border-warning': post.is_pinned }"
            >
              <!-- 顶置标识 -->
              <div v-if="post.is_pinned" class="badge badge-warning gap-1 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                顶置
              </div>

              <!-- 用户信息 -->
              <div class="flex items-center gap-2 mb-3">
                <div class="avatar placeholder">
                  <div class="bg-primary text-primary-content rounded-full w-10">
                    <span class="text-xl">{{ post.username.charAt(0).toUpperCase() }}</span>
                  </div>
                </div>
                <div>
                  <p class="font-semibold">{{ post.username }}</p>
                  <p class="text-xs text-base-content/60">{{ formatTime(post.created_at) }}</p>
                </div>
              </div>

              <!-- 内容 -->
              <p class="mb-3 text-base">{{ post.content }}</p>

              <!-- 图片 -->
              <div v-if="post.image_url_1 || post.image_url_2" class="grid grid-cols-2 gap-2 mb-3">
                <img v-if="post.image_url_1" :src="post.image_url_1" class="w-full h-40 object-cover rounded cursor-pointer" @click="viewImage(post.image_url_1)" />
                <img v-if="post.image_url_2" :src="post.image_url_2" class="w-full h-40 object-cover rounded cursor-pointer" @click="viewImage(post.image_url_2)" />
              </div>

              <!-- 操作按钮 -->
              <div v-if="post.user_id === authStore.user?.id || authStore.user?.is_admin" class="flex gap-2">
                <button
                  @click="deletePost(post.id)"
                  class="btn btn-error btn-xs"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const authStore = useAuthStore()
const loading = ref(false)
const postsLoading = ref(false)
const weeklyRemaining = ref(1)
const posts = ref<any[]>([])
const isFormExpanded = ref(false) // 🎯 控制表单显示

const postForm = ref({
  content: '',
  images: ['', '']
})

const fileInput1 = ref<HTMLInputElement>()
const fileInput2 = ref<HTMLInputElement>()

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
  return `${Math.floor(minutes / 1440)}天前`
}

// 查看大图
const viewImage = (url: string) => {
  window.open(url, '_blank')
}

// 检查本周剩余次数
const checkWeeklyLimit = async () => {
  try {
    const { data, error } = await supabase.rpc('can_post_this_week', {
      p_user_id: authStore.user?.id
    })
    
    if (!error) {
      weeklyRemaining.value = data ? 1 : 0
    }
  } catch (error) {
    console.error('检查周限制失败:', error)
  }
}

// 图片上传（⚡ 优化：压缩图片）
const handleImageUpload = async (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  // ⚡ 检查文件大小（最大 2MB）
  if (file.size > 2 * 1024 * 1024) {
    alert('图片太大！请选择小于 2MB 的图片')
    target.value = ''
    return
  }
  
  // ⚡ 压缩图片
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height
      
      // 限制最大尺寸 800px
      const maxSize = 800
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height * maxSize) / width
          width = maxSize
        } else {
          width = (width * maxSize) / height
          height = maxSize
        }
      }
      
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)
      
      // 压缩为 JPEG，质量 0.7
      const compressed = canvas.toDataURL('image/jpeg', 0.7)
      postForm.value.images[index] = compressed
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// 移除图片
const removeImage = (index: number) => {
  postForm.value.images[index] = ''
}

// 提交发布
const submitPost = async () => {
  // 检查周限制
  if (weeklyRemaining.value === 0) {
    alert('本周发布次数已用完，下周一重置')
    return
  }
  
  // ⚡ 检查系统20条限制
  if (posts.value.length >= 20) {
    alert('系统发布已达上限（20条），请联系管理员清理后再发布')
    return
  }
  
  loading.value = true
  
  try {
    // 随机顶置（50%概率）
    const isPinned = Math.random() > 0.5
    // ⚡ 修复：使用秒级时间戳，避免整数溢出
    const pinOrder = isPinned ? Math.floor(Date.now() / 1000) : 0
    
    const { error } = await supabase.from('posts').insert({
      user_id: authStore.user?.id,
      username: authStore.user?.username,
      content: postForm.value.content,
      image_url_1: postForm.value.images[0] || null,
      image_url_2: postForm.value.images[1] || null,
      is_pinned: isPinned,
      pin_order: pinOrder
    })
    
    if (error) throw error
    
    // 更新发布计数
    await supabase.rpc('increment_post_count', {
      p_user_id: authStore.user?.id
    })
    
    alert('发布成功！' + (isPinned ? '🎉 已随机顶置！' : ''))
    
    // 重置表单
    postForm.value.content = ''
    postForm.value.images = ['', '']
    
    // 🎯 自动收起表单
    isFormExpanded.value = false
    
    // 重新加载
    await Promise.all([
      loadPosts(),
      checkWeeklyLimit()
    ])
  } catch (error: any) {
    console.error('发布失败:', error)
    alert('发布失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 加载发布列表（⚡ 限制20条）
const loadPosts = async () => {
  postsLoading.value = true
  
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('pin_order', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20) // ⚡ 系统最多显示20条
    
    if (error) throw error
    
    posts.value = data || []
  } catch (error) {
    console.error('加载发布失败:', error)
  } finally {
    postsLoading.value = false
  }
}

// 删除发布
const deletePost = async (postId: string) => {
  if (!confirm('确定要删除这条发布吗？')) return
  
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
    
    if (error) throw error
    
    alert('删除成功')
    await loadPosts()
  } catch (error: any) {
    console.error('删除失败:', error)
    alert('删除失败：' + error.message)
  }
}

// 管理员清理所有发布
const clearAllPosts = async () => {
  if (!confirm('⚠️ 确定要清理所有发布吗？此操作不可恢复！')) return
  if (!confirm('⚠️ 再次确认：是否清理所有发布？')) return
  
  loading.value = true
  
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 删除所有
    
    if (error) throw error
    
    alert('✅ 已清理所有发布')
    await loadPosts()
  } catch (error: any) {
    console.error('清理失败:', error)
    alert('清理失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 初始化（优化：批量并行加载，避免跳转）
onMounted(async () => {
  postsLoading.value = true
  
  try {
    const tasks = [loadPosts()]
    
    if (authStore.user?.is_agent) {
      tasks.push(checkWeeklyLimit())
    }
    
    await Promise.all(tasks)
  } catch (error) {
    console.error('初始化失败:', error)
  } finally {
    postsLoading.value = false
  }
})
</script>

<style scoped>
/* 🎯 表单展开动画 */
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
