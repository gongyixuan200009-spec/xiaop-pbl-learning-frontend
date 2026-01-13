# ✅ 最终解决方案 - 一步到位

## 问题确认

从日志可以看到：
```
Could not find the table 'public.organizations' in the schema cache
```

**问题原因：数据库表还没有创建。**

**好消息：Supabase 本身运行正常！只需要创建表即可。**

---

## 🎯 解决步骤（只需 2 步）

### 步骤 1: 访问 Supabase Studio

在浏览器中打开：
```
http://10.1.20.75:8000
```

### 步骤 2: 运行 SQL 脚本

1. 点击左侧菜单的 **SQL Editor** （SQL 编辑器）
2. 点击右上角的 **New Query** （新建查询）
3. 复制下面的 SQL 代码，粘贴到编辑器中
4. 点击右下角的 **Run** （运行）按钮

```sql
-- ============================================================================
-- 一键创建所有表 - 复制这段代码到 Supabase SQL Editor
-- ============================================================================

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS user_organizations CASCADE;
DROP TABLE IF EXISTS organization_templates CASCADE;
DROP TABLE IF EXISTS organization_prompts CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 创建 organizations 表
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 organization_prompts 表
CREATE TABLE organization_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    prompt_type VARCHAR(100) NOT NULL,
    stage_number INTEGER CHECK (stage_number >= 1 AND stage_number <= 6),
    prompt_name VARCHAR(255) NOT NULL,
    prompt_content TEXT NOT NULL,
    system_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 organization_templates 表
CREATE TABLE organization_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_type VARCHAR(100) NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    template_content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 user_organizations 表
CREATE TABLE user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, organization_id)
);

-- 创建 user_profiles 表
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    default_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organization_prompts_org_id ON organization_prompts(organization_id);
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_profiles_default_org ON user_profiles(default_organization_id);

-- 启用 RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Anyone can view active organizations"
    ON organizations FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can create organizations"
    ON organizations FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Organization owners can update"
    ON organizations FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Members can view prompts"
    ON organization_prompts FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    ));

CREATE POLICY "Owners can manage prompts"
    ON organization_prompts FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Members can view templates"
    ON organization_templates FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    ));

CREATE POLICY "Owners can manage templates"
    ON organization_templates FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Users can view their memberships"
    ON user_organizations FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join organizations"
    ON user_organizations FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can manage memberships"
    ON user_organizations FOR ALL
    USING (organization_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Users can view all profiles"
    ON user_profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert their profile"
    ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their profile"
    ON user_profiles FOR UPDATE USING (id = auth.uid());

-- 完成
SELECT 'Tables created successfully!' as status;
```

### 步骤 3: 测试注册

1. 刷新注册页面：`http://localhost:3002/login`
2. 填写信息并注册
3. 应该可以成功了！

---

## ✅ 验证成功

注册成功后，在 Supabase SQL Editor 中运行：

```sql
-- 查看所有表
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 查看新注册的用户数据
SELECT * FROM user_profiles;
SELECT * FROM organizations;
SELECT * FROM user_organizations;
```

---

## 🎉 完成后的功能

注册成功后，您可以：

1. ✅ 登录系统
2. ✅ 访问 Dashboard
3. ✅ 创建项目
4. ✅ 如果注册为组织，可以访问 `/admin` 配置提示词

---

## 💡 为什么现在可以工作？

- **之前**：数据库没有表 → 注册失败
- **现在**：创建了所有必要的表 → 注册成功 → 前端代码自动创建组织和配置文件

---

## 🆘 如果还有问题

如果运行 SQL 后仍然失败，请：

1. 刷新浏览器页面（清除缓存）
2. 检查 Supabase SQL Editor 是否显示 "Tables created successfully!"
3. 告诉我具体的错误信息

---

**现在就去运行 SQL 脚本吧！只需要 2 分钟！** 🚀
