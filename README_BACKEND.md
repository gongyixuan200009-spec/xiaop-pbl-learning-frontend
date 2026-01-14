# 工小助学习助手 - Supabase 后端

## 📖 项目简介

工小助学习助手是一个 AI 驱动的 PBL（项目式学习）在线教育平台。本项目后端已完整迁移到 Supabase PostgreSQL 数据库。

---

## 🎯 核心功能

- ✅ 用户注册和认证（JWT Token）
- ✅ 多项目管理（每个用户可创建多个项目）
- ✅ 阶段式学习（5个学习阶段）
- ✅ AI 对话辅导（流式 SSE 响应）
- ✅ 字段提取和验证
- ✅ 阶段测试和确认
- ✅ 管理后台（表单配置、Pipeline 管理）
- ✅ 年龄适配（根据年级调整语言风格）

---

## 🏗️ 技术栈

### 后端
- **框架**: FastAPI 0.104+
- **数据库**: Supabase PostgreSQL
- **认证**: JWT Token
- **异步**: Uvicorn ASGI Server
- **数据验证**: Pydantic 2.0+

### 前端
- **框架**: Next.js 16
- **状态管理**: Zustand
- **样式**: Tailwind CSS 4
- **工作流编辑**: XYFlow

---

## 📁 项目结构

```
xiaop-v2-dev-deploy/
├── backend/                    # FastAPI 后端
│   ├── main.py                # 应用入口
│   ├── config.py              # 配置文件
│   ├── requirements.txt       # Python 依赖
│   ├── .env                   # 环境变量
│   ├── routers/               # API 路由
│   │   ├── auth.py           # 认证路由
│   │   ├── chat.py           # 聊天路由
│   │   ├── project.py        # 项目管理路由
│   │   └── admin.py          # 管理路由
│   ├── services/              # 业务逻辑层
│   │   ├── supabase_client.py    # Supabase 客户端
│   │   ├── auth_service.py       # 认证服务
│   │   ├── progress_service.py   # 进度服务
│   │   ├── config_service.py     # 配置服务
│   │   └── llm_service.py        # LLM 服务
│   ├── models/                # 数据模型
│   │   └── schemas.py        # Pydantic 模型
│   └── scripts/               # 工具脚本
│       ├── init_supabase_schema.sql  # 数据库初始化 SQL
│       ├── init_db_simple.py         # 数据库初始化脚本
│       └── migrate_data.py           # 数据迁移脚本
├── frontend/                   # Next.js 前端
│   ├── src/
│   │   ├── app/              # App Router 页面
│   │   ├── components/       # React 组件
│   │   ├── store/            # Zustand 状态管理
│   │   └── lib/              # 工具库
│   └── package.json
├── SUPABASE_DEPLOYMENT_GUIDE.md  # 完整部署指南
├── QUICKSTART.md                  # 快速开始指南
└── MIGRATION_SUMMARY_SHORT.md     # 迁移总结
```

---

## 🚀 快速开始

### 1. 初始化数据库

访问 Supabase Studio Dashboard:
```
URL: http://10.1.20.75:3000
用户名: supabase
密码: supabase-dashboard-2025
```

在 SQL Editor 中执行 `backend/scripts/init_supabase_schema.sql`

### 2. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 3. 配置环境变量

环境变量已配置在 `backend/.env` 文件中，无需修改。

### 4. 启动后端服务

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. 访问 API 文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 📚 API 端点

### 认证 API
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 聊天 API
- `GET /api/chat/forms` - 获取所有表单配置
- `GET /api/chat/user-progress` - 获取用户进度
- `POST /api/chat/message/stream` - 发送消息（流式）
- `POST /api/chat/confirm-step` - 确认阶段完成
- `POST /api/chat/start-test` - 开始测试

### 项目管理 API
- `GET /api/projects/list` - 获取项目列表
- `POST /api/projects/create` - 创建新项目
- `POST /api/projects/switch` - 切换项目
- `POST /api/projects/rename` - 重命名项目
- `POST /api/projects/delete` - 删除项目

### 管理 API
- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/forms` - 获取表单配置
- `PUT /api/admin/forms` - 更新表单配置
- `GET /api/admin/pipelines` - 获取 Pipeline 列表

---

## 🗄️ 数据库表结构

| 表名 | 说明 |
|------|------|
| `users` | 用户基本信息 |
| `user_projects` | 用户项目（多项目支持） |
| `project_step_data` | 项目阶段数据 |
| `form_configs` | 表单配置 |
| `api_configs` | API 配置 |
| `pipeline_configs` | Pipeline 配置 |
| `age_adaptation_configs` | 年龄适配配置 |
| `prompt_history` | 提示词历史 |
| `user_uploads` | 用户上传文件 |

---

## 🔧 开发指南

### 添加新的 API 端点

1. 在 `routers/` 目录下创建或编辑路由文件
2. 在 `services/` 目录下实现业务逻辑
3. 在 `models/schemas.py` 中定义数据模型
4. 在 `main.py` 中注册路由

### 数据库操作

```python
from services.supabase_client import supabase

# 查询
result = supabase.table("users").select("*").eq("username", "test").execute()

# 插入
result = supabase.table("users").insert({"username": "test", ...}).execute()

# 更新
result = supabase.table("users").update({"grade": "高二"}).eq("username", "test").execute()

# 删除
result = supabase.table("users").delete().eq("username", "test").execute()
```

---

## 📖 文档

- [完整部署指南](SUPABASE_DEPLOYMENT_GUIDE.md) - 详细的部署步骤和配置说明
- [快速开始指南](QUICKSTART.md) - 6步快速部署
- [迁移总结](MIGRATION_SUMMARY_SHORT.md) - 迁移变更说明

---

## 🔒 安全性

- ✅ 密码 SHA256 哈希存储
- ✅ JWT Token 认证
- ✅ 行级安全策略 (RLS)
- ✅ CORS 配置
- ✅ 环境变量管理

---

## 🎯 性能优化

- ✅ 数据库索引优化
- ✅ 连接池管理
- ✅ 异步 I/O
- ✅ 流式响应（SSE）
- ✅ 缓存策略

---

## 🐛 故障排除

### 数据库连接失败

检查 `.env` 文件中的 `SUPABASE_URL` 和 `DATABASE_URL` 是否正确。

### 表不存在

执行数据库初始化脚本：
```bash
python3 scripts/init_db_simple.py
```

或在 Supabase Studio Dashboard 中手动执行 SQL 脚本。

### CORS 错误

在 `.env` 文件中添加前端地址到 `CORS_ORIGINS`。

---

## 📞 技术支持

- Supabase Studio Dashboard: http://10.1.20.75:3000
- API 文档: http://localhost:8000/docs

---

## 📄 许可证

本项目仅供学习和研究使用。

---

**最后更新**: 2026-01-13
