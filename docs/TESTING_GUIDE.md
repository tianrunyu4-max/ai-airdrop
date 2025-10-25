# 🧪 测试指南 - 重构后功能验证

## 🎯 测试目标

验证4个重构后的模块是否正常工作：
1. ✅ MiningService - 矿机系统
2. ✅ ProfileView - 我的页面
3. ✅ TransferView - 转账功能
4. ✅ WithdrawalsView - 提现管理

---

## 🚀 启动项目

```bash
npm run dev
```

访问：`http://localhost:5173`

---

## 📋 测试清单

### 测试1：ProfileView - 我的页面 ⭐⭐⭐⭐⭐

**测试路径**：`/profile`

**测试步骤**：
1. 登录后进入"我的"页面
2. 检查是否显示用户信息
3. 检查余额显示（U余额、积分）
4. 检查团队统计数据

**预期结果**：
- ✅ 用户名、邀请码正常显示
- ✅ 余额数据自动加载
- ✅ 团队统计数据显示（使用UserService.getTeamStats）
- ✅ 不再显示"TODO"

**关键改进**：
```typescript
// 使用重构后的Service
const result = await UserService.getTeamStats(user.value.id)
// 自动加载团队数据，不再是TODO
```

---

### 测试2：SubscriptionView - 订阅代理 ⭐⭐⭐⭐⭐

**测试路径**：`/subscription`

**测试步骤**：
1. 确保有足够的U余额（≥30U）
2. 点击"成为代理"按钮
3. 确认支付
4. 检查是否生成邀请码

**预期结果**：
- ✅ 余额不足时显示错误提示
- ✅ 订阅成功后自动扣除30U
- ✅ 自动生成8位邀请码
- ✅ 自动记录交易流水
- ✅ 显示成功提示

**关键改进**：
```typescript
// 一行代码完成所有操作
const result = await UserService.subscribeAgent(user.value.id)
// 自动验证+扣款+生成邀请码+流水
```

**验证流水记录**：
- 进入"交易记录"页面
- 查看是否有"订阅代理"的扣款记录
- 金额应该是 -30U

---

### 测试3：MiningService - 矿机系统 ⭐⭐⭐⭐⭐

**测试路径**：矿机相关功能

#### 3.1 购买矿机

**测试步骤**：
1. 确保有足够的积分（100/1000/5000）
2. 选择矿机类型
3. 点击购买

**预期结果**：
- ✅ 积分不足时显示错误
- ✅ 购买成功后自动扣除积分
- ✅ 自动记录交易流水
- ✅ 显示购买成功提示

**关键改进**：
```typescript
const result = await MiningService.purchaseMachine(userId, 'type1')
// 自动验证积分+扣款+流水+配置管理
```

**验证流水记录**：
- 查看交易记录
- 应该有"购买一型矿机"的记录
- 金额：-100积分

#### 3.2 积分兑换U

**测试步骤**：
1. 输入要兑换的积分数量
2. 点击兑换
3. 确认操作

**预期结果**：
- ✅ 扣除积分
- ✅ 增加U余额（70%）
- ✅ 返还积分（30%）
- ✅ 3条流水记录

**关键改进**：
```typescript
const result = await MiningService.convertPointsToU(userId, 100)
// 返回：{ receivedU: 7, returnedPoints: 30 }
// 自动记录3条流水：扣积分、加U、返积分
```

**验证流水记录**：
- 应该有3条记录：
  1. 扣除100积分
  2. 增加7U
  3. 返还30积分

---

### 测试4：TransferView - 转账功能 ⭐⭐⭐⭐⭐

**测试路径**：`/transfer`

#### 4.1 验证用户名

**测试步骤**：
1. 输入接收方用户名
2. 失去焦点（blur）

**预期结果**：
- ✅ 用户存在：显示"✓ 用户存在"
- ✅ 用户不存在：显示"用户不存在"
- ✅ 自己的用户名：显示"不能转账给自己"

**关键改进**：
```typescript
const result = await UserService.findByUsername(receiverUsername.value)
// 使用UserService自动查找用户
```

#### 4.2 U转账

**测试步骤**：
1. 选择"U余额"
2. 输入有效的接收方用户名
3. 输入转账金额
4. 点击"确认转账"

**预期结果**：
- ✅ 余额不足时显示错误
- ✅ 转账成功后自动扣除U余额
- ✅ 自动记录双向流水（转出+转入）
- ✅ 显示成功提示
- ✅ 自动切换到历史记录

**关键改进**：
```typescript
await TransactionService.transferU({
  fromUserId, toUserId, amount, description
})
// 自动验证+双向流水+回滚
```

**验证流水记录**：
- 发送方：应该有"转出U"记录
- 接收方：应该有"收到U"记录
- 金额准确

#### 4.3 积分转账

**测试步骤**：
1. 选择"互转积分"
2. 输入接收方和金额
3. 点击"确认转账"

**预期结果**：
- ✅ 积分不足时显示错误
- ✅ 转账成功后自动扣除积分
- ✅ 自动记录双向流水
- ✅ 显示成功提示

**关键改进**：
```typescript
await TransactionService.transferPoints({
  fromUserId, toUserId, amount, description
})
// 自动验证+双向流水+回滚
```

#### 4.4 转账历史

**测试步骤**：
1. 切换到"记录"标签
2. 查看转账历史

**预期结果**：
- ✅ 自动加载转账记录
- ✅ 显示转出和转入记录
- ✅ 金额和时间准确
- ✅ 余额变化正确

**关键改进**：
```typescript
const result = await TransactionService.getUserTransactions(userId, 50)
// 自动加载所有交易记录
```

---

### 测试5：WithdrawalsView - 提现管理 ⭐⭐⭐⭐⭐

