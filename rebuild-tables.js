const { createClient } = require('@supabase/supabase-js');

async function rebuildTables() {
  const supabaseUrl = 'http://10.1.20.75:8000';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const sql = `
-- 删除旧表
DROP TABLE IF EXISTS user_uploads CASCADE;
DROP TABLE IF EXISTS prompt_history CASCADE;
DROP TABLE IF EXISTS project_step_data CASCADE;
DROP TABLE IF EXISTS user_projects CASCADE;

-- 创建user_projects表
CREATE TABLE user_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    current_step INTEGER DEFAULT 1,
    completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_name)
);

-- 创建project_step_data表
CREATE TABLE project_step_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    form_id INTEGER,
    extracted_fields JSONB DEFAULT '{}',
    chat_history JSONB DEFAULT '[]',
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, step_number)
);

-- 创建form_configs表
CREATE TABLE IF NOT EXISTS form_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建api_configs表
CREATE TABLE IF NOT EXISTS api_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_name VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    api_key TEXT,
    base_url TEXT,
    model_name VARCHAR(100),
    additional_params JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建pipeline_configs表
CREATE TABLE IF NOT EXISTS pipeline_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_name VARCHAR(100) UNIQUE NOT NULL,
    steps JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建age_adaptation_configs表
CREATE TABLE IF NOT EXISTS age_adaptation_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_level VARCHAR(50) NOT NULL,
    adaptation_rules JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建prompt_history表
CREATE TABLE IF NOT EXISTS prompt_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
    step VARCHAR(100),
    prompt TEXT,
    response TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建user_uploads表
CREATE TABLE IF NOT EXISTS user_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_is_active ON user_projects(is_active);
CREATE INDEX IF NOT EXISTS idx_project_step_data_project_id ON project_step_data(project_id);
CREATE INDEX IF NOT EXISTS idx_project_step_data_step_number ON project_step_data(step_number);
CREATE INDEX IF NOT EXISTS idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_project_id ON prompt_history(project_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON user_uploads(user_id);

-- 禁用RLS（行级安全）以便迁移
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_step_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE age_adaptation_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_uploads DISABLE ROW LEVEL SECURITY;
`;

  try {
    console.log('🔄 连接到 Supabase...');
    console.log('📍 URL:', supabaseUrl);

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== '');

    console.log(`\n📝 准备执行 ${statements.length} 条 SQL 语句...\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';

      process.stdout.write(`[${i + 1}/${statements.length}] ${preview} `);

      try {
        // Use REST API to execute SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({ sql_query: statement })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log('❌');
          console.error(`   错误: ${errorText}`);
          errorCount++;
        } else {
          console.log('✅');
          successCount++;
        }
      } catch (err) {
        console.log('❌');
        console.error(`   执行失败: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ 成功: ${successCount} 条`);
    console.log(`❌ 失败: ${errorCount} 条`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n🎉 表结构已重建，RLS已禁用，可以开始迁移数据');
    } else {
      console.log('\n⚠️  部分语句执行失败，请检查错误信息');
    }

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

rebuildTables();
