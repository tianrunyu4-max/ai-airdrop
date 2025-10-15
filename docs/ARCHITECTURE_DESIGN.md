# 🏗️ AI智能空投平台 - 完整架构设计

## 📂 目录结构

```
src/
├── controllers/              # 控制器层 - 接口定义
│   ├── BaseController.ts
│   ├── UserController.ts
│   ├── BinaryController.ts
│   ├── ChatController.ts
│   ├── WithdrawalController.ts
│   ├── MiningController.ts
│   ├── TransferController.ts
│   └── index.ts
│
├── services/                 # 业务逻辑层
│   ├── BaseService.ts
│   ├── UserService.ts
│   ├── BinaryService.ts      # 自动排线 + 对碰 + 平级奖
│   ├── ChatService.ts
│   ├── WithdrawalService.ts
│   ├── MiningService.ts
│   ├── TransactionService.ts
│   ├── WalletService.ts      # 余额和流水管理
│   └── index.ts
│
├── repositories/             # 数据访问层
│   ├── BaseRepository.ts
│   ├── UserRepository.ts
│   ├── BinaryRepository.ts
│   ├── TransactionRepository.ts
│   ├── WithdrawalRepository.ts
│   ├── MiningRepository.ts
│   ├── ChatRepository.ts
│   ├── EarningsRepository.ts
│   └── index.ts
│
├── entities/                 # 实体定义
│   ├── User.entity.ts
│   ├── Transaction.entity.ts
│   ├── Withdrawal.entity.ts
│   ├── Mining.entity.ts
│   ├── BinaryNode.entity.ts
│   ├── Earnings.entity.ts
│   ├── InviteCode.entity.ts
│   ├── ChatGroup.entity.ts
│   ├── Message.entity.ts
│   └── index.ts
│
├── wallet/                   # 钱包模块
│   ├── WalletManager.ts      # 余额管理
│   ├── TransactionLogger.ts  # 流水记录
│   ├── BalanceValidator.ts   # 余额验证
│   └── index.ts
│
├── scheduler/                # 定时任务
│   ├── SchedulerManager.ts   # 任务管理器
│   ├── tasks/
│   │   ├── MiningReleaseTask.ts     # 矿机释放
│   │   ├── BinaryPairingTask.ts     # 对碰结算
│   │   ├── DividendTask.ts          # 分红结算
│   │   └── ReinvestCheckTask.ts     # 复投检查
│   └── index.ts
│
├── config/                   # 配置层
│   ├── constants.ts          # 常量定义
│   ├── rewards.ts            # 奖励配置
│   ├── mining.ts             # 矿机配置
│   ├── binary.ts             # 双区配置
│   ├── system.ts             # 系统配置
│   └── index.ts
│
├── utils/                    # 工具函数
│   ├── validator.ts          # 数据验证
│   ├── formatter.ts          # 格式化工具
│   ├── calculator.ts         # 计算工具
│   ├── crypto.ts             # 加密工具
│   └── index.ts
│
├── exceptions/               # 异常处理
│   ├── BaseException.ts
│   ├── BusinessException.ts
│   ├── ValidationException.ts
│   └── index.ts
│
├── middleware/               # 中间件
│   ├── auth.ts               # 认证中间件
│   ├── permission.ts         # 权限中间件
│   ├── rateLimit.ts          # 限流中间件
│   └── index.ts
│
├── types/                    # TypeScript类型
│   ├── api.types.ts
│   ├── binary.types.ts
│   ├── wallet.types.ts
│   └── index.ts
│
└── views/                    # 视图层 (已有)
    ├── chat/
    ├── mining/
    ├── transfer/
    └── ...
```

---

## 🎯 各层职责详解

### 1️⃣ Controller Layer (控制器层)

**职责**：
- ✅ 定义API接口
- ✅ 参数验证和类型检查
- ✅ 权限验证
- ✅ 调用Service处理业务
- ✅ 返回统一格式响应

