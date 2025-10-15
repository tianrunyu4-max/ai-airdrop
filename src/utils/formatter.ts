/**
 * Formatter - 格式化工具
 */

/**
 * 格式化数字（千分位）
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * 格式化金额（添加U符号）
 */
export function formatMoney(amount: number, decimals: number = 2): string {
  return `${formatNumber(amount, decimals)}U`
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * 格式化时间
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  
  return `${hour}:${minute}`
}

/**
 * 格式化相对时间（如：刚刚、5分钟前）
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return formatDate(d)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * 脱敏用户名
 */
export function maskUsername(username: string): string {
  if (username.length <= 2) return username
  
  const first = username[0]
  const last = username[username.length - 1]
  const middle = '*'.repeat(username.length - 2)
  
  return `${first}${middle}${last}`
}

/**
 * 脱敏钱包地址
 */
export function maskWalletAddress(address: string): string {
  if (address.length <= 10) return address
  
  const start = address.slice(0, 6)
  const end = address.slice(-4)
  
  return `${start}...${end}`
}

/**
 * 脱敏手机号
 */
export function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone
  
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

/**
 * 格式化大数字（如：1.2K, 3.5M）
 */
export function formatLargeNumber(num: number): string {
  if (num < 1000) return String(num)
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`
  return `${(num / 1000000000).toFixed(1)}B`
}



















