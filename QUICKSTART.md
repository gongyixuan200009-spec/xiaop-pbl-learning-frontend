# Supabase 迁移快速开始

## 🚀 快速部署步骤

### 1. 初始化数据库（选择一种方式）

#### 方式 A: 使用 Supabase Studio Dashboard（推荐）

```bash
# 1. 访问 http://10.1.20.75:3000
# 2. 登录（用户名: supabase, 密码: supabase-dashboard-2025）
# 3. 进入 SQL Editor
# 4. 复制并执行 backend/scripts/init_supabase_schema.sql
```

#### 方式 B: 使用命令行（如果网络可达）

```bash
cd xiaop-v2-dev-deploy/backend
pip install psycopg2-binary
python3 scripts/init_db_simple.py
```

### 2. 配置环境变量

```bash
cd xiaop-v2-dev-deploy/backend

# 环境变量已经配置好，直接使用
# 如果需要修改，编辑 .env 文件
```

### 3. 安装依赖

```bash
cd xiaop-v2-dev-deploy/backend
pip install -r requirements.txt
```

### 4. 数据迁移（可选）

如果有现有数据需要迁移：

```bash
cd xiaop-v2-dev-deploy/backend
python3 scripts/migrate_data.py
```

### 5. 启动后端服务

```bash
cd xiaop-v2-dev-deploy/backend

# 开发模式
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 6. 测试验证

访问 API 文档：
- http://localhost:8000/docs

测试注册：
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "password": "test123",
    "profile": {
      "grade": "高一",
      "gender": "男生",
      "math_score": "90-110分",
      "science_feeling": "基础尚可"
    }
  }'
```

## ✅ 完成！

后端服务现在已经完全使用 Supabase 数据库。

## 📚 详细文档

查看完整部署指南：`SUPABASE_DEPLOYMENT_GUIDE.md`

## 🔧 主要变更

1. ✅ 用户认证 - 从 JSON 迁移到 Supabase
2. ✅ 进度管理 - 支持多项目，使用 Supabase
3. ✅ 配置管理 - 表单、API、Pipeline 配置存储在 Supabase
4. ✅ 数据持久化 - 所有数据存储在 PostgreSQL
5. ✅ 并发支持 - 数据库事务保证数据一致性

## 🎯 下一步

1. 启动前端服务
2. 测试完整功能
3. 部署到生产环境
