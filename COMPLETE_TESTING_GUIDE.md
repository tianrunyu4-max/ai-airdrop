# 🧪 完整测试指南

**目标**: 全面测试系统功能，确保稳定后再上线  
**预计时间**: 1-2小时  
**难度**: ⭐⭐⭐☆☆

---

## 📋 **测试清单总览**

```
阶段1: 基础功能测试 (30分钟)
├─ 用户注册和登录 ✓
├─ AI学习机购买 ✓
├─ 二元系统加入 ✓
└─ 基础数据显示 ✓

阶段2: 核心业务测试 (40分钟)
├─ 发展下线（邀请码）✓
├─ 对碰系统触发 ✓
├─ 平级奖发放 ✓
├─ 分红计算 ✓
└─ 互转和提现 ✓

阶段3: 安全功能测试 (20分钟)
├─ 余额安全 ✓
├─ 并发安全 ✓
└─ 输入验证 ✓

阶段4: 问题修复和优化 (30分钟)
└─ 修复发现的问题 ✓
```

---

## 🚀 **阶段1: 基础功能测试** ⏰ 30分钟

### **测试环境**
- URL: http://localhost:3000
- 浏览器: Chrome/Edge (打开开发者工具F12)
- 准备: 2-3个测试账号

---

### **测试1.1: 用户注册和登录** ⏰ 5分钟

#### **步骤**:
1. 访问 http://localhost:3000/register
2. 注册第一个用户（创世用户）
   - 用户名: `test_admin`
   - 密码: `123456`
   - 不需要邀请码
3. 登录成功后，查看个人中心
4. 复制邀请码（稍后使用）

#### **验证点**:
```
☐ 注册成功
☐ 自动登录
☐ 邀请码已生成
☐ 余额为0
☐ 页面显示正常
```

#### **预期结果**:
- ✅ 注册成功，自动跳转到首页
- ✅ 个人中心显示用户信息
- ✅ 邀请码格式正确（6-10位字母数字）

---

### **测试1.2: AI学习机购买** ⏰ 10分钟

#### **步骤**:
1. 访问 http://localhost:3000/points
2. 查看学习机信息
   - 基础释放率: 10%/天
   - 出局倍数: 2倍
   - 回本天数: 20天
3. 点击"购买学习机"
4. 确认购买（首次免费或7U）

#### **验证点**:
```
☐ 页面参数显示正确（10%、2倍、20天）
☐ 首次购买成功（免费或扣除7U）
☐ 学习机状态显示"运行中"
☐ 初始积分100
☐ 已释放积分0
☐ 总积分200（2倍）
```

#### **预期结果**:
- ✅ 购买成功提示
- ✅ 学习机卡片显示
- ✅ 数据正确无误

#### **测试数据准备**（需要手动添加余额）:
```sql
-- 在 Supabase SQL Editor 执行
-- 给测试用户添加100U余额用于测试
UPDATE users 
SET u_balance = 100 
WHERE username = 'test_admin';
```

---

### **测试1.3: 二元系统加入** ⏰ 10分钟

#### **步骤**:
1. 访问 http://localhost:3000/binary
2. 查看系统说明
3. 点击"加入二元系统"
4. 确认支付30U

#### **验证点**:
```
☐ 系统规则显示正确
☐ 加入成功（扣除30U）
☐ A区人数显示
☐ B区人数显示
☐ 待配对订单显示
☐ 对碰奖显示为0
```

#### **预期结果**:
- ✅ 加入成功
- ✅ 余额正确扣除
- ✅ 统计数据显示

---

### **测试1.4: 基础数据显示** ⏰ 5分钟

访问各个页面检查数据显示：

#### **团队页面** (http://localhost:3000/team)
```
☐ 邀请码显示
☐ 直推人数
☐ A/B区统计
☐ 总业绩
☐ 各项奖励统计
```

#### **收益页面** (http://localhost:3000/earnings)
```
☐ 总收益显示
☐ 对碰奖Tab
☐ 平级奖Tab
☐ 分红Tab
☐ 学习机释放Tab
```

#### **个人中心** (http://localhost:3000/profile)
```
☐ 用户信息
☐ 余额显示
☐ 邀请码
☐ 团队统计
☐ 社交媒体卡片
```

---

## 💰 **阶段2: 核心业务测试** ⏰ 40分钟

### **测试2.1: 发展下线（邀请码系统）** ⏰ 10分钟

#### **步骤**:
1. 使用第一个用户的邀请码
2. 注册第二个用户 `test_user1`
   - 输入邀请码
   - 注册成功
3. 给 `test_user1` 添加余额（SQL）
4. `test_user1` 加入二元系统（30U）
5. 回到 `test_admin` 查看团队数据

#### **SQL辅助脚本**:
```sql
-- 给 test_user1 添加余额
UPDATE users 
SET u_balance = 100 
WHERE username = 'test_user1';
```

#### **验证点**:
```
☐ test_user1 注册成功
☐ 邀请关系建立
☐ test_admin 直推人数+1
☐ test_user1 加入二元系统
☐ test_admin 的A或B区人数+1
```

