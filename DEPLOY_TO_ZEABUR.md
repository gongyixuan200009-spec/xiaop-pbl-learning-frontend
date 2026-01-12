# 🚀 部署到 Zeabur - 完整步骤指南

## ✅ 准备工作已完成

- ✅ 代码已提交到本地 Git 仓库
- ✅ 所有配置文件已准备
- ✅ 本地测试通过

---

## ⚠️ 重要：生产环境 Supabase 配置

**当前问题：** 你的项目使用的是内网 Supabase 地址（`http://10.1.20.75:8000`），这个地址在 Zeabur 上无法访问。

**必须选择以下方案之一：**

### 方案 1：使用 Supabase 云服务（强烈推荐）✨

**优点：**
- ✅ 完全免费（500MB 数据库 + 1GB 存储）
- ✅ 全球 CDN 加速
- ✅ 自动备份
- ✅ 无需维护

**步骤：**

1. **注册 Supabase 云服务**
   - 访问：https://supabase.com
   - 点击 "Start your project"
   - 使用 GitHub 账号登录（推荐）

2. **创建新项目**
   - 点击 "New Project"
   - 填写信息：
     - Name: `pbl-learning`
     - Database Password: 设置一个强密码（记住它）
     - Region: 选择 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`
   - 点击 "Create new project"
   - 等待 2-3 分钟初始化

3. **设置数据库**
   - 项目创建完成后，点击左侧 **SQL Editor**
   - 点击 **New Query**
   - 打开本地项目的 `supabase-setup.sql` 文件
   - 复制全部内容，粘贴到 SQL Editor
   - 点击 **Run** 执行

4. **获取连接信息**
   - 点击左侧 **Settings** → **API**
   - 复制以下信息：
     ```
     Project URL: https://xxxxx.supabase.co
     anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
   - **保存这些信息，稍后在 Zeabur 配置时使用**

### 方案 2：使用内网穿透（临时方案）

如果暂时不想使用云服务，可以用 ngrok：

```bash
# 安装 ngrok
brew install ngrok  # macOS
# 或访问 https://ngrok.com/download

# 启动隧道
ngrok http 10.1.20.75:8000

# 获得公网地址，例如：
# https://abc123.ngrok.io
```

**缺点：**
- ⚠️ 免费版 URL 每次重启会变化
- ⚠️ 需要保持本地服务运行
- ⚠️ 不适合生产环境

---

## 📋 部署步骤

### 步骤 1：推送代码到 GitHub

#### 1.1 创建 GitHub 仓库

1. 访问：https://github.com/new
2. 填写仓库信息：
   - Repository name: `pbl-learning`
   - Description: `AI-powered learning platform with Supabase and Next.js`
   - 选择 **Public** 或 **Private**
   - **不要**勾选 "Add a README file"
   - **不要**勾选 "Add .gitignore"
   - **不要**勾选 "Choose a license"
3. 点击 **"Create repository"**

#### 1.2 推送代码

GitHub 会显示推送命令，复制并在项目目录执行：

```bash
# 添加远程仓库（替换 your-username 为你的 GitHub 用户名）
git remote add origin https://github.com/your-username/pbl-learning.git

# 推送代码
git branch -M main
git push -u origin main
```

**示例：**
```bash
# 如果你的 GitHub 用户名是 zhangsan
git remote add origin https://github.com/zhangsan/pbl-learning.git
git branch -M main
git push -u origin main
```

**如果提示需要登录：**
- 输入 GitHub 用户名
- 输入 Personal Access Token（不是密码）
- 如何获取 Token：https://github.com/settings/tokens

#### 1.3 验证推送成功

访问你的 GitHub 仓库页面，应该看到所有文件已上传。

---

### 步骤 2：在 Zeabur 部署

#### 2.1 注册 Zeabur 账号

1. 访问：https://zeabur.com
2. 点击右上角 **"Sign in"**
3. 选择 **"Continue with GitHub"**（推荐）
4. 授权 Zeabur 访问你的 GitHub 账号

#### 2.2 创建新项目

1. 登录后，点击 **"Create Project"**
2. 输入项目名称：`pbl-learning`
3. 选择区域：
   - **Hong Kong** - 香港（推荐，国内访问快）
   - **Tokyo** - 东京
   - **Singapore** - 新加坡
4. 点击 **"Create"**

#### 2.3 导入 GitHub 仓库

1. 在项目页面，点击 **"Add Service"**
2. 选择 **"Git"**
3. 选择 **"GitHub"**
4. 找到并选择 `pbl-learning` 仓库
5. 点击 **"Import"**

#### 2.4 配置环境变量

Zeabur 会自动检测到 Next.js 项目，现在需要配置环境变量：

1. 在项目页面，点击你的服务（pbl-learning）
2. 点击 **"Variables"** 标签
3. 点击 **"Add Variable"** 添加以下变量：

