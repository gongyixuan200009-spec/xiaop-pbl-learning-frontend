import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt
from pathlib import Path

from config import USERS_FILE, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from models.schemas import UserProfile, UserResponse

class AuthService:
    def __init__(self):
        self.users = self._load_users()
    
    def _load_users(self) -> dict:
        if USERS_FILE.exists():
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}
    
    def _save_users(self):
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(self.users, f, ensure_ascii=False, indent=2)
    
    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()
    
    def register(self, username: str, password: str, profile: UserProfile) -> Tuple[bool, str]:
        """注册新用户"""
        if username in self.users:
            return False, "用户名已存在"
        
        self.users[username] = {
            "password_hash": self._hash_password(password),
            "profile": profile.model_dump(),
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        self._save_users()
        return True, "注册成功"
    
    def verify(self, username: str, password: str) -> Tuple[bool, Optional[dict]]:
        """验证用户登录"""
        if username not in self.users:
            return False, None
        
        user = self.users[username]
        if user["password_hash"] == self._hash_password(password):
            return True, user
        return False, None
    
    def get_user(self, username: str) -> Optional[dict]:
        """获取用户信息"""
        return self.users.get(username)
    
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