**示例**：
```typescript
// UserController.ts
class UserController extends BaseController {
  // 获取用户信息
  static async getProfile(userId: string): Promise<ApiResponse<User>> {
    // 1. 参数验证
    this.validateRequired({ userId })
    
    // 2. 权限检查
    this.checkPermission(userId)
    
    // 3. 调用Service
    return await UserService.getProfile(userId)
  }
  
  // 订阅代理
  static async subscribeAgent(userId: string): Promise<ApiResponse<User>> {
    this.validateRequired({ userId })
    return await UserService.subscribeAgent(userId)
  }
}
```

---

### 2️⃣ Service Layer (业务逻辑层)

**职责**：
- ✅ 处理复杂业务逻辑
- ✅ 事务管理
- ✅ 调用多个Repository
- ✅ 调用Wallet模块
- ✅ 业务规则校验

**示例**：
```typescript
// BinaryService.ts
class BinaryService extends BaseService {
  // 用户加入双区系统
  static async joinBinary(userId: string, inviterId: string): Promise<ApiResponse> {
    // 1. 扣除加入费用
    await WalletService.deduct(userId, BinaryConfig.JOIN_FEE, '加入双区系统')
    
    // 2. 自动排线
    const placement = await this.autoPlacement(inviterId)
    
    // 3. 创建节点
    await BinaryRepository.createNode(userId, placement)
    
    // 4. 更新上级业绩
    await this.updateUplineSales(placement, BinaryConfig.JOIN_FEE)
    
    return { success: true }
  }
  
  // 对碰结算
  static async settlePairing(userId: string): Promise<ApiResponse> {
    // 1. 获取A/B区业绩
    const sales = await BinaryRepository.getUserSales(userId)
    
    // 2. 计算对碰次数
    const pairs = this.calculatePairs(sales.a_side, sales.b_side)
    
    // 3. 发放对碰奖
    const bonus = pairs * BinaryConfig.PAIRING_BONUS
    await WalletService.add(userId, bonus, '对碰奖')
    
    // 4. 触发平级奖
    await this.triggerLevelBonus(userId, pairs)
    
    return { success: true, data: { pairs, bonus } }
  }
}
```

---

### 3️⃣ Repository Layer (数据访问层)

**职责**：
- ✅ 封装所有数据库操作
- ✅ 提供CRUD方法
- ✅ 不包含业务逻辑
- ✅ 返回Entity对象

**示例**：
```typescript
// BinaryRepository.ts
class BinaryRepository extends BaseRepository {
  // 创建节点
  static async createNode(userId: string, placement: Placement) {
    return await supabase
      .from('binary_nodes')
      .insert({
        user_id: userId,
        parent_id: placement.parentId,
        side: placement.side,
        level: placement.level
      })
  }
  
  // 获取用户销售业绩
  static async getUserSales(userId: string) {
    return await supabase
      .from('users')
      .select('a_side_sales, b_side_sales')
      .eq('id', userId)
      .single()
  }
  
  // 更新业绩
  static async updateSales(userId: string, side: 'A' | 'B', amount: number) {
    const field = side === 'A' ? 'a_side_sales' : 'b_side_sales'
    return await supabase.rpc('increment_sales', { 
      user_id: userId, 
      field, 
      amount 
    })
  }
}
```

---

### 4️⃣ Entity Layer (实体层)

**职责**：
- ✅ 定义数据模型
- ✅ 类型定义
- ✅ 数据验证规则

**示例**：
```typescript
// BinaryNode.entity.ts
export interface BinaryNode {
  id: string
  user_id: string
  parent_id: string | null
  side: 'A' | 'B' | null
  level: number
  a_side_sales: number
  b_side_sales: number
  total_pairs: number
  created_at: string
}

// Earnings.entity.ts
export interface Earnings {
  id: string
  user_id: string
  type: 'pairing' | 'level' | 'dividend' | 'mining'
  amount: number
  description: string
  created_at: string
}
```

---

### 5️⃣ Wallet Module (钱包模块)

**职责**：
- ✅ 余额管理（增加/扣除/冻结/解冻）
- ✅ 流水记录
- ✅ 余额验证
- ✅ 防重复扣款

