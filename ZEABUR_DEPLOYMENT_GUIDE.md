# Zeabur 部署指南

## 📋 部署前准备

### 1. 确保您有以下信息

- ✅ GitHub 账号
- ✅ Zeabur 账号（使用 GitHub 登录）
- ✅ Supabase 实例（已部署并运行）
- ✅ OpenAI API Key 或其他 AI 模型 API Key

### 2. Supabase 配置信息

您需要从 Supabase 获取以下信息：

```bash
# Supabase URL（公网地址）
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.com

# Supabase Anon Key（匿名密钥）
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key（服务角色密钥，仅后端使用）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 数据库直连 URL（可选）
DATABASE_URL=postgresql://postgres:password@host:port/postgres
```

---

## 🚀 Zeabur 部署步骤

### 步骤 1: 推送代码到 GitHub

代码已经推送到：
```
https://github.com/gongyixuan200009-spec/xiaop-pbl-learning-frontend
```

### 步骤 2: 登录 Zeabur

1. 访问 [Zeabur](https://zeabur.com)
2. 使用 GitHub 账号登录
3. 授权 Zeabur 访问您的 GitHub 仓库

### 步骤 3: 创建新项目

1. 点击 **"Create Project"**
2. 选择 **"Deploy from GitHub"**
3. 选择仓库：`gongyixuan200009-spec/xiaop-pbl-learning-frontend`
4. 选择分支：`main`

### 步骤 4: 配置环境变量

在 Zeabur 项目设置中，添加以下环境变量：

#### 必需的环境变量

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=http://10.1.20.75:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE

# Supabase 服务角色密钥
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q

# AI API Key（选择一个）
OPENAI_API_KEY=your-openai-api-key-here
```

#### 可选的环境变量

```bash
# 数据库直连（用于迁移等）
DATABASE_URL=postgresql://postgres:your-password@10.1.20.75:5432/postgres

# Node 环境
NODE_ENV=production
```

### 步骤 5: 部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（通常需要 2-5 分钟）
3. 构建成功后，Zeabur 会自动分配一个域名

---

## 🌐 访问您的应用

部署成功后，您可以通过以下方式访问：

1. **Zeabur 默认域名**
   ```
   https://your-project-name.zeabur.app
   ```

2. **自定义域名**（可选）
   - 在 Zeabur 项目设置中添加自定义域名
   - 配置 DNS 记录指向 Zeabur

---

## 🔧 部署后配置

### 1. 验证部署

访问您的应用并测试以下功能：

- ✅ 用户注册
- ✅ 用户登录
- ✅ 项目创建
- ✅ AI 对话
- ✅ 管理后台

### 2. 配置 Supabase CORS

如果遇到 CORS 错误，需要在 Supabase 中配置允许的域名：

1. 登录 Supabase Studio
2. 进入 Settings → API
3. 在 CORS 设置中添加您的 Zeabur 域名：
   ```
   https://your-project-name.zeabur.app
   ```

### 3. 更新环境变量

如果需要更新环境变量：

1. 在 Zeabur 项目设置中修改环境变量
2. 点击 **"Redeploy"** 重新部署

---

## 📊 监控和日志

### 查看部署日志

1. 在 Zeabur 项目页面
2. 点击 **"Logs"** 标签
3. 查看实时日志和错误信息

### 常见问题排查

#### 1. 构建失败

```bash
# 检查 package.json 中的依赖
# 确保所有依赖都已正确安装
npm install
```

#### 2. 运行时错误

```bash
# 检查环境变量是否正确配置
# 查看 Zeabur 日志获取详细错误信息
```

#### 3. Supabase 连接失败

```bash
# 确保 NEXT_PUBLIC_SUPABASE_URL 是公网可访问的地址
# 检查 Supabase 防火墙设置
# 验证 API Key 是否正确
```

---

## 🔄 持续部署

### 自动部署

Zeabur 会自动监听 GitHub 仓库的变化：

1. 推送代码到 `main` 分支
2. Zeabur 自动触发构建
3. 构建成功后自动部署

### 手动部署

在 Zeabur 项目页面点击 **"Redeploy"** 按钮

---

## 📝 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 实例 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | ✅ |
| `OPENAI_API_KEY` | OpenAI API 密钥 | ✅ |
| `DATABASE_URL` | 数据库直连 URL | ❌ |
| `NODE_ENV` | Node 环境 | ❌ |

---

## 🎯 性能优化建议

### 1. 启用 CDN

Zeabur 自动为静态资源启用 CDN，无需额外配置。

### 2. 配置缓存

在 `next.config.js` 中配置缓存策略：

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

### 3. 优化构建

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start -p $PORT"
  }
}
```

---

## 🔒 安全建议

### 1. 环境变量安全

- ✅ 不要在代码中硬编码敏感信息
- ✅ 使用 Zeabur 的环境变量管理
- ✅ 定期轮换 API 密钥

### 2. Supabase 安全

- ✅ 启用 Row Level Security (RLS)
- ✅ 配置适当的访问策略
- ✅ 限制 API 访问频率

### 3. CORS 配置

- ✅ 只允许信任的域名
- ✅ 不要使用 `*` 通配符

---

## 📞 获取帮助

### Zeabur 支持

- 文档：https://zeabur.com/docs
- Discord：https://discord.gg/zeabur
- GitHub：https://github.com/zeabur/zeabur

### 项目支持

如果遇到项目相关问题，请查看：

1. `README.md` - 项目概述
2. `NEXT_STEPS.md` - 数据库设置指南
3. `DEPLOYMENT_REPORT.md` - 部署报告

---

## ✅ 部署检查清单

部署前请确认：

- [ ] 代码已推送到 GitHub
- [ ] Supabase 实例正常运行
- [ ] 数据库表已创建（5 个组织管理表）
- [ ] 环境变量已准备好
- [ ] OpenAI API Key 有效
- [ ] 已测试本地开发环境

部署后请验证：

- [ ] 应用可以正常访问
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 项目创建功能正常
- [ ] AI 对话功能正常
- [ ] 管理后台可访问

---

## 🎉 部署成功！

恭喜！您的应用已成功部署到 Zeabur。

访问您的应用：`https://your-project-name.zeabur.app`

祝您使用愉快！🚀
