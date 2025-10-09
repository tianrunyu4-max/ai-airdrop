# 🚀 下一步工作计划

**当前状态**: ✅ 安全加固完成，数据库函数已添加

---

## ✅ **已完成**
- [x] 钱包管理器安全加固
- [x] 数据库原子操作函数
- [x] 通用验证器
- [x] 代码优化精简

---

## 🎯 **接下来做什么？**

### **方案A: 完善核心功能（推荐）** ⏰ 4-6小时

#### **1. 实现定时任务** 🔥 必须
```
AI学习机每日释放:
- 每天00:00自动执行
- 计算10%释放
- 分配70%U + 30%积分
- 检查2倍出局

分红自动结算:
- 每周一、三、五、日 00:00
- 计算分红池15%
- 发放给≥10直推的用户
```

**技术方案**: 使用 Supabase Edge Functions + Cron

**预计时间**: 3小时

---

#### **2. 完整集成测试** 🔥 重要
```
测试完整业务流程:
1. 新用户注册 → 成为代理 → 购买学习机
2. 加入二元系统 → 发展下线 → 触发对碰
3. 每日释放 → 积分分配 → 出局复投
4. 对碰奖 → 平级奖 → 分红结算
```

**预计时间**: 2小时

---

#### **3. 准备部署** 
```
- 环境配置
- 数据备份
- 域名配置
- 上线检查
```

**预计时间**: 1小时

---

### **方案B: 直接测试上线（快速）** ⏰ 2-3小时

#### **跳过定时任务，先上线测试**
```
1. 完整功能测试（1小时）
2. 性能测试（30分钟）
3. 部署上线（30分钟）
4. 后续补充定时任务
```

**优点**: 快速上线，快速验证
**缺点**: 需要手动执行释放和分红

---

### **方案C: 继续优化（可选）** ⏰ 3-4小时

```
1. 完善RLS策略（1小时）
2. 添加审计日志（1小时）
3. 性能监控（1小时）
4. UI细节优化（1小时）
```

---

## 💡 **我的建议**

### **推荐路线: A → B**

**第1天（今天）**:
- ✅ 安全加固（已完成）
- 🔥 实现定时任务（3小时）
- 🧪 快速测试（1小时）

**第2天（明天）**:
- 🧪 完整集成测试（2小时）
- 🚀 部署上线（1小时）
- 📊 监控运行（持续）

**第3天（后天）**:
- 🔧 修复问题
- ⚡ 性能优化
- 📈 数据分析

---

## 🔥 **立即开始：实现定时任务**

### **步骤1: 创建 Supabase Edge Function**

#### **AI学习机每日释放**
```typescript
// supabase/functions/daily-release/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 查询所有活跃的学习机
  const { data: machines } = await supabase
    .from('mining_machines')
    .select('*')
    .eq('is_active', true)

  let successCount = 0
  let failCount = 0

  // 处理每台学习机
  for (const machine of machines || []) {
    try {
      // 计算释放量
      const dailyRelease = machine.initial_points * 0.10 // 10%/天

      // 检查是否已经出局
      const newReleased = machine.released_points + dailyRelease
      if (newReleased >= machine.total_points) {
        // 已出局，停止释放
        await supabase
          .from('mining_machines')
          .update({ is_active: false })
          .eq('id', machine.id)
        continue
      }

      // 更新释放积分
      await supabase
        .from('mining_machines')
        .update({ released_points: newReleased })
        .eq('id', machine.id)

      // 分配到用户余额
      const toU = dailyRelease * 0.70 // 70%
      const toPoints = dailyRelease * 0.30 // 30%

      // 增加U余额
      const uAmount = toU * 0.07 // 1积分=0.07U
      await supabase.rpc('add_user_balance', {
        p_user_id: machine.user_id,
        p_amount: uAmount
      })

      // 增加积分余额
      await supabase.rpc('add_user_points', {
        p_user_id: machine.user_id,
        p_amount: toPoints
      })

      successCount++
    } catch (error) {
      failCount++
      console.error(`处理学习机 ${machine.id} 失败:`, error)
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      processed: machines?.length || 0,
      success: successCount,
      failed: failCount
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

#### **分红自动结算**
```typescript
// supabase/functions/dividend-settlement/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 获取分红池余额
  const { data: pool } = await supabase
    .from('dividend_pool')
    .select('*')
    .single()

  if (!pool || pool.balance <= 0) {
    return new Response(JSON.stringify({ message: '分红池余额不足' }))
  }

  // 查询符合条件的用户（直推≥10人）
  const { data: eligibleUsers } = await supabase
    .from('users')
    .select('id, direct_referral_count')
    .gte('direct_referral_count', 10)

  if (!eligibleUsers || eligibleUsers.length === 0) {
    return new Response(JSON.stringify({ message: '没有符合条件的用户' }))
  }

  // 计算每人分红
  const totalAmount = pool.balance * 0.15 // 分配15%
  const perUserAmount = totalAmount / eligibleUsers.length

  // 批量发放
  const operations = eligibleUsers.map(user => ({
    user_id: user.id,
    amount: perUserAmount
  }))

  await supabase.rpc('batch_add_balance', {
    p_user_amounts: JSON.stringify(operations)
  })

  // 更新分红池
  await supabase
    .from('dividend_pool')
    .update({
      balance: pool.balance - totalAmount,
      total_distributed: pool.total_distributed + totalAmount,
      last_distribution_at: new Date().toISOString()
    })
    .eq('id', pool.id)

  // 记录分红历史
  for (const user of eligibleUsers) {
    await supabase
      .from('dividend_records')
      .insert({
        user_id: user.id,
        amount: perUserAmount,
        pool_balance_before: pool.balance,
        pool_balance_after: pool.balance - totalAmount,
        eligible_count: eligibleUsers.length
      })
  }

  return new Response(
    JSON.stringify({
      success: true,
      distributed: totalAmount,
      recipients: eligibleUsers.length
    })
  )
})
```

---

### **步骤2: 配置 Cron**

在 `supabase/functions/_cron/cron.ts`:
```typescript
Deno.cron('每日释放', '0 0 * * *', async () => {
  await fetch('https://your-project.supabase.co/functions/v1/daily-release', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
    }
  })
})

Deno.cron('分红结算', '0 0 * * 1,3,5,0', async () => {
  await fetch('https://your-project.supabase.co/functions/v1/dividend-settlement', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
    }
  })
})
```

---

## 📝 **快速决策**

您现在可以选择：

**A - 实现定时任务** (推荐，3小时)
→ 我立即帮您创建 Edge Functions

**B - 直接测试上线** (快速，1小时)
→ 跳过定时任务，先上线测试

**C - 继续优化** (可选，3小时)
→ 完善RLS、审计日志等

**您想选哪个？** 💪

