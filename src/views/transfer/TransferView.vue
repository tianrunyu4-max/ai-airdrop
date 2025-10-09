<template>
  <div class="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-yellow-50 pb-20">
    <!-- 顶部标题 -->
    <div class="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 p-6 pb-8">
      <h1 class="text-white text-2xl font-bold">💸 互转中心</h1>
      <p class="text-yellow-100 text-sm mt-1">用户间U和积分互转</p>
    </div>

    <!-- 余额卡片 -->
    <div class="px-4 -mt-4">
      <div class="bg-white rounded-2xl p-6 shadow-xl border-2 border-yellow-200">
        <div class="grid grid-cols-2 gap-4">
          <!-- U余额 -->
          <div class="text-center">
            <div class="text-gray-600 text-xs mb-1">U余额</div>
            <div class="text-yellow-600 text-2xl font-bold">{{ user?.u_balance.toFixed(2) || '0.00' }}</div>
            <div class="text-blue-600 text-xs mt-1">USDT</div>
          </div>
          
          <!-- 互转积分 -->
          <div class="text-center">
            <div class="text-gray-600 text-xs mb-1">互转积分</div>
            <div class="text-yellow-600 text-2xl font-bold">{{ user?.transfer_points.toFixed(2) || '0.00' }}</div>
            <div class="text-green-600 text-xs mt-1">可互转</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能选项卡 -->
    <div class="px-4 mt-6">
      <div class="flex gap-2 bg-white rounded-xl p-2 border-2 border-yellow-200">
        <button 
          class="flex-1 py-2 px-4 rounded-lg font-medium transition-all" 
          :class="activeTab === 'transfer' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md' : 'text-gray-600 hover:bg-yellow-50'"
          @click="activeTab = 'transfer'"
        >
          转账
        </button>
        <button 
          class="flex-1 py-2 px-4 rounded-lg font-medium transition-all" 
          :class="activeTab === 'history' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md' : 'text-gray-600 hover:bg-yellow-50'"
          @click="activeTab = 'history'"
        >
          记录
        </button>
      </div>
    </div>

    <!-- 转账表单 -->
    <div v-show="activeTab === 'transfer'" class="px-4 mt-6">
      <div class="bg-white rounded-2xl p-6 border-2 border-yellow-200 shadow-lg">
        <h3 class="text-gray-800 text-lg font-bold mb-4">发起互转</h3>

        <!-- 转账类型选择 -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text text-gray-700 font-medium">互转类型</span>
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="transferType = 'u'"
              class="btn"
              :class="transferType === 'u' ? 'btn-primary' : 'btn-ghost'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              U余额
            </button>
            <button
              @click="transferType = 'transfer_points'"
              class="btn"
              :class="transferType === 'transfer_points' ? 'btn-primary' : 'btn-ghost'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              互转积分
            </button>
          </div>
        </div>

        <!-- 接收方用户名 -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text text-gray-700 font-medium">接收方用户名</span>
            <span 
              v-if="receiverUser"
              class="label-text-alt text-green-400"
            >
              ✓ 用户存在
            </span>
          </label>
          <input 
            v-model="receiverUsername" 
            @blur="validateReceiver"
            type="text" 
            class="input input-bordered bg-yellow-50 border-yellow-300 text-gray-800 focus:border-yellow-500" 
            placeholder="请输入对方用户名"
          />
          <label class="label" v-if="receiverError">
            <span class="label-text-alt text-error">{{ receiverError }}</span>
          </label>
        </div>

        <!-- 转账金额 -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text text-gray-700 font-medium">转账金额</span>
            <span class="label-text-alt text-gray-400">
              可用: {{ availableBalance.toFixed(2) }}
            </span>
          </label>
          <input 
            v-model.number="transferAmount" 
            type="number" 
            min="1"
            step="1"
            class="input input-bordered bg-yellow-50 border-yellow-300 text-gray-800 focus:border-yellow-500" 
            placeholder="请输入转账金额"
          />
        </div>

        <!-- 备注 -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text text-gray-700 font-medium">备注（可选）</span>
          </label>
          <input 
            v-model="transferRemark" 
            type="text" 
            class="input input-bordered bg-yellow-50 border-yellow-300 text-gray-800 focus:border-yellow-500" 
            placeholder="请输入备注信息"
            maxlength="50"
          />
        </div>

        <!-- 确认信息 -->
        <div v-if="isValidTransfer" class="bg-purple-900/30 rounded-lg p-4 mb-4">
          <div class="text-sm text-gray-300 space-y-2">
            <div class="flex justify-between">
              <span>转账类型：</span>
              <span class="text-white font-bold">{{ transferType === 'u' ? 'U余额' : '互转积分' }}</span>
            </div>
            <div class="flex justify-between">
              <span>接收方：</span>
              <span class="text-white font-bold">{{ receiverUsername }}</span>
            </div>
            <div class="flex justify-between">
              <span>转账金额：</span>
              <span class="text-white font-bold">{{ transferAmount }}</span>
            </div>
            <div class="flex justify-between">
              <span>手续费：</span>
              <span class="text-green-400 font-bold">0（免费）</span>
            </div>
            <div class="flex justify-between">
              <span>实际到账：</span>
              <span class="text-green-400 font-bold text-lg">{{ transferAmount }}</span>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <button
          @click="submitTransfer"
          :disabled="!isValidTransfer"
          class="btn btn-primary w-full"
        >
          确认转账
        </button>
      </div>
    </div>

    <!-- 转账记录 -->
    <div v-show="activeTab === 'history'" class="px-4 mt-6">
      <!-- 筛选选项 -->
      <div class="flex gap-2 mb-4">
        <button
          v-for="filter in historyFilters"
          :key="filter.value"
          @click="historyFilter = filter.value"
          class="btn btn-sm"
          :class="historyFilter === filter.value ? 'btn-primary' : 'btn-ghost'"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- 记录列表 -->
      <div v-if="transferHistory.length > 0" class="space-y-3">
        <div 
          v-for="record in transferHistory" 
          :key="record.id"
          class="bg-gray-800 rounded-xl p-4"
        >
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="font-bold text-white">
                <span v-if="record.type === 'transfer_out' || record.type === 'points_transfer_out'">
                  ↑ 转出{{ record.currency === 'U' ? 'U' : '积分' }}
                </span>
                <span v-else class="text-green-400">
                  ↓ 收到{{ record.currency === 'U' ? 'U' : '积分' }}
                </span>
              </div>
              <div class="text-xs text-gray-400 mt-1">
                {{ format(new Date(record.created_at), 'yyyy-MM-dd HH:mm:ss') }}
              </div>
            </div>
            <div 
              class="badge"
              :class="record.type.includes('out') ? 'badge-warning' : 'badge-success'"
            >
              {{ record.type.includes('out') ? '转出' : '收到' }}
            </div>
          </div>
          
          <div class="text-sm text-gray-300 mb-2">
            {{ record.description }}
          </div>
          
          <div class="flex justify-between items-center">
            <span 
              class="font-bold text-lg"
              :class="record.type.includes('out') ? 'text-red-400' : 'text-green-400'"
            >
              {{ record.type.includes('out') ? '-' : '+' }}{{ record.amount?.toFixed(2) || '0.00' }}
            </span>
            <span class="text-xs text-gray-400">余额: {{ record.balance_after?.toFixed(2) || '0.00' }}</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="bg-gray-800 rounded-xl p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <div class="text-gray-400 mb-2">暂无转账记录</div>
        <div class="text-gray-500 text-sm">快去发起你的第一笔转账吧！</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { TransactionService, UserService } from '@/services'  // ← 使用重构后的Service
