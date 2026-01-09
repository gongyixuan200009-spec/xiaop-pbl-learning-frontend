#!/bin/bash
# ==========================================
# Supabase 数据库迁移 - 远程执行脚本
# ==========================================
# 说明: 由于防火墙限制，需要在服务器上直接执行此脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Supabase 数据库迁移远程执行脚本"
echo "======================================"
echo ""

# 检查 SQL 文件是否存在
SQL_FILE="$SCRIPT_DIR/supabase_migration.sql"
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ 错误: SQL 迁移文件不存在: $SQL_FILE"
    exit 1
fi

echo "✅ SQL 迁移文件: $SQL_FILE"
echo ""

# 提供多种执行方案
echo "📋 可用的执行方案:"
echo "======================================"
echo ""

echo "方案 1: Docker 方式（推荐）"
echo "----------------------------"
echo "如果 Supabase 运行在 Docker 中:"
echo ""
echo "# 1. 复制 SQL 文件到服务器"
echo "scp $SQL_FILE user@10.1.20.75:/tmp/supabase_migration.sql"
echo ""
echo "# 2. SSH 到服务器并执行"
echo "ssh user@10.1.20.75"
echo "docker exec -i supabase-db psql -U postgres -d postgres < /tmp/supabase_migration.sql"
echo ""
echo "# 3. 验证"
echo "docker exec -i supabase-db psql -U postgres -d postgres -c '\dt'"
echo ""

echo "方案 2: 直接 psql 方式"
echo "----------------------------"
echo "如果可以直接访问 PostgreSQL:"
echo ""
echo "# 1. 复制 SQL 文件到服务器"
echo "scp $SQL_FILE user@10.1.20.75:/tmp/supabase_migration.sql"
echo ""
echo "# 2. SSH 到服务器并执行"
echo "ssh user@10.1.20.75"
echo "psql -h localhost -U postgres -d postgres -f /tmp/supabase_migration.sql"
echo ""

echo "方案 3: 本地 SSH 隧道方式"
echo "----------------------------"
echo "在本地创建 SSH 隧道，然后执行:"
echo ""
echo "# 1. 创建 SSH 隧道（在新终端窗口运行）"
echo "ssh -L 5432:localhost:5432 user@10.1.20.75"
echo ""
echo "# 2. 在另一个终端执行迁移（保持隧道连接）"
echo "cd $PROJECT_ROOT"
echo "psql -h localhost -U postgres -d postgres -f scripts/supabase_migration.sql"
echo ""

echo "======================================"
echo "📄 SQL 迁移文件路径:"
echo "   $SQL_FILE"
echo ""
echo "💡 提示: 你也可以手动复制 SQL 文件内容并在数据库管理工具中执行"
echo ""

# 询问是否要查看 SQL 文件内容
read -p "是否要查看 SQL 文件内容? (y/N): " view_sql
if [[ "$view_sql" =~ ^[Yy]$ ]]; then
    echo ""
    echo "======================================"
    cat "$SQL_FILE"
    echo "======================================"
fi
