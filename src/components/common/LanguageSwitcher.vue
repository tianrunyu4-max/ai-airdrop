<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-ghost btn-circle">
      <GlobeAltIcon class="w-8 h-8" />
    </label>
    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-32 mt-2">
      <li>
        <a 
          :class="{ 'active bg-primary text-primary-content': currentLocale === 'zh' }"
          @click="changeLanguage('zh')"
        >
          🇨🇳 中文
        </a>
      </li>
      <li>
        <a 
          :class="{ 'active bg-primary text-primary-content': currentLocale === 'en' }"
          @click="changeLanguage('en')"
        >
          🇺🇸 English
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { GlobeAltIcon } from '@heroicons/vue/24/outline'

const { locale } = useI18n()

const currentLocale = computed(() => locale.value)

const changeLanguage = (lang: string) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
  
  // 可选：通知用户
  // console.log(`Language changed to: ${lang}`)
}
</script>

<style scoped>
.dropdown-content {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
</style>






