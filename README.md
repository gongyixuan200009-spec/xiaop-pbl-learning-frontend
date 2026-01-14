# 工小助学习助手 v2.0

AI驱动的学习辅助系统，帮助学生完成工程设计项目。

## 项目结构

```
xiaop-v2-dev-deploy/
├── backend/          # FastAPI 后端服务
│   ├── main.py      # 应用入口
│   ├── routers/     # API 路由
│   ├── services/    # 业务逻辑
│   ├── models/      # 数据模型
│   └── data/        # 配置文件
├── frontend/         # Next.js 前端应用
│   ├── src/         # 源代码
│   └── public/      # 静态资源
└── docs/            # 文档
```

## 技术栈

### 后端
- **框架**: FastAPI (Python 3.9+)
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT
- **AI**: 支持多个 LLM 提供商（火山引擎、OpenRouter 等）

### 前端
- **框架**: Next.js 16 (React 19)
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **UI组件**: Lucide Icons

## 快速开始

### 环境要求
- Python 3.9+
- Node.js 18+
- Supabase 账号

### 后端设置

1. 安装依赖：
```bash
cd backend
pip install -r requirements.txt
```

2. 配置环境变量（创建 `.env` 文件）：
```env
# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT 配置
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS 配置
CORS_ORIGINS=http://localhost:3000,http://localhost:3003
```

3. 初始化数据库：
```bash
python scripts/init_database.py
```

4. 启动服务：
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 前端设置

1. 安装依赖：
```bash
cd frontend
npm install
```

2. 配置环境变量（创建 `.env.local` 文件）：
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. 启动开发服务器：
```bash
npm run dev
```

前端将在 http://localhost:3000 运行。

## Zeabur 部署

本项目已配置好 Zeabur 部署。

### 部署步骤

1. **Fork 或推送代码到 GitHub**

2. **在 Zeabur 创建项目**
   - 连接 GitHub 仓库
   - Zeabur 会自动检测 monorepo 结构

3. **配置环境变量**

   后端服务需要配置：
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SECRET_KEY=your_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=10080
   ```

   前端服务需要配置：
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.zeabur.app
   ```

4. **部署**
   - Zeabur 会自动构建和部署
   - 后端：使用 `zbpack.json` 配置
   - 前端：自动检测 Next.js 项目

### 数据库设置

使用 Supabase 作为数据库：

1. 在 [Supabase](https://supabase.com) 创建项目
2. 运行 `backend/scripts/init_supabase_schema.sql` 初始化表结构
3. 配置 Row Level Security (RLS) 策略
4. 获取 API 密钥并配置到环境变量

## 功能特性

- ✅ 用户注册和登录
- ✅ 多项目管理
- ✅ AI 对话辅导
- ✅ 表单数据提取
- ✅ 学习进度跟踪
- ✅ 管理后台
- ✅ 多 LLM 提供商支持
- ✅ 年龄适应性调整

## API 文档

启动后端服务后，访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 开发指南

详细的开发文档请参考：
- [后端开发指南](./README_BACKEND.md)
- [Supabase 部署指南](./SUPABASE_DEPLOYMENT_GUIDE.md)
- [使用指南](./USAGE_GUIDE.md)

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue。
