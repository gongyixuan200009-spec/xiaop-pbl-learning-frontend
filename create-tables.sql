-- ============================================================================
-- 创建组织管理系统所需的表
-- 运行此脚本在 Supabase SQL Editor: http://10.1.20.75:8000
-- ============================================================================

-- 1. 创建 organizations 表
CREATE TABLE IF NOT EXISTS organizations (
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

-- 2. 创建 organization_prompts 表
CREATE TABLE IF NOT EXISTS organization_prompts (
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

-- 3. 创建 organization_templates 表
CREATE TABLE IF NOT EXISTS organization_templates (
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

-- 4. 创建 user_organizations 表
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, organization_id)
);

-- 5. 创建 user_profiles 表
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    default_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 创建索引
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_prompts_org_id ON organization_prompts(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_default_org ON user_profiles(default_organization_id);

-- 7. 启用 RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 8. 创建 RLS 策略

-- Organizations 策略
DROP POLICY IF EXISTS "Anyone can view active organizations" ON organizations;
CREATE POLICY "Anyone can view active organizations"
    ON organizations FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations"
    ON organizations FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Organization owners can update" ON organizations;
CREATE POLICY "Organization owners can update"
    ON organizations FOR UPDATE USING (owner_id = auth.uid());

-- Organization prompts 策略
DROP POLICY IF EXISTS "Members can view prompts" ON organization_prompts;
CREATE POLICY "Members can view prompts"
    ON organization_prompts FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Owners can manage prompts" ON organization_prompts;
CREATE POLICY "Owners can manage prompts"
    ON organization_prompts FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Organization templates 策略
DROP POLICY IF EXISTS "Members can view templates" ON organization_templates;
CREATE POLICY "Members can view templates"
    ON organization_templates FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Owners can manage templates" ON organization_templates;
CREATE POLICY "Owners can manage templates"
    ON organization_templates FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- User organizations 策略
DROP POLICY IF EXISTS "Users can view their memberships" ON user_organizations;
CREATE POLICY "Users can view their memberships"
    ON user_organizations FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can join organizations" ON user_organizations;
CREATE POLICY "Users can join organizations"
    ON user_organizations FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can manage memberships" ON user_organizations;
CREATE POLICY "Owners can manage memberships"
    ON user_organizations FOR ALL
    USING (organization_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
    ));

-- User profiles 策略
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
CREATE POLICY "Users can view all profiles"
    ON user_profiles FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can insert their profile" ON user_profiles;
CREATE POLICY "Users can insert their profile"
    ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their profile" ON user_profiles;
CREATE POLICY "Users can update their profile"
    ON user_profiles FOR UPDATE USING (id = auth.uid());

-- 完成
SELECT
    'Tables created successfully!' as status,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('organizations', 'organization_prompts', 'organization_templates', 'user_organizations', 'user_profiles');
