<template>
  <div class="space-y-6">
    <!-- 操作栏 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex justify-between items-center">
          <h3 class="card-title">空投管理</h3>
          <div class="flex gap-2">
            <button class="btn btn-info btn-sm" @click="showHistoryModal = true">
              📋 推送历史
            </button>
            <button class="btn btn-success" @click="autoCrawl" :disabled="crawling">
              <span v-if="crawling" class="loading loading-spinner loading-sm"></span>
              {{ crawling ? '爬取中...' : '🕷️ 自动爬取' }}
            </button>
            <button class="btn btn-primary" @click="showAddModal = true">
              <PlusIcon class="w-5 h-5" />
              手动添加空投
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空投列表 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>交易所</th>
                <th>标题</th>
                <th>奖励</th>
                <th>AI评分</th>
                <th>结束时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="airdrop in airdrops" :key="airdrop.id">
                <td>
                  <span class="badge badge-primary">{{ airdrop.exchange.toUpperCase() }}</span>
                </td>
                <td class="max-w-xs">
                  <div class="font-semibold truncate">{{ airdrop.title }}</div>
                  <div class="text-xs text-base-content/60 truncate">{{ airdrop.description }}</div>
                </td>
                <td>{{ airdrop.rewards }}</td>
                <td>
                  <div class="flex items-center gap-1">
                    <span class="font-bold text-primary">{{ airdrop.ai_score || '--' }}</span>
                    <span class="text-xs">/10</span>
                  </div>
                </td>
                <td>{{ formatDate(airdrop.end_date) }}</td>
                <td>
                  <span class="badge" :class="{
                    'badge-success': airdrop.is_active,
                    'badge-ghost': !airdrop.is_active
                  }">
                    {{ airdrop.is_active ? '活跃' : '已结束' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-xs btn-info" @click="pushToChat(airdrop)" title="推送到群聊">
                      📢
                    </button>
                    <button class="btn btn-xs btn-outline" @click="editAirdrop(airdrop)">
                      编辑
                    </button>
                    <button 
                      class="btn btn-xs"
                      :class="airdrop.is_active ? 'btn-error' : 'btn-success'"
                      @click="toggleStatus(airdrop)"
                    >
                      {{ airdrop.is_active ? '停用' : '启用' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 添加/编辑模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showAddModal }">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">{{ editingAirdrop ? '编辑空投' : '添加空投' }}</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">交易所</span>
              </label>
              <select v-model="form.exchange" class="select select-bordered">
                <option value="binance">币安 (Binance)</option>
                <option value="okx">欧易 (OKX)</option>
              </select>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">AI评分</span>
              </label>
              <input v-model.number="form.ai_score" type="number" step="0.1" min="0" max="10" class="input input-bordered" />
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">标题</span>
            </label>
            <input v-model="form.title" type="text" class="input input-bordered" placeholder="空投活动标题" />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">描述</span>
            </label>
            <textarea v-model="form.description" class="textarea textarea-bordered" rows="3" placeholder="活动描述"></textarea>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">奖励</span>
            </label>
            <input v-model="form.rewards" type="text" class="input input-bordered" placeholder="如：100 USDT" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">开始时间</span>
              </label>
              <input v-model="form.start_date" type="datetime-local" class="input input-bordered" />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">结束时间</span>
              </label>
              <input v-model="form.end_date" type="datetime-local" class="input input-bordered" />
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">活动链接</span>
            </label>
            <input v-model="form.url" type="url" class="input input-bordered" placeholder="https://..." />
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveAirdrop">保存</button>
        </div>
      </div>
    </dialog>

    <!-- 推送选择模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showPushModal }">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">📢 选择推送群组</h3>
        
        <div v-if="pushingAirdrop" class="alert alert-info mb-4">
          <div>
            <div class="font-bold">{{ pushingAirdrop.title }}</div>
            <div class="text-sm">{{ pushingAirdrop.exchange.toUpperCase() }} | AI评分: {{ pushingAirdrop.ai_score }}/10</div>
          </div>
        </div>

        <div class="flex gap-2 mb-4">
          <button class="btn btn-sm btn-outline" @click="selectAllGroups">全选</button>
          <button class="btn btn-sm btn-outline" @click="clearSelection">清空</button>
          <div class="flex-1"></div>
          <span class="text-sm text-base-content/60">已选择 {{ selectedGroups.length }} 个群组</span>
        </div>

        <div class="space-y-2 max-h-96 overflow-y-auto">
          <label v-for="group in availableGroups" :key="group.id" class="flex items-center gap-3 p-3 border rounded-lg hover:bg-base-200 cursor-pointer">
            <input 
              type="checkbox" 
              :value="group.id" 
              v-model="selectedGroups"
              class="checkbox checkbox-primary"
            />
            <div class="flex-1">
              <div class="font-semibold">{{ group.name }}</div>
              <div class="text-xs text-base-content/60">
                {{ group.type === 'default_hall' ? '主群' : group.type === 'agent_only' ? '代理群' : '普通群' }} | 
                成员: {{ group.member_count || 0 }}
              </div>
            </div>
          </label>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showPushModal = false" :disabled="pushing">取消</button>
          <button class="btn btn-primary" @click="confirmPush" :disabled="pushing || selectedGroups.length === 0">
            <span v-if="pushing" class="loading loading-spinner loading-sm"></span>
            {{ pushing ? '推送中...' : '确认推送' }}
          </button>
        </div>
      </div>
    </dialog>

    <!-- 推送历史模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showHistoryModal }">
      <div class="modal-box max-w-4xl">
        <h3 class="font-bold text-lg mb-4">📋 推送历史记录</h3>
        
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>时间</th>
                <th>空投标题</th>
                <th>交易所</th>
                <th>群组数量</th>
                <th>成功/失败</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in pushHistory" :key="record.id">
                <td class="text-xs">{{ format(new Date(record.created_at), 'MM-dd HH:mm') }}</td>
                <td class="max-w-xs truncate">{{ record.airdrops?.title || '已删除' }}</td>
                <td>
                  <span class="badge badge-xs badge-primary">{{ record.airdrops?.exchange?.toUpperCase() || '--' }}</span>
                </td>
                <td>{{ record.group_ids?.length || 0 }}</td>
                <td>
                  <span class="text-success">{{ record.success_count }}</span> / 
                  <span class="text-error">{{ record.fail_count }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showHistoryModal = false">关闭</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { PlusIcon } from '@heroicons/vue/24/outline'
import type { Airdrop } from '@/types'
import { AirdropCrawlerService } from '@/services/AirdropCrawlerService'

const airdrops = ref<Airdrop[]>([])
const showAddModal = ref(false)
const editingAirdrop = ref<Airdrop | null>(null)
const crawling = ref(false)
const pushHistory = ref<any[]>([])
const showHistoryModal = ref(false)

const form = ref({
  exchange: 'binance',
  title: '',
  description: '',
  rewards: '',
  start_date: '',
  end_date: '',
  ai_score: 0,
  url: ''
})

const formatDate = (date: string) => {
  return format(new Date(date), 'yyyy-MM-dd')
}

const loadAirdrops = async () => {
  try {
    const { data, error } = await supabase
      .from('airdrops')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    airdrops.value = data || []
  } catch (error) {
    console.error('Load airdrops error:', error)
  }
}

const editAirdrop = (airdrop: Airdrop) => {
  editingAirdrop.value = airdrop
  form.value = {
    exchange: airdrop.exchange,
    title: airdrop.title,
    description: airdrop.description || '',
    rewards: airdrop.rewards || '',
    start_date: airdrop.start_date ? format(new Date(airdrop.start_date), "yyyy-MM-dd'T'HH:mm") : '',
    end_date: airdrop.end_date ? format(new Date(airdrop.end_date), "yyyy-MM-dd'T'HH:mm") : '',
    ai_score: airdrop.ai_score || 0,
    url: airdrop.url || ''
  }
  showAddModal.value = true
}

const closeModal = () => {
  showAddModal.value = false
  editingAirdrop.value = null
  form.value = {
    exchange: 'binance',
    title: '',
    description: '',
    rewards: '',
    start_date: '',
    end_date: '',
    ai_score: 0,
    url: ''
  }
}

const saveAirdrop = async () => {
  try {
    const data = {
      ...form.value,
      start_date: form.value.start_date ? new Date(form.value.start_date).toISOString() : null,
      end_date: form.value.end_date ? new Date(form.value.end_date).toISOString() : null
    }

    if (editingAirdrop.value) {
      // 更新
      const { error } = await supabase
        .from('airdrops')
        .update(data)
        .eq('id', editingAirdrop.value.id)
      
      if (error) throw error
    } else {
      // 新增
      const { error } = await supabase
        .from('airdrops')
        .insert(data)
      
      if (error) throw error
    }

    alert('保存成功！')
    closeModal()
    loadAirdrops()
  } catch (error) {
    console.error('Save airdrop error:', error)
    alert('保存失败，请重试')
  }
}

const toggleStatus = async (airdrop: Airdrop) => {
  try {
    const { error } = await supabase
      .from('airdrops')
      .update({ is_active: !airdrop.is_active })
      .eq('id', airdrop.id)

    if (error) throw error
    loadAirdrops()
  } catch (error) {
    console.error('Toggle status error:', error)
  }
}

// 推送到群聊
const showPushModal = ref(false)
const pushingAirdrop = ref<Airdrop | null>(null)
const availableGroups = ref<any[]>([])
const selectedGroups = ref<string[]>([])
const pushing = ref(false)

const pushToChat = async (airdrop: Airdrop) => {
  try {
    // 加载可用群组
    const { data: groups, error: groupsError } = await supabase
      .from('chat_groups')
      .select('id, name, type, member_count')
      .eq('is_active', true)
      .order('name')

    if (groupsError) throw groupsError

    if (!groups || groups.length === 0) {
      alert('没有可用的群组，请先创建群组')
      return
    }

    availableGroups.value = groups
    pushingAirdrop.value = airdrop
    selectedGroups.value = [] // 清空选择
    showPushModal.value = true
  } catch (error: any) {
    alert(`加载群组失败：${error.message || '未知错误'}`)
  }
}

const selectAllGroups = () => {
  selectedGroups.value = availableGroups.value.map(g => g.id)
}

const clearSelection = () => {
  selectedGroups.value = []
}

const confirmPush = async () => {
  if (!pushingAirdrop.value || selectedGroups.value.length === 0) {
    alert('请至少选择一个群组')
    return
  }

  pushing.value = true

  try {
    const airdrop = pushingAirdrop.value

    // 构建消息内容
    const message = `━━━━━━━━━━━━━━━━━━━━
🎁 新空投通知

【标题】${airdrop.title}
【交易所】${airdrop.exchange.toUpperCase()}
【奖励】${airdrop.rewards || '待定'}
【AI评分】${airdrop.ai_score || '--'}/10
【结束时间】${formatDate(airdrop.end_date)}

${airdrop.description ? `【说明】${airdrop.description}\n\n` : ''}${airdrop.url ? `【链接】${airdrop.url}\n\n` : ''}━━━━━━━━━━━━━━━━━━━━
💡 立即参与，早鸟有奖！
━━━━━━━━━━━━━━━━━━━━`

    let successCount = 0
    let failCount = 0

    // 推送到选中的群组
    for (const groupId of selectedGroups.value) {
      try {
        const { error } = await supabase
          .from('messages')
          .insert({
            group_id: groupId,
            user_id: null,
            content: message,
            message_type: 'system',
            is_bot: true
          })

        if (error) {
          failCount++
        } else {
          successCount++
        }
      } catch (err) {
        failCount++
      }
    }

    // 记录推送历史
    await supabase
      .from('airdrop_push_history')
      .insert({
        airdrop_id: airdrop.id,
        group_ids: selectedGroups.value,
        success_count: successCount,
        fail_count: failCount
      })

    alert(`推送完成！\n\n成功：${successCount}个群组\n失败：${failCount}个群组`)
    showPushModal.value = false
    loadPushHistory()
  } catch (error: any) {
    alert(`推送失败：${error.message || '未知错误'}`)
  } finally {
    pushing.value = false
  }
}

// 自动爬取空投信息
const autoCrawl = async () => {
  if (crawling.value) return
  
  const confirmed = confirm('确认要自动爬取最新空投信息吗？\n\n爬取来源：\n- Binance公告\n- CoinMarketCap空投\n\n发现新空投将自动推送到群聊。')
  if (!confirmed) return

  crawling.value = true
  
  try {
    const result = await AirdropCrawlerService.crawlAll()
    
    if (result.success) {
      const data = result.data as any
      alert(`✅ 爬取完成！\n\n发现新空投：${data.totalNew} 条\n已自动推送到群聊`)
      
      // 刷新列表
      await loadAirdrops()
    } else {
      alert(`❌ 爬取失败：${result.error || '未知错误'}`)
    }
  } catch (error: any) {
    alert(`❌ 爬取异常：${error.message || '未知错误'}`)
  } finally {
    crawling.value = false
  }
}

const loadPushHistory = async () => {
  try {
    const { data, error } = await supabase
      .from('airdrop_push_history')
      .select(`
        *,
        airdrops (
          title,
          exchange
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    pushHistory.value = data || []
  } catch (error) {
    console.error('Load push history error:', error)
  }
}

onMounted(() => {
  loadAirdrops()
  loadPushHistory()
})
</script>






