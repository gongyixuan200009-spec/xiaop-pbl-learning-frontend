# Zeabur 服务测试快速指南

## 快速开始（5 分钟）

### 1. 获取服务地址

1. 访问：https://zeabur.cn
2. 登录你的账号
3. 进入 `pbl-learning` 项目
4. 复制服务域名（类似：`xxx.zeabur.app`）

### 2. 浏览器测试

在浏览器中依次访问以下页面：

```
✅ 首页：    https://your-service.zeabur.app
✅ 登录页：  https://your-service.zeabur.app/login
✅ 仪表板：  https://your-service.zeabur.app/dashboard
✅ AI 聊天： https://your-service.zeabur.app/chat
```

### 3. 检查服务状态

在 Zeabur 控制台中查看：

- **状态**：应该显示 "Running" ✅
- **日志**：点击 "Logs" 查看运行日志
- **监控**：查看 CPU、内存使用情况

### 4. 测试功能

**注册新用户**：
1. 访问 `/login` 页面
2. 切换到 "注册" 模式
3. 输入邮箱和密码
4. 点击注册

⚠️ **重要**：如果注册失败，可能是因为本地 Supabase 地址（`http://10.1.20.75:8000`）无法从 Zeabur 访问。

## 解决 Supabase 连接问题

### 方案 1：使用 Supabase 云服务（推荐）

1. 访问 https://supabase.com 并注册
2. 创建新项目
3. 在 SQL Editor 中运行项目中的 `supabase-setup.sql`
4. 获取项目 URL 和 API Key
5. 在 Zeabur 中更新环境变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的新密钥
   ```
6. 重启 Zeabur 服务

### 方案 2：使用 ngrok（临时测试）

在本地运行：
```bash
# 安装 ngrok
brew install ngrok  # macOS
# 或访问 https://ngrok.com 下载

# 启动隧道
ngrok http 8000

# 复制生成的公网地址（如：https://xxx.ngrok.io）
# 在 Zeabur 中更新 NEXT_PUBLIC_SUPABASE_URL
```

## 快速命令测试

```bash
# 测试服务是否在线
curl -I https://your-service.zeabur.app

# 预期输出：HTTP/2 200

# 测试 API 端点
curl https://your-service.zeabur.app/api/health

# 如果返回 404，说明服务正常运行（这个端点我们没有创建）
```

## 监控服务

### Zeabur 控制台

- **实时日志**：查看所有请求和错误
- **资源使用**：CPU、内存、网络流量
- **请求统计**：访问量、响应时间

### 浏览器开发者工具

1. 按 F12 打开开发者工具
2. 切换到 "Console" 查看 JavaScript 错误
3. 切换到 "Network" 查看网络请求

## 常见问题

### 问题 1：页面无法访问
- 检查 Zeabur 服务状态是否为 "Running"
- 查看部署日志是否有错误

### 问题 2：登录/注册不工作
- 原因：本地 Supabase 无法从公网访问
- 解决：使用上面的方案 1 或方案 2

### 问题 3：AI 聊天无响应
- 检查是否配置了 `OPENAI_API_KEY` 环境变量
- 在 Zeabur 控制台的环境变量中添加

## 完整测试清单

- [ ] 服务状态显示 "Running"
- [ ] 首页可以访问
- [ ] 登录页可以访问
- [ ] 页面样式正常
- [ ] 查看了运行日志
- [ ] 配置了正确的 Supabase 地址
- [ ] （可选）测试了用户注册
- [ ] （可选）测试了 AI 聊天

## 下一步

1. **配置生产环境 Supabase**（推荐）
2. **添加自定义域名**
3. **配置 OpenAI API Key** 启用 AI 功能
4. **设置监控告警**

---

📖 **详细文档**：查看 `ZEABUR_TESTING_GUIDE.md` 获取完整测试指南
