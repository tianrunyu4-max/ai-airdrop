# 🛡️ **Binary系统：只有付费AI代理参与（核心设计）**

## 🎯 **核心原则：**

```
只有支付30U成为AI代理的用户才参与Binary奖励系统！
```

---

## 📊 **两种用户类型：**

### **1. 免费注册用户（非代理）**

```
特征：
  - is_agent = false
  - 未支付30U
  - 不在binary_members表中
  
权限：
  ✅ 可以注册账号
  ✅ 可以浏览系统
  ✅ 可以了解规则
  ✅ 可以推荐他人（获得推荐码）
  
限制：
  ❌ 不参与对碰奖励
  ❌ 不参与平级奖励
  ❌ 不参与分红
  ❌ 不占用Binary树位置
  ❌ 不会获得滑落新人
  ❌ 无法激活AI学习机
  ❌ 无法使用互转积分
  
状态：
  观望者 / 潜在客户
```

---

### **2. 付费AI代理（已付30U）**

```
特征：
  - is_agent = true
  - 已支付30U
  - 记录在binary_members表中
  - 有agent_paid_at时间戳
  
权限：
  ✅ 所有免费用户权限
  ✅ 参与对碰奖励（5.95U/对）
  ✅ 参与8代平级奖（2U/人）
  ✅ 参与全局分红（15%池）
  ✅ 占用Binary树位置
  ✅ 获得滑落新人
  ✅ 可以激活AI学习机（第1台用100积分）
  ✅ 可以使用互转积分
  ✅ 可以复投（300U复投30U）
  
状态：
  正式会员 / 可获得所有奖励
```

---

## 🏗️ **系统架构设计：**

### **注册流程：**

```
第1步：免费注册
  → 创建账号（username + password）
  → is_agent = false
  → 可以浏览系统
  → 看到推荐码
  
第2步：成为AI代理（可选，但必需才能赚钱）
  → 支付30U
  → is_agent = true
  → agent_paid_at = NOW()
  → 自动加入binary_members表
  → 开始参与所有奖励
```

---

### **Binary树结构（只记录AI代理）：**

```
假设网络结构（实际推荐关系）：
      您（AI代理，30U）
     ╱   |    ╲
    A    B     C
  (代理) (免费) (代理)
  30U    0U    30U
   |            |
  A1           C1
 (免费)       (代理)
  0U          30U

Binary树结构（只记录代理）：
      您
     ╱  ╲
    A    C
   ╱      ╲
  (空)    C1

说明：
  - B是免费用户，不在Binary树中
  - A1是免费用户，不在Binary树中
  - 只有A、C、C1是AI代理，才记录在树中
  - 滑落查找只在A、C、C1之间进行
```

---

## 🔄 **滑落逻辑（只在AI代理间）：**

### **场景1：新AI代理加入**

```
网络中有：
  您（代理） → A（代理）→ A1（免费）
  您（代理） → B（免费）→ B1（代理）
  您（代理） → C（代理）

新代理D加入（邀请人是您）：

步骤1：系统查找您的Binary树位置
  - 您的A区：A（代理，有记录）✅
  - 您的B区：C（代理，有记录）✅
  - 两区都满了

步骤2：继续向下查找（只在代理中）
  - A的A区：空（A1是免费用户，不计入）
  - A的B区：空
  → 找到空位！D滑落到A的A区 ✅

结果：
  您
 ╱  ╲
A    C
|
D

说明：
  - A1虽然是A的下级，但因为是免费用户不计入Binary树
  - D滑落到A的A区（第一个空位）
  - A获得D的对碰机会
```

---

### **场景2：免费用户不影响滑落**

```
您推了100人：
  - 20人是AI代理（付费30U）
  - 80人是免费用户（未付费）

Binary树中只记录20个AI代理：
  您
 ╱ ╲
A1  A2
╱╲  ╱╲
... ...

新AI代理加入：
  → 只在20个代理中查找空位
  → 跳过80个免费用户
  → 滑落到最需要的AI代理位置 ✅

优势：
  ✅ 付费代理获得应有回报
  ✅ 免费用户不占位
  ✅ 系统更公平
```

