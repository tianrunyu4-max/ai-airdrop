# 🌳 双区对碰奖励系统 - 设计文档

> **版本**: v1.0  
> **系统类型**: A+B 双区自动排线 + 对碰奖励  
> **更新时间**: 2025-10-04

---

## 📋 系统概述

### 核心理念

让会员即便只做一侧市场，也能自动平衡收益，实现长期增长。系统自动计算对碰奖和平级奖，实现收益最大化。**不封顶、不归零**。

### 系统特点

- ✅ **自动排线**：系统自动分配到A/B两区，弱区优先填补
- ✅ **对碰奖励**：A/B两区配对，每组7U，不封顶
- ✅ **平级奖励**：下线触发对碰，向上3代各得2U
- ✅ **智能平衡**：强弱比例5:1，自动平衡两区业绩
- ✅ **复投机制**：总收益200U可复投30U
- ✅ **分红系统**：直推≥10人参与排线分红

---

## 🎯 核心规则

### 1. 会员加入与排线

| 项目 | 规则 |
|------|------|
| **入会费用** | 30U |
| **邀请码** | 系统自动生成 |
| **区域分配** | 自动分配到A/B两区 |
| **排线原则** | 弱区优先填补（强弱比5:1） |
| **上下级绑定** | 永久绑定，保证上级利益 |

**排线逻辑**：
```
计算当前A/B两区人数
if (A区人数 / B区人数 > 5) {
  新会员 → B区（弱区）
} else if (B区人数 / A区人数 > 5) {
  新会员 → A区（弱区）
} else {
  新会员 → 人数少的区
}
```

---

### 2. 解锁条件

| 条件 | 效果 |
|------|------|
| **直推 ≥ 2人** | ✅ 解锁伞下平级奖（直推链下3代） |
| **直推 < 2人** | ❌ 不触发平级奖 |

---

### 3. 对碰奖（配对奖励）

#### 基本规则

| 项目 | 规则 |
|------|------|
| **结算时间** | 每天凌晨12点自动结算 |
| **配对原则** | 满足2:1或1:2时触发 |
| **奖励金额** | 每组7U |
| **封顶限制** | ❌ 不封顶，无限累积 |
| **业绩处理** | 已结算扣减，未结算保留 |

#### 计算公式

```typescript
// 对碰奖计算
const 小区业绩 = Math.min(A区销售单数, B区销售单数)
const 对碰组数 = 小区业绩
const 对碰奖金 = 对碰组数 × 7U

// 剩余业绩
A区剩余 = A区销售单数 - 对碰组数
B区剩余 = B区销售单数 - 对碰组数
```

#### 示例计算

**示例1**：
```
A区：500单
B区：100单

计算：
- 小区业绩 = min(500, 100) = 100
- 对碰组数 = 100
- 对碰奖金 = 100 × 7U = 700U
- A区剩余 = 500 - 100 = 400单（保留到下次）
- B区剩余 = 100 - 100 = 0单
```

**示例2（多日累积）**：
```
第1天：
- A区：500单，B区：100单
- 对碰：100组 = 700U
- 剩余：A区400单，B区0单

第2天：
- A区新增：50单
- B区新增：200单
- 当前：A区450单，B区200单
- 对碰：200组 = 1400U
- 剩余：A区250单，B区0单

第3天：
- A区新增：100单
- B区新增：300单
- 当前：A区350单，B区300单
- 对碰：300组 = 2100U
- 剩余：A区50单，B区0单
```

---

### 4. 平级奖（向上奖励）

#### 基本规则

| 项目 | 规则 |
|------|------|
| **触发条件** | 下线3代内触发对碰奖 |
| **追溯范围** | 向上3代直推链 |
| **奖励金额** | 每人2U |
| **前提条件** | 直推 ≥ 2人（已解锁） |

#### 计算逻辑

