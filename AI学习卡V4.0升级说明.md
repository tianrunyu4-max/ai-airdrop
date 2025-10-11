# 🔥 AI学习卡 V4.0 重大升级

> **更新日期**：2025-10-11  
> **版本**：V4.0  
> **状态**：🚧 配置已更新，代码待完善

---

## 📋 核心变更对比

| 项目 | V3.0（旧） | V4.0（新） | 变化说明 |
|------|-----------|-----------|----------|
| **名称** | AI学习机 | **AI学习卡** | 改名 |
| **获得方式** | 第一次免费送 | **成为AI代理自动送100积分** | 自动赠送 |
| **兑换方式** | 100积分 | **7U余额兑换100积分** | 可用U余额兑换 |
| **释放条件** | 自动释放 | **必须每日签到** | 不签到不释放 |
| **基础释放率** | 10%/天 | **2%/天** | 降低10倍 |
| **出局倍数** | 2倍 | **10倍** | 提高5倍 |
| **出局时间** | 20天 | **500天（2%） or 50天（20%）** | 看直推数量 |
| **直推加速** | ❌ 取消 | **+3%/人，最高20%** | 恢复加速机制 |
| **积分分配** | 70%U + 30%互转 | **70%U + 30%销毁** | 自动销毁，防通胀 |
| **复利滚存** | ✅ 有 | **❌ 取消** | 简化逻辑 |
| **重启机制** | 手动 | **自动+手动** | 总释放>新积分自动重启 |

---

## 🎯 新逻辑详解

### 1️⃣ 成为AI代理自动送100积分

```
用户支付30U加入Binary系统
  ↓
系统自动执行：
  - 设置 is_agent = true
  - 自动赠送 100 transfer_points
  - 可立即激活第一张学习卡
  ↓
用户无需额外操作即可开始学习
```

### 2️⃣ 7U余额兑换100积分

```
兑换入口：AI学习页面 → 兑换学习卡

用户操作：
  1. 选择兑换数量（1-10张）
  2. 消耗 7U × 数量
  3. 获得 100积分 × 数量
  ↓
系统执行：
  - 扣除U余额
  - 增加transfer_points
  - 创建学习卡记录
```

### 3️⃣ 每日签到释放机制

```
每天用户需要：
  1. 进入AI学习页面
  2. 点击"签到启动"按钮
  3. 签到成功后当天释放积分
  ↓
如果不签到：
  - 当天不释放任何积分
  - 学习卡状态：inactive（未激活）
  - 不影响后续签到
```

### 4️⃣ 释放率计算

```
释放率 = 基础释放率 + 直推加速

基础释放率：2%/天

直推加速：
  - 每直推1个AI代理 +3%
  - 最多计算6个直推
  - 最高加速 18%（6 × 3%）
  - 最高释放率 20%（2% + 18%）

示例：
  0个直推：2%/天（500天出局）
  1个直推：5%/天（200天出局）
  2个直推：8%/天（125天出局）
  3个直推：11%/天（91天出局）
  4个直推：14%/天（71天出局）
  5个直推：17%/天（59天出局）
  6个+直推：20%/天（50天出局）
```

### 5️⃣ 每日收益分配

```
假设：100积分学习卡，释放率10%（2%基础+2个直推）

每日签到后释放：10积分
  ├─ 70% → U余额：7积分 = 0.49U（直接到账）
  └─ 30% → 自动销毁：3积分（清0，防通胀）

10倍出局后总收益：
  - 释放总积分：1000积分
  - 到账U余额：1000 × 70% × 0.07 = 49U
  - 销毁积分：1000 × 30% = 300积分
  - 投入产出比：49U ÷ 7U = 7倍
```

### 6️⃣ 自动重启机制（防泡沫）

```
后端定时任务检测：
  IF 总释放积分 > 新充值积分 THEN
    触发自动重启：
      1. 所有学习卡积分清0销毁
      2. 保留U余额
      3. 可继续兑换新学习卡
      4. 继续释放
  END IF

目的：
  - 防止积分泡沫过大
  - 保持系统健康运行
  - 避免通货膨胀
```

---

## 🔧 技术实现要点

### 1. 配置文件（已完成 ✅）
- `src/config/mining.ts` - 已更新为V4.0配置

### 2. 数据库表（待添加）
需要在 `mining_machines` 表添加字段：
```sql
ALTER TABLE mining_machines ADD COLUMN IF NOT EXISTS
  last_checkin_date DATE,           -- 最后签到日期
  checkin_count INTEGER DEFAULT 0,  -- 总签到次数
  is_checked_in_today BOOLEAN DEFAULT FALSE; -- 今天是否已签到
```

### 3. 后端服务（待修改）

#### A. 成为代理时自动送积分
```typescript
// src/services/BinaryService.ts - joinBinary()
async joinBinary(userId: string) {
  // ... 现有逻辑
  
  // 新增：自动赠送100积分
  await WalletManager.add(
    userId,
    100,
    'transfer_points',
    'binary_auto_gift',
    '加入Binary系统赠送'
  )
}
```

#### B. 兑换学习卡（U余额）
```typescript
// src/services/MiningService.ts
async exchangeCard(userId: string, quantity: number) {
  const cost = 7 * quantity
  const points = 100 * quantity
  
  // 1. 扣除U余额
  await WalletManager.deduct(userId, cost, 'u_balance', 'exchange_card')
  
  // 2. 增加积分
  await WalletManager.add(userId, points, 'transfer_points', 'exchange_card')
  
  // 3. 创建学习卡
  for (let i = 0; i < quantity; i++) {
    await this.createCard(userId, points / quantity)
  }
}
```