import { isDevMode } from '@/lib/supabase'
import type { Transaction, User } from '@/types'
import { format } from 'date-fns'

const authStore = useAuthStore()
const user = computed(() => authStore.user)
const toast = useToast()

// 选项卡
const activeTab = ref<'transfer' | 'history'>('transfer')

// 转账表单
const transferType = ref<'u' | 'transfer_points'>('u')
const receiverUsername = ref('')
const receiverUser = ref<User | null>(null)
const receiverError = ref('')
const transferAmount = ref(0)
const transferRemark = ref('')

// 转账历史
const transferHistory = ref<Transaction[]>([])
const historyFilter = ref<'all' | 'sent' | 'received'>('all')
const historyFilters = [
  { label: '全部', value: 'all' },
  { label: '转出', value: 'sent' },
  { label: '收到', value: 'received' }
]

// 可用余额
const availableBalance = computed(() => {
  if (!user.value) return 0
  return transferType.value === 'u' ? user.value.u_balance : user.value.transfer_points
})

// 验证转账
const isValidTransfer = computed(() => {
  return (
    receiverUser.value !== null &&
    !receiverError.value &&
    transferAmount.value >= 1 &&
    transferAmount.value <= availableBalance.value
  )
})

// 验证接收方（使用重构后的UserService）
const validateReceiver = async () => {
  if (!receiverUsername.value) {
    receiverError.value = ''
    receiverUser.value = null
    return
  }

  if (receiverUsername.value === user.value?.username) {
    receiverError.value = '不能转账给自己'
    receiverUser.value = null
    return
  }

  try {
    // 使用UserService查找用户
    const result = await UserService.findByUsername(receiverUsername.value)
    
    if (result.success && result.data) {
      receiverUser.value = result.data
      receiverError.value = ''
    } else {
      receiverUser.value = null
      receiverError.value = '用户不存在'
    }
  } catch (error) {
    receiverUser.value = null
    receiverError.value = '查询用户失败'
  }
}

