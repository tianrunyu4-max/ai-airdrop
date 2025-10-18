# 🚀 部署到 Vercel 指南

## 方法1：在线部署（推荐，最简单）

### 步骤1：访问 Vercel
```
https://vercel.com/new
```

### 步骤2：导入 GitHub 仓库
1. 点击 "Import Git Repository"
2. 选择 `tianrunyu4-max/ai-airdrop`
3. 点击 "Import"

### 步骤3：配置项目
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 步骤4：添加环境变量（如果需要）
```
VITE_SUPABASE_URL=你的Supabase URL
VITE_SUPABASE_ANON_KEY=你的Supabase Key
```

### 步骤5：点击 Deploy
等待 1-2 分钟，部署完成！

---

## 方法2：使用 CLI（命令行）

### 步骤1：安装 Vercel CLI
```bash
npm i -g vercel
```

### 步骤2：登录
```bash
vercel login
```
会打开浏览器，登录你的账号

### 步骤3：部署
```bash
# 进入项目目录
cd C:\Users\sss\Desktop\AI智能空投

# 首次部署
vercel

# 后续部署（生产环境）
vercel --prod
```

---

## 方法3：GitHub Actions 自动部署

### 创建 `.github/workflows/deploy.yml`
```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🎯 优势对比

| 平台 | 部署速度 | 带宽 | 中国访问 | 配置难度 |
|------|---------|------|----------|---------|
| Vercel | ⭐⭐⭐⭐⭐ | 100GB/月 | ⭐⭐⭐⭐ | ⭐ |
| Cloudflare Pages | ⭐⭐⭐⭐ | 无限制 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Netlify | ⭐⭐⭐ | 100GB/月 | ⭐⭐⭐ | ⭐⭐ |
| GitHub Pages | ⭐⭐ | 100GB/月 | ⭐⭐ | ⭐⭐⭐ |

---

## 📝 注意事项

1. **自动部署**
   - Vercel 会自动监听 GitHub 仓库
   - 每次 push 到 main 分支都会自动部署

2. **预览部署**
   - 每个 Pull Request 都会生成预览链接
   - 方便测试新功能

3. **环境变量**
   - 在 Vercel 面板设置环境变量
   - 不要提交到 Git

4. **自定义域名**
   - 免费版支持自定义域名
   - 自动配置 SSL 证书

---

## 🔗 相关链接

- Vercel 官网：https://vercel.com
- Vercel 文档：https://vercel.com/docs
- Vercel CLI：https://vercel.com/docs/cli

---

*创建时间：2025-10-16*

