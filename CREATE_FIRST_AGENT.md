# 🚀 **创建第一个AI代理（你自己）**

由于你是第一个用户，需要手动设置自己为AI代理。

---

## 📋 **方法1：通过Supabase后台（推荐）**

### **步骤：**

1. **打开Supabase SQL编辑器：**
   ```
   https://app.supabase.com/project/vtezesyfhvbkgpdkuyeo/sql/new
   ```

2. **执行以下SQL（替换用户名）：**

```sql
-- 查找你的用户ID
SELECT id, username, is_agent, u_balance 
FROM users 
WHERE username = 'test001';  -- 替换成你注册的用户名

-- 设置为AI代理 + 增加余额用于测试
UPDATE users 
SET 
  is_agent = true,
  u_balance = 10000,  -- 给你10000U用于测试
  agent_paid_at = NOW(),
  updated_at = NOW()
WHERE username = 'test001';  -- 替换成你的用户名

-- 验证
SELECT id, username, is_agent, u_balance, invite_code
FROM users 
WHERE username = 'test001';  -- 替换成你的用户名
```

3. **点击 "Run"（或按F5）**

4. **记录你的邀请码！**
   - 在查询结果中会看到 `invite_code`
   - 这个邀请码用于邀请其他人

---

## 📋 **方法2：创建多个测试用户（快速测试）**

如果你想快速测试Binary系统，可以创建多个测试用户：

```sql
-- 创建创世用户（你）
INSERT INTO users (username, password, is_agent, u_balance, invite_code)
VALUES 
  ('admin', '123456', true, 100000, 'ADMIN001')
ON CONFLICT (username) DO UPDATE
SET 
  is_agent = true,
  u_balance = 100000,
  agent_paid_at = NOW();

-- 创建测试用户A（你的直推）
INSERT INTO users (username, password, is_agent, u_balance, invite_code, inviter_id)
SELECT 
  'test_a', 
  '123456', 
  true, 
  10000, 
  'TESTA001',
  id
FROM users WHERE username = 'admin'
ON CONFLICT (username) DO NOTHING;

-- 创建测试用户B（你的直推）
INSERT INTO users (username, password, is_agent, u_balance, invite_code, inviter_id)
SELECT 
  'test_b', 
  '123456', 
  true, 
  10000, 
  'TESTB001',
  id
FROM users WHERE username = 'admin'
ON CONFLICT (username) DO NOTHING;

-- 验证创建结果
SELECT 
  username, 
  is_agent, 
  u_balance, 
  invite_code,
  (SELECT username FROM users u2 WHERE u2.id = u1.inviter_id) as inviter
FROM users u1
WHERE username IN ('admin', 'test_a', 'test_b');
```

---

## ✅ **完成后：**

1. **刷新网站：** https://eth10.netlify.app
2. **登录你的账号**
3. **进入 "我的" 页面**
4. **应该看到：**
   - ✅ 已经是AI代理
   - ✅ 显示你的邀请码
   - ✅ U余额充足

---

## 🎯 **接下来可以测试：**

### **1. 邀请新用户成为AI代理**

- 分享你的邀请码给团队
- 他们注册后，使用你的邀请码成为AI代理
- 观察Binary树的变化

### **2. 测试Binary对碰**

- 邀请2个人（A和B）
- 他们分别会进入你的A区和B区
- 自动触发对碰奖励（7U）
- 同时你会获得平级奖（如果A或B也有下级的话）

### **3. 测试AI学习机**

- 点击 "积分" 页面
- 激活学习机（第1台用100互转积分）
- 观察每日释放规则

### **4. 测试群聊**

- 在群聊里发送消息
- 测试实时通讯功能

---

## 🐛 **如果遇到问题：**

### **问题1：注册失败**

**检查：**
- 打开浏览器控制台（F12）
- 查看Network标签下的错误信息
- 检查Supabase是否正常

### **问题2：无法登录**

**解决：**
- 确认用户名和密码正确
- 在Supabase Table Editor中检查users表
- 确认密码字段是否存储

### **问题3：数据不显示**

**检查：**
- 清除浏览器缓存（Ctrl+Shift+Delete）
- 刷新页面（Ctrl+F5）
- 检查浏览器控制台是否有错误

---

## 📞 **需要帮助？**

如果遇到任何问题，请：

1. 截图错误信息
2. 记录操作步骤
3. 告诉我具体问题

**我会立即帮你解决！** 🚀































