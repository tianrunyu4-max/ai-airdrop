<template>
  <div class="space-y-6">
    <!-- 搜索和筛选 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex flex-wrap gap-4">
          <!-- 搜索 -->
          <div class="form-control flex-1 min-w-[200px]">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索用户名或邀请码"
              class="input input-bordered"
              @input="handleSearch"
            />
          </div>

          <!-- 筛选 -->
          <select v-model="filterType" class="select select-bordered" @change="loadUsers">
            <option value="all">全部用户</option>
            <option value="agent">代理用户</option>
            <option value="non_agent">普通用户</option>
          </select>

          <!-- 刷新 -->
          <button class="btn btn-outline btn-primary" @click="loadUsers">
            <ArrowPathIcon class="w-5 h-5" />
            刷新
          </button>
        </div>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedUsers.length > 0" class="card bg-info text-info-content shadow-lg">
      <div class="card-body py-3">
        <div class="flex items-center gap-4">
          <span class="font-semibold">已选择 {{ selectedUsers.length }} 个用户</span>
          <div class="flex gap-2 ml-auto">
            <button class="btn btn-sm btn-outline" @click="showBatchBalanceModal = true">
              💰 批量调整余额
            </button>
            <button class="btn btn-sm btn-outline" @click="showBatchRewardModal = true">
              🎁 批量发放奖励
            </button>
            <button class="btn btn-sm btn-outline" @click="showBatchStatusModal = true">
              👥 批量设置类型
            </button>
            <button class="btn btn-sm btn-ghost" @click="clearSelection">
              ✕ 取消选择
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h3 class="card-title">
          用户列表
          <div class="badge badge-primary">共 {{ total }} 人</div>
        </h3>

        <!-- 表格 -->
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    class="checkbox checkbox-primary" 
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th>用户名</th>
                <th>邀请码</th>
                <th>类型</th>
                <th>直推人数</th>
                <th>U余额</th>
                <th>总收益</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>
                  <input 
                    type="checkbox" 
                    class="checkbox checkbox-primary" 
                    :checked="selectedUsers.includes(user.id)"
                    @change="toggleUserSelection(user.id)"
                  />
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="avatar placeholder">
                      <div class="bg-primary text-primary-content rounded-full w-8">
                        <span class="text-xs">{{ user.username[0] }}</span>
                      </div>
                    </div>
                    <span>{{ user.username }}</span>
                  </div>
                </td>
                <td>
                  <span class="font-mono text-sm">{{ user.invite_code }}</span>
                </td>
                <td>
                  <span class="badge" :class="{
                    'badge-success': user.is_agent,
                    'badge-ghost': !user.is_agent
                  }">
                    {{ user.is_agent ? '代理' : '普通' }}
                  </span>
                </td>
                <td>{{ user.direct_referral_count }}</td>
                <td>{{ user.u_balance.toFixed(2) }} U</td>
                <td>{{ user.total_earnings.toFixed(2) }} U</td>
                <td>{{ formatDate(user.created_at) }}</td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-xs btn-primary" @click="viewUserDetail(user)">
                      详情
                    </button>
                    <button class="btn btn-xs btn-outline" @click="adjustBalance(user)">
                      调整余额
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

    <!-- 用户详情模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showDetailModal }">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">用户详情</h3>
        <div v-if="selectedUser" class="space-y-4">
          <!-- 基本信息 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">
                <span class="label-text">用户名</span>
              </label>
              <input type="text" :value="selectedUser.username" class="input input-bordered w-full" readonly />
            </div>
            <div>
              <label class="label">
                <span class="label-text">邀请码</span>
              </label>
              <input type="text" :value="selectedUser.invite_code" class="input input-bordered w-full" readonly />
            </div>
          </div>

          <!-- 财务信息 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">
                <span class="label-text">U余额</span>
              </label>
              <input type="text" :value="selectedUser.u_balance.toFixed(2) + ' U'" class="input input-bordered w-full" readonly />
            </div>
          </div>

          <!-- 团队信息 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">
                <span class="label-text">直推人数</span>
              </label>
              <input type="text" :value="selectedUser.direct_referral_count" class="input input-bordered w-full" readonly />
            </div>
            <div>
              <label class="label">
                <span class="label-text">总收益</span>
              </label>
              <input type="text" :value="selectedUser.total_earnings.toFixed(2) + ' U'" class="input input-bordered w-full" readonly />
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showDetailModal = false">关闭</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showDetailModal = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- 调整余额模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showAdjustModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">调整余额</h3>
        <div v-if="selectedUser" class="space-y-4">
          <div>
            <label class="label">
              <span class="label-text">用户</span>
            </label>
            <input type="text" :value="selectedUser.username" class="input input-bordered w-full" readonly />
          </div>

          <div>
            <label class="label">
              <span class="label-text">调整类型</span>
            </label>
            <select v-model="adjustType" class="select select-bordered w-full">
              <option value="u">U余额</option>
              <option value="points">积分余额</option>
            </select>
          </div>

          <div>
            <label class="label">
              <span class="label-text">调整金额</span>
            </label>
            <input 
              v-model.number="adjustAmount" 
              type="number" 
              step="0.01"
              placeholder="正数增加，负数减少"
              class="input input-bordered w-full" 
            />
          </div>

          <div>
            <label class="label">
              <span class="label-text">备注</span>
            </label>
            <textarea 
              v-model="adjustNote" 
              class="textarea textarea-bordered w-full" 
              placeholder="请填写调整原因"
            ></textarea>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showAdjustModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmAdjust" :disabled="!adjustAmount || !adjustNote">
            确认调整
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showAdjustModal = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- 批量调整余额模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showBatchBalanceModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">批量调整余额</h3>
        <div class="space-y-4">
          <div class="alert alert-info">
            <span>将对 {{ selectedUsers.length }} 个用户进行余额调整</span>
          </div>

          <div>
            <label class="label">
              <span class="label-text">调整类型</span>
            </label>
            <select v-model="batchBalanceType" class="select select-bordered w-full">
              <option value="u">U余额</option>
              <option value="points">积分余额</option>
            </select>
          </div>

          <div>
            <label class="label">
              <span class="label-text">调整金额</span>
            </label>
            <input 
              v-model.number="batchBalanceAmount" 
              type="number" 
              step="0.01"
              placeholder="正数增加，负数减少"
              class="input input-bordered w-full" 
            />
          </div>

          <div>
            <label class="label">
              <span class="label-text">备注</span>
            </label>
            <textarea 
              v-model="batchBalanceNote" 
              class="textarea textarea-bordered w-full" 
              placeholder="请填写调整原因"
            ></textarea>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showBatchBalanceModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmBatchBalance" :disabled="!batchBalanceAmount || !batchBalanceNote">
            确认调整
          </button>
        </div>
      </div>
    </dialog>

    <!-- 批量发放奖励模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showBatchRewardModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">批量发放奖励</h3>
        <div class="space-y-4">
          <div class="alert alert-warning">
            <span>将向 {{ selectedUsers.length }} 个用户发放奖励</span>
          </div>

          <div>
            <label class="label">
              <span class="label-text">奖励类型</span>
            </label>
            <select v-model="batchRewardType" class="select select-bordered w-full">
              <option value="manual">手动发放</option>
              <option value="activity">活动奖励</option>
              <option value="compensation">补偿奖励</option>
              <option value="bonus">额外奖金</option>
            </select>
          </div>

          <div>
            <label class="label">
              <span class="label-text">奖励金额（U）</span>
            </label>
            <input 
              v-model.number="batchRewardAmount" 
              type="number" 
              step="0.01"
              min="0"
              placeholder="每人获得的金额"
              class="input input-bordered w-full" 
            />
          </div>

          <div>
            <label class="label">
              <span class="label-text">说明</span>
            </label>
            <textarea 
              v-model="batchRewardNote" 
              class="textarea textarea-bordered w-full" 
              placeholder="请填写奖励说明"
            ></textarea>
          </div>

          <div class="alert">
            <span>总计发放：{{ (batchRewardAmount * selectedUsers.length).toFixed(2) }} U</span>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showBatchRewardModal = false">取消</button>
          <button class="btn btn-success" @click="confirmBatchReward" :disabled="!batchRewardAmount || !batchRewardNote">
            确认发放
          </button>
        </div>
      </div>
    </dialog>

    <!-- 批量设置类型模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showBatchStatusModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">批量设置用户类型</h3>
        <div class="space-y-4">
          <div class="alert alert-info">
            <span>将对 {{ selectedUsers.length }} 个用户设置类型</span>
          </div>

          <div>
            <label class="label">
              <span class="label-text">用户类型</span>
            </label>
            <select v-model="batchUserType" class="select select-bordered w-full">
              <option value="agent">代理用户</option>
              <option value="normal">普通用户</option>
            </select>
          </div>

          <div v-if="batchUserType === 'agent'" class="alert alert-warning">
            <span>⚠️ 设置为代理后，用户将获得代理权限</span>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showBatchStatusModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmBatchStatus">
            确认设置
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase, isDevMode } from '@/lib/supabase'
import { format } from 'date-fns'
import { useToast } from '@/composables/useToast'
import { AdminService } from '@/services/AdminService'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import type { User } from '@/types'

