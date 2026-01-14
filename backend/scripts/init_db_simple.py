"""
简单的数据库初始化脚本
直接使用 psycopg2 执行 SQL 脚本
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 添加父目录到路径
sys.path.append(str(Path(__file__).parent.parent))


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

    try:
        import psycopg2

        # 连接数据库
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("❌ DATABASE_URL 环境变量未设置")
            return False

        print(f"📡 连接数据库: {database_url.split('@')[1] if '@' in database_url else 'localhost'}")

        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cur = conn.cursor()

        # 执行整个 SQL 脚本
        print("⏳ 执行 SQL 脚本...")
        cur.execute(sql_script)

        cur.close()
        conn.close()

        print("✅ 数据库初始化完成！")
        return True

    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_tables():
    """测试表是否创建成功"""
    print("\n🔍 测试表创建...")

    try:
        import psycopg2

        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()

        # 查询所有表
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)

        tables = cur.fetchall()

        print(f"\n📋 已创建的表 ({len(tables)} 个):")
        for table in tables:
            print(f"   ✓ {table[0]}")

        cur.close()
        conn.close()

        return True

    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Supabase 数据库初始化脚本")
    print("=" * 60)

    # 初始化数据库
    if init_database():
        # 测试表创建
        test_tables()
        print("\n🎉 所有操作完成！")
    else:
        print("\n❌ 初始化失败")
        sys.exit(1)
