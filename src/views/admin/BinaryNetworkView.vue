<template>
  <div class="space-y-6">
    <!-- 搜索用户 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex gap-4 items-end">
          <div class="form-control flex-1">
            <label class="label">
              <span class="label-text">搜索用户（查看其Binary网络）</span>
            </label>
            <input 
              v-model="searchUsername"
              type="text"
              placeholder="输入用户名..." 
              class="input input-bordered"
              @keyup.enter="searchUser"
            />
          </div>
          <button class="btn btn-primary" @click="searchUser">
            🔍 搜索
          </button>
          <button v-if="currentUser" class="btn btn-outline" @click="resetView">
            🏠 返回首页
          </button>
        </div>
      </div>
    </div>

    <!-- 当前用户信息 -->
    <div v-if="currentUser" class="card bg-base-100 shadow">
      <div class="card-body">
        <h3 class="card-title">当前查看：{{ currentUser.username }}</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">左区业绩</div>
            <div class="stat-value text-xl">{{ networkData?.left_performance || 0 }}U</div>
          </div>
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">右区业绩</div>
            <div class="stat-value text-xl">{{ networkData?.right_performance || 0 }}U</div>
          </div>
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">总对碰</div>
            <div class="stat-value text-xl">{{ networkData?.total_pairs || 0 }}组</div>
          </div>
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">总收益</div>
            <div class="stat-value text-xl text-success">{{ networkData?.total_earnings || 0 }}U</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 网络树状图 -->
    <div v-if="currentUser" class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h3 class="card-title">Binary网络结构</h3>
          <div class="flex gap-2">
            <button class="btn btn-sm btn-outline" @click="expandLevel--" :disabled="expandLevel <= 1">
              - 收起
            </button>
            <span class="badge badge-lg">显示{{ expandLevel }}层</span>
            <button class="btn btn-sm btn-outline" @click="expandLevel++" :disabled="expandLevel >= 5">
              + 展开
            </button>
          </div>
        </div>

        <!-- 树状图 -->
        <div class="overflow-x-auto">
          <div class="flex justify-center p-8">
            <BinaryNode 
              v-if="treeData"
              :node="treeData"
              :level="0"
              :maxLevel="expandLevel"
              @node-click="handleNodeClick"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 节点详情模态框 -->
    <dialog class="modal" :class="{ 'modal-open': showNodeDetail }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">用户详情</h3>
        <div v-if="selectedNode" class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content rounded-full w-16">
                <span class="text-2xl">{{ selectedNode.username?.[0] || '?' }}</span>
              </div>
            </div>
            <div>
              <div class="text-2xl font-bold">{{ selectedNode.username || '空位' }}</div>
              <div class="text-sm text-base-content/60">{{ selectedNode.position === 'left' ? '左区' : selectedNode.position === 'right' ? '右区' : '根节点' }}</div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-base-content/60">直推人数</div>
              <div class="text-lg font-semibold">{{ selectedNode.direct_referral_count || 0 }} 人</div>
            </div>
            <div>
              <div class="text-sm text-base-content/60">U余额</div>
              <div class="text-lg font-semibold text-success">{{ selectedNode.u_balance?.toFixed(2) || '0.00' }} U</div>
            </div>
            <div>
              <div class="text-sm text-base-content/60">总收益</div>
              <div class="text-lg font-semibold text-primary">{{ selectedNode.total_earnings?.toFixed(2) || '0.00' }} U</div>
            </div>
            <div>
              <div class="text-sm text-base-content/60">用户类型</div>
              <div class="text-lg">
                <span class="badge" :class="selectedNode.is_agent ? 'badge-success' : 'badge-ghost'">
                  {{ selectedNode.is_agent ? '代理' : '普通' }}
                </span>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div>
            <button class="btn btn-primary w-full" @click="viewUserNetwork(selectedNode)">
              📊 查看TA的网络
            </button>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showNodeDetail = false">关闭</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import BinaryNode from '@/components/admin/BinaryNode.vue'

const searchUsername = ref('')
const currentUser = ref<any>(null)
const networkData = ref<any>(null)
const treeData = ref<any>(null)
const expandLevel = ref(2)
const showNodeDetail = ref(false)
const selectedNode = ref<any>(null)

const searchUser = async () => {
  if (!searchUsername.value) return

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', searchUsername.value)
      .single()

    if (error || !user) {
      alert('用户不存在')
      return
    }

    currentUser.value = user
    await loadNetwork(user.id)
  } catch (error) {
    console.error('Search user error:', error)
  }
}

const loadNetwork = async (userId: string) => {
  try {
    // 加载Binary网络数据
    const { data: binaryData } = await supabase
      .from('binary_members')
      .select('*')
      .eq('user_id', userId)
      .single()

    networkData.value = binaryData

    // 加载树结构
    await loadTreeData(userId)
  } catch (error) {
    console.error('Load network error:', error)
  }
}

const loadTreeData = async (userId: string, position: 'root' | 'left' | 'right' = 'root') => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!user) return null

    const { data: binaryMember } = await supabase
      .from('binary_members')
      .select('*')
      .eq('user_id', userId)
      .single()

    const node: any = {
      ...user,
      position,
      left_performance: binaryMember?.left_performance || 0,
      right_performance: binaryMember?.right_performance || 0,
      children: {
        left: null,
        right: null
      }
    }

    // 递归加载子节点
    if (binaryMember?.left_node_id) {
      node.children.left = await loadTreeData(binaryMember.left_node_id, 'left')
    }
    if (binaryMember?.right_node_id) {
      node.children.right = await loadTreeData(binaryMember.right_node_id, 'right')
    }

    if (position === 'root') {
      treeData.value = node
    }

    return node
  } catch (error) {
    console.error('Load tree data error:', error)
    return null
  }
}

const handleNodeClick = (node: any) => {
  selectedNode.value = node
  showNodeDetail.value = true
}

const viewUserNetwork = (node: any) => {
  if (!node.username) return
  searchUsername.value = node.username
  showNodeDetail.value = false
  searchUser()
}

const resetView = () => {
  currentUser.value = null
  networkData.value = null
  treeData.value = null
  searchUsername.value = ''
}

onMounted(async () => {
  // 默认加载第一个用户
  const { data: firstUser } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (firstUser) {
    searchUsername.value = firstUser.username
    await searchUser()
  }
})
</script>

