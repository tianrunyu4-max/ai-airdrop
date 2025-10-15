# ChatView 集成用户名片指南

**快速集成步骤**

---

## 1. 导入组件（在 `<script setup>` 顶部）

```typescript
import UserCard from '@/components/UserCard.vue'
import UserCardEditor from '@/components/UserCardEditor.vue'
```

## 2. 添加状态变量（在 `<script setup>` 中）

```typescript
// 用户名片相关
const showUserCard = ref(false)
const showUserCardEditor = ref(false)
const selectedUserId = ref<string | null>(null)
```

## 3. 添加方法（在 `<script setup>` 中）

```typescript
// 打开用户名片
const openUserCard = (userId: string) => {
  selectedUserId.value = userId
  showUserCard.value = true
}

// 关闭用户名片
const closeUserCard = () => {
  showUserCard.value = false
  selectedUserId.value = null
}

// 打开名片编辑器
const openCardEditor = () => {
  showUserCardEditor.value = true
}

// 关闭名片编辑器
const closeCardEditor = () => {
  showUserCardEditor.value = false
}

// 名片保存后
const onCardSaved = () => {
  // 可以在这里刷新消息或其他操作
  console.log('名片已保存')
}
```

## 4. 修改头像HTML（第160-167行）

**修改前**：
```vue
<!-- 头像 -->
<div class="avatar placeholder flex-shrink-0">
  <div 
    class="w-8 h-8 rounded-full"
    :class="message.user_id === authStore.user?.id ? 'bg-secondary' : 'bg-primary'"
  >
    <span class="text-xs text-white">{{ message.username?.[0] || '?' }}</span>
  </div>
</div>
```

**修改后**：
```vue
<!-- 头像 - 可点击查看名片 -->
<div class="avatar placeholder flex-shrink-0 cursor-pointer" @click="openUserCard(message.user_id)">
  <div 
    class="w-8 h-8 rounded-full hover:ring-2 hover:ring-yellow-500 transition-all"
    :class="message.user_id === authStore.user?.id ? 'bg-secondary' : 'bg-primary'"
  >
    <span class="text-xs text-white">{{ message.username?.[0] || '?' }}</span>
  </div>
</div>
```

## 5. 在 `<template>` 最后添加组件（在 `</div>` 之前）

```vue
  <!-- 用户名片 -->
  <UserCard 
    :user-id="selectedUserId"
    :is-open="showUserCard"
    @close="closeUserCard"
    @edit="openCardEditor"
  />

  <!-- 用户名片编辑器 -->
  <UserCardEditor 
    :is-open="showUserCardEditor"
    @close="closeCardEditor"
    @saved="onCardSaved"
  />
</template>
```

---

## 完整修改示例

### 修改文件：`src/views/chat/ChatView.vue`

#### 1. 在 `<script setup>` 顶部添加导入：

```typescript
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import GroupSelector from '@/components/GroupSelector.vue'
import GroupManagement from '@/components/GroupManagement.vue'
import UserCard from '@/components/UserCard.vue'              // 👈 新增
import UserCardEditor from '@/components/UserCardEditor.vue' // 👈 新增
```

#### 2. 在 `<script setup>` 中添加状态和方法：

```typescript
// ... 其他代码 ...

// 用户名片相关 👈 新增
const showUserCard = ref(false)
const showUserCardEditor = ref(false)
const selectedUserId = ref<string | null>(null)

// 打开用户名片 👈 新增
const openUserCard = (userId: string) => {
  selectedUserId.value = userId
  showUserCard.value = true
}

// 关闭用户名片 👈 新增
const closeUserCard = () => {
  showUserCard.value = false
  selectedUserId.value = null
}

// 打开名片编辑器 👈 新增
const openCardEditor = () => {
  showUserCardEditor.value = true
}

// 关闭名片编辑器 👈 新增
const closeCardEditor = () => {
  showUserCardEditor.value = false
}

// 名片保存后 👈 新增
const onCardSaved = () => {
  console.log('名片已保存')
}

// ... 其他代码 ...
```

