/**
 * 缓存管理器
 * 统一管理所有缓存：localStorage、sessionStorage、Cache API、Service Worker
 * 
 * 功能：
 * 1. 版本控制 - 自动清理旧版本缓存
 * 2. 环境隔离 - dev/prod 环境缓存分离
 * 3. 过期管理 - 自动清理过期数据
 * 4. 智能清理 - 按需清理特定模块缓存
 */

// 当前应用版本（每次更新后修改此版本号）
const APP_VERSION = '1.0.6' // 删除名片系统后的版本

// 环境标识
const ENV = import.meta.env.MODE as 'development' | 'production'

// 缓存前缀
const CACHE_PREFIX = `app_${ENV}_v${APP_VERSION}_`

// 版本标记键
const VERSION_KEY = 'app_version'

// 缓存类型
export enum CacheType {
  AUTH = 'auth',           // 认证相关
  USER = 'user',           // 用户数据
  CHAT = 'chat',           // 聊天消息
  BINARY = 'binary',       // Binary系统
  POINTS = 'points',       // 积分系统
  TEMP = 'temp'            // 临时数据
}

interface CacheItem<T = any> {
  value: T
  timestamp: number
  expiry?: number // 过期时间（毫秒）
}

/**
 * 缓存管理器类
 */
export class CacheManager {
  
  /**
   * 初始化缓存系统
   * 检查版本，如果版本不一致则清理所有缓存
   */
  static async init(): Promise<void> {
    console.log('🔧 初始化缓存管理器...')
    
    try {
      // 检查版本
      const storedVersion = localStorage.getItem(VERSION_KEY)
      
      if (storedVersion !== APP_VERSION) {
        console.log(`📦 检测到版本更新: ${storedVersion} → ${APP_VERSION}`)
        await this.clearAll(true)
        localStorage.setItem(VERSION_KEY, APP_VERSION)
        console.log('✅ 缓存已更新到新版本')
      } else {
        console.log(`✅ 当前版本: ${APP_VERSION}`)
      }
      
      // 清理过期数据
      this.cleanExpired()
      
      // 清理跨环境数据
      this.cleanCrossEnvironment()
      
    } catch (error) {
      console.error('❌ 缓存初始化失败:', error)
    }
  }
  
  /**
   * 设置缓存
   */
  static set<T>(type: CacheType, key: string, value: T, expiryMs?: number): void {
    try {
      const fullKey = `${CACHE_PREFIX}${type}_${key}`
      const item: CacheItem<T> = {
        value,
        timestamp: Date.now(),
        expiry: expiryMs
      }
      localStorage.setItem(fullKey, JSON.stringify(item))
    } catch (error) {
      console.error(`缓存设置失败 [${type}:${key}]:`, error)
    }
  }
  
  /**
   * 获取缓存
   */
  static get<T>(type: CacheType, key: string): T | null {
    try {
      const fullKey = `${CACHE_PREFIX}${type}_${key}`
      const stored = localStorage.getItem(fullKey)
      
      if (!stored) return null
      
      const item: CacheItem<T> = JSON.parse(stored)
      
      // 检查是否过期
      if (item.expiry && Date.now() - item.timestamp > item.expiry) {
        this.remove(type, key)
        return null
      }
      
      return item.value
    } catch (error) {
      console.error(`缓存读取失败 [${type}:${key}]:`, error)
      return null
    }
  }
  
  /**
   * 移除指定缓存
   */
  static remove(type: CacheType, key: string): void {
    try {
      const fullKey = `${CACHE_PREFIX}${type}_${key}`
      localStorage.removeItem(fullKey)
    } catch (error) {
      console.error(`缓存删除失败 [${type}:${key}]:`, error)
    }
  }
  
  /**
   * 清理指定类型的所有缓存
   */
  static clearType(type: CacheType): void {
    try {
      const prefix = `${CACHE_PREFIX}${type}_`
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      console.log(`✅ 已清理 ${type} 类型缓存: ${keysToRemove.length} 项`)
    } catch (error) {
      console.error(`清理 ${type} 缓存失败:`, error)
    }
  }
  
  /**
   * 清理过期缓存
   */
  static cleanExpired(): void {
    try {
      let cleanedCount = 0
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith(CACHE_PREFIX)) continue
        
        try {
          const stored = localStorage.getItem(key)
          if (!stored) continue
          
          const item: CacheItem = JSON.parse(stored)
          
          // 检查是否过期
          if (item.expiry && Date.now() - item.timestamp > item.expiry) {
            keysToRemove.push(key)
            cleanedCount++
          }
        } catch (e) {
          // 解析失败的数据也删除
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      if (cleanedCount > 0) {
        console.log(`🧹 清理过期缓存: ${cleanedCount} 项`)
      }
    } catch (error) {
      console.error('清理过期缓存失败:', error)
    }
  }
  
