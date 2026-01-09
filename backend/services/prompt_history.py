"""
Prompt 修改历史记录服务
记录每次 prompt 修改，支持历史版本追踪和回滚
"""

import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

# 历史记录存储路径
DATA_DIR = Path(__file__).parent.parent / "data"
HISTORY_FILE = DATA_DIR / "prompt_history.json"

# 最大历史记录数量
MAX_HISTORY_RECORDS = 100


def _load_history() -> List[Dict[str, Any]]:
    """加载历史记录"""
    if not HISTORY_FILE.exists():
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def _save_history(history: List[Dict[str, Any]]) -> None:
    """保存历史记录"""
    # 确保目录存在
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)

    # 限制历史记录数量
    if len(history) > MAX_HISTORY_RECORDS:
        history = history[-MAX_HISTORY_RECORDS:]

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def add_history_record(
    record_type: str,
    identifier: str,
    content: Dict[str, Any],
    description: str = "",
    operator: str = "admin"
) -> Dict[str, Any]:
    """
    添加历史记录

    Args:
        record_type: 记录类型 ("form_config" | "age_adaptation" | "extraction_rules")
        identifier: 标识符 (表单ID 或 年龄段名称)
        content: 修改的内容
        description: 修改描述
        operator: 操作者

    Returns:
        新创建的历史记录
    """
    history = _load_history()

    record = {
        "id": len(history) + 1,
        "timestamp": datetime.now().isoformat(),
        "type": record_type,
        "identifier": identifier,
        "content": content,
        "description": description,
        "operator": operator,
    }

    history.append(record)
    _save_history(history)

    return record


def get_history(
    record_type: Optional[str] = None,
    identifier: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> Dict[str, Any]:
    """
    获取历史记录

    Args:
        record_type: 筛选类型
        identifier: 筛选标识符
        limit: 返回数量限制
        offset: 偏移量

    Returns:
        包含历史记录和分页信息的字典
    """
    history = _load_history()

    # 筛选
    if record_type:
        history = [r for r in history if r.get("type") == record_type]
    if identifier:
        history = [r for r in history if r.get("identifier") == identifier]

    # 按时间倒序排列
    history = sorted(history, key=lambda x: x.get("timestamp", ""), reverse=True)

    # 分页
    total = len(history)
    history = history[offset:offset + limit]

    return {
        "records": history,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def get_history_record(record_id: int) -> Optional[Dict[str, Any]]:
    """
    获取单条历史记录

    Args:
        record_id: 记录ID

    Returns:
        历史记录或 None
    """
    history = _load_history()
    for record in history:
        if record.get("id") == record_id:
            return record
    return None


def get_history_types() -> List[Dict[str, str]]:
    """获取所有记录类型"""
    return [
        {"value": "form_config", "label": "表单配置"},
        {"value": "age_adaptation", "label": "年龄段适配规则"},
        {"value": "extraction_rules", "label": "字段提取规则"},
        {"value": "test_config", "label": "关卡测试配置"},
    ]


def clear_history(before_date: Optional[str] = None) -> int:
    """
    清理历史记录

    Args:
        before_date: 清理此日期之前的记录 (ISO格式)

    Returns:
        清理的记录数量
    """
    history = _load_history()
    original_count = len(history)

    if before_date:
        history = [r for r in history if r.get("timestamp", "") >= before_date]
    else:
        history = []

    _save_history(history)
    return original_count - len(history)


# 便捷函数：记录表单配置修改
def record_form_config_change(
    form_id: str,
    form_name: str,
    changes: Dict[str, Any],
    description: str = ""
) -> Dict[str, Any]:
    """记录表单配置修改"""
    return add_history_record(
        record_type="form_config",
        identifier=f"{form_id}:{form_name}",
        content=changes,
        description=description or f"修改表单 '{form_name}' 配置"
    )


# 便捷函数：记录年龄段规则修改
def record_age_adaptation_change(
    age_group: str,
    rules: Dict[str, Any],
    description: str = ""
) -> Dict[str, Any]:
    """记录年龄段适配规则修改"""
    return add_history_record(
        record_type="age_adaptation",
        identifier=age_group,
        content=rules,
        description=description or f"修改 '{age_group}' 年龄段适配规则"
    )


# 便捷函数：记录提取规则修改
def record_extraction_rules_change(
    form_id: str,
    form_name: str,
    rules: str,
    description: str = ""
) -> Dict[str, Any]:
    """记录字段提取规则修改"""
    return add_history_record(
        record_type="extraction_rules",
        identifier=f"{form_id}:{form_name}",
        content={"extraction_prompt": rules},
        description=description or f"修改表单 '{form_name}' 提取规则"
    )


# 便捷函数：记录关卡测试配置修改
def record_test_config_change(
    form_id: str,
    form_name: str,
    test_config: Dict[str, Any],
    description: str = ""
) -> Dict[str, Any]:
    """记录关卡测试配置修改"""
    return add_history_record(
        record_type="test_config",
        identifier=f"{form_id}:{form_name}",
        content=test_config,
        description=description or f"修改表单 '{form_name}' 关卡测试配置"
    )
