# 🚀 快速开始指南

欢迎使用 **AI智能空投平台**！按照以下步骤快速启动项目。

## ⚡ 5分钟快速启动

### 1️⃣ 安装依赖

```bash
cd C:\Users\sss\Desktop\AI智能空投
npm install
```

> 💡 首次安装可能需要几分钟时间

### 2️⃣ 配置环境变量

创建 `.env` 文件（复制 `.env.example`）：

```env
# 暂时使用测试配置（后续替换）
VITE_SUPABASE_URL=https://demo.supabase.co
VITE_SUPABASE_ANON_KEY=demo_key
```

### 3️⃣ 启动开发服务器

```bash
npm run dev
```

浏览器会自动打开 http://localhost:3000

---

## 📱 功能预览

### 底部导航栏（4个Tab）

1. **群聊** - 实时聊天大厅，消息10分钟自动删除
2. **AI积分** - 矿机管理，积分兑换U
3. **AI订阅** - 空投信息，AI智能评分
4. **我的** - 个人中心，邀请码，团队管理

### 核心特性

✅ **PWA支持** - 可添加到桌面，像原生App一样使用  
✅ **响应式设计** - 完美适配手机/平板/电脑  
✅ **中英文切换** - 支持多语言  
✅ **实时聊天** - 基于Supabase Realtime  
✅ **代理分销** - 链动2+1模式  
✅ **积分矿机** - 自动释放系统  

---

## 🔧 完整配置（生产环境）

### 1. 注册 Supabase

1. 访问 https://supabase.com
2. 创建免费账号
3. 新建项目（选择区域：Singapore 或 Tokyo）

### 2. 初始化数据库

1. 进入 Supabase Dashboard
2. 点击左侧 **SQL Editor**
3. 新建查询
4. 复制粘贴 `supabase/schema.sql` 内容
5. 点击 **Run** 执行

### 3. 获取API密钥

1. 进入 **Project Settings** → **API**
2. 复制以下信息到 `.env`：
   ```env
   VITE_SUPABASE_URL=你的项目URL
   VITE_SUPABASE_ANON_KEY=你的anon/public密钥
   ```

### 4. 重启开发服务器

```bash
# Ctrl+C 停止当前服务器
npm run dev
```

---

## 🎯 下一步开发计划

### Phase 1: 用户系统（已完成✅）
- [x] 注册/登录
- [x] 邀请码系统
- [x] 多语言支持

### Phase 2: 群聊系统（已完成✅）
- [x] 实时聊天
- [x] 自动加入大厅
- [x] 消息自动删除

### Phase 3: 代理分销（待开发）
- [ ] 成为代理（支付30U）
- [ ] 见点奖计算（8U）
- [ ] 平级见点奖（3U×5层）
- [ ] 直推分红（7U/单）

### Phase 4: 矿机系统（待开发）
- [ ] 购买矿机
- [ ] 每日释放
- [ ] 加速机制
- [ ] 积分兑换U

### Phase 5: 空投机器人（待开发）
- [ ] 币安空投爬虫
- [ ] OKX空投爬虫
- [ ] AI智能评分
- [ ] 群内自动推送

---

## 📚 学习资源

### 技术文档

- [开发指南](docs/DEVELOPMENT.md) - 详细开发文档
- [部署指南](docs/DEPLOYMENT.md) - Netlify部署教程
- [API文档](docs/API.md) - 接口说明（待补充）

### 视频教程

- Vue 3 Composition API - https://www.bilibili.com/video/BV1rs4y1T7Zx
- Supabase 入门 - https://www.youtube.com/watch?v=7uKQBl9uZ00
- TailwindCSS 快速上手 - https://tailwindcss.com/docs

### 社区支持

- GitHub Issues - 提交Bug和功能请求
- Discord群 - 实时交流（待创建）

---

## ❓ 常见问题

### Q: npm install 报错怎么办？

A: 尝试清理缓存：
```bash
npm cache clean --force
npm install
```

### Q: 启动后页面空白？

A: 检查浏览器控制台错误，通常是环境变量未配置

### Q: Supabase连接失败？

A: 确认 `.env` 文件中的URL和密钥是否正确

### Q: 如何添加到手机桌面？

A: 
1. 手机浏览器打开网站
2. Chrome: 点击菜单 → "添加到主屏幕"
3. Safari: 点击分享按钮 → "添加到主屏幕"

---

## 🎉 恭喜！

项目已成功启动！现在你可以：

1. 📝 **注册账号** - 使用测试邀请码：`TEST2024`
2. 💬 **进入群聊** - 发送第一条消息
3. 🛠️ **查看代码** - 开始自定义开发
4. 🚀 **部署上线** - 参考部署指南

---

**有问题？** 查看 [开发指南](docs/DEVELOPMENT.md) 或提交 Issue！

© 2025 AI智能空投平台

