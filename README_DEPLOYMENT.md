# 工小助学习助手 - Supabase + Zeabur 部署完整指南

## 🎯 项目概述

工小助学习助手是一个基于 AI 的学习辅助系统，采用 Next.js (前端) + FastAPI (后端) + Supabase (数据库) 架构。

### 当前架构

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Next.js        │─────▶│  FastAPI        │─────▶│  Supabase       │
│  Frontend       │      │  Backend        │      │  PostgreSQL     │
│  (Zeabur)       │      │  (Zeabur)       │      │  (10.1.20.75)   │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## 📦 已创建的文件

本次迁移已创建以下文件和文档:

### 数据库迁移

- ✅ `backend/scripts/supabase_migration.sql` - 数据库表结构定义
- ✅ `backend/scripts/migrate_to_supabase.py` - 数据迁移工具

### 后端服务层

- ✅ `backend/services/supabase_client.py` - Supabase 客户端
- ✅ `backend/services/user_service.py` - 用户服务
- ✅ `backend/services/project_service.py` - 项目服务
- ✅ `backend/services/config_service.py` - 配置服务

### 配置文件

- ✅ `backend/.env.example` - 环境变量模板
- ✅ `backend/config_v3.py` - 更新的配置文件（支持环境变量）
- ✅ `backend/requirements.txt` - 已更新 Python 依赖

### 部署配置

- ✅ `backend/Dockerfile` - 后端容器化配置
- ✅ `frontend/Dockerfile` - 前端容器化配置
- ✅ `zbpack.json` - Zeabur 配置

### 文档

- ✅ `SUPABASE_MIGRATION_GUIDE.md` - Supabase 迁移详细指南
- ✅ `ZEABUR_DEPLOYMENT_GUIDE.md` - Zeabur 部署详细指南
- ✅ `MIGRATION_SUMMARY.md` - 迁移总结
- ✅ `README_DEPLOYMENT.md` - 本文档

### 工具脚本

- ✅ `quick_deploy.sh` - 快速部署脚本

---

## 🚀 快速开始

### 方式一: 使用快速部署脚本（推荐）

```bash
# 运行快速部署脚本
bash quick_deploy.sh
```

脚本会自动检查:
- ✅ 系统依赖（Git, Python, Node.js）
- ✅ Git 仓库状态
- ✅ 环境配置文件
- ✅ Dockerfile 配置
- ✅ 并引导你完成 Git 提交和推送

### 方式二: 手动部署

#### 第一步: 数据库迁移

1. **访问 Supabase Dashboard**
   ```
   URL: http://10.1.20.75:3000
   用户名: supabase
   密码: supabase-dashboard-2025
   ```

2. **执行数据库迁移脚本**
   - 进入 SQL Editor
   - 复制 `backend/scripts/supabase_migration.sql` 的内容
   - 执行脚本

3. **配置环境变量**
   ```bash
   cd backend
   cp .env.example .env
   # 编辑 .env 文件，填入正确的配置
   ```

4. **运行数据迁移**
   ```bash
   pip install -r requirements.txt
   python scripts/migrate_to_supabase.py
   ```

详细步骤请参考: [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md)

#### 第二步: 部署到 Zeabur

1. **推送代码到 Git 仓库**
   ```bash
   git add .
   git commit -m "Add Supabase integration and Zeabur deployment"
   git push
   ```

2. **在 Zeabur 创建项目**
   - 访问 https://zeabur.com
   - 创建新项目: `xiaop-learning-assistant`

3. **部署后端服务**
   - 添加服务 → 选择 Git 仓库
   - 根目录: `/backend`
   - 端口: `8504`
   - 配置环境变量（参考 backend/.env.example）

4. **部署前端服务**
   - 添加服务 → 选择 Git 仓库
   - 根目录: `/frontend`
   - 端口: `3000`
   - 配置 `NEXT_PUBLIC_API_URL` 为后端服务的 URL

详细步骤请参考: [ZEABUR_DEPLOYMENT_GUIDE.md](./ZEABUR_DEPLOYMENT_GUIDE.md)

---

## 📋 环境变量配置

### 后端环境变量 (backend/.env)

```env
# Supabase 配置
SUPABASE_URL=http://10.1.20.75:8000
SUPABASE_ANON_KEY=你的匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥

# 数据库直连 (可选)
DATABASE_URL=postgresql://postgres:密码@10.1.20.75:5432/postgres

# JWT 配置
SECRET_KEY=xiaop-v3-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# 环境配置
ENVIRONMENT=production
DEBUG=false
STORAGE_MODE=supabase  # 使用 Supabase 存储

# CORS 配置 (可选)
CORS_ORIGINS=https://your-frontend-domain.zeabur.app
```

### 前端环境变量 (frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=https://你的后端域名.zeabur.app
```

---

## 🗄️ 数据库架构

### 核心表结构

| 表名 | 说明 | 主要字段 |
|------|------|---------|
| `users` | 用户信息 | id, username, password_hash, role |
| `form_configs` | 表单配置 | id, name, config_data |
| `api_configs` | API 配置 | id, name, config_data |
| `pipeline_configs` | Pipeline 配置 | id, name, config_data |
| `user_projects` | 用户项目 | id, user_id, project_name |
| `project_step_data` | 项目步骤数据 | id, project_id, step_name, data |
| `prompt_history` | 提示词历史 | id, user_id, prompt, response |
| `user_uploads` | 文件上传 | id, user_id, file_name, file_url |
| `age_adaptation_configs` | 年龄适配配置 | id, age_range, config_data |

所有表都包含:
- `created_at` - 创建时间
- `updated_at` - 更新时间（自动更新）

---

## 🔧 开发环境设置

### 后端开发

```bash
# 1. 进入后端目录
cd backend