#### **预期结果**:
- ✅ 邀请关系正确
- ✅ 团队统计更新
- ✅ 二元系统自动排线

---

### **测试2.2: 对碰系统触发** ⏰ 15分钟

#### **前置条件**:
- test_admin A区有1人，B区有0人
- 需要在B区也加入1人才能触发对碰

#### **步骤**:
1. 注册第三个用户 `test_user2`（使用邀请码）
2. 给 `test_user2` 添加余额
3. `test_user2` 加入二元系统
4. 系统应该自动将 `test_user2` 排到B区
5. 触发1:1对碰
6. 查看 `test_admin` 的对碰奖

#### **SQL辅助脚本**:
```sql
-- 给 test_user2 添加余额
UPDATE users 
SET u_balance = 100 
WHERE username = 'test_user2';

-- 查看 test_admin 的对碰奖
SELECT 
  u.username,
  bm.a_side_count,
  bm.b_side_count,
  bm.total_pairing_bonus,
  bm.total_level_bonus
FROM binary_members bm
JOIN users u ON u.id = bm.user_id
WHERE u.username = 'test_admin';
```

#### **验证点**:
```
☐ test_user2 自动排到B区（弱区优先）
☐ A区1人，B区1人（1:1）
☐ 对碰奖触发
☐ test_admin 获得对碰奖（7U * 85% = 5.95U）
☐ 15%进入分红池（7U * 15% = 1.05U）
☐ 余额正确增加
```

#### **预期结果**:
- ✅ 自动排线正确
- ✅ 对碰奖计算正确
- ✅ 分红池增加

---

### **测试2.3: 平级奖发放** ⏰ 5分钟

#### **前置条件**:
- test_admin 直推≥2人（解锁平级奖）
- 下线触发对碰奖

#### **步骤**:
1. 让 `test_user1` 也发展2个下线
2. 这2个下线加入二元系统
3. 触发对碰奖
4. 查看 `test_admin` 的平级奖

#### **验证点**:
```
☐ test_admin 直推≥2人
☐ 下线触发对碰奖
☐ test_admin 获得平级奖（2U）
☐ 平级奖正确累加
```

#### **注意**:
如果测试账号少，可以通过SQL模拟：
```sql
-- 模拟触发平级奖
UPDATE binary_members 
SET total_level_bonus = total_level_bonus + 2.00
WHERE user_id = (SELECT id FROM users WHERE username = 'test_admin');

-- 同时增加余额
UPDATE users
SET u_balance = u_balance + 2.00
WHERE username = 'test_admin';
```

---

### **测试2.4: 分红计算** ⏰ 5分钟

#### **步骤**:
1. 访问管理后台 http://localhost:3000/admin/system
2. 查看分红池余额
3. 手动触发分红结算
4. 查看分红记录

#### **前置条件**:
```sql
-- 确保 test_admin 直推≥10人（才能参与分红）
UPDATE users 
SET direct_referral_count = 10 
WHERE username = 'test_admin';

-- 确保分红池有余额
UPDATE dividend_pool 
SET balance = 100 
WHERE id = '00000000-0000-0000-0000-000000000000';
```

#### **验证点**:
```
☐ 分红池余额显示正确
☐ 符合条件用户数显示
☐ 点击"执行分红结算"
☐ 输入确认码"DIVIDEND"
☐ 执行成功
☐ 用户余额增加
☐ 分红记录显示在收益页面
```

---

### **测试2.5: 互转和提现** ⏰ 5分钟

#### **互转测试**:
1. 访问 http://localhost:3000/transfer
2. 选择"U互转"
3. 输入接收方用户名（test_user1）
4. 输入金额10
5. 确认互转

#### **验证点**:
```
☐ 发送方余额减少10
☐ 接收方余额增加10
☐ 交易记录显示
☐ 余额不足时拒绝
```

#### **提现测试**:
1. 访问 http://localhost:3000/profile
2. 点击"申请提现"
3. 输入钱包地址
4. 输入金额
5. 提交申请
6. 管理后台查看提现记录

---

## 🔒 **阶段3: 安全功能测试** ⏰ 20分钟

### **测试3.1: 余额安全** ⏰ 5分钟

#### **测试场景**:

**场景1: 余额不足拒绝**
```javascript
// 在浏览器控制台执行
// 尝试转账超过余额的金额
// 应该被拒绝
```

**场景2: 负数金额拒绝**
```javascript
// 尝试输入负数金额
// 应该被前端验证拒绝
```

**场景3: 超大金额拒绝**
```javascript
// 尝试输入999999999
// 应该被验证拒绝（超过最大限制1,000,000）
```

#### **验证点**:
```
☐ 余额不足时交易失败
☐ 负数金额被拒绝
☐ 超大金额被拒绝
☐ 错误提示清晰
```

---

### **测试3.2: 并发安全** ⏰ 10分钟

#### **测试方法**:
在浏览器控制台执行并发测试：

