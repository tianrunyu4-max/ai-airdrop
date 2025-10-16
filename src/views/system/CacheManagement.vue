<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
    <div class="max-w-4xl mx-auto">
      <!-- 标题 -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">🗄️ 缓存管理中心</h1>
        <p class="text-gray-600">统一管理应用缓存，优化系统性能</p>
      </div>

      <!-- 缓存统计卡片 -->
      <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">📊 缓存统计</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div class="text-sm text-gray-600 mb-1">总缓存数量</div>
            <div class="text-3xl font-bold text-blue-600">{{ stats.total }}</div>
            <div class="text-xs text-gray-500 mt-1">项</div>
          </div>
          
          <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div class="text-sm text-gray-600 mb-1">缓存大小</div>
            <div class="text-3xl font-bold text-green-600">{{ (stats.size / 1024).toFixed(2) }}</div>
            <div class="text-xs text-gray-500 mt-1">KB</div>
          </div>
          
          <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <div class="text-sm text-gray-600 mb-1">当前版本</div>
            <div class="text-2xl font-bold text-purple-600">{{ appVersion }}</div>
            <div class="text-xs text-gray-500 mt-1">APP VERSION</div>
          </div>
        </div>

        <!-- 分类统计 -->
        <div class="mt-4">
          <h3 class="text-sm font-bold text-gray-700 mb-2">缓存分类</h3>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div v-for="(count, type) in stats.byType" :key="type" 
                 class="bg-gray-50 rounded-lg p-3 text-center">
              <div class="text-xs text-gray-600 mb-1">{{ type }}</div>
              <div class="text-lg font-bold text-gray-800">{{ count }}</div>
            </div>
          </div>
        </div>

        <button @click="refreshStats" 
                class="btn btn-sm btn-outline mt-4">
          🔄 刷新统计
        </button>
      </div>

      <!-- 快速操作卡片 -->
      <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">⚡ 快速操作</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- 清理过期缓存 -->
          <button @click="cleanExpired" 
                  class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-4 transition-all">
            <div class="flex items-center justify-between">
              <div class="text-left">
                <div class="font-bold text-lg">🧹 清理过期缓存</div>
                <div class="text-sm opacity-90">删除已过期的数据</div>
              </div>
              <div class="text-3xl">→</div>
            </div>
          </button>

          <!-- 智能清理 -->
          <button @click="smartClean" 
                  class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl p-4 transition-all">
            <div class="flex items-center justify-between">
              <div class="text-left">
                <div class="font-bold text-lg">🧠 智能清理</div>
                <div class="text-sm opacity-90">自动优化缓存空间</div>
              </div>
              <div class="text-3xl">→</div>
            </div>
          </button>

          <!-- 清理聊天记录 -->
          <button @click="() => clearType('CHAT')" 
                  class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-4 transition-all">
            <div class="flex items-center justify-between">
              <div class="text-left">
                <div class="font-bold text-lg">💬 清理聊天记录</div>
                <div class="text-sm opacity-90">删除本地聊天缓存</div>
              </div>
              <div class="text-3xl">→</div>
            </div>
          </button>

          <!-- 清理临时数据 -->
          <button @click="() => clearType('TEMP')" 
                  class="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl p-4 transition-all">
            <div class="flex items-center justify-between">
              <div class="text-left">
                <div class="font-bold text-lg">📦 清理临时数据</div>
                <div class="text-sm opacity-90">删除临时缓存文件</div>
              </div>
              <div class="text-3xl">→</div>
            </div>
          </button>
        </div>
      </div>

      <!-- 完全清理卡片 -->
      <div class="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl shadow-xl p-6">
        <h2 class="text-xl font-bold text-red-600 mb-4">⚠️ 危险操作</h2>
        
        <div class="space-y-4">
          <!-- 清理所有缓存（保留登录） -->
          <div class="bg-white rounded-xl p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-bold text-gray-800 mb-1">清理所有缓存（保留登录）</h3>
                <p class="text-sm text-gray-600">清理所有缓存但保留登录状态</p>
              </div>
              <button @click="clearAllKeepAuth" 
                      class="btn bg-orange-500 hover:bg-orange-600 text-white border-none ml-4">
                执行清理
              </button>
            </div>
          </div>

          <!-- 完全清理（包括登录） -->
          <div class="bg-white rounded-xl p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-bold text-red-600 mb-1">完全清理（包括登录状态）</h3>
                <p class="text-sm text-gray-600">清理所有数据，将退出登录</p>
              </div>
              <button @click="clearAllForce" 
                      class="btn bg-red-500 hover:bg-red-600 text-white border-none ml-4">
                强制清理
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 返回按钮 -->
      <div class="mt-6 text-center">
        <button @click="$router.back()" 
                class="btn btn-lg btn-outline">
          ← 返回
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { CacheManager, CacheType } from '@/utils/cacheManager'

const router = useRouter()

// 统计数据
const stats = ref({
  total: 0,
  byType: {} as Record<string, number>,
  size: 0
})

const appVersion = ref('1.0.6')

// 刷新统计
const refreshStats = () => {
  stats.value = CacheManager.getStats()
  console.log('📊 缓存统计已刷新')
}

// 清理过期缓存
const cleanExpired = () => {
  CacheManager.cleanExpired()
  refreshStats()
  alert('✅ 过期缓存已清理！')
}

// 智能清理
const smartClean = () => {
  CacheManager.smartCleanup()
  refreshStats()
  alert('✅ 智能清理完成！')
}

// 清理指定类型
const clearType = (type: string) => {
  if (!confirm(`确认清理 ${type} 类型的所有缓存？`)) return
  
  CacheManager.clearType(type as CacheType)
  refreshStats()
  alert(`✅ ${type} 缓存已清理！`)
}

// 清理所有缓存（保留登录）
const clearAllKeepAuth = async () => {
  if (!confirm('确认清理所有缓存？（将保留登录状态）')) return
  
  await CacheManager.clearAll(false)
  refreshStats()
  alert('✅ 缓存已清理！\n页面将刷新...')
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

// 强制清理所有缓存
const clearAllForce = async () => {
  if (!confirm('⚠️ 警告！\n\n此操作将清理所有数据，包括登录状态！\n是否继续？')) return
  if (!confirm('⚠️ 最后确认！\n\n您将被退出登录，所有本地数据将被清空！')) return
  
  await CacheManager.clearAll(true)
  alert('✅ 缓存已完全清理！\n页面将刷新并跳转到登录页...')
  setTimeout(() => {
    window.location.href = '/login'
  }, 1000)
}

// 初始化
onMounted(() => {
  refreshStats()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

