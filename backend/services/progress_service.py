"""
用户进度管理服务 - 使用 Supabase 数据库
保存和管理每个用户的阶段进度（支持多项目）
"""

from typing import Dict, List, Optional
from datetime import datetime
from services.supabase_client import supabase


class ProgressService:
    def __init__(self):
        self.client = supabase

    def _get_user_id(self, username: str) -> Optional[str]:
        """根据用户名获取用户ID"""
        try:
            result = self.client.table("users")\
                .select("id")\
                .eq("username", username)\
                .execute()

            if result.data:
                return result.data[0]["id"]
            return None
        except Exception as e:
            print(f"❌ 获取用户ID失败: {e}")
            return None

    # ========== 项目管理方法 ==========

    def get_projects(self, username: str) -> List[dict]:
        """获取用户所有项目列表"""
        try:
            user_id = self._get_user_id(username)
            if not user_id:
                return []

            result = self.client.table("user_projects")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .execute()

            if not result.data:
                # 创建默认项目
                default_project = self.create_project(username, "默认项目")
                return [default_project] if default_project else []

            projects = []
            for project in result.data:
                projects.append({
                    "id": project["id"],
                    "name": project["project_name"],
                    "current_step": project.get("current_step", 1),
                    "completed_steps": project.get("completed_steps", []),
                    "created_at": project.get("created_at"),
                    "updated_at": project.get("updated_at"),
                    "is_current": project.get("is_active", False)
                })

            return projects

        except Exception as e:
            print(f"❌ 获取项目列表失败: {e}")
            return []

    def get_current_project_id(self, username: str) -> str:
        """获取当前项目ID"""
        try:
            user_id = self._get_user_id(username)
            if not user_id:
                return ""

            result = self.client.table("user_projects")\
                .select("id")\
                .eq("user_id", user_id)\
                .eq("is_active", True)\
                .execute()

            if result.data:
                return result.data[0]["id"]

            # 如果没有活跃项目，返回第一个项目
            all_projects = self.get_projects(username)
            if all_projects:
                project_id = all_projects[0]["id"]
                self.switch_project(username, project_id)
                return project_id

            return ""

        except Exception as e:
            print(f"❌ 获取当前项目ID失败: {e}")
            return ""

    def create_project(self, username: str, name: str) -> Optional[dict]:
        """创建新项目"""
        try:
            user_id = self._get_user_id(username)
            if not user_id:
                return None

            # 将所有现有项目设为非活跃
            self.client.table("user_projects")\
                .update({"is_active": False})\
                .eq("user_id", user_id)\
                .execute()

            # 创建新项目
            data = {
                "user_id": user_id,
                "project_name": name,
                "is_active": True,
                "current_step": 1,
                "completed_steps": []
            }

            result = self.client.table("user_projects").insert(data).execute()

            if result.data:
                project = result.data[0]
                return {
                    "id": project["id"],
                    "name": project["project_name"],
                    "current_step": project.get("current_step", 1),
                    "completed_steps": project.get("completed_steps", []),
                    "created_at": project.get("created_at"),
                    "updated_at": project.get("updated_at"),
                    "is_current": True
                }

            return None

        except Exception as e:
            print(f"❌ 创建项目失败: {e}")
            return None

    def switch_project(self, username: str, project_id: str) -> bool:
        """切换当前项目"""
        try:
            user_id = self._get_user_id(username)
            if not user_id:
                return False

            # 将所有项目设为非活跃
            self.client.table("user_projects")\
                .update({"is_active": False})\
                .eq("user_id", user_id)\
                .execute()

            # 激活指定项目
            result = self.client.table("user_projects")\
                .update({"is_active": True})\
                .eq("id", project_id)\
                .eq("user_id", user_id)\
                .execute()

            return bool(result.data)

        except Exception as e:
            print(f"❌ 切换项目失败: {e}")
            return False

    def delete_project(self, username: str, project_id: str) -> bool:
        """删除项目"""
        try:
            user_id = self._get_user_id(username)
            if not user_id:
                return False

            # 检查是否是最后一个项目
            projects = self.get_projects(username)
            if len(projects) <= 1:
                return False

            # 删除项目（级联删除相关的阶段数据）
            result = self.client.table("user_projects")\
                .delete()\
                .eq("id", project_id)\
                .eq("user_id", user_id)\
                .execute()

            if result.data:
                # 如果删除的是当前项目，切换到另一个项目
                current_id = self.get_current_project_id(username)
                if not current_id:
                    remaining_projects = self.get_projects(username)
                    if remaining_projects:
                        self.switch_project(username, remaining_projects[0]["id"])

                return True

            return False

        except Exception as e:
            print(f"❌ 删除项目失败: {e}")
            return False

    def rename_project(self, username: str, project_id: str, name: str) -> bool:
        """重命名项目"""
        try:
            user_id = self._get_user_id(username)
            if not user_id:
                return False

            result = self.client.table("user_projects")\
                .update({"project_name": name})\
                .eq("id", project_id)\
                .eq("user_id", user_id)\
                .execute()

            return bool(result.data)

        except Exception as e:
            print(f"❌ 重命名项目失败: {e}")
            return False

    # ========== 阶段进度方法（基于当前项目）==========

    def get_user_progress(self, username: str) -> dict:
        """获取用户当前项目的整体进度"""
        try:
            project_id = self.get_current_project_id(username)
            if not project_id:
                return {
                    "current_step": 1,
                    "completed_steps": [],
                    "step_data": {},
                    "current_project_id": "",
                    "current_project_name": ""
                }

            result = self.client.table("user_projects")\
                .select("*")\
                .eq("id", project_id)\
                .execute()

            if not result.data:
                return {
                    "current_step": 1,
                    "completed_steps": [],
                    "step_data": {},
                    "current_project_id": "",
                    "current_project_name": ""
                }

            project = result.data[0]

            # 获取所有阶段数据
            step_data_result = self.client.table("project_step_data")\
                .select("*")\
                .eq("project_id", project_id)\
                .execute()

            step_data = {}
            if step_data_result.data:
                for step in step_data_result.data:
                    step_data[str(step["form_id"])] = {
                        "form_id": step["form_id"],
                        "extracted_fields": step.get("extracted_fields", {}),
                        "chat_history": step.get("chat_history", []),
                        "is_confirmed": step.get("is_confirmed", False),
                        "summary": step.get("summary", ""),
                        "test_state": step.get("test_state", {
                            "is_in_test": False,
                            "test_passed": False,
                            "test_chat_history": [],
                            "test_credential": ""
                        })
                    }

            return {
                "current_step": project.get("current_step", 1),
                "completed_steps": project.get("completed_steps", []),
                "step_data": step_data,
                "current_project_id": project_id,
                "current_project_name": project.get("project_name", "")
            }

        except Exception as e:
            print(f"❌ 获取用户进度失败: {e}")
            return {
                "current_step": 1,
                "completed_steps": [],
                "step_data": {},
                "current_project_id": "",
                "current_project_name": ""
            }

    def get_step_data(self, username: str, form_id: int) -> Optional[dict]:
        """获取用户当前项目某个阶段的数据"""
        try:
            project_id = self.get_current_project_id(username)
            if not project_id:
                return None

            result = self.client.table("project_step_data")\
                .select("*")\
                .eq("project_id", project_id)\
                .eq("form_id", form_id)\
                .execute()

            if result.data:
                step = result.data[0]
                return {
                    "form_id": step["form_id"],
                    "extracted_fields": step.get("extracted_fields", {}),
                    "chat_history": step.get("chat_history", []),
                    "is_confirmed": step.get("is_confirmed", False),
                    "summary": step.get("summary", ""),
                    "test_state": step.get("test_state", {
                        "is_in_test": False,
                        "test_passed": False,
                        "test_chat_history": [],
                        "test_credential": ""
                    })
                }

            return None

        except Exception as e:
            print(f"❌ 获取阶段数据失败: {e}")
            return None

    def reset_step_data(self, username: str, form_id: int) -> bool:
        """重置某个阶段的所有数据（聊天记录、提取字段、测试状态等）"""
        try:
            project_id = self.get_current_project_id(username)
            if not project_id:
                return False

            # 删除阶段数据
            self.client.table("project_step_data")\
                .delete()\
                .eq("project_id", project_id)\
                .eq("form_id", form_id)\
                .execute()

            # 更新项目进度
            project_result = self.client.table("user_projects")\
                .select("current_step, completed_steps")\
                .eq("id", project_id)\
                .execute()

            if project_result.data:
                project = project_result.data[0]
                completed_steps = project.get("completed_steps", [])
                current_step = project.get("current_step", 1)

                # 从已完成列表中移除
                if form_id in completed_steps:
                    completed_steps.remove(form_id)

                # 回退当前步骤
                if current_step > form_id:
                    current_step = form_id

                self.client.table("user_projects")\
                    .update({
                        "current_step": current_step,
                        "completed_steps": completed_steps
                    })\
                    .eq("id", project_id)\
                    .execute()

            return True

        except Exception as e:
            print(f"❌ 重置阶段数据失败: {e}")
            return False

    def save_step_data(self, username: str, form_id: int, extracted_fields: dict,
                       chat_history: list, is_confirmed: bool = False):
        """保存阶段数据到当前项目"""
        try:
            project_id = self.get_current_project_id(username)
            if not project_id:
                return

            # 检查是否已存在
            existing = self.client.table("project_step_data")\
                .select("id")\
                .eq("project_id", project_id)\
                .eq("form_id", form_id)\
                .execute()

            data = {
                "project_id": project_id,
                "form_id": form_id,
                "extracted_fields": extracted_fields,
                "chat_history": chat_history,
                "is_confirmed": is_confirmed
            }

            if existing.data:
                # 更新
                self.client.table("project_step_data")\
                    .update(data)\
                    .eq("project_id", project_id)\
                    .eq("form_id", form_id)\
                    .execute()
            else:
                # 插入
                self.client.table("project_step_data").insert(data).execute()

        except Exception as e:
            print(f"❌ 保存阶段数据失败: {e}")

    def confirm_step(self, username: str, form_id: int, summary: str) -> bool:
        """确认完成某个阶段，解锁下一阶段（当前项目）"""
        try:
            project_id = self.get_current_project_id(username)
            if not project_id:
                return False

            # 更新阶段数据
            self.client.table("project_step_data")\
                .update({
                    "is_confirmed": True,
                    "summary": summary
                })\
                .eq("project_id", project_id)\
                .eq("form_id", form_id)\
                .execute()

            # 更新项目进度
            project_result = self.client.table("user_projects")\
                .select("current_step, completed_steps")\
                .eq("id", project_id)\
                .execute()

            if project_result.data:
                project = project_result.data[0]
                completed_steps = project.get("completed_steps", [])
                current_step = project.get("current_step", 1)

                # 添加到已完成列表
                if form_id not in completed_steps:
                    completed_steps.append(form_id)

                # 解锁下一阶段
                if form_id >= current_step:
                    current_step = form_id + 1

                self.client.table("user_projects")\
                    .update({
                        "current_step": current_step,
                        "completed_steps": completed_steps
                    })\
                    .eq("id", project_id)\
                    .execute()

            return True

        except Exception as e:
            print(f"❌ 确认阶段失败: {e}")
            return False

    def can_access_step(self, username: str, form_id: int) -> bool:
        """检查用户是否可以访问当前项目的某个阶段"""
        try:
            project_id = self.get_current_project_id(username)
            if not project_id:
                return form_id == 1

            result = self.client.table("user_projects")\
                .select("current_step")\
                .eq("id", project_id)\
                .execute()

            if result.data:
                current_step = result.data[0].get("current_step", 1)
                return form_id <= current_step

            return form_id == 1

        except Exception as e:
            print(f"❌ 检查阶段访问权限失败: {e}")
            return form_id == 1

    def get_previous_summaries(self, username: str, current_form_id: int) -> List[dict]:
        """获取当前项目中当前阶段之前所有已完成阶段的总结"""
        try:
            project_id = self.get_current_project_id(username)
            if not project_id:
                return []

            # 获取所有已确认的阶段数据
            result = self.client.table("project_step_data")\
                .select("*")\
                .eq("project_id", project_id)\
                .eq("is_confirmed", True)\
                .lt("form_id", current_form_id)\
                .order("form_id")\
                .execute()

            summaries = []
            if result.data:
                for step in result.data:
                    summaries.append({
                        "form_id": step["form_id"],
                        "summary": step.get("summary", ""),
                        "extracted_fields": step.get("extracted_fields", {})
                    })

            return summaries

        except Exception as e:
            print(f"❌ 获取前置总结失败: {e}")
            return []

    def reset_step(self, username: str, form_id: int):
        """重置当前项目某个阶段的数据（仅允许重置未确认的阶段）"""
        try:
            project_id = self.get_current_project_id(username)
            if not project_id:
                return

            # 检查是否已确认
            result = self.client.table("project_step_data")\
                .select("is_confirmed")\
                .eq("project_id", project_id)\
                .eq("form_id", form_id)\
                .execute()

            if result.data and not result.data[0].get("is_confirmed"):
                # 只清除未确认的数据
                self.client.table("project_step_data")\
                    .delete()\
                    .eq("project_id", project_id)\
                    .eq("form_id", form_id)\
                    .execute()

        except Exception as e:
            print(f"❌ 重置阶段失败: {e}")

    def save_test_state(self, username: str, form_id: int, is_in_test: bool = False,
                        test_passed: bool = False, test_chat_history: list = None,
                        test_credential: str = ""):
        """保存当前项目的测试状态"""
        try:
            project_id = self.get_current_project_id(username)
            if not project_id:
                return

            test_state = {
                "is_in_test": is_in_test,
                "test_passed": test_passed,
                "test_chat_history": test_chat_history or [],
                "test_credential": test_credential
            }

            # 检查是否已存在阶段数据
            existing = self.client.table("project_step_data")\
                .select("id")\
                .eq("project_id", project_id)\
                .eq("form_id", form_id)\
                .execute()

            if existing.data:
                # 更新测试状态
                self.client.table("project_step_data")\
                    .update({"test_state": test_state})\
                    .eq("project_id", project_id)\
                    .eq("form_id", form_id)\
                    .execute()
            else:
                # 创建新记录
                data = {
                    "project_id": project_id,
                    "form_id": form_id,
                    "test_state": test_state,
                    "extracted_fields": {},
                    "chat_history": []
                }
                self.client.table("project_step_data").insert(data).execute()

        except Exception as e:
            print(f"❌ 保存测试状态失败: {e}")

    def get_test_state(self, username: str, form_id: int) -> Optional[dict]:
        """获取当前项目的测试状态"""
        try:
            project_id = self.get_current_project_id(username)
            if not project_id:
                return None

            result = self.client.table("project_step_data")\
                .select("test_state")\
                .eq("project_id", project_id)\
                .eq("form_id", form_id)\
                .execute()

            if result.data:
                return result.data[0].get("test_state")

            return None

        except Exception as e:
            print(f"❌ 获取测试状态失败: {e}")
            return None


# 单例
progress_service = ProgressService()
