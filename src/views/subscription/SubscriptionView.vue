<template>
  <div class="h-full overflow-y-auto custom-scrollbar">
    <!-- 头部 -->
    <div class="p-4 bg-base-200">
      <h1 class="text-2xl font-bold">{{ t('subscription.title') }}</h1>
    </div>

    <!-- 代理状态 -->
    <div v-if="!user?.is_agent" class="p-4">
      <div class="card bg-gradient-to-br from-primary/20 to-secondary/20">
        <div class="card-body">
          <h2 class="card-title">{{ t('subscription.becomeAgent') }}</h2>
          <p class="text-base-content/70">{{ t('subscription.agentFee') }}</p>
          
          <!-- 权益列表 -->
          <div class="mt-4 space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-success">✓</span>
              <span>{{ t('subscription.benefits.spotAward') }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-success">✓</span>
              <span>{{ t('subscription.benefits.peerSpotAward') }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-success">✓</span>
              <span>{{ t('subscription.benefits.dividend') }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-success">✓</span>
              <span>{{ t('subscription.benefits.repurchase') }}</span>
            </div>
          </div>

          <!-- 余额显示 -->
          <div class="bg-base-200 rounded-lg p-3 mt-4">
            <div class="text-sm text-base-content/70">{{ t('profile.balance') }}</div>
            <div class="text-xl font-bold">{{ user?.u_balance || 0 }} U</div>
          </div>

          <div class="card-actions justify-end mt-4">
            <button
              class="btn btn-primary"
              :disabled="becomingAgent || (user?.u_balance || 0) < 30"
              @click="handleBecomeAgent"
            >
              <span v-if="becomingAgent" class="loading loading-spinner"></span>
              <template v-else>
                {{ (user?.u_balance || 0) < 30 ? t('subscription.insufficientBalance') : t('subscription.becomeAgent') }}
              </template>
            </button>
          </div>
          
          <div v-if="(user?.u_balance || 0) < 30" class="alert alert-warning mt-2">
            <span class="text-xs">余额不足，请联系客服或邀请人充值</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新空投 -->
    <div class="p-4">
      <h2 class="text-lg font-bold mb-4">{{ t('subscription.latestAirdrops') }}</h2>
      
      <!-- 空投列表 -->
      <div v-if="airdrops.length > 0" class="space-y-4">
        <div
          v-for="airdrop in airdrops"
          :key="airdrop.id"
          class="card bg-base-100 shadow card-hover cursor-pointer"
          @click="viewAirdrop(airdrop.id)"
        >
          <div class="card-body">
            <!-- 交易所标签 -->
            <div class="flex justify-between items-start">
              <div class="badge badge-primary">{{ airdrop.exchange.toUpperCase() }}</div>
              <div class="flex items-center gap-1">
                <span class="text-xs">{{ t('subscription.aiScore') }}</span>
                <span class="text-lg font-bold text-primary">{{ airdrop.ai_score || '--' }}</span>
              </div>
            </div>

            <!-- 标题 -->
            <h3 class="card-title text-base mt-2">{{ airdrop.title }}</h3>

            <!-- 描述 -->
            <p class="text-sm text-base-content/70 line-clamp-2">
              {{ airdrop.description }}
            </p>

            <!-- 奖励 -->
            <div class="mt-2 text-sm">
              <span class="font-semibold">{{ t('subscription.rewards') }}:</span>
              <span class="text-primary ml-2">{{ airdrop.rewards }}</span>
            </div>

            <!-- 时间 -->
            <div class="text-xs text-base-content/50 mt-2">
              {{ formatDate(airdrop.end_date) }} {{ t('subscription.ends') }}
            </div>
          </div>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-else-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-12 text-base-content/60">
        <p>{{ t('subscription.noAirdrops') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { UserService } from '@/services'  // ← 使用重构后的Service
import { supabase } from '@/lib/supabase'
import type { Airdrop } from '@/types'
import { format } from 'date-fns'

const { t } = useI18n()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const airdrops = ref<Airdrop[]>([])
const loading = ref(false)
const becomingAgent = ref(false)

// 格式化日期
const formatDate = (date: string) => {
  return format(new Date(date), 'yyyy-MM-dd')
}

// 加载空投信息
const loadAirdrops = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('airdrops')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    airdrops.value = data || []
  } catch (error) {
    console.error('Load airdrops error:', error)
  } finally {
    loading.value = false
  }
}

// 查看空投详情
const viewAirdrop = (id: string) => {
  // TODO: 跳转到详情页或打开模态框
  console.log('View airdrop:', id)
}

// 成为代理（使用新架构 - 自动验证+扣款+流水）
const handleBecomeAgent = async () => {
  if (!user.value) return

  if (!confirm('确认支付 30U 成为代理？成为代理后将获得专属邀请码和推广权益。')) {
    return
  }

  becomingAgent.value = true
  
  try {
    // 使用重构后的Service - 一行代码搞定所有操作！
    const result = await UserService.subscribeAgent(user.value.id)
    
    if (result.success && result.data) {
      // 更新本地用户状态
      authStore.user = result.data
      
      // 同步更新localStorage（开发模式）
      const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '{}')
      const username = authStore.user?.username
      if (username && registeredUsers[username]) {
        registeredUsers[username].userData = result.data
        localStorage.setItem('registered_users', JSON.stringify(registeredUsers))
      }
      
      // 显示成功提示
      const inviteCode = result.data.invite_code
      alert(`🎉 恭喜成为代理！\n\n您的专属邀请码：${inviteCode}\n\n已自动复制到剪贴板，快去邀请好友吧！`)
      
      // 复制邀请码到剪贴板
      try {
        await navigator.clipboard.writeText(inviteCode)
      } catch (err) {
        console.error('复制失败:', err)
      }
    } else {
      // 显示错误信息
      alert(result.error || '成为代理失败，请稍后重试')
    }
    
  } catch (error) {
    console.error('成为代理失败:', error)
    alert('成为代理失败，请稍后重试')
  } finally {
    becomingAgent.value = false
  }
}

onMounted(() => {
  loadAirdrops()
})
</script>

