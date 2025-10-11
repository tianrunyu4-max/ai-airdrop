# 📋 AI学习卡V4.0 - 前端页面升级说明

## 🎯 需要修改的核心内容

### `src/views/points/PointsView.vue` - AI学习页面

#### 1. 页面标题和介绍
```vue
<!-- 修改前（V3.0） -->
<h1 class="text-3xl font-bold text-white text-center mb-2">🤖 AI学习机</h1>
<p class="text-center text-yellow-100 text-sm">持续学习 · 持续创新</p>

<!-- 修改后（V4.0） -->
<h1 class="text-3xl font-bold text-white text-center mb-2">💳 AI学习卡</h1>
<p class="text-center text-yellow-100 text-sm">每日签到 · 持续释放</p>
```

#### 2. 资产显示区
```vue
<!-- 修改：学习机 → 学习卡 -->
<div class="text-gray-600 text-xs mb-1">学习卡数量</div>
<div class="text-yellow-700 font-bold text-lg">{{ myMachines.length }}张</div>
```

#### 3. 核心参数展示
```vue
<!-- 修改前（V3.0） -->
<div class="text-center text-red-600 font-bold text-sm mb-2">🔥 V3.0 重大升级</div>
<div class="text-xs text-gray-700 text-center">
  10%释放 · 2倍出局 · 20天回本 · 持续学习 送积分
</div>

<!-- 修改后（V4.0） -->
<div class="text-center text-red-600 font-bold text-sm mb-2">🔥 V4.0 签到制升级</div>
<div class="text-xs text-gray-700 text-center">
  每日签到 · 2-20%释放 · 10倍出局 · 70%到账30%销毁
</div>
```

#### 4. 参数卡片（全部重写）
```vue
<div class="grid grid-cols-2 gap-3 mb-6">
  <!-- 兑换成本 -->
  <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
    <div class="text-gray-600 text-xs mb-1">兑换成本</div>
    <div class="text-yellow-600 font-bold text-xl">7U</div>
    <div class="text-gray-500 text-xs mt-1">= 100积分</div>
  </div>
  
  <!-- 出局倍数 -->
  <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
    <div class="text-gray-600 text-xs mb-1">出局倍数</div>
    <div class="text-yellow-600 font-bold text-xl">10倍</div>
    <div class="text-gray-500 text-xs mt-1">共1000积分</div>
  </div>
  
  <!-- 基础释放 -->
  <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
    <div class="text-gray-600 text-xs mb-1">基础释放</div>
    <div class="text-yellow-600 font-bold text-xl">2%/天</div>
    <div class="text-gray-500 text-xs mt-1">需要签到</div>
  </div>
  
  <!-- 直推加速 -->
  <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
    <div class="text-gray-600 text-xs mb-1">直推加速</div>
    <div class="text-yellow-600 font-bold text-xl">+3%</div>
    <div class="text-gray-500 text-xs mt-1">最高20%</div>
  </div>
</div>
```

#### 5. 收益分配（修改）
```vue
<div class="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl p-4 mb-6 border border-yellow-300">
  <div class="text-center text-sm font-bold text-gray-700 mb-3">📊 每日收益自动分配</div>
  <div class="space-y-2">
    <div class="flex items-center justify-between bg-white rounded-lg p-3">
      <span class="text-gray-600">70% 自动转U</span>
      <span class="text-yellow-600 font-bold">直接到账</span>
    </div>
    <div class="flex items-center justify-between bg-white rounded-lg p-3">
      <span class="text-gray-600">30% 自动销毁</span>
      <span class="text-red-600 font-bold">清0防泡沫</span>
    </div>
  </div>
</div>
```

