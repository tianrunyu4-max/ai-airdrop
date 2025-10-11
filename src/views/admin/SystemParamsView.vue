<template>
  <div class="min-h-screen bg-gradient-to-br from-yellow-50 to-white p-6">
    <div class="max-w-7xl mx-auto">
      <!-- 页头 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">⚙️ 系统参数配置</h1>
        <p class="text-gray-600">管理所有可配置的系统参数，实时生效</p>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-4 mb-6">
        <button
          @click="loadParams"
          class="btn btn-primary"
          :disabled="loading"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          刷新数据
        </button>

        <button
          @click="saveAllParams"
          class="btn btn-success"
          :disabled="loading || !hasChanges"
        >
          💾 保存所有更改
        </button>

        <button
          @click="cancelChanges"
          class="btn btn-ghost"
          :disabled="!hasChanges"
        >
          取消更改
        </button>
      </div>

      <!-- Binary系统参数 -->
      <div class="card bg-white shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title text-2xl text-yellow-600">
            🔄 Binary对碰系统参数
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <ParamInput
              v-for="param in binaryParams"
              :key="param.param_key"
              :param="param"
              @update="updateParam"
            />
          </div>
        </div>
      </div>

      <!-- AI学习机参数 -->
      <div class="card bg-white shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title text-2xl text-yellow-600">
            🎓 AI学习机参数
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <ParamInput
              v-for="param in miningParams"
              :key="param.param_key"
              :param="param"
              @update="updateParam"
            />
          </div>
        </div>
      </div>

      <!-- 提现参数 -->
      <div class="card bg-white shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title text-2xl text-yellow-600">
            💰 提现参数
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <ParamInput
              v-for="param in withdrawParams"
              :key="param.param_key"
              :param="param"
              @update="updateParam"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { SystemParamsService, type SystemParam } from '@/services/SystemParamsService'
import { useAuthStore } from '@/stores/auth'
import ParamInput from '@/components/admin/ParamInput.vue'

// 简单的消息提示
const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  alert(`${type === 'success' ? '✅' : type === 'error' ? '❌' : '📝'} ${message}`)
}

const authStore = useAuthStore()
const loading = ref(false)
const params = ref<SystemParam[]>([])
const originalParams = ref<Map<string, number>>(new Map())
const pendingChanges = ref<Map<string, number>>(new Map())

// 按分类过滤参数
const binaryParams = computed(() => params.value.filter(p => p.category === 'binary'))
const miningParams = computed(() => params.value.filter(p => p.category === 'mining'))
const withdrawParams = computed(() => params.value.filter(p => p.category === 'withdraw'))

// 是否有未保存的更改
const hasChanges = computed(() => pendingChanges.value.size > 0)

// 加载参数
const loadParams = async () => {
  loading.value = true
  try {
    const result = await SystemParamsService.getAllParams()
    if (result.success && result.data) {
      params.value = result.data
      
      // 保存原始值
      originalParams.value.clear()
      result.data.forEach(p => {
        originalParams.value.set(p.param_key, p.param_value)
      })
      
      // 清除待保存的更改
      pendingChanges.value.clear()
      
      showMessage('参数加载成功', 'success')
    } else {
      showMessage(result.error || '加载参数失败', 'error')
    }
  } catch (error: any) {
    showMessage(error.message || '加载参数失败', 'error')
  } finally {
    loading.value = false
  }
}

// 更新参数（暂存）
const updateParam = (paramKey: string, newValue: number) => {
  const originalValue = originalParams.value.get(paramKey)
  
  if (originalValue === newValue) {
    // 值恢复到原始值，移除待保存项
    pendingChanges.value.delete(paramKey)
  } else {
    // 值有变化，添加到待保存
    pendingChanges.value.set(paramKey, newValue)
  }
  
  // 更新显示值
  const param = params.value.find(p => p.param_key === paramKey)
  if (param) {
    param.param_value = newValue
  }
}

// 保存所有更改
const saveAllParams = async () => {
  if (!hasChanges.value) return
  
  loading.value = true
  try {
    const updates = Array.from(pendingChanges.value.entries()).map(([paramKey, newValue]) => ({
      paramKey,
      newValue
    }))
    
    const result = await SystemParamsService.batchUpdateParams(
      updates,
      authStore.user!.id
    )
    
    if (result.success) {
      showMessage(result.message || '参数更新成功', 'success')
      await loadParams()
    } else {
      showMessage(result.error || '参数更新失败', 'error')
    }
  } catch (error: any) {
    showMessage(error.message || '参数更新失败', 'error')
  } finally {
    loading.value = false
  }
}

// 取消更改
const cancelChanges = () => {
  // 恢复所有原始值
  pendingChanges.value.forEach((_, paramKey) => {
    const param = params.value.find(p => p.param_key === paramKey)
    const originalValue = originalParams.value.get(paramKey)
    
    if (param && originalValue !== undefined) {
      param.param_value = originalValue
    }
  })
  
  pendingChanges.value.clear()
  showMessage('已取消所有更改', 'info')
}

onMounted(() => {
  loadParams()
})
</script>

