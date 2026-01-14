"""
初始化 Supabase 数据库表
执行 SQL 脚本创建所有必要的表和触发器
"""

import os
import sys
from pathlib import Path

# 添加父目录到路径
sys.path.append(str(Path(__file__).parent.parent))

from services.supabase_client import supabase


def init_database():
    """初始化数据库表"""

    print("🚀 开始初始化 Supabase 数据库...")

    # 读取 SQL 脚本
    sql_file = Path(__file__).parent / "init_supabase_schema.sql"

    if not sql_file.exists():
        print(f"❌ SQL 脚本文件不存在: {sql_file}")
        return False

    with open(sql_file, "r", encoding="utf-8") as f:
        sql_script = f.read()

    # 分割 SQL 语句（按分号分割，但跳过函数定义中的分号）
    statements = []
    current_statement = []
    in_function = False

    for line in sql_script.split("\n"):
        stripped = line.strip()

        # 跳过注释和空行
        if not stripped or stripped.startswith("--"):
            continue

        # 检测函数定义开始
        if "CREATE OR REPLACE FUNCTION" in line or "CREATE FUNCTION" in line:
            in_function = True

        # 检测函数定义结束
        if in_function and "LANGUAGE plpgsql" in line:
            current_statement.append(line)
            statements.append("\n".join(current_statement))
            current_statement = []
            in_function = False
            continue

        current_statement.append(line)

        # 如果不在函数定义中，遇到分号就分割
        if not in_function and stripped.endswith(";"):
            statements.append("\n".join(current_statement))
            current_statement = []

    # 添加最后一个语句
    if current_statement:
        statements.append("\n".join(current_statement))

    # 执行每个 SQL 语句
    success_count = 0
    error_count = 0

    for i, statement in enumerate(statements, 1):
        statement = statement.strip()
        if not statement:
            continue

        try:
            # 使用 Supabase 的 rpc 方法执行原始 SQL
            # 注意：Supabase Python 客户端不直接支持执行原始 SQL
            # 我们需要使用 PostgreSQL 连接
            print(f"⏳ 执行语句 {i}/{len(statements)}...")

            # 这里我们使用 psycopg2 直接连接数据库
            import psycopg2

            conn = psycopg2.connect(os.getenv("DATABASE_URL"))
            cur = conn.cursor()
            cur.execute(statement)
            conn.commit()
            cur.close()
            conn.close()

            success_count += 1
            print(f"✅ 语句 {i} 执行成功")

        except Exception as e:
            error_count += 1
            print(f"❌ 语句 {i} 执行失败: {e}")
            # 继续执行下一个语句

    print(f"\n📊 执行结果:")
    print(f"   成功: {success_count}")
    print(f"   失败: {error_count}")
    print(f"   总计: {len(statements)}")

    if error_count == 0:
        print("\n✅ 数据库初始化完成！")
        return True
    else:
        print("\n⚠️  数据库初始化完成，但有部分语句执行失败")
        return False


def test_connection():
    """测试数据库连接"""
    print("\n🔍 测试数据库连接...")

    try:
        # 测试查询
        result = supabase.table("users").select("count", count="exact").execute()
        print(f"✅ 连接成功！当前用户数: {result.count}")
        return True
    except Exception as e:
        print(f"❌ 连接失败: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Supabase 数据库初始化脚本")
    print("=" * 60)

    # 测试连接
    if not test_connection():
        print("\n❌ 数据库连接失败，请检查环境变量配置")
        sys.exit(1)

    # 初始化数据库
    if init_database():
        print("\n🎉 所有操作完成！")
    else:
        print("\n⚠️  初始化过程中遇到错误，请检查日志")
        sys.exit(1)
