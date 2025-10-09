# 📋 今天的任务清单

**时间**: 2025年10月7日下午  
**目标**: 测试现有功能 + 开始分红系统  
**预计时间**: 2-3小时

---

## ✅ **任务清单**

### **第一步: 快速测试 (30分钟)** 🔥

- [ ] **测试AI学习机** - 5分钟
  - 访问 http://localhost:3000/points
  - 检查页面是否正常显示
  - 查看颜色是否为黄白色主题
  
- [ ] **测试对碰系统** - 5分钟
  - 访问 http://localhost:3000/binary
  - 检查页面是否正常显示
  - 查看能否正常加入
  
- [ ] **测试团队页面** - 5分钟
  - 访问 http://localhost:3000/team
  - 检查是否显示黄白色主题
  - 查看数据是否正确加载
  
- [ ] **测试互转页面** - 5分钟
  - 访问 http://localhost:3000/transfer
  - 检查是否显示黄白色主题
  
- [ ] **测试群聊页面** - 5分钟
  - 访问 http://localhost:3000/chat
  - 检查是否显示黄白色主题
  
- [ ] **测试个人中心** - 5分钟
  - 访问 http://localhost:3000/profile
  - 检查是否显示黄白色主题

---

### **第二步: 创建分红系统 (1.5小时)** ⏰

#### **2.1 创建数据库表** - 10分钟

在 Supabase SQL Editor 执行:

```sql
-- 创建分红池表
CREATE TABLE IF NOT EXISTS dividend_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(20, 2) NOT NULL,
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dividend_pool_created ON dividend_pool(created_at);

-- 确保 dividend_records 表存在（应该已经在 schema.sql 中）
-- 如果不存在，执行:
CREATE TABLE IF NOT EXISTS dividend_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(20, 2) NOT NULL,
  pool_balance DECIMAL(20, 2),
  eligible_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] 执行完成
- [ ] 在 Table Editor 中验证表已创建

---

#### **2.2 创建 DividendService** - 40分钟

- [ ] 创建文件 `src/services/DividendService.ts`
- [ ] 复制代码（见 CLEAR_ROADMAP.md）
- [ ] 保存文件
- [ ] 检查没有 TypeScript 错误

---

#### **2.3 更新 BinaryService** - 20分钟

在 `src/services/BinaryService.ts` 的 `processPairing` 方法中添加:

```typescript
// 导入
import { DividendService } from './DividendService'

// 在计算对碰奖时添加:
const platformFee = memberBonus / 0.85 * 0.15 // 15%进入分红池
await DividendService.addToPool(platformFee, 'pairing_bonus')
```

- [ ] 更新完成
- [ ] 保存文件
- [ ] 检查没有错误

---

#### **2.4 添加管理后台按钮** - 20分钟

可选：如果你有管理后台页面，添加手动触发分红的按钮

- [ ] 跳过此步（后期添加）

---

### **第三步: 记录问题 (30分钟)**

创建测试问题清单:

- [ ] 记录发现的所有问题
- [ ] 按优先级排序
- [ ] 准备明天修复

---

## 🎯 **立即开始 - 快速检查脚本**

打开浏览器控制台 (F12)，运行以下代码:

```javascript
// 快速检查所有页面
const pages = [
  '/points',
  '/binary', 
  '/team',
  '/transfer',
  '/earnings',
  '/chat',
  '/profile'
]

console.log('📊 开始检查页面...')

pages.forEach(page => {
  console.log(`\n✅ 检查: ${page}`)
  console.log(`   访问: http://localhost:3000${page}`)
})

console.log('\n💡 请手动访问每个页面，检查是否正常显示')
```

---

## 📝 **测试记录表**

| 页面 | 访问正常 | 颜色正确 | 功能正常 | 问题描述 |
|------|---------|---------|---------|---------|
| /points | ☐ | ☐ | ☐ | |
| /binary | ☐ | ☐ | ☐ | |
| /team | ☐ | ☐ | ☐ | |
| /transfer | ☐ | ☐ | ☐ | |
| /earnings | ☐ | ☐ | ☐ | |
| /chat | ☐ | ☐ | ☐ | |
| /profile | ☐ | ☐ | ☐ | |

---

## 🚀 **现在就开始**

1. ✅ 打开浏览器
2. ✅ 访问 http://localhost:3000
3. ✅ 依次测试每个页面
4. ✅ 记录问题
5. ✅ 开始创建分红系统

**加油！预计2-3小时完成今天的任务！** 💪

