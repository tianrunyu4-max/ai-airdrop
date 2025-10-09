# 开发指南

## 🛠️ 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入配置：

```env
VITE_SUPABASE_URL=你的Supabase项目URL
VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 运行测试

```bash
# 运行测试
npm run test

# 测试UI
npm run test:ui
```

## 📁 项目结构

```
src/
├── assets/          # 静态资源
│   └── styles/      # 全局样式
├── components/      # 组件
│   └── layout/      # 布局组件
├── i18n/           # 国际化
│   └── locales/    # 语言文件
├── lib/            # 工具库
├── router/         # 路由配置
├── stores/         # Pinia状态管理
├── types/          # TypeScript类型定义
├── views/          # 页面组件
│   ├── auth/       # 认证页面
│   ├── chat/       # 群聊页面
│   ├── points/     # 积分页面
│   ├── profile/    # 个人中心
│   └── subscription/ # 订阅页面
├── App.vue         # 根组件
└── main.ts         # 入口文件
```

## 🧪 TDD 开发流程

### 1. 编写测试用例

```typescript
// tests/auth.test.ts
import { describe, it, expect } from 'vitest'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store', () => {
  it('should login successfully', async () => {
    const authStore = useAuthStore()
    const result = await authStore.login('testuser', 'password123')
    expect(result.success).toBe(true)
  })
})
```

### 2. 实现功能

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  async function login(username: string, password: string) {
    // 实现登录逻辑
    return { success: true }
  }
  
  return { login }
})
```

### 3. 运行测试

```bash
npm run test
```

## 📝 代码规范

### 命名规范

- 组件文件：`PascalCase.vue`
- 工具函数：`camelCase.ts`
- 常量：`UPPER_SNAKE_CASE`
- CSS类：`kebab-case`

### 注释规范

使用中文注释：

```typescript
/**
 * 用户登录函数
 * @param username 用户名
 * @param password 密码
 * @returns 登录结果
 */
async function login(username: string, password: string) {
  // 实现逻辑
}
```

### Git提交规范

```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

## 🎨 组件开发

### 创建新组件

```vue
<template>
  <div class="my-component">
    {{ message }}
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Hello')
</script>

<style scoped>
.my-component {
  @apply p-4 bg-base-100;
}
</style>
```

### 使用 Composition API

```typescript
import { ref, computed, onMounted } from 'vue'

// 响应式数据
const count = ref(0)

// 计算属性
const doubled = computed(() => count.value * 2)

// 生命周期
onMounted(() => {
  console.log('组件已挂载')
})
```

## 🔌 API调用

### Supabase查询

```typescript
import { supabase } from '@/lib/supabase'

// 查询
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

// 插入
const { data, error } = await supabase
  .from('users')
  .insert({ username: 'test' })

// 更新
const { data, error } = await supabase
  .from('users')
  .update({ u_balance: 100 })
  .eq('id', userId)

// 删除
const { data, error } = await supabase
  .from('users')
  .delete()
  .eq('id', userId)
```

### 实时订阅

```typescript
const subscription = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    },
    (payload) => {
      console.log('新消息:', payload.new)
    }
  )
  .subscribe()

// 取消订阅
subscription.unsubscribe()
```

## 🌍 国际化

### 添加新语言

1. 在 `src/i18n/locales/` 创建语言文件
2. 在 `src/i18n/index.ts` 中导入

### 使用翻译

```vue
<template>
  <div>{{ t('nav.chat') }}</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
```

## 🐛 调试

### Vue Devtools

安装 [Vue Devtools](https://devtools.vuejs.org/)

### Supabase调试

在 Supabase Dashboard → Logs 查看实时日志

### 浏览器调试

```typescript
console.log('调试信息')
console.error('错误信息')
console.table(data)
```

## 📦 构建

### 开发环境

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

### 预览构建

```bash
npm run preview
```

## 🔄 更新依赖

```bash
# 检查更新
npm outdated

# 更新所有依赖
npm update

# 更新特定依赖
npm update vue
```

## 📚 相关资源

- [Vue 3 文档](https://cn.vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/zh/)
- [TailwindCSS 文档](https://tailwindcss.com/)
- [DaisyUI 文档](https://daisyui.com/)
- [Supabase 文档](https://supabase.com/docs)
- [Vitest 文档](https://vitest.dev/)

