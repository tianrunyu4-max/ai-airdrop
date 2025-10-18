# ⚡ **Netlify快速部署（5分钟）**

## 🚀 **一键部署命令：**

### **第1步：安装Netlify CLI**

```powershell
npm install -g netlify-cli
```

---

### **第2步：登录**

```powershell
netlify login
```

（会自动打开浏览器，点击授权）

---

### **第3步：构建项目**

```powershell
npm run build
```

---

### **第4步：部署**

```powershell
netlify deploy
```

**按提示操作：**
1. "Create & configure a new site" → 回车（Yes）
2. "Team" → 回车（默认）
3. "Site name" → 输入：`ai-airdrop-test`
4. "Publish directory" → 输入：`dist`

**看到提示：**
```
Draft URL: https://abc123--ai-airdrop-test.netlify.app
```

**测试草稿版本，没问题后，正式发布：**

```powershell
netlify deploy --prod
```

**完成！获得正式网址：**
```
Live URL: https://ai-airdrop-test.netlify.app
```

---

### **第5步：配置环境变量**

**方法1：通过CLI（推荐）**

```powershell
# 设置Supabase URL
netlify env:set VITE_SUPABASE_URL "你的Supabase URL"

# 设置Supabase密钥
netlify env:set VITE_SUPABASE_ANON_KEY "你的Supabase密钥"
```

**方法2：通过网站后台**

1. 访问：https://app.netlify.com/
2. 选择你的站点
3. "Site settings" → "Environment variables" → "Add a variable"
4. 添加两个变量：
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   ```

**设置完环境变量后，重新部署：**

```powershell
npm run build
netlify deploy --prod
```

---

## ✅ **完成！**

**你的网址：**
```
https://ai-airdrop-test.netlify.app
```

**立即分享给团队测试！**

---

## 🔧 **后续更新：**

**每次修改代码后：**

```powershell
# 1. 构建
npm run build

# 2. 部署
netlify deploy --prod

# 完成！
```

---

## 📱 **获取你的Supabase配置：**

**查看你的.env文件：**

```powershell
cat .env
```

或者手动打开：`C:\Users\sss\Desktop\AI智能空投\.env`

复制这两个值：
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

---

**就是这么简单！** 🎉
























