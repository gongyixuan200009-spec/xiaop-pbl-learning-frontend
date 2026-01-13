# 401 错误修复验证指南

## 🔧 已修复的问题

**问题：** 创建项目时返回 401 Unauthorized 错误

**根本原因：** 
- 客户端使用 `@supabase/supabase-js` 创建的客户端不会将 session 存储到 cookies
- 服务器端从 cookies 读取 session
- 两者不同步导致服务器无法识别已登录用户

**解决方案：**
1. 将客户端改为使用 `@supabase/ssr` 的 `createBrowserClient`
2. 在所有 fetch 请求中添加 `credentials: 'include'`
3. 修复 API 响应解析（处理 `{projects}` 和 `{project}` 包装）

## ✅ 验证步骤

### 1. 清除浏览器缓存和 Cookies

**重要：** 由于更改了 Supabase 客户端，需要清除旧的 session 数据。

**Chrome/Edge:**
1. 按 F12 打开开发者工具
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

或者：
1. 按 Cmd+Shift+Delete (Mac) 或 Ctrl+Shift+Delete (Windows)
2. 选择"Cookies 和其他网站数据"
3. 选择"过去 1 小时"
4. 点击"清除数据"

### 2. 重新登录

1. 访问 http://localhost:3002/login
2. 如果已有账户，直接登录
3. 如果没有账户，注册新账户

### 3. 测试创建项目

1. 登录后应该自动跳转到 http://localhost:3002/dashboard
2. 点击右上角的"创建新项目"按钮
3. 填写项目信息：
   - 标题：测试项目
   - 描述：这是一个测试项目
4. 点击"创建"按钮

**预期结果：**
- ✅ 不再出现 401 错误
- ✅ 项目创建成功
- ✅ 自动跳转到项目详情页
- ✅ 可以看到阶段 1 的表单

### 4. 检查浏览器控制台

按 F12 打开开发者工具，查看 Console 和 Network 标签：

**Console 标签：**
- 不应该有红色错误
- 可能有一些警告（可以忽略）

**Network 标签：**
1. 找到 `POST /api/projects` 请求
2. 点击查看详情
3. 检查：
   - Status: 应该是 201 (Created)
   - Response: 应该包含项目数据
   - Cookies: 应该包含 Supabase session cookies

### 5. 测试其他功能

- [ ] 可以返回项目看板
- [ ] 可以看到刚创建的项目
- [ ] 可以点击项目进入详情页
- [ ] 可以填写阶段 1 表单
- [ ] 可以保存草稿
- [ ] 可以完成阶段并进入下一阶段

## 🐛 如果仍然出现 401 错误

### 检查清单：

1. **确认已清除浏览器缓存和 Cookies**
   - 这是最常见的问题
   - 旧的 session 数据会导致冲突

2. **确认已重新登录**
   - 清除缓存后需要重新登录
   - 不要使用"记住我"功能

3. **检查 Supabase 环境变量**
   ```bash
   # 在项目根目录运行
   cat .env.local | grep SUPABASE
   ```
   应该看到：
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

4. **检查服务器日志**
   查看终端输出，看是否有错误信息

5. **重启开发服务器**
   ```bash
   # 按 Ctrl+C 停止服务器
   # 然后重新启动
   npm run dev
   ```

## 📊 技术细节

### 修改的文件：

1. **lib/supabase.ts**
   ```typescript
   // 之前
   import { createClient } from '@supabase/supabase-js'
   export const supabase = createClient(...)
   
   // 之后
   import { createBrowserClient } from '@supabase/ssr'
   export const supabase = createBrowserClient(...)
   ```

2. **app/dashboard/page.tsx**
   ```typescript
   // 添加 credentials: 'include'
   fetch('/api/projects', {
     credentials: 'include',
   })
   
   // 修复响应解析
   const data = await res.json()
   setProjects(data.projects || data)
   ```

### 为什么这样修复有效？

1. **createBrowserClient** 会自动：
   - 将 session 存储到 cookies
   - 在每次请求时发送 cookies
   - 与服务器端的 createServerClient 兼容

2. **credentials: 'include'** 确保：
   - Fetch 请求包含 cookies
   - 跨域请求也能发送 cookies（如果需要）

3. **响应解析修复** 确保：
   - 正确处理 API 返回的数据结构
   - 兼容不同的响应格式

## 🚀 下一步

验证修复成功后：

1. 在本地完成所有功能测试
2. 确认数据库已在 Supabase 中设置
3. 推送到 GitHub 部署到生产环境：
   ```bash
   git push
   ```

## 📝 注意事项

- 每次更改认证相关代码后，建议清除浏览器缓存
- 开发时可以使用无痕模式避免缓存问题
- 生产环境部署后，用户也需要重新登录一次
