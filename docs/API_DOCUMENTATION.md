# 📚 API 文档 - AI智能空投平台

## 🎯 概述

本文档描述了系统核心业务逻辑的API接口定义和使用方法。

---

## 1. 推荐系统服务 (ReferralService)

### 1.1 计算网络位置

**方法**：`calculateNetworkPosition(inviter: User)`

**描述**：实现"走1留2"机制，计算新用户的网络位置

**输入**：
```typescript
inviter: User // 推荐人信息
```

**输出**：
```typescript
{
  networkRootId: string | null,  // 网络根节点ID
  referralPosition: number,      // 推荐位置(1,2,3...)
  hasNetwork: boolean            // 是否有自己的网络
}
```

**业务规则**：
- 前2个直推：紧缩到推荐人的上级网络
- 第3个直推开始：建立推荐人自己的网络

**示例**：
```typescript
const position = ReferralService.calculateNetworkPosition(inviter)

if (position.referralPosition <= 2) {
  // 前2个直推，加入上级网络
  console.log('加入上级网络', position.networkRootId)
} else {
  // 第3个及之后，建立自己网络
  console.log('建立推荐人网络', inviter.id)
}
```

---

### 1.2 计算见点奖

**方法**：`calculateSpotAward(networkOwnerId: string, newMemberId: string)`

**描述**：网络新增成员时，网络所有者获得8U

**输入**：
```typescript
networkOwnerId: string  // 网络所有者ID
newMemberId: string     // 新成员ID
```

**输出**：
```typescript
Transaction | null  // 交易记录，如果不符合条件返回null
```

**业务规则**：
- 网络所有者必须有自己的网络（has_network = true）
- 奖励金额：8U
- 自动检查是否触发复购

**示例**：
```typescript
const transaction = await ReferralService.calculateSpotAward(
  'owner-id',
  'new-member-id'
)

if (transaction) {
  console.log('见点奖发放成功:', transaction.amount)
}
```

---

### 1.3 计算平级见点奖

**方法**：`calculatePeerSpotAward(triggerId: string)`

**描述**：5级上线中有≥5个直推的获得3U

**输入**：
```typescript
triggerId: string  // 触发见点奖的用户ID
```

**输出**：
```typescript
Transaction[]  // 交易记录数组
```

**业务规则**：
- 检查5级推荐链
- 只有≥5个直推的上线才能获得
- 奖励金额：3U/人
- 自动检查每人是否触发复购

**示例**：
```typescript
const transactions = await ReferralService.calculatePeerSpotAward('user-id')

console.log(`发放平级见点奖 ${transactions.length} 笔`)
```

---

### 1.4 计算直推分红

**方法**：`calculateDirectReferralDividend(newAgentId: string, paymentDate?: Date)`

**描述**：周一/三/五/日发放，≥5个直推的代理获得7U

**输入**：
```typescript
newAgentId: string    // 新代理ID
paymentDate?: Date    // 支付日期（可选，默认当天）
```

**输出**：
```typescript
Transaction | null  // 交易记录，如果不符合条件返回null
```

**业务规则**：
- 只在周一(1)、周三(3)、周五(5)、周日(0)发放
- 推荐人必须有≥5个直推（qualified_for_dividend = true）
- 奖励金额：7U
- 自动检查是否触发复购

**示例**：
```typescript
const transaction = await ReferralService.calculateDirectReferralDividend(
  'new-agent-id',
  new Date('2024-01-01') // 周一
)

if (transaction) {
  console.log('直推分红发放成功')
} else {
  console.log('不符合分红条件或非分红日')
}
```

---

### 1.5 检查自动复购

**方法**：`checkRepurchase(userId: string)`

**描述**：全网收益达200U时，自动扣除30U复购

**输入**：
```typescript
userId: string  // 用户ID
```

**输出**：
```typescript
boolean  // 是否触发复购
```

**业务规则**：
- 全网收益（total_earnings）≥ 200U
- 余额（u_balance）≥ 30U
- 扣除30U后重置收益计数
- 如果是分红日，触发直推分红

