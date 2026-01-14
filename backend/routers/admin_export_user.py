"""
单个用户导出功能 - 三列格式
"""
import csv
import io
import json
from datetime import datetime
from pathlib import Path
from fastapi import HTTPException
from fastapi.responses import StreamingResponse


def export_single_user_csv(username: str, data_dir: Path):
    """导出单个用户的对话记录为CSV文件（三列格式：角色、内容、用户名）"""

    progress_dir = data_dir / "user_progress"
    users_file = data_dir / "users.json"

    # 获取用户基本信息
    users_data = {}
    if users_file.exists():
        with open(users_file, "r", encoding="utf-8") as f:
            users_data = json.load(f)

    if username not in users_data:
        # 检查是否有进度文件
        progress_file = progress_dir / f"{username}.json"
        if not progress_file.exists():
            raise HTTPException(status_code=404, detail="用户不存在")

    user_rows = []

    # 获取进度信息
    progress_file = progress_dir / f"{username}.json"
    if progress_file.exists():
        try:
            with open(progress_file, "r", encoding="utf-8") as pf:
                data = json.load(pf)

                # 兼容新旧两种数据格式
                current_project_id = data.get("current_project_id")
                if current_project_id and "projects" in data:
                    # 新格式：有项目管理，导出所有项目
                    for project_id, project in data["projects"].items():
                        # 各阶段数据
                        step_data = project.get("step_data", {})
                        for step_id, step_info in step_data.items():
                            # 聊天记录
                            chat_history = step_info.get("chat_history", [])
                            if chat_history:
                                for msg in chat_history:
                                    role = "学生" if msg.get("role") == "user" else "AI"
                                    content = msg.get("content", "")
                                    if content:
                                        user_rows.append({
                                            "角色": role,
                                            "内容": content,
                                            "用户名": username
                                        })

                            # 测试对话
                            test_state = step_info.get("test_state", {})
                            if test_state:
                                test_chat = test_state.get("test_chat_history", [])
                                if test_chat:
                                    for msg in test_chat:
                                        role = "学生" if msg.get("role") == "user" else "AI"
                                        content = msg.get("content", "")
                                        if content:
                                            user_rows.append({
                                                "角色": role,
                                                "内容": content,
                                                "用户名": username
                                            })
                else:
                    # 旧格式：无项目管理
                    step_data = data.get("step_data", )
                    for step_id, step_info in step_data.items():
                        # 聊天记录
                        chat_history = step_info.get("chat_history", [])
                        if chat_history:
                            for msg in chat_history:
                                role = "学生" if msg.get("role") == "user" else "AI"
                                content = msg.get("content", "")
                                if content:
                                    user_rows.append({
                                        "角色": role,
                                        "内容": content,
                                        "用户名": username
                                    })

                        # 测试对话
                        test_state = step_info.get("test_state", {})
                        if test_state:
                            test_chat = test_state.get("test_chat_history", [])
                            if test_chat:
                                for msg in test_chat:
                                    role = "学生" if msg.get("role") == "user" else "AI"
                                    content = msg.get("content", "")
                                    if content:
                                        user_rows.append({
                                            "角色": role,
                                            "内容": content,
                                            "用户名": username
                                        })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"读取用户数据失败: {str(e)}")

    # 生成CSV（三列格式）
    output = io.StringIO()
    fieldnames = ["角色", "内容", "用户名"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in user_rows:
        writer.writerow(row)

    # 添加UTF-8 BOM并转换为bytes
    output.seek(0)
    csv_content = '\ufeff' + output.getvalue()
    csv_bytes = csv_content.encode('utf-8')

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"user_{username}_{timestamp}.csv"

    return StreamingResponse(
        iter([csv_bytes]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
