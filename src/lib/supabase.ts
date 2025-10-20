import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// 检测是否在国内网络环境
const isChinaNetwork = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return timezone.includes('Asia/Shanghai') || 
         timezone.includes('Asia/Chongqing') ||
         timezone.includes('Asia/Beijing')
}

// 检测网络连接
const checkNetworkConnection = async () => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3秒超时
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.log('🌐 网络检测失败，可能在国内网络环境')
    return false
  }
}

// 导出是否使用开发模式的标志
// 只有 URL 是 placeholder 时才使用开发模式（localStorage）
export const isDevMode = supabaseUrl.includes('placeholder')

// 检测是否应该使用本地模式（国内网络 + 无法连接Supabase）
export const shouldUseLocalMode = async () => {
  if (isDevMode) return true
  if (isChinaNetwork()) {
    const canConnect = await checkNetworkConnection()
    if (!canConnect) {
      console.warn('🌐 检测到国内网络环境且无法连接Supabase，切换到本地模式')
      return true
    }
  }
  return false
}

if (isDevMode) {
  console.warn('⚠️ 开发模式：使用模拟数据，无需真实 Supabase 配置')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json'
    }
  }
})

