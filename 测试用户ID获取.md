# 测试用户 ID 获取

## 问题
消息发送失败，可能是因为 `authStore.user.id` 为空或不正确。

## 测试步骤

### 1. 在 Supabase 查看 users 表的 ID 字段名

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name LIKE '%id%'
ORDER BY ordinal_position;
```

### 2. 查看测试管理员的完整数据

```sql
SELECT *
FROM users 
WHERE username = '测试管理员';
```

### 3. 前端调试

在浏览器控制台执行：
```javascript
// 查看当前用户对象
console.log('当前用户:', JSON.parse(localStorage.getItem('user_session')))

// 查看 ID 字段
const user = JSON.parse(localStorage.getItem('user_session'))
console.log('用户ID:', user.id || user.ID || user['用户ID'])
```

## 可能的问题

1. 数据库返回的是 `ID`（大写）而不是 `id`
2. 数据库返回的是中文字段名如 `用户ID`
3. localStorage 中的 user_session 没有 id 字段

## 快速修复

如果字段名不对，需要在代码中统一转换。

