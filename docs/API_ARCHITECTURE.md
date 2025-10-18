# API架构设计文档

## 📋 项目概述
**AI科技 - 智能空投平台**
- 前端：Vue 3 + TypeScript + Vite + Pinia
- 后端：Supabase (PostgreSQL + Auth + Realtime + Storage)
- 部署：开发模式(localStorage) + 生产模式(Supabase)

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    前端层 (Vue 3)                    │
├─────────────────────────────────────────────────────┤
│  Views (页面)  │  Components (组件)  │  Stores (状态) │
├─────────────────────────────────────────────────────┤
│              Services (业务逻辑层)                    │
├─────────────────────────────────────────────────────┤
│            Supabase Client (API层)                   │
├─────────────────────────────────────────────────────┤
│                  Supabase 后端                        │
│  ┌──────────┬──────────┬──────────┬──────────┐      │
│  │ Database │   Auth   │ Realtime │ Storage  │      │
│  └──────────┴──────────┴──────────┴──────────┘      │
└─────────────────────────────────────────────────────┘
```

---

## 📁 前端模块结构

### 1. **认证模块** (`src/stores/auth.ts`)
```typescript
// 核心功能
- register(username, password)      // 注册
- login(username, password)         // 登录
- logout()                          // 登出
- initialize()                      // 初始化认证状态
- fetchUserProfile(userId)          // 获取用户信息

// 状态
- user: User | null                 // 当前用户
- isAuthenticated: boolean          // 是否已登录
- loading: boolean                  // 加载状态
```

### 2. **聊天模块** (`src/views/chat/ChatView.vue`)
```typescript
// 核心功能
- loadMessages(groupId)             // 加载消息
- sendMessage()                     // 发送消息
- handleImageSelect()               // 选择图片
- switchGroup(group)                // 切换群组
- subscribeToMessages()             // 订阅实时消息

// 组件
- GroupSelector.vue                 // 群组选择器
```

### 3. **积分模块** (`src/views/points/PointsView.vue`)
```typescript
// 核心功能
- loadMyMachines()                  // 加载我的矿机
- purchaseMachine(type)             // 购买矿机
- convertPoints()                   // 兑换积分

// Service
- MiningService.ts                  // 矿机业务逻辑
  - purchaseMachine()
  - getMachinesByUser()
  - calculateDailyRelease()
```

### 4. **转账模块** (`src/views/transfer/TransferView.vue`)
```typescript
// 核心功能
- transferU()                       // 转账U
- transferPoints()                  // 转账积分
- validateAddress()                 // 验证地址
```

### 5. **收益模块** (`src/views/earnings/EarningsView.vue`)
```typescript
// 核心功能
- loadEarnings()                    // 加载收益记录
- loadPairingBonuses()              // 对碰奖
- loadLevelBonuses()                // 平级奖
- loadDividends()                   // 分红
```

### 6. **团队模块** (`src/views/team/TeamView.vue`)
```typescript
// 核心功能
- loadTeamData()                    // 加载团队数据
- loadNetworkSales()                // A/B区业绩
- loadDirectReferrals()             // 直推列表
```

### 7. **管理后台** (`src/views/admin/`)
```typescript
// 页面
- DashboardView.vue                 // 仪表盘
- UsersView.vue                     // 用户管理
- WithdrawalsView.vue               // 提现审核
- AirdropsView.vue                  // 空投管理
- GroupManagement.vue               // 群聊管理
- SystemView.vue                    // 系统配置
```

---

## 🗄️ 数据库表结构

### 核心表
1. **users** - 用户表
2. **transactions** - 交易记录
3. **mining_machines** - 矿机表
4. **daily_releases** - 每日释放记录
5. **withdrawals** - 提现申请
6. **chat_groups** - 群组表
7. **chat_categories** - 群聊分类
8. **messages** - 消息表
9. **airdrops** - 空投信息
10. **system_config** - 系统配置

### 双区系统表
11. **pairing_records** - 对碰记录
12. **level_bonus_records** - 平级奖记录
13. **dividend_records** - 分红记录
14. **reinvestment_records** - 复投记录

---

## 🔌 API接口设计

### 1. 认证接口
```typescript
// 开发模式：localStorage
// 生产模式：Supabase Auth + public.users

POST /auth/register
  Body: { username, password }
  Response: { success, user, invite_code }

POST /auth/login
  Body: { username, password }
  Response: { success, user, token }

GET /auth/profile/:userId
  Response: { user }
```

### 2. 用户接口
```typescript
GET /users/:id
  Response: { user }

PUT /users/:id
  Body: { ...updates }
  Response: { user }

GET /users/:id/balance
  Response: { u_balance, points_balance, mining_points }
```

### 3. 矿机接口
```typescript
POST /mining/purchase
  Body: { user_id, machine_type, points }
  Response: { machine }

GET /mining/my-machines/:userId
  Response: { machines[] }

GET /mining/daily-releases/:userId
  Response: { releases[] }
```

### 4. 转账接口
```typescript
POST /transfer/u
  Body: { from_user_id, to_user_id, amount }
  Response: { transaction }

POST /transfer/points
  Body: { from_user_id, to_user_id, amount }
  Response: { transaction }
```

### 5. 提现接口
```typescript
POST /withdrawals/create
  Body: { user_id, amount, wallet_address }
  Response: { withdrawal }

GET /withdrawals/:userId
  Response: { withdrawals[] }

PUT /withdrawals/:id/approve
  Body: { admin_note }
  Response: { withdrawal }
