# Service层使用指南

## 📚 概述

Service层是业务逻辑的核心，封装了所有与数据库交互的操作，提供统一的API调用接口。

## 🏗️ 架构设计

```
View/Component (视图层)
    ↓ 调用
Service Layer (业务逻辑层)
    ↓ 调用
Supabase Client (数据访问层)
    ↓ 调用
Database (数据库)
```

## 📦 已创建的Service

1. **BaseService** - 基础Service，提供统一错误处理
2. **UserService** - 用户相关操作
3. **TransactionService** - 交易相关操作
4. **ChatService** - 聊天相关操作
5. **WithdrawalService** - 提现相关操作
6. **MiningService** - 矿机相关操作（已存在）

---

## 🔧 使用方法

### 1. 导入Service

```typescript
import { UserService, TransactionService, ChatService } from '@/services'
```

### 2. 调用Service方法

所有Service方法都返回统一的 `ApiResponse` 格式：

```typescript
interface ApiResponse<T> {
  success: boolean  // 是否成功
  data?: T          // 返回数据
  error?: string    // 错误信息
  message?: string  // 提示消息
}
```

---

## 📖 使用示例

### UserService - 用户操作

#### 获取用户信息
```typescript
const result = await UserService.getProfile(userId)

if (result.success) {
  console.log('用户信息:', result.data)
} else {
  console.error('错误:', result.error)
  alert(result.error)
}
```

#### 获取用户余额
```typescript
const result = await UserService.getBalance(userId)

if (result.success) {
  console.log('U余额:', result.data.u_balance)
  console.log('积分余额:', result.data.points_balance)
  console.log('矿机积分:', result.data.mining_points)
  console.log('互转积分:', result.data.transfer_points)
}
```

#### 订阅代理
```typescript
const result = await UserService.subscribeAgent(userId)

if (result.success) {
  alert('订阅成功！您已成为代理')
  // 更新用户状态
  authStore.user = result.data
} else {
  alert(result.error) // 显示错误：余额不足 / 已经是代理
}
```

#### 调整余额
```typescript
// 增加100U
const result = await UserService.adjustUBalance(userId, 100)

// 减少50U
const result = await UserService.adjustUBalance(userId, -50)

if (!result.success) {
  alert(result.error) // 余额不足
}
```

---

### TransactionService - 交易操作

#### U转账
```typescript
const result = await TransactionService.transferU({
  fromUserId: 'user-1',
  toUserId: 'user-2',
  amount: 50,
  description: '转账给朋友'
})

if (result.success) {
  alert('转账成功')
  console.log('发送方交易:', result.data.fromTransaction)
  console.log('接收方交易:', result.data.toTransaction)
} else {
  alert(result.error) // 余额不足 / 接收方不存在
}
```

#### 积分转账
```typescript
const result = await TransactionService.transferPoints({
  fromUserId: authStore.user!.id,
  toUserId: targetUserId,
  amount: 100
})

if (result.success) {
  alert('积分转账成功')
} else {
  alert(result.error) // 互转积分不足
}
```

#### 获取交易记录
```typescript
const result = await TransactionService.getUserTransactions(
  userId,
  50,  // limit
  0    // offset
)

if (result.success) {
  transactions.value = result.data
}
```

#### 获取交易统计
```typescript
const result = await TransactionService.getTransactionStats(userId)

if (result.success) {
  console.log('总收入:', result.data.totalIncome)
  console.log('总支出:', result.data.totalExpense)
  console.log('转入:', result.data.transferIn)
  console.log('转出:', result.data.transferOut)
}
```

---

### ChatService - 聊天操作

#### 获取群组列表
```typescript
const result = await ChatService.getGroups()

if (result.success) {
  groups.value = result.data
}
```

#### 获取消息
```typescript
const result = await ChatService.getMessages(
  groupId,
  100,  // limit
  0     // offset
)

if (result.success) {
  messages.value = result.data
}
```

#### 发送消息
```typescript
const result = await ChatService.sendMessage({
  chat_group_id: groupId,
  user_id: authStore.user!.id,
  username: authStore.user!.username,
  content: '你好',
  type: 'text',
  is_bot: false
})

if (result.success) {
  messages.value.push(result.data)
}
```

#### 上传图片
```typescript
const file = event.target.files[0]
const result = await ChatService.uploadImage(file, authStore.user!.id)

if (result.success) {
  const imageUrl = result.data
  // 发送图片消息
  await ChatService.sendMessage({
    chat_group_id: groupId,
    user_id: authStore.user!.id,
    username: authStore.user!.username,
    content: '发送了一张图片',
    type: 'image',
    image_url: imageUrl,
    is_bot: false
  })
}
```

#### 订阅实时消息
```typescript
const subscription = ChatService.subscribeToMessages(
  groupId,
  (newMessage) => {
    messages.value.push(newMessage)
    scrollToBottom()
  }
)

// 组件卸载时取消订阅
onUnmounted(() => {
  ChatService.unsubscribe(subscription)
})
```

---

### WithdrawalService - 提现操作

#### 创建提现申请
```typescript
const result = await WithdrawalService.createWithdrawal(
  userId,
  100,  // 提现金额
  'TRX1234567890123456789012345678901'  // 钱包地址
)

if (result.success) {
  alert('提现申请已提交')
} else {
  alert(result.error) // 余额不足 / 钱包地址无效 / 有待处理的提现
}
```

