-- ==========================================
-- 工小助学习助手 - Supabase 数据库迁移脚本
-- ==========================================
-- 创建时间: 2026-01-08
-- 说明: 将 JSON 文件存储迁移到 Supabase PostgreSQL 数据库

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. 用户表 (users)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- 用户资料 (原 profile 对象)
    grade VARCHAR(50),
    gender VARCHAR(20),
    math_score VARCHAR(50),
    science_feeling TEXT,

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,

    -- 索引优化
    CONSTRAINT username_length CHECK (char_length(username) >= 1)
);

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ==========================================
-- 2. 表单配置表 (form_configs)
-- ==========================================
CREATE TABLE IF NOT EXISTS form_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    user_description TEXT NOT NULL,

    -- 字段配置
    fields JSONB NOT NULL DEFAULT '[]',

    -- 提取和测试配置
    extraction_prompt TEXT,
    test_enabled BOOLEAN DEFAULT false,
    test_prompt TEXT,
    test_pass_pattern VARCHAR(255),

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 排序
    sort_order INTEGER DEFAULT 0
);

-- 创建索引
CREATE INDEX idx_form_configs_sort_order ON form_configs(sort_order ASC);

-- ==========================================
-- 3. API 配置表 (api_configs)
-- ==========================================
CREATE TABLE IF NOT EXISTS api_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 预设默认配置
INSERT INTO api_configs (config_key, config_value, description) VALUES
('api_key', '', 'OpenRouter API Key'),
('api_endpoint', 'https://openrouter.ai/api/v1', 'API Endpoint'),
('default_model', 'deepseek/deepseek-chat', '默认模型'),
('fast_model', 'deepseek/deepseek-chat', '快速模型'),
('vision_model', 'openai/gpt-4o-mini', '视觉模型'),
('vision_model_enabled', 'true', '是否启用视觉模型'),
('chat_mode', 'single_agent', '对话模式'),
('debug_mode', 'true', '调试模式')
ON CONFLICT (config_key) DO NOTHING;

-- ==========================================
-- 4. Pipeline 配置表 (pipeline_configs)
-- ==========================================
CREATE TABLE IF NOT EXISTS pipeline_configs (
    id SERIAL PRIMARY KEY,
    pipeline_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_pipeline_configs_active ON pipeline_configs(is_active);

-- ==========================================
-- 5. 用户项目表 (user_projects)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id VARCHAR(100) NOT NULL, -- 原短ID如 "f629860f"
    name VARCHAR(500) NOT NULL,
    current_step INTEGER DEFAULT 1,
    completed_steps INTEGER[] DEFAULT '{}',

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 唯一约束
    UNIQUE(user_id, project_id)
);

-- 创建索引
CREATE INDEX idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX idx_user_projects_project_id ON user_projects(project_id);

-- ==========================================
-- 6. 项目步骤数据表 (project_step_data)
-- ==========================================
CREATE TABLE IF NOT EXISTS project_step_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_uuid UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    form_id INTEGER REFERENCES form_configs(id),

    -- 提取的字段数据
    extracted_fields JSONB NOT NULL DEFAULT '{}',

    -- 聊天历史
    chat_history JSONB NOT NULL DEFAULT '[]',

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 唯一约束
    UNIQUE(project_uuid, step_number)
);

-- 创建索引
CREATE INDEX idx_project_step_data_project_uuid ON project_step_data(project_uuid);
CREATE INDEX idx_project_step_data_step_number ON project_step_data(step_number);

-- ==========================================
-- 7. 提示词历史表 (prompt_history)
-- ==========================================
CREATE TABLE IF NOT EXISTS prompt_history (
    id SERIAL PRIMARY KEY,
    history_type VARCHAR(50) NOT NULL, -- 'form_config', 'test_config'
    identifier VARCHAR(500) NOT NULL, -- 如 "1:Step 1: 明确和界定问题"
    content JSONB NOT NULL,
    description TEXT,
    operator VARCHAR(255) DEFAULT 'admin',

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_prompt_history_type ON prompt_history(history_type);
CREATE INDEX idx_prompt_history_identifier ON prompt_history(identifier);
CREATE INDEX idx_prompt_history_created_at ON prompt_history(created_at DESC);

-- ==========================================
-- 8. 用户上传文件表 (user_uploads)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_uuid UUID REFERENCES user_projects(id) ON DELETE CASCADE,

    -- 文件信息
    original_filename VARCHAR(500) NOT NULL,
    stored_filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),

    -- Supabase Storage 信息
    storage_bucket VARCHAR(100) DEFAULT 'user-uploads',
    storage_path TEXT,

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_user_uploads_user_id ON user_uploads(user_id);
CREATE INDEX idx_user_uploads_project_uuid ON user_uploads(project_uuid);

-- ==========================================
-- 9. 年龄适配配置表 (age_adaptation_configs)
-- ==========================================
CREATE TABLE IF NOT EXISTS age_adaptation_configs (
    id SERIAL PRIMARY KEY,
    config_data JSONB NOT NULL DEFAULT '{}',

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO age_adaptation_configs (config_data) VALUES ('{}')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 10. 创建更新时间触发器函数
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有需要的表添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_configs_updated_at BEFORE UPDATE ON form_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_configs_updated_at BEFORE UPDATE ON api_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_configs_updated_at BEFORE UPDATE ON pipeline_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON user_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_step_data_updated_at BEFORE UPDATE ON project_step_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_age_adaptation_configs_updated_at BEFORE UPDATE ON age_adaptation_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 11. 启用 Row Level Security (RLS)
-- ==========================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_step_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_uploads ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和修改自己的数据
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- 用户项目策略
CREATE POLICY "Users can view own projects" ON user_projects
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own projects" ON user_projects
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own projects" ON user_projects
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own projects" ON user_projects
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- 项目步骤数据策略 (通过 user_projects 关联)
CREATE POLICY "Users can view own project steps" ON project_step_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_projects
            WHERE user_projects.id = project_step_data.project_uuid
            AND user_projects.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own project steps" ON project_step_data
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_projects
            WHERE user_projects.id = project_step_data.project_uuid
            AND user_projects.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own project steps" ON project_step_data
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_projects
            WHERE user_projects.id = project_step_data.project_uuid
            AND user_projects.user_id::text = auth.uid()::text
        )
    );

-- 用户上传文件策略
CREATE POLICY "Users can view own uploads" ON user_uploads
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own uploads" ON user_uploads
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own uploads" ON user_uploads
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- ==========================================
-- 12. 管理员视图 (可选)
-- ==========================================

-- 创建统计视图
CREATE OR REPLACE VIEW user_statistics AS
SELECT
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT up.id) as total_projects,
    COUNT(DISTINCT psd.id) as total_step_completions,
    AVG(up.current_step) as avg_current_step
FROM users u
LEFT JOIN user_projects up ON u.id = up.user_id
LEFT JOIN project_step_data psd ON up.id = psd.project_uuid;

-- ==========================================
-- 完成
-- ==========================================
-- 迁移脚本创建完成
-- 请在 Supabase Dashboard 的 SQL Editor 中执行此脚本
