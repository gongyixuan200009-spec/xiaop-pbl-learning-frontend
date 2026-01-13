# 🚀 快速修复 - 3 步解决注册问题

## 问题
注册时出现 "Database error finding user" 错误。

## 原因
数据库表还没有创建。

## 解决方案（只需 3 步）

### 步骤 1: 访问 Supabase Studio

打开浏览器，访问：
```
http://10.1.20.75:8000
```

或者如果您使用的是 Supabase Cloud，访问：
```
https://app.supabase.com
```

### 步骤 2: 运行 SQL 脚本

1. 在左侧菜单中，点击 **SQL Editor** （SQL 编辑器）
2. 点击 **New Query** （新建查询）
3. 打开文件 `setup-database.sql`
4. 复制全部内容
5. 粘贴到 SQL 编辑器中
6. 点击 **Run** （运行）按钮

您应该会看到：
```
Database setup completed successfully!
```

### 步骤 3: 测试注册

1. 回到注册页面：`http://localhost:3002/login`
2. 填写信息：
   - 显示名称：admin
   - 邮箱：admin@gmail.com
   - 密码：******
   - 勾选"注册为组织"
   - 组织名称：admin

3. 点击"注册"按钮

✅ 现在应该可以成功注册了！

## 验证成功

注册成功后，在 Supabase SQL Editor 中运行：

```sql
-- 查看新创建的用户配置文件
SELECT * FROM user_profiles;

-- 查看新创建的组织
SELECT * FROM organizations;

-- 查看用户-组织关系
SELECT * FROM user_organizations;

-- 查看默认提示词
SELECT * FROM organization_prompts;
```

您应该能看到刚创建的数据。

## 如果还有问题

### 问题 1: 找不到 SQL Editor

**本地 Supabase:**
- 访问 `http://10.1.20.75:8000`
- 点击左侧的 "SQL Editor" 图标

**Supabase Cloud:**
- 访问 `https://app.supabase.com`
- 选择您的项目
- 点击左侧的 "SQL Editor"

### 问题 2: SQL 执行失败

如果看到错误信息，请：
1. 复制完整的错误信息
2. 告诉我错误内容
3. 我会帮您解决

### 问题 3: 仍然显示 "Database error finding user"

这说明 SQL 脚本还没有成功运行。请：
1. 确认您访问的是正确的 Supabase 实例
2. 确认 SQL 脚本已经完整运行
3. 刷新浏览器页面
4. 再次尝试注册

## 工作原理

这个 SQL 脚本会：
1. ✅ 删除所有旧的表和触发器（如果存在）
2. ✅ 创建 5 个新表：
   - `organizations` - 组织表
   - `organization_prompts` - 提示词配置表
   - `organization_templates` - 模板表
   - `user_organizations` - 用户-组织关系表
   - `user_profiles` - 用户配置文件表
3. ✅ 创建索引（提高查询速度）
4. ✅ 启用 RLS（行级安全）
5. ✅ 创建安全策略（确保数据安全）

前端代码会在注册成功后自动创建组织和配置文件，不需要数据库触发器。

## 下一步

注册成功后：
1. 登录系统
2. 访问 `/admin` 页面配置提示词
3. 创建项目测试功能

---

**需要帮助？** 如果遇到任何问题，请告诉我具体的错误信息！