const toast = useToast()

const searchQuery = ref('')
const filterType = ref('all')
const users = ref<User[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const showDetailModal = ref(false)
const showAdjustModal = ref(false)
const selectedUser = ref<User | null>(null)
const adjustType = ref('u')
const adjustAmount = ref(0)
const adjustNote = ref('')

// 批量操作
const selectedUsers = ref<string[]>([])
const showBatchBalanceModal = ref(false)
const showBatchRewardModal = ref(false)
const showBatchStatusModal = ref(false)
const batchBalanceType = ref('u')
const batchBalanceAmount = ref(0)
const batchBalanceNote = ref('')
const batchRewardType = ref('manual')
const batchRewardAmount = ref(0)
const batchRewardNote = ref('')
const batchUserType = ref('agent')

// 格式化日期
const formatDate = (timestamp: string) => {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm')
}

// 加载用户列表
const loadUsers = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    if (isDevMode) {
      // 开发模式：生成模拟数据
      const mockUsers: User[] = []
      const count = 50
      
      for (let i = 0; i < Math.min(pageSize.value, count); i++) {
        const idx = (page.value - 1) * pageSize.value + i
        if (idx >= count) break
        
        mockUsers.push({
          id: `user-${idx}`,
          username: `user${1000 + idx}`,
          invite_code: `INV${1000 + idx}`,
          is_agent: idx % 3 === 0,
          u_balance: Math.random() * 100,
          transfer_points: Math.random() * 500,
          total_earnings: Math.random() * 500,
          direct_referral_count: Math.floor(Math.random() * 20),
          created_at: new Date(Date.now() - idx * 3600000).toISOString()
        } as User)
      }
      
      users.value = mockUsers
      total.value = count
      return
    }

    // 生产模式
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page.value - 1) * pageSize.value, page.value * pageSize.value - 1)

    // 应用筛选
    if (filterType.value === 'agent') {
      query = query.eq('is_agent', true)
    } else if (filterType.value === 'non_agent') {
      query = query.eq('is_agent', false)
    }

    // 应用搜索
    if (searchQuery.value) {
      query = query.or(`username.ilike.%${searchQuery.value}%,invite_code.ilike.%${searchQuery.value}%`)
    }

    const { data, count, error } = await query

    if (error) throw error

    users.value = data || []
    total.value = count || 0
  } catch (error: any) {
    toast.error(error.message || '加载用户列表失败')
    console.error('Load users error:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  page.value = 1
  loadUsers()
}

// 切换页码
const changePage = (newPage: number) => {
  page.value = newPage
  loadUsers()
}

// 查看用户详情
const viewUserDetail = (user: User) => {
  selectedUser.value = user
  showDetailModal.value = true
}

// 调整余额
const adjustBalance = (user: User) => {
  selectedUser.value = user
  adjustAmount.value = 0
  adjustNote.value = ''
  showAdjustModal.value = true
}

// 确认调整
const confirmAdjust = async () => {
  if (!selectedUser.value || !adjustAmount.value || !adjustNote.value) return

  const loadingToast = toast.info('正在调整余额...', 0)

  try {
    await AdminService.adjustUserBalance(
      selectedUser.value.id,
      adjustType.value as 'u' | 'points',
      adjustAmount.value,
      adjustNote.value
    )

    toast.removeToast(loadingToast)
    toast.success('✅ 余额调整成功！')
    
    showAdjustModal.value = false
    await loadUsers()
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '余额调整失败，请重试')
    console.error('Adjust balance error:', error)
  }
}

