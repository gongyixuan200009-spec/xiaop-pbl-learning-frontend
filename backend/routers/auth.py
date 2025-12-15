from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from models.schemas import UserRegister, UserLogin, TokenResponse, UserResponse, UserProfile
from services.auth_service import auth_service

router = APIRouter(prefix="/api/auth", tags=["认证"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """获取当前登录用户"""
    token = credentials.credentials
    username = auth_service.verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="无效的token")
    return username

@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister):
    """用户注册"""
    success, msg = auth_service.register(data.username, data.password, data.profile)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    
    # 注册成功后自动登录
    user = auth_service.get_user(data.username)
    token = auth_service.create_token(data.username)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            username=data.username,
            profile=data.profile,
            created_at=user.get("created_at")
        )
    )

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """用户登录"""
    success, user = auth_service.verify(data.username, data.password)
    if not success:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    token = auth_service.create_token(data.username)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            username=data.username,
            profile=UserProfile(**user.get("profile", {})),
            created_at=user.get("created_at")
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(username: str = Depends(get_current_user)):
    """获取当前用户信息"""
    user = auth_service.get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    return UserResponse(
        username=username,
        profile=UserProfile(**user.get("profile", {})),
        created_at=user.get("created_at")
    )
