-- ============================================================================
-- 一键设置脚本 - 删除旧表并重新创建
-- ============================================================================

-- 第一步：删除所有旧的触发器和函数
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_organization_prompts_updated_at ON organization_prompts;
DROP TRIGGER IF EXISTS update_organization_templates_updated_at ON organization_templates;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

DROP FUNCTION IF EXISTS create_user_profile_and_org();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS get_organization_prompts(UUID, VARCHAR, INTEGER);

-- 第二步：删除所有旧表
DROP TABLE IF EXISTS user_organizations CASCADE;
DROP TABLE IF EXISTS organization_templates CASCADE;
DROP TABLE IF EXISTS organization_prompts CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 第三步：创建新表

-- Organizations table
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

-- Organization prompts configuration
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

-- Organization content templates
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

-- User organization membership
CREATE TABLE user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, organization_id)
);

-- User profiles extension
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

-- 第四步：创建索引
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organization_prompts_org_id ON organization_prompts(organization_id);
CREATE INDEX idx_organization_prompts_type ON organization_prompts(prompt_type);
CREATE INDEX idx_organization_templates_org_id ON organization_templates(organization_id);
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX idx_user_profiles_default_org ON user_profiles(default_organization_id);

-- 第五步：启用 RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 第六步：创建 RLS 策略

-- Organizations policies
DROP POLICY IF EXISTS "Anyone can view active organizations" ON organizations;
CREATE POLICY "Anyone can view active organizations"
    ON organizations FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Organization owners can update their organizations" ON organizations;
CREATE POLICY "Organization owners can update their organizations"
    ON organizations FOR UPDATE
    USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Organization owners can delete their organizations" ON organizations;
CREATE POLICY "Organization owners can delete their organizations"
    ON organizations FOR DELETE
    USING (owner_id = auth.uid());

-- Organization prompts policies
DROP POLICY IF EXISTS "Members can view organization prompts" ON organization_prompts;
CREATE POLICY "Members can view organization prompts"
    ON organization_prompts FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organization owners and admins can manage prompts" ON organization_prompts;
CREATE POLICY "Organization owners and admins can manage prompts"
    ON organization_prompts FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Organization templates policies
DROP POLICY IF EXISTS "Members can view organization templates" ON organization_templates;
CREATE POLICY "Members can view organization templates"
    ON organization_templates FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organization owners and admins can manage templates" ON organization_templates;
CREATE POLICY "Organization owners and admins can manage templates"
    ON organization_templates FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- User organizations policies
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;
CREATE POLICY "Users can view their organization memberships"
    ON user_organizations FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can join organizations" ON user_organizations;
CREATE POLICY "Users can join organizations"
    ON user_organizations FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Organization owners can manage memberships" ON user_organizations;
CREATE POLICY "Organization owners can manage memberships"
    ON user_organizations FOR ALL
    USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

-- User profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
CREATE POLICY "Users can view all profiles"
    ON user_profiles FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (id = auth.uid());

-- 完成！
SELECT 'Database setup completed successfully!' as status;