```javascript
// 并发测试脚本
async function testConcurrency() {
  const userId = 'your-user-id' // 替换为真实ID
  
  console.log('开始并发测试...')
  
  // 记录初始余额
  const initialBalance = await WalletManager.getBalance(userId)
  console.log('初始余额:', initialBalance.u_balance)
  
  // 同时发起10个扣款请求
  const promises = []
  for (let i = 0; i < 10; i++) {
    promises.push(
      WalletManager.deduct(userId, 1, 'test', `并发测试${i}`)
        .catch(err => ({ error: err.message, index: i }))
    )
  }
  
  const results = await Promise.allSettled(promises)
  
  // 检查最终余额
  const finalBalance = await WalletManager.getBalance(userId)
  console.log('最终余额:', finalBalance.u_balance)
  console.log('应该减少:', initialBalance.u_balance - 10)
  console.log('实际减少:', initialBalance.u_balance - finalBalance.u_balance)
  
  // 验证
  if (finalBalance.u_balance === initialBalance.u_balance - 10) {
    console.log('✅ 并发测试通过！余额计算正确')
  } else {
    console.error('❌ 并发测试失败！余额不一致')
  }
  
  return results
}

// 执行测试
testConcurrency()
```

#### **验证点**:
```
☐ 10个请求都成功
☐ 余额正确减少10（不是其他数字）
☐ 没有并发问题
☐ 事务正确处理
```

---

### **测试3.3: 输入验证** ⏰ 5分钟

#### **SQL注入测试**:
```
输入: admin' OR '1'='1
预期: 被清理或拒绝
```

#### **XSS测试**:
```
输入: <script>alert('XSS')</script>
预期: 被转义，不执行
```

#### **验证点**:
```
☐ SQL注入被防护
☐ XSS攻击被防护
☐ 特殊字符被正确处理
☐ 输入长度被限制
```

---

## 📊 **测试结果记录**

### **测试报告模板**:

```markdown
# 测试报告

**测试日期**: 2025-10-07
**测试人员**: [您的名字]
**测试环境**: localhost:3000

## 测试结果汇总

| 测试项目 | 状态 | 备注 |
|---------|------|------|
| 用户注册登录 | ✅/❌ | |
| AI学习机购买 | ✅/❌ | |
| 二元系统加入 | ✅/❌ | |
| 邀请码系统 | ✅/❌ | |
| 对碰奖触发 | ✅/❌ | |
| 平级奖发放 | ✅/❌ | |
| 分红计算 | ✅/❌ | |
| 互转功能 | ✅/❌ | |
| 提现功能 | ✅/❌ | |
| 余额安全 | ✅/❌ | |
| 并发安全 | ✅/❌ | |
| 输入验证 | ✅/❌ | |

## 发现的问题

1. [问题描述]
   - 重现步骤:
   - 预期结果:
   - 实际结果:
   - 优先级: 高/中/低

## 建议优化

1. [优化建议]

## 总体评价

- 功能完整度: ___%
- 稳定性: ___%
- 用户体验: ___%
- 安全性: ___%

## 是否可以上线

☐ 可以上线
☐ 需要修复问题后上线
☐ 不建议上线

```

---

## 🔧 **测试辅助脚本**

### **快速创建测试用户**:
```sql
-- 创建3个测试用户
INSERT INTO users (username, password, is_agent, u_balance, invite_code)
VALUES 
  ('test_admin', 'hashed_password', true, 100, 'ADMIN001'),
  ('test_user1', 'hashed_password', true, 100, 'USER0001'),
  ('test_user2', 'hashed_password', true, 100, 'USER0002')
ON CONFLICT (username) DO UPDATE 
SET u_balance = EXCLUDED.u_balance;
```

### **快速查看统计**:
```sql
-- 查看所有用户余额
SELECT username, u_balance, points_balance, direct_referral_count
FROM users
ORDER BY created_at DESC;

-- 查看二元系统统计
SELECT 
  u.username,
  bm.a_side_count,
  bm.b_side_count,
  bm.total_pairing_bonus,
  bm.total_level_bonus
FROM binary_members bm
JOIN users u ON u.id = bm.user_id;

-- 查看分红池
SELECT * FROM dividend_pool;

-- 查看学习机
SELECT 
  u.username,
  mm.initial_points,
  mm.released_points,
  mm.is_active
FROM mining_machines mm
JOIN users u ON u.id = mm.user_id;
```

---

## ✅ **测试完成后的检查清单**

```
☐ 所有核心功能测试通过
☐ 没有发现严重bug
☐ 安全测试通过
☐ 性能可接受
☐ 用户体验良好
☐ 准备好测试报告
☐ 问题已记录
☐ 优化建议已列出
```

---

## 🎯 **测试通过标准**

### **必须满足**:
- ✅ 核心功能100%正常
- ✅ 没有严重bug
- ✅ 安全测试通过
- ✅ 余额计算准确

### **建议满足**:
- ✅ 性能良好
- ✅ 用户体验好
- ✅ 错误提示清晰

---

## 🚀 **测试通过后的下一步**

1. **部署定时任务** (20分钟)
2. **生产环境配置** (30分钟)
3. **最终上线检查** (10分钟)
4. **正式上线！** 🎉

---

**准备好开始测试了吗？** 💪

需要我帮您：
- A. 准备测试数据（SQL脚本）
- B. 开始逐步测试
- C. 创建快速测试工具