  /**
   * 清理跨环境缓存
   * 生产环境清理开发环境数据，开发环境清理生产环境数据
   */
  static cleanCrossEnvironment(): void {
    try {
      const wrongEnv = ENV === 'development' ? 'production' : 'development'
      const wrongPrefix = `app_${wrongEnv}_`
      let cleanedCount = 0
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(wrongPrefix)) {
          keysToRemove.push(key)
          cleanedCount++
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      if (cleanedCount > 0) {
        console.log(`🧹 清理跨环境缓存: ${cleanedCount} 项`)
      }
    } catch (error) {
      console.error('清理跨环境缓存失败:', error)
    }
  }
  
  /**
   * 清理所有应用缓存
   * @param force 是否强制清理（包括用户登录状态）
   */
  static async clearAll(force: boolean = false): Promise<void> {
    try {
      console.log('🗑️ 开始清理所有缓存...')
      
      // 1. 清理 localStorage
      if (force) {
        localStorage.clear()
        console.log('✅ localStorage 已完全清空')
      } else {
        // 保留登录状态
        const authData = localStorage.getItem('auth_user')
        localStorage.clear()
        if (authData) {
          localStorage.setItem('auth_user', authData)
          console.log('✅ localStorage 已清空（保留登录状态）')
        }
      }
      
      // 2. 清理 sessionStorage
      sessionStorage.clear()
      console.log('✅ sessionStorage 已清空')
      
      // 3. 清理 Cache API
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        console.log(`✅ Cache API 已清空: ${cacheNames.length} 个缓存`)
      }
      
      // 4. 清理 Service Worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(reg => reg.unregister()))
        console.log(`✅ Service Worker 已清理: ${registrations.length} 个`)
      }
      
      console.log('🎉 缓存清理完成！')
    } catch (error) {
      console.error('❌ 清理缓存失败:', error)
      throw error
    }
  }
  
  /**
   * 获取缓存统计信息
   */
  static getStats(): {
    total: number
    byType: Record<string, number>
    size: number
  } {
    const stats = {
      total: 0,
      byType: {} as Record<string, number>,
      size: 0
    }
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith(CACHE_PREFIX)) continue
        
        stats.total++
        
        const value = localStorage.getItem(key)
        if (value) {
          stats.size += value.length
        }
        
        // 统计类型
        const typeMatch = key.match(new RegExp(`${CACHE_PREFIX}(\\w+)_`))
        if (typeMatch) {
          const type = typeMatch[1]
          stats.byType[type] = (stats.byType[type] || 0) + 1
        }
      }
    } catch (error) {
      console.error('获取缓存统计失败:', error)
    }
    
    return stats
  }
  
  /**
   * 打印缓存统计信息
   */
  static printStats(): void {
    const stats = this.getStats()
    console.log('📊 缓存统计:')
    console.log(`  总数: ${stats.total} 项`)
    console.log(`  大小: ${(stats.size / 1024).toFixed(2)} KB`)
    console.log('  分类:', stats.byType)
  }
  
  /**
   * 检查是否需要清理
   * 当缓存大小超过限制时返回 true
   */
  static needsCleanup(maxSizeKB: number = 5120): boolean {
    const stats = this.getStats()
    const sizeKB = stats.size / 1024
    return sizeKB > maxSizeKB
  }
  
  /**
   * 智能清理
   * 优先清理临时数据和过期数据
   */
  static smartCleanup(): void {
    console.log('🧠 执行智能清理...')
    
    // 1. 清理过期数据
    this.cleanExpired()
    
    // 2. 清理临时数据
    this.clearType(CacheType.TEMP)
    
    // 3. 如果还需要清理，清理聊天记录
    if (this.needsCleanup()) {
      console.log('💬 清理聊天记录缓存...')
      this.clearType(CacheType.CHAT)
    }
    
    this.printStats()
  }
}

/**
 * 自动初始化
 */
if (typeof window !== 'undefined') {
  // 页面加载时自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      CacheManager.init()
    })
  } else {
    CacheManager.init()
  }
  
  // 定期清理过期缓存（每10分钟）
  setInterval(() => {
    CacheManager.cleanExpired()
  }, 10 * 60 * 1000)
  
  // 监听存储空间不足
  window.addEventListener('storage', (e) => {
    if (!e.newValue && e.oldValue) {
      console.log('⚠️ 检测到存储清理事件')
    }
  })
}

// 导出快捷方法
export const cache = {
  set: CacheManager.set.bind(CacheManager),
  get: CacheManager.get.bind(CacheManager),
  remove: CacheManager.remove.bind(CacheManager),
  clear: CacheManager.clearAll.bind(CacheManager),
  stats: CacheManager.getStats.bind(CacheManager)
}