```typescript
// 当下线触发对碰奖时
if (下线获得对碰奖) {
  // 向上追溯3代直推链
  for (let level = 1; level <= 3; level++) {
    const 上级 = 获取第N代直推上级(下线, level)
    
    if (上级.直推人数 >= 2) {
      发放平级奖(上级, 2U)
    }
  }
}
```

#### 示例计算

**网络结构**：
```
A（直推5人）
  └─ B（直推3人）
      └─ C（直推2人）
          └─ D（直推1人）
              └─ E（新会员触发对碰奖）
```

**当E触发对碰奖7U时**：
```
E获得对碰奖：7U

平级奖发放：
- D：直推1人 < 2人 → ❌ 不发放
- C：直推2人 ≥ 2人 → ✅ 发放2U
- B：直推3人 ≥ 2人 → ✅ 发放2U
- A：直推5人 ≥ 2人 → ✅ 发放2U（第3代，刚好）

总计：C、B、A各得2U平级奖
```

---

### 5. 复投机制

| 项目 | 规则 |
|------|------|
| **复投条件** | 总收益达到200U |
| **复投金额** | 30U |
| **复投效果** | 继续累积对碰奖和平级奖 |
| **自动复投** | 可设置自动复投 |

**流程**：
```
总收益 ≥ 200U
    ↓
系统提示复投
    ↓
用户选择：
  - 手动复投 → 扣除30U → 继续计算奖励
  - 自动复投 → 自动扣除30U → 无需操作
  - 暂不复投 → 继续累积收益
```

---

### 6. 分红结算

#### 基本规则

| 项目 | 规则 |
|------|------|
| **参与条件** | 直推 ≥ 10人 |
| **结算时间** | 每周一、三、五、七 |
| **分配比例** | 85%自动到账，15%分红池 |
| **分红对象** | 直推≥10人的会员 |

#### 计算公式

```typescript
// 每次对碰奖结算时
const 总对碰奖 = 对碰组数 × 7U

// 分配
const 会员收益 = 总对碰奖 × 85% = 对碰组数 × 5.95U
const 分红池 = 总对碰奖 × 15% = 对碰组数 × 1.05U

// 分红池分配（每周一、三、五、七）
const 符合条件的会员 = 查询直推≥10人的会员()
const 每人分红 = 分红池 / 符合条件的会员.length
```

#### 示例

**周一结算**：
```
本周累积分红池：10,000U
符合条件会员：20人

每人分红 = 10,000U / 20 = 500U

发放：
- 自动到账每人500U
- 分红池清零
```

---

### 7. 历史记录与分析

#### 记录内容

| 记录类型 | 内容 |
|---------|------|
| **业绩记录** | A/B区每日销售单数 |
| **收益记录** | 对碰奖、平级奖、分红 |
| **复投记录** | 复投时间、金额、累计次数 |
| **排线记录** | 推荐关系、区域分配 |

#### 数据分析

- 实时统计A/B两区业绩
- 动态计算强弱区比例
- 预测下次对碰奖时间
- 分析最优推广策略

---

## 📊 收益计算示例

### 场景1：新会员五五复制

**假设**：
- 你直推5人
- 每人再推5人（五五复制）
- 3代满员：5 + 25 + 125 = 155人

**收益计算**：

#### 第1代（5人）
```
5人付费 → 5×30U = 150U销售额
A区：3人，B区：2人

对碰奖：
- 小区业绩 = 2人
- 对碰奖 = 2 × 7U = 14U

平级奖：
- 你的直推人数 ≥ 2人 → 解锁
- 5个一代各触发对碰奖时，你获得：5 × 2U = 10U
```

#### 第2代（25人）
```
25人付费 → 25×30U = 750U销售额
A区：13人，B区：12人

对碰奖：
- 小区业绩 = 12人
- 对碰奖 = 12 × 7U = 84U

平级奖：
- 25个二代各触发对碰奖时
- 向上追溯：你（第2代上级）→ 获得：25 × 2U = 50U
```

