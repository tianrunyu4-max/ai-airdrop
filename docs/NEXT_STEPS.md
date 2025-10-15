# 下一步开发计划

## 🎯 当前状态总结

### ✅ 已完成功能
1. **用户系统** - 注册、登录、用户信息管理
2. **聊天系统** - 群聊、消息、图片、群组切换、权限控制
3. **积分系统** - 矿机购买、每日释放、积分兑换
4. **转账系统** - U转账、积分转账
5. **双区系统** - A/B区业绩、对碰奖、平级奖、复投、分红
6. **管理后台** - 用户管理、提现审核、群聊管理、系统配置
7. **UI美化** - 醒目设计、按钮动画、响应式布局

### 🔧 技术栈
- **前端**: Vue 3 + TypeScript + Vite + Pinia + TailwindCSS + DaisyUI
- **后端**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **测试**: Vitest
- **部署**: 开发模式(localStorage) + 生产模式(Supabase)

---

## 📋 下一步重点任务

### 🔥 优先级1：接口规范化（本周）

#### 1.1 创建Service层
**目标**: 统一API调用，便于维护和测试

```typescript
// src/services/BaseService.ts
export class BaseService {
  protected static async handleRequest<T>(
    request: Promise<any>
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const { data, error } = await request
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('API Error:', error)
      return { data: null, error: error as Error }
    }
  }
}

// src/services/UserService.ts
export class UserService extends BaseService {
  static async getProfile(userId: string) {
    return this.handleRequest(
      supabase.from('users').select('*').eq('id', userId).single()
    )
  }
  
  static async updateBalance(userId: string, amount: number) {
    return this.handleRequest(
      supabase.from('users')
        .update({ u_balance: amount })
        .eq('id', userId)
    )
  }
}
```

**需要创建的Service**:
- [ ] `UserService.ts` - 用户相关
- [ ] `TransactionService.ts` - 交易相关
- [ ] `MiningService.ts` - 矿机相关（已有，需完善）
- [ ] `ChatService.ts` - 聊天相关
- [ ] `NetworkService.ts` - 双区系统相关
- [ ] `WithdrawalService.ts` - 提现相关

#### 1.2 统一错误处理
```typescript
// src/utils/errorHandler.ts
export class ErrorHandler {
  static handle(error: any, context: string) {
    console.error(`[${context}]`, error)
    
    // 根据错误类型返回用户友好的消息
    if (error.code === 'PGRST116') {
      return '数据不存在'
    }
    if (error.code === '23505') {
      return '数据已存在'
    }
    if (error.message.includes('balance')) {
      return '余额不足'
    }
    
    return error.message || '操作失败，请重试'
  }
}
```

#### 1.3 统一响应格式
```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 使用示例
const response: ApiResponse<User> = {
  success: true,
  data: user,
  message: '操作成功'
}
```

---

### 🔥 优先级2：核心功能完善（本周）

#### 2.1 订阅代理功能
**文件**: `src/views/subscription/SubscriptionView.vue`

**需要实现**:
- [ ] 显示订阅价格（30U）
- [ ] 显示代理权益列表
- [ ] 支付流程（扣除U余额）
- [ ] 支付成功后更新 `is_agent = true`
- [ ] 生成邀请码
- [ ] 跳转到成功页面

```typescript
// 订阅代理逻辑
const subscribeAgent = async () => {
  if (authStore.user!.u_balance < 30) {
    alert('余额不足，请先充值')
    return
  }
  
  if (confirm('确认支付30U订阅代理？')) {
    // 1. 扣除余额
    // 2. 更新is_agent
    // 3. 生成invite_code
    // 4. 记录交易
    // 5. 刷新用户信息
  }
}
```

#### 2.2 提现功能完善
**文件**: `src/views/profile/ProfileView.vue`

**需要实现**:
- [ ] 提现申请表单
- [ ] 钱包地址验证（TRC20格式）
- [ ] 最低提现金额检查（20U）
- [ ] 提现记录列表
- [ ] 提现状态显示

#### 2.3 矿机自动释放
**文件**: `src/services/SchedulerService.ts`

**需要实现**:
- [ ] 定时任务（每日凌晨执行）
- [ ] 计算每台矿机的释放量
- [ ] 更新用户mining_points
- [ ] 记录daily_releases
- [ ] 检查是否达到出局条件

```typescript
// 伪代码
export class SchedulerService {
  static async runDailyRelease() {
    // 1. 获取所有活跃矿机
    // 2. 计算释放量（基础+加速）
    // 3. 更新mining_points
    // 4. 检查是否出局
    // 5. 记录释放历史
  }
}
```

#### 2.4 双区系统自动结算
**需要实现**:
- [ ] 每日凌晨自动对碰结算
- [ ] 计算对碰奖（7U/单）
- [ ] 计算平级奖（2U/人，3代）
- [ ] 检查复投条件（200U）
- [ ] 每周分红结算（周一三五七）

---

### 🔥 优先级3：数据验证和安全（下周）

