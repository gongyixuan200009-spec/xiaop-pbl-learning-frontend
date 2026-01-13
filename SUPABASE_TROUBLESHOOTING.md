# 🔧 Supabase 数据库连接问题诊断

## 问题诊断

您的 Supabase 实例返回错误：
```
Could not query the database for the schema cache. Retrying.
```

这说明 **Supabase 的 PostgREST 服务无法连接到 PostgreSQL 数据库**。

## 可能的原因

1. **PostgreSQL 数据库没有运行**
2. **数据库连接配置错误**
3. **数据库权限问题**
4. **Supabase 服务没有正确启动**

## 解决方案

### 方案 1: 重启 Supabase（推荐）

如果您使用的是本地 Supabase（通过 Docker 或 Supabase CLI），请重启服务：

#### 使用 Supabase CLI:
```bash
cd /path/to/your/supabase/project
supabase stop
supabase start
```

#### 使用 Docker Compose:
```bash
cd /path/to/supabase
docker-compose down
docker-compose up -d
```

### 方案 2: 检查数据库连接

1. 访问 Supabase Studio: `http://10.1.20.75:8000`
2. 检查是否能看到数据库表
3. 尝试在 SQL Editor 中运行简单查询：
   ```sql
   SELECT 1;
   ```

### 方案 3: 检查 PostgreSQL 是否运行

```bash
# 检查 PostgreSQL 进程
ps aux | grep postgres

# 或者检查端口
lsof -i :5432
```

### 方案 4: 使用 Supabase Cloud（最简单）

如果本地 Supabase 问题难以解决，建议使用 Supabase Cloud：

1. 访问 https://supabase.com
2. 创建免费账号
3. 创建新项目
4. 获取 API URL 和 anon key
5. 更新 `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## 临时解决方案：禁用组织功能

如果您想先让基本的注册功能工作，可以暂时禁用组织功能：

### 修改 `app/login/page.tsx`

将注册逻辑简化为只使用 Supabase Auth，不创建额外的表：

```typescript
const handleAuth = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError(null)

  try {
    if (isSignUp) {
      // 简单注册，不创建组织
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      })

      if (error) throw error
      alert('注册成功！请检查您的邮箱以验证账户。')
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
    }
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

但这样做的问题是：**即使简化了代码，Supabase Auth 本身也无法工作**，因为它也需要连接到数据库。

## 推荐的解决步骤

### 步骤 1: 确认 Supabase 是否正常运行

在终端运行：
```bash
curl http://10.1.20.75:8000/auth/v1/health
```

应该返回类似：
```json
{"version":"...","name":"GoTrue"}
```

### 步骤 2: 检查 Supabase 日志

如果使用 Docker:
```bash
docker logs supabase-db
docker logs supabase-auth
docker logs supabase-rest
```

查找错误信息。

### 步骤 3: 重新初始化 Supabase

如果是本地开发环境，可以重新初始化：

```bash
# 停止所有服务
supabase stop

# 删除数据（注意：会丢失所有数据）
rm -rf supabase/.branches

# 重新启动
supabase start
```

### 步骤 4: 运行数据库迁移

Supabase 启动后，运行我们的 SQL 脚本：

1. 访问 `http://10.1.20.75:8000`
2. 进入 SQL Editor
3. 运行 `setup-database.sql`

## 快速测试

运行以下命令测试 Supabase 是否正常：

```bash
# 测试 REST API
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE" \
  http://10.1.20.75:8000/rest/v1/

# 测试 Auth
curl http://10.1.20.75:8000/auth/v1/health
```

如果看到错误，说明 Supabase 基础设施有问题，需要先修复。

## 需要帮助？

请告诉我：
1. 您是如何启动 Supabase 的？（Docker / Supabase CLI / Cloud）
2. 运行上面的测试命令后看到什么结果？
3. 是否可以访问 `http://10.1.20.75:8000` 看到 Supabase Studio？

根据这些信息，我可以提供更具体的解决方案。
