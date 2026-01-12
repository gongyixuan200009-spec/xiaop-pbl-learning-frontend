# Zeabur 部署准备清单

## ✅ 本地测试完成

在部署到 Zeabur 之前，请确保：

- [x] 项目依赖已安装
- [x] 本地开发服务器运行正常（http://localhost:3001）
- [x] Supabase 数据库已配置
- [x] 环境变量已正确设置

## 🚨 重要提醒：生产环境配置

### 问题：内网地址无法在 Zeabur 访问

当前配置使用的是内网地址：
```
NEXT_PUBLIC_SUPABASE_URL=http://10.1.20.75:8000
```

**这个地址只能在本地网络访问，部署到 Zeabur 后将无法连接！**

### 解决方案

你需要选择以下方案之一：

#### 方案 1：使用 Supabase 云服务（推荐）

1. 访问 [supabase.com](https://supabase.com) 注册账号
2. 创建新项目
3. 获取公网 URL 和 API Key
4. 在 Zeabur 配置环境变量时使用云服务地址

**优点：**
- ✅ 完全托管，无需维护
- ✅ 全球 CDN 加速
- ✅ 自动备份
- ✅ 免费额度充足

**示例配置：**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 方案 2：将本地 Supabase 暴露到公网

使用内网穿透工具（如 ngrok、frp、Cloudflare Tunnel）：

**使用 ngrok：**
```bash
# 安装 ngrok
brew install ngrok  # macOS
# 或访问 https://ngrok.com/download

# 启动隧道
ngrok http 10.1.20.75:8000

# 获得公网地址，例如：
# https://abc123.ngrok.io
```

**配置环境变量：**
```
NEXT_PUBLIC_SUPABASE_URL=https://abc123.ngrok.io
```

**缺点：**
- ⚠️ 免费版 URL 会变化
- ⚠️ 需要保持本地服务运行
- ⚠️ 网络延迟较高

#### 方案 3：部署 Supabase 到云服务器

在云服务器（阿里云、腾讯云等）部署 Supabase：

1. 购买云服务器
2. 配置公网 IP
3. 部署 Supabase
4. 配置域名和 SSL

**适用场景：**
- 需要完全控制数据
- 有运维能力
- 预算充足

## 📋 部署前检查清单

### 1. 代码准备

- [ ] 所有代码已提交到本地 Git
- [ ] 没有敏感信息（密码、密钥）在代码中
- [ ] `.gitignore` 已正确配置
- [ ] `package.json` 依赖版本正确

### 2. 环境变量准备

准备以下环境变量（用于 Zeabur 配置）：

**必需变量：**
```bash
# Supabase 配置（使用公网地址）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 可选：AI 功能
OPENAI_API_KEY=sk-your-api-key
```

**可选变量：**
```bash
# Supabase 服务角色密钥（如果需要后端操作）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. GitHub 仓库准备

- [ ] 创建 GitHub 仓库
- [ ] 推送代码到 main 分支
- [ ] 确认所有文件已上传

### 4. Zeabur 账号准备

- [ ] 注册 Zeabur 账号（使用 GitHub 登录）
- [ ] 了解免费额度限制
- [ ] 准备绑定支付方式（如需）

## 🚀 部署步骤

### 步骤 1：推送代码到 GitHub

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 创建提交
git commit -m "Initial commit: PBL Learning Platform"

# 在 GitHub 创建仓库后，添加远程仓库
git remote add origin https://github.com/your-username/pbl-learning.git

# 推送代码
git push -u origin main
```

### 步骤 2：在 Zeabur 导入项目

1. 访问 [zeabur.com](https://zeabur.com)
2. 使用 GitHub 账号登录
3. 点击 **"Create Project"**
4. 选择 **"Import from GitHub"**
5. 授权 Zeabur 访问你的 GitHub
6. 选择 `pbl-learning` 仓库
7. 点击 **"Import"**

### 步骤 3：配置环境变量

在 Zeabur 项目设置中添加环境变量：

**如果使用 Supabase 云服务：**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-...
```

**如果使用内网穿透：**
```
NEXT_PUBLIC_SUPABASE_URL=https://abc123.ngrok.io
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-...
```

### 步骤 4：部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（2-5 分钟）
3. 获得部署 URL：`https://your-project.zeabur.app`

### 步骤 5：验证部署

1. 访问部署的 URL
2. 测试用户注册和登录
3. 测试 AI 对话功能
4. 检查数据库连接

## 🔧 部署后配置

### 配置自定义域名（可选）

1. 在 Zeabur 项目设置中点击 **"Domains"**
2. 添加你的域名
3. 在域名注册商配置 DNS：
   ```
   类型: CNAME
   名称: @
   值: cname.zeabur-dns.com
   ```
4. 等待 DNS 生效

### 配置 Supabase 重定向 URL

如果使用自定义域名，需要在 Supabase 配置重定向 URL：

1. 访问 Supabase Dashboard
2. 进入 **Authentication** → **URL Configuration**
3. 添加 Site URL：
   ```
   https://your-domain.com
   ```
4. 添加 Redirect URLs：
   ```
   https://your-domain.com/**
   https://your-project.zeabur.app/**
   ```

## 📊 监控和维护

### 查看部署日志

在 Zeabur Dashboard：
1. 进入项目页面
2. 点击 **"Deployments"**
3. 查看构建和运行日志

### 查看应用状态

监控：
- CPU 使用率
- 内存使用
- 请求数量
- 错误率

### 自动部署

配置完成后，每次推送代码到 GitHub，Zeabur 会自动：
1. 检测到新提交
2. 拉取最新代码
3. 重新构建
4. 自动部署

## ⚠️ 常见问题

### 问题 1：部署后无法连接 Supabase

**原因：** 使用了内网地址

**解决：**
1. 切换到 Supabase 云服务
2. 或使用内网穿透工具
3. 更新 Zeabur 环境变量
4. 重新部署

### 问题 2：环境变量不生效

**解决：**
1. 检查变量名是否正确
2. 确认是否需要 `NEXT_PUBLIC_` 前缀
3. 重新部署项目

### 问题 3：构建失败

**解决：**
1. 查看构建日志
2. 检查 `package.json` 依赖
3. 本地测试 `npm run build`

## 📚 相关文档

- [ZEABUR_DEPLOY.md](./ZEABUR_DEPLOY.md) - 详细部署指南
- [LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md) - 本地测试指南
- [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) - Supabase 设置指南

## 🎯 推荐方案

**对于生产环境，强烈推荐使用 Supabase 云服务：**

1. ✅ 免费额度充足（500MB 数据库 + 1GB 存储）
2. ✅ 全球 CDN 加速
3. ✅ 自动备份和恢复
4. ✅ 无需维护服务器
5. ✅ 提供公网访问
6. ✅ 与 Zeabur 完美配合

**设置步骤：**
1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目（2 分钟）
3. 在 SQL Editor 运行 `supabase-setup.sql`
4. 复制 URL 和 Key 到 Zeabur
5. 部署完成！

## 下一步

1. ✅ 确认使用哪种 Supabase 方案
2. 🔄 准备环境变量
3. 🔄 推送代码到 GitHub
4. 🔄 在 Zeabur 部署
5. 🔄 测试生产环境

准备好后，按照 `ZEABUR_DEPLOY.md` 开始部署！
