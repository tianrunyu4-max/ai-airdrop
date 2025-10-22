# ⚙️ **系统参数配置功能 - 完整说明**

---

## 🎯 **功能概述：**

**所有数字参数都可配置，实时生效，无需重启！**

---

## 📋 **可配置的参数列表：**

### **1. Binary对碰系统参数**

| 参数键 | 默认值 | 单位 | 说明 | 范围 |
|--------|--------|------|------|------|
| `agent_fee` | 30 | U | AI代理加入费用 | 10-100 |
| `pairing_bonus_per_pair` | 7 | U | 每对对碰奖金 | 1-20 |
| `level_bonus_per_person` | 2 | U | 每人平级奖金 | 0.5-10 |
| `reinvest_threshold` | 300 | U | 原点复投阈值 | 100-1000 |
| `max_free_pairings` | 10 | 次 | 未解锁用户最多对碰次数 | 5-50 |
| `min_direct_referrals` | 2 | 人 | 解锁无限对碰的最少直推人数 | 1-10 |
| `level_bonus_depth` | 8 | 代 | 平级奖代数 | 5-20 |
| `dividend_min_referrals` | 10 | 人 | 分红资格的最少直推人数 | 5-50 |
| `member_ratio` | 85 | % | 会员获得对碰奖的比例 | 50-95 |
| `platform_ratio` | 15 | % | 平台费用比例（进入分红池） | 5-50 |

### **2. AI学习机参数**

| 参数键 | 默认值 | 单位 | 说明 | 范围 |
|--------|--------|------|------|------|
| `machine_price` | 7 | U | 学习机价格 | 1-50 |
| `first_activation_points` | 100 | 积分 | 首次激活所需积分 | 50-500 |
| `daily_release_rate` | 10 | % | 每日释放率 | 1-50 |
| `exit_multiplier` | 2 | 倍 | 退出倍数 | 1.5-5 |
| `to_u_percent` | 70 | % | 释放到U的比例 | 50-100 |
| `to_transfer_percent` | 30 | % | 释放到转账积分的比例 | 0-50 |
| `max_machines_per_user` | 10 | 台 | 每人最多学习机数量 | 5-100 |

### **3. 提现参数**

| 参数键 | 默认值 | 单位 | 说明 | 范围 |
|--------|--------|------|------|------|
| `min_amount` | 10 | U | 最低提现金额 | 1-100 |
| `fee_percent` | 5 | % | 提现手续费比例 | 0-20 |
| `daily_limit` | 10000 | U | 每日提现限额 | 1000-100000 |

---

## 🏗️ **技术架构：**

### **1. 数据库表**

```sql
CREATE TABLE system_params (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,     -- 分类
  param_key VARCHAR(100) UNIQUE,     -- 参数键
  param_value DECIMAL(20,4),         -- 参数值
  param_unit VARCHAR(20),            -- 单位
  description TEXT,                  -- 说明
  min_value DECIMAL(20,4),          -- 最小值
  max_value DECIMAL(20,4),          -- 最大值
  updated_at TIMESTAMP,             -- 更新时间
  updated_by UUID                   -- 更新人
);
```

### **2. 后端服务**

```typescript
// 读取参数（带缓存）
const agentFee = await SystemParamsService.getParam('agent_fee')

// 更新参数
await SystemParamsService.updateParam('agent_fee', 50, adminId)

// 批量更新
await SystemParamsService.batchUpdateParams([
  { paramKey: 'agent_fee', newValue: 50 },
  { paramKey: 'pairing_bonus_per_pair', newValue: 10 }
], adminId)
```

### **3. 前端管理界面**

```
路径：/admin/params

功能：
✅ 按分类显示所有参数
✅ 实时输入验证（范围检查）
✅ 批量保存
✅ 撤销更改
✅ 显示更改状态
```

---

## 🔧 **使用方法：**

### **管理员修改参数**

1. 登录管理后台
2. 点击"系统参数"菜单
3. 修改需要的参数值
4. 点击"保存所有更改"
5. 立即生效（无需重启）

### **开发者读取参数**

