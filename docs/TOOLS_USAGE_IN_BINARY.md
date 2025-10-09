# 🛠️ 工具层在双区系统中的最佳应用

## 📌 概述

本文档详细说明如何在**自动排线 + 对碰 + 平级奖**系统中，充分利用各个工具层。

---

## 🎯 各层在双区系统中的应用

### 1️⃣ Controller层 - 接口定义

**在双区系统中的应用**：

```typescript
// src/controllers/BinaryController.ts

import { BaseController } from './BaseController'
import { BinaryService } from '@/services'
import type { ApiResponse } from '@/types'

export class BinaryController extends BaseController {
  /**
   * 用户加入双区系统
   * @param userId 用户ID
   * @param inviterId 邀请人ID
   * @param inviteCode 邀请码
   */
  static async join(
    userId: string,
    inviterId: string,
    inviteCode: string
  ): Promise<ApiResponse> {
    // 1. 参数验证
    this.validateRequired({ userId, inviterId, inviteCode })
    
    // 2. 权限检查（是否已加入）
    const hasJoined = await BinaryService.checkJoined(userId)
    if (hasJoined) {
      return this.error('您已经加入过了')
    }
    
    // 3. 验证邀请码
    const isValid = await this.validateInviteCode(inviteCode, inviterId)
    if (!isValid) {
      return this.error('邀请码无效')
    }
    
    // 4. 调用Service
    return await BinaryService.joinBinary(userId, inviterId)
  }
  
  /**
   * 获取用户双区信息
   */
  static async getInfo(userId: string): Promise<ApiResponse> {
    this.validateRequired({ userId })
    return await BinaryService.getUserInfo(userId)
  }
  
  /**
   * 获取团队树状结构
   */
  static async getTeamTree(userId: string, depth: number = 3): Promise<ApiResponse> {
    this.validateRequired({ userId })
    this.validateRange({ depth }, 'depth', 1, 10)
    return await BinaryService.getTeamTree(userId, depth)
  }
  
  /**
   * 手动触发对碰结算（测试用）
   */
  static async settlePairing(userId: string): Promise<ApiResponse> {
    this.validateRequired({ userId })
    this.checkAdminPermission() // 仅管理员
    return await BinaryService.settlePairing(userId)
  }
}
```

**优势**：
- ✅ 统一的入口点
- ✅ 参数验证和权限检查在调用业务逻辑前完成
- ✅ 便于接入API路由或RPC调用

---

### 2️⃣ Service层 - 业务逻辑

**在双区系统中的应用**：

