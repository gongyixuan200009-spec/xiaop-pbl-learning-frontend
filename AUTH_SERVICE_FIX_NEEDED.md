# 🔴 Supabase Auth 服务配置问题

## 问题诊断

### 当前状态
- ✅ **PostgreSQL**: 运行在 `10.1.20.75:8011` - 可访问
- ✅ **PostgREST**: 已配置连接到 port 8011 - 工作正常
- ❌ **Auth 服务 (GoTrue)**: 仍然尝试连接 port 5432 - **失败**

### 错误信息
```
POST http://10.1.20.75:8000/auth/v1/signup 500 (Internal Server Error)
{"code":500,"error_code":"unexpected_failure","msg":"Database error finding user"}
```

### 根本原因
Supabase Auth 服务 (GoTrue) 的数据库连接配置仍然指向 port 5432，但 PostgreSQL 实际运行在 port 8011。

## 需要的修复

### 方案 1: 修改 Supabase Auth 服务配置（推荐）

需要找到并修改 Supabase Auth 服务的配置文件，将数据库连接从 5432 改为 8011。

**可能的配置位置：**
1. Docker Compose 文件中的环境变量
2. Supabase config.toml 文件
3. Auth 服务的环境变量配置

**需要修改的环境变量：**
```bash
# 从
DATABASE_URL=postgresql://postgres:password@10.1.20.75:5432/postgres

# 改为
DATABASE_URL=postgresql://postgres:password@10.1.20.75:8011/postgres
```

或者：
```bash
# 从
DB_HOST=10.1.20.75
DB_PORT=5432

# 改为
DB_HOST=10.1.20.75
DB_PORT=8011
```

### 方案 2: 使用 SSH 隧道（临时方案）

如果无法直接修改 Auth 服务配置，可以创建 SSH 隧道将 5432 转发到 8011：

```bash
ssh -L 5432:10.1.20.75:8011 user@10.1.20.75
```

但这只是临时解决方案，不推荐用于生产环境。

## 已完成的修改

以下文件已更新为使用 port 8011：

1. ✅ `.env.local` - DATABASE_URL 已更新
2. ✅ `.env.example` - DATABASE_URL 已更新
3. ✅ `setup-db.js` - 数据库连接配置已更新
4. ✅ `setup-database.sh` - DB_PORT 已更新
5. ✅ `setup-database-docker.sh` - DB_PORT 已更新
6. ✅ `rebuild-tables-pg.js` - 已经使用 8011

## 下一步操作

### 如果您有 Supabase 服务的访问权限：

1. **找到 Supabase 部署配置**
   ```bash
   # 查找 docker-compose.yml
   find /path/to/supabase -name "docker-compose.yml"

   # 或查找 config.toml
   find /path/to/supabase -name "config.toml"
   ```

2. **修改 Auth 服务的数据库连接**

   在 docker-compose.yml 中找到 `auth` 或 `gotrue` 服务，修改环境变量：
   ```yaml
   services:
     auth:
       environment:
         DATABASE_URL: postgresql://postgres:password@10.1.20.75:8011/postgres
         # 或
         DB_HOST: 10.1.20.75
         DB_PORT: 8011
   ```

3. **重启 Auth 服务**
   ```bash
   docker-compose restart auth
   # 或
   docker restart supabase_auth_pbl-learning
   ```

4. **验证修复**
   ```bash
   curl -X POST "http://10.1.20.75:8000/auth/v1/signup" \
     -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123"}'
   ```

   应该返回成功响应而不是 500 错误。

### 如果 Supabase 运行在远程服务器上：

请联系管理 `10.1.20.75` 服务器的人员，告知需要修改 Supabase Auth 服务的数据库端口配置。

## 技术细节

### Supabase 架构
```
┌─────────────────┐
│   Next.js App   │
│  (localhost)    │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────┐
│   Supabase (10.1.20.75:8000)    │
│                                  │
│  ┌──────────────┐               │
│  │  PostgREST   │ ✅ Port 8011  │
│  └──────────────┘               │
│                                  │
│  ┌──────────────┐               │
│  │  Auth (GoTrue)│ ❌ Port 5432 │ ← 需要修复
│  └──────────────┘               │
│                                  │
│  ┌──────────────┐               │
│  │  Storage     │               │
│  └──────────────┘               │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │
│  Port 8011 ✅   │
└─────────────────┘
```

### 为什么 PostgREST 工作但 Auth 不工作？

PostgREST 和 Auth 是两个独立的服务，各有自己的数据库连接配置：

- **PostgREST**: 已经被修复，连接到 8011 ✅
- **Auth (GoTrue)**: 还没有被修复，仍然连接 5432 ❌

两个服务需要分别配置。

## 参考信息

- Supabase URL: `http://10.1.20.75:8000`
- PostgreSQL: `10.1.20.75:8011`
- Database: `postgres`
- User: `postgres`
- Password: `your-super-secret-password-change-this`

## 联系信息

如果需要帮助修改 Supabase 配置，请提供：
1. Supabase 的部署方式（Docker Compose / Kubernetes / 其他）
2. 配置文件的位置
3. 是否有权限重启服务

---

**创建时间**: 2026-01-13
**状态**: 🔴 待修复
