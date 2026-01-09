#!/usr/bin/env python3
"""
通过 Supabase REST API 执行数据库迁移
由于 PostgreSQL 端口和 Studio 端口被防火墙阻止，我们使用 REST API 来完成迁移
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
import json

# 加载环境变量
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

def get_supabase_client() -> Client:
    """获取 Supabase 客户端"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")  # 使用 service key 以获得管理员权限

    if not url or not key:
        raise ValueError("❌ 未找到 SUPABASE_URL 或 SUPABASE_SERVICE_KEY")

    print(f"🔄 连接到 Supabase: {url}")
    return create_client(url, key)

def execute_migration():
    """执行数据库迁移"""
    try:
        client = get_supabase_client()

        print("\n" + "="*60)
        print("📝 执行 Supabase 数据库迁移")
        print("="*60)

        # 读取 SQL 迁移脚本
        sql_file = os.path.join(os.path.dirname(__file__), 'supabase_migration.sql')
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        print(f"\n✅ 已读取 SQL 脚本 ({len(sql_content)} 字符)")

        # 方法1: 通过 RPC 调用执行 SQL（如果 Supabase 支持）
        # 注意：这需要在 Supabase 中创建一个 RPC 函数来执行原始 SQL

        # 方法2: 手动创建表结构（更可靠）
        print("\n📋 开始创建表结构...")

        # 创建用户表
        print("\n1️⃣ 创建 users 表...")
        try:
            # 测试表是否存在
            result = client.table('users').select("*").limit(1).execute()
            print("   ✅ users 表已存在")
        except Exception as e:
            print(f"   ℹ️ users 表不存在，需要通过 SQL Editor 创建")
            print(f"   错误: {str(e)}")

        # 创建 API 配置表（可以直接通过 REST API 插入）
        print("\n2️⃣ 创建 api_configs 表并插入默认配置...")
        try:
            # 测试表是否存在
            result = client.table('api_configs').select("*").limit(1).execute()
            print("   ✅ api_configs 表已存在")

            # 插入默认配置
            default_configs = [
                {
                    'config_key': 'api_key',
                    'config_value': '',
                    'description': 'OpenRouter API Key'
                },
                {
                    'config_key': 'api_endpoint',
                    'config_value': 'https://openrouter.ai/api/v1',
                    'description': 'API Endpoint'
                },
                {
                    'config_key': 'default_model',
                    'config_value': 'deepseek/deepseek-chat',
                    'description': '默认模型'
                },
            ]

            # 尝试插入（如果已存在则跳过）
            for config in default_configs:
                try:
                    client.table('api_configs').insert(config).execute()
                    print(f"   ✅ 插入配置: {config['config_key']}")
                except Exception as e:
                    if 'duplicate' in str(e).lower() or 'unique' in str(e).lower():
                        print(f"   ⏭️ 配置已存在: {config['config_key']}")
                    else:
                        print(f"   ⚠️ 插入失败: {config['config_key']} - {str(e)}")

        except Exception as e:
            print(f"   ⚠️ api_configs 表不存在或无法访问: {str(e)}")

        print("\n" + "="*60)
        print("⚠️ 重要提示")
        print("="*60)
        print("""
由于防火墙限制，无法直接执行完整的 SQL 迁移脚本。

推荐方案：

方案 1: 通过 SSH 隧道访问数据库
-----------------------------------------
1. 在服务器上创建 SSH 隧道：
   ssh -L 5432:localhost:5432 user@10.1.20.75

2. 然后在本地执行迁移：
   cd /Users/shawn/projects/xiaop/xiaop-v2-dev-deploy/backend
   python3 scripts/migrate_to_supabase.py

方案 2: 在服务器上直接执行
-----------------------------------------
1. 复制脚本到服务器：
   scp scripts/supabase_migration.sql user@10.1.20.75:/tmp/

2. SSH 到服务器并执行：
   ssh user@10.1.20.75
   docker exec -i supabase-db psql -U postgres < /tmp/supabase_migration.sql

方案 3: 使用本地 Supabase
-----------------------------------------
1. 安装 Supabase CLI:
   brew install supabase/tap/supabase

2. 启动本地 Supabase:
   cd /Users/shawn/projects/xiaop/xiaop-v2-dev-deploy/backend
   supabase init
   supabase start

3. 执行迁移:
   supabase db reset
   # 或者手动执行 SQL 文件
        """)

        print("\n📄 SQL 迁移脚本位置:")
        print(f"   {sql_file}")
        print("\n你可以手动复制此文件内容并在数据库管理工具中执行。")

    except Exception as e:
        print(f"\n❌ 迁移失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    return True

def main():
    """主函数"""
    print("🚀 Supabase 数据库迁移工具")
    print("="*60)

    success = execute_migration()

    if success:
        print("\n✅ 迁移流程已完成！")
        print("\n下一步:")
        print("1. 按照上述方案之一完成 SQL 表结构创建")
        print("2. 运行数据迁移脚本: python3 scripts/migrate_to_supabase.py")
        print("3. 验证迁移: python3 scripts/check_database.py")
        return 0
    else:
        print("\n❌ 迁移失败，请查看上述错误信息")
        return 1

if __name__ == "__main__":
    sys.exit(main())
