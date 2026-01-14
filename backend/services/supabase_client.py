"""
Supabase 客户端服务
提供 Supabase 数据库和存储的统一访问接口
"""

import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class SupabaseClient:
    """Supabase 客户端单例"""

    _instance: Optional[Client] = None
    _service_instance: Optional[Client] = None

    @classmethod
    def get_client(cls, use_service_role: bool = False) -> Client:
        """
        获取 Supabase 客户端实例

        Args:
            use_service_role: 是否使用服务角色密钥（绕过 RLS）

        Returns:
            Supabase 客户端实例
        """
        if use_service_role:
            if cls._service_instance is None:
                url = os.getenv("SUPABASE_URL")
                key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

                if not url or not key:
                    raise ValueError(
                        "SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 必须在环境变量中设置"
                    )

                cls._service_instance = create_client(url, key)

            return cls._service_instance
        else:
            if cls._instance is None:
                url = os.getenv("SUPABASE_URL")
                key = os.getenv("SUPABASE_ANON_KEY")

                if not url or not key:
                    raise ValueError(
                        "SUPABASE_URL 和 SUPABASE_ANON_KEY 必须在环境变量中设置"
                    )

                cls._instance = create_client(url, key)

            return cls._instance

    @classmethod
    def reset_client(cls):
        """重置客户端实例（用于测试）"""
        cls._instance = None
        cls._service_instance = None


# 便捷函数
def get_supabase(use_service_role: bool = True) -> Client:
    """
    获取 Supabase 客户端

    Args:
        use_service_role: 是否使用服务角色密钥（默认 True，用于后端）

    Returns:
        Supabase 客户端实例
    """
    return SupabaseClient.get_client(use_service_role=use_service_role)


# 创建全局 Supabase 客户端（使用 SERVICE_ROLE_KEY 绕过 RLS）
supabase: Client = get_supabase(use_service_role=True)


# 测试连接
if __name__ == "__main__":
    try:
        # 测试服务角色连接
        client = get_supabase(use_service_role=True)
        print("✅ Supabase 服务角色连接成功")

        # 测试查询
        result = client.table("users").select("count", count="exact").execute()
        print(f"✅ 数据库查询成功，用户数量: {result.count}")

        # 测试匿名连接
        anon_client = get_supabase(use_service_role=False)
        print("✅ Supabase 匿名连接成功")

    except Exception as e:
        print(f"❌ Supabase 连接失败: {e}")
