# 🔗 Vercel 绑定域名详细教程

**前提：** 您已经通过淘宝代购拿到域名

---

## 📋 准备工作

### **您需要有：**
```
✅ 域名（例如：ai-airdrop.top）
✅ 域名管理后台的账号密码
✅ Vercel 账号（已登录）
✅ Vercel 项目（ai-airdrop）
```

---

## 🚀 绑定流程（15分钟）

### **Step 1: 登录 Vercel（1分钟）**
```
1. 访问：https://vercel.com
2. 点击右上角 "Login"
3. 使用 GitHub 账号登录
4. 进入 Dashboard
```

### **Step 2: 进入项目设置（1分钟）**
```
1. 在 Dashboard 找到项目：ai-airdrop
2. 点击项目名称
3. 点击顶部 "Settings"（设置）
4. 在左侧菜单找到 "Domains"（域名）
```

### **Step 3: 添加域名（2分钟）**
```
1. 在 Domains 页面，找到输入框
2. 输入你的域名：ai-airdrop.top
3. 点击 "Add" 按钮
4. Vercel 会提示需要配置 DNS
```

### **Step 4: 查看 DNS 配置要求（1分钟）**
```
Vercel 会显示需要添加的 DNS 记录：

通常有两种方式：

方式A：CNAME 记录（推荐）
- Type: CNAME
- Name: @ 或 ai-airdrop
- Value: cname.vercel-dns.com

方式B：A 记录
- Type: A
- Name: @
- Value: 76.76.21.21（Vercel IP）

+ 额外的 www 记录：
- Type: CNAME
- Name: www
- Value: cname.vercel-dns.com

📸 截图保存这些信息！
```

### **Step 5: 登录域名管理后台（2分钟）**
```
1. 打开淘宝客服给你的域名管理后台链接
   通常是：
   - Namecheap: https://www.namecheap.com
   - 或其他注册商

2. 使用客服给的账号密码登录

3. 找到你的域名（ai-airdrop.top）

4. 点击 "Manage"（管理）或 "DNS"
```

### **Step 6: 配置 DNS（5分钟）**

#### **如果是 Namecheap：**
```
1. 进入域名管理页面
2. 找到 "Advanced DNS" 标签
3. 点击 "Add New Record"
4. 添加以下记录：

记录1（主域名）：
- Type: CNAME Record
- Host: @
- Value: cname.vercel-dns.com
- TTL: Automatic

记录2（www子域名）：
- Type: CNAME Record
- Host: www
- Value: cname.vercel-dns.com
- TTL: Automatic

5. 删除默认的 A 记录（如果有）
6. 点击 "Save All Changes"
```

#### **如果是其他注册商：**
```
1. 找到 DNS 管理或 DNS 设置
2. 添加 CNAME 记录：
   - @ → cname.vercel-dns.com
   - www → cname.vercel-dns.com
3. 保存设置
```

### **Step 7: 等待 DNS 生效（5-30分钟）**
```
DNS 传播时间：
- 快的：5-10分钟
- 正常：10-30分钟
- 慢的：1-2小时
- 最慢：24-48小时（极少）

期间可以：
- 喝杯咖啡 ☕
- 刷刷手机 📱
- 做其他事情 ✨
```

### **Step 8: 验证域名（5分钟）**
```
回到 Vercel：
1. 刷新 Domains 页面
2. 查看域名状态：
   - 🟡 Pending（等待中）
   - 🟢 Valid（成功！）
   - 🔴 Invalid（失败）

如果成功：
✅ 域名旁边显示绿色对勾
✅ 自动配置 SSL 证书
✅ 可以访问了！

如果失败：
❌ 检查 DNS 配置是否正确
❌ 等待更长时间（可能还在传播）
❌ 联系客服帮忙检查
```

### **Step 9: 测试访问（2分钟）**
```
1. 打开浏览器
2. 访问：https://ai-airdrop.top
3. 检查：
   ✅ 能打开吗？
   ✅ 内容正确吗？
   ✅ 有 🔒 SSL 证书吗？
   ✅ 国内无需翻墙吗？

4. 也测试 www 域名：
   访问：https://www.ai-airdrop.top
```

---

## 🎯 配置示例（截图参考）

### **Vercel Domains 页面：**
```
┌─────────────────────────────────────┐
│ Domains                              │
├─────────────────────────────────────┤
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ ai-airdrop.top           ✅ Valid│ │
│ │ Production Branch: main          │ │
│ │ HTTPS: Enabled                   │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ www.ai-airdrop.top       ✅ Valid│ │
│ │ Redirect to: ai-airdrop.top      │ │
│ └─────────────────────────────────┘ │
│                                      │
└─────────────────────────────────────┘
```

