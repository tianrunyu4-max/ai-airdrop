# 🌳 NetworkService API 文档

> **版本**: v1.0  
> **服务类型**: 双区对碰奖励系统核心服务  
> **更新时间**: 2025-10-04

---

## 📋 概述

`NetworkService` 是双区对碰奖励系统的核心服务层，实现了自动排线、对碰奖计算、平级奖发放等关键功能。

### 核心功能

- ✅ 自动排线（弱区优先，5:1比例）
- ✅ 会员付费加入（30U）
- ✅ 对碰奖计算和发放（每组7U）
- ✅ 平级奖计算和发放（每人2U）
- ✅ 网络统计查询
- ✅ 每日定时结算

---

## 🎯 常量配置

```typescript
class NetworkService {
  static readonly ENTRY_FEE = 30                 // 入会费用30U
  static readonly PAIRING_BONUS = 7              // 对碰奖每组7U
  static readonly LEVEL_BONUS = 2                // 平级奖每人2U
  static readonly UNLOCK_THRESHOLD = 2           // 解锁平级奖需直推2人
  static readonly DIVIDEND_THRESHOLD = 10        // 分红资格需直推10人
  static readonly REINVEST_THRESHOLD = 200       // 复投门槛200U
  static readonly WEAK_STRONG_RATIO = 5          // 强弱区比例5:1
  static readonly MEMBER_RATIO = 0.85            // 会员收益85%
  static readonly DIVIDEND_POOL_RATIO = 0.15     // 分红池15%
}
```

---

## 📖 API 方法

### 1. assignNetworkSide()

**功能**: 自动排线 - 确定新会员应该进入A区还是B区

**签名**:
```typescript
static async assignNetworkSide(parentId: string): Promise<'A' | 'B'>
```

**参数**:
- `parentId` (string): 上级用户ID

**返回值**:
- `'A' | 'B'`: 分配的区域

**算法逻辑**:
```typescript
const aSideCount = parent.a_side_sales
const bSideCount = parent.b_side_sales

if (aSideCount === 0 && bSideCount === 0) {
  return 'A' // 首次推荐，默认A区
}

if (aSideCount > bSideCount * 5) {
  return 'B' // A区太强，分配到B区
} else if (bSideCount > aSideCount * 5) {
  return 'A' // B区太强，分配到A区
} else {
  return aSideCount <= bSideCount ? 'A' : 'B' // 分配到人数少的区
}
```

**示例**:
```typescript
// A区150人，B区30人
const side = await NetworkService.assignNetworkSide('user-123')
// 返回: 'B' (B区人数少，优先补弱区)
```

---

### 2. memberJoin()

**功能**: 会员付费加入（30U）

**签名**:
```typescript
static async memberJoin(
  userId: string,
  inviterId: string,
  paymentAmount: number
): Promise<{ side: 'A' | 'B'; inviteCode: string }>
```

**参数**:
- `userId` (string): 新会员用户ID
- `inviterId` (string): 邀请人用户ID
- `paymentAmount` (number): 支付金额（需≥30U）

**返回值**:
- `side`: 分配的区域
- `inviteCode`: 自动生成的邀请码

**流程**:
1. 验证支付金额（≥30U）
2. 确定分配区域（自动排线）
3. 生成邀请码
4. 更新用户信息
5. 更新上级业绩
6. 检查解锁条件（直推≥2人）
7. 检查分红资格（直推≥10人）
8. 创建交易记录

**示例**:
```typescript
const result = await NetworkService.memberJoin(
  'new-user-id',
  'inviter-id',
  30
)
// 返回: { side: 'B', inviteCode: 'INV2KXYZ1234' }
```

---

### 3. calculatePairingBonus()

**功能**: 计算对碰奖

**签名**:
```typescript
static async calculatePairingBonus(userId: string): Promise<PairingBonusResult>
```

**参数**:
- `userId` (string): 用户ID

**返回值**:
```typescript
interface PairingBonusResult {
  pairsCount: number        // 对碰组数
  bonusAmount: number       // 奖金金额（会员收益85%）
  aSideBefore: number       // 结算前A区单数
  bSideBefore: number       // 结算前B区单数
  aSideAfter: number        // 结算后A区单数
  bSideAfter: number        // 结算后B区单数
}
```