// 批量操作相关
const isAllSelected = computed(() => {
  return users.value.length > 0 && selectedUsers.value.length === users.value.length
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedUsers.value = []
  } else {
    selectedUsers.value = users.value.map(u => u.id)
  }
}

const toggleUserSelection = (userId: string) => {
  const index = selectedUsers.value.indexOf(userId)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    selectedUsers.value.push(userId)
  }
}

const clearSelection = () => {
  selectedUsers.value = []
}

// 批量调整余额
const confirmBatchBalance = async () => {
  if (!batchBalanceAmount.value || !batchBalanceNote.value) return

  const confirmed = confirm(`确认对 ${selectedUsers.value.length} 个用户调整余额吗？\n\n调整金额：${batchBalanceAmount.value} U\n备注：${batchBalanceNote.value}`)
  if (!confirmed) return

  const loadingToast = toast.info('⏳ 批量调整中...', 0)

  try {
    let successCount = 0
    let failCount = 0

    for (const userId of selectedUsers.value) {
      try {
        await AdminService.adjustUserBalance(
          userId,
          batchBalanceType.value as 'u' | 'points',
          batchBalanceAmount.value,
          batchBalanceNote.value
        )
        successCount++
      } catch (err) {
        failCount++
      }
    }

    toast.removeToast(loadingToast)
    toast.success(`✅ 批量调整完成！\n成功：${successCount}个\n失败：${failCount}个`)
    
    showBatchBalanceModal.value = false
    selectedUsers.value = []
    batchBalanceAmount.value = 0
    batchBalanceNote.value = ''
    await loadUsers()
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '批量调整失败')
  }
}