#### 3.1 前端表单验证
```typescript
// src/utils/validators.ts
export const validators = {
  username: (value: string) => {
    if (!value) return '用户名不能为空'
    if (value.length < 3) return '用户名至少3个字符'
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return '只能包含字母数字下划线'
    return null
  },
  
  amount: (value: number, min: number, max: number) => {
    if (value < min) return `金额不能小于${min}`
    if (value > max) return `金额不能大于${max}`
    return null
  },
  
  walletAddress: (value: string) => {
    if (!value) return '钱包地址不能为空'
    if (!/^T[a-zA-Z0-9]{33}$/.test(value)) return '无效的TRC20地址'
    return null
  }
}
```

#### 3.2 数据库触发器
```sql
-- 检查余额是否足够
CREATE OR REPLACE FUNCTION check_sufficient_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.u_balance < 0 THEN
    RAISE EXCEPTION '余额不足';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_balance
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION check_sufficient_balance();
```

#### 3.3 RLS策略完善
```sql
-- 用户只能查看自己的交易记录
CREATE POLICY "Users view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- 用户只能查看自己的提现记录
CREATE POLICY "Users view own withdrawals"
ON withdrawals FOR SELECT
USING (auth.uid() = user_id);
```

---

### 🔥 优先级4：性能优化（下周）

#### 4.1 分页加载
```typescript
// 消息分页
const loadMessages = async (page: number = 0) => {
  const PAGE_SIZE = 50
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_group_id', groupId)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
}
```

#### 4.2 图片压缩
```typescript
// 上传前压缩图片
const compressImage = async (file: File): Promise<Blob> => {
  // 使用canvas压缩
  const maxWidth = 1200
  const maxHeight = 1200
  const quality = 0.8
  
  // 压缩逻辑...
}
```

#### 4.3 数据缓存
```typescript
// Pinia store缓存
const useCache = defineStore('cache', {
  state: () => ({
    userCache: new Map<string, User>(),
    groupCache: new Map<string, ChatGroup>()
  }),
  
  actions: {
    getUser(id: string) {
      if (this.userCache.has(id)) {
        return this.userCache.get(id)
      }
      // 从API获取...
    }
  }
})
```

---

### 🔥 优先级5：测试和文档（持续）

#### 5.1 单元测试
```typescript
// src/services/__tests__/UserService.test.ts
describe('UserService', () => {
  it('should get user profile', async () => {
    const { data, error } = await UserService.getProfile('user-1')
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })
  
  it('should update balance', async () => {
    const { data, error } = await UserService.updateBalance('user-1', 100)
    expect(error).toBeNull()
    expect(data.u_balance).toBe(100)
  })
})
```

#### 5.2 API文档
使用Swagger/OpenAPI生成接口文档

#### 5.3 用户手册
- [ ] 注册登录指南
- [ ] 订阅代理教程
- [ ] 矿机购买说明
- [ ] 双区系统介绍
- [ ] 提现流程说明

---

## 📅 时间规划

### 第1周（本周）
- ✅ Day 1-2: 聊天系统完善
- 🔄 Day 3-4: 接口规范化（Service层）
- ⏳ Day 5-6: 订阅代理功能
- ⏳ Day 7: 测试和bug修复

### 第2周
- Day 1-2: 提现功能完善
- Day 3-4: 矿机自动释放
- Day 5-6: 双区系统自动结算
- Day 7: 集成测试

### 第3周
- Day 1-2: 安全加固（验证+RLS）
- Day 3-4: 性能优化
- Day 5-6: 文档完善
- Day 7: 部署准备

### 第4周
- Day 1-2: Supabase生产环境配置
- Day 3-4: 数据迁移和测试
- Day 5-6: 生产部署
- Day 7: 监控和优化

---

## 🎯 质量标准

### 代码质量
- [ ] TypeScript严格模式，无any类型
- [ ] ESLint无错误
- [ ] 所有函数有注释
- [ ] 关键逻辑有单元测试

### 性能标准
- [ ] 首屏加载 < 2s
- [ ] 页面切换 < 500ms
- [ ] API响应 < 1s
- [ ] 图片加载优化

### 安全标准
- [ ] 所有输入验证
- [ ] RLS策略完善
- [ ] XSS防护
- [ ] 敏感数据加密

### 用户体验
- [ ] 所有操作有loading状态
- [ ] 所有操作有成功/失败提示
- [ ] 错误信息友好
- [ ] 移动端适配

---

## 📝 备注

### 技术债务
1. 部分组件需要拆分（如ChatView过大）
2. 需要添加更多错误边界处理
3. 需要优化实时连接管理
4. 需要添加日志系统

### 已知问题
1. 开发模式下群聊列表需要硬编码数据
2. 图片上传未实现压缩
3. 消息列表未实现分页
4. 缺少离线消息处理

### 优化建议
1. 使用虚拟滚动优化长列表
2. 使用Web Worker处理复杂计算
3. 使用Service Worker实现PWA
4. 使用CDN加速静态资源

---

**下一步行动**: 开始创建Service层，统一API调用方式

**负责人**: AI助手
**审核人**: 用户
**截止日期**: 本周末















