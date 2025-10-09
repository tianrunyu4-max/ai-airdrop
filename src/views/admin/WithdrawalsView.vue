<template>
  <div class="space-y-6">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">待审核</div>
        <div class="stat-value text-warning">{{ stats.pending }}</div>
        <div class="stat-desc">金额 {{ stats.pendingAmount }} U</div>
      </div>
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">今日已审核</div>
        <div class="stat-value text-success">{{ stats.todayApproved }}</div>
        <div class="stat-desc">金额 {{ stats.todayApprovedAmount }} U</div>
      </div>
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">总提现</div>
        <div class="stat-value text-primary">{{ stats.total }}</div>
        <div class="stat-desc">金额 {{ stats.totalAmount }} U</div>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex flex-wrap gap-4">
          <select v-model="filterStatus" class="select select-bordered" @change="loadWithdrawals">
            <option value="all">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
            <option value="completed">已完成</option>
          </select>

          <button class="btn btn-outline btn-primary" @click="loadWithdrawals">
            <ArrowPathIcon class="w-5 h-5" />
            刷新
          </button>
        </div>
      </div>
    </div>

    <!-- 提现列表 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h3 class="card-title">提现申请列表</h3>

        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>申请时间</th>
                <th>用户</th>
                <th>金额</th>
                <th>钱包地址</th>
                <th>状态</th>
                <th>处理时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="withdrawal in withdrawals" :key="withdrawal.id">
                <td>{{ formatTime(withdrawal.applied_at) }}</td>
                <td>
                  <div class="font-semibold">{{ withdrawal.username }}</div>
                  <div class="text-xs text-base-content/60">{{ withdrawal.user_id }}</div>
                </td>
                <td>
                  <span class="font-bold text-primary">{{ withdrawal.amount }} U</span>
                </td>
                <td>
                  <div class="font-mono text-xs max-w-[200px] truncate" :title="withdrawal.wallet_address">
                    {{ withdrawal.wallet_address }}
                  </div>
                </td>
                <td>
                  <span class="badge" :class="{
                    'badge-warning': withdrawal.status === 'pending',
                    'badge-success': withdrawal.status === 'approved' || withdrawal.status === 'completed',
                    'badge-error': withdrawal.status === 'rejected'
                  }">
                    {{ getStatusText(withdrawal.status) }}
                  </span>
                </td>
                <td>{{ withdrawal.processed_at ? formatTime(withdrawal.processed_at) : '-' }}</td>
                <td>
                  <div class="flex gap-2">
                    <button 
                      v-if="withdrawal.status === 'pending'"
                      class="btn btn-xs btn-success"
                      @click="handleApprove(withdrawal)"
                    >
                      通过
                    </button>
                    <button 
                      v-if="withdrawal.status === 'pending'"
                      class="btn btn-xs btn-error"
                      @click="handleReject(withdrawal)"
                    >
                      拒绝
                    </button>
                    <button 
                      class="btn btn-xs btn-outline"
                      @click="viewDetail(withdrawal)"
                    >
                      详情
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="flex justify-center mt-6">
          <div class="join">
            <button 
              class="join-item btn btn-sm" 
              :disabled="page === 1"
              @click="changePage(page - 1)"
            >
              «
            </button>
            <button class="join-item btn btn-sm">第 {{ page }} 页</button>
            <button 
              class="join-item btn btn-sm"
              :disabled="page * pageSize >= total"
              @click="changePage(page + 1)"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情/备注模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showDetailModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">提现详情</h3>
        <div v-if="selectedWithdrawal" class="space-y-4">
          <div>
            <label class="label">
              <span class="label-text">用户名</span>
            </label>
            <input type="text" :value="selectedWithdrawal.username" class="input input-bordered w-full" readonly />
          </div>
          <div>
            <label class="label">
              <span class="label-text">提现金额</span>
            </label>
            <input type="text" :value="selectedWithdrawal.amount + ' U'" class="input input-bordered w-full" readonly />
          </div>
          <div>
            <label class="label">
              <span class="label-text">钱包地址</span>
            </label>
            <input type="text" :value="selectedWithdrawal.wallet_address" class="input input-bordered w-full" readonly />
          </div>
          <div v-if="selectedWithdrawal.status === 'pending'">
            <label class="label">
              <span class="label-text">审核备注</span>
            </label>
            <textarea 
              v-model="adminNote"
              class="textarea textarea-bordered w-full"
              placeholder="填写审核备注（可选）"
            ></textarea>
          </div>
          <div v-if="selectedWithdrawal.admin_note">
            <label class="label">
              <span class="label-text">审核备注</span>
            </label>
            <div class="p-3 bg-base-200 rounded">{{ selectedWithdrawal.admin_note }}</div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showDetailModal = false">关闭</button>
          <button 
            v-if="selectedWithdrawal?.status === 'pending'"
            class="btn btn-error"
            @click="confirmReject"
          >
            拒绝
          </button>
          <button 
            v-if="selectedWithdrawal?.status === 'pending'"
            class="btn btn-success"
            @click="confirmApprove"
          >
            通过
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showDetailModal = false">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { isDevMode } from '@/lib/supabase'
import { format } from 'date-fns'
import { useToast } from '@/composables/useToast'
import { WithdrawalService } from '@/services'  // ← 使用重构后的Service
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

