# 🚀 部署到 Netlify

## 当前状态

- **本地地址**：http://localhost:3000
- **生产地址**：https://eth10.netlify.app
- **部署平台**：Netlify

---

## 📋 部署步骤

### 方法 1：自动部署（推荐）

如果已配置 Git 自动部署：

```bash
# 1. 提交代码
git add .
git commit -m "feat: 优化用户体验和页面刷新功能"
git push

# Netlify 会自动检测并部署
```

### 方法 2：手动构建部署

```bash
# 1. 构建生产版本
npm run build

# 2. 部署 dist 目录到 Netlify
# 方式 A：使用 Netlify CLI
netlify deploy --prod

# 方式 B：手动上传
# 登录 https://app.netlify.com
# 选择项目 > Deploys > Drag and drop
# 拖拽 dist 文件夹上传
```

---

## ⚙️ 环境变量配置

确保在 Netlify 中配置了环境变量：

1. 访问 https://app.netlify.com
2. 选择项目
3. Settings > Environment variables
4. 添加：
   - `VITE_SUPABASE_URL`：您的 Supabase URL
   - `VITE_SUPABASE_ANON_KEY`：您的 Supabase 密钥

**重要**：不要使用 `placeholder`，要用真实的 Supabase 配置！

---

## 🔍 今日更新内容

### 修复的问题
1. ✅ 页面刷新保持登录状态
2. ✅ 团队页面移除邀请码和链接
3. ✅ 个人中心移除提现转账按钮
4. ✅ 优化响应速度

### 修改的文件
- `src/App.vue` - 添加加载界面
- `src/lib/supabase.ts` - 优化开发模式判断
- `src/stores/auth.ts` - 优化认证流程
- `src/views/team/TeamView.vue` - 清理邀请码
- `src/views/profile/ProfileView.vue` - 移除按钮

---

## 📊 部署检查清单

### 部署前检查
- [ ] 本地测试通过
- [ ] 构建成功（`npm run build`）
- [ ] 环境变量已配置
- [ ] Supabase 连接正常

### 部署后验证
- [ ] 访问 https://eth10.netlify.app
- [ ] 测试登录功能
- [ ] 测试页面刷新
- [ ] 测试各个功能页面
- [ ] 检查控制台无错误

---

## 🎯 快速部署命令

```bash
# 完整部署流程
npm run build && netlify deploy --prod

# 或者分步执行
npm run build
netlify deploy --prod --dir=dist
```

---

## 🔗 相关链接

- **本地开发**：http://localhost:3000
- **生产环境**：https://eth10.netlify.app
- **Netlify 控制台**：https://app.netlify.com
- **Supabase 控制台**：https://supabase.com/dashboard

---

## 📝 注意事项

1. **环境变量**：生产环境必须配置真实的 Supabase URL
2. **数据库**：确保 Supabase 数据库已正确配置
3. **测试**：部署后务必测试所有功能
4. **回滚**：如有问题，可在 Netlify 控制台回滚到上一版本

---

更新时间：2025-10-11  
当前版本：包含刷新优化和UI清理

