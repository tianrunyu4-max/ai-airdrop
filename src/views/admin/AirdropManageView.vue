<template>
  <div class="container mx-auto p-4 max-w-7xl">
    <!-- 标题栏 -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">空投管理</h1>
        <p class="text-sm text-base-content/60 mt-1">手动添加Web3空投 + 自动同步CEX空投</p>
      </div>
      <button @click="showAddModal = true" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        添加Web3空投
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">总空投数</div>
          <div class="stat-value text-primary">{{ stats.total }}</div>
          <div class="stat-desc">活跃项目</div>
        </div>
      </div>
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">Web3 空投</div>
          <div class="stat-value text-secondary">{{ stats.web3 }}</div>
          <div class="stat-desc">手动管理</div>
        </div>
      </div>
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">CEX 空投</div>
          <div class="stat-value text-accent">{{ stats.cex }}</div>
          <div class="stat-desc">自动同步</div>
        </div>
      </div>
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">平均评分</div>
          <div class="stat-value">{{ stats.avgScore }}</div>
          <div class="stat-desc">AI智能评分</div>
        </div>
      </div>
    </div>

    <!-- 操作按钮组 -->
    <div class="flex gap-4 mb-6">
      <button @click="syncCEXAirdrops" class="btn btn-success" :disabled="syncing">
        <svg v-if="!syncing" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
        <span v-if="syncing" class="loading loading-spinner loading-sm mr-2"></span>
        {{ syncing ? '同步中...' : '同步CEX空投' }}
      </button>
      <button @click="loadAirdrops" class="btn btn-ghost">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
        刷新列表
      </button>
    </div>

    <!-- 筛选器 -->
    <div class="flex gap-2 mb-4">
      <select v-model="filter.type" class="select select-bordered select-sm">
        <option value="">全部类型</option>
        <option value="web3">Web3</option>
        <option value="cex">CEX</option>
      </select>
      <select v-model="filter.status" class="select select-bordered select-sm">
        <option value="">全部状态</option>
        <option value="active">活跃</option>
        <option value="ended">已结束</option>
      </select>
      <input v-model="filter.search" type="text" placeholder="搜索标题..." class="input input-bordered input-sm flex-1" />
    </div>

    <!-- 空投列表 -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>类型</th>
            <th>AI评分</th>
            <th>预计奖励</th>
            <th>风险</th>
            <th>状态</th>
            <th>推送次数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="airdrop in filteredAirdrops" :key="airdrop.id">
            <td class="font-mono text-xs">{{ airdrop.id.slice(0, 8) }}...</td>
            <td>
              <div class="font-semibold">{{ airdrop.title }}</div>
              <div class="text-xs text-base-content/60">{{ airdrop.category }}</div>
            </td>
            <td>
              <span class="badge" :class="airdrop.type === 'web3' ? 'badge-secondary' : 'badge-accent'">
                {{ airdrop.type === 'web3' ? 'Web3' : 'CEX' }}
              </span>
            </td>
            <td>
              <div class="flex items-center gap-1">
                <span class="text-warning">⭐</span>
                <span class="font-semibold">{{ airdrop.ai_score }}</span>
              </div>
            </td>
            <td class="font-semibold text-success">${{ airdrop.reward_amount }}</td>
            <td>
              <span class="badge badge-sm" :class="getRiskClass(airdrop.risk_level)">
                {{ getRiskText(airdrop.risk_level) }}
              </span>
            </td>
            <td>
              <span class="badge" :class="airdrop.status === 'active' ? 'badge-success' : 'badge-ghost'">
                {{ airdrop.status === 'active' ? '活跃' : '已结束' }}
              </span>
            </td>
            <td>{{ airdrop.push_count || 0 }}</td>
            <td>
              <div class="flex gap-1">
                <button @click="editAirdrop(airdrop)" class="btn btn-ghost btn-xs">编辑</button>
                <button @click="deleteAirdrop(airdrop.id)" class="btn btn-ghost btn-xs text-error">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 添加/编辑模态框 -->
    <dialog :class="{ 'modal': true, 'modal-open': showAddModal }">
      <div class="modal-box max-w-4xl">
        <h3 class="font-bold text-lg mb-4">{{ editingAirdrop ? '编辑空投' : '添加Web3空投' }}</h3>
        
        <form @submit.prevent="saveAirdrop" class="space-y-4">
          <!-- 基本信息 -->
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control col-span-2">
              <label class="label"><span class="label-text">标题 *</span></label>
              <input v-model="form.title" type="text" class="input input-bordered" required />
            </div>

            <div class="form-control col-span-2">
              <label class="label"><span class="label-text">描述 *</span></label>
              <textarea v-model="form.description" class="textarea textarea-bordered h-32" required></textarea>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">预计奖励 (USDT)</span></label>
              <input v-model.number="form.reward_amount" type="number" class="input input-bordered" />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">AI评分 (0-10)</span></label>
              <input v-model.number="form.ai_score" type="number" step="0.1" min="0" max="10" class="input input-bordered" />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">项目URL</span></label>
              <input v-model="form.project_url" type="url" class="input input-bordered" />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Twitter URL</span></label>
              <input v-model="form.twitter_url" type="url" class="input input-bordered" />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">图片URL</span></label>
              <input v-model="form.image_url" type="url" class="input input-bordered" />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">分类</span></label>
              <select v-model="form.category" class="select select-bordered">
                <option value="DeFi">DeFi</option>
                <option value="Layer2">Layer2</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="NFT">NFT</option>
                <option value="Gaming">Gaming</option>
                <option value="CEX">CEX</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">风险等级</span></label>
              <select v-model="form.risk_level" class="select select-bordered">
                <option value="none">无风险</option>
                <option value="low">低风险</option>
                <option value="medium">中等风险</option>
                <option value="high">高风险</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">难度</span></label>
              <select v-model="form.difficulty" class="select select-bordered">
                <option value="very_easy">非常简单</option>
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
                <option value="very_hard">非常困难</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">所需时间</span></label>
              <input v-model="form.time_required" type="text" placeholder="如：30分钟" class="input input-bordered" />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">参与成本</span></label>
              <input v-model="form.participation_cost" type="text" placeholder="如：Gas费5-10U" class="input input-bordered" />
            </div>

            <div class="form-control col-span-2">
              <label class="label"><span class="label-text">任务要求（每行一个）</span></label>
              <textarea v-model="requirementsText" class="textarea textarea-bordered h-24" placeholder="连接钱包&#10;完成KYC&#10;交易5笔"></textarea>
            </div>

            <div class="form-control col-span-2">
              <label class="label"><span class="label-text">标签（逗号分隔）</span></label>
              <input v-model="tagsText" type="text" placeholder="Layer2, 推荐, 热门" class="input input-bordered" />
            </div>
          </div>

          <div class="modal-action">
            <button type="button" @click="closeModal" class="btn btn-ghost">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-sm"></span>
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeModal">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

