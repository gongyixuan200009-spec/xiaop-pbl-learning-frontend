# 数据库迁移说明

## 问题诊断

错误 "Database error finding user" 是因为数据库触发器在创建用户时失败。已修复以下问题：

1. ✅ 添加了缺失的 `update_updated_at_column()` 函数
2. ✅ 修改了触发器函数使用 `SECURITY DEFINER` 以绕过 RLS 限制
3. ✅ 添加了错误处理和日志记录
4. ✅ 修复了 RLS 策略，分离 INSERT 和 UPDATE 权限
5. ✅ 移除了可能失败的默认数据插入

## 迁移步骤

### 步骤 1: 清理现有数据（如果需要）

如果您之前已经运行过部分迁移，请先在 Supabase SQL Editor 中运行以下清理脚本：

```sql
-- 删除现有触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_organization_prompts_updated_at ON organization_prompts;
DROP TRIGGER IF EXISTS update_organization_templates_updated_at ON organization_templates;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- 删除现有函数
DROP FUNCTION IF EXISTS create_user_profile_and_org();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS get_organization_prompts(UUID, VARCHAR, INTEGER);

-- 删除现有表（注意：这会删除所有数据！）
DROP TABLE IF EXISTS user_organizations CASCADE;
DROP TABLE IF EXISTS organization_templates CASCADE;
DROP TABLE IF EXISTS organization_prompts CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
```

### 步骤 2: 运行完整迁移

1. 打开 Supabase Dashboard
2. 进入 **SQL Editor**
3. 点击 **New Query**
4. 复制 `supabase-organizations.sql` 的全部内容
5. 粘贴到编辑器中
6. 点击 **Run** 执行

### 步骤 3: 验证迁移

运行以下查询验证表已创建：

```sql
-- 检查表是否存在
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'organizations',
    'organization_prompts',
    'organization_templates',
    'user_organizations',
    'user_profiles'
);

-- 检查触发器是否存在
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 检查函数是否存在
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';
```

### 步骤 4: 测试注册

迁移完成后，尝试注册一个新用户：

1. 访问 `/login` 页面
2. 切换到注册模式
3. 填写信息并提交
4. 检查是否成功创建用户

### 步骤 5: 验证数据

注册成功后，在 Supabase SQL Editor 中运行：

```sql
-- 查看新创建的用户配置文件
SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 5;

-- 查看新创建的组织
SELECT * FROM organizations ORDER BY created_at DESC LIMIT 5;

-- 查看用户-组织关系
SELECT * FROM user_organizations ORDER BY joined_at DESC LIMIT 5;

-- 查看默认提示词
SELECT * FROM organization_prompts ORDER BY created_at DESC LIMIT 5;
```

## 故障排除

### 如果注册仍然失败

1. 检查 Supabase 日志：
   - 进入 Supabase Dashboard
   - 点击 **Logs** → **Postgres Logs**
   - 查找错误信息

2. 检查触发器是否正确创建：
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

3. 手动测试触发器函数：
   ```sql
   -- 这会显示函数定义
   \df+ create_user_profile_and_org
   ```

### 如果看到 RLS 错误

确保 RLS 策略已正确创建：

```sql
-- 查看所有 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

## 下一步

迁移成功后：

1. 测试普通用户注册（不创建组织）
2. 测试组织注册（勾选"注册为组织"）
3. 访问 `/admin` 页面配置提示词
4. 创建项目测试自定义提示词是否生效
