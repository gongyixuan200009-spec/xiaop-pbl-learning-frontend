# 数据迁移当前状态和解决方案

## 当前状态

### ✅ 已完成
- **68个用户**已成功迁移到Supabase
- 密码兼容性已解决（SHA256格式）
- 旧用户可以使用原密码登录

### ❌ 待完成
- **66个进度文件**等待迁移
- 需要先修复表结构问题

## 遇到的问题

### 问题1: 表结构不匹配
- Supabase中的`user_projects`表结构与预期不符
- PostgREST的schema缓存未更新

### 问题2: 无法通过编程方式执行SQL
- PostgreSQL端口5432无法访问（超时）
- 端口8011返回"Tenant or user not found"错误（Supavisor连接池需要租户信息）
- PostgREST REST API不支持执行DDL语句

### 问题3: Supabase服务连接问题
最新错误显示Supabase内部数据库连接失败：
```
connection to server at "db" (172.18.0.5), port 5432 failed: Connection refused
```

## 解决方案

### 方案A: 重启Supabase服务（推荐）

Supabase服务似乎出现了问题，需要重启：

```bash
# SSH到Supabase服务器
ssh user@10.1.20.75

# 重启Supabase
cd /path/to/supabase
docker-compose restart

# 或者只重启相关服务
docker restart supabase-db
docker restart supabase-rest
```

重启后：
1. 访问 http://10.1.20.75:8000 确认服务正常
2. 在SQL Editor中执行 `backend/scripts/rebuild_tables.sql`
3. 运行 `python3 scripts/auto_migrate.py`

### 方案B: 通过Supabase Studio手动执行（最可靠）

1. **访问Supabase Studio**
   - URL: http://10.1.20.75:8000
   - 等待服务恢复正常

2. **执行SQL脚本**
   - 进入 SQL Editor
   - 复制以下文件内容: `backend/scripts/rebuild_tables.sql`
   - 或者复制下面的SQL

3. **运行迁移脚本**
   ```bash
   cd backend
   python3 scripts/auto_migrate.py
   ```

### 方案C: 使用备用迁移方法

如果Supabase服务持续有问题，可以：

1. **导出现有用户数据**
   ```bash
   # 备份已迁移的用户
   python3 scripts/backup_users.py
   ```

2. **重新初始化Supabase**
   - 完全重启Supabase服务
   - 执行完整的schema初始化
   - 重新运行完整迁移

3. **或者暂时使用JSON文件**
   - 保持原有的JSON文件系统
   - 等待Supabase服务稳定后再迁移

## 需要执行的SQL

```sql
-- 删除并重建表
DROP TABLE IF EXISTS user_uploads CASCADE;
DROP TABLE IF EXISTS prompt_history CASCADE;
DROP TABLE IF EXISTS project_step_data CASCADE;
DROP TABLE IF EXISTS user_projects CASCADE;

-- 创建user_projects表
CREATE TABLE user_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    current_step INTEGER DEFAULT 1,
    completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_name)
);

-- 创建project_step_data表
CREATE TABLE project_step_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    form_id INTEGER,
    extracted_fields JSONB DEFAULT '{}',
    chat_history JSONB DEFAULT '[]',
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, step_number)
);

-- 创建其他表（form_configs, api_configs等）
-- 见完整SQL文件: backend/scripts/rebuild_tables.sql

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_is_active ON user_projects(is_active);
CREATE INDEX IF NOT EXISTS idx_project_step_data_project_id ON project_step_data(project_id);
CREATE INDEX IF NOT EXISTS idx_project_step_data_step_number ON project_step_data(step_number);

-- 禁用RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_step_data DISABLE ROW LEVEL SECURITY;
```

## 诊断命令

### 检查Supabase服务状态
```bash
# 在Supabase服务器上
docker ps | grep supabase
docker logs supabase-db --tail 50
docker logs supabase-rest --tail 50
```

### 检查端口
```bash
# 检查端口是否开放
nc -zv 10.1.20.75 8000  # Supabase Studio
nc -zv 10.1.20.75 8011  # PostgreSQL (Supavisor)
```

### 测试REST API
```bash
curl http://10.1.20.75:8000/rest/v1/users?limit=1 \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 下一步行动

### 立即行动
1. **检查Supabase服务状态**
   - 访问 http://10.1.20.75:8000
   - 如果无法访问，需要重启服务

2. **如果服务正常**
   - 在SQL Editor中执行rebuild_tables.sql
   - 运行auto_migrate.py

3. **如果服务异常**
   - 重启Supabase服务
   - 或联系系统管理员

### 验证步骤
迁移完成后验证：
```sql
SELECT COUNT(*) FROM users;           -- 应该是68
SELECT COUNT(*) FROM user_projects;   -- 应该有项目数据
SELECT COUNT(*) FROM project_step_data; -- 应该有步骤数据
```

## 联系信息

如果需要：
- Supabase服务器SSH访问权限
- Supabase管理员账号
- 数据库直接访问权限

请提供相应的凭据或权限。

## 备注

- 所有原始JSON文件保持不变，可作为备份
- 迁移脚本可以多次运行，会自动跳过已存在的数据
- 用户密码已兼容，无需重置
