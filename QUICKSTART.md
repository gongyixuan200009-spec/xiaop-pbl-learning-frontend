# 快速启动指南

## 5 分钟快速部署

### 1️⃣ 克隆或下载项目

```bash
cd pbl-learning
```

### 2️⃣ 安装依赖

```bash
npm install
```

### 3️⃣ 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local，填入你的配置
```

需要配置的变量：
- `NEXT_PUBLIC_SUPABASE_URL`: 从 [supabase.com](https://supabase.com) 获取
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 从 Supabase 项目设置获取
- `OPENAI_API_KEY`: 从 [platform.openai.com](https://platform.openai.com) 获取

### 4️⃣ 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 5️⃣ 部署到 Zeabur

```bash
# 推送到 GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/pbl-learning.git
git push -u origin main
```

然后：
1. 访问 [zeabur.com](https://zeabur.com)
2. 导入 GitHub 仓库
3. 配置环境变量
4. 自动部署完成！

## 项目结构

```
pbl-learning/
├── app/
│   ├── api/chat/          # AI 对话 API
│   ├── chat/              # 对话页面
│   ├── dashboard/         # 用户仪表板
│   ├── login/             # 登录页面
│   └── page.tsx           # 首页
├── lib/
│   ├── supabase.ts        # Supabase 配置
│   ├── store.ts           # 状态管理
│   └── types.ts           # 类型定义
└── README.md              # 完整文档
```

## 主要功能

✅ 用户注册/登录
✅ AI 智能对话
✅ 用户信息展示
✅ 响应式设计
✅ Serverless 部署

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI API
- **部署**: Zeabur (Serverless)

## 下一步

- 📖 阅读 [README.md](./README.md) 了解详细信息
- 🚀 查看 [ZEABUR_DEPLOY.md](./ZEABUR_DEPLOY.md) 学习部署
- 💡 开始自定义你的应用

## 需要帮助？

- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Zeabur 文档](https://zeabur.com/docs)
