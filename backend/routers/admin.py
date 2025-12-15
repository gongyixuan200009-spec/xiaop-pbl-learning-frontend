from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import hashlib
import json
import os
from pathlib import Path
from typing import List, Dict, Any

from pydantic import BaseModel
from models.schemas import FormConfigUpdate, AdminLogin
from config import load_form_config, save_form_config, DATA_DIR

router = APIRouter(prefix="/api/admin", tags=["管理"])

# 管理员密码
ADMIN_PASSWORD_FILE = DATA_DIR / "admin_password.json"
DEFAULT_PASSWORD_HASH = hashlib.sha256("admin123".encode()).hexdigest()

def get_password_hash():
    if ADMIN_PASSWORD_FILE.exists():
        with open(ADMIN_PASSWORD_FILE, "r") as f:
            data = json.load(f)
            return data.get("password_hash", DEFAULT_PASSWORD_HASH)
    return DEFAULT_PASSWORD_HASH

def verify_admin_password(password: str) -> bool:
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    return password_hash == get_password_hash()

@router.post("/login")
async def admin_login(data: AdminLogin):
    """管理员登录"""
    if not verify_admin_password(data.password):
        raise HTTPException(status_code=401, detail="密码错误")
    return {"success": True, "message": "登录成功"}

@router.get("/forms")
async def get_forms():
    """获取表格配置"""
    return load_form_config()

@router.put("/forms")
async def update_forms(data: FormConfigUpdate):
    """更新表格配置"""
    config = {"forms": [f.model_dump() for f in data.forms]}
    save_form_config(config)
    return {"success": True, "message": "配置已保存"}

@router.get("/data")
async def list_data_files():
    """列出所有数据文件"""
    csv_dir = DATA_DIR / "form_data"
    if not csv_dir.exists():
        return []
    
    files = []
    for f in csv_dir.iterdir():
        if f.suffix == ".csv":
            files.append({
                "name": f.name,
                "size": f.stat().st_size,
                "modified": f.stat().st_mtime
            })
    return sorted(files, key=lambda x: x["modified"], reverse=True)

@router.get("/data/{filename}")
async def download_data(filename: str):
    """下载数据文件"""
    file_path = DATA_DIR / "form_data" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="text/csv"
    )

@router.get("/users")
async def list_users():
    """列出所有用户及其进度"""
    progress_dir = DATA_DIR / "user_progress"
    users_file = DATA_DIR / "users.json"
    
    users_list = []
    
    # 获取所有用户
    if users_file.exists():
        with open(users_file, "r", encoding="utf-8") as f:
            users_data = json.load(f)
            all_usernames = list(users_data.keys())
    else:
        all_usernames = []
    
    # 也从进度文件中获取用户名
    if progress_dir.exists():
        for f in progress_dir.iterdir():
            if f.suffix == ".json":
                username = f.stem
                if username not in all_usernames:
                    all_usernames.append(username)
    
    for username in all_usernames:
        user_info = {
            "username": username,
            "current_step": 1,
            "completed_steps": [],
            "step_data": {},
            "profile": users_data.get(username, {}).get("profile", {})
        }
        
        progress_file = progress_dir / f"{username}.json"
        if progress_file.exists():
            try:
                with open(progress_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    user_info["current_step"] = data.get("current_step", 1)
                    user_info["completed_steps"] = data.get("completed_steps", [])
                    user_info["step_data"] = data.get("step_data", {})
            except Exception as e:
                pass
        
        users_list.append(user_info)
    
    return {"users": users_list}

@router.get("/users/{username}")
async def get_user_detail(username: str):
    """获取指定用户的详细数据"""
    progress_dir = DATA_DIR / "user_progress"
    progress_file = progress_dir / f"{username}.json"
    
    if not progress_file.exists():
        raise HTTPException(status_code=404, detail="用户不存在或无进度数据")
    
    with open(progress_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    return data

@router.post("/password")
async def change_password(old_password: str, new_password: str):
    """修改管理员密码"""
    if not verify_admin_password(old_password):
        raise HTTPException(status_code=401, detail="原密码错误")
    
    new_hash = hashlib.sha256(new_password.encode()).hexdigest()
    with open(ADMIN_PASSWORD_FILE, "w") as f:
        json.dump({"password_hash": new_hash}, f)
    
    return {"success": True, "message": "密码已修改"}

# ========== Prompt 预览 ==========
from services.prompt_preview import get_prompt_previews

class PromptPreviewRequest(BaseModel):
    form_config: Dict[str, Any]
    include_previous: bool = False

@router.post("/prompt-preview")
async def preview_prompts(data: PromptPreviewRequest):
    """预览表单的 prompts"""
    try:
        previews = get_prompt_previews(data.form_config, data.include_previous)
        return previews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== 聊天模式管理 ==========
from config import load_api_config

class ChatModeUpdate(BaseModel):
    chat_mode: str  # "dual_agent" or "single_agent"

@router.get("/chat-mode")
async def get_chat_mode():
    """获取当前聊天模式"""
    config = load_api_config()
    return {
        "chat_mode": config.get("chat_mode", "dual_agent"),
        "available_modes": [
            {
                "value": "dual_agent",
                "label": "双Agent模式",
                "description": "分离的提取和回复模型，提取更精确，但需要两次LLM调用"
            },
            {
                "value": "single_agent",
                "label": "单Agent模式",
                "description": "一个Agent同时处理提取和回复，只需一次LLM调用，速度更快"
            }
        ]
    }

@router.put("/chat-mode")
async def update_chat_mode(data: ChatModeUpdate):
    """更新聊天模式"""
    if data.chat_mode not in ["dual_agent", "single_agent"]:
        raise HTTPException(status_code=400, detail="无效的聊天模式")
    
    config = load_api_config()
    config["chat_mode"] = data.chat_mode
    
    # 保存配置
    config_path = DATA_DIR / "api_key_config.json"
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=4)
    
    return {"success": True, "chat_mode": data.chat_mode, "message": f"聊天模式已切换为: {data.chat_mode}"}
