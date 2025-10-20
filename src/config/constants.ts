/**
 * 系统常量配置
 */

// 开发模式
export const IS_DEV_MODE = import.meta.env.DEV || !import.meta.env.VITE_SUPABASE_URL

// 应用信息
export const APP_INFO = {
  NAME: 'AI科技',
  SLOGAN: '创新发展',
  SUB_SLOGAN: '持续学习 持续创薪',
  VERSION: '1.0.0'
}

// 时间常量
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000
}

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
}

// 文件上传配置
export const UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_FILE_TYPES: ['application/pdf', 'application/msword']
}

// 正则表达式
export const REGEX = {
  // 用户名：4-20位，字母数字下划线
  USERNAME: /^[a-zA-Z0-9_]{4,20}$/,
  
  // 密码：6-20位
  PASSWORD: /^.{6,20}$/,
  
  // 邀请码：8位大写字母数字
  INVITE_CODE: /^[A-Z0-9]{8}$/,
  
  // TRC20钱包地址：T开头，34位
  TRC20_ADDRESS: /^T[a-zA-Z0-9]{33}$/,
  
  // 手机号
  PHONE: /^1[3-9]\d{9}$/,
  
  // 邮箱
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
}

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络错误，请检查网络连接',
  TIMEOUT: '请求超时，请稍后重试',
  UNAUTHORIZED: '请先登录',
  FORBIDDEN: '没有操作权限',
  NOT_FOUND: '资源不存在',
  SERVER_ERROR: '服务器错误，请稍后重试',
  UNKNOWN_ERROR: '未知错误，请联系客服'
}

// 成功消息
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '登录成功',
  REGISTER_SUCCESS: '注册成功',
  UPDATE_SUCCESS: '更新成功',
  DELETE_SUCCESS: '删除成功',
  SUBMIT_SUCCESS: '提交成功',
  SAVE_SUCCESS: '保存成功'
}

































