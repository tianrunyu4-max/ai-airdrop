# 部署指南

## 📦 部署到 Netlify

### 1. 准备工作

1. 注册 [Netlify](https://netlify.com) 账号
2. 注册 [Supabase](https://supabase.com) 账号
3. 将代码推送到 GitHub

### 2. 配置 Supabase

#### 创建项目

1. 登录 Supabase Dashboard
2. 点击 "New Project"
3. 填写项目名称和数据库密码
4. 选择区域（建议选择离用户最近的）

#### 初始化数据库

1. 进入 SQL Editor
2. 复制 `supabase/schema.sql` 内容
3. 执行SQL脚本

#### 获取API密钥

1. 进入 Project Settings → API
2. 复制 `URL` 和 `anon/public` key

### 3. 部署到 Netlify

#### 方法一：通过 Git 连接

1. 登录 Netlify
2. 点击 "Add new site" → "Import an existing project"
3. 选择 GitHub 并授权
4. 选择项目仓库
5. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
6. 添加环境变量：
   ```
   VITE_SUPABASE_URL=你的Supabase项目URL
   VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥
   ```
7. 点击 "Deploy site"

#### 方法二：通过 Netlify CLI

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 初始化项目
netlify init

# 设置环境变量
netlify env:set VITE_SUPABASE_URL "你的URL"
netlify env:set VITE_SUPABASE_ANON_KEY "你的密钥"

# 部署
netlify deploy --prod
```

### 4. 配置自定义域名（可选）

1. 进入 Site settings → Domain management
2. 点击 "Add custom domain"
3. 按照提示配置DNS记录

### 5. 启用HTTPS

Netlify 会自动为你的站点启用 HTTPS（Let's Encrypt）

## 🔧 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| VITE_SUPABASE_URL | Supabase项目URL | https://xxx.supabase.co |
| VITE_SUPABASE_ANON_KEY | Supabase匿名密钥 | eyJhbGc... |
| VITE_OPENAI_API_KEY | OpenAI API密钥（可选） | sk-... |
| VITE_TELEGRAM_BOT_TOKEN | Telegram机器人Token（可选） | 123456:ABC... |

## 🚀 持续部署

推送到 GitHub 后，Netlify 会自动部署：

```bash
git add .
git commit -m "Update"
git push origin main
```

## 📱 PWA 安装

部署后，用户可以将应用添加到手机桌面：

1. 在浏览器中打开网站
2. 点击浏览器菜单
3. 选择"添加到主屏幕"

## 🔍 监控

- **Netlify Analytics**: 访问量统计
- **Supabase Dashboard**: 数据库监控
- **日志**: Netlify Functions → Logs

## ⚠️ 注意事项

1. 首次部署后，记得在 Supabase 中创建默认聊天大厅
2. 配置好所有环境变量后再部署
3. 定期备份数据库
4. 监控 Supabase 配额使用情况

