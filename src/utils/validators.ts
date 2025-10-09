/**
 * 通用验证器 - 轻快准狠
 * 统一的输入验证和安全检查
 */

// UUID格式验证
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// 金额验证
export function validateAmount(amount: number, min = 0.01, max = 1000000): void {
  if (!amount || !Number.isFinite(amount)) {
    throw new Error('金额格式错误')
  }
  if (amount < min) {
    throw new Error(`金额不能小于${min}`)
  }
  if (amount > max) {
    throw new Error(`金额不能超过${max}`)
  }
  if (amount < 0) {
    throw new Error('金额不能为负数')
  }
}

// 邀请码验证
export function validateInviteCode(code: string): boolean {
  // 6-10位字母数字组合
  return /^[A-Z0-9]{6,10}$/.test(code)
}

// 用户名验证
export function validateUsername(username: string): void {
  if (!username || username.length < 2) {
    throw new Error('用户名至少2个字符')
  }
  if (username.length > 20) {
    throw new Error('用户名不能超过20个字符')
  }
  // 只允许字母、数字、中文、下划线
  if (!/^[\w\u4e00-\u9fa5]+$/.test(username)) {
    throw new Error('用户名只能包含字母、数字、中文、下划线')
  }
}

// 密码验证
export function validatePassword(password: string): void {
  if (!password || password.length < 6) {
    throw new Error('密码至少6个字符')
  }
  if (password.length > 50) {
    throw new Error('密码不能超过50个字符')
  }
}

// 钱包地址验证（简化版）
export function validateWalletAddress(address: string): boolean {
  // 简化验证：40个字符的十六进制
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// 防SQL注入：清理输入
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // 移除 <>
    .replace(/['"]/g, '') // 移除引号
    .trim()
    .substring(0, 500) // 限制长度
}

// 防XSS：转义HTML
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

// 验证对象不为空
export function validateNotEmpty(obj: any, fields: string[]): void {
  for (const field of fields) {
    if (!obj[field]) {
      throw new Error(`${field} 不能为空`)
    }
  }
}

// 限流检查（简单实现）
const requestCounts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, maxRequests = 10, windowMs = 60000): void {
  const now = Date.now()
  const record = requestCounts.get(key)

  if (!record || now > record.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  if (record.count >= maxRequests) {
    throw new Error('请求过于频繁，请稍后再试')
  }

  record.count++
}

// 清理过期的限流记录
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetAt) {
      requestCounts.delete(key)
    }
  }
}, 300000) // 每5分钟清理一次