**如果使用 Supabase 云服务：**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**如果使用内网穿透：**
```
NEXT_PUBLIC_SUPABASE_URL=https://abc123.ngrok.io
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**可选（如果需要 AI 对话功能）：**
```
OPENAI_API_KEY=sk-your-api-key
```

**添加方法：**
- 点击 **"Add Variable"**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: 粘贴你的 Supabase URL
- 点击 **"Save"**
- 重复以上步骤添加其他变量

#### 2.5 部署

1. 环境变量配置完成后，Zeabur 会自动开始部署
2. 你可以在 **"Deployments"** 标签查看部署进度
3. 部署过程大约需要 2-5 分钟

**部署日志示例：**
```
✓ Installing dependencies...
✓ Building Next.js application...
✓ Optimizing production build...
✓ Deployment successful!
```

#### 2.6 获取部署 URL

1. 部署成功后，点击 **"Networking"** 标签
2. 点击 **"Generate Domain"**
3. Zeabur 会自动生成一个免费域名：
   ```
   https://pbl-learning-xxxx.zeabur.app
   ```
4. 点击域名即可访问你的应用！

---

## 🎉 部署完成！

### 验证部署

访问你的 Zeabur 域名，测试以下功能：

1. ✅ 首页正常显示
2. ✅ 用户注册功能
3. ✅ 用户登录功能
4. ✅ Dashboard 显示
5. ✅ （可选）AI 对话功能

### 配置 Supabase 重定向 URL

如果使用 Supabase 云服务，需要配置重定向 URL：

1. 访问 Supabase Dashboard
2. 进入 **Authentication** → **URL Configuration**
3. 在 **Site URL** 添加：
   ```
   https://pbl-learning-xxxx.zeabur.app
   ```
4. 在 **Redirect URLs** 添加：
   ```
   https://pbl-learning-xxxx.zeabur.app/**
   ```
5. 点击 **"Save"**

---

## 🌐 绑定自定义域名（可选）

### 步骤 1：在 Zeabur 添加域名

1. 在项目页面，点击 **"Networking"** 标签
2. 点击 **"Add Domain"**
3. 输入你的域名：`example.com` 或 `www.example.com`
4. 点击 **"Add"**

### 步骤 2：配置 DNS

Zeabur 会显示需要添加的 DNS 记录：

**在你的域名注册商（阿里云、腾讯云、Cloudflare 等）添加：**

```
类型: CNAME
名称: @ 或 www
值: cname.zeabur-dns.com
TTL: 自动或 600
```

**示例（阿里云）：**
1. 登录阿里云控制台
2. 进入 **云解析 DNS** → **域名解析**
3. 选择你的域名，点击 **解析设置**
4. 点击 **添加记录**
5. 填写：
   - 记录类型: `CNAME`
   - 主机记录: `@` 或 `www`
   - 记录值: `cname.zeabur-dns.com`
   - TTL: `10分钟`
6. 点击 **确认**

### 步骤 3：等待生效

- DNS 传播时间：几分钟到 48 小时
- Zeabur 会自动配置 SSL 证书
- 完成后访问：`https://example.com`

---

## 🔄 自动部署

配置完成后，每次推送代码到 GitHub，Zeabur 会自动部署：

```bash
# 修改代码后
git add .
git commit -m "Update feature"
git push

# Zeabur 会自动检测并重新部署
```

---

## 📊 监控和管理

### 查看部署日志

1. 进入项目页面
2. 点击 **"Deployments"** 标签
3. 选择一个部署记录
4. 查看详细日志

### 查看应用状态

在项目页面可以看到：
- CPU 使用率
- 内存使用
- 请求数量
- 响应时间

### 回滚部署

如果新版本有问题：
1. 进入 **"Deployments"** 标签
2. 找到之前的成功部署
3. 点击 **"Redeploy"**

---

## ⚠️ 常见问题

### 问题 1：部署后无法连接 Supabase

**原因：** 使用了内网地址或环境变量配置错误

**解决：**
1. 确认使用的是公网 Supabase 地址
2. 检查环境变量是否正确
3. 重新部署项目

### 问题 2：环境变量不生效

**解决：**
1. 检查变量名拼写是否正确
2. 确认是否需要 `NEXT_PUBLIC_` 前缀
3. 修改环境变量后需要重新部署

### 问题 3：构建失败

**解决：**
1. 查看构建日志找到错误
2. 本地测试 `npm run build`
3. 确认所有依赖都在 `package.json` 中

### 问题 4：域名无法访问

**解决：**
1. 检查 DNS 记录是否正确
2. 等待 DNS 传播（最多 48 小时）
3. 使用 `nslookup your-domain.com` 检查 DNS

---

## 💰 成本说明

### Zeabur 免费额度

- ✅ 免费套餐支持小型项目
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ⚠️ 有一定的资源限制

### Supabase 免费额度

- ✅ 500MB 数据库
- ✅ 1GB 文件存储
- ✅ 50,000 月活用户
- ✅ 无限 API 请求

### 预估月成本

小型项目（<1000 用户）：
- Zeabur: $0-5
- Supabase: $0（免费额度内）
- OpenAI: $10-50（取决于使用量）

**总计：** $10-55/月

---

## 🎯 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] Supabase 云服务已创建（或配置内网穿透）
- [ ] 数据库表已创建（执行 supabase-setup.sql）
- [ ] Zeabur 项目已创建
- [ ] GitHub 仓库已导入
- [ ] 环境变量已配置
- [ ] 部署成功
- [ ] 应用可以访问
- [ ] 用户注册/登录功能正常
- [ ] Supabase 重定向 URL 已配置

---

## 📞 需要帮助？

- [Zeabur 文档](https://zeabur.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Next.js 文档](https://nextjs.org/docs)

---

## 🎉 恭喜！

你的应用已经成功部署到 Zeabur！

**下一步：**
1. 分享你的应用 URL
2. 邀请用户测试
3. 根据反馈持续改进

祝你使用愉快！🚀
