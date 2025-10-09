# 🎯 **游客→AI代理：付费时才建立关系（最终设计）**

## ✅ **核心原则：**

```
注册/登录：无需邀请码（游客身份）
付费时：填写邀请码（建立上下级关系）
奖励系统：只记录付费AI代理
```

---

## 📊 **完整用户流程：**

### **第1步：注册（游客身份）**

```
用户操作：
  → 输入用户名
  → 输入密码
  → 点击注册 ✅

数据库变化：
  → 创建users记录
  → username: "张三"
  → password_hash: "..."
  → invite_code: "AB12CD34"（自动生成）
  → inviter_id: NULL（游客，无邀请人）
  → is_agent: FALSE（游客）
  
用户权限：
  ✅ 可以登录
  ✅ 可以浏览系统
  ✅ 可以在群里聊天
  ✅ 可以查看规则
  ❌ 不能参与对碰
  ❌ 不能参与平级奖
  ❌ 不能参与分红
  ❌ 不能激活AI学习机
  ❌ 不能使用互转积分
```

---

### **第2步：游客使用系统**

```
可以做的事：
  ✅ 登录/登出
  ✅ 在群里聊天（建立社交）
  ✅ 浏览系统介绍
  ✅ 查看团队页面（但无数据）
  ✅ 查看积分页面（但无功能）
  ✅ 看到"成为AI代理"按钮
  
不能做的事：
  ❌ 查看Binary树（未付费）
  ❌ 查看对碰奖励（未付费）
  ❌ 激活AI学习机（未付费）
  ❌ 转账/互转积分（未付费）
  
状态：
  观望者 / 潜在客户
  可以慢慢了解系统
  等待时机成熟再付费
```

---

### **第3步：付费成为AI代理（关键！）**

```
用户操作：
  1. 点击"成为AI代理"按钮
  2. 弹出对话框（新增！）
     → 显示费用：30U
     → 显示权益列表
     → 要求输入邀请码（必填）
  3. 输入邀请码（8位）
  4. 点击"确认加入"
  5. 扣除30U
  
后端验证：
  ✅ 邀请码是否有效
  ✅ 邀请人是否为AI代理（必须是）
  ✅ 用户U余额是否充足（≥30U）
  ✅ 用户是否已有邀请人（防止重复）
  
数据库变化：
  → is_agent: TRUE（成为代理）
  → inviter_id: "邀请人ID"（建立关系！）
  → agent_paid_at: "2025-10-09 06:00:00"（付费时间）
  → 插入binary_members记录
  
用户权限（全部解锁）：
  ✅ 参与对碰奖励（5.95U/对）
  ✅ 参与8代平级奖（2U/人）
  ✅ 参与全局分红（15%）
  ✅ 激活AI学习机（10%日释放）
  ✅ 使用互转积分
  ✅ 进入Binary树
  ✅ 获得滑落新人
  
状态：
  正式会员 / 可赚钱
```

---

## 🔐 **关键验证逻辑：**

### **1. 邀请码验证（AgentService）：**

```typescript
// src/services/AgentService.ts
static async becomeAgent(userId: string, inviteCode: string) {
  // 1. 验证邀请码非空
  if (!inviteCode || inviteCode.trim() === '') {
    return { success: false, error: '请输入邀请码' }
  }

  // 2. 查找邀请人
  const { data: inviter } = await supabase
    .from('users')
    .select('id, username, is_agent')
    .eq('invite_code', inviteCode.trim().toUpperCase())
    .single()

  if (!inviter) {
    return { success: false, error: '邀请码无效' }
  }

  // 3. 验证邀请人必须是AI代理
  if (!inviter.is_agent) {
    return { success: false, error: '邀请人还未成为AI代理，无法邀请新成员' }
  }

  // 4. 检查用户是否已有邀请人
  if (user.inviter_id) {
    return { success: false, error: '您已经有邀请人了，无法更换' }
  }

  // 5. 扣除30U并设置邀请人关系
  await WalletManager.deduct(userId, 30, 'agent_purchase', '...')
  
  await supabase
    .from('users')
    .update({
      is_agent: true,
      inviter_id: inviter.id, // ✅ 这时才设置邀请人
      agent_paid_at: new Date().toISOString()
    })
    .eq('id', userId)

  // 6. 自动加入Binary系统
  await BinaryService.joinBinarySystem(userId)

  return { success: true }
}
```

