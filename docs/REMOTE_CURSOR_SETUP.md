# 🏠 在家远程使用Cursor完整指南

## 📋 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| SSH远程开发 | 直接编辑远程代码，体验最佳 | 需要SSH访问权限 | ⭐⭐⭐⭐⭐ |
| 向日葵/ToDesk | 简单易用，图形界面 | 延迟较高，体验一般 | ⭐⭐⭐ |
| VPN | 访问内网资源 | 需要公司支持 | ⭐⭐⭐⭐ |
| 端口转发 | 灵活 | 配置复杂 | ⭐⭐ |

---

## 🎯 方案1：SSH远程开发（最佳方案）

### 步骤1：准备SSH密钥

#### Windows PowerShell：
```powershell
# 生成SSH密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 按提示操作：
# - 文件位置：直接回车（默认 C:\Users\你的用户名\.ssh\id_rsa）
# - 密码：可以设置或留空（直接回车）

# 查看公钥
type C:\Users\你的用户名\.ssh\id_rsa.pub
```

### 步骤2：将公钥添加到远程服务器

```bash
# 在远程服务器上执行：
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 将你的公钥内容添加到 authorized_keys
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 步骤3：配置SSH Config

编辑 `C:\Users\你的用户名\.ssh\config`：

```ssh-config
# 工作电脑
Host my-work-pc
    HostName 你的公网IP或域名
    User 你的用户名
    Port 22
    IdentityFile ~/.ssh/id_rsa
    ServerAliveInterval 60
```

### 步骤4：在Cursor中使用

1. **安装Remote-SSH扩展**（如果未安装）
   - Ctrl+Shift+X 打开扩展
   - 搜索 "Remote - SSH"
   - 点击安装

2. **连接远程服务器**
   - 按 `F1` 或 `Ctrl+Shift+P`
   - 输入 `Remote-SSH: Connect to Host`
   - 选择你配置的 `my-work-pc`
   - 等待连接成功

3. **打开远程项目**
   - File → Open Folder
   - 选择远程服务器上的项目目录
   - 开始编码！

---

## 🎯 方案2：通过跳板机连接

### 适用场景
- 目标服务器在公司内网
- 需要通过跳板机才能访问

### SSH Config配置

```ssh-config
# 跳板机
Host jumpserver
    HostName jump.company.com
    User jump-user
    Port 22
    IdentityFile ~/.ssh/id_rsa

# 目标开发机（通过跳板机）
Host work-dev
    HostName 192.168.1.100  # 内网IP
    User dev-user
    Port 22
    ProxyJump jumpserver
    IdentityFile ~/.ssh/id_rsa
    ServerAliveInterval 60
```

### 连接方式
直接连接 `work-dev`，SSH会自动通过跳板机跳转。

---

## 🎯 方案3：端口转发（访问内网服务）

### 适用场景
- 需要访问远程服务器上的Web服务
- 数据库连接
- 其他网络服务

### 配置方式

```ssh-config
Host work-dev-forward
    HostName your-server.com
    User your-username
    Port 22
    # 转发远程3000端口到本地3000
    LocalForward 3000 localhost:3000
    # 转发远程8080端口到本地8080
    LocalForward 8080 localhost:8080
    # 转发远程MySQL
    LocalForward 3306 localhost:3306
```

### 使用方式
```bash
# 建立连接后，在本地访问：
# http://localhost:3000  → 访问远程3000端口
# http://localhost:8080  → 访问远程8080端口
```

---

## 🎯 方案4：动态端口转发（SOCKS代理）

### 配置
```ssh-config
Host work-proxy
    HostName your-server.com
    User your-username
    Port 22
    DynamicForward 1080  # 创建SOCKS代理
```

### 使用方式
1. 连接后，本地1080端口会作为SOCKS代理
2. 浏览器配置代理：`socks5://127.0.0.1:1080`
3. 所有流量通过远程服务器

---

## 🎯 方案5：远程桌面软件

### 向日葵远程控制
1. 在工作电脑上安装向日葵客户端
2. 注册账号并绑定
3. 在家用手机/电脑登录向日葵
4. 远程控制工作电脑

