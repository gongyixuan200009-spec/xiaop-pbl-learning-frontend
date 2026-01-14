"""
验证数据迁移是否成功
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.supabase_client import supabase

def verify_migration():
    """验证迁移结果"""
    print("=" * 60)
    print("开始验证数据迁移...")
    print("=" * 60)

    try:
        # 1. 验证用户数据
        print("\n1. 验证用户数据...")
        users_result = supabase.table('users').select('id, username, grade, gender').execute()
        print(f"   ✓ 用户总数: {len(users_result.data)}")
        if users_result.data:
            print(f"   ✓ 示例用户: {users_result.data[0]['username']}")
            print(f"     - 年级: {users_result.data[0].get('grade', 'N/A')}")
            print(f"     - 性别: {users_result.data[0].get('gender', 'N/A')}")

        # 2. 验证项目数据
        print("\n2. 验证项目数据...")
        projects_result = supabase.table('user_projects').select('id, project_name, current_step, completed_steps').execute()
        print(f"   ✓ 项目总数: {len(projects_result.data)}")
        if projects_result.data:
            project = projects_result.data[0]
            print(f"   ✓ 示例项目: {project['project_name']}")
            print(f"     - 当前步骤: {project.get('current_step', 'N/A')}")
            print(f"     - 已完成步骤: {project.get('completed_steps', [])}")

        # 3. 验证步骤数据
        print("\n3. 验证步骤数据...")
        steps_result = supabase.table('project_step_data').select('id, step_number, form_id, is_confirmed').execute()
        print(f"   ✓ 步骤总数: {len(steps_result.data)}")
        if steps_result.data:
            step = steps_result.data[0]
            print(f"   ✓ 示例步骤: 步骤 {step['step_number']}")
            print(f"     - 表单ID: {step.get('form_id', 'N/A')}")
            print(f"     - 已确认: {step.get('is_confirmed', False)}")

        # 4. 验证聊天历史
        print("\n4. 验证聊天历史...")
        chat_result = supabase.table('chat_messages').select('id, role, content').execute()
        print(f"   ✓ 聊天消息总数: {len(chat_result.data)}")
        if chat_result.data:
            msg = chat_result.data[0]
            print(f"   ✓ 示例消息: {msg['role']}")
            content_preview = msg['content'][:50] if msg['content'] else ''
            print(f"     - 内容预览: {content_preview}...")

        # 5. 验证用户-项目关联
        print("\n5. 验证用户-项目关联...")
        user_project_query = """
        SELECT u.username, up.project_name, up.current_step
        FROM users u
        JOIN user_projects up ON u.id = up.user_id
        LIMIT 3
        """
        # 使用 rpc 或直接查询
        users_with_projects = supabase.table('users').select('username, user_projects(project_name, current_step)').limit(3).execute()
        if users_with_projects.data:
            print(f"   ✓ 找到 {len(users_with_projects.data)} 个用户及其项目")
            for user in users_with_projects.data:
                projects = user.get('user_projects', [])
                if projects:
                    print(f"     - {user['username']}: {len(projects)} 个项目")

        print("\n" + "=" * 60)
        print("✓ 数据迁移验证完成！")
        print("=" * 60)

        return True

    except Exception as e:
        print(f"\n❌ 验证失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    verify_migration()
