# Zeabur 部署服务测试指南

## 1. 访问已部署的服务

### 1.1 获取服务 URL

1. 登录 Zeabur 控制台：https://zeabur.cn
2. 进入你的项目（pbl-learning）
3. 点击你的服务
4. 在服务详情页面，你会看到：
   - **域名（Domain）**：Zeabur 自动分配的域名，格式类似：`xxx.zeabur.app`
   - 或者你绑定的自定义域名

### 1.2 在浏览器中访问

直接在浏览器中打开 Zeabur 提供的 URL，例如：
```
https://your-service.zeabur.app
```

你应该能看到项目的首页，显示 "PBL Learning Platform"。

## 2. 验证服务运行状态

### 2.1 检查 Zeabur 控制台

在 Zeabur 控制台中，检查以下指标：

**服务状态**：
- ✅ **Running**（运行中）- 服务正常
- ⚠️ **Building**（构建中）- 正在部署
- ❌ **Failed**（失败）- 部署失败

**部署日志**：
1. 点击服务卡片
2. 选择 "日志（Logs）" 标签
3. 查看：
   - **构建日志（Build Logs）**：npm install, npm run build 的输出
   - **运行日志（Runtime Logs）**：Next.js 服务器启动信息

**预期的正常日志**：
```
✓ Ready in XXXms
✓ Compiled successfully
- Local: http://localhost:3000
```

### 2.2 检查环境变量

在 Zeabur 控制台中：
1. 进入服务设置
2. 查看 "环境变量（Environment Variables）"
3. 确认已配置：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`（可选）

⚠️ **重要提示**：如果你使用的是本地 Supabase 地址（http://10.1.20.75:8000），这个地址在 Zeabur 服务器上是无法访问的。你需要：
- 使用 Supabase 云服务（推荐）
- 或者使用 ngrok 等工具将本地 Supabase 暴露到公网

## 3. 功能测试清单

### 3.1 首页测试

访问首页：`https://your-service.zeabur.app`

**检查项**：
- [ ] 页面能正常加载
- [ ] 看到 "PBL Learning Platform" 标题
- [ ] 看到 "开始使用" 按钮
- [ ] 页面样式正常（Tailwind CSS 生效）

### 3.2 登录页面测试

访问：`https://your-service.zeabur.app/login`

**检查项**：
- [ ] 页面能正常加载
- [ ] 看到登录表单（邮箱、密码输入框）
- [ ] 看到 "登录" 和 "注册" 切换选项

**测试注册功能**：
1. 切换到 "注册" 模式
2. 输入邮箱和密码
3. 点击注册按钮

**可能的结果**：
- ✅ 如果 Supabase 可访问：注册成功，跳转到 dashboard
- ❌ 如果 Supabase 不可访问：显示连接错误

### 3.3 Dashboard 测试

访问：`https://your-service.zeabur.app/dashboard`

**检查项**：
- [ ] 未登录时会重定向到登录页
- [ ] 登录后能看到用户信息
- [ ] 显示学习统计数据

### 3.4 AI 聊天测试

访问：`https://your-service.zeabur.app/chat`

**检查项**：
- [ ] 页面能正常加载
- [ ] 看到聊天输入框
- [ ] 输入消息后点击发送

**可能的结果**：
- ✅ 如果配置了 OPENAI_API_KEY：收到 AI 回复
- ❌ 如果未配置：显示 API 错误

## 4. 监控服务使用情况

### 4.1 Zeabur 监控面板

在 Zeabur 控制台中查看：

**实时指标**：
- **CPU 使用率**：服务器 CPU 占用
- **内存使用**：内存占用情况
- **网络流量**：入站/出站流量
- **请求数量**：HTTP 请求统计

**访问方式**：
1. 进入服务详情页
2. 选择 "监控（Monitoring）" 或 "指标（Metrics）" 标签

### 4.2 查看访问日志

**实时日志**：
```bash
# 在 Zeabur 控制台的日志页面，你会看到：
GET / 200 in 45ms
GET /login 200 in 32ms
POST /api/chat 200 in 1234ms
```

**日志筛选**：
- 按时间范围筛选
- 按日志级别筛选（info, warn, error）
- 搜索特定关键词

### 4.3 Supabase 监控

如果使用 Supabase 云服务：

1. 登录 Supabase Dashboard
2. 选择你的项目
3. 查看：
   - **API 请求统计**：每小时/每天的请求数
   - **数据库连接数**：活跃连接
   - **认证活动**：用户注册/登录记录
   - **实时订阅**：WebSocket 连接数