**计算公式**:
```typescript
// 未结算业绩
const aSidePending = a_side_sales - a_side_settled
const bSidePending = b_side_sales - b_side_settled

// 对碰组数（取小区）
const pairsCount = Math.min(aSidePending, bSidePending)

// 奖金（会员收益85%，15%进分红池）
const totalBonus = pairsCount * 7
const memberBonus = totalBonus * 0.85
```

**示例**:
```typescript
const result = await NetworkService.calculatePairingBonus('user-123')
// 返回:
// {
//   pairsCount: 100,
//   bonusAmount: 595,      // 100组 × 7U × 85%
//   aSideBefore: 500,
//   bSideBefore: 100,
//   aSideAfter: 400,       // 500 - 100
//   bSideAfter: 0          // 100 - 100
// }
```

---

### 4. distributePairingBonus()

**功能**: 发放对碰奖

**签名**:
```typescript
static async distributePairingBonus(
  userId: string,
  pairingResult: PairingBonusResult
): Promise<string>
```

**参数**:
- `userId` (string): 用户ID
- `pairingResult` (PairingBonusResult): 对碰奖计算结果

**返回值**:
- (string): 对碰奖记录ID

**流程**:
1. 更新用户U余额
2. 更新总收益统计
3. 更新已结算业绩
4. 创建对碰奖记录（pairing_bonuses表）
5. 创建交易记录（transactions表）

**示例**:
```typescript
const pairingResult = await NetworkService.calculatePairingBonus('user-123')
const recordId = await NetworkService.distributePairingBonus('user-123', pairingResult)
// 返回: 'pairing-bonus-uuid'
```

---

### 5. distributeLevelBonus()

**功能**: 发放平级奖（向上3代）

**签名**:
```typescript
static async distributeLevelBonus(
  triggeredUserId: string,
  pairingBonusId: string
): Promise<number>
```

**参数**:
- `triggeredUserId` (string): 触发对碰奖的用户ID
- `pairingBonusId` (string): 对碰奖记录ID

**返回值**:
- (number): 成功发放的平级奖数量

**流程**:
1. 获取直推链（向上3代）
2. 遍历每一代上级
3. 检查是否已解锁（直推≥2人）
4. 发放2U平级奖
5. 创建平级奖记录（level_bonuses表）
6. 创建交易记录（transactions表）

**示例**:
```typescript
// 网络结构：
// A（直推5人）
//   └─ B（直推3人）
//       └─ C（直推2人）
//           └─ D（触发对碰奖）

const count = await NetworkService.distributeLevelBonus('user-d', 'pairing-id')
// 返回: 3
// C、B、A各获得2U平级奖
```

---

### 6. getNetworkStats()

**功能**: 获取网络统计

**签名**:
```typescript
static async getNetworkStats(userId: string): Promise<NetworkStats>
```

**参数**:
- `userId` (string): 用户ID

**返回值**:
```typescript
interface NetworkStats {
  aSideSales: number          // A区销售单数
  bSideSales: number          // B区销售单数
  aSideSettled: number        // A区已结算单数
  bSideSettled: number        // B区已结算单数
  aSidePending: number        // A区未结算单数
  bSidePending: number        // B区未结算单数
  totalPairingBonus: number   // 累计对碰奖
  totalLevelBonus: number     // 累计平级奖
  isUnlocked: boolean         // 是否已解锁平级奖
}
```

**示例**:
```typescript
const stats = await NetworkService.getNetworkStats('user-123')
// 返回:
// {
//   aSideSales: 150,
//   bSideSales: 80,
//   aSideSettled: 80,
//   bSideSettled: 80,
//   aSidePending: 70,
//   bSidePending: 0,
//   totalPairingBonus: 560,
//   totalLevelBonus: 160,
//   isUnlocked: true
// }
```

---

### 7. dailyPairingSettlement()

**功能**: 每日对碰奖结算（定时任务调用）

**签名**:
```typescript
static async dailyPairingSettlement(): Promise<{
  processedUsers: number
  totalPairs: number
  totalBonus: number
  totalLevelBonus: number
}>
```

**返回值**:
- `processedUsers`: 处理的用户数
- `totalPairs`: 对碰总组数
- `totalBonus`: 对碰奖总金额
- `totalLevelBonus`: 平级奖总金额

**流程**:
1. 获取所有付费会员
2. 遍历每个会员
3. 计算对碰奖
4. 发放对碰奖
5. 发放平级奖
6. 统计处理结果

**示例**:
```typescript
const result = await NetworkService.dailyPairingSettlement()
// 返回:
// {
//   processedUsers: 156,
//   totalPairs: 523,
//   totalBonus: 3111.45,
//   totalLevelBonus: 312
// }
```