**测试路径**：`/admin/withdrawals`（需要管理员权限）

#### 5.1 查看提现列表

**测试步骤**：
1. 登录管理员账号
2. 进入提现管理页面
3. 查看提现列表

**预期结果**：
- ✅ 自动加载提现申请
- ✅ 显示状态、金额、钱包地址
- ✅ 可以按状态筛选

**关键改进**：
```typescript
const result = await WithdrawalService.getAllWithdrawals(status, pageSize, offset)
// 自动加载所有提现记录
```

#### 5.2 审核通过

**测试步骤**：
1. 选择一个"待审核"的提现
2. 点击"通过"
3. 填写备注（可选）
4. 确认通过

**预期结果**：
- ✅ 状态更新为"已通过"
- ✅ 显示成功提示
- ✅ 列表自动刷新

**关键改进**：
```typescript
await WithdrawalService.reviewWithdrawal(withdrawalId, true, note)
// 自动更新状态
```

#### 5.3 审核拒绝（自动退款）

**测试步骤**：
1. 选择一个"待审核"的提现
2. 点击"拒绝"
3. 填写拒绝原因（必填）
4. 确认拒绝

**预期结果**：
- ✅ 状态更新为"已拒绝"
- ✅ **自动退还金额到用户余额**
- ✅ 记录退款流水
- ✅ 显示"已拒绝并自动退还金额"

**关键改进**：
```typescript
await WithdrawalService.reviewWithdrawal(withdrawalId, false, note)
// 自动拒绝+自动退款+流水
```

**验证退款**：
- 查看该用户的余额
- 应该增加了提现金额
- 查看交易记录，应该有"提现退款"记录

---

## 🎯 核心测试点

### 1. 自动验证
- [ ] 余额不足时是否阻止操作
- [ ] 积分不足时是否阻止操作
- [ ] 用户不存在时是否提示

### 2. 自动流水
- [ ] 每次操作是否都有流水记录
- [ ] 流水金额是否准确
- [ ] 流水描述是否清晰

### 3. 自动回滚
- [ ] 操作失败时是否回滚余额
- [ ] 提现拒绝时是否自动退款

### 4. 配置管理
- [ ] 矿机价格是否从Config读取
- [ ] 积分兑换比例是否正确

---

## 🐛 常见问题排查

### 问题1：用户数据未加载

**症状**：ProfileView显示TODO或空白

**排查**：
1. 打开浏览器控制台
2. 查看是否有错误
3. 检查`UserService.getTeamStats`是否调用

**解决**：
```typescript
// 确保onMounted中调用了loadTeamStats
onMounted(() => {
  loadTeamStats()
})
```

---

### 问题2：转账失败

**症状**：点击转账后报错

**排查**：
1. 检查余额是否充足
2. 检查接收方用户名是否正确
3. 打开控制台查看错误详情

**可能原因**：
- UserService.findByUsername返回空
- TransactionService.transferU失败

---

### 问题3：流水记录缺失

**症状**：操作成功但没有流水

**排查**：
1. 进入交易记录页面
2. 刷新页面
3. 检查TransactionService.getUserTransactions

**解决**：
```typescript
// 确保WalletManager正确记录流水
await TransactionLogger.log({ ... })
```

---

### 问题4：提现退款未生效

**症状**：拒绝提现后用户余额未增加

**排查**：
1. 检查WithdrawalService.reviewWithdrawal
2. 查看用户余额变化
3. 查看交易记录

**解决**：
```typescript
// 确保拒绝时调用WalletManager.add
if (!approved) {
  await WalletManager.add(userId, amount, 'refund', ...)
}
```

---

## 📊 测试结果记录

### 测试报告模板

```
测试时间：2025-10-06
测试人员：___________

功能测试：
[ ] ProfileView - 团队统计加载
[ ] SubscriptionView - 订阅代理
[ ] MiningService - 购买矿机
[ ] MiningService - 积分兑换
[ ] TransferView - U转账
[ ] TransferView - 积分转账
[ ] WithdrawalsView - 审核通过
[ ] WithdrawalsView - 审核拒绝（退款）

流水验证：
[ ] 所有操作都有流水记录
[ ] 流水金额准确
[ ] 流水描述清晰

性能测试：
[ ] 页面加载速度 < 2秒
[ ] 操作响应速度 < 1秒
[ ] 无内存泄漏

Bug发现：
1. ___________
2. ___________
3. ___________

总体评价：
⭐⭐⭐⭐⭐
```

---

## 🎉 测试通过标准

### ✅ 完全通过
- 所有功能正常工作
- 所有流水记录正确
- 无任何错误

### ⚠️ 基本通过
- 核心功能正常
- 有小问题但不影响使用

### ❌ 未通过
- 核心功能异常
- 有严重Bug

---

## 🚀 快速测试脚本

### 测试场景1：完整流程
```
1. 注册/登录
2. 订阅代理（30U）→ 检查流水
3. 购买矿机（100积分）→ 检查流水
4. 积分兑换（100积分）→ 检查3条流水
5. U转账（10U）→ 检查双向流水
6. 积分转账（50积分）→ 检查双向流水
```

### 测试场景2：错误处理
```
1. 余额不足时订阅代理 → 应显示错误
2. 积分不足时购买矿机 → 应显示错误
3. 转账给不存在的用户 → 应显示错误
4. 转账给自己 → 应显示错误
```

### 测试场景3：管理员功能
```
1. 创建提现申请
2. 管理员审核通过 → 检查状态
3. 管理员审核拒绝 → 检查退款
```

---

**准备好测试了吗？** 🧪

打开浏览器：`http://localhost:5173`

按照上面的测试清单逐一验证！💪







