# 2. 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 安装依赖
pip install -r requirements.txt

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 5. 运行开发服务器
python main.py
# 或使用 uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8504
```

### 前端开发

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件

# 4. 运行开发服务器
npm run dev
```

访问: http://localhost:3000

---

## 📊 数据迁移内容

以下数据会从 JSON 文件迁移到 Supabase:

- ✅ 用户数据 (`data/users.json`)
- ✅ 表单配置 (`data/form_config.json`)
- ✅ API 配置 (`data/api_key_config.json`)
- ✅ Pipeline 配置 (`data/pipelines.json`)
- ✅ 用户进度 (`data/user_progress/*.json`)
- ✅ 提示词历史 (`data/prompt_history.json`)

迁移工具会:
1. 验证 Supabase 连接
2. 读取 JSON 文件
3. 转换数据格式
4. 批量插入到数据库
5. 验证数据完整性

---

## ✅ 验证清单

### 数据库迁移验证

- [ ] Supabase 服务正常运行
- [ ] 所有表已成功创建
- [ ] 数据迁移完成，无错误
- [ ] 可以通过 SQL 查询数据
- [ ] RLS 策略已启用

### 后端部署验证

- [ ] 后端服务状态为 "Running"
- [ ] 健康检查接口返回正常: `GET /health`
- [ ] 根路径接口返回正常: `GET /`
- [ ] 可以连接到 Supabase
- [ ] 环境变量配置正确

### 前端部署验证

- [ ] 前端服务状态为 "Running"
- [ ] 页面可以正常访问
- [ ] 可以连接到后端 API
- [ ] 登录功能正常
- [ ] 聊天功能正常

---

## 🐛 常见问题

### Q1: 数据库迁移失败？

**可能原因**:
- Supabase 服务未运行
- 环境变量配置错误
- 网络连接问题

**解决方法**:
1. 检查 Supabase 服务状态: `docker ps | grep supabase`
2. 验证环境变量: `python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('SUPABASE_URL'))"`
3. 测试连接: `curl http://10.1.20.75:8000`

### Q2: Zeabur 部署失败？

**可能原因**:
- Dockerfile 配置错误
- 依赖安装失败
- 端口配置错误

**解决方法**:
1. 查看 Zeabur 部署日志
2. 本地测试 Docker 构建: `docker build -t test-backend ./backend`
3. 检查 requirements.txt / package.json

### Q3: 前端无法连接后端？

**可能原因**:
- `NEXT_PUBLIC_API_URL` 配置错误
- CORS 配置问题
- 后端服务未运行

**解决方法**:
1. 验证环境变量是否正确
2. 在后端 `config.py` 中添加前端域名到 `CORS_ORIGINS`
3. 重新部署前端服务

### Q4: 如何查看日志？

**Zeabur**:
- Dashboard → 选择服务 → Logs 标签

**Supabase**:
- Dashboard → Database → Logs
- 或使用 SQL: `SELECT * FROM logs ORDER BY created_at DESC LIMIT 100;`

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) | 迁移总结和快速概览 |
| [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md) | Supabase 迁移详细指南 |
| [ZEABUR_DEPLOYMENT_GUIDE.md](./ZEABUR_DEPLOYMENT_GUIDE.md) | Zeabur 部署详细指南 |

### 外部资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Zeabur 官方文档](https://zeabur.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [FastAPI 部署文档](https://fastapi.tiangolo.com/deployment/)

---

## 🎯 部署后检查清单

完成部署后，请执行以下检查:

### 1. 服务健康检查
```bash
# 检查后端健康状态
curl https://你的后端域名.zeabur.app/health

# 检查后端 API
curl https://你的后端域名.zeabur.app/

# 检查前端
curl https://你的前端域名.zeabur.app/
```

### 2. 数据库连接测试
```bash
# 在后端服务器上执行
python -c "from services.supabase_client import get_supabase; print(get_supabase().table('users').select('*').limit(1).execute())"
```

### 3. 功能测试
- [ ] 用户注册
- [ ] 用户登录
- [ ] 创建项目
- [ ] 聊天功能
- [ ] 文件上传
- [ ] 配置管理

### 4. 性能测试
- [ ] 页面加载时间 < 3秒
- [ ] API 响应时间 < 500ms
- [ ] 数据库查询时间 < 200ms

---

## 💡 最佳实践

### 安全性

1. **环境变量**: 永远不要将敏感信息提交到 Git
2. **密钥管理**: 生产环境使用强密码和随机密钥
3. **CORS**: 只允许信任的域名
4. **RLS**: 启用 Supabase 的行级安全策略

### 性能优化

1. **数据库索引**: 为常用查询字段添加索引
2. **缓存**: 使用 Redis 缓存频繁访问的数据
3. **CDN**: 使用 CDN 加速静态资源
4. **压缩**: 启用 gzip 压缩

### 监控和维护

1. **日志**: 定期查看应用和数据库日志
2. **备份**: 设置自动备份策略
3. **监控**: 使用 Zeabur 的监控功能
4. **更新**: 定期更新依赖和系统

---

## 📞 支持

如有问题，请:
1. 查看本文档的常见问题部分
2. 查看相关文档
3. 检查应用日志
4. 联系技术支持

---

## 📝 更新日志

### 2026-01-08
- ✅ 完成 Supabase 数据库架构设计
- ✅ 创建数据迁移工具
- ✅ 创建后端服务层代码
- ✅ 创建 Zeabur 部署配置
- ✅ 编写完整文档

---

**祝你部署顺利! 🎉🚀**

如需帮助，请参考相关文档或联系技术支持团队。