#### C. 签到释放
```typescript
// src/services/MiningService.ts
async checkin(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  
  // 1. 检查今天是否已签到
  const { data: cards } = await supabase
    .from('mining_machines')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
  
  for (const card of cards) {
    if (card.last_checkin_date === today) {
      throw new Error('今天已签到')
    }
    
    // 2. 更新签到状态
    await supabase
      .from('mining_machines')
      .update({
        last_checkin_date: today,
        checkin_count: card.checkin_count + 1,
        is_checked_in_today: true
      })
      .eq('id', card.id)
    
    // 3. 计算释放率
    const rate = await this.calculateReleaseRate(userId)
    
    // 4. 执行释放
    await this.releasePoints(card.id, rate)
  }
}
```

#### D. 计算释放率（含直推加速）
```typescript
async calculateReleaseRate(userId: string): Promise<number> {
  // 1. 基础释放率
  let rate = AILearningConfig.RELEASE.BASE_RATE // 2%
  
  // 2. 查询直推AI代理数量
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact' })
    .eq('inviter_id', userId)
    .eq('is_agent', true)
  
  // 3. 计算加速
  const referralCount = Math.min(count || 0, AILearningConfig.RELEASE.MAX_REFERRALS)
  const boost = referralCount * AILearningConfig.RELEASE.BOOST_PER_REFERRAL
  
  // 4. 总释放率（不超过20%）
  rate = Math.min(rate + boost, AILearningConfig.RELEASE.MAX_RATE)
  
  return rate
}
```

#### E. 自动重启检测（定时任务）
```typescript
// src/services/MiningService.ts
async checkAndRestart() {
  // 1. 统计总释放积分
  const { data: released } = await supabase
    .rpc('sum_released_points')
  
  // 2. 统计新充值积分
  const { data: exchanged } = await supabase
    .rpc('sum_exchanged_points')
  
  // 3. 判断是否需要重启
  if (released > exchanged) {
    console.log('⚠️ 检测到泡沫过大，触发自动重启')
    await this.systemRestart()
  }
}

async systemRestart() {
  // 1. 清空所有学习卡积分
  await supabase
    .from('mining_machines')
    .update({
      total_released: 0,
      status: 'restarted'
    })
    .eq('status', 'active')
  
  // 2. 记录重启日志
  await supabase.from('system_logs').insert({
    event: 'auto_restart',
    reason: 'prevent_bubble',
    timestamp: new Date().toISOString()
  })
  
  console.log('✅ 系统重启完成，所有积分已清0')
}
```

### 4. 前端页面（待修改）

#### A. 签到按钮
```vue
<template>
  <div class="checkin-section">
    <button 
      @click="handleCheckin" 
      :disabled="isCheckedInToday"
      class="btn btn-primary"
    >
      {{ isCheckedInToday ? '✅ 今日已签到' : '📅 签到启动' }}
    </button>
    
    <div v-if="!isCheckedInToday" class="warning">
      ⚠️ 未签到，今日不释放积分
    </div>
  </div>
</template>
```

#### B. 兑换学习卡
```vue
<template>
  <div class="exchange-section">
    <h3>💳 兑换学习卡</h3>
    <p>7U = 100积分</p>
    
    <input v-model="quantity" type="number" min="1" max="10" />
    
    <button @click="exchangeCard">
      兑换 {{ quantity }} 张（消耗 {{ quantity * 7 }}U）
    </button>
  </div>
</template>
```

---

## 📊 用户使用流程

```
第1步：加入Binary系统（30U）
  ↓ 自动送100积分
第2步：自动激活第1张学习卡（免费）
  ↓
第3步：每天签到启动
  ↓ 释放积分（2%-20%）
  ├─ 70% → U余额
  └─ 30% → 销毁
  ↓
第4步：10倍出局（500天 or 50天）
  ↓
第5步：继续兑换（7U=100积分）
  ↓
循环第3-5步
```

---

## ⚠️ 待完成工作

### 高优先级
- [ ] 修改 `BinaryService.joinBinary()` - 自动送100积分
- [ ] 修改 `MiningService.purchaseMachine()` - 支持U余额兑换
- [ ] 新增 `MiningService.checkin()` - 签到释放功能
- [ ] 修改 `MiningService.releaseDaily()` - 30%销毁逻辑
- [ ] 新增 `MiningService.calculateReleaseRate()` - 直推加速
- [ ] 新增 `MiningService.checkAndRestart()` - 自动重启检测

### 中优先级
- [ ] 数据库迁移 - 添加签到相关字段
- [ ] 前端页面 - 签到按钮和UI
- [ ] 前端页面 - U余额兑换入口
- [ ] 定时任务 - 自动重启检测

### 低优先级
- [ ] 文档更新 - 用户使用说明
- [ ] 测试用例 - 签到逻辑
- [ ] 管理后台 - 手动重启按钮

---

## 🎉 升级优势

1. ✅ **更简单**：成为代理自动送，无需复杂操作
2. ✅ **更灵活**：U余额直接兑换，随时购买
3. ✅ **更互动**：每日签到，增加用户粘性
4. ✅ **更稳定**：30%销毁+自动重启，防止通胀
5. ✅ **更激励**：直推加速恢复，鼓励推广
6. ✅ **更长久**：10倍出局，延长周期

---

**配置已完成！接下来需要修改服务层代码实现新逻辑。** 🚀