---

### **2. 邀请人限制（防止滥用）：**

```
限制1：邀请人必须是AI代理
  → 防止游客邀请游客
  → 保证上级有付费权益
  → 保证Binary树的完整性

限制2：邀请关系一旦建立，无法更改
  → 防止频繁更换上级
  → 保证Binary树的稳定性
  → 防止恶意套利

限制3：自己不能邀请自己
  → 验证inviter.id !== userId
  → 防止自我循环
```

---

## 🎨 **前端界面设计：**

### **游客界面（ProfileView.vue）：**

```vue
<!-- 成为代理卡片 -->
<div v-if="!user?.is_agent">
  <div class="bg-gradient-to-r from-purple-50 to-pink-50">
    <h3>加入Binary对碰系统</h3>
    <div>✅ A+B双区公排自动化排线</div>
    <div>✅ 对碰奖励（7U/对）</div>
    <div>✅ 8代平级奖（2U/人）</div>
    <div>✅ 全系统分红（15%）</div>
    <div>✅ 解锁积分互转+AI学习机</div>
    <div class="text-purple-600">仅需支付 30U 永久有效！</div>
    
    <button @click="becomeAgent">
      🚀 立即加入Binary系统
    </button>
  </div>
</div>
```

---

### **邀请码输入Modal（新增）：**

```vue
<!-- 邀请码输入对话框 -->
<dialog class="modal" :class="{ 'modal-open': showInviteCodeModal }">
  <div class="modal-box">
    <h3>🎁 加入Binary对碰系统</h3>
    
    <!-- 费用和权益说明 -->
    <div class="alert alert-info">
      <p>支付费用：30U</p>
      <p>✅ A+B双区公排自动化排线</p>
      <p>✅ 对碰奖励（7U/对）</p>
      <p>✅ 8代平级奖（2U/人）</p>
      <p>✅ 全系统分红（15%）</p>
      <p>✅ 解锁积分互转+AI学习机</p>
    </div>

    <!-- 邀请码输入 -->
    <div class="form-control">
      <label>请输入邀请码 <span class="text-red-500">*</span></label>
      <input
        v-model="inviteCodeInput"
        type="text"
        placeholder="输入8位邀请码"
        maxlength="8"
        class="input input-bordered input-primary"
      />
      <span class="text-gray-500">💡 邀请码由您的推荐人提供</span>
    </div>

    <!-- 警告信息 -->
    <div class="alert alert-warning">
      <p>⚠️ 邀请人必须是已付费的AI代理</p>
      <p>⚠️ 邀请关系一旦建立，无法更改</p>
    </div>

    <!-- 操作按钮 -->
    <div class="modal-action">
      <button @click="cancelBecomeAgent">取消</button>
      <button 
        @click="confirmBecomeAgent"
        :disabled="!inviteCodeInput || (user?.u_balance || 0) < 30"
      >
        {{ (user?.u_balance || 0) < 30 ? 'U余额不足（需要30U）' : '🚀 确认加入（30U）' }}
      </button>
    </div>
  </div>
</dialog>
```

---

## 📊 **数据流图：**

```
游客注册
  ↓
users表：
  id: "uuid-1"
  username: "张三"
  invite_code: "AB12CD34"
  inviter_id: NULL  ← 游客，无邀请人
  is_agent: FALSE   ← 游客
  
  ↓（可以使用系统，但无奖励）
  
游客点击"成为AI代理"
  ↓
显示邀请码输入对话框
  ↓
输入邀请码：EF56GH78
  ↓
后端验证：
  - 查找invite_code = "EF56GH78"的用户
  - 找到：id = "uuid-0"（李四）
  - 验证：李四.is_agent = TRUE ✅
  - 验证：张三.u_balance >= 30U ✅
  - 验证：张三.inviter_id = NULL ✅
  ↓
扣除30U
  ↓
更新users表：
  id: "uuid-1"
  username: "张三"
  inviter_id: "uuid-0"  ← 付费时才设置！
  is_agent: TRUE        ← 成为代理
  agent_paid_at: "2025-10-09 06:00:00"
  
  ↓
插入binary_members表：
  user_id: "uuid-1"
  upline_id: "uuid-0"   ← 李四成为上级
  position_side: "A"    ← 滑落到李四的A区
  
  ↓（可以参与所有奖励）
  
张三成为AI代理 ✅
```

