"""
项目服务 - Supabase 版本
处理用户项目和进度相关的数据库操作
"""

from typing import Optional, Dict, Any, List
import json
from .supabase_client import get_supabase

class ProjectService:
    """项目服务类"""

    @staticmethod
    def create_project(user_id: str, project_id: str, name: str = "默认项目") -> Dict[str, Any]:
        """创建新项目"""
        supabase = get_supabase()

        project_data = {
            'user_id': user_id,
            'project_id': project_id,
            'name': name,
            'current_step': 1,
            'completed_steps': []
        }

        result = supabase.table('user_projects').insert(project_data).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def get_user_projects(user_id: str) -> List[Dict[str, Any]]:
        """获取用户的所有项目"""
        supabase = get_supabase()

        result = supabase.table('user_projects').select('*').eq('user_id', user_id).execute()
        return result.data

    @staticmethod
    def get_project(user_id: str, project_id: str) -> Optional[Dict[str, Any]]:
        """获取特定项目"""
        supabase = get_supabase()

        result = supabase.table('user_projects').select('*').eq('user_id', user_id).eq('project_id', project_id).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def update_project_step(project_uuid: str, current_step: int, completed_steps: List[int]) -> bool:
        """更新项目步骤"""
        supabase = get_supabase()

        result = supabase.table('user_projects').update({
            'current_step': current_step,
            'completed_steps': completed_steps
        }).eq('id', project_uuid).execute()

        return len(result.data) > 0

    @staticmethod
    def save_step_data(project_uuid: str, step_number: int, form_id: int,
                      extracted_fields: Dict, chat_history: List) -> Dict[str, Any]:
        """保存步骤数据"""
        supabase = get_supabase()

        step_data = {
            'project_uuid': project_uuid,
            'step_number': step_number,
            'form_id': form_id,
            'extracted_fields': json.dumps(extracted_fields),
            'chat_history': json.dumps(chat_history)
        }

        result = supabase.table('project_step_data').upsert(
            step_data,
            on_conflict='project_uuid,step_number'
        ).execute()

        return result.data[0] if result.data else None

    @staticmethod
    def get_step_data(project_uuid: str, step_number: int) -> Optional[Dict[str, Any]]:
        """获取步骤数据"""
        supabase = get_supabase()

        result = supabase.table('project_step_data').select('*').eq('project_uuid', project_uuid).eq('step_number', step_number).execute()

        if result.data:
            data = result.data[0]
            # 解析 JSON 字段
            data['extracted_fields'] = json.loads(data['extracted_fields']) if isinstance(data['extracted_fields'], str) else data['extracted_fields']
            data['chat_history'] = json.loads(data['chat_history']) if isinstance(data['chat_history'], str) else data['chat_history']
            return data

        return None

    @staticmethod
    def get_all_step_data(project_uuid: str) -> List[Dict[str, Any]]:
        """获取项目的所有步骤数据"""
        supabase = get_supabase()

        result = supabase.table('project_step_data').select('*').eq('project_uuid', project_uuid).order('step_number').execute()

        # 解析 JSON 字段
        for data in result.data:
            data['extracted_fields'] = json.loads(data['extracted_fields']) if isinstance(data['extracted_fields'], str) else data['extracted_fields']
            data['chat_history'] = json.loads(data['chat_history']) if isinstance(data['chat_history'], str) else data['chat_history']

        return result.data
