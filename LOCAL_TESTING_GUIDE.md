# 本地测试指南

## 前置条件

✅ 已完成的步骤：
- [x] 项目依赖已安装（npm install）
- [x] 环境变量已配置（.env.local）
- [x] Supabase 服务正在运行（http://10.1.20.75:8000）

## 步骤 1：设置 Supabase 数据库

### 1.1 访问 Supabase Studio

打开浏览器访问：http://10.1.20.75:3000

登录信息：
- 用户名：`supabase`
- 密码：`supabase-dashboard-2025`

### 1.2 执行数据库设置脚本

1. 点击左侧菜单 **SQL Editor**
2. 点击 **New Query**
3. 打开项目中的 `supabase-setup.sql` 文件
4. 复制全部内容并粘贴到 SQL Editor
5. 点击 **Run** 执行

执行成功后，你应该看到：
```
Success. No rows returned
```

### 1.3 验证表创建

在 SQL Editor 中执行：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

应该看到以下表：
- `chat_sessions`
- `learning_records`
- `messages`
- `profiles`

## 步骤 2：启动开发服务器

```bash
npm run dev
```

你应该看到：
```
▲ Next.js 14.2.18
- Local:        http://localhost:3000
- Ready in 2.5s
```

## 步骤 3：测试功能

### 3.1 测试首页

访问：http://localhost:3000

应该看到：
- ✅ 欢迎页面
- ✅ 功能介绍卡片
- ✅ "开始使用" 和 "查看示例" 按钮

### 3.2 测试用户注册

1. 点击 "开始使用" 或访问：http://localhost:3000/login
2. 点击 "没有账户？点击注册"
3. 输入测试邮箱和密码：
   - 邮箱：`test@example.com`
   - 密码：`Test123456`
4. 点击 "注册"

**查看注册邮件：**
- 访问：http://10.1.20.75:54324
- 找到发送给 `test@example.com` 的邮件
- 点击邮件中的验证链接

### 3.3 测试用户登录

1. 返回登录页面：http://localhost:3000/login
2. 输入刚才注册的邮箱和密码
3. 点击 "登录"
4. 应该自动跳转到：http://localhost:3000/dashboard

### 3.4 测试用户仪表板

在 Dashboard 页面应该看到：
- ✅ 用户 ID
- ✅ 邮箱地址
- ✅ 注册时间
- ✅ 最后登录时间
- ✅ 快速操作按钮
- ✅ 使用统计（初始为 0）

### 3.5 测试 AI 对话

**注意：** 需要配置 OpenAI API Key

1. 编辑 `.env.local`，添加你的 OpenAI API Key：
   ```
   OPENAI_API_KEY=sk-your-api-key-here
   ```

2. 重启开发服务器：
   ```bash
   # 按 Ctrl+C 停止
   npm run dev
   ```

3. 访问：http://localhost:3000/chat

4. 输入测试消息：
   - "你好，请介绍一下自己"
   - "什么是 Next.js？"
   - "帮我写一个 Python 函数"

5. 应该看到：
   - ✅ 消息发送成功
   - ✅ AI 流式响应
   - ✅ 对话历史显示

**如果没有 OpenAI API Key：**
- AI 对话功能将不可用
- 会显示错误提示
- 其他功能（登录、Dashboard）仍然正常

### 3.6 测试退出登录

1. 在 Dashboard 页面点击 "退出登录"
2. 应该跳转回首页
3. 尝试访问 http://localhost:3000/dashboard
4. 应该自动跳转到登录页面

## 步骤 4：验证数据库数据

### 4.1 查看用户数据

在 Supabase Studio SQL Editor 中执行：

```sql
-- 查看所有用户
SELECT id, email, created_at
FROM auth.users;

-- 查看用户资料
SELECT *
FROM public.profiles;
```

### 4.2 查看聊天数据（如果测试了 AI 对话）

```sql
-- 查看聊天会话
SELECT *
FROM public.chat_sessions;

-- 查看消息
SELECT *
FROM public.messages
ORDER BY created_at DESC;
```

## 常见问题排查

### 问题 1：无法连接 Supabase

**错误信息：**
```
Failed to fetch
```

**解决方案：**
1. 检查 Supabase 服务是否运行
2. 访问 http://10.1.20.75:8000 确认服务可访问
3. 检查 `.env.local` 中的 URL 是否正确
4. 确保网络连接正常

### 问题 2：注册失败

**错误信息：**
```
User already registered
```

**解决方案：**
1. 使用不同的邮箱地址
2. 或在 Supabase Studio 删除测试用户：
   ```sql
   DELETE FROM auth.users WHERE email = 'test@example.com';
   ```

### 问题 3：登录后跳转失败

**解决方案：**
1. 清除浏览器缓存
2. 检查浏览器控制台错误
3. 确认用户已验证邮箱

### 问题 4：AI 对话不工作

**错误信息：**
```
未配置 OpenAI API Key
```

**解决方案：**
1. 在 `.env.local` 添加 `OPENAI_API_KEY`
2. 重启开发服务器
3. 确认 API Key 有效且有余额

### 问题 5：页面样式错误

**解决方案：**
1. 清除 `.next` 缓存：
   ```bash
   rm -rf .next
   npm run dev
   ```
2. 检查 Tailwind CSS 是否正确加载

## 测试检查清单

完成以下测试项：

- [ ] 首页正常显示
- [ ] 用户注册成功
- [ ] 收到验证邮件
- [ ] 用户登录成功
- [ ] Dashboard 显示用户信息
- [ ] AI 对话功能正常（如果配置了 API Key）
- [ ] 退出登录成功
- [ ] 数据库正确保存数据
- [ ] RLS 策略生效（用户只能看到自己的数据）

## 性能测试

### 检查页面加载速度

打开浏览器开发者工具（F12）：
1. 切换到 Network 标签
2. 刷新页面
3. 查看加载时间

**预期结果：**
- 首页加载：< 1 秒
- Dashboard 加载：< 2 秒
- API 响应：< 500ms

### 检查 AI 响应速度

1. 发送消息到 AI 对话
2. 观察首个 token 响应时间

**预期结果：**
- 首个 token：< 2 秒
- 流式响应：流畅无卡顿

## 下一步

测试完成后：

1. ✅ 确认所有功能正常
2. 🔄 准备部署到 Zeabur
3. 🔄 配置生产环境变量
4. 🔄 推送代码到 GitHub

## 调试技巧

### 查看服务器日志

开发服务器的终端会显示：
- API 请求日志
- 错误信息
- 编译信息

### 查看浏览器控制台

按 F12 打开开发者工具：
- Console：查看 JavaScript 错误
- Network：查看 API 请求
- Application：查看 LocalStorage 和 Cookies

### 查看 Supabase 日志

在 Supabase Studio：
1. 点击左侧菜单 **Logs**
2. 选择 **API** 或 **Database**
3. 查看实时日志

## 测试数据清理

测试完成后，清理测试数据：

```sql
-- 删除测试用户（会级联删除相关数据）
DELETE FROM auth.users WHERE email = 'test@example.com';

-- 或清空所有数据（谨慎使用）
TRUNCATE public.messages CASCADE;
TRUNCATE public.chat_sessions CASCADE;
TRUNCATE public.learning_records CASCADE;
```

## 准备部署

测试通过后，查看 `ZEABUR_DEPLOY.md` 了解如何部署到生产环境。
