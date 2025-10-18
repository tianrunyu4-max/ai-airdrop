<template>
  <div class="flex flex-col items-center">
    <!-- 当前节点 -->
    <div 
      class="node-card cursor-pointer transform transition-all hover:scale-105"
      :class="{
        'bg-primary text-primary-content': node.position === 'root',
        'bg-success text-success-content': node.position === 'left' && node.username,
        'bg-secondary text-secondary-content': node.position === 'right' && node.username,
        'bg-base-300 text-base-content/40': !node.username,
        'opacity-50': level >= maxLevel
      }"
      @click="$emit('node-click', node)"
    >
      <div class="avatar placeholder mb-2">
        <div class="bg-base-100 text-neutral-content rounded-full w-12">
          <span class="text-xl">{{ node.username?.[0] || '?' }}</span>
        </div>
      </div>
      <div class="font-bold">{{ node.username || '空位' }}</div>
      <div class="text-xs mt-1">
        {{ node.position === 'left' ? '左' : node.position === 'right' ? '右' : '根' }}
      </div>
      <div v-if="node.username" class="text-xs mt-1">
        L: {{ node.left_performance || 0 }} | R: {{ node.right_performance || 0 }}
      </div>
    </div>

    <!-- 子节点 -->
    <div v-if="level < maxLevel && (node.children?.left || node.children?.right)" class="flex gap-8 mt-8">
      <!-- 左子节点 -->
      <div class="flex flex-col items-center">
        <div class="h-8 w-px bg-base-content/20"></div>
        <BinaryNode 
          v-if="node.children?.left"
          :node="node.children.left"
          :level="level + 1"
          :maxLevel="maxLevel"
          @node-click="$emit('node-click', $event)"
        />
        <div v-else class="node-card bg-base-200 opacity-30 cursor-not-allowed">
          <div class="avatar placeholder mb-2">
            <div class="bg-base-300 rounded-full w-12">
              <span class="text-xl">?</span>
            </div>
          </div>
          <div class="text-sm">空位</div>
          <div class="text-xs">左</div>
        </div>
      </div>

      <!-- 右子节点 -->
      <div class="flex flex-col items-center">
        <div class="h-8 w-px bg-base-content/20"></div>
        <BinaryNode 
          v-if="node.children?.right"
          :node="node.children.right"
          :level="level + 1"
          :maxLevel="maxLevel"
          @node-click="$emit('node-click', $event)"
        />
        <div v-else class="node-card bg-base-200 opacity-30 cursor-not-allowed">
          <div class="avatar placeholder mb-2">
            <div class="bg-base-300 rounded-full w-12">
              <span class="text-xl">?</span>
            </div>
          </div>
          <div class="text-sm">空位</div>
          <div class="text-xs">右</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  node: any
  level: number
  maxLevel: number
}>()

defineEmits(['node-click'])
</script>

<style scoped>
.node-card {
  @apply px-4 py-3 rounded-lg shadow-lg text-center min-w-[120px];
  border: 2px solid currentColor;
}
</style>

