# 快速修复指南 - 解决注册 500 错误

## 问题原因

注册时出现 500 错误是因为数据库触发器失败。我已经创建了一个新的解决方案：**不使用触发器，而是在前端代码中手动创建组织和配置文件**。

## 修复步骤

### 步骤 1: 运行最小化数据库迁移

1. 打开 Supabase Dashboard
2. 进入 **SQL Editor**
3. 点击 **New Query**
4. 复制 `supabase-organizations-minimal.sql` 的全部内容
5. 粘贴到编辑器中
6. 点击 **Run** 执行

这个脚本会：
- 创建所有必要的表（organizations, organization_prompts, user_profiles 等）
- 设置 RLS 策略
- **不创建任何触发器**（避免触发器导致的错误）

### 步骤 2: 测试注册

1. 刷新浏览器页面
2. 访问 `/login` 页面
3. 切换到注册模式
4. 填写信息：
   - 显示名称：123
   - 邮箱：admin@gmail.com
   - 密码：******
   - 可选：勾选"注册为组织"并填写组织名称

5. 点击"注册"按钮

现在注册应该可以成功了！前端代码会自动：
- 创建用户配置文件
- 创建默认个人组织
- 添加用户到组织
- 创建默认提示词
- 如果勾选了"注册为组织"，还会创建额外的组织

### 步骤 3: 验证注册成功

在 Supabase SQL Editor 中运行：

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

## 工作原理

### 旧方案（有问题）
- 用户注册 → Supabase 触发器自动创建组织 → **触发器失败导致 500 错误**

### 新方案（已修复）
- 用户注册 → 前端代码手动创建组织 → **成功！**

前端代码（`app/login/page.tsx`）现在会在注册成功后：

1. 创建用户配置文件（user_profiles）
2. 创建默认组织（organizations）
3. 添加用户到组织（user_organizations）
4. 设置默认组织（user_profiles.default_organization_id）
5. 创建默认提示词（organization_prompts）
6. 如果用户选择"注册为组织"，创建额外的组织

## 关于 favicon.ico 404 错误

这个错误不影响功能，只是浏览器找不到网站图标。可以忽略，或者创建一个 favicon.ico 文件放在 `public/` 目录下。

## 故障排除

### 如果仍然出现错误

1. **检查 Supabase 连接**
   - 确认 `.env.local` 中的 Supabase URL 和 Key 正确
   - 确认可以访问 Supabase 项目

2. **检查表是否创建成功**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN (
       'organizations',
       'organization_prompts',
       'user_organizations',
       'user_profiles'
   );
   ```
   应该返回 4 个表名。

3. **检查 RLS 策略**
   ```sql
   SELECT tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public';
   ```
   应该看到多个策略。

4. **查看浏览器控制台**
   - 打开浏览器开发者工具（F12）
   - 查看 Console 标签页
   - 如果有错误，复制错误信息

### 如果看到 "relation does not exist" 错误

说明表还没有创建，请重新运行步骤 1 的 SQL 脚本。

### 如果看到 "permission denied" 错误

说明 RLS 策略有问题，请确认：
1. 已经运行了完整的 SQL 脚本
2. 用户已经成功注册（在 Supabase Dashboard → Authentication 中可以看到）

## 下一步

注册成功后：

1. **登录系统**
   - 使用刚注册的邮箱和密码登录
   - 会跳转到 `/dashboard` 页面

2. **访问管理页面**（如果注册为组织）
   - 访问 `/admin` 页面
   - 可以配置自定义提示词

3. **创建项目**
   - 在 Dashboard 点击"创建新项目"
   - 系统会使用您组织的自定义提示词

## 技术细节

### 为什么不用触发器？

数据库触发器在 Supabase 中可能因为以下原因失败：
- RLS 策略限制
- 权限问题
- 函数定义错误
- 依赖的函数不存在

使用前端代码手动创建的优点：
- ✅ 更容易调试
- ✅ 更好的错误处理
- ✅ 可以显示详细的错误信息给用户
- ✅ 不依赖数据库触发器

### 安全性

前端代码创建组织是安全的，因为：
- RLS 策略确保用户只能创建自己拥有的组织
- `owner_id` 必须等于当前用户的 ID
- 所有操作都经过 Supabase 的身份验证和授权检查
