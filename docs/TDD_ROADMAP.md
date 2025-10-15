# 🚀 AI智能空投平台 - TDD开发路线图

## 📊 系统现状检查

### ✅ 已完成模块
- [x] 用户认证系统（注册/登录/退出）
- [x] UI布局（卡片式设计统一）
  - [x] ChatView - AI机器人推送卡片 + 广告
  - [x] PointsView - 余额卡片 + 矿机卡片
  - [x] SubscriptionView - 代理卡片 + 空投列表
  - [x] ProfileView - 用户信息卡片 + 余额卡片
- [x] 底部导航栏（快速跳转优化）
- [x] 多语言支持（中英文切换）
- [x] 开发模式数据模拟（localStorage）

### ❌ 待实现模块
- [ ] 测试框架和测试用例
- [ ] 核心业务逻辑（链动2+1系统）
- [ ] 交易记录管理
- [ ] 提现/转账功能
- [ ] 团队管理功能
- [ ] 矿机购买和释放系统
- [ ] 管理后台功能

---

## 🎯 MVP模块清单

### 阶段1：测试框架搭建（当前优先级）
**目标**：建立TDD工作流程基础

#### 模块1.1：测试环境配置
- **输入**：Vitest配置
- **输出**：可运行的测试环境
- **验收标准**：`npm run test` 成功运行

#### 模块1.2：测试工具函数
- **输入**：测试辅助工具
- **输出**：模拟数据生成器、断言辅助函数
- **验收标准**：可复用的测试工具

---

### 阶段2：核心业务逻辑（链动2+1系统）
**目标**：实现分润算法和奖励机制

#### 模块2.1：用户注册与网络构建
**功能**：实现"走1留2"机制

**测试用例**：
```typescript
describe('用户注册网络构建', () => {
  test('新用户注册：前2个直推应该放入推荐人网络', () => {
    // Given: 用户A已注册
    // When: 用户B、C通过A的邀请码注册
    // Then: B、C的network_root_id = A.network_root_id
    //       A.referral_position = 2
  })
  
  test('新用户注册：第3个直推开始建立自己网络', () => {
    // Given: 用户A已有2个直推
    // When: 用户D通过A的邀请码注册
    // Then: D.network_root_id = A.id
    //       A.has_network = true
  })
})
```

**接口定义**：
```typescript
interface RegisterUserInput {
  username: string
  password: string
  inviteCode: string
}

interface RegisterUserOutput {
  success: boolean
  user: User
  networkInfo: {
    position: number
    networkRootId: string | null
  }
}
```

---

#### 模块2.2：见点奖计算
**功能**：新网络成员加入时，发放8U见点奖

**测试用例**：
```typescript
describe('见点奖计算', () => {
  test('网络内新增成员：网络所有者获得8U见点奖', () => {
    // Given: 用户A有自己的网络
    // When: 用户E加入A的网络（通过B/C的邀请）
    // Then: A获得8U见点奖
    //       创建交易记录：type='spot_award', amount=8
  })
  
  test('无网络用户：不触发见点奖', () => {
    // Given: 用户B没有自己的网络
    // When: 有新用户加入B的上级网络
    // Then: B不获得见点奖
  })
})
```

**接口定义**：
```typescript
interface SpotAwardInput {
  networkOwnerId: string
  newMemberId: string
}

interface SpotAwardOutput {
  awarded: boolean
  amount: number
  transactionId: string
}
```

---

#### 模块2.3：平级见点奖计算
**功能**：5级上线中有≥5个直推的人获得3U

**测试用例**：
```typescript
describe('平级见点奖计算', () => {
  test('上线有5个直推：触发平级见点奖3U', () => {
    // Given: 用户A有5个直推，用户B在A的下级链中
    // When: B的网络新增成员（触发B的见点奖）
    // Then: A获得3U平级见点奖
  })
  
  test('上线不足5个直推：不触发平级见点奖', () => {
    // Given: 用户C有3个直推
    // When: C下级网络新增成员
    // Then: C不获得平级见点奖
  })
  
  test('5级上线中多人满足条件：全部发放', () => {
    // Given: 5级链中有3人满足条件
    // When: 最底层用户网络新增成员
    // Then: 3人各获得3U
  })
})
```