#### 获取提现记录
```typescript
const result = await WithdrawalService.getUserWithdrawals(userId)

if (result.success) {
  withdrawals.value = result.data
}
```

#### 审核提现（管理员）
```typescript
const result = await WithdrawalService.reviewWithdrawal(
  withdrawalId,
  true,  // 是否通过
  '审核通过'  // 备注
)

if (result.success) {
  alert(result.message)
}
```

#### 获取提现统计
```typescript
const result = await WithdrawalService.getWithdrawalStats(userId)

if (result.success) {
  console.log('总提现:', result.data.totalWithdrawn)
  console.log('待审核:', result.data.pendingCount)
  console.log('已通过:', result.data.approvedCount)
  console.log('已拒绝:', result.data.rejectedCount)
}
```

---

## 🎯 在Vue组件中使用

### 完整示例：订阅代理页面

```vue
<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">订阅代理</h1>
    
    <div v-if="loading" class="loading loading-spinner"></div>
    
    <div v-else>
      <p>当前余额: {{ balance }}U</p>
      <p>订阅费用: 30U</p>
      
      <button 
        @click="handleSubscribe" 
        class="btn btn-primary"
        :disabled="subscribing"
      >
        {{ subscribing ? '处理中...' : '立即订阅' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { UserService } from '@/services'

const authStore = useAuthStore()
const loading = ref(true)
const subscribing = ref(false)
const balance = ref(0)

// 加载余额
onMounted(async () => {
  const result = await UserService.getBalance(authStore.user!.id)
  
  if (result.success) {
    balance.value = result.data.u_balance
  } else {
    alert('获取余额失败: ' + result.error)
  }
  
  loading.value = false
})

// 订阅代理
const handleSubscribe = async () => {
  if (balance.value < 30) {
    alert('余额不足，请先充值')
    return
  }
  
  if (!confirm('确认支付30U订阅代理？')) {
    return
  }
  
  subscribing.value = true
  
  const result = await UserService.subscribeAgent(authStore.user!.id)
  
  if (result.success) {
    alert('订阅成功！您已成为代理')
    // 更新用户状态
    authStore.user = result.data
    // 刷新余额
    balance.value = result.data.u_balance
  } else {
    alert('订阅失败: ' + result.error)
  }
  
  subscribing.value = false
}
</script>
```

---

## ⚠️ 错误处理

### 常见错误类型

1. **余额不足**
```typescript
const result = await UserService.adjustUBalance(userId, -100)
if (!result.success && result.error === '余额不足') {
  // 处理余额不足
}
```

2. **数据不存在**
```typescript
const result = await UserService.getProfile('invalid-id')
if (!result.success && result.error === '数据不存在') {
  // 处理数据不存在
}
```

3. **权限错误**
```typescript
const result = await UserService.updateProfile(userId, updates)
if (!result.success && result.error === '没有操作权限') {
  // 处理权限错误
}
```

### 统一错误处理

```typescript
const handleApiError = (error: string) => {
  // 根据错误类型显示不同的提示
  if (error.includes('余额')) {
    toast.error('余额不足，请先充值')
  } else if (error.includes('权限')) {
    toast.error('没有操作权限')
    router.push('/login')
  } else {
    toast.error(error)
  }
}

// 使用
const result = await UserService.subscribeAgent(userId)
if (!result.success) {
  handleApiError(result.error!)
}
```

---

## 🚀 最佳实践

### 1. 始终检查返回值
```typescript
// ❌ 错误
const result = await UserService.getProfile(userId)
console.log(result.data.username) // 可能undefined

// ✅ 正确
const result = await UserService.getProfile(userId)
if (result.success && result.data) {
  console.log(result.data.username)
} else {
  console.error(result.error)
}
```

### 2. 使用loading状态
```typescript
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  const result = await UserService.getProfile(userId)
  loading.value = false
  
  if (result.success) {
    // 处理数据
  }
}
```

### 3. 合理使用try-catch
```typescript
try {
  const result = await UserService.subscribeAgent(userId)
  if (result.success) {
    // 成功处理
  } else {
    // 业务错误处理
    alert(result.error)
  }
} catch (error) {
  // 系统错误处理
  console.error('系统错误:', error)
  alert('系统错误，请稍后重试')
}
```

### 4. 组合多个Service调用
```typescript
const transferWithNotification = async (fromId: string, toId: string, amount: number) => {
  // 1. 执行转账
  const transferResult = await TransactionService.transferU({
    fromUserId: fromId,
    toUserId: toId,
    amount
  })
  
  if (!transferResult.success) {
    return transferResult
  }
  
  // 2. 发送通知消息
  const toUser = await UserService.getProfile(toId)
  if (toUser.success) {
    await ChatService.sendMessage({
      chat_group_id: 'system',
      user_id: 'system',
      username: '系统通知',
      content: `您收到${amount}U转账`,
      type: 'system',
      is_bot: true
    })
  }
  
  return transferResult
}
```

---

## 📝 总结

Service层的优势：
- ✅ 统一的API调用方式
- ✅ 统一的错误处理
- ✅ 统一的响应格式
- ✅ 业务逻辑集中管理
- ✅ 易于测试和维护
- ✅ 减少代码重复

下一步：
- [ ] 在现有组件中逐步替换直接的Supabase调用
- [ ] 为每个Service编写单元测试
- [ ] 添加更多业务逻辑方法

---

**最后更新**: 2025-10-05
**版本**: v1.0.0

































