import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import i18n from './i18n'
import App from './App.vue'
import './assets/styles/main.css'
import { CacheManager } from './utils/cacheManager'

// ========================================
// 🧹 强制清除所有旧缓存和Service Worker
// ========================================
async function cleanupAllCaches() {
  console.log('🧹 开始清理所有缓存...')
  
  try {
    // 1. 注销所有Service Worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
        console.log('✅ Service Worker已注销')
      }
    }

    // 2. 清除所有Cache Storage
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName)
        console.log(`✅ 已删除缓存: ${cacheName}`)
      }
    }

    // 3. 清除localStorage中的旧数据（保留用户数据和认证状态）
    const keysToKeep = ['registered_users', 'current_user', 'auth_token']
    const allKeys = Object.keys(localStorage)
    for (const key of allKeys) {
      if (!keysToKeep.includes(key) && !key.startsWith('user_')) {
        localStorage.removeItem(key)
      }
    }

    console.log('✅ 缓存清理完成')
  } catch (error) {
    console.error('清理缓存失败:', error)
  }
}

// 应用启动前先清理缓存
cleanupAllCaches().then(() => {
  console.log('🚀 应用初始化...')
  
  // 初始化缓存管理器
  CacheManager.init()

  // 创建应用实例
  const app = createApp(App)

  // 使用插件
  app.use(createPinia())
  app.use(router)
  app.use(i18n)

  // 挂载应用
  app.mount('#app')

  console.log('✅ 应用启动完成')
})