#### 3. 在 `<template>` 中修改头像部分（找到第160-167行左右）：

```vue
<!-- 用户消息 -->
<div v-else class="flex gap-2" :class="message.user_id === authStore.user?.id ? 'flex-row-reverse' : ''">
  <!-- 头像 - 可点击查看名片 👈 修改这里 -->
  <div 
    class="avatar placeholder flex-shrink-0 cursor-pointer" 
    @click="openUserCard(message.user_id)"
  >
    <div 
      class="w-8 h-8 rounded-full hover:ring-2 hover:ring-yellow-500 transition-all"
      :class="message.user_id === authStore.user?.id ? 'bg-secondary' : 'bg-primary'"
    >
      <span class="text-xs text-white">{{ message.username?.[0] || '?' }}</span>
    </div>
  </div>

  <!-- 消息内容 -->
  <div class="flex flex-col max-w-[70%]" :class="message.user_id === authStore.user?.id ? 'items-end' : 'items-start'">
    <!-- ... 其他代码 ... -->
  </div>
</div>
```

#### 4. 在 `<template>` 最后（在最后一个 `</div>` 之前）添加：

```vue
  <!-- ... 其他内容 ... -->

  <!-- 用户名片 👈 新增 -->
  <UserCard 
    :user-id="selectedUserId"
    :is-open="showUserCard"
    @close="closeUserCard"
    @edit="openCardEditor"
  />

  <!-- 用户名片编辑器 👈 新增 -->
  <UserCardEditor 
    :is-open="showUserCardEditor"
    @close="closeCardEditor"
    @saved="onCardSaved"
  />
</div> <!-- 这是最外层div的结束标签 -->
</template>
```

---

## 测试功能

完成修改后，测试以下功能：

1. ✅ 点击聊天消息的头像可以打开用户名片
2. ✅ 查看其他用户的名片
3. ✅ 点击自己的头像可以看到"编辑我的名片"按钮
4. ✅ 点击"编辑我的名片"可以打开编辑器
5. ✅ 在编辑器中上传头像和广告图片
6. ✅ 保存后关闭编辑器

---

## 效果展示

### 点击头像前
```
[消息1]
[头像] 用户A：你好
       
[消息2]
[头像] 用户B：你好啊
```

### 点击头像后
```
弹出用户名片模态框：

┌─────────────────────────┐
│ [背景渐变]               │
│   [正方形头像]           │
│                          │
│ 用户名                   │
│ 商家名称                 │
│                          │
│ 商家描述                 │
│                          │
│ [广告图1] [广告图2]      │
│                          │
│ 📞 联系方式              │
│                          │
│ [编辑我的名片] (自己)    │
└─────────────────────────┘
```

---

## 注意事项

1. **数据库迁移**：确保先执行 `supabase/migrations/create_user_cards.sql`
2. **图片存储**：确保Supabase Storage中的 `user-cards` 存储桶已创建
3. **权限配置**：确保RLS策略正确配置
4. **测试环境**：先在开发环境测试，确认无误后再部署

---

## 常见问题

### Q1: 点击头像没有反应？
**A**: 检查是否正确导入了UserCard组件，以及selectedUserId是否正确传递。

### Q2: 图片上传失败？
**A**: 检查Supabase Storage的`user-cards`存储桶是否已创建，以及存储策略是否正确配置。

### Q3: 名片不显示？
**A**: 检查用户是否已加入群组（触发自动创建名片），或手动调用createDefaultCard。

### Q4: 编辑按钮不显示？
**A**: 检查isOwnCard的判断逻辑，确保authStore.user.id与card.user_id匹配。

---

## 下一步

集成完成后，可以考虑以下增强功能：

- [ ] 在用户列表中显示名片预览
- [ ] 添加名片分享功能
- [ ] 添加名片统计（查看次数）
- [ ] 添加名片模板选择
- [ ] 添加二维码生成功能

---

**按照以上步骤完成集成，用户就可以在群聊中查看和编辑名片了！** 🎉

