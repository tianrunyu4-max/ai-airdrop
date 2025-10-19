# 🎯 修复默认群问题 - 让"AI科技"成为唯一主群

## 问题
- 当前显示"默认大厅 1"作为默认群
- 应该显示"AI科技"作为主群

---

## 🔧 解决方案：在 Supabase SQL Editor 执行

### 步骤1：查看所有群组
```sql
SELECT id, name, type, icon, is_active, created_at 
FROM chat_groups 
ORDER BY created_at;
```

### 步骤2：删除"默认大厅 1"（如果存在）
```sql
DELETE FROM chat_groups WHERE name = '默认大厅 1';
```

### 步骤3：确保"AI科技"群存在且设置为主群
```sql
-- 删除可能存在的其他 default_hall 类型的群
UPDATE chat_groups 
SET type = 'other' 
WHERE type = 'default_hall' AND name != 'AI科技';

-- 确保 AI科技 存在且为唯一主群
INSERT INTO chat_groups (name, icon, type, description, member_count, max_members, is_active)
VALUES ('AI科技', '🤖', 'default_hall', '核心群聊 - 等待AI智能推荐空投 币安交易所全投资讯', 60, 50000, true)
ON CONFLICT (name) DO UPDATE 
SET 
  type = 'default_hall',
  is_active = true,
  icon = '🤖',
  description = '核心群聊 - 等待AI智能推荐空投 币安交易所全投资讯';
```

### 步骤4：验证结果
```sql
SELECT id, name, type, icon, description, is_active 
FROM chat_groups 
WHERE type = 'default_hall';
```

应该只看到一个群：**AI科技**

---

## ✅ 执行完成后

1. **刷新页面**（Ctrl+F5 或 Cmd+Shift+R）
2. **应该看到"AI科技"作为默认群**
3. **不再有"默认大厅 1"**

---

**请在 Supabase SQL Editor 中执行上面的 SQL！** 🚀

