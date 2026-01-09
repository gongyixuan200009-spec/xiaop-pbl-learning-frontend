"""
数据库服务层 - Supabase PostgreSQL 操作封装
提供所有数据库操作的统一接口
"""
import os
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from supabase import create_client, Client
import json

# Supabase 配置
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://10.1.20.75:8000")
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q"
)

# 创建 Supabase 客户端（使用 SERVICE_ROLE_KEY 绕过 RLS）
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


class DatabaseService:
    """数据库服务类"""

    def __init__(self):
        self.client = supabase

    # ========================================
    # 用户相关操作
    # ========================================

    def create_user(
        self,
        username: str,
        password_hash: str,
        profile: Dict[str, str]
    ) -> Optional[Dict[str, Any]]:
        """创建新用户"""
        try:
            data = {
                "username": username,
                "password_hash": password_hash,
                "grade": profile.get("grade", ""),
                "gender": profile.get("gender", ""),
                "math_score": profile.get("math_score", ""),
                "science_feeling": profile.get("science_feeling", "")
            }

            result = self.client.table("users").insert(data).execute()

            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            print(f"❌ 创建用户失败: {e}")
            return None

    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """根据用户名获取用户"""
        try:
            result = self.client.table("users")\
                .select("*")\
                .eq("username", username)\
                .execute()

            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            print(f"❌ 获取用户失败: {e}")
            return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """根据用户ID获取用户"""
        try:
            result = self.client.table("users")\
                .select("*")\
                .eq("id", user_id)\
                .execute()

            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            print(f"❌ 获取用户失败: {e}")
            return None

    def update_user_profile(
        self,
        username: str,
        profile: Dict[str, str]
    ) -> bool:
        """更新用户资料"""
        try:
            data = {
                "grade": profile.get("grade"),
                "gender": profile.get("gender"),
                "math_score": profile.get("math_score"),
                "science_feeling": profile.get("science_feeling")
            }

            result = self.client.table("users")\
                .update(data)\
                .eq("username", username)\
                .execute()

            return bool(result.data)
        except Exception as e:
            print(f"❌ 更新用户资料失败: {e}")
            return False

    def get_all_users(self) -> List[Dict[str, Any]]:
        """获取所有用户（管理员用）"""
        try:
            result = self.client.table("users")\
                .select("*")\
                .order("created_at", desc=True)\
                .execute()

            return result.data if result.data else []
        except Exception as e:
            print(f"❌ 获取所有用户失败: {e}")
            return []

    # ========================================
    # 用户进度相关操作
    # ========================================

    def get_user_progress(self, username: str) -> Optional[Dict[str, Any]]:
        """获取用户进度"""
        try:
            # 先获取用户ID
            user = self.get_user_by_username(username)
            if not user:
                return None

            user_id = user["id"]

            # 查询进度
            result = self.client.table("user_progress")\
                .select("*")\
                .eq("user_id", user_id)\
                .execute()

            if result.data:
                return result.data[0]

            # 如果没有进度记录，创建一个默认的
            return self.create_user_progress(user_id)
        except Exception as e:
            print(f"❌ 获取用户进度失败: {e}")
            return None

    def create_user_progress(self, user_id: str) -> Optional[Dict[str, Any]]:
        """创建用户进度记录"""
        try:
            data = {
                "user_id": user_id,
                "current_step": 1,
                "completed_steps": []
            }

            result = self.client.table("user_progress")\
                .insert(data)\
                .execute()

            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            print(f"❌ 创建用户进度失败: {e}")
            return None

    def update_user_progress(
        self,
        username: str,
        current_step: int,
        completed_steps: List[int]
    ) -> bool:
        """更新用户进度"""
        try:
            user = self.get_user_by_username(username)
            if not user:
                return False

            user_id = user["id"]

            data = {
                "current_step": current_step,
                "completed_steps": completed_steps
            }

            result = self.client.table("user_progress")\
                .update(data)\
                .eq("user_id", user_id)\
                .execute()

            return bool(result.data)
        except Exception as e:
            print(f"❌ 更新用户进度失败: {e}")
            return False

    # ========================================
    # 步骤数据相关操作
    # ========================================

    def get_step_data(self, username: str, form_id: int) -> Optional[Dict[str, Any]]:
        """获取用户某个步骤的数据"""
        try:
            user = self.get_user_by_username(username)
            if not user:
                return None

            user_id = user["id"]

            result = self.client.table("step_data")\
                .select("*")\
                .eq("user_id", user_id)\
                .eq("form_id", form_id)\
                .execute()

            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            print(f"❌ 获取步骤数据失败: {e}")
            return None

    def save_step_data(
        self,
        username: str,
        form_id: int,
        extracted_fields: Dict[str, Any],
        chat_history: List[Dict[str, Any]],
        is_confirmed: bool = False,
        summary: str = ""
    ) -> bool:
        """保存或更新步骤数据"""
        try:
            user = self.get_user_by_username(username)
            if not user:
                return False

            user_id = user["id"]

            # 检查是否已存在
            existing = self.get_step_data(username, form_id)

            data = {
                "user_id": user_id,
                "form_id": form_id,
                "extracted_fields": json.dumps(extracted_fields) if isinstance(extracted_fields, dict) else extracted_fields,
                "chat_history": json.dumps(chat_history) if isinstance(chat_history, list) else chat_history,
                "is_confirmed": is_confirmed,
                "summary": summary
            }

            if is_confirmed:
                data["confirmed_at"] = datetime.now().isoformat()

            if existing:
                # 更新
                result = self.client.table("step_data")\
                    .update(data)\
                    .eq("user_id", user_id)\
                    .eq("form_id", form_id)\
                    .execute()
            else:
                # 插入
                result = self.client.table("step_data")\
                    .insert(data)\
                    .execute()

            return bool(result.data)
        except Exception as e:
            print(f"❌ 保存步骤数据失败: {e}")
            return False

    def get_all_step_data(self, username: str) -> Dict[int, Dict[str, Any]]:
        """获取用户所有步骤数据"""
        try:
            user = self.get_user_by_username(username)
            if not user:
                return {}

            user_id = user["id"]

            result = self.client.table("step_data")\
                .select("*")\
                .eq("user_id", user_id)\
                .execute()

            if not result.data:
                return {}

            # 转换为字典格式 {form_id: data}
            step_dict = {}
            for step in result.data:
                form_id = step["form_id"]
                step_dict[form_id] = {
                    "extracted_fields": step["extracted_fields"],
                    "chat_history": step["chat_history"],
                    "is_confirmed": step["is_confirmed"],
                    "summary": step.get("summary", "")
                }

            return step_dict
        except Exception as e:
            print(f"❌ 获取所有步骤数据失败: {e}")
            return {}

    # ========================================
    # 配置管理相关操作
    # ========================================

    def get_form_configs(self) -> List[Dict[str, Any]]:
        """获取所有表单配置"""
        try:
            result = self.client.table("form_configs")\
                .select("*")\
                .order("id")\
                .execute()

            return result.data if result.data else []
        except Exception as e:
            print(f"❌ 获取表单配置失败: {e}")
            return []

    def save_form_configs(self, forms: List[Dict[str, Any]]) -> bool:
        """保存表单配置（批量更新）"""
        try:
            # 先删除所有现有配置
            self.client.table("form_configs").delete().neq("id", 0).execute()

            # 插入新配置
            for form in forms:
                data = {
                    "id": form["id"],
                    "name": form["name"],
                    "description": form.get("description", ""),
                    "user_description": form.get("user_description", ""),
                    "fields": json.dumps(form.get("fields", [])),
                    "extraction_prompt": form.get("extraction_prompt", ""),
                    "test_enabled": form.get("test_enabled", False),
                    "test_prompt": form.get("test_prompt", ""),
                    "test_pass_pattern": form.get("test_pass_pattern", "")
                }

                self.client.table("form_configs").insert(data).execute()

            return True
        except Exception as e:
            print(f"❌ 保存表单配置失败: {e}")
            return False

    def get_api_config(self) -> Dict[str, Any]:
        """获取 API 配置"""
        try:
            result = self.client.table("api_configs")\
                .select("*")\
                .eq("config_key", "api_settings")\
                .execute()

            if result.data:
                return result.data[0]["config_value"]
            return {}
        except Exception as e:
            print(f"❌ 获取 API 配置失败: {e}")
            return {}

    def save_api_config(self, config: Dict[str, Any]) -> bool:
        """保存 API 配置"""
        try:
            data = {
                "config_key": "api_settings",
                "config_value": json.dumps(config) if isinstance(config, dict) else config
            }

            # 使用 upsert 操作
            result = self.client.table("api_configs")\
                .upsert(data)\
                .execute()

            return bool(result.data)
        except Exception as e:
            print(f"❌ 保存 API 配置失败: {e}")
            return False

    # ========================================
    # Prompt 历史记录
    # ========================================

    def save_prompt_history(
        self,
        username: str,
        form_id: int,
        prompt_type: str,
        user_message: str,
        assistant_reply: str,
        extracted_data: Dict[str, Any] = None,
        model_used: str = ""
    ) -> bool:
        """保存 Prompt 历史记录"""
        try:
            user = self.get_user_by_username(username)
            user_id = user["id"] if user else None

            data = {
                "user_id": user_id,
                "username": username,
                "form_id": form_id,
                "prompt_type": prompt_type,
                "user_message": user_message,
                "assistant_reply": assistant_reply,
                "extracted_data": json.dumps(extracted_data) if extracted_data else None,
                "model_used": model_used
            }

            result = self.client.table("prompt_history")\
                .insert(data)\
                .execute()

            return bool(result.data)
        except Exception as e:
            print(f"❌ 保存 Prompt 历史失败: {e}")
            return False


# 创建全局数据库服务实例
db_service = DatabaseService()
