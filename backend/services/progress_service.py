"""用户进度管理服务 - 保存和管理每个用户的阶段进度（支持多项目）"""
import json
import uuid
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
from config import DATA_DIR

class ProgressService:
    def __init__(self):
        self.progress_dir = DATA_DIR / "user_progress"
        self.progress_dir.mkdir(exist_ok=True)

    def _get_user_file(self, username: str) -> Path:
        return self.progress_dir / f"{username}.json"

    def _load_user_data(self, username: str) -> dict:
        """加载用户数据（包含所有项目）"""
        file_path = self._get_user_file(username)
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                # 兼容旧数据：如果没有projects字段，迁移到多项目结构
                if "projects" not in data:
                    data = self._migrate_to_multi_project(data)
                return data

        # 新用户：创建默认项目
        default_project_id = str(uuid.uuid4())[:8]
        return {
            "username": username,
            "current_project_id": default_project_id,
            "projects": {
                default_project_id: {
                    "id": default_project_id,
                    "name": "默认项目",
                    "current_step": 1,
                    "completed_steps": [],
                    "step_data": {},
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
            },
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

    def _migrate_to_multi_project(self, old_data: dict) -> dict:
        """将旧的单项目数据迁移到多项目结构"""
        default_project_id = str(uuid.uuid4())[:8]
        return {
            "username": old_data.get("username", ""),
            "current_project_id": default_project_id,
            "projects": {
                default_project_id: {
                    "id": default_project_id,
                    "name": "默认项目",
                    "current_step": old_data.get("current_step", 1),
                    "completed_steps": old_data.get("completed_steps", []),
                    "step_data": old_data.get("step_data", {}),
                    "created_at": old_data.get("created_at", datetime.now().isoformat()),
                    "updated_at": old_data.get("updated_at", datetime.now().isoformat())
                }
            },
            "created_at": old_data.get("created_at", datetime.now().isoformat()),
            "updated_at": datetime.now().isoformat()
        }

    def _get_current_project(self, data: dict) -> dict:
        """获取当前项目数据"""
        project_id = data.get("current_project_id")
        if project_id and project_id in data["projects"]:
            return data["projects"][project_id]
        # 回退到第一个项目
        if data["projects"]:
            first_id = list(data["projects"].keys())[0]
            return data["projects"][first_id]
        return None

    def _save_user_data(self, username: str, data: dict):
        """保存用户进度数据"""
        data["updated_at"] = datetime.now().isoformat()
        file_path = self._get_user_file(username)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    # ========== 项目管理方法 ==========

    def get_projects(self, username: str) -> List[dict]:
        """获取用户所有项目列表"""
        data = self._load_user_data(username)
        projects = []
        for project_id, project in data["projects"].items():
            projects.append({
                "id": project_id,
                "name": project.get("name", "未命名项目"),
                "current_step": project.get("current_step", 1),
                "completed_steps": project.get("completed_steps", []),
                "created_at": project.get("created_at"),
                "updated_at": project.get("updated_at"),
                "is_current": project_id == data.get("current_project_id")
            })
        return sorted(projects, key=lambda x: x.get("created_at", ""), reverse=True)

    def get_current_project_id(self, username: str) -> str:
        """获取当前项目ID"""
        data = self._load_user_data(username)
        return data.get("current_project_id", "")

    def create_project(self, username: str, name: str) -> dict:
        """创建新项目"""
        data = self._load_user_data(username)
        project_id = str(uuid.uuid4())[:8]

        new_project = {
            "id": project_id,
            "name": name,
            "current_step": 1,
            "completed_steps": [],
            "step_data": {},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        data["projects"][project_id] = new_project
        data["current_project_id"] = project_id  # 自动切换到新项目
        self._save_user_data(username, data)

        return new_project

    def switch_project(self, username: str, project_id: str) -> bool:
        """切换当前项目"""
        data = self._load_user_data(username)
        if project_id in data["projects"]:
            data["current_project_id"] = project_id
            self._save_user_data(username, data)
            return True
        return False

    def delete_project(self, username: str, project_id: str) -> bool:
        """删除项目"""
        data = self._load_user_data(username)
        if project_id not in data["projects"]:
            return False

        # 不能删除最后一个项目
        if len(data["projects"]) <= 1:
            return False

        del data["projects"][project_id]

        # 如果删除的是当前项目，切换到另一个项目
        if data["current_project_id"] == project_id:
            data["current_project_id"] = list(data["projects"].keys())[0]

        self._save_user_data(username, data)
        return True

    def rename_project(self, username: str, project_id: str, name: str) -> bool:
        """重命名项目"""
        data = self._load_user_data(username)
        if project_id in data["projects"]:
            data["projects"][project_id]["name"] = name
            data["projects"][project_id]["updated_at"] = datetime.now().isoformat()
            self._save_user_data(username, data)
            return True
        return False
    
    # ========== 阶段进度方法（基于当前项目）==========

    def get_user_progress(self, username: str) -> dict:
        """获取用户当前项目的整体进度"""
        data = self._load_user_data(username)
        project = self._get_current_project(data)
        if not project:
            return {
                "current_step": 1,
                "completed_steps": [],
                "step_data": {},
                "current_project_id": "",
                "current_project_name": ""
            }

        return {
            "current_step": project.get("current_step", 1),
            "completed_steps": project.get("completed_steps", []),
            "step_data": project.get("step_data", {}),
            "current_project_id": data.get("current_project_id", ""),
            "current_project_name": project.get("name", "默认项目")
        }

    def get_step_data(self, username: str, form_id: int) -> Optional[dict]:
        """获取用户当前项目某个阶段的数据"""
        data = self._load_user_data(username)
        project = self._get_current_project(data)
        if not project:
            return None
        return project.get("step_data", {}).get(str(form_id))

    def save_step_data(self, username: str, form_id: int, extracted_fields: dict,
                       chat_history: list, is_confirmed: bool = False):
        """保存阶段数据到当前项目"""
        data = self._load_user_data(username)
        project = self._get_current_project(data)
        if not project:
            return

        project_id = data.get("current_project_id")
        step_key = str(form_id)

        if "step_data" not in data["projects"][project_id]:
            data["projects"][project_id]["step_data"] = {}

        data["projects"][project_id]["step_data"][step_key] = {
            "form_id": form_id,
            "extracted_fields": extracted_fields,
            "chat_history": chat_history,
            "is_confirmed": is_confirmed,
            "updated_at": datetime.now().isoformat()
        }

        data["projects"][project_id]["updated_at"] = datetime.now().isoformat()
        self._save_user_data(username, data)

    def confirm_step(self, username: str, form_id: int, summary: str) -> bool:
        """确认完成某个阶段，解锁下一阶段（当前项目）"""
        data = self._load_user_data(username)
        project = self._get_current_project(data)
        if not project:
            return False

        project_id = data.get("current_project_id")
        step_key = str(form_id)

        # 检查该阶段是否已有数据
        if step_key not in project.get("step_data", {}):
            return False

        # 更新阶段数据
        data["projects"][project_id]["step_data"][step_key]["is_confirmed"] = True
        data["projects"][project_id]["step_data"][step_key]["summary"] = summary
        data["projects"][project_id]["step_data"][step_key]["confirmed_at"] = datetime.now().isoformat()

        # 添加到已完成列表
        if "completed_steps" not in data["projects"][project_id]:
            data["projects"][project_id]["completed_steps"] = []
        if form_id not in data["projects"][project_id]["completed_steps"]:
            data["projects"][project_id]["completed_steps"].append(form_id)

        # 解锁下一阶段
        current_step = data["projects"][project_id].get("current_step", 1)
        if form_id >= current_step:
            data["projects"][project_id]["current_step"] = form_id + 1

        data["projects"][project_id]["updated_at"] = datetime.now().isoformat()
        self._save_user_data(username, data)
        return True

    def can_access_step(self, username: str, form_id: int) -> bool:
        """检查用户是否可以访问当前项目的某个阶段"""
        data = self._load_user_data(username)
        project = self._get_current_project(data)
        if not project:
            return form_id == 1
        return form_id <= project.get("current_step", 1)

    def get_previous_summaries(self, username: str, current_form_id: int) -> List[dict]:
        """获取当前项目中当前阶段之前所有已完成阶段的总结"""
        data = self._load_user_data(username)
        project = self._get_current_project(data)
        if not project:
            return []

        summaries = []
        completed_steps = project.get("completed_steps", [])
        step_data = project.get("step_data", {})

        for form_id in sorted(completed_steps):
            if form_id < current_form_id:
                step = step_data.get(str(form_id))
                if step and step.get("is_confirmed"):
                    summaries.append({
                        "form_id": form_id,
                        "summary": step.get("summary", ""),
                        "extracted_fields": step.get("extracted_fields", {})
                    })

        return summaries

    def reset_step(self, username: str, form_id: int):
        """重置当前项目某个阶段的数据（仅允许重置未确认的阶段）"""
        data = self._load_user_data(username)
        project = self._get_current_project(data)
        if not project:
            return

        project_id = data.get("current_project_id")
        step_key = str(form_id)
        step_data = project.get("step_data", {})

        if step_key in step_data:
            # 只清除未确认的数据
            if not step_data[step_key].get("is_confirmed"):
                del data["projects"][project_id]["step_data"][step_key]
                self._save_user_data(username, data)

    def save_test_state(self, username: str, form_id: int, is_in_test: bool = False,
                        test_passed: bool = False, test_chat_history: list = None,
                        test_credential: str = ""):
        """保存当前项目的测试状态"""
        data = self._load_user_data(username)
        project = self._get_current_project(data)
        if not project:
            return

        project_id = data.get("current_project_id")
        step_key = str(form_id)

        if "step_data" not in data["projects"][project_id]:
            data["projects"][project_id]["step_data"] = {}
        if step_key not in data["projects"][project_id]["step_data"]:
            data["projects"][project_id]["step_data"][step_key] = {}

        data["projects"][project_id]["step_data"][step_key]["test_state"] = {
            "is_in_test": is_in_test,
            "test_passed": test_passed,
            "test_chat_history": test_chat_history or [],
            "test_credential": test_credential,
            "updated_at": datetime.now().isoformat()
        }

        self._save_user_data(username, data)

    def get_test_state(self, username: str, form_id: int) -> Optional[dict]:
        """获取当前项目的测试状态"""
        data = self._load_user_data(username)
        project = self._get_current_project(data)
        if not project:
            return None

        step_key = str(form_id)
        step_data = project.get("step_data", {}).get(step_key)
        if step_data:
            return step_data.get("test_state")
        return None

# 单例
progress_service = ProgressService()
