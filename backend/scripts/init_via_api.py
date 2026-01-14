"""
通过 Supabase REST API 初始化数据库
使用 HTTP 请求执行 SQL 语句
"""

import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# Supabase 配置
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://10.1.20.75:8000")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def execute_sql_via_api(sql: str) -> bool:
    """通过 Supabase REST API 执行 SQL"""

    # Supabase 提供了一个特殊的端点来执行 SQL
    # 但这通常需要通过 PostgREST 或者直接的数据库连接

    # 尝试使用 Supabase 的 RPC 功能
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "sql": sql
    }

    try:
        response = requests.post(url, json=payload, headers=headers)

        if response.status_code == 200:
            return True
        else:
            print(f"❌ 执行失败: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False


def main():
    """主函数"""
    print("=" * 60)
    print("Supabase 数据库初始化（通过 REST API）")
    print("=" * 60)

    print("\n⚠️  注意：")
    print("由于 Supabase REST API 的限制，无法直接执行 DDL 语句。")
    print("请使用以下方法之一来初始化数据库：")
    print()
    print("方法 1: 使用 Supabase Studio Dashboard（推荐）")
    print("  1. 访问: http://10.1.20.75:3000")
    print("  2. 登录（用户名: supabase, 密码: supabase-dashboard-2025）")
    print("  3. 进入 SQL Editor")
    print("  4. 复制并执行 backend/scripts/init_supabase_schema.sql")
    print()
    print("方法 2: 在服务器上执行")
    print("  如果你可以 SSH 到服务器，在服务器上运行：")
    print("  python3 scripts/init_db_simple.py")
    print()
    print("方法 3: 使用 psql 命令行工具")
    print("  psql postgresql://postgres:your-super-secret-password-change-this@10.1.20.75:5432/postgres")
    print("  \\i backend/scripts/init_supabase_schema.sql")
    print()

    # 读取 SQL 文件并显示
    sql_file = Path(__file__).parent / "init_supabase_schema.sql"

    if sql_file.exists():
        print("📄 SQL 脚本位置:")
        print(f"   {sql_file}")
        print()
        print("📋 SQL 脚本内容预览（前 20 行）:")
        print("-" * 60)

        with open(sql_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
            for i, line in enumerate(lines[:20], 1):
                print(f"{i:3d} | {line.rstrip()}")

        print("-" * 60)
        print(f"   ... 共 {len(lines)} 行")
        print()
        print("💡 提示：复制整个文件内容到 Supabase Studio 的 SQL Editor 中执行")
    else:
        print(f"❌ SQL 脚本文件不存在: {sql_file}")

    print()
    print("=" * 60)


if __name__ == "__main__":
    main()
