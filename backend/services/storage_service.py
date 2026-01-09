"""
文件存储服务层 - Supabase Storage 操作封装
提供文件上传、下载、删除等操作
"""
import os
from typing import Optional, Dict, Any
from supabase import create_client, Client
from datetime import datetime
import mimetypes

# Supabase 配置
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://10.1.20.75:8000")
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q"
)

# 创建 Supabase 客户端
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Storage Bucket 名称
BUCKET_NAME = "uploads"


class StorageService:
    """文件存储服务类"""

    def __init__(self):
        self.client = supabase
        self.bucket = BUCKET_NAME
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """确保 bucket 存在"""
        try:
            # 尝试获取 bucket
            buckets = self.client.storage.list_buckets()
            bucket_names = [b.name for b in buckets]

            if self.bucket not in bucket_names:
                # 创建 bucket（公开访问）
                self.client.storage.create_bucket(
                    self.bucket,
                    options={"public": True}
                )
                print(f"✅ 创建 Storage Bucket: {self.bucket}")
        except Exception as e:
            print(f"⚠️ Bucket 检查/创建失败: {e}")

    def upload_file(
        self,
        file_content: bytes,
        file_name: str,
        username: str,
        form_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """
        上传文件到 Supabase Storage

        Args:
            file_content: 文件内容（字节）
            file_name: 文件名
            username: 用户名
            form_id: 表单ID（可选）

        Returns:
            包含文件信息的字典，包括 file_path 和 file_url
        """
        try:
            # 生成唯一文件路径
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_extension = os.path.splitext(file_name)[1]
            unique_filename = f"{username}_{timestamp}_{file_name}"

            # 构建存储路径
            if form_id:
                file_path = f"{username}/form_{form_id}/{unique_filename}"
            else:
                file_path = f"{username}/{unique_filename}"

            # 获取 MIME 类型
            mime_type, _ = mimetypes.guess_type(file_name)
            if not mime_type:
                mime_type = "application/octet-stream"

            # 上传文件
            result = self.client.storage.from_(self.bucket).upload(
                file_path,
                file_content,
                file_options={"content-type": mime_type}
            )

            # 获取公开访问 URL
            file_url = self.client.storage.from_(self.bucket).get_public_url(file_path)

            return {
                "file_name": file_name,
                "file_path": file_path,
                "file_url": file_url,
                "file_size": len(file_content),
                "file_type": mime_type
            }

        except Exception as e:
            print(f"❌ 文件上传失败: {e}")
            return None


# 创建全局存储服务实例
storage_service = StorageService()