```typescript
// src/services/BinaryService.ts

import { BaseService } from './BaseService'
import { BinaryRepository, UserRepository, EarningsRepository } from '@/repositories'
import { WalletManager } from '@/wallet'
import { BinaryConfig } from '@/config'
import type { ApiResponse } from '@/types'

export class BinaryService extends BaseService {
  /**
   * 用户加入双区系统
   */
  static async joinBinary(userId: string, inviterId: string): Promise<ApiResponse> {
    try {
      // 1. 扣除加入费用（30U）
      await WalletManager.deduct(
        userId,
        BinaryConfig.JOIN_FEE,
        'agent_fee',
        '加入双区系统'
      )
      
      // 2. 生成邀请码
      const inviteCode = await this.generateInviteCode(userId)
      await UserRepository.updateInviteCode(userId, inviteCode)
      
      // 3. 自动排线（弱区优先，5:1比例）
      const placement = await this.autoPlacement(inviterId)
      
      // 4. 创建节点
      await BinaryRepository.createNode({
        user_id: userId,
        parent_id: placement.parentId,
        side: placement.side,
        level: placement.level
      })
      
      // 5. 更新上级销售业绩
      await this.updateUplineSales(placement.parentId, placement.side, BinaryConfig.JOIN_FEE)
      
      // 6. 绑定上下级关系
      await UserRepository.updateInviter(userId, inviterId)
      await UserRepository.incrementDirectReferrals(inviterId)
      
      return this.success({ 
        inviteCode, 
        placement 
      }, '加入成功')
      
    } catch (error) {
      // 回滚：退回30U
      await WalletManager.add(userId, BinaryConfig.JOIN_FEE, 'refund', '加入失败退款')
      return this.error(error.message)
    }
  }
  
  /**
   * 自动排线逻辑
   */
  private static async autoPlacement(inviterId: string) {
    // 1. 获取推荐人的下线情况
    const inviterNode = await BinaryRepository.getNode(inviterId)
    
    // 2. 计算A/B区人数
    const aSideCount = await BinaryRepository.getTeamCount(inviterId, 'A')
    const bSideCount = await BinaryRepository.getTeamCount(inviterId, 'B')
    
    // 3. 找出弱区
    let weakSide: 'A' | 'B'
    if (aSideCount < bSideCount) {
      weakSide = 'A'
    } else if (bSideCount < aSideCount) {
      weakSide = 'B'
    } else {
      // 相等时，检查5:1比例
      weakSide = Math.random() > 0.2 ? 'A' : 'B'
    }
    
    // 4. 在弱区找到最深的空位
    const parent = await BinaryRepository.findEmptySlot(inviterId, weakSide)
    
    return {
      parentId: parent.id,
      side: parent.availableSide,
      level: parent.level + 1
    }
  }
  
  /**
   * 对碰结算
   */
  static async settlePairing(userId: string): Promise<ApiResponse> {
    // 1. 获取A/B区销售业绩
    const sales = await BinaryRepository.getUserSales(userId)
    
    // 2. 计算对碰次数
    const minSide = Math.min(sales.a_side_sales, sales.b_side_sales)
    const maxSide = Math.max(sales.a_side_sales, sales.b_side_sales)
    
    // 3. 检查是否满足2:1或1:2比例
    if (maxSide < minSide * 2 && minSide < maxSide * 2) {
      return this.success({ pairs: 0 }, '未达到对碰比例')
    }
    
    // 4. 计算对碰次数（每单30U）
    const pairs = Math.floor(minSide / 30)
    if (pairs === 0) {
      return this.success({ pairs: 0 }, '业绩不足以对碰')
    }
    
    // 5. 发放对碰奖（每单7U）
    const pairingBonus = pairs * BinaryConfig.PAIRING_BONUS
    await WalletManager.add(userId, pairingBonus, 'pairing_bonus', `对碰奖 ${pairs}次`)
    
    // 6. 记录收益
    await EarningsRepository.create({
      user_id: userId,
      type: 'pairing',
      amount: pairingBonus,
      description: `对碰奖 ${pairs}次`
    })
    
    // 7. 更新总收益
    await UserRepository.incrementTotalEarnings(userId, pairingBonus)
    
    // 8. 触发平级奖
    await this.triggerLevelBonus(userId, pairs)
    
    // 9. 检查是否需要复投
    await this.checkReinvestment(userId)
    
    return this.success({ 
      pairs, 
      bonus: pairingBonus 
    }, '对碰结算完成')
  }
  
  /**
   * 触发平级奖
   */
  private static async triggerLevelBonus(userId: string, pairs: number) {
    // 1. 向上追溯3代直推链
    const upline = await UserRepository.getUplineChain(userId, 3)
    
    for (const ancestor of upline) {
      // 2. 检查是否解锁平级奖（直推≥2人）
      if (ancestor.direct_referral_count < BinaryConfig.LEVEL_BONUS_UNLOCK) {
        continue
      }
      
      // 3. 发放平级奖（每次2U）
      const levelBonus = pairs * BinaryConfig.LEVEL_BONUS
      await WalletManager.add(
        ancestor.id,
        levelBonus,
        'level_bonus',
        `平级奖 来自${userId}`
      )
      
      // 4. 记录收益
      await EarningsRepository.create({
        user_id: ancestor.id,
        type: 'level',
        amount: levelBonus,
        description: `平级奖 ${pairs}次`
      })
      
      // 5. 更新总收益
      await UserRepository.incrementTotalEarnings(ancestor.id, levelBonus)
    }
  }
  
  /**
   * 检查是否需要复投
   */
  private static async checkReinvestment(userId: string) {
    const user = await UserRepository.findById(userId)
    
    // 每结算300U提示复投
    if (user.total_earnings >= BinaryConfig.REINVEST_THRESHOLD) {
      // 1. 冻结账户
      await UserRepository.freezeAccount(userId)
      
      // 2. 发送通知
      // TODO: 推送通知到前端
      
      // 3. 记录复投提示
      await this.logReinvestNotification(userId)
    }
  }
}
```

**优势**：
- ✅ 复杂业务逻辑集中管理
- ✅ 调用Wallet模块处理余额
- ✅ 调用Repository处理数据
- ✅ 事务管理和回滚

---

### 3️⃣ Repository层 - 数据访问

**在双区系统中的应用**：

