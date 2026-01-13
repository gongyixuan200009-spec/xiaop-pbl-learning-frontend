# 构建错误修复说明

## 问题描述

在 Zeabur 部署时遇到构建错误：

```
Error: supabaseUrl is required.
Error: Failed to collect page data for /api/admin/organizations/[organizationId]/prompts
```

## 根本原因

问题出在 API 路由文件中，Supabase 客户端在模块顶层初始化：

```typescript
// ❌ 错误的做法 - 在模块顶层初始化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

这会导致：
1. Next.js 在构建时尝试预渲染 API 路由
2. 构建时环境变量可能未设置
3. Supabase 客户端初始化失败，导致构建中断

## 解决方案

### 1. 创建辅助函数

在 `lib/supabase-server.ts` 中添加 `createServiceRoleClient` 函数：

```typescript
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
```

### 2. 在函数内部创建客户端

更新所有 API 路由，在函数内部创建 Supabase 客户端：

```typescript
// ✅ 正确的做法 - 在函数内部创建
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    // ... 其他代码
  } catch (error) {
    // 处理错误
  }
}
```

### 3. 受影响的文件

已修复的文件：
- ✅ `app/api/admin/organizations/route.ts`
- ✅ `app/api/admin/organizations/[organizationId]/prompts/route.ts`
- ✅ `lib/supabase-server.ts`

## 验证修复

### 本地构建测试

```bash
cd /Users/shawn/projects/pbl-learning
npm run build
```

结果：✅ 构建成功

```
Route (app)                                            Size     First Load JS
┌ ○ /                                                  138 B          87.4 kB
├ ƒ /api/admin/organizations                           0 B                0 B
├ ƒ /api/admin/organizations/[organizationId]/prompts  0 B                0 B
...
✓ Compiled successfully
```

### Git 提交

```bash
git add -A
git commit -m "fix: 修复构建时 Supabase 客户端初始化问题"
git push origin main
```

提交哈希：`66a15c7`

## 技术细节

### 为什么这样修复有效？

1. **延迟初始化**：客户端只在运行时（请求处理时）创建，而不是在构建时
2. **环境变量检查**：在运行时检查环境变量，如果缺失会抛出清晰的错误
3. **无状态客户端**：每次请求创建新客户端，避免状态共享问题

### 性能考虑

虽然每次请求都创建新客户端，但：
- Supabase 客户端创建非常轻量
- 连接池由底层 HTTP 客户端管理
- 对性能影响可忽略不计

### 最佳实践

对于 Next.js API 路由：
- ✅ 在函数内部创建客户端
- ✅ 使用辅助函数封装创建逻辑
- ✅ 在运行时检查环境变量
- ❌ 不要在模块顶层初始化客户端
- ❌ 不要使用 `!` 断言环境变量存在

## 其他 API 路由

以下 API 路由使用 `createClient()` 从 `lib/supabase-server.ts`，这是正确的：
- `app/api/chat/project-creation/route.ts`
- `app/api/projects/route.ts`
- `app/api/projects/[id]/route.ts`

这些路由使用的是 SSR 客户端（带 cookie 支持），在函数内部创建，所以没有问题。

## 部署到 Zeabur

现在可以重新部署到 Zeabur：

1. Zeabur 会自动检测到新的提交
2. 触发新的构建
3. 构建应该成功完成

或者手动触发：
1. 登录 Zeabur
2. 进入项目
3. 点击 "Redeploy"

## 预期结果

✅ 构建成功
✅ 部署成功
✅ API 路由正常工作
✅ 环境变量在运行时正确加载

## 相关文档

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase Client](https://supabase.com/docs/reference/javascript/initializing)
- [Environment Variables in Next.js](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

**修复时间**: 2026-01-13
**提交**: 66a15c7
**状态**: ✅ 已修复并验证
