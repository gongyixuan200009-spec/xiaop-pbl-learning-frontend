"""
Supabase 客户端配置
提供统一的 Supabase 连接管理
"""

import os
from supabase import create_client, Client
from typing import Optional

class SupabaseClient:
    """Supabase 客户端单例"""

    _instance: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Client:
        """获取 Supabase 客户端实例"""
        if cls._instance is None:
            supabase_url = os.getenv('SUPABASE_URL')
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

            if not supabase_url or not supabase_key:
                raise ValueError(
                    "请设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量"
                )

            cls._instance = create_client(supabase_url, supabase_key)

        return cls._instance

    @classmethod
    def reset_client(cls):
        """重置客户端实例(用于测试)"""
        cls._instance = None

# 便捷函数
def get_supabase() -> Client:
    """获取 Supabase 客户端"""
    return SupabaseClient.get_client()
