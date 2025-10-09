<template>
  <div class="space-y-6">
    <!-- 操作栏 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex justify-between items-center">
          <h3 class="card-title">空投管理</h3>
          <button class="btn btn-primary" @click="showAddModal = true">
            <PlusIcon class="w-5 h-5" />
            手动添加空投
          </button>
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

const airdrops = ref<Airdrop[]>([])
const showAddModal = ref(false)
const editingAirdrop = ref<Airdrop | null>(null)

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

onMounted(() => {
  loadAirdrops()
})
</script>






