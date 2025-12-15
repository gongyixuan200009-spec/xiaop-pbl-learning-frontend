"""
图片上传路由
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
import uuid
import os
from pathlib import Path
from datetime import datetime

from config import DATA_DIR
from routers.auth import get_current_user

router = APIRouter(prefix="/api/upload", tags=["上传"])

# 上传目录
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# 允许的图片类型
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    username: str = Depends(get_current_user)
):
    """上传图片，返回图片URL"""
    # 检查文件类型
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的图片类型: {file.content_type}，支持: {', '.join(ALLOWED_TYPES)}"
        )

    # 读取文件内容
    content = await file.read()

    # 检查文件大小
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"图片大小超过限制 ({MAX_SIZE // 1024 // 1024}MB)"
        )

    # 生成唯一文件名
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    filename = f"{username}_{timestamp}_{unique_id}.{ext}"

    # 保存文件
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        f.write(content)

    # 返回访问URL
    return {
        "success": True,
        "filename": filename,
        "url": f"/api/upload/image/{filename}",
        "size": len(content)
    }

@router.get("/image/{filename}")
async def get_image(filename: str):
    """获取上传的图片"""
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="图片不存在")

    # 确定content type
    ext = filename.split(".")[-1].lower()
    content_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp"
    }
    content_type = content_types.get(ext, "image/jpeg")

    return FileResponse(file_path, media_type=content_type)
