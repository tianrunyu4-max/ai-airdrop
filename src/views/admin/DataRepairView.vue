<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-4xl mx-auto space-y-6">
      
      <!-- 标题 -->
      <div class="bg-white rounded-2xl p-6 shadow">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">🔧 数据修复工具</h1>
        <p class="text-sm text-gray-600">诊断并修复系统数据不一致问题</p>
      </div>

      <!-- 快速操作 -->
      <div class="bg-white rounded-2xl p-6 shadow">
        <h2 class="text-lg font-bold text-gray-800 mb-4">⚡ 快速操作</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            @click="diagnoseCurrentUser"
            :disabled="loading"
            class="bg-blue-500 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            🔍 诊断当前用户
          </button>
          
          <button 
            @click="fixCurrentUser"
            :disabled="loading"
            class="bg-green-500 text-white py-3 px-4 rounded-xl font-bold hover:bg-green-600 transition-all disabled:opacity-50"
          >
            🔧 修复当前用户
          </button>
          
          <button 
            @click="clearCache"
            :disabled="loading"
            class="bg-orange-500 text-white py-3 px-4 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50"
          >
            🧹 清除缓存
          </button>
        </div>
      </div>

      <!-- 诊断报告 -->
      <div v-if="report" class="bg-white rounded-2xl p-6 shadow">
        <h2 class="text-lg font-bold text-gray-800 mb-4">📊 诊断报告</h2>
        
        <!-- localStorage状态 -->
        <div class="mb-4 p-4 bg-blue-50 rounded-xl">
          <h3 class="font-bold text-blue-800 mb-2">📦 localStorage</h3>
          <div class="space-y-1 text-sm">
            <div>学习卡: {{ report.localStorage.learningCards || 0 }}张</div>
            <div>交易记录: {{ report.localStorage.transactions || 0 }}条</div>
          </div>
        </div>

        <!-- 数据库状态 -->
        <div class="mb-4 p-4 bg-green-50 rounded-xl">
          <h3 class="font-bold text-green-800 mb-2">🗄️ 数据库</h3>
          <div class="space-y-1 text-sm">
            <div v-if="report.database.user">
              用户: {{ report.database.user.username }} 
              ({{ report.database.user.is_agent ? 'AI代理' : '普通用户' }})
            </div>
            <div v-if="report.database.user">
              余额: {{ report.database.user.u_balance }}U / 
              积分: {{ report.database.user.transfer_points }}
            </div>
            <div>
              直推关系表(referral_relationships): {{ report.database.referrals || 0 }}人
            </div>
            <div>
              旧关系表(users.inviter_id): {{ report.database.inviterIdCount || 0 }}人
            </div>
            <div v-if="report.database.binary">
              Binary系统: A侧{{ report.database.binary.a_side_count }}人 / 
              B侧{{ report.database.binary.b_side_count }}人
            </div>
            <div v-if="report.database.binary">
              对碰奖: {{ report.database.binary.total_pairing_bonus }}U
            </div>
          </div>
        </div>

        <!-- 问题列表 -->
        <div v-if="report.issues && report.issues.length > 0" class="p-4 bg-red-50 rounded-xl">
          <h3 class="font-bold text-red-800 mb-2">⚠️ 发现问题</h3>
          <ul class="space-y-1 text-sm text-red-700">
            <li v-for="(issue, index) in report.issues" :key="index">• {{ issue }}</li>
          </ul>
        </div>

        <!-- 无问题提示 -->
        <div v-else class="p-4 bg-green-50 rounded-xl">
          <div class="text-green-700 font-bold">✅ 未发现明显问题</div>
        </div>
      </div>

      <!-- 修复结果 -->
      <div v-if="fixResult" class="bg-white rounded-2xl p-6 shadow">
        <h2 class="text-lg font-bold text-gray-800 mb-4">
          {{ fixResult.success ? '✅ 修复成功' : '❌ 修复失败' }}
        </h2>
        <div class="text-sm text-gray-700">
          {{ fixResult.message }}
        </div>
        <div v-if="fixResult.fixed !== undefined" class="mt-2 text-sm text-gray-600">
          已同步 {{ fixResult.fixed }} 条直推关系
        </div>
      </div>

      <!-- 用户查询 -->
      <div class="bg-white rounded-2xl p-6 shadow">
        <h2 class="text-lg font-bold text-gray-800 mb-4">🔎 查询其他用户</h2>
        
        <div class="flex gap-3">
          <input 
            v-model="targetUsername"
            type="text"
            placeholder="输入用户名"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
          />
          <button 
            @click="diagnoseUser(targetUsername)"
            :disabled="loading || !targetUsername"
            class="bg-blue-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            诊断
          </button>
          <button 
            @click="fixUser(targetUsername)"
            :disabled="loading || !targetUsername"
            class="bg-green-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-600 transition-all disabled:opacity-50"
          >
            修复
          </button>
        </div>
      </div>

      <!-- SQL脚本 -->
      <div class="bg-white rounded-2xl p-6 shadow">
        <h2 class="text-lg font-bold text-gray-800 mb-4">📝 SQL诊断脚本</h2>
        <div class="bg-gray-900 text-gray-100 p-4 rounded-xl text-sm overflow-x-auto">
          <pre>{{ sqlScript }}</pre>
        </div>
        <button 
          @click="copySql"
          class="mt-3 bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-600 transition-all"
        >
          📋 复制SQL
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { DataSyncTool } from '@/utils/DataSyncTool'
import { supabase } from '@/lib/supabase'

