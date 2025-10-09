# 📝 邀请码系统完整指南

## 🎯 邀请码设计概述

### 核心逻辑
1. **注册时不生成邀请码** - 新用户注册时 `invite_code` 为 `null`
2. **成为代理后自动生成** - 支付30U后自动生成8位唯一邀请码
3. **一键复制分享** - 个人中心可复制邀请码和邀请链接

---

## 🔐 邀请码规则

### 格式要求
- **长度**: 8位字符
- **字符集**: 大写字母(A-Z) + 数字(0-9)
- **唯一性**: 数据库强制唯一约束
- **示例**: `ABC12345`, `TEST2024`, `INVITE99`

### 生成时机
```
用户注册 → invite_code = NULL
    ↓
支付30U成为代理 → 触发自动生成
    ↓
invite_code = "XXXXXXXX" (8位随机码)
```

---

## 🧪 测试流程

### 步骤1: 注册新用户（需要邀请码）

1. 访问注册页面
2. 输入测试邀请码（开发阶段接受任意8位码）：
   ```
   TEST2024
   ABCD1234
   12345678
   ```
3. 输入用户名和密码
4. 注册成功后自动登录到群聊

**注意**: 测试模式下，新用户会获得 **50U初始余额**

### 步骤2: 成为代理

1. 点击底部导航 → **AI订阅**
2. 查看当前余额（应该是50U）
3. 查看代理权益：
   - 见点奖：8U/人
   - 平级见点奖：3U×5层
   - 直推分红：7U/单
   - 复购奖励
4. 点击 **"成为代理"** 按钮
5. 确认支付30U
6. 等待1.5秒（模拟API）
7. 成功后会弹出提示，显示您的专属邀请码

### 步骤3: 复制并分享邀请码

1. 点击底部导航 → **我的**
2. 查看 **"我的邀请码"** 卡片
3. 点击 **"复制"** 按钮复制邀请码
4. 点击邀请链接旁的复制按钮复制完整链接

---

## 📊 数据库设计

### users表字段
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  invite_code VARCHAR(20) UNIQUE,  -- ⚠️ 可空，付费后才生成
  inviter_id UUID REFERENCES users(id),
  is_agent BOOLEAN DEFAULT FALSE,
  agent_paid_at TIMESTAMP,
  u_balance DECIMAL(10,2) DEFAULT 0,
  -- ...其他字段
);
```

### 关键约束
- `invite_code` 可以为 NULL（未成为代理）
- `invite_code` 必须唯一（UNIQUE约束）
- `inviter_id` 外键关联到上级用户

---

## 🔄 成为代理流程（数据库层面）

### 触发器逻辑
```sql
-- 当用户 is_agent 从 FALSE 变为 TRUE 时
-- 自动生成唯一的8位邀请码
CREATE TRIGGER trigger_auto_generate_invite_code
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invite_code();
```

### 存储过程
```sql
-- 成为代理的完整流程
CREATE FUNCTION become_agent(
  p_user_id UUID,
  p_payment_amount DECIMAL
) RETURNS JSON
```

**流程**:
1. 验证支付金额（必须≥30U）
2. 检查用户余额是否充足
3. 扣除30U余额
4. 设置 `is_agent = TRUE`
5. 触发器自动生成邀请码
6. 记录交易日志
7. 返回新邀请码

---

## 🎨 前端实现

### 1. 个人中心显示逻辑

```vue
<!-- 已成为代理 - 显示邀请码 -->
<div v-if="user?.is_agent && user?.invite_code">
  <span>{{ user.invite_code }}</span>
  <CopyButton :text="user.invite_code" />
</div>

<!-- 未成为代理 - 显示提示 -->
<div v-else>
  <span>成为代理后才能获得邀请码</span>
  <router-link to="/subscription">成为代理</router-link>