#### 6. 签到按钮（新增）
```vue
<!-- 在购买区前面添加签到区 -->
<div class="px-4 mt-6">
  <h3 class="text-gray-800 text-xl font-bold mb-4 flex items-center">
    <span class="bg-green-400 w-1 h-6 rounded-full mr-3"></span>
    📅 每日签到
  </h3>
  
  <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-300">
    <!-- 签到状态 -->
    <div class="text-center mb-4">
      <div v-if="isCheckedInToday" class="text-green-600 text-lg font-bold mb-2">
        ✅ 今日已签到
      </div>
      <div v-else class="text-gray-600 text-lg font-bold mb-2">
        ⏰ 今日未签到
      </div>
      
      <div class="text-sm text-gray-500">
        {{ myMachines.filter(m => m.status === 'active' || m.status === 'inactive').length }} 张学习卡等待签到
      </div>
    </div>
    
    <!-- 当前释放率 -->
    <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-4 border border-green-200">
      <div class="text-center">
        <div class="text-gray-600 text-sm mb-1">当前释放率</div>
        <div class="text-green-600 font-bold text-3xl">
          {{ (releaseRate * 100).toFixed(1) }}%/天
        </div>
        <div class="text-xs text-gray-500 mt-2">
          基础 2% + 直推加速 {{ ((releaseRate - 0.02) * 100).toFixed(1) }}%
        </div>
      </div>
    </div>
    
    <!-- 签到按钮 -->
    <button 
      @click="handleCheckin"
      :disabled="isCheckedInToday || myMachines.length === 0"
      class="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all"
      :class="isCheckedInToday || myMachines.length === 0
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
        : 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white'"
    >
      {{ isCheckedInToday ? '✅ 今日已签到' : '📅 签到启动释放' }}
    </button>
    
    <div v-if="!isCheckedInToday && myMachines.length > 0" class="text-center text-red-500 text-sm mt-3">
      ⚠️ 不签到不释放，请记得每天签到！
    </div>
  </div>
</div>
```

#### 7. 兑换学习卡区（修改）
```vue
<div class="px-4 mt-6">
  <h3 class="text-gray-800 text-xl font-bold mb-4 flex items-center">
    <span class="bg-yellow-400 w-1 h-6 rounded-full mr-3"></span>
    💳 兑换学习卡
  </h3>
  
  <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-300">
    <!-- 学习卡图标 -->
    <div class="flex justify-center mb-4">
      <div class="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-all">
        💳
      </div>
    </div>
    
    <!-- 学习卡信息 -->
    <div class="text-center mb-6">
      <h4 class="text-2xl font-bold text-gray-800 mb-2">AI智能学习卡</h4>
      <p class="text-gray-600 text-sm">每日签到 · 持续释放 · 智能分配</p>
    </div>
    
    <!-- 数量选择 -->
    <div class="mb-6">
      <label class="block text-gray-700 font-bold mb-3 text-center">
        兑换数量（最多10张）
      </label>
      <div class="flex items-center justify-center gap-4">
        <button 
          @click="purchaseCount = Math.max(1, purchaseCount - 1)"
          class="w-12 h-12 bg-gray-200 rounded-full font-bold text-xl text-gray-700 hover:bg-gray-300 transition-all"
        >
          -
        </button>
        <div class="text-4xl font-bold text-yellow-600 w-20 text-center">
          {{ purchaseCount }}
        </div>
        <button 
          @click="purchaseCount = Math.min(10, purchaseCount + 1)"
          class="w-12 h-12 bg-yellow-500 rounded-full font-bold text-xl text-white hover:bg-yellow-600 transition-all"
        >
          +
        </button>
      </div>
      <div class="text-center text-sm text-gray-600 mt-2">
        总成本：{{ (purchaseCount * 7).toFixed(0) }}U = {{ (purchaseCount * 100) }}积分
      </div>
    </div>
    
    <!-- 兑换按钮 -->
    <button 
      @click="exchangeCard"
      :disabled="!user?.is_agent || (user?.u_balance || 0) < purchaseCount * 7"
      class="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all"
      :class="!user?.is_agent || (user?.u_balance || 0) < purchaseCount * 7
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
        : 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white'"
    >
      {{ !user?.is_agent ? '请先加入Binary系统' : `💳 兑换 ${purchaseCount} 张学习卡` }}
    </button>
    
    <div v-if="user?.is_agent && (user?.u_balance || 0) < purchaseCount * 7" class="text-center text-red-500 text-sm mt-3">
      余额不足，需要 {{ (purchaseCount * 7).toFixed(2) }}U
    </div>
  </div>
</div>
```

