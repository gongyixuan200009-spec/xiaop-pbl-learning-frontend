-- ============================================================================
-- ORGANIZATIONS & CONFIGURATION MANAGEMENT
-- ============================================================================

-- Organizations table - 管理者/组织
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Organization prompts configuration - 组织的 prompt 配置
CREATE TABLE IF NOT EXISTS organization_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    prompt_type VARCHAR(100) NOT NULL, -- 'project_creation', 'stage_guidance', 'evaluation', etc.
    stage_number INTEGER CHECK (stage_number >= 1 AND stage_number <= 6),
    prompt_name VARCHAR(255) NOT NULL,
    prompt_content TEXT NOT NULL,
    system_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, prompt_type, stage_number, version)
);

-- Organization content templates - 组织的内容模板
CREATE TABLE IF NOT EXISTS organization_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_type VARCHAR(100) NOT NULL, -- 'project_description', 'stage_instructions', 'evaluation_criteria'
    template_name VARCHAR(255) NOT NULL,
    template_content TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- 模板变量定义
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User organization membership - 用户所属组织
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, organization_id)
);

-- User profiles extension - 扩展用户信息
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

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organization_prompts_org_id ON organization_prompts(organization_id);
CREATE INDEX idx_organization_prompts_type ON organization_prompts(prompt_type);
CREATE INDEX idx_organization_templates_org_id ON organization_templates(organization_id);
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX idx_user_profiles_default_org ON user_profiles(default_organization_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_prompts_updated_at BEFORE UPDATE ON organization_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_templates_updated_at BEFORE UPDATE ON organization_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Anyone can view active organizations"
    ON organizations FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Organization owners can update their organizations"
    ON organizations FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Organization owners can delete their organizations"
    ON organizations FOR DELETE
    USING (owner_id = auth.uid());

-- Organization prompts policies
CREATE POLICY "Members can view organization prompts"
    ON organization_prompts FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners and admins can manage prompts"
    ON organization_prompts FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Organization templates policies
CREATE POLICY "Members can view organization templates"
    ON organization_templates FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners and admins can manage templates"
    ON organization_templates FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- User organizations policies
CREATE POLICY "Users can view their organization memberships"
    ON user_organizations FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can join organizations"
    ON user_organizations FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Organization owners can manage memberships"
    ON user_organizations FOR ALL
    USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

-- User profiles policies
CREATE POLICY "Users can view all profiles"
    ON user_profiles FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to create default organization for new user
CREATE OR REPLACE FUNCTION create_user_profile_and_org()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    new_org_id UUID;
    user_display_name VARCHAR;
BEGIN
    -- Get display name
    user_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));

    -- Create user profile
    INSERT INTO user_profiles (id, display_name)
    VALUES (NEW.id, user_display_name);

    -- Create default organization for the user
    INSERT INTO organizations (name, slug, description, owner_id, settings)
    VALUES (
        user_display_name || ' 的组织',
        'user-' || NEW.id,
        '个人默认组织',
        NEW.id,
        '{"is_default": true}'::jsonb
    )
    RETURNING id INTO new_org_id;

    -- Add user to their default organization as owner
    INSERT INTO user_organizations (user_id, organization_id, role, is_active)
    VALUES (NEW.id, new_org_id, 'owner', TRUE);

    -- Set default organization in user profile
    UPDATE user_profiles
    SET default_organization_id = new_org_id
    WHERE id = NEW.id;

    -- Create default prompts for the new organization
    INSERT INTO organization_prompts (organization_id, prompt_type, prompt_name, prompt_content, system_prompt)
    VALUES (
        new_org_id,
        'project_creation',
        '默认项目创建提示词',
        '你是一个专业的 PBL（基于问题的学习）项目助手。你的任务是通过对话方式帮助用户创建一个结构化的学习项目。

请按照以下步骤引导用户：

1. 首先询问用户想要解决什么问题或学习什么主题
2. 帮助用户明确问题陈述（problem statement）
3. 询问项目标题
4. 可选：询问目标受众、预期成果等补充信息

在对话过程中：
- 保持友好和鼓励的语气
- 提出引导性问题帮助用户思考
- 确保收集到的信息清晰明确
- 当收集到标题和问题陈述后，告知用户可以创建项目了

请用中文回复。',
        '你是一个专业的教育助手，擅长引导学生进行基于问题的学习。'
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in create_user_profile_and_org: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_and_org();

-- Function to get active prompts for organization
CREATE OR REPLACE FUNCTION get_organization_prompts(
    p_organization_id UUID,
    p_prompt_type VARCHAR,
    p_stage_number INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    prompt_name VARCHAR,
    prompt_content TEXT,
    system_prompt TEXT,
    temperature DECIMAL,
    max_tokens INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        op.id,
        op.prompt_name,
        op.prompt_content,
        op.system_prompt,
        op.temperature,
        op.max_tokens
    FROM organization_prompts op
    WHERE op.organization_id = p_organization_id
        AND op.prompt_type = p_prompt_type
        AND op.is_active = TRUE
        AND (p_stage_number IS NULL OR op.stage_number = p_stage_number)
    ORDER BY op.version DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Note: Default organizations are now created automatically for each user
-- via the create_user_profile_and_org() trigger function

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE organizations IS 'Organizations/管理者 that can configure prompts and templates';
COMMENT ON TABLE organization_prompts IS 'AI prompts configuration for each organization';
COMMENT ON TABLE organization_templates IS 'Content templates for organizations';
COMMENT ON TABLE user_organizations IS 'User membership in organizations';
COMMENT ON TABLE user_profiles IS 'Extended user profile information';