### **Namecheap DNS 配置：**
```
┌─────────────────────────────────────┐
│ Type     Host    Value               │
├─────────────────────────────────────┤
│ CNAME    @       cname.vercel-dns.com│
│ CNAME    www     cname.vercel-dns.com│
└─────────────────────────────────────┘
```

---

## ⚠️ 常见问题

### **Q1: 域名一直是 Pending 状态？**
```
A: 耐心等待
- 通常需要 10-30 分钟
- 检查 DNS 配置是否正确
- 使用 nslookup 检查 DNS 解析
```

### **Q2: 提示 "Invalid Configuration"？**
```
A: DNS 配置错误
- 检查 CNAME 记录是否正确
- 确认 Host 是 @ 或域名
- 确认 Value 是 cname.vercel-dns.com
- 删除冲突的 A 记录
```

### **Q3: www 域名无法访问？**
```
A: 添加 www 的 CNAME 记录
- Host: www
- Value: cname.vercel-dns.com

或在 Vercel 设置重定向
```

### **Q4: SSL 证书未生效？**
```
A: 等待自动配置
- Vercel 自动配置 Let's Encrypt
- 通常需要 5-10 分钟
- 如果超过 1 小时，联系 Vercel 支持
```

### **Q5: 国内还是无法访问？**
```
A: 检查几点
- DNS 是否生效（用 nslookup）
- 域名是否被墙（换个域名）
- Vercel 是否正常（查看 Status）
- 浏览器缓存（清除后重试）
```

---

## 🔍 DNS 检查命令

### **Windows 检查：**
```bash
# 检查域名解析
nslookup ai-airdrop.top

# 应该看到：
# 指向 Vercel 的 CNAME 或 IP
```

### **在线检查工具：**
```
1. https://www.whatsmydns.net
   输入域名，查看全球 DNS 解析状态

2. https://dnschecker.org
   检查 DNS 传播情况

3. https://mxtoolbox.com
   综合 DNS 检查工具
```

---

## 🎨 高级配置（可选）

### **1. 设置默认域名：**
```
Vercel Settings → Domains
→ 点击域名旁边的 "..."
→ 选择 "Set as Production Domain"

作用：
✅ 主域名
✅ SEO 优化
✅ 默认访问
```

### **2. 配置 www 重定向：**
```
Vercel 自动处理：
www.ai-airdrop.top → ai-airdrop.top

或者反过来：
ai-airdrop.top → www.ai-airdrop.top
```

### **3. 添加子域名：**
```
例如：
- api.ai-airdrop.top（API 服务）
- admin.ai-airdrop.top（管理后台）

在 Vercel 添加子域名：
Settings → Domains → Add Domain
输入：api.ai-airdrop.top

在 DNS 添加 CNAME：
Host: api
Value: cname.vercel-dns.com
```

---

## 📋 完成检查清单

### **配置完成后检查：**
```
□ Vercel 显示域名为 Valid（绿色✅）
□ 访问 https://ai-airdrop.top 能打开
□ 访问 https://www.ai-airdrop.top 能打开
□ HTTPS 生效（地址栏显示 🔒）
□ 国内无需翻墙可访问
□ 内容显示正确（V5.1版本）
□ 速度快（<2秒加载）
```

---

## 🎉 恭喜！绑定成功！

**现在您的网站：**
```
✅ 有专业域名（ai-airdrop.top）
✅ 国内可访问（无需翻墙）
✅ 全球加速（Vercel CDN）
✅ 自动 HTTPS（Let's Encrypt）
✅ 自动部署（GitHub 同步）

成本：¥15-30/年
效果：专业、快速、可靠
```

---

## 📞 需要帮助？

### **如果遇到问题：**

**1. DNS 不生效：**
- 等待 24-48 小时
- 检查配置是否正确
- 清除浏览器缓存

**2. SSL 不生效：**
- 等待 Vercel 自动配置
- 通常需要 5-30 分钟

**3. 国内无法访问：**
- 检查域名是否被墙
- 尝试换个域名
- 或使用 Cloudflare CDN

**4. 其他问题：**
- 联系淘宝客服
- 查看 Vercel 文档
- 或者问我 😊

---

**绑定成功后，您的网站就真正专业了！** 🎊

**明天拿到域名后，按照这个教程一步步操作，15分钟搞定！** 🚀