## 5. 常见问题排查

### 5.1 页面无法访问

**症状**：浏览器显示 "无法访问此网站"

**排查步骤**：
1. 检查 Zeabur 服务状态是否为 "Running"
2. 查看部署日志是否有错误
3. 确认域名是否正确
4. 尝试清除浏览器缓存

### 5.2 页面显示 500 错误

**症状**：页面显示 "Internal Server Error"

**排查步骤**：
1. 查看 Zeabur 运行日志（Runtime Logs）
2. 检查环境变量是否配置正确
3. 查看是否有 JavaScript 错误

### 5.3 Supabase 连接失败

**症状**：登录/注册功能不工作

**原因**：本地 Supabase 地址（http://10.1.20.75:8000）无法从 Zeabur 访问

**解决方案**：
1. **推荐**：迁移到 Supabase 云服务
   - 访问 https://supabase.com
   - 创建新项目
   - 获取云端 URL 和 API Key
   - 在 Zeabur 更新环境变量

2. **临时方案**：使用 ngrok
   ```bash
   # 在本地运行
   ngrok http 8000
   # 获得公网地址，如：https://xxx.ngrok.io
   # 在 Zeabur 更新 NEXT_PUBLIC_SUPABASE_URL
   ```

### 5.4 AI 聊天不工作

**症状**：发送消息后没有回复

**排查步骤**：
1. 检查是否配置了 `OPENAI_API_KEY`
2. 查看 API 路由日志：`/api/chat`
3. 确认 OpenAI API Key 是否有效
4. 检查 OpenAI 账户余额

## 6. 性能测试

### 6.1 页面加载速度

使用浏览器开发者工具：
1. 按 F12 打开开发者工具
2. 切换到 "Network" 标签
3. 刷新页面
4. 查看：
   - **DOMContentLoaded**：DOM 加载时间
   - **Load**：页面完全加载时间
   - **资源大小**：总下载大小

**预期指标**：
- 首页加载时间：< 2 秒
- 总资源大小：< 1 MB

### 6.2 API 响应时间

测试 API 端点：
```bash
# 使用 curl 测试
curl -X POST https://your-service.zeabur.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","sessionId":"test-123"}' \
  -w "\nTime: %{time_total}s\n"
```

**预期响应时间**：
- 普通 API：< 500ms
- AI 聊天 API：1-3 秒（取决于 OpenAI）

## 7. 快速测试命令

### 7.1 检查服务是否在线

```bash
# 测试首页
curl -I https://your-service.zeabur.app

# 预期输出
HTTP/2 200
content-type: text/html
```

### 7.2 测试 API 端点

```bash
# 测试聊天 API（需要替换你的域名）
curl -X POST https://your-service.zeabur.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"测试消息","sessionId":"test-session"}'
```

## 8. 下一步建议

### 8.1 配置自定义域名

1. 在 Zeabur 控制台中添加自定义域名
2. 在域名提供商处配置 DNS：
   ```
   类型: CNAME
   名称: @（或 www）
   值: your-service.zeabur.app
   ```

### 8.2 启用 HTTPS

Zeabur 自动为所有域名提供免费 SSL 证书（Let's Encrypt）。

### 8.3 设置监控告警

在 Zeabur 中配置：
- CPU/内存使用率告警
- 服务宕机通知
- 错误日志告警

### 8.4 迁移到生产环境 Supabase

1. 创建 Supabase 云项目
2. 运行 `supabase-setup.sql` 创建表结构
3. 更新 Zeabur 环境变量
4. 重新部署服务

## 9. 测试检查清单

完成以下测试以确保服务正常运行：

- [ ] 服务在 Zeabur 控制台显示 "Running" 状态
- [ ] 可以通过浏览器访问首页
- [ ] 首页样式正常显示
- [ ] 登录页面可以访问
- [ ] Dashboard 页面可以访问
- [ ] Chat 页面可以访问
- [ ] 查看了部署日志，没有错误
- [ ] 环境变量配置正确
- [ ] （可选）Supabase 连接正常
- [ ] （可选）AI 聊天功能正常

## 10. 获取帮助

如果遇到问题：
1. 查看 Zeabur 官方文档：https://zeabur.com/docs
2. 查看项目中的其他文档：
   - `DEPLOY_ZEABUR_CN.md` - 部署详细指南
   - `LOCAL_TESTING_GUIDE.md` - 本地测试指南
   - `README.md` - 项目总览