// 提交转账（使用重构后的TransactionService）
const submitTransfer = async () => {
  if (!user.value || !isValidTransfer.value || !receiverUser.value) return

  // 互转积分需要双方都已加入Binary系统
  if (transferType.value === 'transfer_points') {
    if (!user.value.is_agent) {
      toast.error('仅Binary系统成员可以互转积分，请先加入系统（30U）')
      return
    }
    if (!receiverUser.value.is_agent) {
      toast.error(`接收方 ${receiverUsername.value} 还未加入Binary系统，无法接收积分`)
      return
    }
  }

  const confirmMsg = `确认转账？\n类型：${transferType.value === 'u' ? 'U余额' : '互转积分'}\n接收方：${receiverUsername.value}\n金额：${transferAmount.value}\n${transferRemark.value ? `备注：${transferRemark.value}` : ''}`
  
  if (!confirm(confirmMsg)) {
    return
  }

  const loadingToast = toast.info('正在处理转账...', 0)

  try {
    // 使用TransactionService执行转账（自动验证+流水+回滚）
    let result
    
    if (transferType.value === 'u') {
      // U转账
      result = await TransactionService.transferU({
        fromUserId: user.value.id,
        toUserId: receiverUser.value.id,
        amount: transferAmount.value,
        description: transferRemark.value || `转账给 ${receiverUsername.value}`
      })
    } else {
      // 积分转账
      result = await TransactionService.transferPoints({
        fromUserId: user.value.id,
        toUserId: receiverUser.value.id,
        amount: transferAmount.value,
        description: transferRemark.value || `转账积分给 ${receiverUsername.value}`
      })
    }

    if (result.success) {
      // 更新本地余额
      if (transferType.value === 'u') {
        user.value.u_balance -= transferAmount.value
      } else {
        user.value.transfer_points -= transferAmount.value
      }

      // 同步localStorage
      localStorage.setItem('current_user', JSON.stringify(user.value))

      toast.removeToast(loadingToast)
      toast.success(`✨ 转账成功！已转出 ${transferAmount.value} ${transferType.value === 'u' ? 'U' : '积分'}`, 4000)

      // 重置表单
      receiverUsername.value = ''
      receiverUser.value = null
      transferAmount.value = 0
      transferRemark.value = ''
      
      // 重新加载历史记录
      await loadTransferHistory()
      
      // 切换到历史记录
      activeTab.value = 'history'
    } else {
      toast.removeToast(loadingToast)
      toast.error(result.error || '转账失败，请稍后重试')
    }
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '转账失败，请稍后重试')
    console.error('Transfer error:', error)
  }
}

// 加载转账历史（使用重构后的TransactionService）
const loadTransferHistory = async () => {
  if (!user.value?.id) return

  try {
    const result = await TransactionService.getUserTransactions(user.value.id, 50)
    
    if (result.success && result.data) {
      // 过滤出转账相关的记录
      transferHistory.value = result.data.filter(t => 
        t.type === 'transfer_out' || 
        t.type === 'transfer_in' ||
        t.type === 'points_transfer_out' ||
        t.type === 'points_transfer_in'
      )
    }
  } catch (error) {
    console.error('加载转账历史失败:', error)
  }
}

onMounted(() => {
  loadTransferHistory()
})
</script>

