<template>
  <button
    class="btn btn-sm btn-ghost"
    :class="{ 'btn-success': copied }"
    @click="copyText"
  >
    <CheckIcon v-if="copied" class="w-4 h-4" />
    <DocumentDuplicateIcon v-else class="w-4 h-4" />
    <span class="ml-1">{{ copied ? t('profile.copied') : t('profile.copy') }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckIcon, DocumentDuplicateIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  text: string
}>()

const { t } = useI18n()
const copied = ref(false)

const copyText = async () => {
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    
    // 2秒后恢复
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案：使用旧API
    const textArea = document.createElement('textarea')
    textArea.value = props.text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}
</script>






