import { createI18n } from 'vue-i18n'
import zh from './locales/zh.json'
import en from './locales/en.json'

// 从本地存储获取语言设置
const getStoredLocale = (): string => {
  return localStorage.getItem('locale') || 'zh'
}

const i18n = createI18n({
  legacy: false,
  locale: getStoredLocale(),
  fallbackLocale: 'zh',
  messages: {
    zh,
    en
  }
})

export default i18n