**示例**：
```typescript
const repurchased = await ReferralService.checkRepurchase('user-id')

if (repurchased) {
  console.log('触发自动复购')
}
```

---

### 1.6 更新分红资格

**方法**：`updateDividendQualification(userId: string)`

**描述**：≥5个直推时获得分红资格

**输入**：
```typescript
userId: string  // 用户ID
```

**输出**：
```typescript
void
```

**业务规则**：
- direct_referral_count ≥ 5 → qualified_for_dividend = true

**示例**：
```typescript
await ReferralService.updateDividendQualification('user-id')
```

---

### 1.7 更新推荐链

**方法**：`updateReferralChain(userId: string, inviterId: string)`

**描述**：维护5级推荐关系

**输入**：
```typescript
userId: string     // 新用户ID
inviterId: string  // 推荐人ID
```

**输出**：
```typescript
void
```

**业务规则**：
- 向上追溯5级推荐关系
- 用于计算平级见点奖

**示例**：
```typescript
await ReferralService.updateReferralChain('new-user-id', 'inviter-id')
```

---

## 2. 矿机系统服务 (MiningService)

### 2.1 购买矿机

**方法**：`purchaseMachine(userId: string)`

**描述**：使用100积分购买一台矿机

**输入**：
```typescript
userId: string  // 用户ID
```

**输出**：
```typescript
MiningMachine | null  // 矿机记录
```

**业务规则**：
- 消耗100积分
- 生成10倍出局矿机（1000积分）
- 根据直推数计算加速率
- 最多50台矿机/人

**异常**：
- 积分不足
- 超过最大矿机数量

**示例**：
```typescript
try {
  const machine = await MiningService.purchaseMachine('user-id')
  console.log('购买成功:', machine)
} catch (error) {
  console.error('购买失败:', error.message)
}
```

---

### 2.2 每日释放积分

**方法**：`releaseDailyPoints(machineId: string)`

**描述**：释放一台矿机的每日积分

**输入**：
```typescript
machineId: string  // 矿机ID
```

**输出**：
```typescript
number  // 实际释放的积分数量
```

**业务规则**：
- 基础释放率：1%
- 加速率：每个直推+2%，最多20个
- 10倍出局：释放到1000积分自动停止

**示例**：
```typescript
const released = await MiningService.releaseDailyPoints('machine-id')
console.log(`释放了 ${released} 积分`)
```

---

### 2.3 批量释放所有矿机

**方法**：`releaseAllMachines()`

**描述**：释放系统中所有活跃矿机

**输入**：
```typescript
void
```

**输出**：
```typescript
void
```

**使用场景**：
- 定时任务（每天执行一次）
- Cron job或Supabase定时函数

**示例**：
```typescript
// 在定时任务中调用
await MiningService.releaseAllMachines()
```

---

### 2.4 积分兑换U

**方法**：`convertPointsToU(userId: string, pointsAmount: number)`

**描述**：将积分兑换为U

**输入**：
```typescript
userId: string        // 用户ID
pointsAmount: number  // 兑换积分数量
```

**输出**：
```typescript
Transaction | null  // 交易记录
```

**业务规则**：
- 兑换率：100积分 = 7U
- 70%转为U，30%留存为积分
- 例如：100积分 → 4.9U + 30积分

**示例**：
```typescript
try {
  const transaction = await MiningService.convertPointsToU('user-id', 100)
  console.log('兑换成功:', transaction)
} catch (error) {
  console.error('兑换失败:', error.message)
}
```

---

### 2.5 更新矿机加速率

**方法**：`updateMachineBoost(userId: string)`

**描述**：当用户直推数量变化时，更新矿机加速率

**输入**：
```typescript
userId: string  // 用户ID
```

**输出**：
```typescript
void
```

**业务规则**：
- 自动计算当前直推数
- 更新所有活跃矿机的boost_rate
- 最多20个直推有效

**示例**：
```typescript
// 当新增直推时调用
await MiningService.updateMachineBoost('user-id')
```

---

### 2.6 触发重启机制