**接口定义**：
```typescript
interface PeerSpotAwardInput {
  triggerId: string // 触发见点奖的用户ID
}

interface PeerSpotAwardOutput {
  awards: Array<{
    userId: string
    amount: number
    level: number
  }>
  totalAwarded: number
}
```

---

#### 模块2.4：直推分红计算
**功能**：≥5个直推的代理，在周一/三/五/日获得7U/单

**测试用例**：
```typescript
describe('直推分红计算', () => {
  test('周一新订单：有5个直推的代理获得7U', () => {
    // Given: 今天是周一，用户A有5个直推
    // When: A的直推B成为代理（支付30U）
    // Then: A获得7U分红
  })
  
  test('周二新订单：不发放分红', () => {
    // Given: 今天是周二
    // When: 有新代理订单
    // Then: 不发放直推分红
  })
  
  test('直推不足5个：不获得分红', () => {
    // Given: 用户C有3个直推
    // When: 周一有新订单
    // Then: C不获得分红
  })
})
```

**接口定义**：
```typescript
interface DirectReferralDividendInput {
  newAgentId: string
  paymentDate: Date
}

interface DirectReferralDividendOutput {
  dividendPaid: boolean
  recipientId: string | null
  amount: number
}
```

---

#### 模块2.5：复购机制
**功能**：全网收益达200U时，自动复购30U

**测试用例**：
```typescript
describe('自动复购机制', () => {
  test('全网收益达200U：自动触发30U复购', () => {
    // Given: 用户A全网累计收益299U
    // When: A获得2U见点奖（总计301U）
    // Then: 自动扣除30U，创建复购订单
    //       触发新一轮奖励分配
  })
  
  test('复购后：触发直推分红（如果在分红日）', () => {
    // Given: 周一，用户A复购30U，A的上级B有5个直推
    // When: 自动复购触发
    // Then: B获得7U直推分红
  })
})
```

**接口定义**：
```typescript
interface RepurchaseCheckInput {
  userId: string
  newEarning: number
}

interface RepurchaseCheckOutput {
  shouldRepurchase: boolean
  currentTotal: number
  repurchaseAmount: number
  newOrderId?: string
}
```

---

### 阶段3：矿机系统
**目标**：实现积分购买、释放、加速机制

#### 模块3.1：矿机购买
**测试用例**：
```typescript
describe('矿机购买', () => {
  test('购买100积分矿机：生成矿机记录', () => {
    // Given: 用户有100积分
    // When: 购买矿机
    // Then: 扣除100积分，创建矿机记录
    //       initial_points=100, total_points=1000
  })
  
  test('积分不足：购买失败', () => {
    // Given: 用户只有50积分
    // When: 尝试购买100积分矿机
    // Then: 抛出错误：积分不足
  })
  
  test('已有50台矿机：购买失败', () => {
    // Given: 用户已有50台矿机
    // When: 尝试购买第51台
    // Then: 抛出错误：超过上限
  })
})
```

---

#### 模块3.2：积分释放计算
**测试用例**：
```typescript
describe('矿机每日释放', () => {
  test('基础释放1%：每天释放1积分', () => {
    // Given: 100积分矿机，base_rate=1%，无加速
    // When: 第一天释放
    // Then: released_points += 1
  })
  
  test('有5个直推：加速到11%（1%+5*2%）', () => {
    // Given: 用户有5个直推
    // When: 每日释放
    // Then: 释放11积分（100*11%）
  })
  
  test('10倍出局：释放1000积分后停止', () => {
    // Given: 矿机已释放1000积分
    // When: 尝试继续释放
    // Then: is_active=false, exited_at=NOW()
  })
})
```

---

#### 模块3.3：积分兑换U
**测试用例**：
```typescript
describe('积分兑换U', () => {
  test('兑换100积分：获得4.9U（70%），30积分留存', () => {
    // Given: 用户有100积分
    // When: 兑换全部积分
    // Then: u_balance += 4.9U (100*0.07*0.7)
    //       points_balance += 30 (100*0.3)
    //       原积分清零
  })
})
```

---

### 阶段4：交易与转账
**目标**：实现U余额的提现和互转

