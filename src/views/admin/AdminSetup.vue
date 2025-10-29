<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
      <!-- 标题 -->
      <div class="text-center mb-8">
        <div class="text-6xl mb-4">👑</div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">管理员设置</h1>
        <p class="text-gray-600">创建系统管理员账号</p>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4 text-sm text-left">
          <div class="font-bold text-yellow-800 mb-1">💡 推荐设置：</div>
          <div class="text-yellow-700">
            • 用户名：boss<br>
            • 密码：bossab123<br>
            • 管理员密钥：admin2025
          </div>
        </div>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="createAdmin" class="space-y-6">
        <!-- 用户名 -->
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">用户名</label>
          <input
            v-model="username"
            type="text"
            required
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
            placeholder="请输入管理员用户名"
          />
        </div>

        <!-- 密码 -->
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">密码</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
            placeholder="请输入密码"
          />
        </div>

        <!-- 确认密码 -->
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">确认密码</label>
          <input
            v-model="confirmPassword"
            type="password"
            required
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
            placeholder="请再次输入密码"
          />
        </div>

        <!-- 管理员密钥 -->
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">管理员密钥</label>
          <input
            v-model="adminKey"
            type="password"
            required
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
            placeholder="请输入管理员密钥"
          />
          <p class="text-xs text-gray-500 mt-1">💡 密钥：admin2025</p>
        </div>

        <!-- 提交按钮 -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
        >
          <span v-if="loading">创建中...</span>
          <span v-else>👑 创建管理员账号</span>
        </button>
      </form>

      <!-- 返回链接 -->
      <div class="text-center mt-6">
        <button @click="$router.push('/chat')" class="text-gray-600 hover:text-purple-600 text-sm">
          返回聊天页面
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const adminKey = ref('')
const loading = ref(false)

const createAdmin = async () => {
  // 验证密码
  if (password.value !== confirmPassword.value) {
    alert('❌ 两次输入的密码不一致')
    return
  }

  // 验证密码长度
  if (password.value.length < 6) {
    alert('❌ 密码至少6个字符')
    return
  }

  // 验证管理员密钥
  if (adminKey.value !== 'admin2025') {
    alert('❌ 管理员密钥错误')
    return
  }

  loading.value = true

  try {
    // 检查用户名是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username.value)
      .maybeSingle()

    if (existingUser) {
      alert('❌ 用户名已存在，请更换')
      loading.value = false
      return
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password.value, 10)

    // 生成邀请码
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const inviteCode = (timestamp + random).substring(0, 8)

    // 创建管理员账号
    const { data: newAdmin, error } = await supabase
      .from('users')
      .insert({
        username: username.value,
        password_hash: hashedPassword,
        invite_code: inviteCode,
        inviter_id: null,
        referral_position: 1,
        u_balance: 10000, // 管理员初始余额
        points_balance: 10000,
        mining_points: 10000,
        transfer_points: 0,
        is_agent: true, // 管理员默认是代理
        agent_paid_at: new Date().toISOString(),
        is_admin: true, // ✅ 设置为管理员
        language: 'zh'
      } as any)
      .select()
      .single()

    if (error || !newAdmin) {
      throw new Error(error?.message || '创建失败')
    }

    alert(`✅ 管理员账号创建成功！\n用户名：${username.value}\n请妥善保管密码！`)

    // 自动登录
    authStore.user = newAdmin
    localStorage.setItem('current_user', username.value)
    localStorage.setItem('user_session', JSON.stringify(newAdmin))
    localStorage.setItem('last_login_time', Date.now().toString())

    // 跳转到管理后台
    router.push('/admin/dashboard')
  } catch (error: any) {
    console.error('创建管理员失败:', error)
    alert(`❌ 创建失败：${error.message}`)
  } finally {
    loading.value = false
  }
}
</script>

