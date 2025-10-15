<template>
  <div class="p-6 space-y-6">
    <!-- 头部 -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">群聊管理</h1>
        <p class="text-base-content/60 mt-1">管理群聊分类和群组</p>
      </div>
      <div class="flex gap-2">
        <button @click="showCategoryModal = true" class="btn btn-outline gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新建分类
        </button>
        <button @click="showGroupModal = true" class="btn btn-primary gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新建群组
        </button>
      </div>
    </div>

    <!-- 分类管理 -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">群聊分类</h2>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>图标</th>
                <th>名称</th>
                <th>描述</th>
                <th>排序</th>
                <th>群组数</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in categories" :key="category.id">
                <td class="text-2xl">{{ category.icon }}</td>
                <td class="font-bold">{{ category.name }}</td>
                <td class="text-sm text-base-content/60">{{ category.description }}</td>
                <td>{{ category.sort_order }}</td>
                <td>{{ getCategoryGroupCount(category.id) }}</td>
                <td>
                  <div class="badge" :class="category.is_active ? 'badge-success' : 'badge-error'">
                    {{ category.is_active ? '启用' : '禁用' }}
                  </div>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button @click="editCategory(category)" class="btn btn-ghost btn-xs">编辑</button>
                    <button @click="toggleCategoryStatus(category)" class="btn btn-ghost btn-xs">
                      {{ category.is_active ? '禁用' : '启用' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 群组管理 -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">群组列表</h2>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>图标</th>
                <th>名称</th>
                <th>分类</th>
                <th>成员数</th>
                <th>容量</th>
                <th>机器人</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in groups" :key="group.id">
                <td class="text-2xl">{{ group.icon || '💬' }}</td>
                <td>
                  <div class="font-bold">{{ group.name }}</div>
                  <div class="text-xs text-base-content/60">{{ group.description }}</div>
                </td>
                <td>{{ getCategoryName(group.category_id) }}</td>
                <td>{{ formatNumber(group.member_count) }}</td>
                <td>{{ formatNumber(group.max_members) }}</td>
                <td>
                  <div class="badge" :class="group.bot_enabled ? 'badge-primary' : 'badge-ghost'">
                    {{ group.bot_enabled ? '已启用' : '未启用' }}
                  </div>
                </td>
                <td>
                  <div class="badge" :class="group.is_active ? 'badge-success' : 'badge-error'">
                    {{ group.is_active ? '启用' : '禁用' }}
                  </div>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button @click="editGroup(group)" class="btn btn-ghost btn-xs">编辑</button>
                    <button @click="toggleGroupStatus(group)" class="btn btn-ghost btn-xs">
                      {{ group.is_active ? '禁用' : '启用' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 新建/编辑分类模态框 -->
    <dialog :open="showCategoryModal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">{{ editingCategory ? '编辑分类' : '新建分类' }}</h3>
        <div class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">分类名称</span></label>
            <input v-model="categoryForm.name" type="text" class="input input-bordered" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">描述</span></label>
            <textarea v-model="categoryForm.description" class="textarea textarea-bordered"></textarea>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">图标（Emoji）</span></label>
            <input v-model="categoryForm.icon" type="text" class="input input-bordered" placeholder="💬" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">排序</span></label>
            <input v-model.number="categoryForm.sort_order" type="number" class="input input-bordered" />
          </div>
        </div>
        <div class="modal-action">
          <button @click="closeCategoryModal" class="btn">取消</button>
          <button @click="saveCategory" class="btn btn-primary">保存</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeCategoryModal"></div>
    </dialog>

    <!-- 新建/编辑群组模态框 -->
    <dialog :open="showGroupModal" class="modal">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">{{ editingGroup ? '编辑群组' : '新建群组' }}</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text">群组名称</span></label>
              <input v-model="groupForm.name" type="text" class="input input-bordered" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">图标（Emoji）</span></label>
              <input v-model="groupForm.icon" type="text" class="input input-bordered" placeholder="💬" />
            </div>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">描述</span></label>
            <textarea v-model="groupForm.description" class="textarea textarea-bordered"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text">分类</span></label>
              <select v-model="groupForm.category_id" class="select select-bordered">
                <option :value="null">未分类</option>
                <option v-for="cat in categories.filter(c => c.is_active)" :key="cat.id" :value="cat.id">
                  {{ cat.icon }} {{ cat.name }}
                </option>
              </select>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">类型</span></label>
              <select v-model="groupForm.type" class="select select-bordered">
                <option value="default_hall">默认大厅</option>
                <option value="custom">自定义群组</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text">最大成员数</span></label>
              <input v-model.number="groupForm.max_members" type="number" class="input input-bordered" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">排序</span></label>
              <input v-model.number="groupForm.sort_order" type="number" class="input input-bordered" />
            </div>
          </div>
          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text">启用AI机器人</span>
              <input v-model="groupForm.bot_enabled" type="checkbox" class="checkbox" />
            </label>
          </div>
          <div v-if="groupForm.bot_enabled" class="space-y-3 pl-6 border-l-2 border-primary">
            <div class="form-control">
              <label class="label"><span class="label-text">机器人名称</span></label>
              <input v-model="groupForm.bot_config.bot_name" type="text" class="input input-bordered" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">推送间隔（秒）</span></label>
              <input v-model.number="groupForm.bot_config.push_interval" type="number" class="input input-bordered" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">欢迎消息</span></label>
              <textarea v-model="groupForm.bot_config.welcome_message" class="textarea textarea-bordered"></textarea>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">交易所过滤（可选）</span></label>
              <input v-model="groupForm.bot_config.exchange_filter" type="text" class="input input-bordered" placeholder="binance, okx" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">最低评分（可选）</span></label>
              <input v-model.number="groupForm.bot_config.min_score" type="number" step="0.1" class="input input-bordered" placeholder="8.0" />
            </div>
          </div>
        </div>
        <div class="modal-action">
          <button @click="closeGroupModal" class="btn">取消</button>
          <button @click="saveGroup" class="btn btn-primary">保存</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeGroupModal"></div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { ChatCategory, ChatGroup, BotConfig } from '@/types'

const categories = ref<ChatCategory[]>([])
const groups = ref<ChatGroup[]>([])

const showCategoryModal = ref(false)
const showGroupModal = ref(false)
const editingCategory = ref<ChatCategory | null>(null)
const editingGroup = ref<ChatGroup | null>(null)

const categoryForm = ref({
  name: '',
  description: '',
  icon: '',
  sort_order: 0
})

const groupForm = ref({
  name: '',
  description: '',
  category_id: null as string | null,
  type: 'custom' as 'default_hall' | 'custom',
  icon: '',
  sort_order: 0,
  max_members: 100000,
  bot_enabled: false,
  bot_config: {
    bot_name: 'AI机器人',
    push_interval: 3600,
    welcome_message: '',
    exchange_filter: '',
    min_score: undefined
  } as BotConfig
})

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  return num.toString()
}

// 获取分类下的群组数
const getCategoryGroupCount = (categoryId: string) => {
  return groups.value.filter(g => g.category_id === categoryId).length
}

// 获取分类名称
const getCategoryName = (categoryId: string | null) => {
  if (!categoryId) return '未分类'
  const cat = categories.value.find(c => c.id === categoryId)
  return cat ? `${cat.icon} ${cat.name}` : '未知'
}

// 加载数据
const loadData = async () => {
  try {
    // 加载分类
    const { data: catData, error: catError } = await supabase
      .from('chat_categories')
      .select('*')
      .order('sort_order')

    if (catError) throw catError
    categories.value = catData || []

    // 加载群组
    const { data: groupData, error: groupError } = await supabase
      .from('chat_groups')
      .select('*')
      .order('sort_order')

    if (groupError) throw groupError
    groups.value = groupData || []
  } catch (error) {
    console.error('Load data error:', error)
    alert('加载失败')
  }
}

// 编辑分类
const editCategory = (category: ChatCategory) => {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    description: category.description || '',
    icon: category.icon || '',
    sort_order: category.sort_order
  }
  showCategoryModal.value = true
}

// 保存分类
const saveCategory = async () => {
  try {
    if (editingCategory.value) {
      // 更新
      const { error } = await supabase
        .from('chat_categories')
        .update(categoryForm.value)
        .eq('id', editingCategory.value.id)

      if (error) throw error
    } else {
      // 新建
      const { error } = await supabase
        .from('chat_categories')
        .insert(categoryForm.value)

      if (error) throw error
    }

    await loadData()
    closeCategoryModal()
    alert('保存成功')
  } catch (error) {
    console.error('Save category error:', error)
    alert('保存失败')
  }
}

// 切换分类状态
const toggleCategoryStatus = async (category: ChatCategory) => {
  try {
    const { error } = await supabase
      .from('chat_categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id)

    if (error) throw error
    await loadData()
  } catch (error) {
    console.error('Toggle category error:', error)
    alert('操作失败')
  }
}

// 关闭分类模态框
const closeCategoryModal = () => {
  showCategoryModal.value = false
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    description: '',
    icon: '',
    sort_order: 0
  }
}

// 编辑群组
const editGroup = (group: ChatGroup) => {
  editingGroup.value = group
  groupForm.value = {
    name: group.name,
    description: group.description || '',
    category_id: group.category_id,
    type: group.type,
    icon: group.icon || '',
    sort_order: group.sort_order,
    max_members: group.max_members,
    bot_enabled: group.bot_enabled,
    bot_config: group.bot_config || {
      bot_name: 'AI机器人',
      push_interval: 3600,
      welcome_message: '',
      exchange_filter: '',
      min_score: undefined
    }
  }
  showGroupModal.value = true
}

// 保存群组
const saveGroup = async () => {
  try {
    const data: any = {
      name: groupForm.value.name,
      description: groupForm.value.description,
      category_id: groupForm.value.category_id,
      type: groupForm.value.type,
      icon: groupForm.value.icon,
      sort_order: groupForm.value.sort_order,
      max_members: groupForm.value.max_members,
      bot_enabled: groupForm.value.bot_enabled,
      bot_config: groupForm.value.bot_enabled ? groupForm.value.bot_config : null
    }

    if (editingGroup.value) {
      // 更新
      const { error } = await supabase
        .from('chat_groups')
        .update(data)
        .eq('id', editingGroup.value.id)

      if (error) throw error
    } else {
      // 新建
      const { error } = await supabase
        .from('chat_groups')
        .insert(data)

      if (error) throw error
    }

    await loadData()
    closeGroupModal()
    alert('保存成功')
  } catch (error) {
    console.error('Save group error:', error)
    alert('保存失败')
  }
}

// 切换群组状态
const toggleGroupStatus = async (group: ChatGroup) => {
  try {
    const { error } = await supabase
      .from('chat_groups')
      .update({ is_active: !group.is_active })
      .eq('id', group.id)

    if (error) throw error
    await loadData()
  } catch (error) {
    console.error('Toggle group error:', error)
    alert('操作失败')
  }
}

// 关闭群组模态框
const closeGroupModal = () => {
  showGroupModal.value = false
  editingGroup.value = null
  groupForm.value = {
    name: '',
    description: '',
    category_id: null,
    type: 'custom',
    icon: '',
    sort_order: 0,
    max_members: 100000,
    bot_enabled: false,
    bot_config: {
      bot_name: 'AI机器人',
      push_interval: 3600,
      welcome_message: '',
      exchange_filter: '',
      min_score: undefined
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

















