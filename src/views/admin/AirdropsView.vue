<template>
  <div class="space-y-6">
    <!-- 操作栏 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex justify-between items-center">
          <h3 class="card-title">空投管理</h3>
          <div class="flex gap-2">
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
const pushToChat = async (airdrop: Airdrop) => {
  try {
    // 1. 获取所有群组
    const { data: groups, error: groupsError } = await supabase
      .from('chat_groups')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (groupsError) throw groupsError

    if (!groups || groups.length === 0) {
      alert('没有可用的群组，请先创建群组')
      return
    }

    // 2. 让管理员选择群组（简单版：推送到所有群组）
    const confirmed = confirm(`确认要将此空投信息推送到所有群组吗？\n\n标题：${airdrop.title}\n群组数量：${groups.length}`)
    if (!confirmed) return

    // 3. 构建消息内容
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

    // 4. 推送到所有群组
    let successCount = 0
    let failCount = 0

    for (const group of groups) {
      try {
        const { error } = await supabase
          .from('messages')
          .insert({
            group_id: group.id,
            user_id: null, // 系统消息
            content: message,
            message_type: 'system'
          })

        if (error) {
          console.error(`推送到群组${group.name}失败:`, error)
          failCount++
        } else {
          successCount++
        }
      } catch (err) {
        console.error(`推送到群组${group.name}异常:`, err)
        failCount++
      }
    }

    // 5. 显示结果
    alert(`推送完成！\n\n成功：${successCount}个群组\n失败：${failCount}个群组`)

  } catch (error: any) {
    console.error('Push to chat error:', error)
    alert(`推送失败：${error.message || '未知错误'}`)
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

onMounted(() => {
  loadAirdrops()
})
</script>






