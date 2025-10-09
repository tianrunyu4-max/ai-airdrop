# AI积分矿机系统文档

## 📋 业务规则

### 1. 积分类型

系统使用**双积分机制**：

#### 1.1 矿机产出积分 (mining_points)
- ✅ **可兑换U**
- ✅ 由矿机每日自动产出
- ✅ 兑换比例：100积分 = 7U
- ✅ 每次兑换只能兑换70%为U，30%转为互转积分

#### 1.2 互转积分 (transfer_points)
- ❌ **不可兑换U**
- ✅ 可用于购买矿机
- ✅ 可用于会员之间互转
- ✅ 从积分兑换U时的30%分成获得

### 2. 矿机系统

#### 2.1 矿机型号

| 型号 | 积分成本 | 每日产出 | 生产天数 | 总产出 |
|------|----------|----------|----------|--------|
| 一型矿机 | 25积分 | 5积分/天 | 5天 | 25积分 |
| 二型矿机 | 50积分 | 10积分/天 | 10天 | 100积分 |
| 三型矿机 | 150积分 | 20积分/天 | 20天 | 400积分 |

#### 2.2 购买规则
- ✅ 优先使用互转积分
- ✅ 互转积分不足时使用矿机积分
- ✅ 购买后立即开始运行
- ✅ 每人最多可购买50台矿机

#### 2.3 每日释放规则

**基础释放率：1%/天**

**加速机制**：
- 每个直推代理 +2% 释放率
- 最多20个直推，最高加速40%
- 总释放率最高：1% + 40% = 41%/天

**计算公式**：
```javascript
每日释放积分 = 矿机初始成本 × (基础释放率 + 加速释放率)
```

**示例**：
- 0个直推：100积分矿机，每天释放 100 × 1% = 1积分
- 5个直推：100积分矿机，每天释放 100 × 11% = 11积分
- 20个直推：100积分矿机，每天释放 100 × 41% = 41积分

#### 2.4 10倍出局机制

- 矿机总产出 = 初始成本 × 10
- 达到总产出后，矿机自动出局
- 出局后可以重新购买

**示例**：
- 购买100积分的矿机
- 总产出限制：1000积分
- 达到1000积分后自动出局

### 3. 积分兑换U

#### 3.1 兑换条件
- ✅ 只能使用矿机产出积分（mining_points）
- ✅ 最低兑换：100积分
- ✅ 必须是100的倍数

#### 3.2 兑换比例
**100积分 = 7U**

#### 3.3 70/30分配规则

每次兑换时：
- **70%兑换为U**：直接到账U余额
- **30%转为互转积分**：到账transfer_points

**计算示例**：
```
兑换200积分：
- 实际可兑换：200 × 70% = 140积分
- 获得U：(140 ÷ 100) × 7 = 9.8U
- 获得互转积分：200 × 30% = 60积分
```

### 4. 矿机重启机制

#### 4.1 触发条件
- 用户的加速积分（直推人数）不足
- 系统后端手动触发

#### 4.2 重启效果
- ✅ 所有矿机重启
- ✅ 销毁所有账户30%的积分
- ✅ 剩余积分排队等待新积分释放

---

## 🔧 技术实现

### 1. 数据库Schema

#### users表
```sql
CREATE TABLE users (
  ...
  points_balance DECIMAL(10,2) DEFAULT 0,      -- 总积分
  mining_points DECIMAL(10,2) DEFAULT 0,       -- 矿机积分
  transfer_points DECIMAL(10,2) DEFAULT 0,     -- 互转积分
  ...
);
```

#### mining_machines表
```sql
CREATE TABLE mining_machines (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  machine_type VARCHAR(20),              -- 矿机型号
  daily_output DECIMAL(10,2),            -- 每日产出
  production_days INT,                   -- 生产天数
  points_cost DECIMAL(10,2),             -- 购买成本
  initial_points DECIMAL(10,2),          -- 初始积分
  released_points DECIMAL(10,2),         -- 已释放积分
  total_points DECIMAL(10,2),            -- 总积分（10倍出局）
  base_rate DECIMAL(5,2) DEFAULT 1.00,   -- 基础释放率
  boost_rate DECIMAL(5,2) DEFAULT 0.00,  -- 加速释放率
  boost_count INT DEFAULT 0,             -- 加速数量
  is_active BOOLEAN DEFAULT TRUE,
  exited_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. 服务层实现

参考 `src/services/mining.service.ts`

### 3. UI组件

参考 `src/views/points/PointsView.vue`

---

## 📝 业务流程

### 流程1：购买矿机

```
用户点击"立即兑换" 
  → 检查积分余额（mining_points + transfer_points）
  → 扣除积分（优先transfer_points）
  → 创建矿机记录
  → 设置基础释放率1%
  → 根据直推人数设置加速释放率
  → 开始运行
```

### 流程2：每日释放（定时任务）

```
每天00:00执行
  → 查询所有活跃矿机
  → 对每台矿机：
    → 计算当日释放积分 = 初始成本 × (基础率 + 加速率)
    → 增加released_points
    → 增加用户的mining_points
    → 检查是否达到10倍出局
    → 如果出局，设置is_active = false
```

### 流程3：兑换U

```
用户输入兑换数量
  → 验证：mining_points >= 兑换数量
  → 验证：兑换数量 >= 100 且为100的倍数
  → 计算可兑换部分：数量 × 70%
  → 计算获得U：(可兑换部分 ÷ 100) × 7
  → 计算获得互转积分：数量 × 30%
  → 扣除mining_points
  → 增加u_balance
  → 增加transfer_points
  → 创建交易记录
```

---

## 📊 数据统计

### 用户积分概览
- 总积分余额 = mining_points + transfer_points
- 可兑换积分 = floor(mining_points × 0.7 / 100) × 100
- 预计获得U = (可兑换积分 ÷ 100) × 7

### 矿机统计
- 活跃矿机数量
- 每日总产出
- 累计总释放
- 平均释放率

---

## ⚠️ 注意事项

### 开发模式
- 使用localStorage模拟数据
- 每日释放需手动触发（生产环境使用定时任务）
- 新用户默认150 mining_points用于测试

### 生产环境
- 连接真实Supabase数据库
- 使用Supabase Edge Functions实现定时任务
- 使用RLS（Row Level Security）保护数据
- 记录所有交易日志

---

## 🔐 安全机制

1. **防刷积分**：
   - 每日释放由后端定时任务执行
   - 前端只展示，不能手动触发

2. **防止超额兑换**：
   - 严格验证mining_points余额
   - 只能兑换70%
   - 最低100积分起兑

3. **防止重复购买**：
   - 最多50台矿机限制
   - 购买时扣除积分事务化

4. **数据一致性**：
   - points_balance = mining_points + transfer_points
   - 所有积分变动都记录交易日志

---

**文档版本**：v1.0  
**最后更新**：2025-01-02  
**维护者**：AI开发团队