#### 第3代（125人）
```
125人付费 → 125×30U = 3,750U销售额
A区：63人，B区：62人

对碰奖：
- 小区业绩 = 62人
- 对碰奖 = 62 × 7U = 434U

平级奖：
- 125个三代各触发对碰奖时
- 向上追溯：你（第3代上级）→ 获得：125 × 2U = 250U
```

**总收益**：
```
对碰奖：14U + 84U + 434U = 532U
平级奖：10U + 50U + 250U = 310U
总计：532U + 310U = 842U

投入：30U
回报率：842U / 30U = 28倍
```

---

### 场景2：单侧市场（只做A区）

**假设**：
- 你只推广A区
- A区：100人
- B区：0人（依靠其他上级填补）

**收益计算**：

```
初期（B区空）：
- A区：100人
- B区：0人
- 对碰奖：0U（无法配对）

系统自动排线后：
- A区：100人
- B区：20人（系统自动分配新会员到B区）
- 对碰奖：20 × 7U = 140U

继续累积：
- A区：100人
- B区：50人
- 对碰奖：50 × 7U = 350U
- A区剩余：50人（保留）
```

**关键**：即使只做单侧，系统也会自动平衡，确保收益。

---

## 🔧 技术实现

### 数据库Schema更新

```sql
-- 更新users表，添加A/B区字段
ALTER TABLE users ADD COLUMN network_side VARCHAR(1) CHECK (network_side IN ('A', 'B'));
ALTER TABLE users ADD COLUMN parent_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN a_side_sales INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN b_side_sales INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN a_side_settled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN b_side_settled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_pairing_bonus DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE users ADD COLUMN total_level_bonus DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE users ADD COLUMN is_unlocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN reinvestment_count INTEGER DEFAULT 0;

-- 创建对碰奖记录表
CREATE TABLE pairing_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pairs_count INTEGER NOT NULL,
  bonus_amount DECIMAL(10, 2) NOT NULL,
  a_side_before INTEGER NOT NULL,
  b_side_before INTEGER NOT NULL,
  a_side_after INTEGER NOT NULL,
  b_side_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建平级奖记录表
CREATE TABLE level_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  bonus_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建分红记录表
CREATE TABLE dividend_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dividend_amount DECIMAL(10, 2) NOT NULL,
  total_pool DECIMAL(10, 2) NOT NULL,
  qualified_members INTEGER NOT NULL,
  settlement_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📈 系统优势

### 1. 自动平衡

- ✅ 系统自动排线，无需手动分配
- ✅ 弱区优先填补，保持5:1平衡
- ✅ 单侧市场也能获得收益

### 2. 收益最大化

- ✅ 对碰奖不封顶，无限累积
- ✅ 平级奖覆盖3代，收益倍增
- ✅ 分红池参与，额外收益

### 3. 可持续发展

- ✅ 复投机制，持续产生收益
- ✅ 业绩不归零，长期累积
- ✅ 上下级永久绑定，利益稳定

---

## 🎯 推广策略建议

### 策略1：快速起步

1. 直推2人 → 解锁平级奖
2. 帮助下线各推2人 → 形成基础网络
3. 专注一侧市场 → 系统自动平衡

### 策略2：五五复制

1. 直推5人
2. 培训每人再推5人
3. 3代满员155人 → 收益842U

### 策略3：深度发展

1. 直推10人 → 参与分红
2. 帮助每人推10人 → 建立强大团队
3. 持续复投 → 指数增长

---

## 📋 开发计划

1. ✅ 系统设计文档
2. ⏳ 更新数据库Schema
3. ⏳ NetworkService（排线+对碰+平级）
4. ⏳ 定时任务（每日对碰奖结算）
5. ⏳ 团队管理UI（A/B区业绩展示）
6. ⏳ 收益记录UI（对碰奖/平级奖明细）
7. ⏳ 复投功能UI
8. ⏳ 分红结算UI

---

**文档版本**: v1.0  
**最后更新**: 2025-10-04  
**系统状态**: 🔄 设计中





































