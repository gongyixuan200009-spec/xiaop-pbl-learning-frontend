# Zeabur 部署指南

本项目支持在 Zeabur 平台上一键部署。

## 部署架构

```
GitHub Repository
    ├── backend/     → Zeabur Service (Python/FastAPI)
    └── frontend/    → Zeabur Service (Next.js)
         ↓
    Supabase (PostgreSQL Database)
```

## 前置准备

### 1. Supabase 数据库设置

1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 在 SQL Editor 中执行数据库初始化脚本：
   ```sql
   -- 复制 backend/scripts/init_supabase_schema.sql 的内容并执行
   ```
3. 获取以下信息（在 Project Settings → API）：
   - `SUPABASE_URL`: 项目 URL
   - `SUPABASE_KEY`: anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role key（用于绕过 RLS）

### 2. 准备 GitHub 仓库

1. 将代码推送到 GitHub：
   ```bash
   git add .
   git commit -m "Prepare for Zeabur deployment"
   git push origin main
   ```

## Zeabur 部署步骤

### 步骤 1: 创建项目

1. 登录 [Zeabur](https://zeabur.com)
2. 点击 "New Project"
3. 选择 Region（建议选择离用户最近的区域）

### 步骤 2: 部署后端服务

1. 在项目中点击 "Add Service"
2. 选择 "Git" → 连接你的 GitHub 仓库
3. 选择仓库后，Zeabur 会自动检测到 monorepo
4. 选择 `backend` 目录作为根目录
5. 配置环境变量：

   ```env
   # Supabase 配置
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # JWT 配置
   SECRET_KEY=your_random_secret_key_here_min_32_chars
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=10080

   # CORS 配置（部署后更新）
   CORS_ORIGINS=https://your-frontend.zeabur.app
   ```

6. 点击 "Deploy"

### 步骤 3: 部署前端服务

1. 在同一项目中再次点击 "Add Service"
2. 选择 "Git" → 选择同一个仓库
3. 选择 `frontend` 目录作为根目录
4. 配置环境变量：

   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.zeabur.app
   ```

5. 点击 "Deploy"

### 步骤 4: 配置域名（可选）

1. 在每个服务的设置中，可以：
   - 使用 Zeabur 提供的免费域名
   - 绑定自定义域名

2. 获取域名后，更新后端的 `CORS_ORIGINS` 环境变量

### 步骤 5: 验证部署

1. 访问后端 API 文档：`https://your-backend.zeabur.app/docs`
2. 访问前端应用：`https://your-frontend.zeabur.app`
3. 测试用户注册和登录功能

## 环境变量说明

### 后端必需环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Supabase anon key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGc...` |
| `SECRET_KEY` | JWT 签名密钥（至少32字符） | 随机生成的字符串 |
| `ALGORITHM` | JWT 算法 | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token 过期时间（分钟） | `10080` (7天) |
| `CORS_ORIGINS` | 允许的前端域名 | `https://your-frontend.zeabur.app` |

### 前端必需环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | `https://your-backend.zeabur.app` |

## 常见问题

### 1. 部署失败：找不到 requirements.txt

**解决方案**：确保在 Zeabur 中选择了正确的根目录（`backend`）。

### 2. 前端无法连接后端

**解决方案**：
1. 检查 `NEXT_PUBLIC_API_URL` 是否正确
2. 检查后端的 `CORS_ORIGINS` 是否包含前端域名
3. 确保后端服务已成功部署

### 3. 数据库连接失败

**解决方案**：
1. 检查 Supabase 环境变量是否正确
2. 确认 Supabase 项目状态正常
3. 检查数据库表是否已创建

### 4. JWT Token 验证失败

**解决方案**：
1. 确保 `SECRET_KEY` 至少 32 个字符
2. 前后端的 `SECRET_KEY` 必须一致
3. 检查 Token 是否过期

## 更新部署

### 自动部署

Zeabur 支持 Git 自动部署：
1. 推送代码到 GitHub
2. Zeabur 自动检测并重新部署

### 手动触发

在 Zeabur 控制台中点击 "Redeploy" 按钮。

## 监控和日志

1. 在 Zeabur 控制台查看实时日志
2. 监控服务状态和资源使用
3. 设置告警通知

## 成本估算

Zeabur 提供：
- 免费额度：适合开发和小规模使用
- 按需付费：根据实际使用量计费

详细定价请访问：https://zeabur.com/pricing

## 技术支持

- Zeabur 文档：https://zeabur.com/docs
- Supabase 文档：https://supabase.com/docs
- 项目 Issues：提交到 GitHub Issues

## 安全建议

1. ✅ 使用强密码作为 `SECRET_KEY`
2. ✅ 定期轮换 API 密钥
3. ✅ 启用 Supabase RLS 策略
4. ✅ 限制 CORS 来源
5. ✅ 使用 HTTPS（Zeabur 自动提供）
6. ✅ 定期备份数据库

## 下一步

部署成功后，您可以：
1. 配置 AI 模型提供商（火山引擎、OpenRouter 等）
2. 自定义表单配置
3. 调整年龄适应性规则
4. 设置管理员账号

详细配置请参考 [使用指南](./USAGE_GUIDE.md)。
