# 工小助学习助手 - Supabase 迁移指南

## 📋 目录

1. [迁移概述](#迁移概述)
2. [准备工作](#准备工作)
3. [数据库迁移步骤](#数据库迁移步骤)
4. [数据迁移步骤](#数据迁移步骤)
5. [后端代码更新](#后端代码更新)
6. [验证迁移](#验证迁移)

---

## 迁移概述

本指南将帮助你将现有的基于 JSON 文件的数据存储迁移到 Supabase PostgreSQL 数据库。

### 迁移内容

- ✅ 用户数据 (users.json)
- ✅ 表单配置 (form_config.json)
- ✅ API 配置 (api_key_config.json)
- ✅ Pipeline 配置 (pipelines.json)
- ✅ 用户进度数据 (user_progress/*.json)
- ✅ 提示词历史 (prompt_history.json)

---

## 准备工作

### 1. 确认 Supabase 连接信息

你已经提供的 Supabase 信息:

```
API端点: http://10.1.20.75:8000
匿名密钥: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
服务角色密钥: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
数据库连接: postgresql://postgres:your-super-secret-password-change-this@10.1.20.75:5432/postgres
```

### 2. 安装必要的依赖

```bash
cd backend
pip install supabase python-dotenv
```

### 3. 配置环境变量

创建 `backend/.env` 文件:

```bash
cp backend/.env.example backend/.env
```

编辑 `.env` 文件,填入你的 Supabase 信息:

```env
SUPABASE_URL=http://10.1.20.75:8000
SUPABASE_ANON_KEY=你的匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
DATABASE_URL=postgresql://postgres:your-super-secret-password-change-this@10.1.20.75:5432/postgres
```

---

## 数据库迁移步骤

### 步骤 1: 访问 Supabase Dashboard

1. 打开浏览器访问: `http://10.1.20.75:3000`
2. 使用以下凭据登录:
   - 用户名: `supabase`
   - 密码: `supabase-dashboard-2025`

### 步骤 2: 执行数据库迁移脚本

1. 在 Supabase Dashboard 中,点击左侧菜单的 **SQL Editor**
2. 点击 **New Query** 创建新查询
3. 打开文件 `backend/scripts/supabase_migration.sql`
4. 复制整个 SQL 脚本内容
5. 粘贴到 SQL Editor 中
6. 点击 **Run** 执行脚本

### 步骤 3: 验证数据库结构

执行以下 SQL 查询验证表是否创建成功:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

你应该看到以下表:
- users
- form_configs
- api_configs
- pipeline_configs
- user_projects
- project_step_data
- prompt_history
- user_uploads
- age_adaptation_configs

---

## 数据迁移步骤

### 步骤 1: 备份现有数据

```bash
cd xiaop-v2-dev-deploy
tar -czf data_backup_$(date +%Y%m%d_%H%M%S).tar.gz backend/data/
```

### 步骤 2: 运行数据迁移工具

```bash
cd backend
python scripts/migrate_to_supabase.py
```

迁移工具会自动:
1. 读取所有 JSON 文件
2. 转换数据格式
3. 插入到 Supabase 数据库
4. 显示迁移进度和结果

### 步骤 3: 验证数据迁移

在 Supabase Dashboard 中执行以下查询:

```sql
-- 检查用户数量
SELECT COUNT(*) as user_count FROM users;

-- 检查表单配置
SELECT id, name FROM form_configs ORDER BY id;

-- 检查用户项目
SELECT COUNT(*) as project_count FROM user_projects;
```

---

## 后端代码更新

### 已创建的服务文件

迁移后,后端代码已经准备好使用 Supabase:

- `backend/services/supabase_client.py` - Supabase 客户端
- `backend/services/user_service.py` - 用户服务
- `backend/services/project_service.py` - 项目服务
- `backend/services/config_service.py` - 配置服务

### 更新路由文件

你需要更新现有的路由文件以使用新的服务层。参考示例:

```python
# 旧代码 (基于 JSON)
from config import load_form_config

# 新代码 (基于 Supabase)
from services.config_service import ConfigService

# 使用示例
form_configs = ConfigService.get_form_configs()
```

---

## 验证迁移

### 1. 启动后端服务

```bash
cd backend
python main.py
```

### 2. 测试 API 端点

```bash
# 测试健康检查
curl http://localhost:8504/health

# 测试获取表单配置
curl http://localhost:8504/api/admin/forms
```

### 3. 检查日志

查看 `backend/backend.log` 确认没有数据库连接错误。

---

## 常见问题

### Q: 迁移失败怎么办?

A: 检查以下几点:
1. Supabase 服务是否正常运行
2. 环境变量是否正确配置
3. 网络连接是否正常
4. 查看错误日志获取详细信息

### Q: 如何回滚到 JSON 存储?

A: 保留原有的 JSON 文件作为备份,如需回滚:
1. 停止使用 Supabase 服务
2. 恢复原有的代码版本
3. 使用备份的 JSON 文件

### Q: 数据迁移后原 JSON 文件怎么处理?

A: 建议:
1. 保留原文件作为备份
2. 验证迁移成功后可以归档
3. 不要立即删除,至少保留一周

---

## 下一步

完成 Supabase 迁移后,请参考 [Zeabur 部署指南](./ZEABUR_DEPLOYMENT_GUIDE.md) 进行项目部署。
