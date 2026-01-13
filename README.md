# 小鹏 PBL 学习平台 - 前端

基于项目的学习（Project-Based Learning）平台，集成 AI 助手，支持多租户组织管理。

**GitHub**: https://github.com/gongyixuan200009-spec/xiaop-pbl-learning-frontend

## 技术栈

### 前端
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (状态管理)

### 后端
- **Supabase** (BaaS)
  - PostgreSQL 数据库
  - 用户认证
  - 实时订阅
  - 文件存储

### AI 集成
- **OpenAI API** (GPT-3.5/4)
- 流式响应支持

### 部署
- **Zeabur** (Serverless 部署平台)

## 功能特性

- ✅ 用户注册/登录（Supabase Auth）
- ✅ AI 智能对话（流式响应）
- ✅ 用户信息展示
- ✅ 响应式设计
- ✅ 深色模式支持

## 快速开始

### 1. 安装依赖

```bash
npm install
# 或
pnpm install
# 或
yarn install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`:

```bash
cp .env.example .env.local
```

编辑 `.env.local` 并填入以下信息：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI API 配置
OPENAI_API_KEY=your-openai-api-key
```

### 3. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## Supabase 设置

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 获取项目 URL 和 anon key

### 2. 配置认证

在 Supabase Dashboard:
- Authentication → Settings
- 启用 Email 认证
- 配置邮件模板（可选）

### 3. 数据库表结构（可选）

如需保存聊天历史，可创建以下表：

```sql
-- 用户资料表
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 聊天会话表
create table chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 消息表
create table messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references chat_sessions on delete cascade,
  role text check (role in ('user', 'assistant')),
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 启用 Row Level Security
alter table profiles enable row level security;
alter table chat_sessions enable row level security;
alter table messages enable row level security;

-- 创建策略
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can view own sessions"
  on chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can view own messages"
  on messages for select
  using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = messages.session_id
      and chat_sessions.user_id = auth.uid()
    )
  );
```

## 部署到 Zeabur

### 方式一：通过 GitHub 自动部署（推荐）

1. **推送代码到 GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:gongyixuan200009-spec/project-based-learning.git
git push -u origin main
```

2. **在 Zeabur 创建项目**

- 访问 [zeabur.com](https://zeabur.com)
- 使用 GitHub 账号登录
- 点击 "Create Project"
- 选择 "Import from GitHub"
- 选择你的仓库

3. **配置环境变量**

在 Zeabur 项目设置中添加：

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
```

4. **部署**

- Zeabur 会自动检测 Next.js 项目
- 自动构建和部署
- 获得免费域名：`https://your-project.zeabur.app`

### 方式二：使用 Zeabur CLI

```bash
# 安装 Zeabur CLI
npm install -g @zeabur/cli

# 登录
zeabur login

# 部署
zeabur deploy
```

## 访问部署的应用

### Zeabur 免费域名

部署完成后，Zeabur 会自动分配域名：

```
https://your-project-name.zeabur.app
```

特点：
- 完全免费
- 自动 HTTPS
- 全球 CDN
- 无需配置

### 绑定自定义域名

1. 在 Zeabur 项目设置中点击 "Domains"
2. 添加你的域名（如 `example.com`）
3. 在域名注册商添加 DNS 记录：

```
类型: CNAME
名称: @（或 www）
值: cname.zeabur-dns.com
TTL: 自动
```

4. 等待 DNS 生效（几分钟到 48 小时）
5. Zeabur 自动配置 SSL 证书

## 项目结构

```
pbl-learning/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   └── chat/         # AI 对话 API
│   ├── chat/             # 对话页面
│   ├── dashboard/        # 用户仪表板
│   ├── login/            # 登录/注册页面
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页
│   └── globals.css       # 全局样式
├── lib/                   # 工具库
│   ├── supabase.ts       # Supabase 客户端
│   ├── store.ts          # Zustand 状态管理
│   └── types.ts          # TypeScript 类型定义
├── .env.example          # 环境变量示例
├── .zeabur.toml          # Zeabur 配置
├── zeabur.json           # Zeabur 部署配置
├── next.config.js        # Next.js 配置
├── tailwind.config.ts    # Tailwind 配置
├── tsconfig.json         # TypeScript 配置
└── package.json          # 项目依赖
```

## 开发指南

### 添加新页面

在 `app/` 目录下创建新文件夹：

```tsx
// app/new-page/page.tsx
export default function NewPage() {
  return <div>New Page</div>
}
```

### 添加 API 路由

在 `app/api/` 目录下创建：

```tsx
// app/api/hello/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Hello' })
}
```

### 使用 Supabase

```tsx
import { supabase } from '@/lib/supabase'

// 查询数据
const { data, error } = await supabase
  .from('table_name')
  .select('*')

// 插入数据
const { data, error } = await supabase
  .from('table_name')
  .insert({ column: 'value' })
```

## 常见问题

### 1. Supabase 连接失败

检查环境变量是否正确配置：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. AI 对话不工作

确保配置了 `OPENAI_API_KEY` 环境变量。

### 3. 部署后环境变量不生效

在 Zeabur 控制台重新部署项目。

### 4. 国内访问 Zeabur 域名较慢

可以绑定自定义域名并使用 Cloudflare CDN 加速。

## 成本估算

### 免费额度

- **Zeabur**: 免费套餐支持小型项目
- **Supabase**:
  - 500MB 数据库
  - 1GB 文件存储
  - 50,000 月活用户
- **OpenAI**: 按使用量付费（GPT-3.5 约 $0.002/1K tokens）

### 预估成本

小型项目（<1000 用户）：
- Zeabur: $0-5/月
- Supabase: $0（免费额度内）
- OpenAI: $10-50/月（取决于使用量）

## 扩展功能

可以添加的功能：
- 聊天历史保存
- 文件上传
- 多语言支持
- 用户头像上传
- 学习进度追踪
- 社交分享
- 支付集成

## 技术支持

- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Zeabur 文档](https://zeabur.com/docs)
- [OpenAI API 文档](https://platform.openai.com/docs)

## License

MIT
