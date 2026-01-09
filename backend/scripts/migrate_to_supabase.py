"""
工小助学习助手 - 数据迁移工具
将 JSON 文件数据迁移到 Supabase PostgreSQL 数据库

使用方法:
1. 安装依赖: pip install supabase python-dotenv
2. 配置环境变量 (.env 文件)
3. 运行: python migrate_to_supabase.py
"""

import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# Supabase 配置
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # 使用 service_role_key 绕过 RLS

# 数据目录
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"

def get_supabase_client() -> Client:
    """创建 Supabase 客户端"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("请设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def migrate_users(supabase: Client):
    """迁移用户数据"""
    print("\n=== 迁移用户数据 ===")

    users_file = DATA_DIR / "users.json"
    if not users_file.exists():
        print("⚠️  users.json 文件不存在")
        return

    with open(users_file, 'r', encoding='utf-8') as f:
        users_data = json.load(f)

    for username, user_info in users_data.items():
        try:
            profile = user_info.get('profile', {})
            user_record = {
                'username': username,
                'password_hash': user_info.get('password_hash'),
                'grade': profile.get('grade'),
                'gender': profile.get('gender'),
                'math_score': profile.get('math_score'),
                'science_feeling': profile.get('science_feeling'),
                'created_at': user_info.get('created_at'),
            }

            # 插入或更新用户
            result = supabase.table('users').upsert(
                user_record,
                on_conflict='username'
            ).execute()

            print(f"✅ 迁移用户: {username}")
        except Exception as e:
            print(f"❌ 迁移用户 {username} 失败: {str(e)}")

def migrate_form_configs(supabase: Client):
    """迁移表单配置"""
    print("\n=== 迁移表单配置 ===")

    form_config_file = DATA_DIR / "form_config.json"
    if not form_config_file.exists():
        print("⚠️  form_config.json 文件不存在")
        return

    with open(form_config_file, 'r', encoding='utf-8') as f:
        form_data = json.load(f)

    for form in form_data.get('forms', []):
        try:
            form_record = {
                'id': form.get('id'),
                'name': form.get('name'),
                'description': form.get('description'),
                'user_description': form.get('user_description'),
                'fields': json.dumps(form.get('fields', [])),
                'extraction_prompt': form.get('extraction_prompt'),
                'test_enabled': form.get('test_enabled', False),
                'test_prompt': form.get('test_prompt'),
                'test_pass_pattern': form.get('test_pass_pattern'),
                'sort_order': form.get('id'),
            }

            result = supabase.table('form_configs').upsert(
                form_record,
                on_conflict='id'
            ).execute()

            print(f"✅ 迁移表单配置: {form.get('name')}")
        except Exception as e:
            print(f"❌ 迁移表单配置失败: {str(e)}")

def migrate_api_configs(supabase: Client):
    """迁移 API 配置"""
    print("\n=== 迁移 API 配置 ===")

    api_config_file = DATA_DIR / "api_key_config.json"
    if not api_config_file.exists():
        print("⚠️  api_key_config.json 文件不存在")
        return

    with open(api_config_file, 'r', encoding='utf-8') as f:
        api_data = json.load(f)

    config_mappings = [
        ('api_key', api_data.get('api_key')),
        ('api_endpoint', api_data.get('api_endpoint')),
        ('default_model', api_data.get('default_model')),
        ('fast_model', api_data.get('fast_model')),
        ('vision_model', api_data.get('vision_model')),
        ('vision_model_enabled', str(api_data.get('vision_model_enabled'))),
        ('chat_mode', api_data.get('chat_mode')),
        ('debug_mode', str(api_data.get('debug_mode'))),
    ]

    for config_key, config_value in config_mappings:
        try:
            if config_value is not None:
                result = supabase.table('api_configs').upsert({
                    'config_key': config_key,
                    'config_value': config_value
                }, on_conflict='config_key').execute()

                print(f"✅ 迁移 API 配置: {config_key}")
        except Exception as e:
            print(f"❌ 迁移 API 配置 {config_key} 失败: {str(e)}")

def migrate_pipeline_configs(supabase: Client):
    """迁移 Pipeline 配置"""
    print("\n=== 迁移 Pipeline 配置 ===")

    pipeline_file = DATA_DIR / "pipelines.json"
    if not pipeline_file.exists():
        print("⚠️  pipelines.json 文件不存在")
        return

    with open(pipeline_file, 'r', encoding='utf-8') as f:
        pipeline_data = json.load(f)

    active_pipeline = pipeline_data.get('active_pipeline', 'single_agent')

    for pipeline in pipeline_data.get('pipelines', []):
        try:
            pipeline_record = {
                'pipeline_id': pipeline.get('id', pipeline.get('pipeline_id')),
                'name': pipeline.get('name', 'Unnamed Pipeline'),
                'description': pipeline.get('description'),
                'config': json.dumps(pipeline),
                'is_active': pipeline.get('id', pipeline.get('pipeline_id')) == active_pipeline
            }

            result = supabase.table('pipeline_configs').upsert(
                pipeline_record,
                on_conflict='pipeline_id'
            ).execute()

            print(f"✅ 迁移 Pipeline: {pipeline_record['name']}")
        except Exception as e:
            print(f"❌ 迁移 Pipeline 失败: {str(e)}")

def migrate_user_progress(supabase: Client):
    """迁移用户进度数据"""
    print("\n=== 迁移用户进度数据 ===")

    progress_dir = DATA_DIR / "user_progress"
    if not progress_dir.exists():
        print("⚠️  user_progress 目录不存在")
        return

    # 首先获取所有用户的 UUID 映射
    users_result = supabase.table('users').select('id, username').execute()
    user_uuid_map = {user['username']: user['id'] for user in users_result.data}

    for progress_file in progress_dir.glob('*.json'):
        username = progress_file.stem

        if username not in user_uuid_map:
            print(f"⚠️  用户 {username} 在数据库中不存在,跳过")
            continue

        user_id = user_uuid_map[username]

        try:
            with open(progress_file, 'r', encoding='utf-8') as f:
                progress_data = json.load(f)

            # 迁移用户的所有项目
            for project_id, project_data in progress_data.get('projects', {}).items():
                # 创建项目记录
                project_record = {
                    'user_id': user_id,
                    'project_id': project_id,
                    'name': project_data.get('name', '默认项目'),
                    'current_step': project_data.get('current_step', 1),
                    'completed_steps': project_data.get('completed_steps', []),
                }

                project_result = supabase.table('user_projects').upsert(
                    project_record,
                    on_conflict='user_id,project_id'
                ).execute()

                project_uuid = project_result.data[0]['id']

                # 迁移项目的步骤数据
                for step_num, step_data in project_data.get('step_data', {}).items():
                    step_record = {
                        'project_uuid': project_uuid,
                        'step_number': int(step_num),
                        'form_id': step_data.get('form_id'),
                        'extracted_fields': json.dumps(step_data.get('extracted_fields', {})),
                        'chat_history': json.dumps(step_data.get('chat_history', [])),
                    }

                    supabase.table('project_step_data').upsert(
                        step_record,
                        on_conflict='project_uuid,step_number'
                    ).execute()

                print(f"✅ 迁移用户 {username} 的项目 {project_id}")
        except Exception as e:
            print(f"❌ 迁移用户 {username} 的进度失败: {str(e)}")

def migrate_prompt_history(supabase: Client):
    """迁移提示词历史"""
    print("\n=== 迁移提示词历史 ===")

    history_file = DATA_DIR / "prompt_history.json"
    if not history_file.exists():
        print("⚠️  prompt_history.json 文件不存在")
        return

    with open(history_file, 'r', encoding='utf-8') as f:
        history_data = json.load(f)

    for record in history_data:
        try:
            history_record = {
                'id': record.get('id'),
                'history_type': record.get('type'),
                'identifier': record.get('identifier'),
                'content': json.dumps(record.get('content', {})),
                'description': record.get('description'),
                'operator': record.get('operator', 'admin'),
                'created_at': record.get('timestamp'),
            }

            supabase.table('prompt_history').upsert(
                history_record,
                on_conflict='id'
            ).execute()

        except Exception as e:
            print(f"❌ 迁移提示词历史记录失败: {str(e)}")

    print(f"✅ 迁移了 {len(history_data)} 条提示词历史记录")

def main():
    """主函数"""
    print("=" * 60)
    print("工小助学习助手 - 数据迁移工具")
    print("=" * 60)

    try:
        # 创建 Supabase 客户端
        supabase = get_supabase_client()
        print(f"✅ 成功连接到 Supabase: {SUPABASE_URL}")

        # 执行迁移
        migrate_users(supabase)
        migrate_form_configs(supabase)
        migrate_api_configs(supabase)
        migrate_pipeline_configs(supabase)
        migrate_user_progress(supabase)
        migrate_prompt_history(supabase)

        print("\n" + "=" * 60)
        print("✅ 数据迁移完成!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ 迁移过程中出错: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
