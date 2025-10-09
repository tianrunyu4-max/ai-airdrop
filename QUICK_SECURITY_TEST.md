# 🧪 安全功能快速测试指南

**目标**: 验证安全加固效果  
**时间**: 30分钟  
**难度**: ⭐⭐☆☆☆

---

## 📋 **测试清单**

### **1. 数据库函数测试** ⏰ 10分钟

#### **测试步骤**:

**Step 1: 执行创建脚本**
```bash
1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 supabase/functions_wallet_atomic.sql 全部内容
4. 粘贴到编辑器
5. 点击 "Run" 执行
```

**Step 2: 验证函数创建成功**
```sql
-- 在 SQL Editor 中执行
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%balance%';

-- 应该看到:
-- add_user_balance
-- deduct_user_balance
-- transfer_balance
-- add_user_points
-- deduct_user_points
-- batch_add_balance
```

**Step 3: 测试基本功能**
```sql
-- 测试增加余额
SELECT add_user_balance(
  'your-user-id'::UUID,
  10.00
);
-- 应返回新余额

-- 测试扣除余额（余额充足）
SELECT deduct_user_balance(
  'your-user-id'::UUID,
  5.00
);
-- 应返回新余额

-- 测试扣除余额（余额不足 - 应该失败）
SELECT deduct_user_balance(
  'your-user-id'::UUID,
  999999.00
);
-- 应返回错误: "余额不足"
```

---

### **2. 输入验证测试** ⏰ 10分钟

#### **在浏览器控制台测试**:

```javascript
// 打开浏览器开发者工具（F12）
// 进入 Console 标签

// 测试1: 负数金额（应该失败）
try {
  await WalletManager.add(userId, -10, 'test', '测试')
  console.error('❌ 应该拒绝负数金额')
} catch (error) {
  console.log('✅ 正确拒绝负数:', error.message)
}

// 测试2: 超大金额（应该失败）
try {
  await WalletManager.add(userId, 9999999, 'test', '测试')
  console.error('❌ 应该拒绝超大金额')
} catch (error) {
  console.log('✅ 正确拒绝超大金额:', error.message)
}

// 测试3: 无效格式（应该失败）
try {
  await WalletManager.add(userId, 'abc', 'test', '测试')
  console.error('❌ 应该拒绝非数字')
} catch (error) {
  console.log('✅ 正确拒绝非数字:', error.message)
}

// 测试4: 正常金额（应该成功）
try {
  await WalletManager.add(userId, 10, 'test', '测试')
  console.log('✅ 正常金额处理成功')
} catch (error) {
  console.error('❌ 正常金额应该成功:', error)
}
```

---

### **3. 并发安全测试** ⏰ 10分钟

#### **测试并发操作**:

```javascript
// 在浏览器控制台执行

// 测试并发扣款（10个请求同时扣款）
async function testConcurrency() {
  const userId = 'your-user-id' // 替换为真实用户ID
  
  // 先添加100U
  await WalletManager.add(userId, 100, 'test', '测试准备')
  
  // 同时发起10个扣款请求，每个扣10U
  const promises = []
  for (let i = 0; i < 10; i++) {
    promises.push(
      WalletManager.deduct(userId, 10, 'test', `并发测试${i}`)
    )
  }
  
  try {
    await Promise.all(promises)
    console.log('✅ 并发测试完成')
    
    // 检查最终余额（应该是0）
    const balance = await WalletManager.getBalance(userId)
    if (balance.u_balance === 0) {
      console.log('✅ 余额正确: 0')
    } else {
      console.error('❌ 余额错误:', balance.u_balance, '应该是0')
    }
  } catch (error) {
    console.log('部分请求失败（正常）:', error.message)
  }
}

// 执行测试
testConcurrency()
```

---

## 🎯 **手动UI测试**

### **场景1: 余额不足测试**

1. 访问 `http://localhost:3000/transfer`
2. 选择 "U互转"
3. 输入一个大额金额（超过你的余额）
4. 点击 "确认互转"
5. **预期结果**: 显示 "余额不足" 错误

### **场景2: 负数金额测试**

1. 打开浏览器开发者工具
2. 在转账金额输入框输入 `-10`
3. **预期结果**: 前端阻止或后端拒绝

### **场景3: SQL注入测试**

1. 在用户名输入框输入: `admin' OR '1'='1`
2. 尝试转账
3. **预期结果**: 输入被清理或拒绝

### **场景4: XSS测试**

1. 在描述输入框输入: `<script>alert('XSS')</script>`
2. 提交
3. **预期结果**: 脚本不执行，被转义显示

---

## 📊 **测试结果记录**

### **测试记录表**:

```
测试项目              状态    结果              备注
──────────────────────────────────────────────
数据库函数创建        ☐      ✅/❌            
余额增加              ☐      ✅/❌            
余额扣除              ☐      ✅/❌            
余额不足检查          ☐      ✅/❌            
转账功能              ☐      ✅/❌            
负数金额拒绝          ☐      ✅/❌            
超大金额拒绝          ☐      ✅/❌            
并发安全              ☐      ✅/❌            
SQL注入防护           ☐      ✅/❌            
XSS防护               ☐      ✅/❌            
```

---

## 🔍 **问题排查**

### **常见问题**:

**Q1: 数据库函数执行失败**
```
原因: 权限不足或语法错误
解决: 
1. 确认使用的是 service_role key
2. 检查 SQL 语法
3. 查看错误日志
```

**Q2: 并发测试余额不对**
```
原因: 可能是旧代码没有使用原子操作
解决:
1. 确认已更新 WalletManager.ts
2. 刷新页面重新加载代码
3. 检查是否调用了新的数据库函数
```

**Q3: 输入验证不生效**
```
原因: 前端缓存或代码未更新
解决:
1. 硬刷新页面 (Ctrl+Shift+R)
2. 清除浏览器缓存
3. 检查 validators.ts 是否正确引入
```

---

## ✅ **测试通过标准**

### **必须满足**:
```
✅ 所有数据库函数创建成功
✅ 余额操作正确无误
✅ 并发测试余额一致
✅ 输入验证有效阻止非法输入
✅ 无法执行SQL注入
✅ 无法执行XSS攻击
```

### **性能要求**:
```
✅ 单次余额操作 < 100ms
✅ 转账操作 < 200ms
✅ 并发10个请求全部成功
```

---

## 🚀 **测试完成后**

### **如果全部通过**:
```
恭喜！安全加固生效！

下一步:
1. 标记测试完成 ✅
2. 继续集成测试
3. 准备部署上线
```

### **如果有失败**:
```
不要担心！

排查步骤:
1. 记录失败的测试项
2. 查看错误信息
3. 检查代码更新
4. 重新测试
5. 如需帮助，提供错误详情
```

---

## 📝 **快速命令参考**

### **Supabase SQL Editor**:
```sql
-- 查看所有函数
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- 查看用户余额
SELECT id, username, u_balance, points_balance 
FROM users 
WHERE username = 'your-username';

-- 查看交易记录
SELECT * FROM transactions 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

**现在开始测试！** 💪

**预计完成时间**: 30分钟  
**测试通过率目标**: 100%

