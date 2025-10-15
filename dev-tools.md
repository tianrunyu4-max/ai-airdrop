# 开发工具 - 快速测试

## 在浏览器控制台运行以下命令：

### 1. 查看当前用户状态
```javascript
const users = JSON.parse(localStorage.getItem('registered_users') || '{}')
const currentUser = localStorage.getItem('current_user')
console.log('当前用户:', currentUser)
console.log('用户数据:', users[currentUser])
console.log('是否代理:', users[currentUser]?.userData?.is_agent)
```

### 2. 将当前用户设置为代理
```javascript
const users = JSON.parse(localStorage.getItem('registered_users') || '{}')
const currentUser = localStorage.getItem('current_user')
if (users[currentUser]) {
  users[currentUser].userData.is_agent = true
  users[currentUser].userData.agent_paid_at = new Date().toISOString()
  localStorage.setItem('registered_users', JSON.stringify(users))
  console.log('✅ 已设置为代理，请刷新页面')
  location.reload()
}
```

### 3. 将当前用户设置为普通用户
```javascript
const users = JSON.parse(localStorage.getItem('registered_users') || '{}')
const currentUser = localStorage.getItem('current_user')
if (users[currentUser]) {
  users[currentUser].userData.is_agent = false
  users[currentUser].userData.agent_paid_at = null
  localStorage.setItem('registered_users', JSON.stringify(users))
  console.log('✅ 已设置为普通用户，请刷新页面')
  location.reload()
}
```

### 4. 清除所有数据重新开始
```javascript
localStorage.clear()
console.log('✅ 已清除所有数据，请刷新页面重新注册')
location.reload()
```

## 测试步骤

1. **测试代理用户**：
   - 运行命令2设置为代理
   - 刷新页面
   - 点击"切换群聊"
   - 应该看到⭐"代理"徽章
   - 可以自由切换所有群聊

2. **测试普通用户**：
   - 运行命令3设置为普通用户
   - 刷新页面
   - 点击"切换群聊"
   - 应该看到🔒锁定图标在专属群上
   - 点击专属群会弹出订阅提示

3. **重新开始**：
   - 运行命令4清除数据
   - 重新注册
   - 第一个用户自动成为代理+管理员

