**示例**：
```typescript
// WalletManager.ts
class WalletManager {
  // 增加余额
  static async add(
    userId: string, 
    amount: number, 
    type: TransactionType,
    description: string
  ): Promise<void> {
    // 1. 获取当前余额
    const balance = await this.getBalance(userId)
    
    // 2. 更新余额
    const newBalance = balance + amount
    await UserRepository.updateBalance(userId, newBalance)
    
    // 3. 记录流水
    await TransactionLogger.log({
      userId,
      type,
      amount,
      balanceAfter: newBalance,
      description
    })
  }
  
  // 扣除余额
  static async deduct(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string
  ): Promise<void> {
    // 1. 验证余额
    await BalanceValidator.checkSufficient(userId, amount)
    
    // 2. 扣除余额
    const balance = await this.getBalance(userId)
    const newBalance = balance - amount
    await UserRepository.updateBalance(userId, newBalance)
    
    // 3. 记录流水
    await TransactionLogger.log({
      userId,
      type,
      amount: -amount,
      balanceAfter: newBalance,
      description
    })
  }
  
  // 冻结余额
  static async freeze(userId: string, amount: number): Promise<void> {
    await UserRepository.updateFrozenBalance(userId, amount)
  }
}
```

---

### 6️⃣ Scheduler Module (定时任务模块)

**职责**：
- ✅ 管理所有定时任务
- ✅ 任务调度和执行
- ✅ 错误重试
- ✅ 执行日志

**示例**：
```typescript
// SchedulerManager.ts
class SchedulerManager {
  private tasks: Map<string, ScheduledTask> = new Map()
  
  // 注册任务
  register(task: ScheduledTask) {
    this.tasks.set(task.name, task)
  }
  
  // 启动所有任务
  start() {
    this.register(new MiningReleaseTask())      // 每天00:00
    this.register(new BinaryPairingTask())      // 每天00:00
    this.register(new DividendTask())           // 每周一三五七
    this.register(new ReinvestCheckTask())      // 每小时
    
    this.tasks.forEach(task => task.start())
  }
}

// BinaryPairingTask.ts
class BinaryPairingTask extends BaseTask {
  name = 'binary-pairing'
  schedule = '0 0 * * *' // 每天00:00
  
  async execute() {
    // 1. 获取所有有业绩的用户
    const users = await BinaryRepository.getUsersWithSales()
    
    // 2. 逐个结算
    for (const user of users) {
      try {
        await BinaryService.settlePairing(user.id)
      } catch (error) {
        this.logError(user.id, error)
      }
    }
  }
}
```

---

### 7️⃣ Config Module (配置模块)

**职责**：
- ✅ 定义系统常量
- ✅ 奖励比例配置
- ✅ 业务规则配置
- ✅ 环境变量管理

**示例**：
```typescript
// binary.ts
export const BinaryConfig = {
  // 加入费用
  JOIN_FEE: 30,
  
  // 对碰奖励
  PAIRING_BONUS: 7,
  
  // 对碰比例
  PAIRING_RATIO: {
    MIN: 2,  // 2:1
    MAX: 1   // 1:2
  },
  
  // 平级奖励
  LEVEL_BONUS: 2,
  
  // 平级奖解锁条件
  LEVEL_BONUS_UNLOCK: 2, // 直推≥2人
  
  // 平级奖追溯代数
  LEVEL_BONUS_DEPTH: 3,
  
  // 复投阈值
  REINVEST_THRESHOLD: 300,
  
  // 分红条件
  DIVIDEND_CONDITION: 10, // 直推≥10人
  
  // 分红比例
  DIVIDEND_RATIO: 0.15 // 15%
}

// rewards.ts
export const RewardsConfig = {
  // 矿机加速规则
  MINING_BOOST: {
    PER_REFERRAL: 0.015,  // 每个直推加速1.5%
    MAX: 0.10              // 最多加速10%
  },
  
  // 矿机出局倍数
  MINING_EXIT_MULTIPLIER: {
    TYPE_1: 10,  // 100积分 10倍出局
    TYPE_2: 2,   // 1000积分 2倍出局
    TYPE_3: 2    // 5000积分 2倍出局
  },
  
  // 提现手续费
  WITHDRAWAL_FEE: 0.05, // 5%
  
  // 最低提现
  MIN_WITHDRAWAL: 20
}
```

---