---

## 💰 **收益对比：**

### **场景：您推了10个人**

| 情况 | AI代理数 | 免费用户数 | 您的对碰 | 您的收益 |
|------|---------|----------|----------|---------|
| **情况1** | 10人 | 0人 | 5对 | 29.75U ✅ |
| **情况2** | 5人 | 5人 | 2对 | 11.9U ⚠️ |
| **情况3** | 2人 | 8人 | 1对 | 5.95U ❌ |

**说明：**
- 情况1：所有人都付费，您获得最大收益
- 情况2：只有一半人付费，收益减半
- 情况3：只有2人付费，收益最少

**结论：**
- 推广的关键是让更多人成为AI代理（付费30U）
- 免费用户越多，您的收益越少
- 系统激励推广付费会员 ✅

---

## 🎓 **推广策略建议：**

### **策略1：体验式推广**

```
步骤1：让新人免费注册
  → 了解系统
  → 看到规则
  → 建立信任

步骤2：展示收益案例
  → 展示您的对碰收益
  → 展示平级奖收益
  → 展示分红收益

步骤3：引导付费
  → "付30U，立即参与所有奖励"
  → "10次对碰就能回本（59.5U）"
  → "推2人解锁无限对碰"

转化率：预计50-70%
```

---

### **策略2：直接推广付费**

```
话术：
  "加入我们的AI智能空投系统！"
  "只需30U，立即开启躺赚模式："
  → 对碰奖：5.95U/对
  → 平级奖：2U/人 × 8代
  → 全局分红：15%池
  → AI学习机：10%日释放
  
  "100人团队，每天躺赚40-60U！"
  "推2人解锁无限对碰，收益无上限！"

转化率：预计30-50%
```

---

## 🔐 **系统安全性：**

### **防止滥用：**

```
问题1：免费用户占位
  解决：✅ 免费用户不进入Binary树

问题2：假代理（付费但不推广）
  解决：✅ 10次对碰限制（需≥2直推解锁无限）

问题3：代理离开系统
  解决：✅ 付费不可退，但位置永久保留

问题4：恶意注册大量免费账号
  解决：✅ 免费账号不占资源，不影响系统
```

---

## 📊 **数据库设计：**

