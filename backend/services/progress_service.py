"""用户进度管理服务 - 保存和管理每个用户的阶段进度"""
import json
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
        """加载用户进度数据"""
        file_path = self._get_user_file(username)
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "username": username,
            "current_step": 1,  # 当前可访问的最高阶段
            "completed_steps": [],  # 已完成并确认的阶段
            "step_data": {},  # 每个阶段的数据 {form_id: {extracted_fields, chat_history, summary}}
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    
    def _save_user_data(self, username: str, data: dict):
        """保存用户进度数据"""
        data["updated_at"] = datetime.now().isoformat()
        file_path = self._get_user_file(username)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def get_user_progress(self, username: str) -> dict:
        """获取用户整体进度"""
        return self._load_user_data(username)
    
    def get_step_data(self, username: str, form_id: int) -> Optional[dict]:
        """获取用户某个阶段的数据"""
        data = self._load_user_data(username)
        return data["step_data"].get(str(form_id))
    
    def save_step_data(self, username: str, form_id: int, extracted_fields: dict, 
                       chat_history: list, is_confirmed: bool = False):
        """保存阶段数据"""
        data = self._load_user_data(username)
        
        step_key = str(form_id)
        data["step_data"][step_key] = {
            "form_id": form_id,
            "extracted_fields": extracted_fields,
            "chat_history": chat_history,
            "is_confirmed": is_confirmed,
            "updated_at": datetime.now().isoformat()
        }
        
        self._save_user_data(username, data)
    
    def confirm_step(self, username: str, form_id: int, summary: str) -> bool:
        """确认完成某个阶段，解锁下一阶段"""
        data = self._load_user_data(username)
        step_key = str(form_id)
        
        # 检查该阶段是否已有数据
        if step_key not in data["step_data"]:
            return False
        
        # 更新阶段数据
        data["step_data"][step_key]["is_confirmed"] = True
        data["step_data"][step_key]["summary"] = summary
        data["step_data"][step_key]["confirmed_at"] = datetime.now().isoformat()
        
        # 添加到已完成列表
        if form_id not in data["completed_steps"]:
            data["completed_steps"].append(form_id)
        
        # 解锁下一阶段
        if form_id >= data["current_step"]:
            data["current_step"] = form_id + 1
        
        self._save_user_data(username, data)
        return True
    
    def can_access_step(self, username: str, form_id: int) -> bool:
        """检查用户是否可以访问某个阶段"""
        data = self._load_user_data(username)
        return form_id <= data["current_step"]
    
    def get_previous_summaries(self, username: str, current_form_id: int) -> List[dict]:
        """获取当前阶段之前所有已完成阶段的总结"""
        data = self._load_user_data(username)
        summaries = []
        
        for form_id in sorted(data["completed_steps"]):
            if form_id < current_form_id:
                step_data = data["step_data"].get(str(form_id))
                if step_data and step_data.get("is_confirmed"):
                    summaries.append({
                        "form_id": form_id,
                        "summary": step_data.get("summary", ""),
                        "extracted_fields": step_data.get("extracted_fields", {})
                    })
        
        return summaries
    
    def reset_step(self, username: str, form_id: int):
        """重置某个阶段的数据（仅允许重置当前阶段）"""
        data = self._load_user_data(username)
        step_key = str(form_id)
        
        if step_key in data["step_data"]:
            # 只清除未确认的数据
            if not data["step_data"][step_key].get("is_confirmed"):
                del data["step_data"][step_key]
                self._save_user_data(username, data)

# 单例
progress_service = ProgressService()
