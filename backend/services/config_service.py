"""
配置服务 - Supabase 版本
处理表单配置、API配置等
"""

from typing import Optional, Dict, Any, List
import json
from .supabase_client import get_supabase

class ConfigService:
    """配置服务类"""

    @staticmethod
    def get_form_configs() -> List[Dict[str, Any]]:
        """获取所有表单配置"""
        supabase = get_supabase()

        result = supabase.table('form_configs').select('*').order('sort_order').execute()

        # 解析 JSON 字段
        for config in result.data:
            config['fields'] = json.loads(config['fields']) if isinstance(config['fields'], str) else config['fields']

        return result.data

    @staticmethod
    def get_form_config_by_id(form_id: int) -> Optional[Dict[str, Any]]:
        """根据 ID 获取表单配置"""
        supabase = get_supabase()

        result = supabase.table('form_configs').select('*').eq('id', form_id).execute()

        if result.data:
            config = result.data[0]
            config['fields'] = json.loads(config['fields']) if isinstance(config['fields'], str) else config['fields']
            return config

        return None

    @staticmethod
    def update_form_config(form_id: int, config_data: Dict[str, Any]) -> bool:
        """更新表单配置"""
        supabase = get_supabase()

        update_data = {
            'name': config_data.get('name'),
            'description': config_data.get('description'),
            'user_description': config_data.get('user_description'),
            'fields': json.dumps(config_data.get('fields', [])),
            'extraction_prompt': config_data.get('extraction_prompt'),
            'test_enabled': config_data.get('test_enabled', False),
            'test_prompt': config_data.get('test_prompt'),
            'test_pass_pattern': config_data.get('test_pass_pattern'),
        }

        result = supabase.table('form_configs').update(update_data).eq('id', form_id).execute()
        return len(result.data) > 0

    @staticmethod
    def get_api_config(config_key: str) -> Optional[str]:
        """获取 API 配置值"""
        supabase = get_supabase()

        result = supabase.table('api_configs').select('config_value').eq('config_key', config_key).execute()
        return result.data[0]['config_value'] if result.data else None

    @staticmethod
    def get_all_api_configs() -> Dict[str, str]:
        """获取所有 API 配置"""
        supabase = get_supabase()

        result = supabase.table('api_configs').select('*').execute()
        return {item['config_key']: item['config_value'] for item in result.data}

    @staticmethod
    def update_api_config(config_key: str, config_value: str) -> bool:
        """更新 API 配置"""
        supabase = get_supabase()

        result = supabase.table('api_configs').upsert({
            'config_key': config_key,
            'config_value': config_value
        }, on_conflict='config_key').execute()

        return len(result.data) > 0

    @staticmethod
    def get_active_pipeline() -> Optional[Dict[str, Any]]:
        """获取当前激活的 Pipeline"""
        supabase = get_supabase()

        result = supabase.table('pipeline_configs').select('*').eq('is_active', True).execute()

        if result.data:
            pipeline = result.data[0]
            pipeline['config'] = json.loads(pipeline['config']) if isinstance(pipeline['config'], str) else pipeline['config']
            return pipeline

        return None

    @staticmethod
    def set_active_pipeline(pipeline_id: str) -> bool:
        """设置激活的 Pipeline"""
        supabase = get_supabase()

        # 先将所有 pipeline 设为非激活
        supabase.table('pipeline_configs').update({'is_active': False}).neq('pipeline_id', '').execute()

        # 激活指定的 pipeline
        result = supabase.table('pipeline_configs').update({'is_active': True}).eq('pipeline_id', pipeline_id).execute()

        return len(result.data) > 0
