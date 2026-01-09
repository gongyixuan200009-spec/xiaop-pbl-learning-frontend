-- ============================================
-- xiaop 项目 Supabase 数据库表结构
-- 创建时间: 2026-01-08
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    grade VARCHAR(50),
    gender VARCHAR(20),
    math_score VARCHAR(50),
    science_feeling TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================
-- 2. 表单配置表
-- ============================================
CREATE TABLE IF NOT EXISTS form_configs (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_description TEXT,
    fields JSONB NOT NULL DEFAULT '[]',
    extraction_prompt TEXT,
    test_enabled BOOLEAN DEFAULT FALSE,
    test_prompt TEXT,
    test_pass_pattern VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 表单配置索引
CREATE INDEX IF NOT EXISTS idx_form_configs_id ON form_configs(id);

-- ============================================
-- 3. 用户进度表
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 1,
    completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 用户进度索引
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_current_step ON user_progress(current_step);

-- ============================================
-- 4. 步骤数据表
-- ============================================
CREATE TABLE IF NOT EXISTS step_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    form_id INTEGER NOT NULL,
    extracted_fields JSONB DEFAULT '{}',
    chat_history JSONB DEFAULT '[]',
    is_confirmed BOOLEAN DEFAULT FALSE,
    summary TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, form_id)
);

-- 步骤数据索引
CREATE INDEX IF NOT EXISTS idx_step_data_user_id ON step_data(user_id);
CREATE INDEX IF NOT EXISTS idx_step_data_form_id ON step_data(form_id);
CREATE INDEX IF NOT EXISTS idx_step_data_user_form ON step_data(user_id, form_id);

-- ============================================
-- 5. Prompt 历史表
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255),
    form_id INTEGER,
    prompt_type VARCHAR(50),
    user_message TEXT,
    assistant_reply TEXT,
    extracted_data JSONB,
    model_used VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt 历史索引
CREATE INDEX IF NOT EXISTS idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_username ON prompt_history(username);
CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at ON prompt_history(created_at);

-- ============================================
-- 6. API 配置表
-- ============================================
CREATE TABLE IF NOT EXISTS api_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API 配置索引
CREATE INDEX IF NOT EXISTS idx_api_configs_key ON api_configs(config_key);

-- ============================================
-- 7. 文件上传记录表
-- ============================================
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255),
    form_id INTEGER,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_url TEXT,
    file_type VARCHAR(50),
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 文件上传索引
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_username ON uploaded_files(username);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at ON uploaded_files(created_at);

-- ============================================
-- 8. Pipeline 配置表
-- ============================================
CREATE TABLE IF NOT EXISTS pipeline_configs (
    id SERIAL PRIMARY KEY,
    config_data JSONB NOT NULL,
    active_pipeline VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 触发器：自动更新 updated_at 字段
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加 updated_at 触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_configs_updated_at BEFORE UPDATE ON form_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_step_data_updated_at BEFORE UPDATE ON step_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_configs_updated_at BEFORE UPDATE ON api_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_configs_updated_at BEFORE UPDATE ON pipeline_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- 用户表策略：用户只能查看和更新自己的数据
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 用户进度策略：用户只能访问自己的进度
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
    FOR ALL USING (auth.uid() = user_id);

-- 步骤数据策略：用户只能访问自己的步骤数据
CREATE POLICY "Users can view own step data" ON step_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own step data" ON step_data
    FOR ALL USING (auth.uid() = user_id);

-- Prompt 历史策略：用户只能查看自己的历史
CREATE POLICY "Users can view own prompt history" ON prompt_history
    FOR SELECT USING (auth.uid() = user_id);

-- 文件上传策略：用户只能访问自己的文件
CREATE POLICY "Users can view own files" ON uploaded_files
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own files" ON uploaded_files
    FOR ALL USING (auth.uid() = user_id);

-- 服务角色可以绕过所有 RLS 策略（后端使用）
-- 这是通过使用 SERVICE_ROLE_KEY 自动实现的

-- ============================================
-- 初始化数据
-- ============================================

-- 插入默认 API 配置（如果不存在）
INSERT INTO api_configs (config_key, config_value)
VALUES ('api_settings', '{
    "api_key": "",
    "api_endpoint": "https://openrouter.ai/api/v1",
    "default_model": "deepseek/deepseek-chat",
    "fast_model": "deepseek/deepseek-chat",
    "vision_model": "openai/gpt-4o-mini",
    "vision_model_enabled": true,
    "chat_mode": "single_agent",
    "debug_mode": true
}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- 插入默认 Pipeline 配置
INSERT INTO pipeline_configs (config_data, active_pipeline)
VALUES ('{
    "pipelines": [],
    "active_pipeline": "dual_agent"
}'::jsonb, 'dual_agent')
ON CONFLICT DO NOTHING;

-- ============================================
-- 完成提示
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ 数据库表结构创建完成！';
    RAISE NOTICE '📊 已创建 8 个表：users, form_configs, user_progress, step_data, prompt_history, api_configs, uploaded_files, pipeline_configs';
    RAISE NOTICE '🔒 已启用 RLS 安全策略';
    RAISE NOTICE '⚡ 已创建索引和触发器';
END $$;