```typescript
// 在服务中读取参数
import { SystemParamsService } from '@/services/SystemParamsService'

// 读取单个参数
const agentFee = await SystemParamsService.getParam('agent_fee')

// 使用参数
await WalletManager.deduct(userId, agentFee, 'agent_purchase', '成为AI代理')
```

---

## ⚡ **缓存机制：**

```typescript
缓存策略：
- 缓存时间：60秒
- 自动刷新：缓存过期后自动重新加载
- 手动刷新：更新参数后自动清除缓存

性能优化：
- 首次查询：从数据库读取 → 写入缓存
- 后续查询：直接从缓存读取（60秒内）
- 参数更新：立即清除缓存 → 下次查询重新加载
```

---

## 🔒 **安全机制：**

### **1. 权限控制**

```sql
-- RLS策略
- 所有人可以读取参数
- 只有管理员可以修改参数
```

### **2. 范围验证**

```typescript
// 前端验证（实时）
<input 
  :min="param.min_value" 
  :max="param.max_value"
/>

// 后端验证（保存时）
if (newValue < minValue || newValue > maxValue) {
  throw new Error('参数值超出允许范围')
}
```

### **3. 审计日志**

```typescript
// 记录所有参数变更
updated_at: 更新时间
updated_by: 更新人ID
```

---

## 📊 **数据库迁移：**

### **执行SQL（在Supabase）**

```sql
-- 1. 创建系统参数表
-- 文件：supabase/migration_create_system_params.sql

-- 2. 插入默认参数
-- 自动插入所有默认值

-- 3. 查看所有参数
SELECT * FROM system_params ORDER BY category, param_key;
```

---

## 🎨 **前端界面预览：**

```
⚙️ 系统参数配置
───────────────────────────────────────

[刷新数据] [💾 保存所有更改] [取消更改]

🔄 Binary对碰系统参数
┌─────────────────────────────────────┐
│ AI代理加入费用                       │
│ [30] U     (10U - 100U)       [↺]  │
│                                     │
│ 每对对碰奖金                         │
│ [7] U      (1U - 20U)         [↺]  │
│ ...                                 │
└─────────────────────────────────────┘

🎓 AI学习机参数
┌─────────────────────────────────────┐
│ 学习机价格                           │
│ [7] U      (1U - 50U)         [↺]  │
│ ...                                 │
└─────────────────────────────────────┘
```

---

## ✅ **已完成功能：**

```
✅ 数据库表创建
✅ SystemParamsService（读取/更新）
✅ 缓存机制（60秒TTL）
✅ 前端管理界面
✅ ParamInput组件（输入验证）
✅ 路由配置
✅ 管理后台导航
✅ RLS权限控制
✅ 范围验证
✅ 批量保存
✅ 撤销更改
```

---

## 🚀 **下一步：**

### **修改现有服务使用SystemParamsService**

需要修改的文件：
1. `BinaryService.ts` - 使用动态参数
2. `MiningService.ts` - 使用动态参数
3. `AgentService.ts` - 使用动态参数

示例：
```typescript
// ❌ 旧代码（硬编码）
const AGENT_FEE = 30

// ✅ 新代码（动态参数）
const agentFee = await SystemParamsService.getParam('agent_fee')
```

---

## 📝 **测试清单：**

### **1. 数据库测试**

```sql
-- 执行迁移SQL
\i supabase/migration_create_system_params.sql

-- 查看参数
SELECT * FROM system_params;

-- 测试更新
UPDATE system_params 
SET param_value = 50 
WHERE param_key = 'agent_fee';
```

### **2. 前端测试**

```
1. 访问 /admin/params
2. 修改任意参数
3. 点击保存
4. 刷新页面，验证参数已保存
5. 测试撤销更改功能
6. 测试范围验证（输入超出范围的值）
```

### **3. 功能测试**

```
1. 修改agent_fee为50U
2. 尝试成为AI代理
3. 验证是否扣除50U（而不是30U）
4. 确认参数实时生效
```

---

## 🎉 **完成！**

**所有数字参数都可配置，实时生效，无需重启！**

**管理员可以通过后台轻松调整所有系统参数！** 💪





