**方法**：`triggerRestart(userId: string)`

**描述**：销毁30%积分，停止所有矿机

**输入**：
```typescript
userId: string  // 用户ID
```

**输出**：
```typescript
void
```

**使用场景**：
- 管理员手动触发
- 系统检测到异常时自动触发

**示例**：
```typescript
await MiningService.triggerRestart('user-id')
```

---

### 2.7 获取矿机统计

**方法**：`getUserMachineStats(userId: string)`

**描述**：获取用户矿机统计信息

**输入**：
```typescript
userId: string  // 用户ID
```

**输出**：
```typescript
{
  totalMachines: number,    // 总矿机数
  activeMachines: number,   // 活跃矿机数
  totalReleased: number,    // 累计释放积分
  dailyIncome: number       // 每日收入
}
```

**示例**：
```typescript
const stats = await MiningService.getUserMachineStats('user-id')
console.log('每日收入:', stats.dailyIncome)
```

---

## 3. 常量配置

### 3.1 推荐系统常量
```typescript
SPOT_AWARD = 8              // 见点奖金额
PEER_SPOT_AWARD = 3         // 平级见点奖金额
DIRECT_DIVIDEND = 7         // 直推分红金额
REPURCHASE_THRESHOLD = 300  // 复购阈值
REPURCHASE_AMOUNT = 30      // 复购金额
DIVIDEND_DAYS = [1,3,5,0]   // 分红日（周一/三/五/日）
```

### 3.2 矿机系统常量
```typescript
POINTS_PER_MACHINE = 100        // 每台矿机积分
EXIT_MULTIPLIER = 10            // 出局倍数
BASE_RELEASE_RATE = 0.01        // 基础释放率1%
BOOST_PER_REFERRAL = 0.02       // 每个直推加速2%
MAX_BOOST_REFERRALS = 20        // 最多20个直推
MAX_MACHINES_PER_USER = 50      // 每人最多50台
POINTS_TO_U_RATE = 0.07         // 100积分=7U
U_PERCENTAGE = 0.7              // 70%转U
POINTS_PERCENTAGE = 0.3         // 30%留存
```

---

## 4. 错误处理

所有服务方法都会捕获错误并：
1. 记录到控制台
2. 抛出带描述的Error对象
3. 返回null或空数组（查询方法）

**错误处理示例**：
```typescript
try {
  const result = await ReferralService.calculateSpotAward(...)
  if (result) {
    // 成功处理
  } else {
    // 不符合条件
  }
} catch (error) {
  // 系统错误
  console.error(error.message)
}
```

---

## 5. 集成示例

### 5.1 完整的用户注册流程
```typescript
// 1. 注册新用户
const newUser = await registerUser(username, password, inviteCode)

// 2. 计算网络位置
const position = ReferralService.calculateNetworkPosition(inviter)

// 3. 更新推荐链
await ReferralService.updateReferralChain(newUser.id, inviter.id)

// 4. 触发见点奖
if (position.networkRootId) {
  await ReferralService.calculateSpotAward(
    position.networkRootId,
    newUser.id
  )
  
  // 5. 触发平级见点奖
  await ReferralService.calculatePeerSpotAward(newUser.id)
}

// 6. 更新推荐人直推计数和分红资格
await ReferralService.updateDividendQualification(inviter.id)
```

### 5.2 完整的成为代理流程
```typescript
// 1. 扣除30U成为代理
const agent = await becomeAgent(userId)

// 2. 触发直推分红（如果是分红日）
if (agent.inviter_id) {
  await ReferralService.calculateDirectReferralDividend(agent.id)
}
```

### 5.3 完整的矿机流程
```typescript
// 1. 购买矿机
const machine = await MiningService.purchaseMachine(userId)

// 2. 每日释放（定时任务）
setInterval(async () => {
  await MiningService.releaseAllMachines()
}, 24 * 60 * 60 * 1000) // 每24小时

// 3. 积分兑换
const transaction = await MiningService.convertPointsToU(userId, 100)
```

---

**API文档版本**：1.0.0  
**最后更新**：2024-01-02





