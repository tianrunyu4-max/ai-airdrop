<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">💰 充值管理</h2>
      <button @click="loadRecharges" class="btn btn-primary btn-sm">
        🔄 刷新
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats shadow w-full">
      <div class="stat">
        <div class="stat-title">待审核</div>
        <div class="stat-value text-warning">{{ stats.pending }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">已确认</div>
        <div class="stat-value text-success">{{ stats.confirmed }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">已拒绝</div>
        <div class="stat-value text-error">{{ stats.rejected }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">总金额</div>
        <div class="stat-value text-primary">{{ stats.totalAmount.toFixed(2) }} U</div>
      </div>
    </div>

    <!-- 筛选选项 -->
    <div class="flex gap-2">
      <button 
        @click="currentFilter = ''"
        class="btn btn-sm"
        :class="currentFilter === '' ? 'btn-primary' : 'btn-ghost'"
      >
        全部 ({{ allRecharges.length }})
      </button>
      <button 
        @click="currentFilter = 'pending'"
        class="btn btn-sm"
        :class="currentFilter === 'pending' ? 'btn-warning' : 'btn-ghost'"
      >
        待审核 ({{ stats.pending }})
      </button>
      <button 
        @click="currentFilter = 'confirmed'"
        class="btn btn-sm"
        :class="currentFilter === 'confirmed' ? 'btn-success' : 'btn-ghost'"
      >
        已确认 ({{ stats.confirmed }})
      </button>
      <button 
        @click="currentFilter = 'rejected'"
        class="btn btn-sm"
        :class="currentFilter === 'rejected' ? 'btn-error' : 'btn-ghost'"
      >
        已拒绝 ({{ stats.rejected }})
      </button>
    </div>

    <!-- 充值记录列表 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div v-if="loading" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="filteredRecharges.length === 0" class="text-center py-8 text-gray-500">
          暂无充值记录
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>用户</th>
                <th>金额</th>
                <th>网络</th>
                <th>交易哈希</th>
                <th>时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="recharge in filteredRecharges" :key="recharge.id">
                <td>
                  <div>
                    <div class="font-bold">{{ recharge.user?.username || '未知用户' }}</div>
                    <div class="text-xs text-gray-500">{{ recharge.user?.phone }}</div>
                  </div>
                </td>
                <td>
                  <div class="font-bold text-lg">{{ recharge.amount }} USDT</div>
                </td>
                <td>
                  <span class="badge" :class="recharge.network === 'TRC20' ? 'badge-error' : 'badge-warning'">
                    {{ recharge.network }}
                  </span>
                </td>
                <td>
                  <div v-if="recharge.txid" class="font-mono text-xs max-w-xs truncate" :title="recharge.txid">
                    {{ recharge.txid }}
                  </div>
                  <span v-else class="text-gray-400">未填写</span>
                </td>
                <td>
                  <div class="text-xs">
                    {{ formatDateTime(recharge.created_at) }}
                  </div>
                </td>
                <td>
                  <span class="badge" 
                    :class="{
                      'badge-warning': recharge.status === 'pending',
                      'badge-success': recharge.status === 'confirmed',
                      'badge-error': recharge.status === 'rejected'
                    }"
                  >
                    {{ getStatusText(recharge.status) }}
                  </span>
                </td>
                <td>
                  <div v-if="recharge.status === 'pending'" class="flex gap-1">
                    <button 
                      @click="openConfirmModal(recharge)"
                      class="btn btn-success btn-xs"
                    >
                      ✅ 确认
                    </button>
                    <button 
                      @click="openRejectModal(recharge)"
                      class="btn btn-error btn-xs"
                    >
                      ❌ 拒绝
                    </button>
                  </div>
                  <div v-else class="text-xs text-gray-500">
                    <div v-if="recharge.confirmed_at">
                      {{ formatDateTime(recharge.confirmed_at) }}
                    </div>
                    <div v-if="recharge.admin_note" class="tooltip" :data-tip="recharge.admin_note">
                      📝 备注
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 确认充值模态框 -->
    <div v-if="showConfirmModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800">✅ 确认充值</h3>
          <button @click="showConfirmModal = false" class="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>

        <div v-if="selectedRecharge" class="space-y-4">
          <div class="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <p><strong>用户:</strong> {{ selectedRecharge.user?.username }}</p>
              <p><strong>金额:</strong> {{ selectedRecharge.amount }} USDT</p>
              <p><strong>网络:</strong> {{ selectedRecharge.network }}</p>
            </div>
          </div>

          <div>
            <label class="label"><span class="label-text">备注 (可选)</span></label>
            <textarea 
              v-model="confirmNote"
              class="textarea textarea-bordered w-full"
              placeholder="填写确认备注..."
              rows="3"
            ></textarea>
          </div>

          <div class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div class="text-sm">
              确认后将自动增加用户余额，请仔细核对！
            </div>
          </div>

          <div class="flex gap-2">
            <button @click="showConfirmModal = false" class="btn btn-ghost flex-1">取消</button>
            <button @click="confirmRecharge" class="btn btn-success flex-1" :disabled="processing">
              <span v-if="!processing">✅ 确认充值</span>
              <span v-else class="loading loading-spinner"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 拒绝充值模态框 -->
    <div v-if="showRejectModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800">❌ 拒绝充值</h3>
          <button @click="showRejectModal = false" class="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>

        <div v-if="selectedRecharge" class="space-y-4">
          <div class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p><strong>用户:</strong> {{ selectedRecharge.user?.username }}</p>
              <p><strong>金额:</strong> {{ selectedRecharge.amount }} USDT</p>
            </div>
          </div>

          <div>
            <label class="label"><span class="label-text font-bold">拒绝原因 (必填)</span></label>
            <textarea 
              v-model="rejectNote"
              class="textarea textarea-bordered w-full"
              placeholder="请填写拒绝原因..."
              rows="3"
            ></textarea>
          </div>

          <div class="flex gap-2">
            <button @click="showRejectModal = false" class="btn btn-ghost flex-1">取消</button>
            <button @click="rejectRecharge" class="btn btn-error flex-1" :disabled="processing || !rejectNote">
              <span v-if="!processing">❌ 确认拒绝</span>
              <span v-else class="loading loading-spinner"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RechargeService } from '@/services/RechargeService'

const loading = ref(false)
const processing = ref(false)
const allRecharges = ref<any[]>([])
const currentFilter = ref('')
const showConfirmModal = ref(false)
const showRejectModal = ref(false)
const selectedRecharge = ref<any>(null)
const confirmNote = ref('')
const rejectNote = ref('')

// 统计数据
const stats = computed(() => {
  const pending = allRecharges.value.filter(r => r.status === 'pending').length
  const confirmed = allRecharges.value.filter(r => r.status === 'confirmed').length
  const rejected = allRecharges.value.filter(r => r.status === 'rejected').length
  const totalAmount = allRecharges.value
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  return { pending, confirmed, rejected, totalAmount }
})

// 过滤后的充值记录
const filteredRecharges = computed(() => {
  if (!currentFilter.value) return allRecharges.value
  return allRecharges.value.filter(r => r.status === currentFilter.value)
})

// 加载充值记录
const loadRecharges = async () => {
  try {
    loading.value = true
    allRecharges.value = await RechargeService.getAllRecharges()
  } catch (error) {
    console.error('加载充值记录失败:', error)
    alert('❌ 加载失败')
  } finally {
    loading.value = false
  }
}

// 打开确认模态框
const openConfirmModal = (recharge: any) => {
  selectedRecharge.value = recharge
  confirmNote.value = ''
  showConfirmModal.value = true
}

// 打开拒绝模态框
const openRejectModal = (recharge: any) => {
  selectedRecharge.value = recharge
  rejectNote.value = ''
  showRejectModal.value = true
}

// 确认充值
const confirmRecharge = async () => {
  if (!selectedRecharge.value) return

  try {
    processing.value = true
    const result = await RechargeService.confirmRecharge(
      selectedRecharge.value.id,
      confirmNote.value
    )

    if (result.success) {
      alert('✅ 充值已确认！用户余额已更新')
      showConfirmModal.value = false
      await loadRecharges()
    } else {
      alert(`❌ 确认失败: ${result.error}`)
    }
  } catch (error: any) {
    alert(`❌ 确认失败: ${error.message}`)
  } finally {
    processing.value = false
  }
}

// 拒绝充值
const rejectRecharge = async () => {
  if (!selectedRecharge.value || !rejectNote.value) {
    alert('请填写拒绝原因')
    return
  }

  try {
    processing.value = true
    const result = await RechargeService.rejectRecharge(
      selectedRecharge.value.id,
      rejectNote.value
    )

    if (result.success) {
      alert('✅ 已拒绝充值')
      showRejectModal.value = false
      await loadRecharges()
    } else {
      alert(`❌ 拒绝失败: ${result.error}`)
    }
  } catch (error: any) {
    alert(`❌ 拒绝失败: ${error.message}`)
  } finally {
    processing.value = false
  }
}

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    confirmed: '已确认',
    rejected: '已拒绝'
  }
  return statusMap[status] || status
}

onMounted(() => {
  loadRecharges()
})
</script>