**优点**：
- ✅ 简单易用
- ✅ 支持手机操作
- ✅ 适合非技术用户

**缺点**：
- ❌ 延迟较高
- ❌ 需要保持电脑开机

### ToDesk
类似向日葵，免费版速度更快。

---

## 🎯 方案6：VPN（最稳定）

### 公司VPN
如果公司提供VPN：
1. 安装公司VPN客户端
2. 连接后，直接SSH到内网IP
3. 就像在公司一样使用

### 自建VPN（WireGuard）
```bash
# 在服务器上安装WireGuard
# 配置客户端连接
# 连接后访问内网资源
```

---

## 🛠️ 常见问题排查

### 问题1：连接超时
```bash
# 测试连接
ssh -v your-username@your-server.com

# 检查防火墙
# Windows: 允许SSH客户端出站
# 服务器: 允许22端口入站
```

### 问题2：公钥认证失败
```bash
# 检查权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 检查公钥是否正确
cat ~/.ssh/authorized_keys
```

### 问题3：连接断开
```ssh-config
# 在SSH config中添加保持连接的配置
ServerAliveInterval 60
ServerAliveCountMax 3
TCPKeepAlive yes
```

### 问题4：速度慢
```ssh-config
# 启用压缩
Compression yes

# 使用更快的加密算法
Ciphers aes128-gcm@openssh.com,aes256-gcm@openssh.com
```

---

## 🔒 安全建议

### 1. 使用密钥认证
```bash
# 禁用密码登录（服务器端）
sudo vim /etc/ssh/sshd_config
# 设置：PasswordAuthentication no
sudo systemctl restart sshd
```

### 2. 修改默认端口
```bash
# 修改SSH端口（服务器端）
# /etc/ssh/sshd_config
Port 2222  # 改为非标准端口
```

### 3. 使用fail2ban防暴力破解
```bash
# 安装fail2ban
sudo apt install fail2ban
```

### 4. 限制访问IP
```bash
# 只允许特定IP访问SSH
# /etc/hosts.allow
sshd: 你的家庭IP
```

---

## 📱 手机远程编码

### Termius（推荐）
- 支持SSH连接
- 代码高亮
- 可以编辑文件

### Blink Shell（iOS）
- 专业的iOS SSH客户端
- 支持mosh协议
- 低延迟

### JuiceSSH（Android）
- 功能强大
- 支持端口转发
- 可以保存配置

---

## 🎬 快速开始

### 1分钟快速配置：

```powershell
# Windows PowerShell

# 1. 生成密钥（如果没有）
if (!(Test-Path ~/.ssh/id_rsa)) {
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N '""'
}

# 2. 查看公钥
Get-Content ~/.ssh/id_rsa.pub | clip
Write-Host "公钥已复制到剪贴板！"
Write-Host "请在远程服务器执行："
Write-Host "mkdir -p ~/.ssh && echo '粘贴公钥' >> ~/.ssh/authorized_keys"

# 3. 创建SSH配置
@"
Host my-remote
    HostName 你的IP或域名
    User 你的用户名
    Port 22
    IdentityFile ~/.ssh/id_rsa
    ServerAliveInterval 60
"@ | Out-File -FilePath ~/.ssh/config -Encoding utf8

Write-Host "配置完成！在Cursor中使用 Remote-SSH 连接 'my-remote'"
```

---

## 📚 参考资源

- [SSH官方文档](https://www.openssh.com/manual.html)
- [VS Code Remote开发](https://code.visualstudio.com/docs/remote/remote-overview)
- [Cursor文档](https://cursor.sh/docs)
- [WireGuard VPN](https://www.wireguard.com/)

---

## 💡 最佳实践

1. **使用SSH密钥**，不要用密码
2. **配置好SSH config**，方便快速连接
3. **使用tmux**，防止连接断开后丢失工作
4. **定期备份代码**到Git
5. **使用VPN**，获得最稳定的体验

---

**需要帮助？** 告诉我你的具体情况（公司环境、网络情况），我可以提供针对性的配置方案！

**最后更新**：2025-01-02






