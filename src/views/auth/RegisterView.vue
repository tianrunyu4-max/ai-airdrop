<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- 动态背景 -->
    <div class="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500">
      <!-- 动画圆圈 -->
      <div class="absolute top-10 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-10 left-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div class="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl"></div>
    </div>

    <!-- 语言切换按钮 -->
    <div class="absolute top-4 right-4 z-50">
      <LanguageSwitcher />
    </div>

    <!-- 内容区域 -->
    <div class="relative z-10 min-h-screen flex items-center justify-center p-4 py-12">
      <div class="w-full max-w-md">
        <!-- Logo和标题 -->
        <div class="text-center mb-8 animate-fade-in">
          <div class="inline-block p-4 bg-white/10 backdrop-blur-lg rounded-3xl mb-4">
            <SparklesIcon class="w-16 h-16 text-white" />
          </div>
          <h1 class="text-4xl font-bold text-white mb-2">
            AI 科技创薪
          </h1>
          <p class="text-white/80 text-lg">持续学习 持续创薪</p>
        </div>

        <!-- 注册卡片 -->
        <div class="card bg-white/90 backdrop-blur-xl shadow-2xl animate-slide-up">
          <div class="card-body p-8">
            <h2 class="text-2xl font-bold text-center mb-6">{{ t('auth.register') }}</h2>

            <!-- 注册表单 -->
            <form @submit.prevent="handleRegister" class="space-y-4">
              <!-- 用户名 -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">{{ t('auth.username') }}</span>
                </label>
                <div class="relative">
                  <UserIcon class="absolute left-3 top-3.5 w-5 h-5 text-base-content/40" />
                  <input
                    v-model="form.username"
                    type="text"
                    :placeholder="t('auth.placeholders.username')"
                    class="input input-bordered w-full pl-10 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    :class="{ 'input-error': errors.username }"
                    autocomplete="off"
                    @focus="errors.username = ''"
                  />
                </div>
                <label v-if="errors.username" class="label">
                  <span class="label-text-alt text-error">{{ errors.username }}</span>
                </label>
                <label v-else class="label">
                  <span class="label-text-alt text-base-content/60">✓ 3-20位字母或数字（不要用email）</span>
                </label>
              </div>

              <!-- 密码 -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">{{ t('auth.password') }}</span>
                </label>
                <div class="relative">
                  <LockClosedIcon class="absolute left-3 top-3.5 w-5 h-5 text-base-content/40" />
                  <input
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    :placeholder="t('auth.placeholders.password')"
                    class="input input-bordered w-full pl-10 pr-10 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    :class="{ 'input-error': errors.password }"
                    autocomplete="new-password"
                    @focus="errors.password = ''"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-3.5 text-base-content/40 hover:text-base-content"
                    @click="showPassword = !showPassword"
                  >
                    <EyeIcon v-if="!showPassword" class="w-5 h-5" />
                    <EyeSlashIcon v-else class="w-5 h-5" />
                  </button>
                </div>
                <label v-if="errors.password" class="label">
                  <span class="label-text-alt text-error">{{ errors.password }}</span>
                </label>
              </div>

              <!-- 错误提示 -->
              <div v-if="errors.general" class="alert alert-error">
                <ExclamationCircleIcon class="w-5 h-5" />
                <span>{{ errors.general }}</span>
              </div>

              <!-- 注册按钮 -->
              <button
                type="submit"
                class="btn btn-primary w-full btn-lg text-lg"
                :disabled="loading"
              >
                <span v-if="loading" class="loading loading-spinner"></span>
                <span v-else>{{ t('auth.register') }}</span>
              </button>
            </form>

            <!-- 分隔线 -->
            <div class="divider text-sm">{{ t('auth.hasAccount') }}</div>

            <!-- 登录链接 -->
            <router-link 
              to="/login" 
              class="btn btn-outline btn-primary w-full"
            >
              {{ t('auth.goLogin') }}
            </router-link>
          </div>
        </div>

        <!-- 底部信息 -->
        <div class="text-center mt-6 text-white/60 text-sm">
          <p>© 2025AI 智能科技学习集成</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import {
  SparklesIcon,
  UserIcon,
  LockClosedIcon,
  TicketIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: ''
})

const errors = reactive({
  username: '',
  password: '',
  general: ''
})

const loading = ref(false)
const showPassword = ref(false)

const validateForm = (): boolean => {
  errors.username = ''
  errors.password = ''
  errors.general = ''

  if (!form.username) {
    errors.username = t('auth.errors.usernameRequired')
    return false
  }

  // 去除空格
  form.username = form.username.trim()

  if (form.username.length < 3) {
    errors.username = t('auth.errors.usernameTooShort')
    return false
  }

  // 不允许包含@符号（防止使用email）
  if (form.username.includes('@')) {
    errors.username = '用户名不能包含@符号，请使用普通用户名'
    return false
  }

  // 只允许字母、数字、下划线
  if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
    errors.username = '用户名只能包含字母、数字、下划线'
    return false
  }

  if (!form.password) {
    errors.password = t('auth.errors.passwordRequired')
    return false
  }

  if (form.password.length < 6) {
    errors.password = t('auth.errors.passwordTooShort')
    return false
  }

  return true
}

const handleRegister = async () => {
  if (!validateForm()) return

  loading.value = true
  errors.general = ''

  try {
    // ✅ 注册时不传递邀请码，升级AI代理时才填写
    const result = await authStore.register(form.username, form.password)

    if (result.success) {
      // 注册成功，直接跳转到群聊
      router.replace('/chat')
    } else {
      errors.general = result.error || t('auth.errors.registerFailed')
    }
  } catch (error: any) {
    console.error('Register error:', error)
    errors.general = error.message || t('auth.errors.registerFailed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 动画 */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out;
}

.delay-1000 {
  animation-delay: 1s;
}

/* 输入框焦点效果 */
.input:focus {
  transform: translateY(-2px);
  transition: all 0.2s ease;
}

/* 按钮hover效果 */
.btn {
  transition: all 0.3s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}
</style>
