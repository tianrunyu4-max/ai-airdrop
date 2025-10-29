# 管理员账号设置指南

由于系统改为"发言即注册"模式，管理员账号需要特殊设置。

---

## 📋 **方案对比：**

| 方案 | 难度 | 推荐度 | 说明 |
|------|------|--------|------|
| **方案1：数据库设置** | ⭐ | ⭐⭐⭐⭐⭐ | 最简单快捷 |
| **方案2：隐藏注册页** | ⭐⭐ | ⭐⭐⭐ | 备用方案 |

---

## 🎯 **方案1：数据库直接设置（推荐）**

### **步骤：**

1. **在前端创建普通账号**
   - 访问聊天页面：`https://www.ai-airdrop.top/chat`
   - 输入消息并发送
   - 系统自动创建账号（如：`ABC12345`）
   - 记住这个用户名！

2. **在Supabase设置为管理员**
   - 登录 [Supabase Dashboard](https://supabase.com/dashboard)
   - 进入项目 → SQL Editor
   - 运行以下SQL（替换 `ABC12345` 为你的用户名）：

```sql
-- 设置为管理员
UPDATE users 
SET 
  is_admin = true,
  is_agent = true,
  u_balance = 10000,
  points_balance = 10000,
  mining_points = 10000
WHERE username = 'ABC12345';

-- 验证（检查是否成功）
SELECT username, is_admin, is_agent FROM users WHERE username = 'ABC12345';
```

3. **访问管理后台**
   - 刷新页面
   - 访问：`https://www.ai-airdrop.top/admin/dashboard`
   - 现在可以访问管理后台了！✅

---

## 🔐 **方案2：隐藏管理员注册页（备用）**

### **访问地址：**
```
https://www.ai-airdrop.top/admin/setup
```

### **步骤：**

1. 访问上述链接
2. 填写用户名和密码
3. 输入管理员密钥：`admin2025`
4. 点击"创建管理员账号"
5. 创建成功后自动登录并跳转到管理后台

### **特点：**
- ✅ 无需数据库操作
- ✅ 自动设置管理员权限
- ✅ 初始余额：10000U
- ⚠️ 需要管理员密钥（防止滥用）

---

## 🔑 **管理员密钥：**

```
admin2025
```

**请妥善保管此密钥！**

---

## 💡 **使用建议：**

1. **首次部署**：使用方案2（隐藏注册页）快速创建
2. **后续添加**：使用方案1（数据库设置）更安全
3. **密钥管理**：定期更换管理员密钥

---

## 🛡️ **安全建议：**

1. ✅ 创建管理员后，立即修改密码
2. ✅ 管理员密钥不要泄露
3. ✅ 定期检查管理员账号列表
4. ✅ 不需要的管理员账号及时删除
5. ✅ 考虑添加IP白名单限制

---

## 📝 **SQL脚本位置：**

```
supabase/migrations/设置管理员账号.sql
```

可以直接在Supabase SQL编辑器中运行此脚本。

---

## ❓ **常见问题：**

### **Q: 忘记管理员密码怎么办？**
A: 在数据库中运行以下SQL重置密码：
```sql
-- 重置密码为 "123456"（加密后）
UPDATE users 
SET password_hash = '$2a$10$XYZ...' -- 需要先加密
WHERE username = 'ABC12345' AND is_admin = true;
```

### **Q: 如何查看所有管理员？**
A: 在Supabase SQL编辑器运行：
```sql
SELECT username, is_admin, is_agent, created_at 
FROM users 
WHERE is_admin = true;
```

### **Q: 如何取消管理员权限？**
A: 运行SQL：
```sql
UPDATE users 
SET is_admin = false 
WHERE username = 'ABC12345';
```

---

## 🎉 **完成！**

现在您可以访问管理后台了：
```
https://www.ai-airdrop.top/admin/dashboard
```