## 🔄 数据流示例

### 场景：用户加入双区系统

```
1. View Layer
   └─> 用户点击"支付30U加入"按钮

2. Controller Layer
   └─> BinaryController.join(userId, inviterId)
       ├─> 验证参数
       ├─> 检查权限
       └─> 调用Service

3. Service Layer
   └─> BinaryService.joinBinary(userId, inviterId)
       ├─> WalletService.deduct(userId, 30, '加入双区')
       │   ├─> BalanceValidator.checkSufficient()
       │   ├─> WalletManager.deduct()
       │   └─> TransactionLogger.log()
       │
       ├─> BinaryService.autoPlacement(inviterId)
       │   ├─> 查找弱区
       │   └─> 分配位置
       │
       └─> BinaryRepository.createNode()

4. Repository Layer
   └─> BinaryRepository.createNode(userId, placement)
       └─> 执行数据库INSERT

5. Database Layer
   └─> Supabase执行SQL
```

---

## 🎯 实际应用场景

### 场景1：对碰奖结算（定时任务）

```typescript
// 每天00:00自动执行
class BinaryPairingTask extends BaseTask {
  async execute() {
    // 1. Repository获取数据
    const users = await BinaryRepository.getUsersWithSales()
    
    // 2. Service处理业务
    for (const user of users) {
      const result = await BinaryService.settlePairing(user.id)
      
      if (result.success) {
        // 3. Wallet记录流水
        await WalletManager.add(
          user.id,
          result.data.bonus,
          'pairing_bonus',
          `对碰奖 ${result.data.pairs}次`
        )
        
        // 4. 触发平级奖
        await BinaryService.triggerLevelBonus(user.id, result.data.pairs)
      }
    }
  }
}
```

### 场景2：用户转账

```typescript
// Controller
const result = await TransferController.transferU({
  fromUserId: 'user-1',
  toUserId: 'user-2',
  amount: 100
})

// Service
class TransferService {
  static async transferU(params) {
    // 1. Wallet扣除发送方
    await WalletManager.deduct(
      params.fromUserId,
      params.amount,
      'transfer_out',
      `转账给 ${toUser.username}`
    )
    
    // 2. Wallet增加接收方
    await WalletManager.add(
      params.toUserId,
      params.amount,
      'transfer_in',
      '收到转账'
    )
    
    return { success: true }
  }
}
```

---

## 📊 优势总结

### ✅ 代码质量
- **可读性**：每层职责清晰
- **可维护性**：修改某层不影响其他层
- **可测试性**：每层可独立测试

### ✅ 开发效率
- **复用性**：Repository和Service可被多处调用
- **并行开发**：不同开发者负责不同层
- **快速定位**：问题出现时快速找到对应层

### ✅ 系统稳定性
- **事务安全**：Wallet模块保证余额一致性
- **错误隔离**：某层出错不影响整体
- **日志追踪**：每层都有日志记录

---

## 🚀 下一步实施计划

### Phase 1: 基础设施 (1-2天)
- [ ] 创建Entity层（所有实体定义）
- [ ] 创建Config层（所有配置）
- [ ] 创建Exception层（异常处理）
- [ ] 创建Utils层（工具函数）

### Phase 2: 数据层 (2-3天)
- [ ] 创建Repository层（所有数据访问）
- [ ] 编写Repository单元测试

### Phase 3: 业务层 (3-4天)
- [ ] 创建Wallet模块（余额管理）
- [ ] 重构现有Service（使用新架构）
- [ ] 创建新Service（Binary、Mining等）

### Phase 4: 接口层 (2-3天)
- [ ] 创建Controller层
- [ ] 接入权限中间件
- [ ] 接入限流中间件

### Phase 5: 定时任务 (2-3天)
- [ ] 创建Scheduler模块
- [ ] 实现所有定时任务
- [ ] 任务监控和日志

### Phase 6: 视图层重构 (3-4天)
- [ ] 所有Vue组件改用Controller调用
- [ ] 统一错误处理
- [ ] 统一Loading状态

---

**总计：约15-20天完成整体架构升级**

这个架构设计是**企业级、可扩展、高质量**的，值得投入时间去实现！💪



















