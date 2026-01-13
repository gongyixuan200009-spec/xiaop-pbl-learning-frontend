# 快速启动指南

## 🚨 当前问题

**错误：** `Could not find the 'current_stage' column of 'projects' in the schema cache`

**原因：** 数据库表还没有创建

## ✅ 快速解决方案

### 方案 A：最小化设置（推荐，5分钟）

使用简化的数据库架构，只创建必需的表：

1. **打开 Supabase Dashboard**
   - 访问 https://supabase.com/dashboard
   - 选择你的项目
   - 点击左侧的 **SQL Editor**

2. **运行最小化脚本**
   - 点击 **New Query**
   - 复制 `supabase-minimal-setup.sql` 的全部内容
   - 粘贴到编辑器
   - 点击 **Run**

3. **验证表已创建**
   运行以下查询：
   ```sql
   SELECT * FROM projects LIMIT 1;
   ```
   如果没有报错，说明表创建成功！

4. **测试应用**
   - 刷新浏览器
   - 尝试创建项目
   - 应该可以成功创建了！

### 方案 B：完整设置（30分钟）

如果你想要完整的功能（6阶段、测试系统等）：

1. 在 Supabase SQL Editor 中运行 `supabase-setup.sql`
2. 这会创建所有表和功能
3. 但需要更多时间来设置

## 📊 两种方案的区别

### 最小化设置（supabase-minimal-setup.sql）
✅ 只需 5 分钟
✅ 可以立即测试基本功能
✅ 可以创建和查看项目
❌ 没有阶段管理功能
❌ 没有测试系统
❌ 没有协作功能

**适合：** 快速验证应用是否工作

### 完整设置（supabase-setup.sql）
✅ 完整的 6 阶段 PBL 系统
✅ 测试和评估功能
✅ 多用户协作
✅ AI 交互记录
❌ 需要更多时间设置

**适合：** 生产环境使用

## 🎯 推荐流程

1. **先用最小化设置** 验证应用能正常工作
2. **测试基本功能** 确保认证、创建项目等都正常
3. **再运行完整设置** 获得所有功能

## 📝 最小化设置后的功能

使用最小化设置后，你可以：
- ✅ 注册和登录
- ✅ 创建项目
- ✅ 查看项目列表
- ✅ 编辑项目信息
- ❌ 暂时无法使用阶段功能（需要完整设置）

## 🔄 从最小化升级到完整

如果你先用了最小化设置，想升级到完整版：

1. 在 Supabase SQL Editor 中运行：
   ```sql
   -- 添加缺失的列
   ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
   ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_stage INTEGER DEFAULT 1;
   ALTER TABLE projects ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
   ```

2. 然后运行 `supabase-setup.sql` 中的其他表创建语句

## 🐛 故障排除

### 问题：运行 SQL 时出错
**解决：**
1. 确保你有管理员权限
2. 尝试分段运行（一次运行几行）
3. 检查是否有语法错误

### 问题：表创建成功但仍然报错
**解决：**
1. 刷新浏览器（Cmd+Shift+R 或 Ctrl+Shift+R）
2. 清除浏览器缓存
3. 重新登录

### 问题：RLS 策略导致无法访问
**解决：**
运行以下查询检查策略：
```sql
SELECT * FROM pg_policies WHERE tablename = 'projects';
```

## ✅ 验证清单

运行最小化设置后，检查：

- [ ] 在 Supabase 中可以看到 `projects` 表
- [ ] 表有以下列：id, title, description, created_by, created_at, updated_at
- [ ] RLS 策略已启用
- [ ] 可以在应用中创建项目
- [ ] 可以在应用中查看项目列表

## 🚀 下一步

1. **立即执行：** 在 Supabase 中运行 `supabase-minimal-setup.sql`
2. **测试应用：** 刷新浏览器并尝试创建项目
3. **验证成功：** 确认可以创建和查看项目
4. **可选升级：** 如需完整功能，运行 `supabase-setup.sql`

---

**当前状态：** 等待数据库设置
**预计时间：** 5 分钟（最小化）或 30 分钟（完整）
**下一步：** 在 Supabase 中运行 SQL 脚本
