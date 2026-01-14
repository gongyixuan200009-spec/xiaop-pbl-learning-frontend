"""
配置服务 - 使用 Supabase 数据库
处理表单配置、API配置、Pipeline配置等
"""

from typing import Optional, Dict, Any, List
import json
from services.supabase_client import supabase


class ConfigService:
    """配置服务类"""

    def __init__(self):
        self.client = supabase

    def get_form_configs(self) -> List[Dict[str, Any]]:
        """获取所有表单配置"""
        try:
            result = self.client.table("form_configs")\
                .select("*")\
                .order("order_index")\
                .execute()

            configs = []
            for config in result.data:
                # 确保 fields 是列表类型
                fields = config.get("fields", [])
                if isinstance(fields, str):
                    fields = json.loads(fields)

                configs.append({
                    "id": config["id"],
                    "name": config["name"],
                    "description": config.get("description", ""),
                    "fields": fields,
                    "extraction_prompt": config.get("extraction_prompt", ""),
                    "test_enabled": config.get("test_enabled", False),
                    "test_prompt": config.get("test_prompt", ""),
                    "test_pass_pattern": config.get("test_pass_pattern", "")
                })

            return configs

        except Exception as e:
            print(f"❌ 获取表单配置失败: {e}")
            return []

    def get_form_config_by_id(self, form_id: int) -> Optional[Dict[str, Any]]:
        """根据 ID 获取表单配置"""
        try:
            result = self.client.table("form_configs")\
                .select("*")\
                .eq("id", form_id)\
                .execute()

            if result.data:
                config = result.data[0]
                fields = config.get("fields", [])
                if isinstance(fields, str):
                    fields = json.loads(fields)

                return {
                    "id": config["id"],
                    "name": config["name"],
                    "description": config.get("description", ""),
                    "fields": fields,
                    "extraction_prompt": config.get("extraction_prompt", ""),
                    "test_enabled": config.get("test_enabled", False),
                    "test_prompt": config.get("test_prompt", ""),
                    "test_pass_pattern": config.get("test_pass_pattern", "")
                }

            return None

        except Exception as e:
            print(f"❌ 获取表单配置失败: {e}")
            return None

    def update_form_configs(self, forms: List[Dict[str, Any]]) -> bool:
        """批量更新表单配置"""
        try:
            # 先删除所有现有配置
            self.client.table("form_configs").delete().neq("id", 0).execute()

            # 插入新配置
            for form in forms:
                data = {
                    "id": form["id"],
                    "name": form["name"],
                    "description": form.get("description", ""),
                    "fields": form.get("fields", []),
                    "extraction_prompt": form.get("extraction_prompt", ""),
                    "test_enabled": form.get("test_enabled", False),
                    "test_prompt": form.get("test_prompt", ""),
                    "test_pass_pattern": form.get("test_pass_pattern", ""),
                    "order_index": form.get("id", 0)
                }

                self.client.table("form_configs").insert(data).execute()

            return True

        except Exception as e:
            print(f"❌ 更新表单配置失败: {e}")
            return False

    def get_api_configs(self) -> List[Dict[str, Any]]:
        """获取所有 API 配置"""
        try:
            result = self.client.table("api_configs")\
                .select("*")\
                .eq("is_active", True)\
                .execute()

            return result.data if result.data else []

        except Exception as e:
            print(f"❌ 获取 API 配置失败: {e}")
            return []

    def get_active_api_config(self) -> Optional[Dict[str, Any]]:
        """获取当前激活的 API 配置"""
        try:
            result = self.client.table("api_configs")\
                .select("*")\
                .eq("is_active", True)\
                .execute()

            if result.data:
                return result.data[0]

            return None

        except Exception as e:
            print(f"❌ 获取激活的 API 配置失败: {e}")
            return None

    def update_api_config(self, config_id: int, config_data: Dict[str, Any]) -> bool:
        """更新 API 配置"""
        try:
            data = {
                "provider": config_data.get("provider"),
                "api_key": config_data.get("api_key"),
                "base_url": config_data.get("base_url"),
                "model_name": config_data.get("model_name"),
                "is_active": config_data.get("is_active", True)
            }

            result = self.client.table("api_configs")\
                .update(data)\
                .eq("id", config_id)\
                .execute()

            return bool(result.data)

        except Exception as e:
            print(f"❌ 更新 API 配置失败: {e}")
            return False

    def get_pipelines(self) -> List[Dict[str, Any]]:
        """获取所有 Pipeline 配置"""
        try:
            result = self.client.table("pipeline_configs")\
                .select("*")\
                .order("created_at", desc=True)\
                .execute()

            pipelines = []
            for pipeline in result.data:
                nodes = pipeline.get("nodes", [])
                edges = pipeline.get("edges", [])

                if isinstance(nodes, str):
                    nodes = json.loads(nodes)
                if isinstance(edges, str):
                    edges = json.loads(edges)

                pipelines.append({
                    "id": pipeline["id"],
                    "name": pipeline["name"],
                    "description": pipeline.get("description", ""),
                    "nodes": nodes,
                    "edges": edges,
                    "is_active": pipeline.get("is_active", False)
                })

            return pipelines

        except Exception as e:
            print(f"❌ 获取 Pipeline 配置失败: {e}")
            return []

    def get_active_pipeline(self) -> Optional[Dict[str, Any]]:
        """获取当前激活的 Pipeline"""
        try:
            result = self.client.table("pipeline_configs")\
                .select("*")\
                .eq("is_active", True)\
                .execute()

            if result.data:
                pipeline = result.data[0]
                nodes = pipeline.get("nodes", [])
                edges = pipeline.get("edges", [])

                if isinstance(nodes, str):
                    nodes = json.loads(nodes)
                if isinstance(edges, str):
                    edges = json.loads(edges)

                return {
                    "id": pipeline["id"],
                    "name": pipeline["name"],
                    "description": pipeline.get("description", ""),
                    "nodes": nodes,
                    "edges": edges,
                    "is_active": True
                }

            return None

        except Exception as e:
            print(f"❌ 获取激活的 Pipeline 失败: {e}")
            return None

    def create_pipeline(self, pipeline_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """创建新的 Pipeline"""
        try:
            data = {
                "name": pipeline_data.get("name"),
                "description": pipeline_data.get("description", ""),
                "nodes": pipeline_data.get("nodes", []),
                "edges": pipeline_data.get("edges", []),
                "is_active": pipeline_data.get("is_active", False)
            }

            result = self.client.table("pipeline_configs").insert(data).execute()

            if result.data:
                return result.data[0]

            return None

        except Exception as e:
            print(f"❌ 创建 Pipeline 失败: {e}")
            return None

    def update_pipeline(self, pipeline_id: int, pipeline_data: Dict[str, Any]) -> bool:
        """更新 Pipeline"""
        try:
            data = {
                "name": pipeline_data.get("name"),
                "description": pipeline_data.get("description"),
                "nodes": pipeline_data.get("nodes"),
                "edges": pipeline_data.get("edges"),
                "is_active": pipeline_data.get("is_active")
            }

            result = self.client.table("pipeline_configs")\
                .update(data)\
                .eq("id", pipeline_id)\
                .execute()

            return bool(result.data)

        except Exception as e:
            print(f"❌ 更新 Pipeline 失败: {e}")
            return False

    def delete_pipeline(self, pipeline_id: int) -> bool:
        """删除 Pipeline"""
        try:
            result = self.client.table("pipeline_configs")\
                .delete()\
                .eq("id", pipeline_id)\
                .execute()

            return bool(result.data)

        except Exception as e:
            print(f"❌ 删除 Pipeline 失败: {e}")
            return False

    def set_active_pipeline(self, pipeline_id: int) -> bool:
        """设置激活的 Pipeline"""
        try:
            # 先将所有 pipeline 设为非激活
            self.client.table("pipeline_configs")\
                .update({"is_active": False})\
                .neq("id", 0)\
                .execute()

            # 激活指定的 pipeline
            result = self.client.table("pipeline_configs")\
                .update({"is_active": True})\
                .eq("id", pipeline_id)\
                .execute()

            return bool(result.data)

        except Exception as e:
            print(f"❌ 设置激活 Pipeline 失败: {e}")
            return False


# 单例
config_service = ConfigService()