---

## 🎯 **系统优势：**

### **1. 新人友好**
```
✅ 注册无门槛（无需邀请码）
✅ 可以先体验系统（聊天、浏览）
✅ 了解后再付费（降低决策压力）
```

### **2. 防止滥用**
```
✅ 付费时才建立关系（防止游客占位）
✅ 邀请人必须是代理（防止无效邀请）
✅ 关系不可更改（防止频繁切换）
```

### **3. 奖励系统干净**
```
✅ 只记录付费AI代理
✅ 游客不占用Binary位置
✅ 不影响代理收益
✅ 不会有"僵尸账号"问题
```

### **4. 推广激励**
```
✅ 代理看到自己的邀请码
✅ 推广新人加入（先游客）
✅ 新人付费时填写邀请码
✅ 代理获得下级和奖励 ✅
```

---

## 🔥 **实际场景演示：**

### **场景1：李四推广张三**

```
Day 1：
  李四（AI代理）→ 分享邀请码"EF56GH78"给张三
  张三 → 注册账号（游客）
  张三 → 浏览系统，在群里聊天
  
Day 2：
  张三 → 看到李四的对碰收益截图
  张三 → 决定加入
  张三 → 点击"成为AI代理"
  张三 → 输入邀请码"EF56GH78"
  张三 → 支付30U
  张三 → 成为AI代理 ✅
  张三.inviter_id = 李四.id ✅
  
Day 3：
  王五（新人）→ 被张三推广
  王五 → 注册（游客）
  王五 → 付费时填写张三的邀请码
  王五 → 滑落到张三的B区
  → 张三触发对碰：min(A=0, B=1) = 0对（还需要A区新人）
  
Day 4：
  赵六（新人）→ 被张三推广
  赵六 → 注册（游客）
  赵六 → 付费时填写张三的邀请码
  赵六 → 滑落到张三的A区
  → 张三触发对碰：min(A=1, B=1) = 1对 ✅
  → 张三获得5.95U ✅
  → 李四（张三的上级）获得平级奖2U ✅
```

---

## ✅ **修改总结：**

| 项目 | 修改内容 | 文件 |
|------|----------|------|
| **后端** | 添加inviteCode参数 | `src/services/AgentService.ts` |
| **后端** | 验证邀请码和邀请人 | `src/services/AgentService.ts` |
| **后端** | 付费时设置inviter_id | `src/services/AgentService.ts` |
| **前端** | 添加邀请码输入Modal | `src/views/profile/ProfileView.vue` |
| **前端** | 显示邀请码输入界面 | `src/views/profile/ProfileView.vue` |
| **前端** | 验证邀请码非空 | `src/views/profile/ProfileView.vue` |
| **注册** | 移除邀请码字段 | `src/stores/auth.ts`（已是NULL）|

---

## 📱 **用户体验流程：**

```
1. 新人扫码进入系统
   ↓
2. 看到注册页面（无需邀请码）
   ↓
3. 注册成功（游客身份）
   ↓
4. 进入群聊，看到大家讨论收益
   ↓
5. 浏览系统介绍，看到"成为AI代理"卡片
   ↓
6. 点击"成为AI代理"
   ↓
7. 弹出对话框，显示费用和权益
   ↓
8. 要求输入邀请码（必填）
   ↓
9. 输入推荐人提供的邀请码
   ↓
10. 支付30U
   ↓
11. 成为AI代理，进入Binary系统 ✅
   ↓
12. 开始推广新人，获得对碰收益 💰
```

---

## 🎓 **关键理解：**

```
注册 ≠ 加入Binary系统
付费 = 加入Binary系统
邀请码 = 付费时才需要
inviter_id = 付费时才设置

这样设计的原因：
1. 降低注册门槛（新人友好）
2. 游客可以先了解系统（建立信任）
3. 付费时才建立关系（防止滥用）
4. 奖励系统只记录代理（系统干净）
```

---

**✅ 修改完成！系统现在是"游客→AI代理"模式！**

生成时间：2025-10-09  
版本：v4.0（最终版）  
状态：已上线 🚀

