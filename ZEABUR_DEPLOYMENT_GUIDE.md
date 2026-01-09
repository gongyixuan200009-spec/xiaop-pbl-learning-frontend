# 工小助学习助手 - Zeabur 部署指南

## 📋 目录

1. [部署概述](#部署概述)
2. [前置准备](#前置准备)
3. [部署步骤](#部署步骤)
4. [环境变量配置](#环境变量配置)
5. [域名配置](#域名配置)
6. [验证部署](#验证部署)

---

## 部署概述

本指南将帮助你将工小助学习助手项目部署到 Zeabur 平台。

### 项目架构

```
工小助学习助手
├── Frontend (Next.js)  → Zeabur Service 1
├── Backend (FastAPI)   → Zeabur Service 2
└── Supabase (数据库)   → 已部署在 10.1.20.75
```

---

## 前置准备

### 1. 确保 Supabase 迁移完成

在部署到 Zeabur 之前,请确保已完成 [Supabase 迁移](./SUPABASE_MIGRATION_GUIDE.md)。

### 2. 准备 Git 仓库

Zeabur 支持从 Git 仓库部署。确保你的代码已推送到:
- GitHub
- GitLab
- 或其他 Git 托管平台

### 3. 注册 Zeabur 账号

访问 [https://zeabur.com](https://zeabur.com) 注册账号。

---

## 部署步骤

### 步骤 1: 创建新项目

1. 登录 Zeabur Dashboard
2. 点击 **Create Project**
3. 输入项目名称: `xiaop-learning-assistant`
4. 选择区域 (建议选择离你的 Supabase 服务器最近的区域)

### 步骤 2: 部署后端服务

#### 2.1 添加服务

1. 在项目页面点击 **Add Service**
2. 选择 **Git** 作为服务来源
3. 连接你的 Git 仓库
4. 选择 `xiaop-v2-dev-deploy` 仓库

#### 2.2 配置后端服务

1. **服务名称**: `backend`
2. **根目录**: `/backend`
3. **构建命令**: 自动检测 (Zeabur 会识别 Dockerfile)
4. **端口**: `8504`

#### 2.3 配置环境变量

在后端服务的 **Environment Variables** 中添加:

```env
SUPABASE_URL=http://10.1.20.75:8000
SUPABASE_ANON_KEY=你的匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
SECRET_KEY=xiaop-v3-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ENVIRONMENT=production
DEBUG=false
```

#### 2.4 部署后端

点击 **Deploy** 按钮,Zeabur 会自动:
1. 拉取代码
2. 构建 Docker 镜像
3. 启动服务

等待部署完成(通常需要 2-5 分钟)。

### 步骤 3: 部署前端服务

#### 3.1 添加前端服务

1. 在同一项目中点击 **Add Service**
2. 选择 **Git** 作为服务来源
3. 选择同一个仓库
4. 配置服务

#### 3.2 配置前端服务

1. **服务名称**: `frontend`
2. **根目录**: `/frontend`
3. **构建命令**: 自动检测 (Zeabur 会识别 Next.js)
4. **端口**: `3000`

#### 3.3 配置前端环境变量

在前端服务的 **Environment Variables** 中添加:

```env
NEXT_PUBLIC_API_URL=https://你的后端域名.zeabur.app
```

**注意**: 后端域名需要在后端服务部署完成后获取。

#### 3.4 部署前端

点击 **Deploy** 按钮开始部署。

---

## 域名配置

### 步骤 1: 获取服务域名

部署完成后,Zeabur 会自动为每个服务分配一个域名:

1. 后端服务: `backend-xxx.zeabur.app`
2. 前端服务: `frontend-xxx.zeabur.app`

### 步骤 2: 配置自定义域名 (可选)

如果你有自己的域名:

#### 后端域名配置

1. 在后端服务页面点击 **Domains**
2. 点击 **Add Domain**
3. 输入你的域名,如: `api.yourdomain.com`
4. 在你的 DNS 提供商处添加 CNAME 记录:
   ```
   api.yourdomain.com → backend-xxx.zeabur.app
   ```

#### 前端域名配置

1. 在前端服务页面点击 **Domains**
2. 点击 **Add Domain**
3. 输入你的域名,如: `app.yourdomain.com`
4. 在你的 DNS 提供商处添加 CNAME 记录:
   ```
   app.yourdomain.com → frontend-xxx.zeabur.app
   ```

### 步骤 3: 更新前端环境变量

配置自定义域名后,需要更新前端的 API URL:

1. 进入前端服务的 **Environment Variables**
2. 更新 `NEXT_PUBLIC_API_URL` 为你的后端域名
3. 重新部署前端服务


---

## 验证部署

### 1. 检查服务状态

在 Zeabur Dashboard 中:
- 确认两个服务都显示为 **Running** 状态
- 查看部署日志,确认没有错误

### 2. 测试后端 API

```bash
# 测试健康检查
curl https://你的后端域名.zeabur.app/health

# 预期响应
{"status":"ok"}

# 测试根路径
curl https://你的后端域名.zeabur.app/

# 预期响应
{"name":"工小助学习助手 API","version":"3.0.0","status":"running"}
```

### 3. 测试前端访问

1. 在浏览器中访问前端域名
2. 确认页面正常加载
3. 测试登录功能
4. 测试聊天功能

### 4. 检查数据库连接

在后端服务的日志中查找:
- Supabase 连接成功的日志
- 没有数据库连接错误

---

## 环境变量配置

### 完整的环境变量列表

#### 后端环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| SUPABASE_URL | Supabase API 端点 | http://10.1.20.75:8000 |
| SUPABASE_ANON_KEY | Supabase 匿名密钥 | eyJhbGci... |
| SUPABASE_SERVICE_ROLE_KEY | Supabase 服务角色密钥 | eyJhbGci... |
| SECRET_KEY | JWT 密钥 | 随机字符串 |
| ALGORITHM | JWT 算法 | HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token 过期时间(分钟) | 10080 |
| ENVIRONMENT | 运行环境 | production |
| DEBUG | 调试模式 | false |

#### 前端环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| NEXT_PUBLIC_API_URL | 后端 API 地址 | https://backend-xxx.zeabur.app |


---

## 常见问题

### Q1: 部署失败怎么办?

**A**: 检查以下几点:
1. 查看部署日志中的错误信息
2. 确认 Dockerfile 配置正确
3. 确认环境变量已正确设置
4. 检查端口配置是否正确

### Q2: 前端无法连接后端?

**A**: 可能的原因:
1. `NEXT_PUBLIC_API_URL` 配置错误
2. 后端服务未正常运行
3. CORS 配置问题 - 需要在后端 `config.py` 中添加前端域名到 `CORS_ORIGINS`

### Q3: 数据库连接失败?

**A**: 检查:
1. Supabase 服务是否正常运行
2. 环境变量中的 Supabase URL 和密钥是否正确
3. 网络连接是否正常(Zeabur 服务器能否访问 10.1.20.75)

### Q4: 如何查看日志?

**A**: 在 Zeabur Dashboard 中:
1. 点击服务名称
2. 选择 **Logs** 标签
3. 查看实时日志或历史日志

### Q5: 如何更新部署?

**A**: 
1. 推送代码到 Git 仓库
2. Zeabur 会自动检测并重新部署
3. 或者在 Dashboard 中手动点击 **Redeploy**


---

## 监控和维护

### 1. 性能监控

Zeabur 提供基本的监控功能:
- CPU 使用率
- 内存使用率
- 网络流量
- 请求数量

### 2. 日志管理

建议:
- 定期查看应用日志
- 关注错误和警告信息
- 使用日志过滤功能快速定位问题

### 3. 备份策略

重要数据备份:
1. **Supabase 数据库**: 定期导出数据库备份
2. **用户上传文件**: 使用 Supabase Storage 的备份功能
3. **配置文件**: 保存在 Git 仓库中

### 4. 扩容建议

当流量增加时:
1. 在 Zeabur 中升级服务规格
2. 考虑使用 CDN 加速静态资源
3. 优化数据库查询性能

---

## 成本估算

### Zeabur 定价

- **免费套餐**: 适合开发和测试
- **付费套餐**: 根据资源使用量计费

### 预估成本

对于中小规模应用:
- 后端服务: $5-20/月
- 前端服务: $5-15/月
- 总计: $10-35/月

**注意**: Supabase 自托管版本无额外费用。

---

## 下一步

完成部署后,建议:

1. ✅ 配置监控和告警
2. ✅ 设置自动备份
3. ✅ 优化性能和安全性
4. ✅ 编写用户文档
5. ✅ 进行压力测试

---

## 相关文档

- [Supabase 迁移指南](./SUPABASE_MIGRATION_GUIDE.md)
- [Zeabur 官方文档](https://zeabur.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [FastAPI 部署文档](https://fastapi.tiangolo.com/deployment/)

---

## 技术支持

如遇到问题,可以:
1. 查看本文档的常见问题部分
2. 查看 Zeabur 官方文档
3. 检查应用日志
4. 联系技术支持团队

---

**祝部署顺利! 🚀**