// 状态
const loading = ref(false)
const syncing = ref(false)
const saving = ref(false)
const showAddModal = ref(false)
const airdrops = ref<any[]>([])
const editingAirdrop = ref<any>(null)

// 统计
const stats = computed(() => ({
  total: airdrops.value.filter(a => a.status === 'active').length,
  web3: airdrops.value.filter(a => a.type === 'web3' && a.status === 'active').length,
  cex: airdrops.value.filter(a => a.type === 'cex' && a.status === 'active').length,
  avgScore: airdrops.value.length > 0
    ? (airdrops.value.reduce((sum, a) => sum + (a.ai_score || 0), 0) / airdrops.value.length).toFixed(1)
    : '0.0'
}))

// 筛选
const filter = ref({
  type: '',
  status: '',
  search: ''
})

const filteredAirdrops = computed(() => {
  return airdrops.value.filter(a => {
    if (filter.value.type && a.type !== filter.value.type) return false
    if (filter.value.status && a.status !== filter.value.status) return false
    if (filter.value.search && !a.title.toLowerCase().includes(filter.value.search.toLowerCase())) return false
    return true
  })
})

// 表单
const form = ref({
  title: '',
  description: '',
  reward_amount: 500,
  ai_score: 7.5,
  project_url: '',
  twitter_url: '',
  image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80',
  category: 'DeFi',
  type: 'web3',
  risk_level: 'low',
  difficulty: 'medium',
  time_required: '30分钟-1小时',
  participation_cost: 'Gas费约3-10U',
  source: '手动添加',
  source_type: 'manual',
  verified: true,
  status: 'active'
})

