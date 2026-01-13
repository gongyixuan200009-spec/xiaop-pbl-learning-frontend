# Zeabur 部署快速开始 🚀

## ✅ 代码已推送到 GitHub

仓库地址：https://github.com/gongyixuan200009-spec/xiaop-pbl-learning-frontend

---

## 📋 部署前检查清单

### 1. 数据库准备 ✅

- [x] Supabase 实例运行正常（http://10.1.20.75:8000）
- [x] 数据库表已创建（5 个组织管理表）
- [x] PostgREST 架构缓存已更新（37 个关系）
- [x] REST API 端点已验证

### 2. 环境变量准备

您需要准备以下环境变量：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=http://10.1.20.75:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE

# Supabase 服务角色密钥
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key-here
```

---

## 🚀 Zeabur 部署步骤（5 分钟）

### 步骤 1: 登录 Zeabur

1. 访问 https://zeabur.com
2. 点击右上角 **"Sign in with GitHub"**
3. 授权 Zeabur 访问您的 GitHub 账号

### 步骤 2: 创建新项目

1. 点击 **"Create Project"** 按钮
2. 输入项目名称（例如：`xiaop-pbl-learning`）
3. 点击 **"Create"**

### 步骤 3: 添加服务

1. 在项目页面点击 **"Add Service"**
2. 选择 **"Git"**
3. 选择仓库：`gongyixuan200009-spec/xiaop-pbl-learning-frontend`
4. 选择分支：`main`
5. 点击 **"Deploy"**

### 步骤 4: 配置环境变量

1. 在服务页面点击 **"Variables"** 标签
2. 点击 **"Add Variable"** 添加以下变量：

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   OPENAI_API_KEY
   ```

3. 点击 **"Save"** 保存

### 步骤 5: 重新部署

1. 点击右上角的 **"Redeploy"** 按钮
2. 等待构建完成（约 2-3 分钟）
3. 构建成功后，点击 **"Domains"** 查看访问地址

---

## 🌐 访问您的应用

部署成功后，您会获得一个 Zeabur 域名：

```
https://your-project-name.zeabur.app
```

或者您可以绑定自定义域名。

---

## ⚠️ 重要提示

### 1. Supabase URL 配置

如果您的 Supabase 实例在内网（10.1.20.75），Zeabur 部署的应用将无法访问。

**解决方案**：

#### 方案 A: 使用公网 Supabase（推荐）

1. 在 Supabase Cloud 创建项目：https://supabase.com
2. 运行 `create-tables.sql` 创建表
3. 更新环境变量为公网地址

#### 方案 B: 暴露内网 Supabase 到公网

1. 使用 Cloudflare Tunnel 或 ngrok
2. 配置反向代理
3. 更新环境变量为公网地址

#### 方案 C: 在 Zeabur 部署 Supabase（高级）

1. 在 Zeabur 创建 PostgreSQL 服务
2. 部署 PostgREST 服务
3. 配置环境变量

### 2. CORS 配置

如果遇到 CORS 错误，需要在 Supabase 中配置：

1. 登录 Supabase Studio
2. Settings → API → CORS
3. 添加 Zeabur 域名：`https://your-project-name.zeabur.app`

### 3. OpenAI API Key

确保您的 OpenAI API Key 有足够的额度和权限。

---

## 🧪 测试部署

部署成功后，测试以下功能：

- [ ] 访问首页
- [ ] 用户注册
- [ ] 用户登录
- [ ] 创建项目
- [ ] AI 对话
- [ ] 管理后台

---

## 📊 监控和日志

### 查看部署日志

1. 在 Zeabur 服务页面
2. 点击 **"Logs"** 标签
3. 查看实时日志

### 常见错误

#### 1. 构建失败

```
Error: Cannot find module 'xxx'
```

**解决方案**：检查 `package.json` 依赖是否完整

#### 2. 运行时错误

```
Error: Missing environment variable
```

**解决方案**：检查环境变量是否正确配置

#### 3. Supabase 连接失败

```
Error: Failed to fetch
```

**解决方案**：
- 检查 Supabase URL 是否可访问
- 检查 API Key 是否正确
- 检查 CORS 配置

---

## 🔄 更新部署

### 自动部署

推送代码到 GitHub 后，Zeabur 会自动触发部署：

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### 手动部署

在 Zeabur 服务页面点击 **"Redeploy"** 按钮

---

## 📝 下一步

1. **配置自定义域名**
   - 在 Zeabur 添加域名
   - 配置 DNS 记录

2. **优化性能**
   - 启用 CDN
   - 配置缓存策略
   - 优化图片加载

3. **监控和分析**
   - 设置错误监控
   - 配置性能分析
   - 添加用户分析

4. **安全加固**
   - 启用 RLS 策略
   - 配置 API 限流
   - 添加安全头

---

## 📚 相关文档

- **ZEABUR_DEPLOYMENT_GUIDE.md** - 完整部署指南
- **NEXT_STEPS.md** - 数据库设置指南
- **README.md** - 项目概述
- **DEPLOYMENT_REPORT.md** - 部署状态报告

---

## 🎉 部署完成！

如果一切顺利，您的应用现在应该已经在 Zeabur 上运行了！

访问地址：`https://your-project-name.zeabur.app`

祝您使用愉快！🚀

---

## 📞 获取帮助

- **Zeabur 文档**: https://zeabur.com/docs
- **Zeabur Discord**: https://discord.gg/zeabur
- **项目 Issues**: https://github.com/gongyixuan200009-spec/xiaop-pbl-learning-frontend/issues
