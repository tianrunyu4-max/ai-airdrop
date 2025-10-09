# 群聊权限控制说明

## 📋 权限规则

### 1. 普通用户（非代理）
- ✅ 只能看到和使用 **"AI科技"** 主群
- ❌ 无法看到"切换群聊"按钮
- ❌ 无法进入其他专属群聊
- 💬 可以正常发送消息和图片

### 2. 代理用户（is_agent = true）
- ✅ 可以看到 **"AI科技"** 主群
- ✅ 可以看到"切换群聊"按钮
- ✅ 可以进入所有专属群聊
- ⭐ 头部显示"代理"徽章
- 💬 可以在任何群聊中发送消息和图片

## 🎯 群聊分类

### 主群（人人可见）
- **AI科技** 🤖
  - 所有用户都可以看到
  - 综合交流群
  - AI机器人自动推送空投信息

### 代理专属群（仅代理可见）
1. **币安空投专区** 🟡
   - 币安交易所专属空投
   - AI机器人过滤推送

2. **OKX空投专区** ⚫
   - OKX交易所专属空投
   - AI机器人过滤推送

3. **高分空投推荐** ⭐
   - 评分≥8.0的优质空投
   - 精选推荐

4. **合约交易策略** 📊
   - 交易技巧分享
   - 无机器人推送

## 🔧 实现细节

### 前端权限控制

#### ChatView.vue
```vue
<!-- 切换群聊按钮 - 仅代理可见 -->
<GroupSelector 
  v-if="authStore.user?.is_agent"
  :current-group-id="currentGroup?.id || null"
  @select="switchGroup"
/>

<!-- 代理标识 -->
<div v-if="authStore.user?.is_agent" class="badge badge-warning">
  ⭐ 代理
</div>
```

#### 默认群配置
```typescript
currentGroup.value = {
  id: 'dev-group',
  name: 'AI科技',
  type: 'default_hall',
  member_count: 128,
  max_members: 100000,
  icon: '🤖',
  description: '主群聊 - 人人可见'
}
```

### 数据库结构

#### users表
```sql
is_agent BOOLEAN DEFAULT FALSE  -- 是否为代理
```

#### chat_groups表
```sql
type VARCHAR(20) DEFAULT 'default_hall'  -- 群类型
-- 'default_hall': 主群（人人可见）
-- 'custom': 专属群（仅代理可见）
```

## 📱 用户体验

### 普通用户看到的界面
```
┌─────────────────────────────────────┐
│ 🤖 AI科技                            │
│ 128 成员 · 66 在线                   │
│                          🟢 实时推送  │
└─────────────────────────────────────┘
```

### 代理用户看到的界面
```
┌─────────────────────────────────────┐
│ 🤖 AI科技                            │
│ 128 成员 · 66 在线                   │
│              🟢 实时推送 [切换群聊] ⭐代理 │
└─────────────────────────────────────┘
```

## 🎨 视觉标识

### 代理徽章
- 颜色：warning（黄色）
- 图标：星星 ⭐
- 位置：头部右侧
- 样式：大徽章，阴影，加粗

### 切换群聊按钮
- 颜色：primary outline
- 图标：用户组
- 悬停：放大动画
- 样式：阴影效果

## 🚀 如何成为代理

### 方法1：管理后台设置
1. 登录管理后台
2. 进入"用户管理"
3. 找到目标用户
4. 点击"设为代理"

### 方法2：付费30U
1. 用户在前端点击"成为代理"
2. 支付30U
3. 系统自动设置 `is_agent = true`
4. 生成邀请码

### 方法3：SQL直接设置
```sql
UPDATE users 
SET is_agent = true 
WHERE username = 'your_username';
```

## 🔐 安全考虑

### 前端验证
- 使用 `v-if="authStore.user?.is_agent"` 控制UI显示
- 非代理用户看不到切换按钮

### 后端验证（建议）
- RLS策略：限制非代理用户访问custom群组
- API验证：检查用户is_agent状态

### 建议的RLS策略
```sql
-- 只允许代理用户查看custom群组
CREATE POLICY groups_select_custom ON chat_groups
  FOR SELECT USING (
    type = 'default_hall' OR 
    (type = 'custom' AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_agent = TRUE
    ))
  );
```

## 📊 统计数据

### 群组访问统计
- 主群访问量：所有用户
- 专属群访问量：仅代理用户
- 代理转化率：代理数/总用户数

## 🎯 业务逻辑

### 用户注册流程
1. 新用户注册 → `is_agent = false`
2. 默认进入"AI科技"主群
3. 看到机器人推送

### 代理升级流程
1. 用户付费30U
2. `is_agent = true`
3. 生成邀请码
4. 解锁专属群聊
5. 看到"切换群聊"按钮

### 代理特权
- ✅ 访问所有群聊
- ✅ 查看专属空投信息
- ✅ 获得推荐奖励
- ✅ 显示代理身份标识

## 🐛 故障排除

### 问题1：代理看不到切换按钮
- 检查：`authStore.user?.is_agent` 是否为 `true`
- 解决：更新数据库 `is_agent` 字段

### 问题2：普通用户能看到切换按钮
- 检查：前端代码 `v-if` 条件
- 解决：确保使用 `v-if="authStore.user?.is_agent"`

### 问题3：切换群聊后无法加载消息
- 检查：RLS策略是否正确
- 解决：确保代理用户有权限访问群组消息

---

**更新时间**: 2025-10-05
**版本**: v1.1.0

