/**
 * Toast通知 Composable
 * 
 * 提供全局Toast通知功能，替代原生alert
 */

import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration: number
  closable: boolean
  visible: boolean
}

const toasts = ref<Toast[]>([])
let toastId = 0

export function useToast() {
  /**
   * 显示Toast通知
   */
  const showToast = (options: {
    message: string
    type?: Toast['type']
    duration?: number
    closable?: boolean
  }) => {
    const toast: Toast = {
      id: `toast-${++toastId}`,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration || 3000,
      closable: options.closable !== false,
      visible: true
    }

    toasts.value.push(toast)

    // 自动移除
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(toast.id)
      }, toast.duration)
    }

    return toast.id
  }

  /**
   * 移除Toast
   */
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value[index].visible = false
      // 等待动画结束后移除
      setTimeout(() => {
        toasts.value.splice(index, 1)
      }, 300)
    }
  }

  /**
   * 清除所有Toast
   */
  const clearAll = () => {
    toasts.value = []
  }

  /**
   * 快捷方法
   */
  const success = (message: string, duration?: number) => {
    return showToast({ message, type: 'success', duration })
  }

  const error = (message: string, duration?: number) => {
    return showToast({ message, type: 'error', duration })
  }

  const warning = (message: string, duration?: number) => {
    return showToast({ message, type: 'warning', duration })
  }

  const info = (message: string, duration?: number) => {
    return showToast({ message, type: 'info', duration })
  }

  return {
    toasts,
    showToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info
  }
}


















