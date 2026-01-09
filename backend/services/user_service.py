"""
用户服务 - Supabase 版本
处理用户相关的数据库操作
"""

from typing import Optional, Dict, Any
from datetime import datetime
from .supabase_client import get_supabase

class UserService:
    """用户服务类"""

    @staticmethod
    def create_user(username: str, password_hash: str, profile: Dict[str, Any]) -> Dict[str, Any]:
        """创建新用户"""
        supabase = get_supabase()

        user_data = {
            'username': username,
            'password_hash': password_hash,
            'grade': profile.get('grade'),
            'gender': profile.get('gender'),
            'math_score': profile.get('math_score'),
            'science_feeling': profile.get('science_feeling'),
        }

        result = supabase.table('users').insert(user_data).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
        """根据用户名获取用户"""
        supabase = get_supabase()

        result = supabase.table('users').select('*').eq('username', username).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """根据 ID 获取用户"""
        supabase = get_supabase()

        result = supabase.table('users').select('*').eq('id', user_id).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def update_user_profile(username: str, profile: Dict[str, Any]) -> bool:
        """更新用户资料"""
        supabase = get_supabase()

        update_data = {
            'grade': profile.get('grade'),
            'gender': profile.get('gender'),
            'math_score': profile.get('math_score'),
            'science_feeling': profile.get('science_feeling'),
        }

        result = supabase.table('users').update(update_data).eq('username', username).execute()
        return len(result.data) > 0

    @staticmethod
    def update_last_login(username: str):
        """更新最后登录时间"""
        supabase = get_supabase()

        supabase.table('users').update({
            'last_login_at': datetime.now().isoformat()
        }).eq('username', username).execute()

    @staticmethod
    def user_exists(username: str) -> bool:
        """检查用户是否存在"""
        return UserService.get_user_by_username(username) is not None