```typescript
// src/repositories/BinaryRepository.ts

import { BaseRepository } from './BaseRepository'
import { supabase } from '@/lib/supabase'
import type { BinaryNode } from '@/entities'

export class BinaryRepository extends BaseRepository {
  /**
   * 创建节点
   */
  static async createNode(node: Partial<BinaryNode>) {
    return this.handleQuery(
      supabase.from('binary_nodes').insert(node).select().single()
    )
  }
  
  /**
   * 获取节点
   */
  static async getNode(userId: string) {
    return this.handleQuery(
      supabase.from('binary_nodes').select('*').eq('user_id', userId).single()
    )
  }
  
  /**
   * 获取用户销售业绩
   */
  static async getUserSales(userId: string) {
    return this.handleQuery(
      supabase
        .from('users')
        .select('a_side_sales, b_side_sales, total_earnings')
        .eq('id', userId)
        .single()
    )
  }
  
  /**
   * 更新销售业绩
   */
  static async updateSales(userId: string, side: 'A' | 'B', amount: number) {
    const field = side === 'A' ? 'a_side_sales' : 'b_side_sales'
    
    return this.handleQuery(
      supabase.rpc('increment_sales', {
        user_id: userId,
        field,
        amount
      })
    )
  }
  
  /**
   * 获取团队人数
   */
  static async getTeamCount(userId: string, side: 'A' | 'B') {
    const { data } = await supabase
      .from('binary_nodes')
      .select('id', { count: 'exact' })
      .eq('parent_id', userId)
      .eq('side', side)
    
    return data?.length || 0
  }
  
  /**
   * 查找空位
   */
  static async findEmptySlot(rootId: string, side: 'A' | 'B') {
    // 广度优先搜索找到最浅的空位
    const result = await supabase.rpc('find_empty_slot', {
      root_id: rootId,
      target_side: side
    })
    
    return result.data
  }
  
  /**
   * 获取有业绩的用户（用于定时结算）
   */
  static async getUsersWithSales() {
    return this.handleQuery(
      supabase
        .from('users')
        .select('id, a_side_sales, b_side_sales')
        .or('a_side_sales.gte.30,b_side_sales.gte.30')
    )
  }
}
```

**优势**：
- ✅ 所有数据库操作封装在这里
- ✅ 便于切换数据库
- ✅ 便于Mock测试

---

### 4️⃣ Entity层 - 数据模型

**在双区系统中的应用**：

```typescript
// src/entities/BinaryNode.entity.ts

export interface BinaryNode {
  id: string
  user_id: string
  parent_id: string | null
  side: 'A' | 'B' | null
  level: number
  position: string // 例如: "1-A-L-R" (1级-A区-左-右)
  a_child_id: string | null
  b_child_id: string | null
  created_at: string
  updated_at: string
}

// src/entities/Earnings.entity.ts

export interface Earnings {
  id: string
  user_id: string
  type: 'pairing' | 'level' | 'dividend' | 'mining' | 'referral'
  amount: number
  description: string
  source_user_id?: string
  created_at: string
}

// src/entities/Placement.entity.ts

export interface Placement {
  parentId: string
  side: 'A' | 'B'
  level: number
  position: string
}
```

**优势**：
- ✅ 类型安全
- ✅ 统一的数据结构
- ✅ 便于维护

---

### 5️⃣ Wallet模块 - 余额管理

**在双区系统中的应用**：