#### 8. 我的学习卡列表（修改）
```vue
<!-- 修改标题和显示内容 -->
<h3 class="text-gray-800 text-xl font-bold mb-4 flex items-center">
  <span class="bg-yellow-400 w-1 h-6 rounded-full mr-3"></span>
  我的学习卡
</h3>

<!-- 卡片状态显示 -->
<div class="badge" :class="{
  'badge-success': machine.status === 'active',
  'badge-warning': machine.status === 'inactive',
  'badge-error': machine.status === 'exited'
}">
  {{ machine.status === 'active' ? '学习中' : 
     machine.status === 'inactive' ? '未签到' : 
     '已出局' }}
</div>
```

---

## 🔧 Script 部分修改

### 1. 新增数据
```typescript
const isCheckedInToday = ref(false)
const releaseRate = ref(0.02) // 默认2%
```

### 2. 签到方法
```typescript
const handleCheckin = async () => {
  if (!user.value?.id) return
  
  loading.value = true
  try {
    const result = await MiningService.checkin(user.value.id)
    
    if (result.success) {
      toast.success(result.message || '签到成功！')
      isCheckedInToday.value = true
      releaseRate.value = result.data?.releaseRate || 0.02
      
      // 刷新数据
      await loadUserData()
      await loadMyMachines()
    } else {
      toast.error(result.error || '签到失败')
    }
  } catch (error: any) {
    toast.error(error.message || '签到失败')
  } finally {
    loading.value = false
  }
}
```

### 3. 兑换学习卡方法
```typescript
const exchangeCard = async () => {
  if (!user.value?.id) return
  
  // 检查代理身份
  if (!user.value.is_agent) {
    toast.error('请先加入Binary对碰系统（30U）')
    router.push('/agent')
    return
  }
  
  // 检查余额
  const totalCost = purchaseCount.value * 7
  if ((user.value.u_balance || 0) < totalCost) {
    toast.error(`余额不足，需要${totalCost}U`)
    return
  }
  
  loading.value = true
  try {
    const result = await MiningService.purchaseMachine(
      user.value.id,
      purchaseCount.value
    )
    
    if (result.success) {
      toast.success(result.message || `成功兑换${purchaseCount.value}张学习卡！`)
      purchaseCount.value = 1
      
      // 刷新数据
      await loadUserData()
      await loadMyMachines()
    } else {
      toast.error(result.error || '兑换失败')
    }
  } catch (error: any) {
    toast.error(error.message || '兑换失败')
  } finally {
    loading.value = false
  }
}
```

### 4. 计算释放率方法
```typescript
const calculateReleaseRate = async () => {
  if (!user.value?.id) return
  
  try {
    // 查询直推AI代理数量
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('inviter_id', user.value.id)
      .eq('is_agent', true)
    
    if (error) {
      console.error('查询直推数量失败:', error)
      releaseRate.value = 0.02
      return
    }
    
    // 计算释放率：基础2% + 直推加速3%×人数，最高20%
    const referralCount = Math.min(count || 0, 6)
    const rate = Math.min(0.02 + referralCount * 0.03, 0.20)
    releaseRate.value = rate
  } catch (error) {
    console.error('计算释放率失败:', error)
    releaseRate.value = 0.02
  }
}
```

### 5. 检查签到状态
```typescript
const checkCheckinStatus = () => {
  if (!myMachines.value || myMachines.value.length === 0) {
    isCheckedInToday.value = false
    return
  }
  
  const today = new Date().toISOString().split('T')[0]
  isCheckedInToday.value = myMachines.value.some(
    m => m.last_checkin_date === today
  )
}
```

### 6. onMounted 修改
```typescript
onMounted(async () => {
  await loadUserData()
  await loadMyMachines()
  await calculateReleaseRate()
  checkCheckinStatus()
})
```

---

## ✅ 完成后效果

1. **签到区**：显示签到状态和当前释放率
2. **兑换区**：显示兑换学习卡的入口和数量选择
3. **学习卡列表**：显示所有学习卡的状态（学习中/未签到/已出局）
4. **参数展示**：V4.0新参数（2-20%释放，10倍出局等）
5. **收益分配**：70%到账，30%销毁

---

**前端页面升级工作量较大，建议分步骤完成！** 🎨

