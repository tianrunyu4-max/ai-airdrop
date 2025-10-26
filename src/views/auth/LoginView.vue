<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- 动态背景 -->
    <div class="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <!-- 动画圆圈 -->
      <div class="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl"></div>
    </div>

    <!-- 语言切换按钮 -->
    <div class="absolute top-4 right-4 z-50">
      <LanguageSwitcher />
    </div>

    <!-- 内容区域 -->
    <div class="relative z-10 min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo和标题 -->
        <div class="text-center mb-8 animate-fade-in">
          <div class="inline-block p-4 bg-white/10 backdrop-blur-lg rounded-3xl mb-4">
            <RocketLaunchIcon class="w-16 h-16 text-white" />
          </div>
          <h1 class="text-4xl font-bold text-white mb-2">
            AI 科技创薪
          </h1>
          <p class="text-white/80 text-lg">持续学习 持续创薪</p>
        </div>

        <!-- 登录卡片 -->
        <div class="card bg-white/90 backdrop-blur-xl shadow-2xl animate-slide-up">
          <div class="card-body p-8">
            <h2 class="text-2xl font-bold text-center mb-6">{{ t('auth.login') }}</h2>

            <!-- 登录表单 -->
            <form @submit.prevent="handleLogin" class="space-y-4">
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
                    autocomplete="username"
                    @focus="errors.username = ''"
                  />
                </div>
                <label v-if="errors.username" class="label">
                  <span class="label-text-alt text-error">{{ errors.username }}</span>
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
                    autocomplete="current-password"
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

              <!-- 登录按钮 -->
              <button
                type="submit"
                class="btn btn-primary w-full btn-lg text-lg"
                :disabled="loading"
              >
                <span v-if="loading" class="loading loading-spinner"></span>
                <span v-else>{{ t('auth.login') }}</span>
              </button>
            </form>

            <!-- 分隔线 -->
            <div class="divider text-sm">{{ t('auth.noAccount') }}</div>

            <!-- 注册链接 -->
            <router-link 
              to="/register" 
              class="btn btn-outline btn-primary w-full"
            >
              {{ t('auth.goRegister') }}
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import {
  RocketLaunchIcon,
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
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

  if (!form.password) {
    errors.password = t('auth.errors.passwordRequired')
    return false
  }

  return true
}

const handleLogin = async () => {
  if (!validateForm()) return

  loading.value = true
  errors.general = ''

  try {
    const result = await authStore.login(form.username, form.password)

    if (result.success) {
      // ✅ 优化：立即跳转，不等待loading.value = false
      console.log('🚀 登录成功，立即跳转')
      router.replace('/chat')
    } else {
      errors.general = result.error || t('auth.errors.loginFailed')
      loading.value = false
    }
  } catch (error: any) {
    console.error('Login error:', error)
    errors.general = error.message || t('auth.errors.loginFailed')
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