</div>
```

### 2. 订阅页面支付逻辑

```typescript
const handleBecomeAgent = async () => {
  // 1. 检查余额
  if (user.value.u_balance < 30) return
  
  // 2. 调用API
  const result = await supabase.rpc('become_agent', {
    p_user_id: user.value.id,
    p_payment_amount: 30
  })
  
  // 3. 更新本地状态
  user.value.is_agent = true
  user.value.invite_code = result.invite_code
  user.value.u_balance -= 30
}
```

### 3. 复制按钮组件

```vue
<CopyButton :text="inviteCode" />
```

**功能**:
- 点击复制到剪贴板
- 显示 ✓ 已复制提示
- 2秒后恢复为"复制"按钮
- 支持降级方案（旧浏览器）

---

## 🔗 邀请链接格式

### URL结构
```
http://localhost:3000/register?invite=ABC12345
```

### 自动填充
- 用户点击邀请链接
- 注册页面自动填充邀请码
- 用户只需输入用户名和密码

### 实现代码
```typescript
// RegisterView.vue
onMounted(() => {
  const inviteFromUrl = route.query.invite as string
  if (inviteFromUrl) {
    form.inviteCode = inviteFromUrl  // 自动填充
  }
})
```

---

## 📋 测试清单

### ✅ 功能测试
- [ ] 注册时必须输入邀请码
- [ ] 注册成功后 invite_code 为 null
- [ ] 个人中心显示"成为代理后才能获得邀请码"
- [ ] 成为代理按钮在余额<30U时禁用
- [ ] 支付30U成功后生成邀请码
- [ ] 邀请码为8位大写字母+数字
- [ ] 可以一键复制邀请码
- [ ] 可以一键复制邀请链接
- [ ] 通过邀请链接注册时自动填充邀请码
- [ ] 成为代理后订阅页面显示"您已经是代理了"

### ✅ 边界测试
- [ ] 余额不足时无法成为代理
- [ ] 已是代理的用户不能重复支付
- [ ] 邀请码唯一性验证
- [ ] 复制功能在不支持clipboard API的浏览器上降级

---

## 🚀 生产环境部署清单

### Supabase配置
1. 运行迁移脚本：
   ```bash
   supabase migration up
   ```
2. 验证触发器已创建：
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_generate_invite_code';
   ```
3. 测试存储过程：
   ```sql
   SELECT become_agent('user_id', 30);
   ```

### 前端配置
1. 设置环境变量：
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
2. 移除开发模式代码（模拟登录等）
3. 启用真实API调用

### 安全检查
- [ ] Row Level Security (RLS) 已启用
- [ ] invite_code 只能查询，不能直接修改
- [ ] become_agent 函数有适当的权限控制
- [ ] 交易记录不可篡改

---

## 💡 使用场景示例

### 场景1: 用户A邀请用户B
```
1. 用户A成为代理 → 获得邀请码 "ABC12345"
2. 用户A分享链接给用户B: /register?invite=ABC12345
3. 用户B点击链接 → 邀请码自动填充
4. 用户B完成注册 → inviter_id = 用户A的ID
5. 用户B成为代理 → 用户A获得见点奖8U
```

### 场景2: 推广链传播
```
用户A (ABC12345)
  └─ 邀请 → 用户B (获得邀请码: BCD23456)
       └─ 邀请 → 用户C (获得邀请码: CDE34567)
            └─ 邀请 → 用户D
```

---

## 🎁 奖励系统关联

### 见点奖（8U）
- 触发时机：网体内任何人成为代理
- 奖励对象：该网体的根节点用户

### 平级见点奖（3U×5层）
- 触发时机：下级网体有人成为代理
- 奖励对象：上级5层中有≥5直推的用户

### 直推分红（7U）
- 前提条件：≥5个直推 + 都是代理
- 分红时间：每周一、三、五、日
- 分红来源：直推用户当天的新订单

---

## 📞 常见问题

### Q: 注册时没有邀请码怎么办？
A: 必须有邀请码才能注册，联系现有用户获取。开发测试时可以使用任意8位码。

### Q: 成为代理后能否修改邀请码？
A: 不能，邀请码一旦生成不可修改，确保推广关系稳定。

### Q: 邀请码会重复吗？
A: 不会，数据库有唯一约束+生成算法保证唯一性。

### Q: 余额不足如何充值？
A: 联系客服或邀请人通过"互转"功能转账（场外交易）。

### Q: 可以退出代理身份吗？
A: 不能，代理费不可退还，但可以一直享受推广收益。

---

## 🎉 完成！

邀请码系统已完整设计并实现，现在您可以：
1. 测试注册流程
2. 体验成为代理
3. 分享邀请码给其他人
4. 构建您的推广网络

**祝您推广顺利，收益满满！** 🚀






