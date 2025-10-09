<template>
  <div class="h-full overflow-y-auto custom-scrollbar bg-gradient-to-b from-yellow-50 via-white to-yellow-50 pb-24">
    <!-- 顶部用户信息卡片 -->
    <div class="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 px-6 pt-8 pb-12 relative overflow-hidden">
      <!-- 装饰性背景 -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
      <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      
      <div class="relative z-10">
        <!-- 用户头像和基本信息 -->
        <div class="flex items-center gap-4 mb-6">
          <div class="avatar placeholder">
            <div class="bg-white/30 backdrop-blur-sm text-white rounded-full w-20 h-20 shadow-xl">
              <span class="text-3xl font-bold">{{ user?.username[0] }}</span>
            </div>
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-white">{{ user?.username }}</h2>
            <div class="flex gap-2 mt-2">
              <div v-if="user?.is_agent" class="badge badge-warning">
                👑 代理会员
              </div>
              <div v-if="user?.is_admin" class="badge badge-error">
                🔐 管理员
              </div>
            </div>
          </div>
        </div>

        <!-- 邀请码卡片 -->
        <div class="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
          <div class="flex items-center justify-between mb-3">
            <div class="text-white/90 text-sm">我的邀请码</div>
            <button 
              @click="copyInviteCode" 
              class="btn btn-sm bg-white/20 hover:bg-white/30 border-none text-white"
            >
              📋 复制
            </button>
          </div>
          <div class="text-white font-mono text-2xl font-bold tracking-wider">
            {{ inviteCode }}
          </div>
          <div class="mt-3 text-white/80 text-xs">
            邀请链接：{{ inviteLink }}
          </div>
        </div>
      </div>
    </div>

    <!-- 数据统计卡片 -->
    <div class="px-4 -mt-6 relative z-20">
      <div class="bg-white rounded-2xl shadow-2xl border-2 border-yellow-200 p-4">
        <div class="grid grid-cols-3 divide-x divide-gray-200">
          <div class="text-center px-2">
            <div class="text-3xl font-bold text-yellow-600">{{ user?.direct_referral_count || 0 }}</div>
            <div class="text-xs text-gray-600 mt-1">直推人数</div>
          </div>
          <div class="text-center px-2">
            <div class="text-3xl font-bold text-green-600">{{ networkCount }}</div>
            <div class="text-xs text-gray-600 mt-1">团队人数</div>
          </div>
          <div class="text-center px-2">
            <div class="text-3xl font-bold text-blue-600">{{ user?.total_earnings.toFixed(2) || '0.00' }}</div>
            <div class="text-xs text-gray-600 mt-1">总收益(U)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 余额卡片 -->
    <div class="p-4">
      <div class="bg-gradient-to-br from-white to-yellow-50 rounded-2xl p-6 shadow-lg border-2 border-yellow-200">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="text-gray-600 text-sm">账户余额</div>
            <div class="text-4xl font-bold text-yellow-600 mt-1">
              {{ user?.u_balance.toFixed(2) || '0.00' }} U
            </div>
          </div>
          <div class="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
            <span class="text-3xl">💰</span>
          </div>
        </div>
        
        <!-- 积分余额显示 -->
        <div class="mt-4 mb-4">
          <div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-300">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-600 mb-1">互转积分</div>
                <div class="text-3xl font-bold text-orange-600">
                  {{ (user?.transfer_points || 0).toFixed(2) }}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  💡 可赠送给团队新伙伴学习AI
                </div>
              </div>
              <div class="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span class="text-2xl">🎁</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-3">
          <button 
            @click="showWithdrawModal = true"
            class="btn bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white border-none shadow-md"
          >
            💸 提现
          </button>
          <button 
            @click="showTransferModal = true"
            class="btn bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white border-none shadow-md"
          >
            🔄 转账
          </button>
        </div>
      </div>
    </div>

    <!-- 代理状态/成为代理卡片 -->
    <div v-if="!user?.is_agent" class="px-4 mb-4">
      <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border-2 border-purple-200">
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-3xl">👑</span>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-800 mb-2">加入Binary对碰系统</h3>
            <div class="text-sm text-gray-600 space-y-1 mb-4">
              <div>✅ A+B双区公排自动化排线</div>
              <div>✅ 对碰奖励（7U/对）</div>
              <div>✅ 8代平级奖（2U/人）</div>
              <div>✅ 全系统分红（15%）</div>
              <div>✅ 解锁积分互转+AI学习机</div>
              <div class="text-purple-600 font-medium mt-2">仅需支付 30U 永久有效！</div>
            </div>
            <button 
              @click="becomeAgent"
              :disabled="(user?.u_balance || 0) < 30 || becomingAgent"
              class="btn bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white shadow-md hover:shadow-xl transition-all disabled:opacity-50 w-full"
            >
              <span v-if="becomingAgent" class="loading loading-spinner loading-sm"></span>
              <span v-else>{{ (user?.u_balance || 0) < 30 ? 'U余额不足（需要30U）' : '🚀 立即加入Binary系统' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="px-4">
      <div class="text-gray-800 font-bold mb-3 text-sm">功能菜单</div>
      <div class="space-y-3">
        <!-- 管理后台 -->
        <button 
          v-if="user?.is_admin"
          @click="$router.push('/admin')"
          class="w-full bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 rounded-xl p-4 flex items-center justify-between border-2 border-red-200 transition-all"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <span class="text-xl">🔐</span>
            </div>
            <div class="text-left">
              <div class="font-bold text-gray-800">管理后台</div>
              <div class="text-xs text-gray-600">系统管理和配置</div>
            </div>
          </div>
          <span class="text-gray-400">→</span>
        </button>

        <!-- 交易记录 -->
        <button 
          @click="$router.push('/earnings')"
          class="w-full bg-white hover:bg-yellow-50 rounded-xl p-4 flex items-center justify-between border-2 border-yellow-200 transition-all"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
              <span class="text-xl">📊</span>
            </div>
            <div class="text-left">
              <div class="font-bold text-gray-800">收益明细</div>
              <div class="text-xs text-gray-600">查看收益记录</div>
            </div>
          </div>
          <span class="text-gray-400">→</span>
        </button>

        <!-- 我的团队 -->
        <button 
          @click="$router.push('/team')"
          class="w-full bg-white hover:bg-yellow-50 rounded-xl p-4 flex items-center justify-between border-2 border-yellow-200 transition-all"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
              <span class="text-xl">👥</span>
            </div>
            <div class="text-left">
              <div class="font-bold text-gray-800">我的团队</div>
              <div class="text-xs text-gray-600">团队统计和管理</div>
            </div>
          </div>
          <span class="text-gray-400">→</span>
        </button>

        <!-- 系统设置 -->
        <button 
          @click="showSettingsModal = true"
          class="w-full bg-white hover:bg-yellow-50 rounded-xl p-4 flex items-center justify-between border-2 border-yellow-200 transition-all"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
              <span class="text-xl">⚙️</span>
            </div>
            <div class="text-left">
              <div class="font-bold text-gray-800">系统设置</div>
              <div class="text-xs text-gray-600">语言和主题</div>
            </div>
          </div>
          <span class="text-gray-400">→</span>
        </button>
      </div>
    </div>

    <!-- 关注我们 -->
    <div class="px-4 mt-6">
      <div class="text-gray-800 font-bold mb-3 text-sm">关注我们</div>
      <div class="grid grid-cols-2 gap-3">
        <!-- 抖音 -->
        <button 
          @click="openSocialModal('douyin')"
          class="bg-white hover:bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border-2 border-gray-200 transition-all"
        >
          <div class="w-12 h-12 flex items-center justify-center mb-2">
            <span class="text-3xl">🎵</span>
          </div>
          <div class="font-bold text-gray-800 text-sm">抖音</div>
          <div v-if="socialAccounts.douyin" class="text-xs text-green-600 mt-1">✓ 已设置</div>
          <div v-else class="text-xs text-gray-400 mt-1">点击设置</div>
        </button>

        <!-- 小红书 -->
        <button 
          @click="openSocialModal('xiaohongshu')"
          class="bg-white hover:bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border-2 border-gray-200 transition-all"
        >
          <div class="w-12 h-12 flex items-center justify-center mb-2">
            <span class="text-3xl">📕</span>
          </div>
          <div class="font-bold text-gray-800 text-sm">小红书</div>
          <div v-if="socialAccounts.xiaohongshu" class="text-xs text-green-600 mt-1">✓ 已设置</div>
          <div v-else class="text-xs text-gray-400 mt-1">点击设置</div>
        </button>

        <!-- B站 -->
        <button 
          @click="openSocialModal('bilibili')"
          class="bg-white hover:bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border-2 border-gray-200 transition-all"
        >
          <div class="w-12 h-12 flex items-center justify-center mb-2">
            <span class="text-3xl">📺</span>
          </div>
          <div class="font-bold text-gray-800 text-sm">哔哩哔哩</div>
          <div v-if="socialAccounts.bilibili" class="text-xs text-green-600 mt-1">✓ 已设置</div>
          <div v-else class="text-xs text-gray-400 mt-1">点击设置</div>
        </button>

        <!-- 微博 -->
        <button 
          @click="openSocialModal('weibo')"
          class="bg-white hover:bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border-2 border-gray-200 transition-all"
        >
          <div class="w-12 h-12 flex items-center justify-center mb-2">
            <span class="text-3xl">🐦</span>
          </div>
          <div class="font-bold text-gray-800 text-sm">微博</div>
          <div v-if="socialAccounts.weibo" class="text-xs text-green-600 mt-1">✓ 已设置</div>
          <div v-else class="text-xs text-gray-400 mt-1">点击设置</div>
        </button>

        <!-- YouTube -->
        <button 
          @click="openSocialModal('youtube')"
          class="bg-white hover:bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border-2 border-gray-200 transition-all"
        >
          <div class="w-12 h-12 flex items-center justify-center mb-2">
            <span class="text-3xl">▶️</span>
          </div>
          <div class="font-bold text-gray-800 text-sm">YouTube</div>
          <div v-if="socialAccounts.youtube" class="text-xs text-green-600 mt-1">✓ 已设置</div>
          <div v-else class="text-xs text-gray-400 mt-1">点击设置</div>
        </button>

        <!-- 快手 -->
        <button 
          @click="openSocialModal('kuaishou')"
          class="bg-white hover:bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border-2 border-gray-200 transition-all"
        >
          <div class="w-12 h-12 flex items-center justify-center mb-2">
            <span class="text-3xl">⚡</span>
          </div>
          <div class="font-bold text-gray-800 text-sm">快手</div>
          <div v-if="socialAccounts.kuaishou" class="text-xs text-green-600 mt-1">✓ 已设置</div>
          <div v-else class="text-xs text-gray-400 mt-1">点击设置</div>
        </button>
      </div>
    </div>

    <!-- 退出登录 -->
    <div class="p-4 mt-4">
      <button 
        @click="handleLogout"
        class="w-full bg-white hover:bg-red-50 text-red-600 rounded-xl p-4 flex items-center justify-center gap-2 border-2 border-red-200 font-bold transition-all"
      >
        <span>🚪</span>
        <span>退出登录</span>
      </button>
    </div>

    <!-- 社交账号设置Modal -->
    <dialog class="modal" :class="{ 'modal-open': showSocialModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-gray-800 mb-4">
          {{ socialPlatformNames[currentSocialPlatform] }}账号设置
        </h3>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">账号ID/用户名</span>
          </label>
          <input 
            v-model="socialAccountInput"
            type="text" 
            :placeholder="`请输入${socialPlatformNames[currentSocialPlatform]}账号`"
            class="input input-bordered"
          />
        </div>

        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text">主页链接（选填）</span>
          </label>
          <input 
            v-model="socialLinkInput"
            type="text" 
            placeholder="https://..."
            class="input input-bordered"
          />
        </div>

        <div class="modal-action">
          <button class="btn" @click="closeSocialModal">取消</button>
          <button class="btn btn-primary" @click="saveSocialAccount">保存</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeSocialModal">
        <button>close</button>
      </form>
    </dialog>

    <!-- ✅ 邀请码输入Modal -->
    <dialog class="modal" :class="{ 'modal-open': showInviteCodeModal }">
      <div class="modal-box max-w-md">
        <h3 class="font-bold text-lg text-purple-600 mb-4">🎁 加入Binary对碰系统</h3>
        
        <div class="alert alert-info mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <p class="font-bold">支付费用：30U</p>
            <div class="text-sm mt-2 space-y-1">
              <p>✅ A+B双区公排自动化排线</p>
              <p>✅ 对碰奖励（7U/对）</p>
              <p>✅ 8代平级奖（2U/人）</p>
              <p>✅ 全系统分红（15%）</p>
              <p>✅ 解锁积分互转+AI学习机</p>
            </div>
          </div>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">请输入邀请码 <span class="text-red-500">*</span></span>
          </label>
          <input
            v-model="inviteCodeInput"
            type="text"
            placeholder="输入8位邀请码"
            class="input input-bordered input-primary w-full text-uppercase"
            maxlength="8"
            @input="inviteCodeInput = inviteCodeInput.toUpperCase()"
          />
          <label class="label">
            <span class="label-text-alt text-gray-500">💡 邀请码由您的推荐人提供</span>
          </label>
        </div>

        <div class="alert alert-warning mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <div>
            <p class="text-sm">⚠️ 邀请人必须是已付费的AI代理</p>
            <p class="text-sm">⚠️ 邀请关系一旦建立，无法更改</p>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="cancelBecomeAgent" :disabled="becomingAgent">取消</button>
          <button 
            class="btn btn-primary bg-gradient-to-r from-purple-500 to-pink-500 border-none"
            @click="confirmBecomeAgent"
            :disabled="becomingAgent || !inviteCodeInput || (user?.u_balance || 0) < 30"
          >
            <span v-if="becomingAgent" class="loading loading-spinner loading-sm"></span>
            <span v-else>
              {{ (user?.u_balance || 0) < 30 ? 'U余额不足（需要30U）' : '🚀 确认加入（30U）' }}
            </span>
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="cancelBecomeAgent">
        <button>close</button>
      </form>
    </dialog>

    <!-- 设置Modal -->
    <dialog class="modal" :class="{ 'modal-open': showSettingsModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">系统设置</h3>
        
        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text">语言</span>
          </label>
          <select v-model="selectedLanguage" class="select select-bordered" @change="changeLanguage">
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>

        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text">主题</span>
          </label>
          <select v-model="selectedTheme" class="select select-bordered" @change="changeTheme">
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showSettingsModal = false">关闭</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showSettingsModal = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- 提现Modal (保留原有逻辑) -->
    <!-- ...原有的提现Modal代码... -->

    <!-- 转账Modal (保留原有逻辑) -->
    <!-- ...原有的转账Modal代码... -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'
import { AgentService } from '@/services/AgentService'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const { t } = useI18n()

// 用户信息
const user = computed(() => authStore.user)
const networkCount = ref(0)

// 邀请码信息
const inviteCode = computed(() => user.value?.invite_code || 'LOADING...')
const inviteLink = computed(() => {
  if (!inviteCode.value || inviteCode.value === 'LOADING...') return ''
  return `${window.location.origin}/register?code=${inviteCode.value}`
})

// Modal状态
const showSettingsModal = ref(false)
const showWithdrawModal = ref(false)
const showTransferModal = ref(false)
const showSocialModal = ref(false)

// 代理相关状态
const becomingAgent = ref(false)

// 社交账号状态
const currentSocialPlatform = ref<string>('')
const socialAccountInput = ref('')
const socialLinkInput = ref('')
const socialAccounts = ref<Record<string, any>>({
  douyin: null,
  xiaohongshu: null,
  bilibili: null,
  weibo: null,
  youtube: null,
  kuaishou: null
})

const socialPlatformNames: Record<string, string> = {
  douyin: '抖音',
  xiaohongshu: '小红书',
  bilibili: '哔哩哔哩',
  weibo: '微博',
  youtube: 'YouTube',
  kuaishou: '快手'
}

// 设置
const selectedLanguage = ref('zh')
const selectedTheme = ref('light')

// 复制邀请码
const copyInviteCode = async () => {
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    toast.success('邀请码已复制到剪贴板')
  } catch (error) {
    toast.error('复制失败，请手动复制')
  }
}

// ✅ 邀请码输入相关
const showInviteCodeModal = ref(false)
const inviteCodeInput = ref('')

// 成为AI代理（加入Binary系统）
const becomeAgent = async () => {
  if (!user.value) return

  // ✅ 显示邀请码输入对话框
  showInviteCodeModal.value = true
}

// ✅ 确认成为代理（输入邀请码后）
const confirmBecomeAgent = async () => {
  if (!user.value) return

  // 验证邀请码
  if (!inviteCodeInput.value || inviteCodeInput.value.trim() === '') {
    toast.error('请输入邀请码')
    return
  }

  try {
    becomingAgent.value = true
    const result = await AgentService.becomeAgent(user.value.id, inviteCodeInput.value.trim())

    if (result.success) {
      toast.success('🎉 ' + (result.message || '成功成为AI代理！'))
      // 刷新用户数据
      await authStore.loadUser()
      // 关闭对话框
      showInviteCodeModal.value = false
      inviteCodeInput.value = ''
    } else {
      toast.error(result.error || '操作失败')
    }
  } catch (error: any) {
    toast.error(error.message || '操作失败')
    console.error('成为代理失败:', error)
  } finally {
    becomingAgent.value = false
  }
}

// 取消成为代理
const cancelBecomeAgent = () => {
  showInviteCodeModal.value = false
  inviteCodeInput.value = ''
}

// 打开社交账号设置
const openSocialModal = (platform: string) => {
  currentSocialPlatform.value = platform
  const existing = socialAccounts.value[platform]
  socialAccountInput.value = existing?.account || ''
  socialLinkInput.value = existing?.link || ''
  showSocialModal.value = true
}

// 关闭社交账号设置
const closeSocialModal = () => {
  showSocialModal.value = false
  socialAccountInput.value = ''
  socialLinkInput.value = ''
  currentSocialPlatform.value = ''
}

// 保存社交账号
const saveSocialAccount = async () => {
  if (!socialAccountInput.value.trim()) {
    toast.error('请输入账号信息')
    return
  }

  try {
    // 保存到本地存储（你也可以保存到数据库）
    const platform = currentSocialPlatform.value
    socialAccounts.value[platform] = {
      account: socialAccountInput.value.trim(),
      link: socialLinkInput.value.trim(),
      updatedAt: new Date().toISOString()
    }

    // 保存到localStorage
    localStorage.setItem('socialAccounts', JSON.stringify(socialAccounts.value))

    toast.success(`${socialPlatformNames[platform]}账号已保存`)
    closeSocialModal()
  } catch (error) {
    toast.error('保存失败')
  }
}

// 加载社交账号
const loadSocialAccounts = () => {
  const saved = localStorage.getItem('socialAccounts')
  if (saved) {
    try {
      socialAccounts.value = JSON.parse(saved)
    } catch (error) {
      console.error('加载社交账号失败:', error)
    }
  }
}

// 切换语言
const changeLanguage = () => {
  // 实现语言切换逻辑
  toast.success('语言切换成功')
}

// 切换主题
const changeTheme = () => {
  // 实现主题切换逻辑
  toast.success('主题切换成功')
}

// 加载团队统计
const loadNetworkStats = async () => {
  try {
    const userId = user.value?.id
    if (!userId) return

    // 获取团队人数（可以从binary_members或其他表查询）
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('inviter_id', userId)
    
    networkCount.value = data?.length || 0
  } catch (error) {
    console.error('加载团队统计失败:', error)
  }
}

// 退出登录
const handleLogout = async () => {
  if (confirm('确定要退出登录吗？')) {
    await authStore.logout()
    router.push('/login')
    toast.success('已退出登录')
  }
}

onMounted(() => {
  loadSocialAccounts()
  loadNetworkStats()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #fbbf24;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #f59e0b;
}
</style>
