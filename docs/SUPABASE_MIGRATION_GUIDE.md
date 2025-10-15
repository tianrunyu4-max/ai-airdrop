# 📦 Supabase 双区系统迁移指南

> **迁移目标**: 从见点奖系统升级到双区对碰奖励系统  
> **风险等级**: 低（只添加新字段和表，不删除现有数据）  
> **预计时间**: 5分钟

---

## 📋 迁移前检查清单

### 1. 数据备份（推荐）

虽然此迁移只添加新字段和表，不会删除数据，但建议先备份：

```bash
# 在Supabase Dashboard中
1. 进入项目设置 (Settings)
2. 点击 Database → Backups
3. 点击 "Create backup" 创建快照
```

### 2. 确认环境

- ✅ 已有Supabase项目
- ✅ 已配置`.env`文件（VITE_SUPABASE_URL和VITE_SUPABASE_ANON_KEY）
- ✅ 现有数据库正常运行

---

## 🚀 迁移步骤

### 步骤1：登录Supabase

1. 打开浏览器，访问 [https://supabase.com](https://supabase.com)
2. 登录你的账号
3. 选择你的项目（项目ID: `vtezesyfhvbkgpdkuyeo`）

### 步骤2：打开SQL Editor

1. 在左侧菜单中点击 **SQL Editor**
2. 点击 **New query** 创建新查询

### 步骤3：执行迁移脚本

1. 打开项目中的文件：`supabase/migration_binary_system.sql`
2. **复制全部内容**（约300行）
3. **粘贴到SQL Editor**中
4. 点击右下角的 **Run** 按钮（或按 `Ctrl+Enter`）

### 步骤4：验证迁移结果

执行后，你会在底部看到输出信息：

```
✅ users表新增字段数: 11
✅ users表迁移成功！
✅ 新增表数量: 3
✅ 新表创建成功！

╔════════════════════════════════════════════════════╗
║  🎉 双区对碰系统 - 数据库迁移完成！         ║
╚════════════════════════════════════════════════════╝

✅ users表: 新增11个字段
✅ pairing_bonuses表: 对碰奖记录
✅ level_bonuses表: 平级奖记录
✅ dividend_records表: 分红记录
✅ 辅助函数: 3个

🎯 下一步: 在应用中调用NetworkService API
```

如果看到以上信息，说明迁移成功！✅

---

## 🔍 迁移内容详解

### 1. users表新增字段（11个）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `parent_id` | UUID | 双区系统直接上级 |
| `network_side` | VARCHAR(1) | A区或B区 |
| `a_side_sales` | INT | A区销售单数 |
| `b_side_sales` | INT | B区销售单数 |
| `a_side_settled` | INT | A区已结算单数 |
| `b_side_settled` | INT | B区已结算单数 |
| `total_pairing_bonus` | DECIMAL | 累计对碰奖 |
| `total_level_bonus` | DECIMAL | 累计平级奖 |
| `total_dividend` | DECIMAL | 累计分红 |
| `is_unlocked` | BOOLEAN | 是否解锁平级奖 |
| `reinvestment_count` | INT | 复投次数 |

### 2. 新增表（3个）

#### pairing_bonuses（对碰奖记录）
- 记录每次对碰奖的详细信息
- 包含结算前后的A/B区业绩
- 用于收益历史查询

#### level_bonuses（平级奖记录）
- 记录每次平级奖的发放
- 关联触发奖励的下级和对碰奖记录
- 追踪第几代上级获得奖励

#### dividend_records（分红记录）
- 记录每次分红的金额
- 记录分红池总额和参与人数
- 用于分红历史查询

### 3. 辅助函数（3个）

- `increment()` - 增量更新数值字段
- `increment_side_sales()` - 更新区域销售数
- `increment_referral_count()` - 更新直推数

### 4. 新增索引（3个）

- `idx_users_parent` - 上级查询优化
- `idx_users_network_side` - 区域查询优化
- `idx_users_qualified_dividend` - 分红资格查询优化

---

## ✅ 迁移后验证

### 方法1：在SQL Editor中验证

```sql
-- 验证users表新字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('parent_id', 'network_side', 'a_side_sales', 'b_side_sales');

-- 验证新表
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('pairing_bonuses', 'level_bonuses', 'dividend_records');
```

### 方法2：在应用中测试

```bash
# 在项目根目录运行
npm run supabase:check
```

应该看到所有新表和字段的确认信息。

---

## 🔧 故障排除

### 问题1：权限错误

**错误信息**: `permission denied for table users`

**解决方案**:
1. 确认你是项目的Owner或有足够权限
2. 在Supabase Dashboard中执行，而不是通过API

### 问题2：字段已存在

**错误信息**: `column "parent_id" of relation "users" already exists`

**解决方案**:
- 这是正常的！脚本使用了`ADD COLUMN IF NOT EXISTS`，会自动跳过已存在的字段
- 继续执行，不影响其他部分

### 问题3：外键约束错误

**错误信息**: `violates foreign key constraint`

**解决方案**:
1. 确认`users`表中有数据
2. 外键约束是正常的，用于保证数据完整性
3. 新字段默认为NULL，不会影响现有数据

---

## 🎯 迁移后行动

### 1. 更新TypeScript类型（可选）

```bash
# 生成新的TypeScript类型定义
npm run supabase:types
```

### 2. 测试NetworkService

```typescript
// 在浏览器控制台测试
import { NetworkService } from '@/services/network.service'

// 测试自动排线
const side = await NetworkService.assignNetworkSide('user-id')
console.log('分配区域:', side)

// 测试网络统计
const stats = await NetworkService.getNetworkStats('user-id')
console.log('网络统计:', stats)
```

### 3. 启动应用

```bash
npm run dev
```

访问 `http://localhost:3000` 验证应用正常运行。

---

## 📊 数据迁移策略（如有必要）

如果你需要将现有用户迁移到双区系统：

```sql
-- 为现有用户初始化双区字段
UPDATE users 
SET 
  a_side_sales = 0,
  b_side_sales = 0,
  a_side_settled = 0,
  b_side_settled = 0,
  total_pairing_bonus = 0,
  total_level_bonus = 0,
  total_dividend = 0,
  is_unlocked = CASE WHEN direct_referral_count >= 2 THEN true ELSE false END
WHERE is_agent = true;
```

---

## 🔄 回滚方案（仅在必要时）

如果需要回滚迁移（不推荐）：

```sql
-- 警告：这会删除新表和数据！
DROP TABLE IF EXISTS dividend_records CASCADE;
DROP TABLE IF EXISTS level_bonuses CASCADE;
DROP TABLE IF EXISTS pairing_bonuses CASCADE;

-- 删除users表新字段
ALTER TABLE users 
  DROP COLUMN IF EXISTS parent_id,
  DROP COLUMN IF EXISTS network_side,
  DROP COLUMN IF EXISTS a_side_sales,
  DROP COLUMN IF EXISTS b_side_sales,
  DROP COLUMN IF EXISTS a_side_settled,
  DROP COLUMN IF EXISTS b_side_settled,
  DROP COLUMN IF EXISTS total_pairing_bonus,
  DROP COLUMN IF EXISTS total_level_bonus,
  DROP COLUMN IF EXISTS total_dividend,
  DROP COLUMN IF EXISTS is_unlocked,
  DROP COLUMN IF EXISTS reinvestment_count;
```

---

## 📞 需要帮助？

如果迁移过程中遇到问题：

1. 检查Supabase Dashboard的Logs（日志）
2. 查看SQL Editor的错误输出
3. 确认你的Supabase项目URL和Key是否正确

---

**迁移准备好了吗？** 🚀

按照上述步骤执行，5分钟内完成升级！


