```

### 6. 聊天接口
```typescript
GET /chat/groups
  Response: { groups[] }

GET /chat/messages/:groupId
  Response: { messages[] }

POST /chat/messages
  Body: { group_id, user_id, content, type }
  Response: { message }

POST /chat/upload-image
  Body: FormData
  Response: { image_url }
```

### 7. 双区系统接口
```typescript
GET /network/sales/:userId
  Response: { a_side_sales, b_side_sales }

GET /network/pairing-records/:userId
  Response: { records[] }

GET /network/level-bonus/:userId
  Response: { records[] }

POST /network/reinvest
  Body: { user_id }
  Response: { success }
```

### 8. 管理后台接口
```typescript
GET /admin/dashboard
  Response: { stats }

GET /admin/users
  Query: { page, limit, search }
  Response: { users[], total }

PUT /admin/users/:id
  Body: { ...updates }
  Response: { user }

GET /admin/withdrawals
  Query: { status, page, limit }
  Response: { withdrawals[], total }
```

---

## 🔄 实时功能 (Supabase Realtime)

### 1. 消息实时推送
```typescript
supabase
  .channel(`messages:${groupId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `chat_group_id=eq.${groupId}`
  }, (payload) => {
    // 新消息处理
  })
  .subscribe()
```

### 2. 余额实时更新
```typescript
supabase
  .channel(`user:${userId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'users',
    filter: `id=eq.${userId}`
  }, (payload) => {
    // 余额更新
  })
  .subscribe()
```

---

## 🎯 下一步开发重点

### 阶段1：核心功能完善 ✅
- [x] 用户认证
- [x] 聊天系统
- [x] 积分矿机
- [x] 转账功能
- [x] 双区系统
- [x] 管理后台

### 阶段2：API接口规范化 🔄
- [ ] 统一错误处理
- [ ] 统一响应格式
- [ ] API文档生成
- [ ] 接口测试用例

### 阶段3：性能优化
- [ ] 数据缓存策略
- [ ] 分页加载优化
- [ ] 图片压缩上传
- [ ] 实时连接优化

### 阶段4：安全加固
- [ ] RLS策略完善
- [ ] 输入验证
- [ ] XSS防护
- [ ] CSRF防护

### 阶段5：生产部署
- [ ] 环境变量配置
- [ ] Supabase迁移脚本
- [ ] 数据备份策略
- [ ] 监控告警

---

## 📝 接口调用示例

### 前端调用方式

#### 1. 直接使用Supabase Client
```typescript
// 查询
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

// 插入
const { data, error } = await supabase
  .from('transactions')
  .insert({ user_id, amount, type })

// 更新
const { data, error } = await supabase
  .from('users')
  .update({ u_balance: newBalance })
  .eq('id', userId)
```

#### 2. 封装Service层（推荐）
```typescript
// src/services/UserService.ts
export class UserService {
  static async getBalance(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('u_balance, points_balance, mining_points')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  }
  
  static async updateBalance(userId: string, amount: number) {
    // 业务逻辑
  }
}

// 使用
const balance = await UserService.getBalance(userId)
```

---

## 🔒 安全策略

### 1. Row Level Security (RLS)
```sql
-- 用户只能查看自己的数据
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- 用户只能更新自己的数据
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid() = id);
```

### 2. 输入验证
```typescript
// 前端验证
const validateTransfer = (amount: number, balance: number) => {
  if (amount <= 0) throw new Error('金额必须大于0')
  if (amount > balance) throw new Error('余额不足')
  // ...
}

// 后端验证（数据库触发器）
CREATE TRIGGER check_balance_before_transfer
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION validate_balance();
```

---

## 📊 性能优化建议

### 1. 数据库索引
```sql
-- 常用查询字段添加索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_messages_group ON messages(chat_group_id);
```

### 2. 分页查询
```typescript
const PAGE_SIZE = 20

const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('chat_group_id', groupId)
  .order('created_at', { ascending: false })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
```

### 3. 缓存策略
```typescript
// Pinia store with cache
const cachedData = ref<Map<string, any>>(new Map())

const getData = async (key: string) => {
  if (cachedData.value.has(key)) {
    return cachedData.value.get(key)
  }
  
  const data = await fetchData(key)
  cachedData.value.set(key, data)
  return data
}
```

---

## 🚀 部署清单

### 开发环境 → 生产环境

1. **环境变量配置**
   - `.env` → `.env.production`
   - Supabase URL
   - Supabase Anon Key

2. **数据库迁移**
   - 运行所有 `supabase/*.sql` 脚本
   - 验证表结构
   - 配置RLS策略

3. **前端构建**
   ```bash
   npm run build
   npm run preview  # 预览
   ```

4. **部署**
   - Vercel / Netlify (前端)
   - Supabase (后端)

---

## ✅ 质量保证

### 1. 测试覆盖
- [ ] 单元测试 (Vitest)
- [ ] 组件测试
- [ ] 集成测试
- [ ] E2E测试 (Cypress)

### 2. 代码规范
- [ ] ESLint配置
- [ ] Prettier格式化
- [ ] TypeScript严格模式
- [ ] Git Hooks (Husky)

### 3. 文档完善
- [x] API架构文档
- [ ] 接口文档 (Swagger)
- [ ] 部署文档
- [ ] 用户手册

---

**最后更新**: 2025-10-05
**版本**: v1.0.0
**状态**: 架构设计完成，进入接口规范化阶段
























