# 🎉 Supabase 已修复！现在创建表

## ✅ 当前状态

- ✅ Supabase PostgREST 已成功连接到 PostgreSQL
- ✅ REST API 正常工作
- ⏳ 需要创建组织管理系统的表

---

## 📋 下一步操作（3 步完成）

### 步骤 1: 访问 Supabase Studio

在浏览器中打开：
```
http://10.1.20.75:8000
```

### 步骤 2: 运行 SQL 脚本

1. 点击左侧菜单的 **SQL Editor** 图标
2. 点击右上角的 **New query** 按钮
3. 打开项目中的 `create-tables.sql` 文件
4. 复制全部内容
5. 粘贴到 SQL 编辑器中
6. 点击右下角的 **RUN** 按钮

**预期结果：**
```
status: "Tables created successfully!"
table_count: 5
```

### 步骤 3: 测试注册

1. 访问注册页面：`http://localhost:3002/login`
2. 填写注册信息：
   - 显示名称：admin
   - 邮箱：admin@gmail.com
   - 密码：输入您的密码
   - 可选：勾选"注册为组织"并填写组织名称

3. 点击"注册"按钮

**预期结果：**
- ✅ 注册成功
- ✅ 收到"注册成功！请检查您的邮箱以验证账户。"提示
- ✅ 用户配置文件和组织自动创建

---

## 🔍 验证数据

注册成功后，在 Supabase SQL Editor 中运行以下查询验证：

```sql
-- 查看所有创建的表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('organizations', 'organization_prompts', 'user_organizations', 'user_profiles')
ORDER BY table_name;

-- 查看新注册的用户配置文件
SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 5;

-- 查看创建的组织
SELECT * FROM organizations ORDER BY created_at DESC LIMIT 5;

-- 查看用户-组织关系
SELECT * FROM user_organizations ORDER BY joined_at DESC LIMIT 5;

-- 查看默认提示词
SELECT * FROM organization_prompts ORDER BY created_at DESC LIMIT 5;
```

---

## 📊 创建的表说明

这个 SQL 脚本会创建 5 个表：

1. **organizations** - 组织信息表
   - 存储组织名称、描述、所有者等信息

2. **organization_prompts** - 组织提示词配置表
   - 存储每个组织的自定义 AI 提示词

3. **organization_templates** - 组织模板表
   - 存储组织的内容模板

4. **user_organizations** - 用户-组织关系表
   - 存储用户属于哪些组织，以及角色（owner/admin/member）

5. **user_profiles** - 用户配置文件表
   - 存储用户的显示名称、头像、默认组织等信息

---

## 🎯 注册流程说明

注册成功后，前端代码会自动：

1. ✅ 创建用户配置文件（user_profiles）
2. ✅ 创建默认个人组织（organizations）
3. ✅ 添加用户到组织（user_organizations）
4. ✅ 设置默认组织（user_profiles.default_organization_id）
5. ✅ 创建默认提示词（organization_prompts）
6. ✅ 如果勾选"注册为组织"，创建额外的组织

---

## 🚀 完成后可以做什么

注册成功后，您可以：

1. **登录系统**
   - 使用注册的邮箱和密码登录
   - 访问 Dashboard

2. **创建项目**
   - 在 Dashboard 点击"创建新项目"
   - 使用 AI 对话创建 PBL 项目

3. **管理组织**（如果注册为组织）
   - 访问 `/admin` 页面
   - 配置自定义 AI 提示词
   - 管理组织成员

4. **自定义提示词**
   - 在管理页面配置项目创建提示词
   - 配置不同阶段的引导提示词
   - 设置 AI 参数（temperature, max_tokens）

---

## ❓ 常见问题

### Q: SQL 脚本运行失败怎么办？

**A:** 如果看到错误，请：
1. 复制完整的错误信息
2. 检查是否有权限问题
3. 确认 Supabase 版本支持所有 SQL 语法

### Q: 注册后看不到数据？

**A:** 请检查：
1. 浏览器控制台是否有错误
2. 在 Supabase SQL Editor 中运行验证查询
3. 确认 RLS 策略已正确创建

### Q: 如何删除测试数据重新开始？

**A:** 在 SQL Editor 中运行：
```sql
TRUNCATE user_organizations, organization_prompts, user_profiles, organizations CASCADE;
```

---

## 📝 技术说明

### 为什么不使用数据库触发器？

我们选择在前端代码中创建组织和配置文件，而不是使用数据库触发器，原因是：

- ✅ 更容易调试和维护
- ✅ 更好的错误处理
- ✅ 可以显示详细的进度信息
- ✅ 避免触发器权限和 RLS 问题

### 安全性如何保证？

- ✅ 所有表都启用了 RLS（Row Level Security）
- ✅ 用户只能创建自己拥有的组织
- ✅ 用户只能访问自己所属组织的数据
- ✅ 所有操作都经过 Supabase 的身份验证和授权

---

**现在就去运行 SQL 脚本吧！** 🎉

有任何问题随时告诉我！
