"""
认证服务 - 使用 Supabase 数据库
处理用户注册、登录、JWT Token 验证
"""

import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from models.schemas import UserProfile, UserResponse
from services.supabase_client import supabase


class AuthService:
    def __init__(self):
        self.client = supabase

    def _hash_password(self, password: str) -> str:
        """使用 SHA256 哈希密码"""
        return hashlib.sha256(password.encode()).hexdigest()

    def register(self, username: str, password: str, profile: UserProfile) -> Tuple[bool, str]:
        """注册新用户"""
        try:
            # 检查用户名是否已存在
            existing = self.client.table("users")\
                .select("username")\
                .eq("username", username)\
                .execute()

            if existing.data:
                return False, "用户名已存在"

            # 创建新用户
            data = {
                "username": username,
                "password_hash": self._hash_password(password),
                "grade": profile.grade,
                "gender": profile.gender,
                "math_score": profile.math_score,
                "science_feeling": profile.science_feeling
            }

            result = self.client.table("users").insert(data).execute()

            if result.data:
                return True, "注册成功"
            return False, "注册失败"

        except Exception as e:
            print(f"❌ 注册失败: {e}")
            return False, f"注册失败: {str(e)}"

    def verify(self, username: str, password: str) -> Tuple[bool, Optional[dict]]:
        """验证用户登录"""
        try:
            result = self.client.table("users")\
                .select("*")\
                .eq("username", username)\
                .execute()

            if not result.data:
                return False, None

            user = result.data[0]
            password_hash = self._hash_password(password)

            if user["password_hash"] == password_hash:
                # 转换为旧格式以兼容现有代码
                user_data = {
                    "password_hash": user["password_hash"],
                    "profile": {
                        "grade": user.get("grade", ""),
                        "gender": user.get("gender", ""),
                        "math_score": user.get("math_score", ""),
                        "science_feeling": user.get("science_feeling", "")
                    },
                    "created_at": user.get("created_at", "")
                }
                return True, user_data

            return False, None

        except Exception as e:
            print(f"❌ 验证失败: {e}")
            return False, None

    def get_user(self, username: str) -> Optional[dict]:
        """获取用户信息"""
        try:
            result = self.client.table("users")\
                .select("*")\
                .eq("username", username)\
                .execute()

            if not result.data:
                return None

            user = result.data[0]
            # 转换为旧格式以兼容现有代码
            return {
                "password_hash": user["password_hash"],
                "profile": {
                    "grade": user.get("grade", ""),
                    "gender": user.get("gender", ""),
                    "math_score": user.get("math_score", ""),
                    "science_feeling": user.get("science_feeling", "")
                },
                "created_at": user.get("created_at", "")
            }

        except Exception as e:
            print(f"❌ 获取用户失败: {e}")
            return None

    def create_token(self, username: str) -> str:
        """创建JWT token"""
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {"sub": username, "exp": expire}
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    def verify_token(self, token: str) -> Optional[str]:
        """验证JWT token，返回用户名"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                return None
            return username
        except JWTError:
            return None


# 单例
auth_service = AuthService()