const toast = useToast()

const filterStatus = ref('all')
const withdrawals = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const stats = ref({
  pending: 0,
  pendingAmount: 0,
  todayApproved: 0,
  todayApprovedAmount: 0,
  total: 0,
  totalAmount: 0
})

const showDetailModal = ref(false)
const selectedWithdrawal = ref<any>(null)
const adminNote = ref('')

// 格式化时间
const formatTime = (timestamp: string) => {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm')
}

// 获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    completed: '已完成'
  }
  return map[status] || status
}

// 加载统计数据（使用重构后的WithdrawalService）
const loadStats = async () => {
  try {
    // TODO: 需要添加管理员统计功能
    // const result = await WithdrawalService.getAdminStats()
    // if (result.success) {
    //   stats.value = result.data
    // }
  } catch (error: any) {
    toast.error(error.message || '加载统计数据失败')
    console.error('Load stats error:', error)
  }
}

// 加载提现列表（使用重构后的WithdrawalService）
const loadWithdrawals = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    const status = filterStatus.value === 'all' ? undefined : filterStatus.value
    const offset = (page.value - 1) * pageSize.value
    
    const result = await WithdrawalService.getAllWithdrawals(status, pageSize.value, offset)
    
    if (result.success && result.data) {
      withdrawals.value = result.data
      total.value = result.data.length // 注意：这里可能需要单独的count API
    } else {
      toast.error(result.error || '加载提现列表失败')
    }
  } catch (error: any) {
    toast.error(error.message || '加载提现列表失败')
    console.error('Load withdrawals error:', error)
  } finally {
    loading.value = false
  }
}

// 切换页码
const changePage = (newPage: number) => {
  page.value = newPage
  loadWithdrawals()
}

// 查看详情
const viewDetail = (withdrawal: any) => {
  selectedWithdrawal.value = withdrawal
  adminNote.value = withdrawal.admin_note || ''
  showDetailModal.value = true
}

// 通过
const handleApprove = (withdrawal: any) => {
  selectedWithdrawal.value = withdrawal
  adminNote.value = ''
  showDetailModal.value = true
}

// 拒绝
const handleReject = (withdrawal: any) => {
  selectedWithdrawal.value = withdrawal
  adminNote.value = ''
  showDetailModal.value = true
}

// 确认通过（使用重构后的WithdrawalService）
const confirmApprove = async () => {
  if (!selectedWithdrawal.value) return

  const loadingToast = toast.info('正在审核...', 0)

  try {
    const result = await WithdrawalService.reviewWithdrawal(
      selectedWithdrawal.value.id,
      true,
      adminNote.value || '审核通过'
    )

    toast.removeToast(loadingToast)
    
    if (result.success) {
      toast.success('✅ 审核通过！')
      showDetailModal.value = false
      await Promise.all([loadWithdrawals(), loadStats()])
    } else {
      toast.error(result.error || '操作失败，请重试')
    }
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '操作失败，请重试')
    console.error('Approve error:', error)
  }
}

// 确认拒绝（使用重构后的WithdrawalService - 自动退款）
const confirmReject = async () => {
  if (!selectedWithdrawal.value) return

  if (!adminNote.value) {
    toast.warning('请填写拒绝原因')
    return
  }

  const loadingToast = toast.info('正在拒绝并退款...', 0)

  try {
    const result = await WithdrawalService.reviewWithdrawal(
      selectedWithdrawal.value.id,
      false,
      adminNote.value
    )

    toast.removeToast(loadingToast)
    
    if (result.success) {
      toast.success('✅ 已拒绝并自动退还金额')
      showDetailModal.value = false
      await Promise.all([loadWithdrawals(), loadStats()])
    } else {
      toast.error(result.error || '操作失败，请重试')
    }
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '操作失败，请重试')
    console.error('Reject error:', error)
  }
}

onMounted(() => {
  if (isDevMode) {
    toast.info('提现管理（开发模式）', 2000)
  }
  loadStats()
  loadWithdrawals()
})
</script>