const requirementsText = ref('')
const tagsText = ref('')

// 加载空投列表
const loadAirdrops = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('airdrops')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    airdrops.value = data || []
  } catch (error) {
    console.error('加载空投失败:', error)
    alert('加载失败')
  } finally {
    loading.value = false
  }
}

// 同步CEX空投
const syncCEXAirdrops = async () => {
  try {
    syncing.value = true
    
    // 调用Edge Function同步CEX数据
    const { data, error } = await supabase.functions.invoke('sync-cex-airdrops')
    
    if (error) throw error
    
    alert(`✅ 同步成功！\n\n新增：${data?.added || 0}个\n更新：${data?.updated || 0}个`)
    await loadAirdrops()
  } catch (error: any) {
    console.error('同步失败:', error)
    alert(`同步失败: ${error.message || '未知错误'}`)
  } finally {
    syncing.value = false
  }
}

// 编辑空投
const editAirdrop = (airdrop: any) => {
  editingAirdrop.value = airdrop
  form.value = { ...airdrop }
  requirementsText.value = Array.isArray(airdrop.requirements) ? airdrop.requirements.join('\n') : ''
  tagsText.value = Array.isArray(airdrop.tags) ? airdrop.tags.join(', ') : ''
  showAddModal.value = true
}

// 保存空投
const saveAirdrop = async () => {
  try {
    saving.value = true
    
    const airdropData = {
      ...form.value,
      requirements: requirementsText.value.split('\n').filter(r => r.trim()),
      tags: tagsText.value.split(',').map(t => t.trim()).filter(t => t)
    }
    
    if (editingAirdrop.value) {
      // 更新
      const { error } = await supabase
        .from('airdrops')
        .update(airdropData)
        .eq('id', editingAirdrop.value.id)
      
      if (error) throw error
      alert('✅ 更新成功！')
    } else {
      // 新增
      const { error } = await supabase
        .from('airdrops')
        .insert([airdropData])
      
      if (error) throw error
      alert('✅ 添加成功！')
    }
    
    await loadAirdrops()
    closeModal()
  } catch (error: any) {
    console.error('保存失败:', error)
    alert(`保存失败: ${error.message}`)
  } finally {
    saving.value = false
  }
}

// 删除空投
const deleteAirdrop = async (id: string) => {
  if (!confirm('确定要删除这个空投吗？')) return
  
  try {
    const { error } = await supabase
      .from('airdrops')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    alert('✅ 删除成功！')
    await loadAirdrops()
  } catch (error: any) {
    console.error('删除失败:', error)
    alert(`删除失败: ${error.message}`)
  }
}

// 关闭模态框
const closeModal = () => {
  showAddModal.value = false
  editingAirdrop.value = null
  form.value = {
    title: '',
    description: '',
    reward_amount: 500,
    ai_score: 7.5,
    project_url: '',
    twitter_url: '',
    image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80',
    category: 'DeFi',
    type: 'web3',
    risk_level: 'low',
    difficulty: 'medium',
    time_required: '30分钟-1小时',
    participation_cost: 'Gas费约3-10U',
    source: '手动添加',
    source_type: 'manual',
    verified: true,
    status: 'active'
  }
  requirementsText.value = ''
  tagsText.value = ''
}

// 工具函数
const getRiskClass = (level: string) => {
  const classes: Record<string, string> = {
    'none': 'badge-success',
    'low': 'badge-info',
    'medium': 'badge-warning',
    'high': 'badge-error'
  }
  return classes[level] || 'badge-ghost'
}

const getRiskText = (level: string) => {
  const texts: Record<string, string> = {
    'none': '无风险',
    'low': '低风险',
    'medium': '中等',
    'high': '高风险'
  }
  return texts[level] || level
}

onMounted(() => {
  loadAirdrops()
})
</script>