#### 模块4.1：提现申请
**测试用例**：
```typescript
describe('提现功能', () => {
  test('余额≥20U：创建提现申请', () => {
    // Given: 用户余额50U
    // When: 申请提现20U
    // Then: 创建pending状态交易记录
    //       u_balance -= 20
  })
  
  test('余额<20U：提现失败', () => {
    // Given: 用户余额15U
    // When: 申请提现20U
    // Then: 抛出错误：低于最小提现金额
  })
})
```

---

#### 模块4.2：会员互转
**测试用例**：
```typescript
describe('会员互转', () => {
  test('转账给其他用户：扣除发送方，增加接收方', () => {
    // Given: A有50U，B有10U
    // When: A转30U给B
    // Then: A余额=20U, B余额=40U
    //       创建2条交易记录（转出/转入）
  })
  
  test('余额不足：转账失败', () => {
    // Given: A只有10U
    // When: 尝试转20U
    // Then: 抛出错误：余额不足
  })
})
```

---

### 阶段5：团队管理
**目标**：查看直推和网络成员

#### 模块5.1：直推列表
**测试用例**：
```typescript
describe('团队管理', () => {
  test('查看直推：返回所有直接邀请的用户', () => {
    // Given: 用户A邀请了B、C、D
    // When: 查询A的直推列表
    // Then: 返回[B, C, D]，显示注册时间、是否代理
  })
})
```

---

#### 模块5.2：网络成员统计
**测试用例**：
```typescript
describe('网络统计', () => {
  test('查看网络：返回所有网络成员数量和收益', () => {
    // Given: A的网络有50人
    // When: 查询网络统计
    // Then: 返回总人数、今日新增、累计奖励
  })
})
```

---

## 🔄 工作流程

### 每个模块的开发步骤：
1. **编写测试用例** - 定义输入/输出/边界条件
2. **运行测试** - 确认测试失败（红色）
3. **实现最小代码** - 让测试通过（绿色）
4. **重构代码** - 优化结构和性能
5. **集成测试** - 确保与其他模块协同工作
6. **文档更新** - 更新接口文档和用户指南

---

## 📋 下一步行动计划

### 🎯 立即开始：阶段1 - 测试框架搭建

#### 任务1.1：创建测试配置文件
- [ ] `vitest.config.ts` - 测试环境配置
- [ ] `tests/setup.ts` - 全局测试设置
- [ ] `tests/utils/` - 测试工具函数

#### 任务1.2：创建第一个测试
- [ ] `tests/unit/auth.test.ts` - 用户认证测试
- [ ] 确保 `npm run test` 成功运行

#### 任务1.3：创建模拟数据生成器
- [ ] `tests/mocks/users.ts` - 用户数据模拟
- [ ] `tests/mocks/transactions.ts` - 交易数据模拟

---

## 🚦 当前状态

| 模块 | 状态 | 进度 |
|------|------|------|
| UI布局 | ✅ 完成 | 100% |
| 用户认证 | ✅ 完成 | 100% |
| 测试框架 | 🔴 未开始 | 0% |
| 链动2+1 | 🔴 未开始 | 0% |
| 矿机系统 | 🟡 UI完成 | 20% |
| 交易系统 | 🟡 UI完成 | 20% |
| 团队管理 | 🔴 未开始 | 0% |
| 管理后台 | 🟡 框架完成 | 10% |

---

## 📊 技术债务清单

1. **性能优化**
   - [ ] 虚拟滚动（群聊消息、交易记录）
   - [ ] 图片懒加载
   - [ ] 路由懒加载已完成

2. **安全性**
   - [ ] XSS防护
   - [ ] CSRF防护
   - [ ] Rate limiting

3. **可维护性**
   - [ ] 错误边界处理
   - [ ] 日志系统
   - [ ] 性能监控

---

## 🎓 开发原则

1. **测试先行**：先写测试，后写实现
2. **小步快跑**：每次只完成一个小功能
3. **持续集成**：保持系统随时可运行
4. **文档同步**：代码和文档同步更新
5. **代码审查**：所有代码都要经过审查

---

**准备好了吗？让我们从测试框架开始！** 🚀






