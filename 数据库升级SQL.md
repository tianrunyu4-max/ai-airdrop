# 🔧 数据库升级SQL

> **问题**：兑换失败，缺少V4.0升级所需的数据库列

---

## 🚨 错误分析

### 1️⃣ **UUID错误**
```
invalid input syntax for type uuid: "兑换1张AI学习卡(7U)"
```
- **问题**：WalletManager传递了描述字符串而不是UUID
- **解决**：检查WalletManager.deduct方法调用

### 2️⃣ **数据库列缺失**
```
Could not find the 'status' column of 'mining_machines' in the scheme cache
```
- **问题**：mining_machines表缺少V4.0升级所需的列
- **解决**：需要添加新的列

---

## 📝 需要添加的数据库列

### mining_machines表升级
```sql
-- 添加V4.0升级所需的列
ALTER TABLE mining_machines 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS last_checkin_date DATE,
ADD COLUMN IF NOT EXISTS checkin_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_checked_in_today BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS boost_rate DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS restart_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_restart_at TIMESTAMP WITH TIME ZONE;

-- 更新现有记录
UPDATE mining_machines 
SET status = CASE 
  WHEN is_active = true THEN 'active'
  ELSE 'inactive'
END
WHERE status IS NULL;
```

### 添加索引
```sql
-- 添加性能索引
CREATE INDEX IF NOT EXISTS idx_mining_machines_user_id ON mining_machines(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_machines_status ON mining_machines(status);
CREATE INDEX IF NOT EXISTS idx_mining_machines_checkin ON mining_machines(last_checkin_date);
```

---

## 🔧 修复步骤

### 1️⃣ **执行数据库升级**
1. 登录Supabase控制台
2. 进入SQL编辑器
3. 执行上述SQL语句

### 2️⃣ **验证表结构**
```sql
-- 检查表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'mining_machines'
ORDER BY ordinal_position;
```

### 3️⃣ **测试兑换功能**
1. 清除浏览器缓存
2. 重新测试兑换功能
3. 检查控制台错误

---

## ⚠️ 注意事项

### 数据安全
- 执行前备份数据库
- 在测试环境先验证
- 确保所有列都有默认值

### 性能考虑
- 添加索引提升查询性能
- 考虑数据迁移策略
- 监控数据库性能

---

## 🎯 预期结果

执行升级后：
- ✅ 兑换功能正常工作
- ✅ 签到功能正常
- ✅ 释放率计算正常
- ✅ 滑落机制正常

**请先执行数据库升级SQL，然后重新测试兑换功能！** 🚀


