```typescript
// src/wallet/WalletManager.ts

import { UserRepository, TransactionRepository } from '@/repositories'
import { BalanceValidator } from './BalanceValidator'
import { TransactionLogger } from './TransactionLogger'

export class WalletManager {
  /**
   * 增加余额
   */
  static async add(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string
  ): Promise<void> {
    // 1. 获取当前余额
    const user = await UserRepository.findById(userId)
    
    // 2. 计算新余额
    const newBalance = user.u_balance + amount
    
    // 3. 更新余额
    await UserRepository.updateBalance(userId, newBalance)
    
    // 4. 记录流水
    await TransactionLogger.log({
      user_id: userId,
      type,
      amount,
      balance_after: newBalance,
      description
    })
  }
  
  /**
   * 扣除余额（带验证）
   */
  static async deduct(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string
  ): Promise<void> {
    // 1. 验证余额是否充足
    await BalanceValidator.checkSufficient(userId, amount)
    
    // 2. 获取当前余额
    const user = await UserRepository.findById(userId)
    
    // 3. 计算新余额
    const newBalance = user.u_balance - amount
    
    // 4. 更新余额
    await UserRepository.updateBalance(userId, newBalance)
    
    // 5. 记录流水
    await TransactionLogger.log({
      user_id: userId,
      type,
      amount: -amount,
      balance_after: newBalance,
      description
    })
  }
  
  /**
   * 冻结余额
   */
  static async freeze(userId: string, amount: number): Promise<void> {
    const user = await UserRepository.findById(userId)
    
    // 验证余额
    await BalanceValidator.checkSufficient(userId, amount)
    
    // 增加冻结余额
    await UserRepository.update(userId, {
      frozen_balance: user.frozen_balance + amount,
      u_balance: user.u_balance - amount
    })
    
    // 记录流水
    await TransactionLogger.log({
      user_id: userId,
      type: 'freeze',
      amount: -amount,
      balance_after: user.u_balance - amount,
      description: '余额冻结'
    })
  }
  
  /**
   * 解冻余额
   */
  static async unfreeze(userId: string, amount: number): Promise<void> {
    const user = await UserRepository.findById(userId)
    
    // 更新余额
    await UserRepository.update(userId, {
      frozen_balance: user.frozen_balance - amount,
      u_balance: user.u_balance + amount
    })
    
    // 记录流水
    await TransactionLogger.log({
      user_id: userId,
      type: 'unfreeze',
      amount: amount,
      balance_after: user.u_balance + amount,
      description: '余额解冻'
    })
  }
}

// src/wallet/BalanceValidator.ts

export class BalanceValidator {
  /**
   * 检查余额是否充足
   */
  static async checkSufficient(userId: string, amount: number): Promise<void> {
    const user = await UserRepository.findById(userId)
    
    if (user.u_balance < amount) {
      throw new BusinessException(`余额不足，当前余额${user.u_balance}U，需要${amount}U`)
    }
    
    // 检查账户是否冻结
    if (user.is_frozen) {
      throw new BusinessException('账户已冻结，请先完成复投')
    }
  }
  
  /**
   * 防止重复扣款
   */
  static async checkDuplicate(userId: string, orderId: string): Promise<boolean> {
    const exists = await TransactionRepository.findByOrderId(orderId)
    return !!exists
  }
}
```

**优势**：
- ✅ 余额操作集中管理
- ✅ 自动记录流水
- ✅ 防止重复扣款
- ✅ 余额验证

---

### 6️⃣ Scheduler模块 - 定时任务

**在双区系统中的应用**：

```typescript
// src/scheduler/tasks/BinaryPairingTask.ts

import { BaseTask } from '../BaseTask'
import { BinaryService } from '@/services'
import { BinaryRepository } from '@/repositories'

export class BinaryPairingTask extends BaseTask {
  name = 'binary-pairing'
  description = '对碰奖结算'
  schedule = '0 0 * * *' // 每天00:00执行
  
  async execute() {
    this.log('开始对碰结算...')
    
    try {
      // 1. 获取所有有业绩的用户
      const users = await BinaryRepository.getUsersWithSales()
      this.log(`找到${users.length}个用户需要结算`)
      
      let successCount = 0
      let failCount = 0
      
      // 2. 逐个结算
      for (const user of users) {
        try {
          const result = await BinaryService.settlePairing(user.id)
          
          if (result.success && result.data.pairs > 0) {
            this.log(`用户${user.id}对碰${result.data.pairs}次，奖励${result.data.bonus}U`)
            successCount++
          }
          
        } catch (error) {
          this.logError(`用户${user.id}结算失败: ${error.message}`)
          failCount++
        }
      }
      
      this.log(`对碰结算完成！成功${successCount}个，失败${failCount}个`)
      
    } catch (error) {
      this.logError(`对碰结算失败: ${error.message}`)
      throw error
    }
  }
}

// src/scheduler/tasks/DividendTask.ts

export class DividendTask extends BaseTask {
  name = 'dividend'
  description = '分红结算'
  schedule = '0 0 * * 1,3,5,0' // 每周一、三、五、日00:00
  
  async execute() {
    this.log('开始分红结算...')
    
    // 1. 获取符合条件的用户（直推≥10人）
    const eligibleUsers = await UserRepository.getDividendEligibleUsers()
    
    // 2. 计算本期分红池
    const pool = await this.calculateDividendPool()
    
    // 3. 计算每人分红金额
    const perUser = pool / eligibleUsers.length
    
    // 4. 发放分红
    for (const user of eligibleUsers) {
      await WalletManager.add(user.id, perUser, 'dividend', '分红奖励')
    }
    
    this.log(`分红结算完成！分红池${pool}U，${eligibleUsers.length}人，每人${perUser}U`)
  }
  
  private async calculateDividendPool() {
    // 获取本期所有加入费用的15%
    const totalFees = await BinaryRepository.getTotalFeesThisWeek()
    return totalFees * 0.15
  }
}
```