// 批量发放奖励
const confirmBatchReward = async () => {
  if (!batchRewardAmount.value || !batchRewardNote.value) return

  const totalAmount = batchRewardAmount.value * selectedUsers.value.length
  const confirmed = confirm(`确认向 ${selectedUsers.value.length} 个用户发放奖励吗？\n\n每人：${batchRewardAmount.value} U\n总计：${totalAmount.toFixed(2)} U\n说明：${batchRewardNote.value}`)
  if (!confirmed) return

  const loadingToast = toast.info('⏳ 批量发放中...', 0)

  try {
    let successCount = 0
    let failCount = 0

    for (const userId of selectedUsers.value) {
      try {
        await AdminService.adjustUserBalance(
          userId,
          'u',
          batchRewardAmount.value,
          `批量奖励（${batchRewardType.value}）：${batchRewardNote.value}`
        )
        successCount++
      } catch (err) {
        failCount++
      }
    }

    toast.removeToast(loadingToast)
    toast.success(`✅ 批量发放完成！\n成功：${successCount}个\n失败：${failCount}个\n总计：${(successCount * batchRewardAmount.value).toFixed(2)} U`)
    
    showBatchRewardModal.value = false
    selectedUsers.value = []
    batchRewardAmount.value = 0
    batchRewardNote.value = ''
    await loadUsers()
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '批量发放失败')
  }
}

// 批量设置类型
const confirmBatchStatus = async () => {
  const isAgent = batchUserType.value === 'agent'
  const confirmed = confirm(`确认将 ${selectedUsers.value.length} 个用户设置为${isAgent ? '代理' : '普通'}用户吗？`)
  if (!confirmed) return

  const loadingToast = toast.info('⏳ 批量设置中...', 0)

  try {
    const { error } = await supabase
      .from('users')
      .update({ is_agent: isAgent })
      .in('id', selectedUsers.value)

    if (error) throw error

    toast.removeToast(loadingToast)
    toast.success(`✅ 批量设置完成！\n已设置 ${selectedUsers.value.length} 个用户为${isAgent ? '代理' : '普通'}用户`)
    
    showBatchStatusModal.value = false
    selectedUsers.value = []
    await loadUsers()
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '批量设置失败')
  }
}

onMounted(() => {
  if (isDevMode) {
    toast.info('用户管理（开发模式）', 2000)
  }
  loadUsers()
})
</script>






