<template>
  <div class="space-y-6">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">今日见单奖</div>
          <div class="stat-value text-primary">{{ stats.today }}U</div>
          <div class="stat-desc">{{ stats.todayCount }} 笔</div>
        </div>
      </div>
      
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">本周见单奖</div>
          <div class="stat-value text-secondary">{{ stats.week }}U</div>
          <div class="stat-desc">{{ stats.weekCount }} 笔</div>
        </div>
      </div>
      
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">本月见单奖</div>
          <div class="stat-value text-accent">{{ stats.month }}U</div>
          <div class="stat-desc">{{ stats.monthCount }} 笔</div>
        </div>
      </div>
      
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">累计见单奖</div>
          <div class="stat-value">{{ stats.total }}U</div>
          <div class="stat-desc">{{ stats.totalCount }} 笔</div>
        </div>
      </div>
    </div>

    <!-- 筛选和导出 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex flex-wrap gap-4 items-end">
          <div class="form-control">
            <label class="label">
              <span class="label-text">时间范围</span>
            </label>
            <select v-model="timeRange" class="select select-bordered" @change="loadRecords">
              <option value="today">今天</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="all">全部</option>
              <option value="custom">自定义</option>
            </select>
          </div>

          <div v-if="timeRange === 'custom'" class="form-control">
            <label class="label">
              <span class="label-text">开始日期</span>
            </label>
            <input v-model="startDate" type="date" class="input input-bordered" @change="loadRecords" />
          </div>

          <div v-if="timeRange === 'custom'" class="form-control">
            <label class="label">
              <span class="label-text">结束日期</span>
            </label>
            <input v-model="endDate" type="date" class="input input-bordered" @change="loadRecords" />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">用户筛选</span>
            </label>
            <input 
              v-model="searchUser" 
              type="text" 
              placeholder="输入用户名..." 
              class="input input-bordered"
              @input="loadRecords"
            />
          </div>

          <div class="flex gap-2 ml-auto">
            <button class="btn btn-success" @click="exportToExcel" :disabled="records.length === 0">
              📊 导出Excel
            </button>
            <button class="btn btn-primary" @click="loadRecords">
              🔄 刷新
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 见单奖记录列表 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h3 class="card-title mb-4">见单奖记录</h3>
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>时间</th>
                <th>获奖用户</th>
                <th>触发用户</th>
                <th>层级</th>
                <th>对碰数</th>
                <th>奖励金额</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in paginatedRecords" :key="record.id">
                <td class="text-xs">{{ formatDateTime(record.created_at) }}</td>
                <td>
                  <div class="font-semibold">{{ record.user?.username || 'N/A' }}</div>
                  <div class="text-xs text-base-content/60">ID: {{ record.user_id.substring(0, 8) }}...</div>
                </td>
                <td>
                  <div class="font-semibold">{{ record.trigger_username }}</div>
                  <div class="text-xs text-base-content/60">ID: {{ record.trigger_user_id.substring(0, 8) }}...</div>
                </td>
                <td>
                  <span class="badge badge-primary">第 {{ record.generation }} 层</span>
                </td>
                <td class="text-center">{{ record.pairs }} 组</td>
                <td class="font-bold text-success">{{ record.amount.toFixed(2) }} U</td>
                <td class="text-xs text-base-content/60 max-w-xs truncate">
                  {{ record.trigger_username }}对碰{{ record.pairs }}组 × 1U = {{ record.amount.toFixed(2) }}U
                </td>
              </tr>
              <tr v-if="records.length === 0">
                <td colspan="7" class="text-center text-base-content/60">暂无记录</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="flex justify-center mt-4">
          <div class="join">
            <button 
              class="join-item btn btn-sm" 
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              «
            </button>
            <button class="join-item btn btn-sm">
              第 {{ currentPage }} / {{ totalPages }} 页
            </button>
            <button 
              class="join-item btn btn-sm" 
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表展示 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h3 class="card-title mb-4">见单奖趋势</h3>
        <div class="h-64 flex items-center justify-center text-base-content/40">
          <div class="text-center">
            <div class="text-4xl mb-2">📈</div>
            <div>图表功能（可选集成 Chart.js）</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay } from 'date-fns'