const authStore = useAuthStore()
const toast = useToast()

const loading = ref(false)
const report = ref<any>(null)
const fixResult = ref<any>(null)
const targetUsername = ref('')

// 诊断当前用户
const diagnoseCurrentUser = async () => {
  const userId = authStore.user?.id
  if (!userId) {
    toast.error('请先登录')
    return
  }
  
  loading.value = true
  toast.info('🔍 诊断中...', 0)
  
  try {
    report.value = await DataSyncTool.diagnose(userId)
    toast.success('✅ 诊断完成')
  } catch (error) {
    console.error('诊断失败:', error)
    toast.error('诊断失败')
  } finally {
    loading.value = false
  }
}

// 修复当前用户
const fixCurrentUser = async () => {
  const userId = authStore.user?.id
  if (!userId) {
    toast.error('请先登录')
    return
  }
  
  if (!confirm('确认执行修复操作？这将同步推荐关系数据并清除缓存。')) {
    return
  }
  
  loading.value = true
  const loadingToast = toast.info('🔧 修复中...', 0)
  
  try {
    fixResult.value = await DataSyncTool.fullRepair(userId)
    toast.removeToast(loadingToast)
    
    if (fixResult.value.success) {
      toast.success('✅ 修复完成！请刷新页面', 5000)
      report.value = fixResult.value.after
    } else {
      toast.error('❌ 修复失败: ' + fixResult.value.message)
    }
  } catch (error) {
    console.error('修复失败:', error)
    toast.removeToast(loadingToast)
    toast.error('修复失败')
  } finally {
    loading.value = false
  }
}

// 清除缓存
const clearCache = () => {
  const userId = authStore.user?.id
  if (!userId) {
    toast.error('请先登录')
    return
  }
  
  if (!confirm('确认清除所有缓存？')) {
    return
  }
  
  DataSyncTool.clearAllCache(userId)
  toast.success('✅ 缓存已清除')
}

// 诊断指定用户
const diagnoseUser = async (username: string) => {
  if (!username) return
  
  loading.value = true
  toast.info('🔍 查询中...', 0)
  
  try {
    // 查询用户ID
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()
    
    if (error || !user) {
      toast.error('用户不存在')
      return
    }
    
    report.value = await DataSyncTool.diagnose(user.id)
    toast.success('✅ 诊断完成')
  } catch (error) {
    console.error('诊断失败:', error)
    toast.error('诊断失败')
  } finally {
    loading.value = false
  }
}

// 修复指定用户
const fixUser = async (username: string) => {
  if (!username) return
  
  if (!confirm(`确认修复用户 ${username} 的数据？`)) {
    return
  }
  
  loading.value = true
  const loadingToast = toast.info('🔧 修复中...', 0)
  
  try {
    // 查询用户ID
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()
    
    if (error || !user) {
      toast.error('用户不存在')
      return
    }
    
    fixResult.value = await DataSyncTool.fullRepair(user.id)
    toast.removeToast(loadingToast)
    
    if (fixResult.value.success) {
      toast.success('✅ 修复完成')
      report.value = fixResult.value.after
    } else {
      toast.error('❌ 修复失败: ' + fixResult.value.message)
    }
  } catch (error) {
    console.error('修复失败:', error)
    toast.removeToast(loadingToast)
    toast.error('修复失败')
  } finally {
    loading.value = false
  }
}

// SQL脚本
const sqlScript = `-- 查询用户的直推关系
SELECT 
  u.username,
  u.is_agent,
  rr.created_at
FROM referral_relationships rr
LEFT JOIN users u ON u.id = rr.referee_id
WHERE rr.referrer_id = '你的用户ID'
  AND rr.is_active = TRUE;

-- 查询用户的旧推荐关系
SELECT 
  id,
  username,
  is_agent
FROM users
WHERE inviter_id = '你的用户ID'
  AND is_agent = TRUE;`

// 复制SQL
const copySql = () => {
  navigator.clipboard.writeText(sqlScript)
  toast.success('✅ 已复制到剪贴板')
}
</script>

