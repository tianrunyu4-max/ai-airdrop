<template>
  <div class="min-h-screen bg-gradient-to-br from-yellow-50 to-white p-6">
    <div class="max-w-7xl mx-auto">
      <!-- 页头 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">⚙️ 系统参数配置</h1>
        <p class="text-gray-600">管理所有可配置的系统参数，实时生效</p>
      </div>

      <!-- ✅ 参数热更新提示 -->
      <div class="alert alert-success mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <div>
          <h3 class="font-bold">✅ 参数热更新已启用（V4.2）</h3>
          <div class="text-sm mt-1">
            <p>当前参数修改会<strong>保存到数据库</strong>，并在<strong>1分钟内自动生效</strong>。</p>
            <p>✨ 支持动态参数：对碰奖、平级奖、复投阈值等8个核心参数。</p>
            <p class="text-xs mt-2 opacity-75">💡 修改后等待60秒（缓存过期），新参数即可生效，无需重启服务</p>
          </div>
        </div>
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
          💾 保存并应用（1分钟生效）
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

      <!-- 平台联系方式 -->
      <div class="card bg-white shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title text-2xl text-yellow-600">
            📞 平台联系方式配置
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <!-- B站 -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">📺 B站主页</span>
              </label>
              <input
                v-model="contacts.bilibili"
                type="text"
                placeholder="https://space.bilibili.com/..."
                class="input input-bordered"
              />
            </div>

            <!-- YouTube -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">▶️ YouTube频道</span>
              </label>
              <input
                v-model="contacts.youtube"
                type="text"
                placeholder="https://youtube.com/@..."
                class="input input-bordered"
              />
            </div>

            <!-- Telegram -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">✈️ Telegram群组</span>
              </label>
              <input
                v-model="contacts.telegram"
                type="text"
                placeholder="https://t.me/..."
                class="input input-bordered"
              />
            </div>

            <!-- 微信客服 -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">💬 微信客服号</span>
              </label>
              <input
                v-model="contacts.wechat"
                type="text"
                placeholder="微信号"
                class="input input-bordered"
              />
            </div>

            <!-- 视频号 -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">🎬 视频号名称</span>
              </label>
              <input
                v-model="contacts.shipin"
                type="text"
                placeholder="搜索关键词"
                class="input input-bordered"
              />
            </div>

            <!-- TikTok -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">🎵 TikTok账号</span>
              </label>
              <input
                v-model="contacts.tiktok"
                type="text"
                placeholder="@username"
                class="input input-bordered"
              />
            </div>
          </div>

          <div class="mt-6">
            <button
              @click="saveContacts"
              class="btn btn-success w-full"
              :disabled="loading"
            >
              💾 保存联系方式
            </button>
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
import { supabase } from '@/lib/supabase'

// 简单的消息提示
const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  alert(`${type === 'success' ? '✅' : type === 'error' ? '❌' : '📝'} ${message}`)
}

const authStore = useAuthStore()
const loading = ref(false)
const params = ref<SystemParam[]>([])
const originalParams = ref<Map<string, number>>(new Map())
const pendingChanges = ref<Map<string, number>>(new Map())

// 平台联系方式
const contacts = ref({
  bilibili: '',
  youtube: '',
  telegram: '',
  wechat: '',
  shipin: '',
  tiktok: ''
})

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

// 加载平台联系方式
const loadContacts = async () => {
  try {
    const { data } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'platform_contacts')
      .single()
    
    if (data?.value) {
      contacts.value = {
        ...contacts.value,
        ...data.value
      }
    }
  } catch (error) {
    console.log('使用默认联系方式配置')
  }
}

// 保存平台联系方式
const saveContacts = async () => {
  loading.value = true
  try {
    const { error } = await supabase
      .from('system_config')
      .upsert({
        key: 'platform_contacts',
        value: contacts.value,
        description: '平台官方联系方式',
        updated_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    showMessage('联系方式保存成功', 'success')
  } catch (error: any) {
    showMessage(error.message || '保存失败', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadParams()
  loadContacts()
})
</script>

