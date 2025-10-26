<template>
  <div class="form-control">
    <label class="label">
      <span class="label-text font-semibold">
        {{ param.description || param.param_key }}
      </span>
      <span class="label-text-alt text-gray-500">
        {{ formatRange }}
      </span>
    </label>

    <div class="flex gap-2 items-center">
      <input
        v-model.number="localValue"
        type="number"
        :min="param.min_value || undefined"
        :max="param.max_value || undefined"
        :step="getStep"
        class="input input-bordered flex-1"
        :class="{
          'input-warning': hasChanged,
          'input-error': !isValid
        }"
        @change="handleChange"
      />
      
      <span class="text-sm font-medium text-gray-600 min-w-[40px]">
        {{ param.param_unit || '' }}
      </span>
      
      <button
        v-if="hasChanged"
        @click="reset"
        class="btn btn-sm btn-ghost"
        title="恢复原值"
      >
        ↺
      </button>
    </div>

    <label v-if="!isValid" class="label">
      <span class="label-text-alt text-error">
        {{ validationError }}
      </span>
    </label>

    <label v-else-if="hasChanged" class="label">
      <span class="label-text-alt text-warning">
        未保存的更改
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { SystemParam } from '@/services/SystemParamsService'

interface Props {
  param: SystemParam
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [paramKey: string, newValue: number]
}>()

const localValue = ref(props.param.param_value)
const originalValue = ref(props.param.param_value)

// 监听prop变化（外部重置）
watch(() => props.param.param_value, (newVal) => {
  localValue.value = newVal
  originalValue.value = newVal
})

// 是否有更改
const hasChanged = computed(() => localValue.value !== originalValue.value)

// 步进值（百分比用1，金额用0.01）
const getStep = computed(() => {
  if (props.param.param_unit === '%') return 1
  if (props.param.param_unit === 'U') return 0.01
  return 1
})

// 验证
const isValid = computed(() => {
  const value = localValue.value
  
  if (props.param.min_value !== null && value < props.param.min_value) {
    return false
  }
  
  if (props.param.max_value !== null && value > props.param.max_value) {
    return false
  }
  
  return true
})

const validationError = computed(() => {
  if (!isValid.value) {
    if (props.param.min_value !== null && localValue.value < props.param.min_value) {
      return `最小值：${props.param.min_value}${props.param.param_unit || ''}`
    }
    if (props.param.max_value !== null && localValue.value > props.param.max_value) {
      return `最大值：${props.param.max_value}${props.param.param_unit || ''}`
    }
  }
  return ''
})

// 格式化范围提示
const formatRange = computed(() => {
  const min = props.param.min_value
  const max = props.param.max_value
  const unit = props.param.param_unit || ''
  
  if (min !== null && max !== null) {
    return `${min}${unit} - ${max}${unit}`
  } else if (min !== null) {
    return `≥ ${min}${unit}`
  } else if (max !== null) {
    return `≤ ${max}${unit}`
  }
  return ''
})

// 处理更改
const handleChange = () => {
  if (isValid.value) {
    emit('update', props.param.param_key, localValue.value)
  }
}

// 重置
const reset = () => {
  localValue.value = originalValue.value
  emit('update', props.param.param_key, originalValue.value)
}
</script>








































