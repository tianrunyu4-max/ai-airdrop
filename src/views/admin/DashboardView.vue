<template>
  <div class="space-y-6">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- 总用户数 -->
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-primary">
          <UsersIcon class="w-8 h-8" />
        </div>
        <div class="stat-title">总用户数</div>
        <div class="stat-value text-primary">{{ stats.totalUsers }}</div>
        <div class="stat-desc">今日新增 {{ stats.todayNewUsers }} 人</div>
      </div>

      <!-- 代理用户数 -->
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-secondary">
          <UserGroupIcon class="w-8 h-8" />
        </div>
        <div class="stat-title">代理用户</div>
        <div class="stat-value text-secondary">{{ stats.totalAgents }}</div>
        <div class="stat-desc">付费率 {{ stats.agentRate }}%</div>
      </div>

      <!-- 待审核提现 -->
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-warning">
          <ExclamationTriangleIcon class="w-8 h-8" />
        </div>
        <div class="stat-title">待审核提现</div>
        <div class="stat-value text-warning">{{ stats.pendingWithdrawals }}</div>
        <div class="stat-desc">金额 {{ stats.pendingAmount }} U</div>
      </div>

      <!-- 活跃矿机 -->
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-info">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div class="stat-title">活跃矿机</div>
        <div class="stat-value text-info">{{ stats.activeMachines }}</div>
        <div class="stat-desc">累计产出 {{ stats.totalMiningOutput.toFixed(2) }}</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 用户增长趋势 -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h3 class="card-title">用户增长趋势</h3>
          <div class="h-64 flex items-center justify-center text-base-content/40">
            <div class="text-center">
              <ChartBarIcon class="w-16 h-16 mx-auto mb-2" />
              <p>图表组件待集成（可使用 Chart.js 或 ECharts）</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 收益统计 -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h3 class="card-title">收益统计</h3>
          <div class="h-64 flex items-center justify-center text-base-content/40">
            <div class="text-center">
              <ChartBarIcon class="w-16 h-16 mx-auto mb-2" />
              <p>图表组件待集成</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新活动 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 最新用户 -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h3 class="card-title">最新注册用户</h3>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>邀请人</th>
                  <th>注册时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in recentUsers" :key="user.id">
                  <td>{{ user.username }}</td>
                  <td>{{ user.inviter || '-' }}</td>
                  <td>{{ formatTime(user.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 最新提现 -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h3 class="card-title">最新提现申请</h3>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>金额</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="withdrawal in recentWithdrawals" :key="withdrawal.id">
                  <td>{{ withdrawal.username }}</td>
                  <td>{{ withdrawal.amount }} U</td>
                  <td>
                    <span class="badge" :class="{
                      'badge-warning': withdrawal.status === 'pending',
                      'badge-success': withdrawal.status === 'approved',
                      'badge-error': withdrawal.status === 'rejected'
                    }">
                      {{ getStatusText(withdrawal.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h3 class="card-title">快速操作</h3>
        <div class="flex flex-wrap gap-4 mt-4">
          <router-link to="/admin/withdrawals" class="btn btn-primary">
            <BanknotesIcon class="w-5 h-5" />
            审核提现
          </router-link>
          <router-link to="/admin/users" class="btn btn-outline btn-primary">
            <UsersIcon class="w-5 h-5" />
            管理用户
          </router-link>
          <router-link to="/admin/system" class="btn btn-outline btn-primary">
            <Cog6ToothIcon class="w-5 h-5" />
            系统设置
          </router-link>
          <button class="btn btn-outline btn-secondary" @click="refreshData">
            <ArrowPathIcon class="w-5 h-5" />
            刷新数据
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { useToast } from '@/composables/useToast'
import { AdminService } from '@/services/AdminService'
import { isDevMode } from '@/lib/supabase'
import {
  UsersIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

const toast = useToast()

// 统计数据
const stats = ref({
  totalUsers: 0,
  todayNewUsers: 0,
  totalAgents: 0,
  agentRate: 0,
  pendingWithdrawals: 0,
  pendingAmount: 0,
  totalRevenue: 0,
  todayRevenue: 0,
  activeMachines: 0,
  totalMiningOutput: 0
})

const recentUsers = ref<any[]>([])
const recentWithdrawals = ref<any[]>([])
const loading = ref(false)

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

// 加载所有数据
const refreshData = async () => {
  if (loading.value) return
  
  loading.value = true
  const loadingToast = toast.info('正在加载数据...', 0)

  try {
    // 并行加载所有数据
    const [dashboardStats, users, withdrawals] = await Promise.all([
      AdminService.getDashboardStats(),
      AdminService.getRecentUsers(5),
      AdminService.getRecentWithdrawals(5)
    ])

    stats.value = dashboardStats
    recentUsers.value = users
    recentWithdrawals.value = withdrawals

    toast.removeToast(loadingToast)
    toast.success('数据加载完成', 2000)
  } catch (error: any) {
    toast.removeToast(loadingToast)
    toast.error(error.message || '加载数据失败')
    console.error('Load data error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isDevMode) {
    toast.info('管理后台（开发模式）', 2000)
  }
  refreshData()
})
</script>






