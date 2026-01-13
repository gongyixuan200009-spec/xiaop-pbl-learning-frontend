#!/bin/bash

# 通过 Supabase REST API 创建数据库表
# 使用 service_role key 直接执行 SQL

set -e

echo "🚀 开始设置 Supabase 数据库..."
echo ""

# Supabase 配置
SUPABASE_URL="http://10.1.20.75:8000"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q"

echo "📊 连接到 Supabase: $SUPABASE_URL"
echo ""

# SQL 脚本
SQL=$(cat << 'EOSQL'
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
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
\$\$ language 'plpgsql';

-- 创建触发器
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EOSQL
)

echo "📝 执行 SQL 脚本..."
echo ""

# 通过 PostgREST 执行 SQL（使用 rpc 函数）
# 注意：这需要 Supabase 有 exec_sql 函数，如果没有，需要直接连接数据库

# 尝试方法 1: 使用 pg_net 扩展（如果可用）
# 尝试方法 2: 直接使用 psql（需要网络访问）

echo "⚠️  注意: Supabase REST API 不支持直接执行 DDL 语句"
echo ""
echo "请使用以下方法之一："
echo ""
echo "方法 1: 使用 Supabase Studio (推荐)"
echo "  1. 访问 http://10.1.20.75:4000"
echo "  2. 使用凭据登录:"
echo "     用户名: supabase"
echo "     密码: supabase-dashboard-2025"
echo "  3. 进入 SQL Editor"
echo "  4. 复制 supabase-minimal-setup.sql 的内容"
echo "  5. 点击 Run"
echo ""
echo "方法 2: 使用 psql 命令行"
echo "  psql -h 10.1.20.75 -p 5432 -U postgres -d postgres -f supabase-minimal-setup.sql"
echo "  密码: your-super-secret-password-change-this"
echo ""
echo "方法 3: 使用 Docker (如果 Docker 正在运行)"
echo "  ./setup-database-docker.sh"
echo ""