const timeRange = ref('today')
const startDate = ref('')
const endDate = ref('')
const searchUser = ref('')
const records = ref<any[]>([])
const currentPage = ref(1)
const pageSize = 50

const stats = ref({
  today: 0,
  todayCount: 0,
  week: 0,
  weekCount: 0,
  month: 0,
  monthCount: 0,
  total: 0,
  totalCount: 0
})

const formatDateTime = (date: string) => {
  return format(new Date(date), 'yyyy-MM-dd HH:mm:ss')
}

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return records.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(records.value.length / pageSize)
})

const loadStats = async () => {
  try {
    const now = new Date()
    const todayStart = startOfDay(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const monthStart = startOfMonth(now)

    // 今日统计
    const { data: todayData } = await supabase
      .from('order_bonuses')
      .select('amount')
      .gte('created_at', todayStart.toISOString())

    stats.value.today = todayData?.reduce((sum, r) => sum + r.amount, 0) || 0
    stats.value.todayCount = todayData?.length || 0

    // 本周统计
    const { data: weekData } = await supabase
      .from('order_bonuses')
      .select('amount')
      .gte('created_at', weekStart.toISOString())

    stats.value.week = weekData?.reduce((sum, r) => sum + r.amount, 0) || 0
    stats.value.weekCount = weekData?.length || 0

    // 本月统计
    const { data: monthData } = await supabase
      .from('order_bonuses')
      .select('amount')
      .gte('created_at', monthStart.toISOString())

    stats.value.month = monthData?.reduce((sum, r) => sum + r.amount, 0) || 0
    stats.value.monthCount = monthData?.length || 0

    // 累计统计
    const { data: totalData } = await supabase
      .from('order_bonuses')
      .select('amount')

    stats.value.total = totalData?.reduce((sum, r) => sum + r.amount, 0) || 0
    stats.value.totalCount = totalData?.length || 0
  } catch (error) {
    console.error('Load stats error:', error)
  }
}

const loadRecords = async () => {
  try {
    let query = supabase
      .from('order_bonuses')
      .select(`
        *,
        user:users!order_bonuses_user_id_fkey(username)
      `)
      .order('created_at', { ascending: false })

    // 时间筛选
    if (timeRange.value === 'today') {
      query = query.gte('created_at', startOfDay(new Date()).toISOString())
    } else if (timeRange.value === 'week') {
      query = query.gte('created_at', startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString())
    } else if (timeRange.value === 'month') {
      query = query.gte('created_at', startOfMonth(new Date()).toISOString())
    } else if (timeRange.value === 'custom' && startDate.value) {
      query = query.gte('created_at', new Date(startDate.value).toISOString())
      if (endDate.value) {
        query = query.lte('created_at', endOfDay(new Date(endDate.value)).toISOString())
      }
    }

    const { data, error } = await query

    if (error) throw error

    // 用户筛选
    if (searchUser.value) {
      records.value = data?.filter(r => 
        r.user?.username?.toLowerCase().includes(searchUser.value.toLowerCase()) ||
        r.trigger_username?.toLowerCase().includes(searchUser.value.toLowerCase())
      ) || []
    } else {
      records.value = data || []
    }

    currentPage.value = 1
  } catch (error) {
    console.error('Load records error:', error)
  }
}

const exportToExcel = () => {
  try {
    // 构建CSV内容
    const headers = ['时间', '获奖用户', '触发用户', '层级', '对碰数', '奖励金额', '说明']
    const rows = records.value.map(r => [
      formatDateTime(r.created_at),
      r.user?.username || 'N/A',
      r.trigger_username,
      `第${r.generation}层`,
      `${r.pairs}组`,
      `${r.amount.toFixed(2)}U`,
      `${r.trigger_username}对碰${r.pairs}组 × 1U = ${r.amount.toFixed(2)}U`
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // 创建并下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `见单奖报表_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
    link.click()

    alert('导出成功！')
  } catch (error) {
    console.error('Export error:', error)
    alert('导出失败，请重试')
  }
}

onMounted(() => {
  loadStats()
  loadRecords()
})
</script>