### **users表：**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  is_agent BOOLEAN DEFAULT FALSE,     -- 是否为AI代理
  agent_paid_at TIMESTAMP,            -- 付费时间（用于排序公排）
  inviter_id UUID,                    -- 推荐人（可以是任何人）
  ...
);
```

### **binary_members表（只记录AI代理）：**

```sql
CREATE TABLE binary_members (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  upline_id UUID REFERENCES users(id),
  position_side TEXT CHECK (position_side IN ('A', 'B')),
  a_side_count INTEGER DEFAULT 0,
  b_side_count INTEGER DEFAULT 0,
  a_side_pending INTEGER DEFAULT 0,
  b_side_pending INTEGER DEFAULT 0,
  total_pairing_bonus DECIMAL(20, 2) DEFAULT 0,
  total_level_bonus DECIMAL(20, 2) DEFAULT 0,
  total_dividend DECIMAL(20, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 约束：只有AI代理才能插入
  CONSTRAINT fk_agent CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_id
      AND users.is_agent = TRUE
    )
  )
);
```

---

## 🚀 **代码实现要点：**

### **1. 成为AI代理：**

```typescript
// src/services/AgentService.ts
static async becomeAgent(userId: string): Promise<ApiResponse<void>> {
  // 1. 扣除30U
  await WalletManager.deduct(userId, 30, 'agent_purchase', '成为AI代理')
  
  // 2. 设置为代理
  await supabase
    .from('users')
    .update({
      is_agent: true,
      agent_paid_at: new Date().toISOString()
    })
    .eq('id', userId)
  
  // 3. 自动加入Binary系统
  await BinaryService.joinBinarySystem(userId)
  
  return { success: true, message: '成功成为AI代理！' }
}
```

---

### **2. 滑落逻辑（只查AI代理）：**

```typescript
// src/services/BinaryService.ts
private static async findBestPlacement(startUserId: string) {
  // ✅ 验证起始用户是否为AI代理
  const { data: startUser } = await supabase
    .from('users')
    .select('is_agent')
    .eq('id', startUserId)
    .single()

  if (!startUser?.is_agent) {
    throw new Error('只有付费AI代理才能参与Binary系统')
  }

  // ✅ 查询当前节点的直接下级（只查AI代理）
  const { data: children } = await supabase
    .from('binary_members')
    .select(`
      user_id,
      position_side,
      users!inner(is_agent)
    `)
    .eq('upline_id', userId)
    .eq('users.is_agent', true) // 只查AI代理

  // 继续查找空位...
}
```

---

### **3. 对碰计算（只触发AI代理）：**

```typescript
// src/services/BinaryService.ts
static async calculatePairing(userId: string) {
  // 查询用户是否为AI代理
  const { data: user } = await supabase
    .from('users')
    .select('is_agent')
    .eq('id', userId)
    .single()

  if (!user?.is_agent) {
    console.log(`⚠️ 用户${userId}不是AI代理，跳过对碰计算`)
    return // 免费用户不参与对碰
  }

  // 继续对碰逻辑...
}
```

---

## ✅ **修改总结：**

### **已完成：**

1. ✅ **滑落逻辑只查AI代理**
   - 修改`findBestPlacement`方法
   - 添加`is_agent`验证
   - 查询子节点时过滤`is_agent=true`

2. ✅ **对碰计算跳过免费用户**
   - 在`calculatePairing`开始处验证
   - 免费用户直接返回，不发放奖励

3. ✅ **平级奖只在AI代理链中传递**
   - `triggerLevelBonus`中验证每一级
   - 跳过非AI代理上级

4. ✅ **分红只分配给AI代理**
   - `distributeDividends`中过滤`is_agent=true`
   - 免费用户不参与分红

---

## 🎯 **关键优势：**

```
✅ 公平性：付费者获得应有回报
✅ 激励性：鼓励推广付费会员
✅ 安全性：免费用户不占资源
✅ 可持续：资金流入与支出平衡
✅ 清晰性：规则简单明了
```

---

## 📱 **前端提示：**

### **免费用户看到的：**

```
🎁 AI智能空投系统

当前状态：观望者（免费账户）

✅ 您已注册成功！
⚠️ 您还未成为AI代理，无法获得以下权益：
  - 对碰奖励（5.95U/对）
  - 8代平级奖（2U/人）
  - 全局分红（15%）
  - AI学习机（10%日释放）
  - 互转积分

💡 立即成为AI代理，解锁所有权益！
仅需支付 30U，10次对碰即可回本！

[立即成为AI代理 - 30U]
```

---

### **AI代理看到的：**

```
🎉 AI智能空投系统

当前状态：AI代理（付费会员）

✅ 已解锁所有权益：
  ✅ 对碰奖励（5.95U/对）
  ✅ 8代平级奖（2U/人）
  ✅ 全局分红（15%）
  ✅ AI学习机（10%日释放）
  ✅ 互转积分

您的收益：
  对碰奖：128次 × 5.95U = 761.6U
  平级奖：64次 × 2U = 128U
  分红：3次 × 15U = 45U
  总收益：934.6U

[继续推广] [查看团队]
```

---

**✅ 修改完成！系统现在只在付费AI代理间运行Binary奖励系统！**

生成时间：2025-10-09  
版本：v3.0  
状态：已上线 🚀