---

## 📊 使用示例

### 完整流程示例

```typescript
// 1. 新会员付费加入
const joinResult = await NetworkService.memberJoin(
  'new-user-id',
  'inviter-id',
  30
)
console.log(`加入成功！分配到${joinResult.side}区，邀请码：${joinResult.inviteCode}`)

// 2. 查询网络统计
const stats = await NetworkService.getNetworkStats('inviter-id')
console.log(`A区：${stats.aSideSales}人，B区：${stats.bSideSales}人`)

// 3. 计算对碰奖（每日定时任务）
const pairingResult = await NetworkService.calculatePairingBonus('inviter-id')
if (pairingResult.pairsCount > 0) {
  console.log(`对碰${pairingResult.pairsCount}组，获得${pairingResult.bonusAmount}U`)
  
  // 4. 发放对碰奖
  const recordId = await NetworkService.distributePairingBonus('inviter-id', pairingResult)
  
  // 5. 发放平级奖
  const levelCount = await NetworkService.distributeLevelBonus('inviter-id', recordId)
  console.log(`触发${levelCount}个平级奖`)
}
```

---

## 🔄 集成定时任务

### SchedulerService集成

```typescript
// src/services/scheduler.service.ts

static async executeDailyRelease(): Promise<void> {
  try {
    // 1. 矿机积分释放
    await MiningService.releaseAllMachines()
    
    // 2. 对碰奖结算
    const pairingResult = await NetworkService.dailyPairingSettlement()
    console.log(`对碰奖结算完成:`)
    console.log(`- 处理用户: ${pairingResult.processedUsers}`)
    console.log(`- 对碰组数: ${pairingResult.totalPairs}`)
    console.log(`- 对碰奖金: ${pairingResult.totalBonus}U`)
    console.log(`- 平级奖金: ${pairingResult.totalLevelBonus}U`)
  } catch (error) {
    console.error('每日任务失败:', error)
  }
}
```

---

## 🧪 开发模式

### 模拟数据支持

```typescript
if (isDevMode) {
  // 自动返回模拟数据，无需真实数据库
  return {
    side: 'B',
    inviteCode: 'INV-MOCK-1234'
  }
}
```

### 测试调用

```typescript
// 开发环境测试
const result = await NetworkService.memberJoin('test-user', 'test-inviter', 30)
console.log('模拟加入结果:', result)
```

---

## ⚠️ 错误处理

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| "入会费用不足" | 支付金额<30U | 确保支付金额≥30U |
| "上级不存在" | parentId无效 | 检查邀请人ID是否正确 |
| "用户不存在" | userId无效 | 确认用户已注册 |

### 错误捕获

```typescript
try {
  await NetworkService.memberJoin(userId, inviterId, 30)
} catch (error: any) {
  console.error('加入失败:', error.message)
  // 错误处理逻辑
}
```

---

## 📈 性能优化

### 批量处理

```typescript
// dailyPairingSettlement 使用批量处理
for (const user of users) {
  try {
    // 并发处理每个用户
    await Promise.all([
      calculatePairingBonus(user.id),
      // 其他操作...
    ])
  } catch (error) {
    // 单个用户失败不影响其他用户
    console.error(`处理用户${user.id}失败:`, error)
    continue
  }
}
```

---

## 🎯 最佳实践

### 1. 会员加入

```typescript
// 推荐：先验证再加入
if (paymentAmount >= NetworkService.ENTRY_FEE) {
  const result = await NetworkService.memberJoin(userId, inviterId, paymentAmount)
  toast.success(`加入成功！邀请码：${result.inviteCode}`)
} else {
  toast.error(`入会费用不足，需要${NetworkService.ENTRY_FEE}U`)
}
```

### 2. 网络统计查询

```typescript
// 推荐：定期查询并缓存
const stats = await NetworkService.getNetworkStats(userId)
localStorage.setItem('network_stats', JSON.stringify(stats))
```

### 3. 对碰奖计算

```typescript
// 推荐：只在定时任务中调用
// 避免用户手动触发，防止重复计算
```

---

## 📝 相关文档

- [双区对碰系统设计文档](./BINARY_SYSTEM_DESIGN.md)
- [数据库Schema](../supabase/schema.sql)
- [SchedulerService文档](../src/services/scheduler.service.ts)

---

**文档版本**: v1.0  
**最后更新**: 2025-10-04  
**维护者**: AI Assistant

































