#!/usr/bin/env python3
"""
Supabase 数据库健康检查脚本
用于验证数据库连接和表结构
"""

import os
import sys
from pathlib import Path

# 添加当前目录到 Python 路径
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from dotenv import load_dotenv
    from supabase import create_client
except ImportError:
    print("❌ 缺少依赖包，请先安装: pip install supabase python-dotenv")
    sys.exit(1)


class Colors:
    """终端颜色"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_header(text):
    """打印标题"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'=' * 60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text:^60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'=' * 60}{Colors.ENDC}\n")


def print_success(text):
    """打印成功消息"""
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")


def print_error(text):
    """打印错误消息"""
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")


def print_warning(text):
    """打印警告消息"""
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")


def print_info(text):
    """打印信息"""
    print(f"{Colors.OKBLUE}ℹ️  {text}{Colors.ENDC}")


def check_env_file():
    """检查环境变量文件"""
    print_header("检查环境变量配置")

    env_file = Path(__file__).parent.parent / ".env"

    if not env_file.exists():
        print_error(f".env 文件不存在: {env_file}")
        print_info("请从 .env.example 创建 .env 文件")
        return False

    print_success(f".env 文件存在: {env_file}")
    load_dotenv(env_file)

    # 检查必需的环境变量
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY"
    ]

    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        print_error(f"缺少环境变量: {', '.join(missing_vars)}")
        return False

    print_success("所有必需的环境变量都已设置")
    return True


def check_connection():
    """检查 Supabase 连接"""
    print_header("检查 Supabase 连接")

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    print_info(f"Supabase URL: {supabase_url}")

    try:
        supabase = create_client(supabase_url, supabase_key)
        print_success("Supabase 客户端创建成功")
        return supabase
    except Exception as e:
        print_error(f"连接失败: {str(e)}")
        return None


def check_tables(supabase):
    """检查数据库表"""
    print_header("检查数据库表结构")

    # 预期的表列表
    expected_tables = [
        "users",
        "form_configs",
        "api_configs",
        "pipeline_configs",
        "user_projects",
        "project_step_data",
        "prompt_history",
        "user_uploads",
        "age_adaptation_configs"
    ]

    results = {}

    for table_name in expected_tables:
        try:
            # 尝试查询表（限制1条记录）
            response = supabase.table(table_name).select("*").limit(1).execute()
            results[table_name] = {
                "exists": True,
                "count": len(response.data) if response.data else 0
            }
            print_success(f"表 '{table_name}' 存在")
        except Exception as e:
            results[table_name] = {
                "exists": False,
                "error": str(e)
            }
            print_error(f"表 '{table_name}' 不存在或无法访问: {str(e)}")

    return results


def check_data_counts(supabase):
    """检查各表的数据量"""
    print_header("检查数据统计")

    tables = [
        "users",
        "form_configs",
        "api_configs",
        "pipeline_configs",
        "user_projects",
        "project_step_data",
        "prompt_history",
        "user_uploads"
    ]

    print(f"{'表名':<25} {'记录数':>10}")
    print("-" * 40)

    for table_name in tables:
        try:
            response = supabase.table(table_name).select("*", count="exact").execute()
            count = response.count if hasattr(response, 'count') else len(response.data)
            print(f"{table_name:<25} {count:>10}")
        except Exception as e:
            print(f"{table_name:<25} {'错误':>10}")
            print_warning(f"  无法查询: {str(e)}")


def check_rls_policies(supabase):
    """检查 RLS 策略（需要管理员权限）"""
    print_header("检查行级安全策略 (RLS)")

    try:
        # 这需要管理员权限，可能会失败
        print_info("检查 RLS 策略需要数据库管理员权限")
        print_warning("如果失败，请手动在 Supabase Dashboard 中检查")
    except Exception as e:
        print_warning(f"无法自动检查 RLS 策略: {str(e)}")


def run_health_check():
    """运行完整的健康检查"""
    print(f"\n{Colors.OKCYAN}{Colors.BOLD}")
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║     Supabase 数据库健康检查工具                          ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    """)
    print(f"{Colors.ENDC}")

    # 步骤 1: 检查环境变量
    if not check_env_file():
        print_error("\n健康检查失败: 环境变量配置不正确")
        sys.exit(1)

    # 步骤 2: 检查连接
    supabase = check_connection()
    if not supabase:
        print_error("\n健康检查失败: 无法连接到 Supabase")
        sys.exit(1)

    # 步骤 3: 检查表结构
    table_results = check_tables(supabase)

    # 步骤 4: 检查数据统计
    check_data_counts(supabase)

    # 步骤 5: 检查 RLS 策略
    check_rls_policies(supabase)

    # 总结
    print_header("健康检查总结")

    total_tables = len(table_results)
    existing_tables = sum(1 for r in table_results.values() if r.get("exists"))

    print(f"总表数: {total_tables}")
    print(f"存在的表: {existing_tables}")
    print(f"缺失的表: {total_tables - existing_tables}")

    if existing_tables == total_tables:
        print_success("\n✨ 所有检查通过！数据库状态良好。")
        return 0
    else:
        print_warning(f"\n⚠️  有 {total_tables - existing_tables} 个表缺失或无法访问")
        print_info("请运行数据库迁移脚本: python scripts/migrate_to_supabase.py")
        return 1


if __name__ == "__main__":
    try:
        exit_code = run_health_check()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print_warning("\n\n检查已取消")
        sys.exit(1)
    except Exception as e:
        print_error(f"\n发生错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
