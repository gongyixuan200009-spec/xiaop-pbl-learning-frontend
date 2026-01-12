# Supabase 本地数据库设置指南

## 访问 Supabase Studio

1. 打开浏览器访问：http://10.1.20.75:3000
2. 使用以下凭据登录：
   - 用户名：`supabase`
   - 密码：`supabase-dashboard-2025`

## 设置数据库表结构

### 方式一：使用 SQL Editor（推荐）

1. 在 Supabase Studio 左侧菜单点击 **SQL Editor**
2. 点击 **New Query**
3. 复制 `supabase-setup.sql` 文件的全部内容
4. 粘贴到 SQL Editor
5. 点击 **Run** 执行

### 方式二：使用命令行

```bash
# 使用 psql 连接数据库
psql postgresql://postgres:your-super-secret-password-change-this@10.1.20.75:5432/postgres

# 在 psql 中执行
\i supabase-setup.sql
```

## 验证数据库设置

执行以下 SQL 查询验证表是否创建成功：

```sql
-- 查看所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 应该看到以下表：
-- - profiles
-- - chat_sessions
-- - messages
-- - learning_records
```

## 测试用户认证

### 1. 启用 Email 认证

1. 在 Supabase Studio 左侧菜单点击 **Authentication**
2. 点击 **Settings** 标签
3. 确保 **Email** 认证已启用
4. 在 **Email Templates** 中可以自定义邮件模板（可选）

### 2. 配置邮件服务（可选）

本地开发环境默认使用 Inbucket 作为邮件服务：
- 访问：http://10.1.20.75:54324
- 所有注册邮件会发送到这里
- 可以查看验证链接

### 3. 测试注册流程

1. 启动项目：`npm run dev`
2. 访问：http://localhost:3000/login
3. 注册一个测试账号
4. 检查 Inbucket 查看验证邮件
5. 点击验证链接完成注册

## 数据库表说明

### profiles 表
存储用户资料信息
- `id`: 用户 ID（关联 auth.users）
- `email`: 邮箱
- `full_name`: 全名
- `avatar_url`: 头像 URL
- `bio`: 个人简介

### chat_sessions 表
存储聊天会话
- `id`: 会话 ID
- `user_id`: 用户 ID
- `title`: 会话标题
- `created_at`: 创建时间
- `updated_at`: 更新时间

### messages 表
存储聊天消息
- `id`: 消息 ID
- `session_id`: 会话 ID
- `role`: 角色（user/assistant/system）
- `content`: 消息内容
- `created_at`: 创建时间

### learning_records 表
存储学习记录（可选）
- `id`: 记录 ID
- `user_id`: 用户 ID
- `activity_type`: 活动类型
- `duration_minutes`: 时长（分钟）
- `metadata`: 元数据（JSON）
- `created_at`: 创建时间

## Row Level Security (RLS)

所有表都启用了 RLS，确保：
- 用户只能查看和修改自己的数据
- 防止未授权访问
- 自动应用安全策略

## 触发器

### handle_new_user()
当新用户注册时，自动在 profiles 表创建用户资料

### handle_updated_at()
自动更新 updated_at 字段

## 常见问题

### 1. 连接失败

检查：
- Supabase 服务是否运行
- 网络连接是否正常
- 端口 8000 是否可访问

### 2. 认证失败

检查：
- 环境变量是否正确配置
- ANON_KEY 是否正确
- Email 认证是否启用

### 3. 数据库查询失败

检查：
- RLS 策略是否正确
- 用户是否已登录
- 表结构是否正确创建

## 下一步

1. ✅ 数据库表已创建
2. ✅ RLS 策略已配置
3. ✅ 触发器已设置
4. 🔄 启动项目进行测试
5. 🔄 测试用户注册和登录
6. 🔄 测试 AI 对话功能

## 有用的 SQL 查询

### 查看所有用户
```sql
SELECT * FROM auth.users;
```

### 查看用户资料
```sql
SELECT * FROM public.profiles;
```

### 查看聊天会话
```sql
SELECT * FROM public.chat_sessions;
```

### 查看消息
```sql
SELECT * FROM public.messages;
```

### 清空测试数据
```sql
-- 注意：这会删除所有数据！
TRUNCATE public.messages CASCADE;
TRUNCATE public.chat_sessions CASCADE;
TRUNCATE public.learning_records CASCADE;
-- 不要删除 profiles，因为它关联 auth.users
```

## 管理界面快捷方式

- **Table Editor**: http://10.1.20.75:3000/project/default/editor
- **SQL Editor**: http://10.1.20.75:3000/project/default/sql
- **Authentication**: http://10.1.20.75:3000/project/default/auth/users
- **Database**: http://10.1.20.75:3000/project/default/database/tables
