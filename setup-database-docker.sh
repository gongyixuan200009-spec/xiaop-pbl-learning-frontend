#!/bin/bash

# 使用 Docker 在自部署的 Supabase 中创建数据库表
# 不需要本地安装 psql

set -e

echo "🚀 开始设置 Supabase 数据库..."
echo ""

# 数据库连接信息
DB_HOST="10.1.20.75"
DB_PORT="8011"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="your-super-secret-password-change-this"

# 检查 Docker 是否运行
if ! docker info &> /dev/null; then
    echo "❌ 错误: Docker 未运行"
    echo "请启动 Docker Desktop"
    exit 1
fi

echo "📊 连接到数据库: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# 使用 Docker 运行 psql
docker run --rm \
    -e PGPASSWORD=$DB_PASSWORD \
    postgres:15 \
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建 projects 表
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- 启用 RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- 创建 RLS 策略
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE
    USING (auth.uid() = created_by);

-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 验证表结构
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 数据库设置成功！"
    echo ""
    echo "📋 已创建的表:"
    echo "  - projects (id, title, description, created_by, created_at, updated_at)"
    echo ""
    echo "🔒 RLS 策略已启用"
    echo ""
    echo "🎯 下一步:"
    echo "  1. 刷新浏览器: http://localhost:3002"
    echo "  2. 注册/登录账户"
    echo "  3. 尝试创建项目"
    echo ""
else
    echo ""
    echo "❌ 数据库设置失败"
    echo "请检查:"
    echo "  1. 数据库连接信息是否正确"
    echo "  2. 数据库密码是否正确"
    echo "  3. 网络连接是否正常"
    echo "  4. Docker 是否正在运行"
    echo ""
    exit 1
fi