**优势**：
- ✅ 自动化执行
- ✅ 错误重试
- ✅ 执行日志
- ✅ 任务监控

---

### 7️⃣ Config模块 - 配置管理

**在双区系统中的应用**：

```typescript
// src/config/binary.ts

export const BinaryConfig = {
  // 加入费用
  JOIN_FEE: 30,
  
  // 对碰奖励
  PAIRING_BONUS: 7,
  PAIRING_UNIT: 30, // 每单30U
  
  // 对碰比例
  PAIRING_RATIO: {
    MIN: 2,  // 最小2:1
    MAX: 1   // 最大1:2
  },
  
  // 平级奖
  LEVEL_BONUS: 2,
  LEVEL_BONUS_DEPTH: 3,
  LEVEL_BONUS_UNLOCK: 2, // 直推≥2人解锁
  
  // 自动排线
  AUTO_PLACEMENT: {
    WEAK_SIDE_PRIORITY: true,
    STRONG_WEAK_RATIO: 5 // 强弱比例5:1
  },
  
  // 复投
  REINVEST_THRESHOLD: 300,
  REINVEST_AMOUNT: 30,
  
  // 分红
  DIVIDEND_CONDITION: 10, // 直推≥10人
  DIVIDEND_RATIO: 0.15,   // 15%
  DIVIDEND_DAYS: [1, 3, 5, 0] // 周一、三、五、日
}

// src/config/rewards.ts

export const RewardsConfig = {
  // 各类奖励类型
  TYPES: {
    PAIRING: 'pairing_bonus',
    LEVEL: 'level_bonus',
    DIVIDEND: 'dividend',
    MINING: 'mining_release',
    REFERRAL: 'referral_bonus'
  },
  
  // 奖励描述模板
  DESCRIPTIONS: {
    PAIRING: (times: number) => `对碰奖 ${times}次`,
    LEVEL: (from: string) => `平级奖 来自${from}`,
    DIVIDEND: (amount: number) => `分红 ${amount}U`
  }
}
```

**优势**：
- ✅ 配置集中管理
- ✅ 修改配置不需要改代码
- ✅ 便于A/B测试

---

## 📊 完整数据流示例

### 场景：用户加入 → 自动排线 → 触发对碰 → 发放平级奖

```
1. View 
   └─> 用户点击"支付30U加入"

2. Controller
   └─> BinaryController.join(userId, inviterId, inviteCode)
       ├─> 参数验证
       ├─> 权限检查
       └─> 调用Service

3. Service
   └─> BinaryService.joinBinary()
       ├─> Wallet扣除30U
       │   ├─> BalanceValidator.checkSufficient()
       │   ├─> WalletManager.deduct()
       │   └─> TransactionLogger.log()
       │
       ├─> 生成邀请码
       │   └─> Repository.updateInviteCode()
       │
       ├─> 自动排线
       │   ├─> Repository.getTeamCount()
       │   ├─> 判断弱区
       │   └─> Repository.findEmptySlot()
       │
       ├─> 创建节点
       │   └─> Repository.createNode()
       │
       └─> 更新上级业绩
           └─> Repository.updateSales()

4. Scheduler (每天00:00)
   └─> BinaryPairingTask.execute()
       └─> Service.settlePairing()
           ├─> Repository.getUserSales()
           ├─> 计算对碰次数
           ├─> Wallet发放对碰奖
           ├─> Service.triggerLevelBonus()
           │   └─> Wallet发放平级奖
           └─> Service.checkReinvestment()
```

---

## 🎯 关键优势

### ✅ 业务逻辑清晰
每一层职责明确，代码易读易维护

### ✅ 数据一致性
Wallet模块保证余额操作的原子性

### ✅ 可扩展性
新增功能只需在对应层添加方法

### ✅ 可测试性
每一层都可以独立Mock测试

### ✅ 可监控性
Scheduler记录任务执行日志

---

## 🚀 实施建议

### 优先级1：创建基础设施
- Config（配置）
- Entity（实体）
- Exception（异常）

### 优先级2：创建数据层
- Repository（数据访问）

### 优先级3：创建核心模块
- Wallet（余额管理）
- Service（业务逻辑）

### 优先级4：创建接口层
- Controller（接口）

### 优先级5：创建定时任务
- Scheduler（定时结算）

---

**按照这个架构实现，系统将非常健壮、可维护、可扩展！** 💪


